import { getSystemPrompt, buildUserMessage } from './prompts.js';
import {
  geocodeLocation,
  getRouteSegments,
  getWeather,
  getElevations,
  getNearbyInfrastructure,
} from './routing.js';

const MODELS = [
  'stepfun/step-3.5-flash',
  'meta-llama/llama-3.3-70b-instruct',
  'google/gemini-2.0-flash-001',
];

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Call OpenRouter API with optional AbortSignal and web_search tool options.
 */
async function callOpenRouter(model, systemPrompt, userMessage, signal) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_OPENROUTER_API_KEY is missing');
  }

  const payload = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 3000,
  };

  // Enable web_search tool if using stepfun model
  if (model.includes('stepfun')) {
    payload.tools = [{ type: 'web_search' }];
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://raahbar.pk',
      'X-Title': 'RaahBar Expedition Planner',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter (${model}) returned ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * Fallback itinerary generator if live AI models fail or are rate-limited.
 * Dynamically tailored to tripParams and routeData instead of hardcoded Karakoram assumptions.
 */
function createFallbackItinerary(tripParams, routeData = null, weatherData = null) {
  const daysNum = parseInt(tripParams.days, 10) || 3;
  const from = tripParams.from || 'Start';
  const to = tripParams.to || 'Destination';

  const routeText = `${from} ${to}`.toLowerCase();
  const isHighAltitudeGB = /gilgit|hunza|skardu|khunjerab|babusar|deosai|shandur|passu|altit|baltit|karimabad|nagar|ghizer/i.test(routeText);

  const totalDist = routeData?.totalDistanceKm || (isHighAltitudeGB ? daysNum * 120 : Math.min(daysNum * 35, 120));
  const totalDur = routeData?.totalDurationHrs || Math.round(totalDist / 40);

  const daysList = [];
  const dailyDist = Math.round(totalDist / daysNum);
  const dailyDur = Math.round((totalDur / daysNum) * 10) / 10;

  for (let i = 1; i <= daysNum; i++) {
    const isStartDay = i === 1;
    const isEndDay = i === daysNum;

    let startLoc = from;
    let endLoc = to;
    let title = `${from} to ${to}`;

    if (daysNum > 1) {
      if (isStartDay) {
        endLoc = to;
        title = `Departure: ${from} to ${to}`;
      } else if (isEndDay) {
        startLoc = to;
        endLoc = from;
        title = `Return: ${to} to ${from}`;
      } else {
        startLoc = to;
        endLoc = `${to} Surrounds`;
        title = `Exploring ${to}`;
      }
    }

    daysList.push({
      day: i,
      title: `Day ${i}: ${title}`,
      distanceKm: dailyDist,
      durationHrs: dailyDur,
      startLocation: startLoc,
      endLocation: endLoc,
      altitudeM: isHighAltitudeGB ? (i === 1 ? 1500 : 2800) : 1200,
      altitudeLevel: isHighAltitudeGB ? 'HIGH' : 'MID',
      highlights: [
        `${endLoc} Viewpoint & Scenic Stops`,
        'Local Chai & Refreshment Stop',
        'Photography & Mountain Vistas',
      ],
      fuelStops: [`Town Petrol Station (${startLoc})`],
      fuelWarning: isHighAltitudeGB && i === 2 ? 'Check fuel before ascending high valley stretches.' : null,
      sleepLocation: isEndDay ? from : `${to} Hotel / Guesthouse`,
      warnings: isHighAltitudeGB && i === 2 ? ['High elevation — stay hydrated and dress warm.'] : [],
      tips: 'Check tire pressure and oil level before setting off each morning.',
    });
  }

  const warnings = [];
  if (isHighAltitudeGB) {
    warnings.push('SCOM SIM recommended for mobile signal in Gilgit-Baltistan.');
    warnings.push('High altitude pass weather changes rapidly — keep extra layers accessible.');
  }

  return {
    tripTitle: `${from} to ${to} Trip`,
    totalDays: daysNum,
    totalDistanceKm: totalDist,
    totalDurationHrs: totalDur,
    startPoint: from,
    endPoint: to,
    weatherSummary: weatherData?.condition
      ? `${weatherData.condition} (${weatherData.tempC}°C)`
      : 'Pleasant riding conditions expected.',
    bestMonths: `${tripParams.month} (Good riding window)`,
    warnings: warnings,
    days: daysList,
    gearChecklist: [
      'Full-face / Modular Helmet',
      'Riding Jacket with Armor',
      'Rain Suit / Waterproof Layer',
      'Basic Tool Kit & Puncture Repair Set',
      'First Aid Kit',
    ],
    permits: isHighAltitudeGB ? ['National Park Entry Ticket at Checkpoint'] : [],
    emergencyContacts: [
      'Rescue 1122',
      'Local District Hospital',
    ],
  };
}

/**
 * Full Agent Pipeline:
 *  1. Geocode start & end via Nominatim
 *  2. Parallel fetch: ORS route + Open-Meteo weather + Open-Meteo elevation + Overpass infrastructure
 *  3. AI enrichment with stepfun web_search
 *
 * @param {object} tripParams  { from, to, days, month, bikeType, expLevel }
 * @param {function} [onProgress] Callback for step progress messages
 * @param {AbortSignal} [signal] AbortSignal for request cancellation
 * @returns {Promise<object>} Grounded, complete itinerary JSON
 */
export async function generateItinerary(tripParams, onProgress = () => {}, signal = null) {
  const daysNum = parseInt(tripParams.days, 10) || 7;

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

  // Step 2: Parallel Data Fetch (Route + Weather + Elevation + Overpass)
  onProgress('🛣️ Fetching real road distances & terrain data...');
  let routeData = null;
  let weatherData = null;
  let elevations = null;
  let infrastructure = null;

  if (originCoords && destCoords) {
    const results = await Promise.allSettled([
      getRouteSegments(originCoords, destCoords, daysNum),
      getWeather(destCoords),
      // We will fetch elevations for origin + daily leg end points
      getElevations([originCoords, destCoords]),
      getNearbyInfrastructure(destCoords, 30),
    ]);

    if (results[0].status === 'fulfilled') routeData = results[0].value;
    if (results[1].status === 'fulfilled') weatherData = results[1].value;

    if (results[0].status === 'fulfilled' && routeData?.dailyLegs) {
      // Get elevation for each day's leg end coordinate
      const coordsToElevate = [originCoords, ...routeData.dailyLegs.map((l) => l.endCoord).filter(Boolean)];
      try {
        elevations = await getElevations(coordsToElevate);
      } catch (err) {
        console.warn('[openrouter] Elevation fetch failed:', err.message);
      }

      // Get infrastructure near each day's leg end coordinate
      onProgress('⛽ Checking fuel stations & emergency medical hubs...');
      try {
        const infraResults = await Promise.allSettled(
          routeData.dailyLegs.map((l) => (l.endCoord ? getNearbyInfrastructure(l.endCoord, 20) : Promise.resolve(null)))
        );
        infrastructure = infraResults.map((r) => (r.status === 'fulfilled' ? r.value : null));
      } catch (err) {
        console.warn('[openrouter] Infrastructure fetch failed:', err.message);
      }
    }
  }

  // Step 3: Build AI prompt & Invoke Model
  onProgress('🤖 AI is scanning live pass status & terrain alerts...');
  const systemPrompt = getSystemPrompt();
  const userMessage = buildUserMessage(
    tripParams,
    routeData,
    weatherData,
    elevations,
    infrastructure
  );

  onProgress('✨ Finalizing your expedition itinerary...');
  for (const model of MODELS) {
    try {
      const data = await callOpenRouter(model, systemPrompt, userMessage, signal);
      const rawContent = data?.choices?.[0]?.message?.content;
      if (rawContent) {
        const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/) || rawContent.match(/(\{[\s\S]*\})/);
        const jsonString = jsonMatch ? jsonMatch[1] : rawContent.trim();
        const parsed = JSON.parse(jsonString);

        // Ensure total distance / days fallback if missing
        if (!parsed.totalDistanceKm && routeData?.totalDistanceKm) {
          parsed.totalDistanceKm = routeData.totalDistanceKm;
        }
        return parsed;
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        throw err; // Re-throw abort signal error immediately
      }
      console.warn(`OpenRouter model (${model}) failed:`, err.message);
    }
  }

  console.warn('All live AI models failed. Utilizing smart fallback itinerary generator.');
  return createFallbackItinerary(tripParams);
}
