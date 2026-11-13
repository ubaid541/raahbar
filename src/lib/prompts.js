import { CRITICAL_FUEL_GAPS, EMERGENCY_CONTACTS } from '../constants.ts';

// ─── Seasonal Pass Rules (Safety Net + Live Search Verification) ────────────
const SEASONAL_PASSES = [
  {
    name: 'Babusar Pass (N-15)',
    altitudeM: 4173,
    openMonths: ['May', 'June', 'July', 'August', 'September', 'October'],
    closedCorridor: 'Use Karakoram Highway (N-35) via Besham, Dasu & Chilas year-round.',
    keywords: ['naran', 'kaghan', 'babusar', 'chilas', 'gilgit', 'hunza', 'skardu', 'khunjerab', 'fairy meadows', 'astore'],
  },
  {
    name: 'Khunjerab Pass (N-35 Border)',
    altitudeM: 4693,
    openMonths: ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'],
    closedCorridor: 'Accessible up to Sost / Passu in deep winter; border summit closes Dec–March.',
    keywords: ['khunjerab', 'sost', 'passu', 'gojal', 'hunza'],
  },
  {
    name: 'Deosai Plains (Skardu–Astore)',
    altitudeM: 4115,
    openMonths: ['June', 'July', 'August', 'September'],
    closedCorridor: 'Use S-1 Jaglot–Skardu Highway via Indus Gorge when Deosai is snowbound.',
    keywords: ['deosai', 'skardu', 'astore', 'minimarg', 'chillam', 'sheosar'],
  },
  {
    name: 'Shandur Pass (Chitral–Ghizer)',
    altitudeM: 3700,
    openMonths: ['June', 'July', 'August', 'September', 'October'],
    closedCorridor: 'Access Gilgit via N-35 KKH or Chitral via N-45 Lowari Tunnel in winter.',
    keywords: ['shandur', 'chitral', 'mastuj', 'gupis', 'phander', 'ghizer'],
  },
  {
    name: 'Lowari Tunnel (N-45 Dir–Chitral)',
    altitudeM: 3118,
    openMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    closedCorridor: 'Tunnel is open year-round (check icing after heavy blizzards); old top pass is closed.',
    keywords: ['chitral', 'dir', 'lowari', 'kalash', 'booni', 'kumrat'],
  },
];

/**
 * Evaluate relevant mountain passes for a given route and travel month.
 */
export function evaluateRoutePasses(from, to, month, livePasses = []) {
  const text = `${from} ${to}`.toLowerCase();
  const matched = SEASONAL_PASSES.filter((p) =>
    p.keywords.some((kw) => text.includes(kw))
  );

  // Merge any additional passes discovered dynamically via Overpass
  for (const lp of livePasses || []) {
    if (!lp?.name) continue;
    const alreadyExists = matched.some((m) =>
      m.name.toLowerCase().includes(lp.name.toLowerCase()) ||
      lp.name.toLowerCase().includes(m.name.split(' ')[0].toLowerCase())
    );
    if (!alreadyExists) {
      matched.push({
        name: lp.name,
        altitudeM: lp.elevationM || 3500,
        openMonths: ['May', 'June', 'July', 'August', 'September', 'October'],
        closedCorridor: 'Verify local police checkpoint before ascending in winter.',
        keywords: [],
      });
    }
  }

  return matched.map((p) => {
    const isOpen = p.openMonths.some((m) => m.toLowerCase() === (month || '').toLowerCase());
    const isBorderline = ['May', 'October', 'November'].some(
      (m) => m.toLowerCase() === (month || '').toLowerCase()
    );
    let status = isOpen ? 'OPEN' : 'CLOSED';
    if (isOpen && isBorderline && p.altitudeM >= 3800) {
      status = 'CAUTION';
    }
    return {
      name: p.name,
      altitudeM: p.altitudeM,
      status,
      reason: isOpen
        ? isBorderline
          ? `Open in ${month}, but early/late season frost & afternoon winds expected above ${p.altitudeM}m.`
          : `Within normal open season (${p.openMonths[0]}–${p.openMonths[p.openMonths.length - 1]}).`
        : `Snowbound / closed in ${month}. Seasonal window is ${p.openMonths[0]}–${p.openMonths[p.openMonths.length - 1]}.`,
      alternativeCorridor: !isOpen ? p.closedCorridor : null,
    };
  });
}

