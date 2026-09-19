/**
 * routing.js — RaahBar Real-World Data Module
 *
 * Orchestrates 5 free data sources (no billing):
 *  1. Nominatim (OSM)    — Geocode city names to lat/lng
 *  2. OpenRouteService   — Real road distances + intermediate waypoints (ORS free token)
 *  3. Open-Meteo Weather — Live weather + 5-day forecast at destination
 *  4. Open-Meteo Elevation — Real altitude at each day's endpoint
 *  5. Overpass API (OSM)  — Nearby fuel stations + hospitals along route
 *
 * All functions return null on failure — pipeline continues in degraded mode.
 */

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

// ─── 1. Nominatim Geocoding ─────────────────────────────────────────────────
/**
 * Geocode a city/place name to coordinates using Nominatim (OpenStreetMap).
 * No API key required. Rate limit: 1 req/sec (we add delays in the pipeline).
 * @param {string} cityName
 * @returns {Promise<{lat: number, lng: number, displayName: string}|null>}
 */
export async function geocodeLocation(cityName) {
  try {
    const encoded = encodeURIComponent(`${cityName}, Pakistan`);
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=pk`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RaahBar/1.0 (motorcycle-trip-planner; raahbar.pk)',
        'Accept-Language': 'en',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name?.split(',')[0]?.trim() || cityName,
    };
  } catch {
    console.warn(`[routing] Nominatim geocoding failed for "${cityName}"`);
    return null;
  }
}

// ─── 2. OpenRouteService — Real Road Routing ────────────────────────────────
/**
 * Get real road route from ORS (driving-car profile).
 * Splits total distance into daily legs based on requested days.
 * @param {{lat:number, lng:number}} origin
 * @param {{lat:number, lng:number}} destination
 * @param {number} totalDays
 * @returns {Promise<{totalDistanceKm:number, totalDurationHrs:number, dailyLegs:Array}|null>}
 */
export async function getRouteSegments(origin, destination, totalDays) {
  if (!ORS_API_KEY) {
    console.warn('[routing] ORS key missing — skipping real route fetch');
    return null;
  }
  try {
    const body = {
      coordinates: [
        [origin.lng, origin.lat],
        [destination.lng, destination.lat],
      ],
      instructions: false,
      geometry_simplify: true,
    };

    const res = await fetch(
      'https://api.openrouteservice.org/v2/directions/driving-car/json',
      {
        method: 'POST',
        headers: {
          Authorization: ORS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.warn(`[routing] ORS error ${res.status}:`, err);
      return null;
    }

    const data = await res.json();
    const summary = data?.routes?.[0]?.summary;
    if (!summary) return null;

    const totalDistanceKm = Math.round(summary.distance / 1000);
    const totalDurationHrs = Math.round((summary.duration / 3600) * 10) / 10;

    // Distribute total distance evenly across days
    const avgDailyKm = Math.round(totalDistanceKm / totalDays);
    const avgDailyHrs = Math.round((totalDurationHrs / totalDays) * 10) / 10;

    // Extract waypoint coordinates from geometry for elevation lookups
    const waypoints = data?.routes?.[0]?.geometry?.coordinates || [];
    // Sample up to totalDays+1 points evenly from the geometry for elevation
    const sampledPoints = sampleArray(waypoints, totalDays + 1);

    const dailyLegs = Array.from({ length: totalDays }, (_, i) => ({
      dayNumber: i + 1,
      distanceKm: i === totalDays - 1
        ? totalDistanceKm - avgDailyKm * (totalDays - 1) // last day takes remainder
        : avgDailyKm,
      durationHrs: avgDailyHrs,
      // Endpoint coordinate for this day (for elevation + Overpass lookups)
      endCoord: sampledPoints[i + 1]
        ? { lat: sampledPoints[i + 1][1], lng: sampledPoints[i + 1][0] }
        : null,
    }));

    return { totalDistanceKm, totalDurationHrs, dailyLegs };
  } catch (err) {
    console.warn('[routing] ORS fetch exception:', err.message);
    return null;
  }
}

// ─── 3. Open-Meteo Weather ──────────────────────────────────────────────────
/**
 * Fetch current weather + 3-day forecast at destination.
 * Completely free, no API key required.
 * @param {{lat:number, lng:number}} coords
 * @returns {Promise<{tempC:number, condition:string, windKmh:number, precipMm:number, isAlert:boolean, alertText:string}|null>}
 */
export async function getWeather(coords) {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', coords.lat);
    url.searchParams.set('longitude', coords.lng);
    url.searchParams.set('current', 'temperature_2m,precipitation,wind_speed_10m,weather_code');
    url.searchParams.set('daily', 'precipitation_sum,temperature_2m_max,temperature_2m_min');
    url.searchParams.set('forecast_days', '3');
    url.searchParams.set('timezone', 'Asia/Karachi');

    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = await res.json();

    const current = data?.current;
    if (!current) return null;

    const tempC = Math.round(current.temperature_2m);
    const windKmh = Math.round(current.wind_speed_10m);
    const precipMm = Math.round(current.precipitation * 10) / 10;
    const weatherCode = current.weather_code ?? 0;

    const condition = describeWeatherCode(weatherCode);
    const isAlert = weatherCode >= 61; // Rain, snow, storm, thunderstorm codes
    const alertText = isAlert
      ? `Live weather alert: ${condition} at destination (${precipMm}mm precip, winds ${windKmh} km/h). Delay departure or pack rain gear.`
      : null;

    return { tempC, condition, windKmh, precipMm, isAlert, alertText };
  } catch (err) {
    console.warn('[routing] Open-Meteo weather fetch failed:', err.message);
    return null;
  }
}

// ─── 4. Open-Meteo Elevation ────────────────────────────────────────────────
/**
 * Get real altitude (metres) for an array of coordinate points.
 * Uses Open-Meteo elevation API (Copernicus DEM 90m). Free, no key.
 * @param {Array<{lat:number, lng:number}>} coordsArray
 * @returns {Promise<number[]|null>} Array of altitudes in metres, same order as input
 */
export async function getElevations(coordsArray) {
  if (!coordsArray || coordsArray.length === 0) return null;
  try {
    const lats = coordsArray.map((c) => c.lat).join(',');
    const lngs = coordsArray.map((c) => c.lng).join(',');
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`;

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.elevation ?? null;
  } catch (err) {
    console.warn('[routing] Open-Meteo elevation fetch failed:', err.message);
    return null;
  }
}

