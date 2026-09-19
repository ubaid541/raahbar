import { CRITICAL_FUEL_GAPS, EMERGENCY_CONTACTS } from '../constants.ts';

// ─── System Prompt ───────────────────────────────────────────────────────────
// Core domain knowledge — never hallucinate distances or locations.
export function getSystemPrompt() {
  return `You are RaahBar, a professional motorcycle expedition planner for Northern Pakistan.
You have deep knowledge of routes in Gilgit-Baltistan (GB), Khyber Pakhtunkhwa (KPK), and AJK.

CRITICAL RULES — follow these absolutely:
1. NEVER invent or guess distances, km values, or city/town names. Use ONLY the data in the REAL ROUTE DATA section below.
2. NEVER suggest motorways (M-1, M-2 etc.) — motorcycles are prohibited on Pakistani motorways.
3. NEVER suggest highways unless specifically relevant to the route (e.g. N-35 KKH, N-45 Chitral road, N-50 Skardu road).
4. Use web_search to check current pass status, road closures, and any active landslides before completing the itinerary.

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
    sections.push(`REAL ROUTE DATA (from OpenRouteService — use these exact values, do not invent alternatives):
- Total real road distance: ${routeData.totalDistanceKm} km
- Total estimated riding time: ${routeData.totalDurationHrs} hours
- Daily legs breakdown:
${routeData.dailyLegs
  .map((leg, i) => {
    const altM = elevations?.[i + 1] != null ? Math.round(elevations[i + 1]) : null;
    const altLabel = altM != null ? ` | Altitude at endpoint: ${altM}m` : '';
    const infraStr = infrastructure?.[i]
      ? ` | Nearby fuel: ${infrastructure[i].fuelStations?.join(', ') || 'none mapped'} | Nearby hospital: ${infrastructure[i].hospitals?.join(', ') || 'none mapped'}`
      : '';
    return `  Day ${leg.dayNumber}: ${leg.distanceKm}km, ~${leg.durationHrs}h riding${altLabel}${infraStr}`;
  })
  .join('\n')}`);
  } else {
    sections.push(`REAL ROUTE DATA: Not available (use your domain knowledge but add disclaimer that distances are approximate).`);
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
2. Use ONLY the REAL ROUTE DATA distances and times above. Do NOT change or invent different values.
3. Populate highlights with REAL, SPECIFIC places along the actual road on that day (e.g. "Attock Bridge", "Lulusar Lake", "Rakaposhi viewpoint") — not generic phrases like "scenic viewpoint".
4. Apply fuel gap warnings wherever relevant from both the FUEL GAP KNOWLEDGE and the infrastructure data above.
5. Flag altitude warnings for any day where endpoint altitude exceeds 3,500m, especially for ${tripParams.bikeType} bikes.
6. Respond ONLY with the JSON structure. No extra text.`);

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
