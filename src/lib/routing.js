/**
 * routing.js — RaahBar Hybrid Verified + Dynamic Live Data Module
 *
 * Orchestrates 5 free data sources (zero billing):
 *  1. Verified Pakistan Rider Hubs + OSM Nominatim — Accurate city/valley geocoding & autocomplete
 *  2. OpenRouteService GeoJSON — Real highway corridors, motorway avoidance & clean road names
 *  3. Open-Meteo Weather       — Live weather + 3-day forecast at destination
 *  4. Open-Meteo Elevation     — Real Copernicus DEM 90m altitude profile along route
 *  5. Overpass API (OSM)       — Fast single-batch node query (<3s) for en-route towns, lakes,
 *                                viewpoints, waterfalls, passes, fuel & hospitals
 */

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

// ─── Verified Pakistani Cities, Northern Valleys & Mountain Passes ───────────
// Prevents ambiguous Nominatim matches (e.g., "Naran" -> Naran jo Khario in Sindh)
// while keeping full live Nominatim fallback for any custom town outside this list.
export const VERIFIED_PAKISTAN_HUBS = [
  // Major Departure Cities
  { name: 'Islamabad', region: 'Islamabad Capital Territory', lat: 33.6844, lng: 73.0479, aliases: ['isb'] },
  { name: 'Rawalpindi', region: 'Punjab', lat: 33.5651, lng: 73.0169, aliases: ['pindi', 'rwp'] },
  { name: 'Lahore', region: 'Punjab', lat: 31.5204, lng: 74.3587, aliases: ['lhr'] },
  { name: 'Peshawar', region: 'Khyber Pakhtunkhwa', lat: 34.0151, lng: 71.5249, aliases: ['psh'] },
  { name: 'Karachi', region: 'Sindh', lat: 24.8607, lng: 67.0011, aliases: ['khi'] },
  { name: 'Multan', region: 'Punjab', lat: 30.1575, lng: 71.5249, aliases: [] },
  { name: 'Faisalabad', region: 'Punjab', lat: 31.4504, lng: 73.1350, aliases: [] },
  { name: 'Quetta', region: 'Balochistan', lat: 30.1798, lng: 66.9750, aliases: [] },
  { name: 'Murree', region: 'Punjab', lat: 33.9070, lng: 73.3943, aliases: [] },

  // Hazara & Kaghan Valley (N-35 / N-15)
  { name: 'Abbottabad', region: 'Hazara, KPK', lat: 34.1688, lng: 73.2215, aliases: ['atd'] },
  { name: 'Mansehra', region: 'Hazara, KPK', lat: 34.3313, lng: 73.1980, aliases: [] },
  { name: 'Balakot', region: 'Kaghan Valley, KPK', lat: 34.5491, lng: 73.3522, aliases: [] },
  { name: 'Shogran', region: 'Kaghan Valley, KPK', lat: 34.6396, lng: 73.4577, aliases: ['siri paye', 'kewai'] },
  { name: 'Kaghan', region: 'Kaghan Valley, KPK', lat: 34.7775, lng: 73.5249, aliases: [] },
  { name: 'Naran', region: 'Kaghan Valley, KPK', lat: 34.9093, lng: 73.6506, aliases: ['saif ul malook', 'saiful malook', 'naran valley'] },
  { name: 'Batakundi', region: 'Kaghan Valley, KPK', lat: 34.9461, lng: 73.7972, aliases: ['lalazar'] },
  { name: 'Babusar Pass', region: 'Kaghan–Diamer Border', lat: 35.1462, lng: 74.0472, aliases: ['babusar', 'babusar top'] },

  // Kohistan & Diamer (N-35 KKH)
  { name: 'Besham', region: 'Shangla, KPK', lat: 34.9293, lng: 72.8744, aliases: ['bisham'] },
  { name: 'Dasu', region: 'Upper Kohistan, KPK', lat: 35.2917, lng: 73.2906, aliases: [] },
  { name: 'Chilas', region: 'Diamer, Gilgit-Baltistan', lat: 35.4206, lng: 74.0967, aliases: ['diamer'] },
  { name: 'Fairy Meadows', region: 'Diamer, Gilgit-Baltistan', lat: 35.3886, lng: 74.5778, aliases: ['raikot', 'tattu', 'nanga parbat'] },

  // Gilgit, Hunza & Khunjerab (N-35 KKH)
  { name: 'Gilgit', region: 'Gilgit-Baltistan', lat: 35.9208, lng: 74.3080, aliases: [] },
  { name: 'Naltar Valley', region: 'Gilgit, GB', lat: 36.1525, lng: 74.1836, aliases: ['naltar'] },
  { name: 'Hunza', region: 'Hunza Valley, GB', lat: 36.3167, lng: 74.6500, aliases: ['karimabad', 'altit', 'baltit'] },
  { name: 'Karimabad', region: 'Hunza Valley, GB', lat: 36.3167, lng: 74.6500, aliases: ['hunza'] },
  { name: 'Attabad Lake', region: 'Gojal, Hunza, GB', lat: 36.3228, lng: 74.8322, aliases: ['attabad', 'gulmit'] },
  { name: 'Passu', region: 'Gojal, Hunza, GB', lat: 36.4750, lng: 74.8920, aliases: ['passu cones', 'gojal'] },
  { name: 'Sost', region: 'Gojal, Hunza, GB', lat: 36.6881, lng: 74.8206, aliases: ['sust'] },
  { name: 'Khunjerab Pass', region: 'Pak-China Border, GB', lat: 36.8500, lng: 75.4286, aliases: ['khunjerab', 'khunjerab top'] },

  // Baltistan & Astore (S-1 / Deosai)
  { name: 'Astore', region: 'Astore Valley, GB', lat: 35.3667, lng: 74.8500, aliases: ['rama', 'rama meadows'] },
  { name: 'Minimarg', region: 'Astore Valley, GB', lat: 34.7917, lng: 75.0833, aliases: ['burzil', 'burzil pass'] },
  { name: 'Deosai Plains', region: 'Skardu–Astore, GB', lat: 35.0333, lng: 75.4667, aliases: ['deosai', 'sheosar lake'] },
  { name: 'Skardu', region: 'Baltistan, GB', lat: 35.2979, lng: 75.6337, aliases: ['shangrila', 'kachura', 'katpana'] },
  { name: 'Shigar', region: 'Baltistan, GB', lat: 35.4253, lng: 75.7358, aliases: ['sarfaranga'] },
  { name: 'Khaplu', region: 'Ghanche, Baltistan, GB', lat: 35.1611, lng: 76.3369, aliases: ['ghanche', 'hushe'] },

  // Swat, Kumrat & Chitral (N-95 / N-45)
  { name: 'Mingora', region: 'Swat, KPK', lat: 34.7717, lng: 72.3602, aliases: ['swat', 'saidu sharif'] },
  { name: 'Malam Jabba', region: 'Swat, KPK', lat: 34.7997, lng: 72.5719, aliases: [] },
  { name: 'Kalam', region: 'Upper Swat, KPK', lat: 35.4902, lng: 72.5796, aliases: ['mahodand', 'usho'] },
  { name: 'Kumrat Valley', region: 'Upper Dir, KPK', lat: 35.5333, lng: 72.2000, aliases: ['kumrat', 'thal'] },
  { name: 'Dir', region: 'Upper Dir, KPK', lat: 35.2074, lng: 71.8768, aliases: ['upper dir', 'lowari'] },
  { name: 'Chitral', region: 'Lower Chitral, KPK', lat: 35.8518, lng: 71.7864, aliases: ['kalash', 'bumburet'] },
  { name: 'Kalash Valley', region: 'Chitral, KPK', lat: 35.6914, lng: 71.6786, aliases: ['kalash', 'bumburet', 'rumbur'] },
  { name: 'Phander', region: 'Ghizer, GB', lat: 36.1742, lng: 72.9469, aliases: ['ghizer', 'gupis'] },
  { name: 'Shandur Pass', region: 'Chitral–Ghizer Border', lat: 36.0667, lng: 72.5333, aliases: ['shandur', 'shandur top'] },

  // Azad Kashmir / Neelum Valley
  { name: 'Muzaffarabad', region: 'Azad Jammu & Kashmir', lat: 34.3700, lng: 73.4711, aliases: ['ajk'] },
  { name: 'Keran', region: 'Neelum Valley, AJK', lat: 34.6569, lng: 73.9514, aliases: ['neelum valley', 'athmuqam'] },
  { name: 'Sharda', region: 'Neelum Valley, AJK', lat: 34.7931, lng: 74.1922, aliases: [] },
  { name: 'Kel', region: 'Neelum Valley, AJK', lat: 34.8233, lng: 74.3489, aliases: ['arang kel', 'ratti gali'] },
  { name: 'Taobat', region: 'Upper Neelum, AJK', lat: 34.7389, lng: 74.7167, aliases: [] },
  { name: 'Rawalakot', region: 'Poonch, AJK', lat: 33.8578, lng: 73.7604, aliases: ['banjosa', 'toli pir'] },
];