// ─── System Prompt ───────────────────────────────────────────────────────────
export function getSystemPrompt(daysLabel, start, end, month) {
  const isAutoDays = String(daysLabel).toLowerCase() === 'auto';
  const durationInstruction = isAutoDays
    ? `Determine the ideal, realistic number of days (between 2 and 10 days) required to ride one-way from ${start} to ${end} AND explore its best nearby lakes, valleys, and viewpoints.`
    : `Plan an exact ${daysLabel}-day one-way expedition from ${start} to ${end}. If ${daysLabel} days is longer than the direct transit ride requires, pace the transit comfortably with en-route scenic detours on the way and dedicate the remaining days to specific named side-valley excursions, lakes, and viewpoints around ${end}.`;

  return `You are RaahBar, a veteran Pakistani motorcycle expedition leader with encyclopedic knowledge of highways, mountain passes, towns, lakes, viewpoints, mechanics, and fuel logistics across Pakistan (KPK, Gilgit-Baltistan, AJK, Punjab).

MISSION:
${durationInstruction}
Travel Month: ${month}.

CRITICAL RULES — FOLLOW STRICTLY:
1. STRICTLY ONE-WAY EXPEDITION:
   - Plan a ONE-WAY journey from ${start} to ${end} PLUS local excursions around ${end}. Do NOT plan a return trip back to ${start} on the final day!
2. ZERO HALLUCINATIONS & SPECIFIC NAMES ONLY:
   - NEVER write generic filler like "Viewpoint & Scenic Stops", "Exploring Surrounds", or "Local Chai Stop".
   - Every single checkpoint, viewpoint, lake, waterfall, town, and pass MUST be a real, named geographical place along the route corridor OR around the destination (use the LIVE OVERPASS & ORS DATA injected in the user prompt plus your verified knowledge of that exact road).
3. EN-ROUTE + DESTINATION VIEWPOINTS:
   - Include scenic stops that come ON THE WAY while travelling toward ${end} (e.g., waterfalls, river confluences, side-valley detours, historic bridges, viewpoints), NOT just at the final destination.
4. PASS CLOSURES & CORRIDOR ROUTING:
   - Respect seasonal pass closures in ${month}! For example, if travelling in November–April and Babusar Pass (4,173m) is CLOSED, explicitly flag Babusar Pass as CLOSED in \`passStatuses\` and route via the open Karakoram Highway (N-35: Hazara/Abbottabad → Mansehra → Besham → Dasu → Chilas) if heading to GB, or restrict Naran excursions below snowline.
   - ONLY include passes in \`passStatuses\` that lie on or directly adjacent to the route between ${start} and ${end} (use the passes provided in PASS STATUS EVALUATION; do not add unrelated passes from other regions like Lowari if routing to Naran).
5. MOTORCYCLE BAN ON MOTORWAYS:
   - Never route motorcycles on M-1, M-2, or M-15 motorways where bikes are prohibited. Always specify exact National/Provincial Highways (e.g., N-5 GT Road, N-35 KKH, N-15 Mansehra-Naran-Jalkhad Road, S-1 Skardu Road, N-45 Dir-Chitral Road, N-95 Swat Highway).
6. 4-PILLAR DAY BREAKDOWN:
   Every day in \`days[]\` MUST include all 4 biker pillars:
   - Pillar 1 (\`highwayCorridor\`): Exact highway/road codes & names used that day.
   - Pillar 2 (\`checkpoints\` & \`highlights\`): Ordered en-route towns, lakes, viewpoints, or passes with approximate km progression from that day's start.
   - Pillar 3 (\`roadSurface\` & \`bikeAdvisory\`): Surface condition (% paved asphalt vs gravel/broken/water crossings) and specific handling advice for the rider's bike type.
   - Pillar 4 (\`fuelStops\`, \`fuelWarning\`, \`mechanicHub\`, \`mobileSignal\`): Exact town names for fuel, nearest mechanic bazaar, and which mobile network works (e.g., "4G All Networks till Balakot; Telenor/SCOM in Naran" or "SCOM 4G only in GB").

FUEL GAP KNOWLEDGE (Always enforce when route crosses these stretches):
${CRITICAL_FUEL_GAPS.map((g) => `- ${g.route} (${g.gapKm}km gap, last: ${g.lastFuelPoint} -> next: ${g.nextFuelPoint}): ${g.warning}`).join('\n')}

OUTPUT FORMAT — Respond ONLY with valid JSON matching this exact structure (no markdown fences or extra text outside JSON):
{
  "tripTitle": "string — e.g. Islamabad to Naran & Kaghan Alpine Expedition",
  "totalDays": number,
  "recommendedDays": number,
  "pacingAdvisory": "string or null — if user picked too many or too few days, explain how days were allocated (e.g. 'Direct ride is 265 km (2 days); Days 3–7 are dedicated to Lake Saif-ul-Malook, Shogran/Siri Paye, Lalazar & Kunhar Valley excursions.')",
  "totalDistanceKm": number,
  "totalDurationHrs": number,
  "startPoint": "string",
  "endPoint": "string",
  "primaryCorridor": "string — e.g. N-5 GT Road → N-35 KKH → N-15 Kaghan Highway",
  "weatherSummary": "string — current destination weather & temperature for ${month}",
  "bestMonths": "string — concise ideal window (max 4–6 words, e.g. 'May to October')",
  "passStatuses": [
    {
      "name": "string — e.g. Babusar Pass (N-15)",
      "altitudeM": number,
      "status": "OPEN | CLOSED | CAUTION",
      "reason": "string — why it is open/closed in ${month} + live condition",
      "alternativeCorridor": "string or null — bypass route if closed"
    }
  ],
  "warnings": ["array of critical trip-level warnings"],
  "days": [
    {
      "day": number,
      "title": "string — e.g. Day 1: Islamabad to Balakot & Shogran Detour",
      "distanceKm": number,
      "durationHrs": number,
      "startLocation": "string — exact town name",
      "endLocation": "string — exact town name",
      "highwayCorridor": "string — e.g. N-5 → N-35 (Abbottabad–Mansehra) → N-15",
      "altitudeM": number,
      "altitudeLevel": "LOW | MID | HIGH | EXTREME",
      "roadSurface": "string — e.g. 85% Paved Asphalt, 15% Steep Concrete Hairpins (Kewai–Shogran)",
      "bikeAdvisory": "string — specific tip for rider's bike on this leg",
      "checkpoints": [
        {
          "name": "string — specific town, viewpoint, lake or waterfall",
          "kmFromStart": number,
          "type": "town | viewpoint | lake | pass | fuel",
          "note": "string — 1 short phrase on what to see/do here"
        }
      ],
      "highlights": ["array of 3–4 specific named viewpoints/lakes/attractions on this day"],
      "fuelStops": ["array of specific fuel station towns on this leg"],
      "fuelWarning": "string or null — specific fuel gap warning if applicable",
      "mechanicHub": "string — nearest town bazaar with motorcycle mechanic & parts",
      "mobileSignal": "string — e.g. 4G (Jazz/Zong/Telenor) in towns; SCOM/Telenor in upper valley",
      "sleepLocation": "string — specific basecamp town & area recommendation",
      "warnings": ["specific hazards on this day"],
      "tips": "string — concrete rider tip for this day"
    }
  ],
  "gearChecklist": ["array of 6–8 essential gear items tailored to bike & ${month} weather"],
  "permits": ["list of NOC/park permits required"],
  "emergencyContacts": ["3–5 specific hospital, Rescue 1122 & mechanic contacts for this route"]
}`;
}

