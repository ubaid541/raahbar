import { GoogleGenAI } from '@google/genai';
import {
  getSystemPrompt,
  buildUserMessage,
  evaluateRoutePasses,
  getRelevantEmergencyContacts,
} from './prompts.js';
import {
  geocodeLocation,
  getRouteSegments,
  getWeather,
  getElevations,
  getRoutePOIsAndInfrastructure,
} from './routing.js';
import { CRITICAL_FUEL_GAPS } from '../constants.ts';

// ─── AI Model Configuration ──────────────────────────────────────────────────
// HELD / DISABLED PREVIOUS OPENROUTER MODELS (Per MVP v1 requirement):
// const HELD_OPENROUTER_MODELS = [
//   'stepfun/step-3.5-flash',
//   'meta-llama/llama-3.3-70b-instruct',
//   'google/gemini-2.0-flash-001',
// ];

// Official Free Gemini Models (tried without search tool to avoid free-tier 429 quota block)
const GEMINI_FREE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
];

// OpenRouter active free router fallback
const OPENROUTER_FREE_GEMINI = 'openrouter/free';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Call Official Google Gemini API (@google/genai) without search-tool overhead
 * so free-tier requests stay within quota.
 */
async function callOfficialGemini(systemPrompt, userMessage, signal) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('Official GEMINI_API_KEY not configured in .env yet');
  }

  const ai = new GoogleGenAI({ apiKey });
  let lastError = null;

  for (const modelName of GEMINI_FREE_MODELS) {
    if (signal?.aborted) {
      const abortErr = new Error('Aborted');
      abortErr.name = 'AbortError';
      throw abortErr;
    }

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.4,
        },
      });

      if (signal?.aborted) {
        const abortErr = new Error('Aborted');
        abortErr.name = 'AbortError';
        throw abortErr;
      }

      const text = response?.text;
      if (text) {
        return { text, modelUsed: modelName };
      }
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      lastError = err;
      console.warn(`[AI] Gemini (${modelName}) unavailable:`, err.message);
    }
  }

  throw lastError || new Error('All official Gemini free models failed');
}

/**
 * Secondary free fallback via OpenRouter (`openrouter/free`) if official Gemini
 * quota is exhausted or key is missing.
 */
