import { CRITICAL_FUEL_GAPS, EMERGENCY_CONTACTS } from '../constants.ts';

// ─── System Prompt ───────────────────────────────────────────────────────────
// Core domain knowledge — never hallucinate distances or locations.
export function getSystemPrompt(days, start, end) {
  return `You are RaahBar, a veteran biker and professional motorcycle expedition planner for Pakistan.
You have deep knowledge of routes in Gilgit-Baltistan (GB), Khyber Pakhtunkhwa (KPK), and AJK.

You are planning a ONE-WAY ${days}-day scenic expedition from ${start} to ${end}.

CRITICAL RULES — follow these absolutely:
1. One-Way Journey: Plan the forward journey and local exploration only. Do NOT plan the return trip.
2. Scenic Detours: The baseline route is often the fastest, but you should design a richer, scenic journey. If taking a beautiful detour makes the trip better, do it!
3. Pacing: You decide the overnight stops dynamically based on the vehicle and rider experience. Do not blindly divide total distance by days. Use the middle days for travel/scenic stops. Use the final day to explore ultimate highlights around the destination.
4. NEVER suggest motorways (M-1, M-2 etc.) — motorcycles are prohibited. Use scenic alternative roads.
5. Provide realistic daily km distance and altitude estimates based on your domain knowledge.
6. Check web_search for current pass status, road closures, and landslides before completing the itinerary.

CRITICAL DOMAIN KNOWLEDGE:
- Babusar Pass: Open May–October only. Altitude: 4,173m. Closed by snow Oct–May.
- Shandur Pass: Open June–September. Altitude: 3,700m. Gravel/unpaved.
- Deosai Plains: Open June–September. Altitude: 4,115m. Cold even in summer. No fuel.
- Khunjerab Pass: Open April–November. Altitude: 4,693m. World's highest paved border crossing.
- Lowari Tunnel: Year-round. Old pass is seasonal and restricted to locals.
- SIM CARD: SCOM SIM is mandatory in GB. Jazz/Zong/Telenor do NOT work in most of GB.
- BIKES: 150cc minimum for mountain passes. 125cc risks overheating and power loss above 3,500m.
- ALTITUDE SICKNESS: Flag every day crossing above 3,500m. Recommend 1 acclimatization day if elevation gain > 1,500m in a single day.
- NOC PERMITS: Naltar, Shimshal, Khunjerab (foreigners), Deosai, Astore (some zones), areas near Line of Control.

FUEL GAP KNOWLEDGE (hard facts — always apply these):
${CRITICAL_FUEL_GAPS.map((g) => `- ${g.route} (${g.gapKm}km gap): ${g.warning}`).join('\n')}

OUTPUT FORMAT — respond ONLY in this exact JSON structure, no extra text or markdown:
{
  "tripTitle": "string",
  "totalDays": number,
  "totalDistanceKm": number,
  "totalDurationHrs": number,
  "startPoint": "string",
  "endPoint": "string",
  "weatherSummary": "string — one sentence on current destination weather",
  "warnings": ["array of critical trip-level warnings"],
  "days": [
    {
      "day": number,
      "title": "string — e.g. Day 1: Islamabad to Mansehra",
      "distanceKm": number,
      "durationHrs": number,
      "startLocation": "string — exact real town name",
      "endLocation": "string — exact real town name",
      "altitudeM": number,
      "altitudeLevel": "LOW | MID | HIGH | EXTREME",
      "highlights": ["array of 3 real, specific sights or stops on this day's road"],
      "fuelStops": ["array of fuel stop town names on this leg — use FUEL GAP KNOWLEDGE"],
      "fuelWarning": "string or null — specific fuel gap warning if applicable",
      "sleepLocation": "string — area or guesthouse recommendation",
      "warnings": ["altitude / pass timing / road condition flags for this day"],
      "tips": "string — one concrete, practical tip for this specific day"
    }
  ],
  "gearChecklist": ["array of 6–8 essential items specific to this trip"],
  "permits": ["list of NOC/permits needed for this route"],
  "bestMonths": "string — ideal months for this specific route",
  "emergencyContacts": ["3–5 most relevant emergency contacts from the route's regions"]
}`;
}

// ─── User Message Builder ────────────────────────────────────────────────────
/**
 * Build the user-turn message injecting all real-world data.
 * The AI becomes a narrator/annotator, not an inventor.
 *
 * @param {object} tripParams   { from, to, days, month, bikeType, expLevel }
 * @param {object|null} routeData   From getRouteSegments()
 * @param {object|null} weatherData From getWeather()
 * @param {number[]|null} elevations  Array of altitudes per day endpoint
 * @param {Array|null} infrastructure  Per-day Overpass results
 */