// ─── User Message Builder ────────────────────────────────────────────────────
/**
 * Build the user-turn message injecting all live API data from ORS, Overpass, and Open-Meteo.
 */
export function buildUserMessage(
  tripParams,
  routeData,
  weatherData,
  elevations,
  routePOIs,
  evaluatedPasses
) {
  const sections = [];

  // ── 1. Trip Parameters ──
  sections.push(`TRIP REQUEST:
- Start City: ${tripParams.from}
- Destination: ${tripParams.to}
- Requested Duration: ${tripParams.days === 'Auto' ? 'Auto (Recommend optimal days)' : `${tripParams.days} Days`}
- Travel Month: ${tripParams.month}
- Motorcycle Type: ${tripParams.bikeType}
- Rider Experience Level: ${tripParams.expLevel}`);

  // ── 2. Live ORS Road & Distance Data ──
  if (routeData) {
    const roadList =
      routeData.stepSummaries && routeData.stepSummaries.length > 0
        ? routeData.stepSummaries.map((s) => `${s.road} (${s.distanceKm} km)`).join(' → ')
        : routeData.roadNames?.join(' → ') || 'National Highway Corridor';

    let elevProfileText = '';
    if (elevations && elevations.length > 0) {
      const maxElev = Math.max(...elevations);
      const minElev = Math.min(...elevations);
      elevProfileText = `\n- Live Elevation Profile along route points (m): ${elevations.join('m → ')}m (Min: ${minElev}m, Peak: ${maxElev}m)`;
    }

    sections.push(`LIVE OPENROUTESERVICE (ORS) ROAD DATA (Motorways Excluded):
- Direct One-Way Highway Distance: ${routeData.totalDistanceKm} km
- Baseline Continuous Riding Time: ${routeData.totalDurationHrs} hours
- Detected Highway / Road Segments: ${roadList}${elevProfileText}`);
  }

  // ── 3. Live Overpass OSM Towns, Viewpoints, Lakes & Infrastructure ──
  if (routePOIs) {
    const towns = routePOIs.enRouteTowns?.length
      ? routePOIs.enRouteTowns.join(' → ')
      : 'Use verified highway towns along route';
    const viewpoints = routePOIs.enRouteViewpoints?.length
      ? routePOIs.enRouteViewpoints.map((v) => `${v.formatted} (~${v.distFromOriginKm}km from start)`).join(', ')
      : 'Include real named viewpoints and lakes along route';
    const destSpots = routePOIs.destAttractions?.length
      ? routePOIs.destAttractions.join(', ')
      : 'Include real named lakes, meadows, and viewpoints around destination';
    const fuel = routePOIs.fuelStations?.length
      ? routePOIs.fuelStations.join(', ')
      : 'Major town PSO/Attock pumps';
    const medical = routePOIs.hospitals?.length
      ? routePOIs.hospitals.join(', ')
      : 'District HQ Hospitals along route';
    const mechanics = routePOIs.mechanics?.length
      ? routePOIs.mechanics.join(', ')
      : 'Main town bazaar motorcycle workshops';

    sections.push(`LIVE OPENSTREETMAP (OVERPASS) DISCOVERED PLACES ALONG ROUTE:
- En-Route Intermediate Towns (ordered): ${towns}
- Live Discovered En-Route Viewpoints, Lakes & Waterfalls: ${viewpoints}
- Live Discovered Destination-Area Lakes & Attractions: ${destSpots}
- Mapped Fuel Stations along route: ${fuel}
- Mapped Hospitals / Clinics along route: ${medical}
- Mapped Motorcycle Mechanics: ${mechanics}`);
  }

  // ── 4. Evaluated Pass Statuses ──
  if (evaluatedPasses && evaluatedPasses.length > 0) {
    sections.push(`PASS STATUS EVALUATION FOR ${tripParams.month.toUpperCase()}:
${evaluatedPasses
  .map(
    (p) =>
      `- ${p.name} (${p.altitudeM}m): ${p.status} — ${p.reason}${
        p.alternativeCorridor ? ` | Bypass: ${p.alternativeCorridor}` : ''
      }`
  )
  .join('\n')}`);
  }

  // ── 5. Live Open-Meteo Weather ──
  if (weatherData) {
    sections.push(`LIVE OPEN-METEO WEATHER AT DESTINATION:
- Current Temp: ${weatherData.tempC}°C (Daily Range: ${weatherData.minTempC}°C to ${weatherData.maxTempC}°C)
- Condition: ${weatherData.condition}
- Wind: ${weatherData.windKmh} km/h | Precipitation: ${weatherData.precipMm} mm
${weatherData.isAlert ? `- ⚠️ ACTIVE ALERT: ${weatherData.alertText}` : '- No immediate severe precipitation alert.'}`);
  }

  // ── 6. Regional Emergency Contacts ──
  const relevantContacts = getRelevantEmergencyContacts(tripParams.from, tripParams.to);
  if (relevantContacts.length > 0) {
    sections.push(`VERIFIED REGIONAL EMERGENCY & MECHANIC CONTACTS:
${relevantContacts
  .map(
    (c) =>
      `- [${c.region} ${c.type.toUpperCase()}] ${c.name}${
        c.contact ? ` (${c.contact})` : ''
      } — ${c.note}`
  )
  .join('\n')}`);
  }

  // ── 7. Final Synthesis Instructions ──
  sections.push(`FINAL SYNTHESIS INSTRUCTIONS:
1. Ground your entire itinerary in the LIVE ORS distance (${routeData?.totalDistanceKm ? `${routeData.totalDistanceKm} km baseline one-way` : 'real road distance'}) and the LIVE OVERPASS towns, viewpoints, and lakes listed above.
2. Every day MUST have 3 to 5 specific, real entries in \`checkpoints[]\` showing the rider's progression (Towns, Viewpoints, Lakes, Waterfalls, Fuel stops, or Passes) with realistic \`kmFromStart\` numbers for that day.
3. If the user requested more days than needed for the direct one-way transit (e.g. 7 days for a ~265 km route like Islamabad to Naran), use Days 1–2 for a scenic transit (including en-route detours like Abbottabad, Balakot, Kewai Waterfall, Shogran/Siri Paye) and dedicate Days 3+ to specific named day-rides/excursions around the destination (e.g. Lake Saif-ul-Malook, Batakundi & Lalazar Plateau, Jalkhad & Lulusar Lake / Babusar Top if open, or lower Kunhar River / Kaghan valleys if winter snow blocks high passes). Sum \`totalDistanceKm\` as the sum of all daily distances (transit + daily excursions).
4. Tailor \`bikeAdvisory\` to ${tripParams.bikeType} (${tripParams.expLevel} rider) — e.g. for 125cc/150cc warn about clutch fade, carburetor power loss above 3,000m, and low-gear climbs.
5. Return ONLY the raw JSON object.`);

  return sections.join('\n\n');
}