// Simple in-memory geocode cache so autocomplete selections resolve in 0ms
const geocodeCache = new Map();

function findVerifiedHub(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return null;
  return (
    VERIFIED_PAKISTAN_HUBS.find(
      (h) => h.name.toLowerCase() === q || h.aliases.includes(q)
    ) || null
  );
}

function searchVerifiedHubs(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const exact = [];
  const prefix = [];
  const partial = [];

  for (const h of VERIFIED_PAKISTAN_HUBS) {
    const nameLower = h.name.toLowerCase();
    const regionLower = h.region.toLowerCase();
    const aliasMatch = h.aliases.some((a) => a.includes(q));
    if (nameLower === q || h.aliases.includes(q)) {
      exact.push(h);
    } else if (nameLower.startsWith(q)) {
      prefix.push(h);
    } else if (nameLower.includes(q) || regionLower.includes(q) || aliasMatch) {
      partial.push(h);
    }
  }
  return [...exact, ...prefix, ...partial].map((h) => ({
    name: h.name,
    fullLabel: `${h.name}, ${h.region}`,
    region: `${h.region} · Verified Hub`,
    lat: h.lat,
    lng: h.lng,
    isVerified: true,
  }));
}

// ─── 1A. Hybrid Verified + Nominatim Live Autocomplete Search ───────────────
/**
 * Search Pakistani cities, towns, valleys, and passes.
 * Prioritizes VERIFIED_PAKISTAN_HUBS first (0ms), then appends live OSM Nominatim
 * settlement results (excluding highway street segments).
 * @param {string} query
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array<{name: string, fullLabel: string, region: string, lat: number, lng: number}>>}
 */