// ─── 5. Overpass API — Nearby Infrastructure ────────────────────────────────
/**
 * Query OpenStreetMap Overpass API for fuel stations and hospitals within
 * radiusKm of a coordinate point. Free, no key required.
 * @param {{lat:number, lng:number}} coords
 * @param {number} radiusKm  default 25km
 * @returns {Promise<{fuelStations:string[], hospitals:string[]}|null>}
 */
export async function getNearbyInfrastructure(coords, radiusKm = 25) {
  try {
    const r = radiusKm * 1000; // metres
    const query = `
      [out:json][timeout:15];
      (
        node["amenity"="fuel"](around:${r},${coords.lat},${coords.lng});
        node["amenity"="hospital"](around:${r},${coords.lat},${coords.lng});
        node["amenity"="clinic"](around:${r},${coords.lat},${coords.lng});
        node["shop"="motorcycle"](around:${r},${coords.lat},${coords.lng});
      );
      out body;
    `;

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const elements = data?.elements ?? [];

    const fuelStations = elements
      .filter((e) => e.tags?.amenity === 'fuel')
      .map((e) => e.tags?.name || e.tags?.brand || 'Petrol Station')
      .filter((name, i, arr) => arr.indexOf(name) === i) // deduplicate
      .slice(0, 3);

    const hospitals = elements
      .filter((e) => ['hospital', 'clinic'].includes(e.tags?.amenity))
      .map((e) => e.tags?.name || 'Hospital/Clinic')
      .filter((name, i, arr) => arr.indexOf(name) === i)
      .slice(0, 2);

    return { fuelStations, hospitals };
  } catch (err) {
    console.warn('[routing] Overpass fetch failed:', err.message);
    return null;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Sample n evenly-spaced items from an array.
 */
function sampleArray(arr, n) {
  if (!arr || arr.length === 0) return [];
  if (arr.length <= n) return arr;
  const result = [];
  const step = (arr.length - 1) / (n - 1);
  for (let i = 0; i < n; i++) {
    result.push(arr[Math.round(i * step)]);
  }
  return result;
}

/**
 * Convert Open-Meteo WMO weather code to a human-readable condition string.
 * https://open-meteo.com/en/docs#weathervariables
 */
function describeWeatherCode(code) {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 9) return 'Fog / haze';
  if (code <= 19) return 'Light drizzle';
  if (code <= 29) return 'Thunderstorm (nearby)';
  if (code <= 39) return 'Dust / sandstorm';
  if (code <= 49) return 'Fog';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rain';
  if (code <= 79) return 'Snow';
  if (code <= 84) return 'Rain showers';
  if (code <= 94) return 'Snow showers';
  return 'Thunderstorm';
}