// ─── Helper: Filter emergency contacts relevant to this route ────────────────
export function getRelevantEmergencyContacts(from, to) {
  const routeText = `${from} ${to}`.toLowerCase();

  const relevantRegions = [];
  if (
    routeText.includes('gilgit') ||
    routeText.includes('hunza') ||
    routeText.includes('khunjerab') ||
    routeText.includes('passu') ||
    routeText.includes('karimabad') ||
    routeText.includes('nagar') ||
    routeText.includes('fairy')
  ) {
    relevantRegions.push('Gilgit');
  }
  if (
    routeText.includes('skardu') ||
    routeText.includes('deosai') ||
    routeText.includes('shigar') ||
    routeText.includes('khaplu')
  ) {
    relevantRegions.push('Skardu');
  }
  if (
    routeText.includes('naran') ||
    routeText.includes('kaghan') ||
    routeText.includes('babusar') ||
    routeText.includes('shogran') ||
    routeText.includes('balakot')
  ) {
    relevantRegions.push('Naran', 'Mansehra');
  }
  if (routeText.includes('chilas') || routeText.includes('diamer') || routeText.includes('astore')) {
    relevantRegions.push('Chilas');
  }
  if (
    routeText.includes('chitral') ||
    routeText.includes('shandur') ||
    routeText.includes('lowari') ||
    routeText.includes('kalash') ||
    routeText.includes('kumrat')
  ) {
    relevantRegions.push('Chitral');
  }
  if (
    routeText.includes('islamabad') ||
    routeText.includes('rawalpindi') ||
    routeText.includes('pindi')
  ) {
    relevantRegions.push('Rawalpindi');
  }

  if (!relevantRegions.includes('Mansehra') && !relevantRegions.includes('Besham')) {
    relevantRegions.push('Mansehra', 'Besham');
  }

  return EMERGENCY_CONTACTS.filter((c) => relevantRegions.includes(c.region));
}