export async function searchLocations(query, signal) {
  const trimmed = (query || '').trim();
  if (trimmed.length < 2) return [];

  const verifiedMatches = searchVerifiedHubs(trimmed);
  const results = [...verifiedMatches];
  const seen = new Set(verifiedMatches.map((m) => m.name.toLowerCase()));

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', trimmed);
    url.searchParams.set('countrycodes', 'pk');
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '10');
    // Soft bias toward Northern Pakistan & Islamabad without excluding Lahore/Karachi
    url.searchParams.set('viewbox', '70.0,37.2,77.5,33.0');
    url.searchParams.set('bounded', '0');

    const res = await fetch(url.toString(), {
      signal,
      headers: {
        'User-Agent': 'RaahBar/1.0 (motorcycle-trip-planner; raahbar.pk)',
        'Accept-Language': 'en',
      },
    });
    if (!res.ok) return results.slice(0, 7);
    const data = await res.json();
    if (!Array.isArray(data)) return results.slice(0, 7);

    for (const item of data) {
      // Skip raw highway road segments so city autocomplete stays clean
      if (item.class === 'highway') continue;

      const primaryName =
        item.name ||
        item.address?.city ||
        item.address?.town ||
        item.address?.village ||
        item.address?.county ||
        item.display_name?.split(',')[0]?.trim();

      const stateOrDistrict =
        item.address?.state ||
        item.address?.county ||
        item.address?.state_district ||
        'Pakistan';

      if (!primaryName) continue;
      const nameKey = primaryName.toLowerCase();
      if (seen.has(nameKey)) continue;
      seen.add(nameKey);

      const entry = {
        name: primaryName,
        fullLabel: `${primaryName}, ${stateOrDistrict}`,
        region: stateOrDistrict,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      };

      geocodeCache.set(nameKey, {
        lat: entry.lat,
        lng: entry.lng,
        displayName: primaryName,
      });

      results.push(entry);
    }

    return results.slice(0, 7);
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('[routing] Nominatim autocomplete failed:', err.message);
    }
    return results.slice(0, 7);
  }
}

// ─── 1B. Hybrid Verified + Nominatim Geocoding ──────────────────────────────
/**
 * Geocode a city/place name to coordinates.
 * Checks VERIFIED_PAKISTAN_HUBS first so ambiguous names like "Naran" always
 * resolve to Kaghan Valley, KPK rather than similarly named rural villages in Sindh.
 * Falls back to Nominatim (limit=5, preferring settlements over highways) for custom towns.
 * @param {string} cityName
 * @returns {Promise<{lat: number, lng: number, displayName: string}|null>}
 */