export function buildUserMessage(tripParams, routeData, weatherData, elevations, infrastructure) {
  const sections = [];

  // ── Trip Parameters ──
  sections.push(`TRIP REQUEST:
- From: ${tripParams.from}
- To: ${tripParams.to}
- Duration: ${tripParams.days} days
- Travel month: ${tripParams.month}
- Bike type: ${tripParams.bikeType}
- Experience level: ${tripParams.expLevel}`);

  // ── Real Route Data ──
  if (routeData) {
    let infraText = '';
    if (elevations && elevations.length > 0) {
       const maxElev = Math.max(...elevations);
       infraText += `\n- Max route elevation sample: ~${Math.round(maxElev)}m`;
    }
    if (infrastructure && infrastructure.length > 0) {
       const mappedFuel = Array.from(new Set(infrastructure.flatMap(i => i?.fuelStations || [])));
       const mappedHos = Array.from(new Set(infrastructure.flatMap(i => i?.hospitals || [])));
       infraText += `\n- Route infrastructure sampled (fuel): ${mappedFuel.length ? mappedFuel.join(', ') : 'scarce'}`;
       infraText += `\n- Route infrastructure sampled (medical): ${mappedHos.length ? mappedHos.join(', ') : 'scarce'}`;
    }

    sections.push(`REAL ROUTE DATA (Baseline Direct Route):
- Fastest highway distance: ${routeData.totalDistanceKm} km
- Minimum continuous riding time: ${routeData.totalDurationHrs} hours${infraText}

Note: The above distance is the minimum direct route. Since this is a scenic expedition, YOU determine the pacing and beautifully scenic detours, allocating distances across ${tripParams.days} days as you see fit. Overwrite pacing based on vehicle capability (e.g. 125cc vs Adventure).`);
  } else {
    sections.push(`REAL ROUTE DATA: Not available (use your domain knowledge but add disclaimer that distances are approximate).
Note: Since this is a scenic expedition, YOU determine the pacing and beautifully scenic detours, allocating distances across ${tripParams.days} days as you see fit. Overwrite pacing based on vehicle capability.`);
  }

  // ── Live Weather ──
  if (weatherData) {
    sections.push(`LIVE WEATHER AT DESTINATION (current):
- Temperature: ${weatherData.tempC}°C
- Condition: ${weatherData.condition}
- Wind: ${weatherData.windKmh} km/h
- Precipitation: ${weatherData.precipMm}mm
${weatherData.isAlert ? `⚠️ WEATHER ALERT: ${weatherData.alertText}` : '- No active weather alerts.'}`);
  } else {
    sections.push(`LIVE WEATHER: Data unavailable. Note seasonal conditions typical for ${tripParams.month} in the region.`);
  }

  // ── Emergency Infrastructure ──
  const relevantContacts = getRelevantEmergencyContacts(tripParams.from, tripParams.to);
  if (relevantContacts.length > 0) {
    sections.push(`KEY EMERGENCY CONTACTS FOR THIS ROUTE:
${relevantContacts.map((c) => `- ${c.region} ${c.type}: ${c.name}${c.contact ? ` (${c.contact})` : ''} — ${c.note}`).join('\n')}`);
  }

  // ── Final instruction ──
  sections.push(`INSTRUCTIONS:
1. Use web_search to check current road conditions, pass status, and any active closures/landslides for this route in ${tripParams.month}.
2. Design the best scenic route. The REAL ROUTE DATA is just the baseline minimum direct route. You are encouraged to take scenic detours!
3. Adapt to Vehicle & Experience: For a 125cc bike, restrict aggressive single-day highland climbs and suggest cooling stops. For an Adventure (500cc+) bike, confidently route through steeper terrain. For a Rookie, prioritize paved roads and shorter saddle hours. For a Veteran, include off-road recommendations and longer riding hours.
4. Populate highlights with REAL, SPECIFIC places along the actual road on that day (e.g. "Attock Bridge", "Lulusar Lake", "Rakaposhi viewpoint").
5. Apply fuel gap warnings wherever relevant from FUEL GAP KNOWLEDGE and infrastructure data.
6. Flag altitude warnings for any day crossing above 3,500m, especially for smaller bikes like 125cc.
7. Respond ONLY with the JSON structure. No extra text.`);

  return sections.join('\n\n');
}

// ─── Helper: Filter emergency contacts relevant to this route ────────────────
function getRelevantEmergencyContacts(from, to) {
  const routeText = `${from} ${to}`.toLowerCase();

  // Determine which regions are likely on this route
  const relevantRegions = [];
  if (routeText.includes('gilgit') || routeText.includes('hunza') || routeText.includes('khunjerab') || routeText.includes('passu') || routeText.includes('karimabad')) {
    relevantRegions.push('Gilgit');
  }
  if (routeText.includes('skardu') || routeText.includes('deosai') || routeText.includes('shigar')) {
    relevantRegions.push('Skardu');
  }
  if (routeText.includes('naran') || routeText.includes('kaghan') || routeText.includes('babusar')) {
    relevantRegions.push('Naran', 'Mansehra');
  }
  if (routeText.includes('chilas') || routeText.includes('diamer')) {
    relevantRegions.push('Chilas');
  }
  if (routeText.includes('chitral') || routeText.includes('shandur') || routeText.includes('lowari')) {
    relevantRegions.push('Chitral');
  }
  if (routeText.includes('islamabad') || routeText.includes('rawalpindi') || routeText.includes('pindi')) {
    relevantRegions.push('Rawalpindi');
  }

  // Always add Besham (KKH midpoint used by most routes)
  if (!relevantRegions.includes('Besham')) relevantRegions.push('Besham');

  return EMERGENCY_CONTACTS.filter((c) => relevantRegions.includes(c.region));
}