async function callOpenRouterFreeFallback(systemPrompt, userMessage, signal) {
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!openRouterKey) {
    throw new Error('VITE_OPENROUTER_API_KEY is missing');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://raahbar.pk',
      'X-Title': 'RaahBar Expedition Planner',
    },
    body: JSON.stringify({
      model: OPENROUTER_FREE_GEMINI,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter (${OPENROUTER_FREE_GEMINI}) returned ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

/**
 * Parse and normalize the itinerary JSON returned by AI, ensuring all
 * 4 biker pillars and pass statuses are populated.
 */
function normalizeItinerary(parsed, tripParams, routeData, weatherData, evaluatedPasses) {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid itinerary JSON');
  }

  if (Array.isArray(evaluatedPasses) && evaluatedPasses.length > 0) {
    const allowedKeys = evaluatedPasses.map((ep) => ep.name.toLowerCase().split(' ')[0]);
    const filtered = (parsed.passStatuses || []).filter((ps) => {
      const psName = String(ps?.name || '').toLowerCase();
      return allowedKeys.some((k) => psName.includes(k));
    });
    parsed.passStatuses = filtered.length > 0 ? filtered : evaluatedPasses;
  } else if (!Array.isArray(parsed.passStatuses)) {
    parsed.passStatuses = [];
  }

  if (!parsed.primaryCorridor) {
    parsed.primaryCorridor =
      routeData?.roadNames?.slice(0, 4).join(' → ') || 'National Highway Corridor';
  }

  if (Array.isArray(parsed.days) && parsed.days.length > 0) {
    const sumDailyKm = Math.round(
      parsed.days.reduce((acc, d) => acc + (Number(d.distanceKm) || 0), 0)
    );
    const sumDailyHrs =
      Math.round(parsed.days.reduce((acc, d) => acc + (Number(d.durationHrs) || 0), 0) * 10) / 10;
    if (sumDailyKm > 0) {
      parsed.totalDistanceKm = sumDailyKm;
    } else if (!parsed.totalDistanceKm) {
      parsed.totalDistanceKm = routeData?.totalDistanceKm || 250;
    }
    if (sumDailyHrs > 0) {
      parsed.totalDurationHrs = sumDailyHrs;
    } else if (!parsed.totalDurationHrs) {
      parsed.totalDurationHrs = routeData?.totalDurationHrs || 6;
    }
    parsed.totalDays = parsed.days.length;
  }

  if (!parsed.weatherSummary && weatherData?.condition) {
    parsed.weatherSummary = `${weatherData.condition}, ${weatherData.tempC}°C (Low ${weatherData.minTempC}°C / High ${weatherData.maxTempC}°C)`;
  }

  parsed.riderProfile = {
    bikeType: tripParams.bikeType,
    expLevel: tripParams.expLevel,
    month: tripParams.month,
    requestedDays: tripParams.days,
  };

  return parsed;
}

/**
 * Live-Data Grounded Synthesizer (Deterministic backup when live AI quota is exhausted).
 * Uses real ORS road distances, clean ORS highway names, real Open-Meteo elevations,
 * real Overpass viewpoints/lakes/towns, and verified regional excursions.
 */
function createLiveGroundedItinerary(
  tripParams,
  routeData = null,
  weatherData = null,
  elevations = null,
  routePOIs = null,
  evaluatedPasses = []
) {
  const from = (tripParams.from || 'Islamabad').trim();
  const to = (tripParams.to || 'Naran').trim();
  const month = tripParams.month || 'July';
  const bikeType = tripParams.bikeType || '150cc';
  const expLevel = tripParams.expLevel || 'Intermediate';

  const routeKey = `${from} ${to}`.toLowerCase();
  const isWinter = ['November', 'December', 'January', 'February', 'March', 'April'].some(
    (m) => m.toLowerCase() === month.toLowerCase()
  );

  // Real baseline distance & duration from ORS (or realistic regional calculation)
  const directDistKm = routeData?.totalDistanceKm || estimateRealisticDistanceKm(from, to);
  const directDurHrs =
    routeData?.totalDurationHrs || Math.round((directDistKm / 38) * 10) / 10;

  const maxDailyTransitKm = bikeType === '125cc' ? 160 : bikeType === '150cc' ? 190 : 240;
  const transitDaysNeeded = Math.max(1, Math.ceil(directDistKm / maxDailyTransitKm));
  const recommendedDays = Math.min(Math.max(transitDaysNeeded + 2, 3), 10);

  const totalDays =
    String(tripParams.days).toLowerCase() === 'auto'
      ? recommendedDays
      : parseInt(tripParams.days, 10) || recommendedDays;

  // Clean road names from ORS merged with verified regional highways
  const regionalHighways = getRegionalHighways(routeKey, isWinter);
  const detectedRoads =
    routeData?.roadNames?.length > 0
      ? Array.from(new Set([...routeData.roadNames.slice(0, 4), ...regionalHighways.slice(0, 2)]))
      : regionalHighways;
  const primaryCorridor = detectedRoads.join(' → ');

  // Discover real intermediate towns & viewpoints from Overpass + regional supplements
  const regionalData = getRegionalWaypointsAndExcursions(from, to, isWinter, routePOIs);
  const transitTowns = regionalData.transitTowns;
  const enRouteStops = regionalData.enRouteStops;
  const destExcursions = regionalData.destExcursions;

  // Cap transit days so we never run out of real intermediate towns or repeat filler days
  const maxTransitCap = directDistKm < 450 ? 2 : regionalData.transitTowns.length;
  const actualTransitDays = Math.max(
    1,
    Math.min(
      transitDaysNeeded,
      maxTransitCap,
      regionalData.transitTowns.length,
      totalDays > 1 ? totalDays - 1 : 1
    )
  );
  const excursionDaysCount = Math.max(0, totalDays - actualTransitDays);

  let pacingAdvisory = null;
  if (excursionDaysCount >= 2) {
    pacingAdvisory = `Direct one-way ride from ${from} to ${to} is ${directDistKm} km (${actualTransitDays} transit ${
      actualTransitDays === 1 ? 'day' : 'days'
    }). Days ${actualTransitDays + 1}–${totalDays} are structured as dedicated regional excursions covering specific lakes, meadows, and viewpoints around ${to}.`;
  } else if (totalDays < transitDaysNeeded) {
    pacingAdvisory = `Warning: ${directDistKm} km in ${totalDays} ${
      totalDays === 1 ? 'day' : 'days'
    } requires heavy saddle hours for a ${bikeType}. Recommended duration for this route is ${recommendedDays} days.`;
  }

  const daysList = [];

  // ── Build Transit Days (Days 1 .. actualTransitDays) ──
  for (let i = 1; i <= actualTransitDays; i++) {
    const isFirstTransit = i === 1;
    const isLastTransit = i === actualTransitDays;

    const startTown = isFirstTransit ? from : transitTowns[i - 2];
    const endTown = isLastTransit ? to : transitTowns[i - 1];

    // Weight Day 1 vs Day 2 distance realistically (e.g. ~68% to gateway town, ~32% final mountain climb)
    const legShare =
      actualTransitDays === 1
        ? 1
        : actualTransitDays === 2
        ? isFirstTransit
          ? 0.68
          : 0.32
        : 1 / actualTransitDays;
    const legDist = Math.round(directDistKm * legShare);
    const legDur = Math.round(directDurHrs * legShare * 10) / 10;

    const elevIdx =
      elevations && elevations.length > 0
        ? Math.min(Math.floor((i / actualTransitDays) * (elevations.length - 1)), elevations.length - 1)
        : -1;
    const dayAlt =
      elevIdx >= 0 ? elevations[elevIdx] : isLastTransit ? regionalData.destAltitudeM : 1450;

    // Distribute en-route stops evenly across transit days
    const stopsPerDay = Math.ceil(enRouteStops.length / actualTransitDays);
    const dayStops = enRouteStops.slice((i - 1) * stopsPerDay, i * stopsPerDay);

    const checkpoints = [
      {
        name: startTown,
        kmFromStart: 0,
        type: 'fuel',
        note: `Top up fuel tank and check tire pressure before departing ${startTown}.`,
      },
      ...dayStops.map((stop, idx) => ({
        name: stop.name,
        kmFromStart: Math.round(((idx + 1) / (dayStops.length + 1)) * legDist),
        type: stop.type || 'viewpoint',
        note: stop.note,
      })),
      {
        name: endTown,
        kmFromStart: legDist,
        type: 'town',
        note: `Overnight basecamp arrival at ${endTown}.`,
      },
    ];

    const legConfig =
      regionalData.transitLegs?.[i - 1] || {
        corridor: primaryCorridor,
        fuelStops: regionalData.fuelTowns.slice(0, 3),
        fuelWarning: isLastTransit ? regionalData.fuelWarning : null,
        tip: `Maintain steady RPM on climbs toward ${endTown} and use engine braking on descents.`,
      };

    daysList.push({
      day: i,
      title: `Day ${i}: ${startTown} to ${endTown}`,
      distanceKm: legDist,
      durationHrs: legDur,
      startLocation: startTown,
      endLocation: endTown,
      highwayCorridor: legConfig.corridor,
      altitudeM: dayAlt,
      altitudeLevel: getAltitudeLevel(dayAlt),
      roadSurface: legConfig.roadSurface || regionalData.transitSurface,
      bikeAdvisory: getBikeAdvisory(bikeType, expLevel, dayAlt, false),
      checkpoints,
      highlights: dayStops.map((s) => `${s.name} — ${s.note}`).slice(0, 4),
      fuelStops: legConfig.fuelStops,
      fuelWarning: legConfig.fuelWarning,
      mechanicHub: legConfig.mechanicHub || regionalData.mechanicHub,
      mobileSignal: legConfig.mobileSignal || regionalData.mobileSignal,
      sleepLocation: `${endTown} (${regionalData.sleepArea})`,
      warnings:
        isWinter && dayAlt >= 2000
          ? [`Sub-zero night temperatures in ${month}; depart after 8:30 AM to avoid black ice.`]
          : dayAlt >= 3000
          ? [`High altitude (${dayAlt}m) — monitor ${bikeType} throttle response and stay hydrated.`]
          : [],
      tips: legConfig.tip,
    });
  }

  // ── Build Destination & Side-Valley Excursion Days ──
  for (let e = 0; e < excursionDaysCount; e++) {
    const dayNum = actualTransitDays + e + 1;
    const exc = destExcursions[e % destExcursions.length];

    daysList.push({
      day: dayNum,
      title: `Day ${dayNum}: ${exc.title}`,
      distanceKm: exc.distanceKm,
      durationHrs: exc.durationHrs,
      startLocation: exc.startLocation || to,
      endLocation: exc.endLocation || to,
      highwayCorridor: exc.corridor,
      altitudeM: exc.altitudeM,
      altitudeLevel: getAltitudeLevel(exc.altitudeM),
      roadSurface: exc.roadSurface,
      bikeAdvisory: getBikeAdvisory(bikeType, expLevel, exc.altitudeM, exc.isSteep),
      checkpoints: exc.checkpoints,
      highlights: exc.highlights,
      fuelStops: [`${to} Main Petrol Pump (Fill before excursion)`],
      fuelWarning: exc.fuelWarning || null,
      mechanicHub: regionalData.mechanicHub,
      mobileSignal: exc.mobileSignal || regionalData.mobileSignal,
      sleepLocation: `${to} (${regionalData.sleepArea})`,
      warnings: exc.warnings || [],
      tips: exc.tip,
    });
  }

  const totalDistanceKm = daysList.reduce((sum, d) => sum + d.distanceKm, 0);
  const totalDurationHrs =
    Math.round(daysList.reduce((sum, d) => sum + d.durationHrs, 0) * 10) / 10;

  const globalWarnings = [];
  if (isWinter) {
    globalWarnings.push(
      `${month} Winter Advisory: High-altitude passes above 3,500m (such as Babusar Top & Deosai) are snowbound and closed. Do not attempt closed passes on a motorcycle.`
    );
  }
  if (bikeType === '125cc' || bikeType === '150cc') {
    globalWarnings.push(
      `${bikeType} Advisory: Keep a spare clutch wire, spark plug, and chain link. Give the air-cooled engine 15-minute cooling breaks on steep climbs.`
    );
  }
  if (weatherData?.isAlert && weatherData.alertText) {
    globalWarnings.push(weatherData.alertText);
  }

  const contacts = getRelevantEmergencyContacts(from, to).map(
    (c) => `${c.name} (${c.region})${c.contact ? ` — Tel: ${c.contact}` : ''} · ${c.note}`
  );

  return {
    tripTitle: `${from} to ${to} Expedition & Valley Explorer`,
    totalDays,
    recommendedDays,
    pacingAdvisory,
    totalDistanceKm,
    totalDurationHrs,
    startPoint: from,
    endPoint: to,
    primaryCorridor,
    weatherSummary: weatherData?.condition
      ? `${weatherData.condition}, ${weatherData.tempC}°C (Low ${weatherData.minTempC}°C / High ${weatherData.maxTempC}°C)`
      : `Mountain weather typical for ${month}`,
    bestMonths: 'May to October (Peak Alpine Window)',
    passStatuses: evaluatedPasses,
    warnings: globalWarnings,
    days: daysList,
    gearChecklist: [
      'DOT/ECE Full-Face Helmet with Anti-Fog Visor',
      isWinter
        ? 'Heavy Thermal Base Layers & Windproof Riding Jacket'
        : 'Armored Mesh/Textile Riding Jacket & Gloves',
      'Waterproof Rain Suit & Waterproof Boot Covers',
      `Spare Clutch Cable, Accelerator Cable & Spark Plug for ${bikeType}`,
      'Portable Tyre Inflator & Puncture Repair Kit',
      '5L Safety Jerry Can (for mountain stretches)',
      'First Aid Kit, ORS Packets & Diamox (Altitude Support)',
    ],
    permits: [
      'Original CNIC + 4 Photocopies (for Police Checkpoints)',
      'Motorcycle Registration Card & Driving License',
      'SCOM SIM Card (Mandatory for mobile signal in Kaghan/GB)',
    ],
    emergencyContacts:
      contacts.length > 0
        ? contacts
        : ['Rescue 1122 Emergency Helpline — Dial 1122', 'NHMP Highway Helpline — Dial 130'],
    riderProfile: {
      bikeType,
      expLevel,
      month,
      requestedDays: tripParams.days,
    },
  };
}

// ─── Regional Helpers for Live-Grounded Fallback ─────────────────────────────
function estimateRealisticDistanceKm(from, to) {
  const key = `${from} ${to}`.toLowerCase();
  if (key.includes('khunjerab')) return 780;
  if (key.includes('skardu')) return 620;
  if (key.includes('hunza') || key.includes('karimabad') || key.includes('passu')) return 610;
  if (key.includes('gilgit')) return 510;
  if (key.includes('chitral') || key.includes('kalash')) return 395;
  if (key.includes('naran') || key.includes('kaghan')) return 275;
  if (key.includes('kalam') || key.includes('swat')) return 310;
  if (key.includes('kel') || key.includes('neelum') || key.includes('taobat')) return 290;
  return 320;
}

function getRegionalHighways(routeKey, isWinter) {
  if (routeKey.includes('naran') || routeKey.includes('kaghan') || routeKey.includes('babusar')) {
    return ['N-5 (GT Road)', 'N-35 (KKH: Hasan Abdal–Mansehra)', 'N-15 (Kaghan Highway)'];
  }
  if (routeKey.includes('hunza') || routeKey.includes('gilgit') || routeKey.includes('khunjerab')) {
    return isWinter
      ? ['N-5 (GT Road)', 'N-35 (KKH via Abbottabad, Besham, Dasu, Chilas & Gilgit)']
      : ['N-35 (Abbottabad–Mansehra)', 'N-15 (Naran & Babusar Pass)', 'N-35 (KKH Chilas–Gilgit–Hunza)'];
  }
  if (routeKey.includes('skardu') || routeKey.includes('deosai')) {
    return isWinter
      ? ['N-35 (KKH via Besham & Chilas)', 'S-1 (Jaglot–Skardu Highway)']
      : ['N-15 (Naran–Babusar Pass)', 'N-35 (Chilas–Jaglot)', 'S-1 (Skardu Highway)'];
  }
  if (routeKey.includes('chitral') || routeKey.includes('kalash')) {
    return ['N-5 (Nowshera)', 'N-45 (Mardan–Dir–Lowari Tunnel–Chitral)'];
  }
  return ['N-5 (GT Road)', 'N-35 (Karakoram Highway)'];
}

function getAltitudeLevel(m) {
  if (m >= 4000) return 'EXTREME';
  if (m >= 2800) return 'HIGH';
  if (m >= 1600) return 'MID';
  return 'LOW';
}

function getBikeAdvisory(bikeType, expLevel, altitudeM, isSteep) {
  if (bikeType === '125cc' || bikeType === '150cc') {
    if (altitudeM >= 3000 || isSteep) {
      return `${bikeType} loses ~20% power above 3,000m. Ascend in 1st/2nd gear, avoid riding the clutch on hairpins, and take a 15-min cooling stop every 25 km.`;
    }
    return `Keep ${bikeType} chain lubricated and tire pressure at 28/32 PSI for mixed mountain asphalt.`;
  }
  return `${bikeType} handles this gradient comfortably; watch for gravel washouts around blind mountain bends (${expLevel} pacing).`;
}

function getRegionalWaypointsAndExcursions(from, to, isWinter, routePOIs) {
  const key = `${from} ${to}`.toLowerCase();

  const liveSpots = (routePOIs?.enRouteViewpoints || []).map((v) => ({
    name: v.name,
    type: v.category.toLowerCase().includes('lake') ? 'lake' : 'viewpoint',
    note: `Live mapped ${v.category} along route (~${v.distFromOriginKm} km from ${from})`,
  }));

  if (key.includes('naran') || key.includes('kaghan') || key.includes('shogran') || key.includes('babusar')) {
    return {
      destAltitudeM: 2409,
      transitTowns: ['Balakot / Shogran', 'Naran'],
      transitSurface: '85% Paved Asphalt (N-35 & N-15), 15% Mountain Hairpins & Glacier Water Crossings',
      fuelTowns: ['Hasan Abdal PSO', 'Mansehra PSO', 'Balakot Attock Pump', 'Naran Main Pump'],
      fuelWarning: CRITICAL_FUEL_GAPS[2].warning,
      mechanicHub: 'Mansehra Main Adda, Balakot Bazaar & Naran Bypass Workshops',
      mobileSignal: '4G (Jazz/Zong/Telenor) up to Balakot; Telenor & SCOM work best in Kaghan/Naran.',
      sleepArea: 'Kunhar River Road / PTDC Colony Area',
      transitLegs: [
        {
          corridor: 'N-5 (GT Road) → N-35 (KKH: Hasan Abdal–Abbottabad–Mansehra) → N-15 (Balakot)',
          roadSurface: '95% Paved National Highway (N-5 & N-35), bypassing M-1/M-15 Motorways',
          fuelStops: [`${from} / Taxila PSO`, 'Abbottabad / Mansehra PSO', 'Balakot Attock Pump'],
          fuelWarning: 'Fill tank completely at Mansehra or Balakot before climbing into Kaghan Gorge.',
          mechanicHub: 'Taxila Chowk, Abbottabad Supply Bazaar & Balakot Main Adda',
          mobileSignal: 'Full 4G (Jazz, Zong, Telenor, Ufone) throughout Hazara & Balakot.',
          tip: 'Use GT Road (N-5) via Taxila & Haripur instead of Hazara Motorway (M-15), where motorcycles are restricted.',
        },
        {
          corridor: 'N-15 (Mansehra–Naran–Jalkhad Highway: Balakot → Kewai → Kaghan → Naran)',
          roadSurface: '80% Paved Mountain Asphalt, 20% Cliff Bends & Seasonal Glacier Melt Channels',
          fuelStops: ['Balakot Attock Pump', 'Kaghan Bazaar Station', 'Naran Main Pump'],
          fuelWarning: isWinter
            ? `Naran pumps carry limited winter fuel in ${isWinter ? 'November' : 'winter'} — top up full at Balakot + carry 2L reserve.`
            : CRITICAL_FUEL_GAPS[2].warning,
          mechanicHub: 'Balakot Bazaar & Naran Main Bypass (puncture & basic tune-up)',
          mobileSignal: 'Telenor & SCOM work reliably in Kaghan/Naran; Jazz/Zong drop between Kewai and Kaghan.',
          tip: 'Stop at Kewai Waterfall en route, keep to the mountain-side lane on blind N-15 curves, and arrive in Naran before 4 PM.',
        },
      ],
      enRouteStops: [
        { name: 'Taxila Museum & Haripur Bypass (N-35)', type: 'viewpoint', note: 'Historic Gandhara corridor & Hazara orchards en route' },
        { name: 'Abbottabad Pine Avenue & Ilyasi Mosque', type: 'town', note: 'Scenic pine climb & famous pakora/tea stop on N-35' },
        { name: 'Mansehra & Attar Shisha Crossing', type: 'town', note: 'Transition from N-35 KKH onto N-15 Kaghan Valley Highway' },
        { name: 'Balakot & Kunhar River Bridge', type: 'viewpoint', note: 'Gateway to Kaghan Valley; major mechanic & PSO fuel hub' },
        { name: 'Kewai Waterfall (N-15)', type: 'viewpoint', note: 'Roadside cascade & junction for Shogran climb (24 km after Balakot)' },
        { name: 'Kaghan Town & Mahandri Confluence', type: 'viewpoint', note: 'Manoor Valley junction & roaring Kunhar trout rapids' },
        ...liveSpots.slice(0, 3),
      ],
      destExcursions: [
        {
          title: 'Lake Saif-ul-Malook Alpine Ascent (3,224m)',
          distanceKm: 22,
          durationHrs: 2.5,
          startLocation: 'Naran',
          endLocation: 'Lake Saif-ul-Malook',
          corridor: 'Saif-ul-Malook Glacier Track',
          altitudeM: 3224,
          isSteep: true,
          roadSurface: '20% Paved, 80% Steep Rocky Jeep Track & Glacier Melt Stream Crossings',
          checkpoints: [
            { name: 'Naran Bazaar Checkpoint', kmFromStart: 0, type: 'town', note: 'Start early at 7:00 AM before jeep traffic' },
            { name: 'Katha Glacier Stream Crossing', kmFromStart: 5, type: 'viewpoint', note: 'Low-water morning crossing; deep in afternoon' },
            { name: 'Lake Saif-ul-Malook & Malika Parbat Viewpoint', kmFromStart: 11, type: 'lake', note: 'Iconic emerald alpine lake beneath Malika Parbat (5,290m)' },
          ],
          highlights: [
            'Lake Saif-ul-Malook (3,224m Alpine Glacial Lake)',
            'Malika Parbat Peak Reflection Point',
            'Ansoo Lake Base Viewpoint & Glacier Moraine',
          ],
          warnings: isWinter
            ? ['Track to Saif-ul-Malook is snowbound in November–April; ride/hike to snowline only or hire local 4x4 if cleared.']
            : ['Steep rocky track: 125cc/150cc riders without off-road experience should park at Naran and hire a 4x4 jeep.'],
          tip: 'Cross the glacier water channel before 11:00 AM when snowmelt water level is lowest.',
        },
        {
          title: 'Shogran Plateau & Siri Paye Meadows Excursion',
          distanceKm: 78,
          durationHrs: 3.5,
          startLocation: 'Naran',
          endLocation: 'Shogran',
          corridor: 'N-15 (Naran–Kewai) → Shogran Forest Road',
          altitudeM: 2895,
          isSteep: true,
          roadSurface: '75% Paved Highway, 25% Steep Concrete & Forest Track (Kewai to Shogran/Siri Paye)',
          checkpoints: [
            { name: 'Kewai Waterfall Junction', kmFromStart: 31, type: 'viewpoint', note: 'Turn left off N-15 onto the steep 8 km Shogran climb' },
            { name: 'Shogran Pine Plateau (2,362m)', kmFromStart: 39, type: 'viewpoint', note: 'Panoramic view of Musa ka Musalla & Makra Peak' },
            { name: 'Siri Lake & Paye Alpine Meadows (2,895m)', kmFromStart: 45, type: 'lake', note: 'High lush meadow overlooking Makra Peak (3,885m)' },
          ],
          highlights: [
            'Shogran Pine Forest Viewpoint',
            'Siri Lake & Paye Meadows (2,895m)',
            'Makra Peak & Musa ka Musalla Panorama',
          ],
          warnings: ['Very steep gradient from Kewai to Shogran — use 1st gear on 125cc/150cc and rest brakes on descent.'],
          tip: 'Check brake pads at Kewai before descending back to N-15.',
        },
        {
          title: 'Batakundi, Lalazar Plateau & Kunhar Trout Corridor',
          distanceKm: 48,
          durationHrs: 2.5,
          startLocation: 'Naran',
          endLocation: 'Batakundi',
          corridor: 'N-15 (Naran–Batakundi–Lalazar Track)',
          altitudeM: 3120,
          isSteep: true,
          roadSurface: '70% Paved N-15 Highway, 30% Unpaved Pine Forest Climb to Lalazar',
          checkpoints: [
            { name: 'Kunhar River Rafting & Trout Point', kmFromStart: 8, type: 'viewpoint', note: 'Scenic riverside viewpoint north of Naran' },
            { name: 'Batakundi Valley & Bridge', kmFromStart: 16, type: 'town', note: 'Last reliable fuel point & Dadar/Lalazar junction' },
            { name: 'Lalazar Alpine Meadow Viewpoint (3,120m)', kmFromStart: 24, type: 'viewpoint', note: 'Wildflower plateau overlooking Nanga Parbat & Babusar range' },
          ],
          highlights: [
            'Batakundi Bridge & Kunhar Valley Floor',
            'Lalazar Alpine Plateau (3,120m)',
            'Soch / Dadar Waterfall Viewpoint',
          ],
          warnings: isWinter
            ? ['Road beyond Batakundi toward Lalazar/Babusar may be closed by early snow in November.']
            : [],
          tip: 'Stop at Batakundi riverside dhabas for fresh Kunhar brown trout.',
        },
        {
          title: isWinter
            ? 'Kaghan Gorge, Manoor Valley Junction & Mahandri Day Ride'
            : 'Jalkhad, Lulusar Lake & Babusar Top Summit Ride (4,173m)',
          distanceKm: isWinter ? 64 : 135,
          durationHrs: isWinter ? 3.0 : 4.5,
          startLocation: 'Naran',
          endLocation: isWinter ? 'Kaghan' : 'Babusar Pass',
          corridor: 'N-15 (Mansehra–Naran–Jalkhad–Babusar Highway)',
          altitudeM: isWinter ? 2100 : 4173,
          isSteep: !isWinter,
          roadSurface: '95% Paved Mountain Asphalt with Hairpin Switchbacks',
          checkpoints: isWinter
            ? [
                { name: 'Kaghan Town Viewpoint', kmFromStart: 22, type: 'town', note: 'Pine gorge below the winter snowline' },
                { name: 'Mahandri & Manoor River Confluence', kmFromStart: 32, type: 'viewpoint', note: 'Dramatic turquoise river junction & trout hatchery' },
              ]
            : [
                { name: 'Burawai & Jalkhad Waterfall', kmFromStart: 40, type: 'viewpoint', note: 'Glacial valley floor & Noori Top junction' },
                { name: 'Lulusar Lake (3,410m)', kmFromStart: 50, type: 'lake', note: 'Largest natural deep-blue lake in Kaghan Valley' },
                { name: 'Babusar Pass Summit (4,173m)', kmFromStart: 68, type: 'pass', note: 'Boundary between KPK and Diamer (Gilgit-Baltistan)' },
              ],
          highlights: isWinter
            ? [
                'Mahandri River Confluence (Kaghan–Manoor)',
                'Lower Kunhar Gorge Cliff Road',
                'Khanian Riverside Pine Viewpoint',
              ]
            : [
                'Lulusar Lake Reflection Point (3,410m)',
                'Babusar Top Summit Monument (4,173m)',
                'Gitidas Meadow & Jalkhad Cascades',
              ],
          fuelWarning: !isWinter ? CRITICAL_FUEL_GAPS[2].warning : null,
          warnings: isWinter
            ? ['Babusar Pass & Lulusar Lake are CLOSED in November due to heavy snowfall — ride south into lower Kaghan/Manoor instead.']
            : ['High winds & freezing temperatures at Babusar Top (4,173m); descend before 3:00 PM.'],
          tip: isWinter
            ? 'Lower Kaghan & Mahandri stay warmer and snow-free when upper passes close.'
            : 'Do not stay at Babusar Top longer than 25 minutes to prevent acute mountain sickness.',
        },
        {
          title: 'Pyala Lake, Besal & Upper Kunhar Glacial Floor Ride',
          distanceKm: 85,
          durationHrs: 3.0,
          startLocation: 'Naran',
          endLocation: 'Jalkhad',
          corridor: 'N-15 Upper Kunhar Corridor',
          altitudeM: 3250,
          isSteep: false,
          roadSurface: '90% Paved Asphalt, 10% Seasonal Glacier Cuts',
          checkpoints: [
            { name: 'Sohni Waterfall (Near Batakundi)', kmFromStart: 19, type: 'viewpoint', note: 'Roadside glacial waterfall stop' },
            { name: 'Jalkhad & Pyala Lake (3,250m)', kmFromStart: 42, type: 'lake', note: 'Unique bowl-shaped crater lake beside N-15' },
          ],
          highlights: [
            'Pyala (Bowl) Crater Lake at Jalkhad',
            'Sohni Glacial Waterfall',
            'Burawai Alpine Valley Floor',
          ],
          warnings: isWinter
            ? ['Subject to snow clearance gate at Batakundi Police Checkpost in November.']
            : [],
          tip: 'Confirm road clearance with Naran Tourist Police before passing Batakundi barrier.',
        },
      ],
    };
  }

  // Generic Northern Corridor (Hunza, Skardu, Gilgit, Chitral, Swat, etc.) enriched with live Overpass data
  const liveViewpointsList =
    liveSpots.length > 0
      ? liveSpots
      : [
          { name: 'Abbottabad & Hazara Pine Corridor', type: 'viewpoint', note: 'Scenic mountain climb along N-35' },
          { name: 'Indus River Gorge Viewpoint (Besham/Dasu)', type: 'viewpoint', note: 'Dramatic Karakoram Highway canyon along the Indus' },
          { name: 'Nanga Parbat Viewpoint & Three Mountains Junction (Jaglot)', type: 'viewpoint', note: 'Confluence of Karakoram, Himalaya & Hindu Kush ranges' },
          { name: 'Rakaposhi Viewpoint (Ghulmet / Nagar)', type: 'viewpoint', note: 'Glacier view directly beside KKH (7,788m peak)' },
        ];

  return {
    destAltitudeM: 2450,
    transitTowns:
      routePOIs?.enRouteTowns?.slice(0, 3) || ['Besham / Dasu', 'Chilas / Jaglot', 'Gilgit'],
    transitSurface: '85% Paved National Highway, 15% Mountain Gorge Construction Zones',
    fuelTowns:
      routePOIs?.fuelStations?.slice(0, 4) || ['Abbottabad PSO', 'Besham Pump', 'Chilas PSO', 'Gilgit Jutial Pump'],
    fuelWarning: CRITICAL_FUEL_GAPS[0].warning,
    mechanicHub: 'Mansehra, Besham KKH Chowk, Chilas Bazaar & Gilgit Ittehad Chowk',
    mobileSignal: '4G in major KPK towns; SCOM SIM required across Gilgit-Baltistan.',
    sleepArea: 'Main Valley Guesthouse Hub',
    enRouteStops: liveViewpointsList,
    destExcursions: [
      {
        title: `${to} Iconic Lakes & Panoramic Viewpoints Loop`,
        distanceKm: 65,
        durationHrs: 3.0,
        startLocation: to,
        endLocation: to,
        corridor: `${to} Scenic Valley Corridor`,
        altitudeM: 2650,
        isSteep: false,
        roadSurface: '85% Paved Valley Road, 15% Gravel Viewpoint Access',
        checkpoints: [
          { name: `${to} Basecamp Departure`, kmFromStart: 0, type: 'town', note: 'Morning departure after bike check' },
          ...(routePOIs?.destAttractions || ['Attabad Lake / Upper Kachura Lake', 'Eagle Nest / Fort Viewpoint', 'Glacier Viewpoint'])
            .slice(0, 3)
            .map((spot, idx) => ({
              name: spot,
              kmFromStart: (idx + 1) * 18,
              type: 'viewpoint',
              note: `Signature scenic landmark near ${to}`,
            })),
        ],
        highlights:
          routePOIs?.destAttractions?.slice(0, 4) || [
            `${to} Historic Fort & Valley Panorama`,
            'Alpine Lake & Glacier Viewpoint',
            'Suspension Bridge & River Confluence',
          ],
        warnings: [],
        tip: 'Start by 8:00 AM for clear mountain photography before afternoon cloud cover.',
      },
    ],
  };
}

/**
 * Full Grounded Agent Pipeline:
 *  1. Geocode start & end via Verified Hubs + Nominatim
 *  2. Parallel live fetch: ORS GeoJSON route + Open-Meteo weather + Open-Meteo elevation + Fast Single-Batch Overpass query
 *  3. Evaluate seasonal + live mountain pass statuses
 *  4. Synthesize via Official Free Gemini (`gemini-3.5-flash-lite` -> `2.5-flash-lite` -> `2.5-flash`),
 *     then OpenRouter `openrouter/free`, then Live-Data Grounded Synthesizer.
 */
export async function generateItinerary(tripParams, onProgress = () => {}, signal = null) {
  const daysNum =
    String(tripParams.days).toLowerCase() === 'auto'
      ? 5
      : parseInt(tripParams.days, 10) || 5;

  // Step 1: Geocoding
  onProgress('🗺️ Locating start city and destination...');
  let originCoords = null;
  let destCoords = null;
  try {
    const [orig, dest] = await Promise.all([
      geocodeLocation(tripParams.from),
      geocodeLocation(tripParams.to),
    ]);
    originCoords = orig;
    destCoords = dest;
  } catch (err) {
    console.warn('[openrouter] Geocoding failed:', err.message);
  }

  // Step 2: Parallel Data Fetch (ORS GeoJSON + Weather + Elevations + Fast Single-Batch Overpass)
  onProgress('🛣️ Fetching live highway names, distances & altitude profile...');
  let routeData = null;
  let weatherData = null;
  let elevations = null;
  let routePOIs = null;

  if (originCoords && destCoords) {
    const initialResults = await Promise.allSettled([
      getRouteSegments(originCoords, destCoords, daysNum),
      getWeather(destCoords),
    ]);

    if (initialResults[0].status === 'fulfilled') routeData = initialResults[0].value;
    if (initialResults[1].status === 'fulfilled') weatherData = initialResults[1].value;

    const coordsToSample =
      routeData?.sampledCoords && routeData.sampledCoords.length > 0
        ? routeData.sampledCoords
        : [originCoords, destCoords];

    onProgress('🏔️ Scanning en-route lakes, viewpoints, passes & fuel stops...');
    const secondaryResults = await Promise.allSettled([
      getElevations(coordsToSample),
      getRoutePOIsAndInfrastructure(coordsToSample, originCoords, destCoords),
    ]);

    if (secondaryResults[0].status === 'fulfilled') elevations = secondaryResults[0].value;
    if (secondaryResults[1].status === 'fulfilled') routePOIs = secondaryResults[1].value;
  }

  // Step 3: Evaluate Pass Statuses for Selected Month + Discovered Passes
  const evaluatedPasses = evaluateRoutePasses(
    tripParams.from,
    tripParams.to,
    tripParams.month,
    routePOIs?.mountainPasses
  );

  // Step 4: Build AI Prompt & Call Official Free Gemini Model
  onProgress('🤖 Gemini is synthesizing your 4-pillar roadbook...');
  const systemPrompt = getSystemPrompt(
    tripParams.days,
    tripParams.from,
    tripParams.to,
    tripParams.month
  );
  const userMessage = buildUserMessage(
    tripParams,
    routeData,
    weatherData,
    elevations,
    routePOIs,
    evaluatedPasses
  );

  const parseAndReturn = (rawContent) => {
    const jsonMatch =
      rawContent.match(/```json\s*([\s\S]*?)\s*```/) || rawContent.match(/(\{[\s\S]*\})/);
    const jsonString = jsonMatch ? jsonMatch[1] : rawContent.trim();
    const parsed = JSON.parse(jsonString);
    return normalizeItinerary(parsed, tripParams, routeData, weatherData, evaluatedPasses);
  };

  // Attempt 1: Official Google AI Studio Free Tier
  try {
    const { text } = await callOfficialGemini(systemPrompt, userMessage, signal);
    return parseAndReturn(text);
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.warn('[AI] Official Gemini models skipped/failed:', err.message);
  }

  // Attempt 2: OpenRouter active free auto-router (`openrouter/free`)
  try {
    onProgress('✨ Finalizing your expedition itinerary...');
    const rawText = await callOpenRouterFreeFallback(systemPrompt, userMessage, signal);
    if (rawText) {
      return parseAndReturn(rawText);
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.warn('[AI] OpenRouter free fallback failed:', err.message);
  }

  // Attempt 3: Live-Data Grounded Deterministic Synthesizer
  console.info('[RaahBar] Using Live-Data Grounded Synthesizer with fetched ORS/Overpass/Open-Meteo data.');
  return createLiveGroundedItinerary(
    tripParams,
    routeData,
    weatherData,
    elevations,
    routePOIs,
    evaluatedPasses
  );
}