export async function geocodeLocation(cityName) {
  const cleanName = (cityName || '').trim();
  if (!cleanName) return null;

  const verified = findVerifiedHub(cleanName);
  if (verified) {
    return {
      lat: verified.lat,
      lng: verified.lng,
      displayName: verified.name,
    };
  }

  const cached = geocodeCache.get(cleanName.toLowerCase());
  if (cached) return cached;

  try {
    const encoded = encodeURIComponent(`${cleanName}, Pakistan`);
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&limit=5&countrycodes=pk&viewbox=70.0,37.2,77.5,33.0&bounded=0`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RaahBar/1.0 (motorcycle-trip-planner; raahbar.pk)',
        'Accept-Language': 'en',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;

    // Prefer actual settlements/valleys/passes over highway segments
    const preferred =
      data.find((d) => ['place', 'boundary', 'natural', 'tourism'].includes(d.class)) ||
      data.find((d) => d.class !== 'highway') ||
      data[0];

    const resolved = {
      lat: parseFloat(preferred.lat),
      lng: parseFloat(preferred.lon),
      displayName: preferred.name || preferred.display_name?.split(',')[0]?.trim() || cleanName,
    };
    geocodeCache.set(cleanName.toLowerCase(), resolved);
    return resolved;
  } catch {
    console.warn(`[routing] Nominatim geocoding failed for "${cleanName}"`);
    return null;
  }
}

// ─── 2. OpenRouteService — Live GeoJSON Road Routing (No Motorways) ─────────
/**
 * Strip duplicate Urdu/Arabic script from bilingual OSM road tags (e.g. "قومی شاہراہ, N-5" -> "N-5")
 * while keeping clean readable English/highway designations.
 */
function cleanRoadName(raw) {
  const str = (raw || '').trim();
  if (!str || str === '-' || str.toLowerCase() === 'unnamed road') return null;

  // Extract explicit Pakistani highway code if present alongside Urdu text
  const codeMatch = str.match(/\b([NME S]-\d+|S\d+-\d+|KKH)\b/i);
  // Strip Arabic/Urdu Unicode blocks + stray commas/slashes
  const latinOnly = str
    .replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+/g, '')
    .replace(/^[\s,/|-]+|[\s,/|-]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (latinOnly.length >= 2) return latinOnly;
  if (codeMatch) return codeMatch[1].toUpperCase();
  return null;
}

/**
 * Get real road route from ORS using the /geojson endpoint so coordinates
 * are decoded and step instructions provide exact highway/road names.
 * Avoids motorways (M-1, M-2, etc.) where motorcycles are prohibited.
 */
export async function getRouteSegments(origin, destination, totalDays = 5) {
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
      instructions: true,
      options: {
        avoid_features: ['highways'], // Motorcycles prohibited on Pakistan M-series motorways
      },
    };

    const res = await fetch(
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
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
    const feature = data?.features?.[0];
    const summary = feature?.properties?.summary;
    if (!summary) return null;

    const totalDistanceKm = Math.round(summary.distance / 1000);
    const totalDurationHrs = Math.round((summary.duration / 3600) * 10) / 10;

    // Extract & clean real road/highway names from ORS navigation steps
    const steps = feature?.properties?.segments?.[0]?.steps || [];
    const roadMap = new Map();
    for (const step of steps) {
      const cleaned = cleanRoadName(step.name);
      if (!cleaned) continue;
      const normKey = cleaned.toLowerCase();
      const prev = roadMap.get(normKey) || { road: cleaned, distanceM: 0, durationS: 0 };
      prev.distanceM += step.distance || 0;
      prev.durationS += step.duration || 0;
      roadMap.set(normKey, prev);
    }

    const stepSummaries = Array.from(roadMap.values())
      .map((stats) => ({
        road: stats.road,
        distanceKm: Math.round((stats.distanceM / 1000) * 10) / 10,
        durationHrs: Math.round((stats.durationS / 3600) * 10) / 10,
      }))
      .filter((s) => s.distanceKm >= 2)
      .sort((a, b) => b.distanceKm - a.distanceKm)
      .slice(0, 8);

    const roadNames = stepSummaries.map((s) => s.road);

    // Extract GeoJSON coordinates [lng, lat] along the real road geometry
    const waypoints = feature?.geometry?.coordinates || [];
    const sampleCount = Math.min(Math.max(Number(totalDays) + 2, 5), 7);
    const rawSampled = sampleArray(waypoints, sampleCount);
    const sampledCoords = rawSampled.map((coord) => ({
      lat: coord[1],
      lng: coord[0],
    }));

    return {
      totalDistanceKm,
      totalDurationHrs,
      sampledCoords,
      roadNames,
      stepSummaries,
    };
  } catch (err) {
    console.warn('[routing] ORS fetch exception:', err.message);
    return null;
  }
}

// ─── 3. Open-Meteo Weather ──────────────────────────────────────────────────
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

    const minTempC =
      data?.daily?.temperature_2m_min?.[0] != null
        ? Math.round(data.daily.temperature_2m_min[0])
        : tempC - 4;
    const maxTempC =
      data?.daily?.temperature_2m_max?.[0] != null
        ? Math.round(data.daily.temperature_2m_max[0])
        : tempC + 3;

    const condition = describeWeatherCode(weatherCode);
    const isFreezing = tempC <= 2 || minTempC <= 0;
    const isAlert = weatherCode >= 61 || isFreezing;
    const alertText = isAlert
      ? `Live weather alert: ${condition} (${tempC}°C, low of ${minTempC}°C, precip ${precipMm}mm, winds ${windKmh} km/h). Watch for black ice on mountain passes and pack thermal/rain layers.`
      : null;

    return { tempC, minTempC, maxTempC, condition, windKmh, precipMm, isAlert, alertText };
  } catch (err) {
    console.warn('[routing] Open-Meteo weather fetch failed:', err.message);
    return null;
  }
}

// ─── 4. Open-Meteo Elevation ────────────────────────────────────────────────
export async function getElevations(coordsArray) {
  if (!coordsArray || coordsArray.length === 0) return null;
  try {
    const lats = coordsArray.map((c) => c.lat.toFixed(4)).join(',');
    const lngs = coordsArray.map((c) => c.lng.toFixed(4)).join(',');
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`;

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.elevation?.map((e) => Math.round(e)) ?? null;
  } catch (err) {
    console.warn('[routing] Open-Meteo elevation fetch failed:', err.message);
    return null;
  }
}

// ─── 5. Overpass API — Fast Single-Batch En-Route POIs & Infrastructure ─────
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

async function fetchOverpassWithMirror(query) {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      clearTimeout(timeoutId);
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.elements && data.elements.length > 0) {
        return data;
      }
    } catch {
      clearTimeout(timeoutId);
    }
  }
  return null;
}

/**
 * Queries a compact Overpass union around the destination (viewpoints, lakes,
 * waterfalls, passes, fuel & hospitals) plus 1 midpoint town check with `[timeout:8]`,
 * falling back to an Overpass mirror if the primary endpoint is busy.
 */
export async function getRoutePOIsAndInfrastructure(sampledCoords, originCoords, destCoords) {
  const allPts =
    sampledCoords && sampledCoords.length > 0
      ? sampledCoords
      : [originCoords, destCoords].filter(Boolean);

  if (allPts.length === 0) return null;

  const midPt = allPts[Math.floor(allPts.length * 0.5)];
  const endPt = destCoords || allPts[allPts.length - 1];

  try {
    const mLat = midPt.lat.toFixed(4);
    const mLng = midPt.lng.toFixed(4);
    const dLat = endPt.lat.toFixed(4);
    const dLng = endPt.lng.toFixed(4);

    const query = `
      [out:json][timeout:8];
      (
        node["place"="town"](around:12000,${mLat},${mLng});
        node["tourism"~"^(viewpoint|attraction)$"]["name"](around:20000,${dLat},${dLng});
        node["natural"="water"]["name"](around:20000,${dLat},${dLng});
        node["waterway"="waterfall"]["name"](around:20000,${dLat},${dLng});
        node["mountain_pass"="yes"](around:20000,${dLat},${dLng});
        node["amenity"~"^(fuel|hospital)$"]["name"](around:15000,${dLat},${dLng});
      );
      out body 40;
    `;

    const data = await fetchOverpassWithMirror(query);
    const elements = data?.elements ?? [];
    if (elements.length === 0) return null;

    const orig = originCoords || allPts[0];
    const dest = endPt;

    const enriched = elements
      .filter((el) => el.lat != null && el.lon != null)
      .map((el) => {
        const name = el.tags?.['name:en'] || el.tags?.name || el.tags?.brand || null;
        return {
          ...el,
          name,
          distFromOriginKm: haversineKm(orig.lat, orig.lng, el.lat, el.lon),
          distFromDestKm: haversineKm(dest.lat, dest.lng, el.lat, el.lon),
        };
      })
      .sort((a, b) => a.distFromOriginKm - b.distFromOriginKm);

    const enRouteTowns = [];
    const enRouteViewpoints = [];
    const destAttractions = [];
    const mountainPasses = [];
    const fuelStations = [];
    const hospitals = [];
    const mechanics = [];

    const seenNames = new Set();
    const addUnique = (arr, val) => {
      if (!val) return;
      const key = val.toLowerCase().trim();
      if (seenNames.has(key)) return;
      seenNames.add(key);
      arr.push(val.trim());
    };

    for (const el of enriched) {
      const tags = el.tags || {};
      const rawName = el.name;

      if (tags.place === 'town' || tags.place === 'city') {
        if (rawName) addUnique(enRouteTowns, rawName);
        continue;
      }

      if (tags.mountain_pass === 'yes' && rawName) {
        const passKey = `pass:${rawName.toLowerCase()}`;
        if (!seenNames.has(passKey)) {
          seenNames.add(passKey);
          const elev = tags.ele ? parseInt(tags.ele, 10) : null;
          mountainPasses.push({
            name: rawName,
            elevationM: Number.isFinite(elev) ? elev : null,
          });
        }
        continue;
      }

      const isScenic =
        tags.tourism === 'viewpoint' ||
        tags.tourism === 'attraction' ||
        tags.waterway === 'waterfall' ||
        tags.natural === 'water';

      if (isScenic && rawName) {
        let category = 'Viewpoint';
        if (tags.waterway === 'waterfall') category = 'Waterfall';
        else if (tags.natural === 'water') category = 'Lake';
        else if (tags.tourism === 'attraction') category = 'Landmark';

        const nearDest = el.distFromDestKm <= 25;
        const vpKey = `vp:${rawName.toLowerCase()}`;
        if (!seenNames.has(vpKey)) {
          seenNames.add(vpKey);
          const formatted = `${rawName} (${category})`;
          enRouteViewpoints.push({
            name: rawName,
            formatted,
            category,
            nearDest,
            distFromOriginKm: Math.round(el.distFromOriginKm),
          });
          if (nearDest) {
            destAttractions.push(formatted);
          }
        }
        continue;
      }

      if (tags.amenity === 'fuel') {
        addUnique(fuelStations, rawName || tags.brand || 'Petrol Station');
        continue;
      }

      if (tags.amenity === 'hospital' || tags.amenity === 'clinic') {
        addUnique(hospitals, rawName || 'District Hospital');
        continue;
      }

      if (tags.shop === 'motorcycle') {
        addUnique(mechanics, rawName || 'Motorcycle Workshop');
      }
    }

    return {
      enRouteTowns: enRouteTowns.slice(0, 10),
      enRouteViewpoints: enRouteViewpoints.slice(0, 14),
      destAttractions: destAttractions.slice(0, 10),
      mountainPasses: mountainPasses.slice(0, 6),
      fuelStations: fuelStations.slice(0, 8),
      hospitals: hospitals.slice(0, 6),
      mechanics: mechanics.slice(0, 4),
    };
  } catch (err) {
    console.warn('[routing] Overpass fast query failed/timed out:', err.message);
    return null;
  }
}

export async function getNearbyInfrastructure(coords) {
  const res = await getRoutePOIsAndInfrastructure([coords], coords, coords);
  if (!res) return null;
  return {
    fuelStations: res.fuelStations,
    hospitals: res.hospitals,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────
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

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function describeWeatherCode(code) {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 9) return 'Fog / haze';
  if (code <= 19) return 'Light drizzle';
  if (code <= 29) return 'Thunderstorm (nearby)';
  if (code <= 39) return 'Dust / sandstorm';
  if (code <= 49) return 'Mountain fog';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rain';
  if (code <= 79) return 'Snowfall';
  if (code <= 84) return 'Rain showers';
  if (code <= 94) return 'Snow showers';
  return 'Thunderstorm';
}
