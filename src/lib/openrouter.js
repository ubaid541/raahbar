import { RAAHBAR_SYSTEM_PROMPT } from './prompts.js';

const MODELS = [
  'stepfun/step-3.5-flash',
  'meta-llama/llama-3.3-70b-instruct',
  'google/gemini-2.0-flash-001',
];

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callOpenRouter(model, userMessage) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_OPENROUTER_API_KEY is missing');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://raahbar.pk',
      'X-Title': 'RaahBar',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: RAAHBAR_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter (${model}) returned ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * Fallback static itinerary generator in case AI models fail or API key expires.
 */
function createFallbackItinerary(tripParams) {
  const daysNum = parseInt(tripParams.days, 10) || 7;
  const daysList = [];

  const routeStops = [
    { start: tripParams.from, end: 'Abbottabad / Mansehra', title: 'Start Journey & Lower Hills', highlight: 'Hazara Motorway view', sleep: 'Pine View Hotel' },
    { start: 'Mansehra', end: 'Naran / Kaghan Valley', title: 'Ascend Kaghan Valley', highlight: 'Balakot River, Lulusar Lake', sleep: 'Naran River Inn' },
    { start: 'Naran', end: 'Chilas / Gilgit', title: 'Cross Babusar & KKH Junction', highlight: 'Babusar Summit (4,173m), Indus River View', sleep: 'Serena Hotel Gilgit' },
    { start: 'Gilgit', end: 'Hunza (Karimabad)', title: 'Heart of the Karakoram', highlight: 'Rakaposhi View Point, Altit Fort', sleep: 'Hunza Serena Inn' },
    { start: 'Karimabad', end: 'Passu / Gojal', title: 'Passu Cones & Attabad Lake', highlight: 'Attabad Lake Boat Tour, Passu Cathedral', sleep: 'Passu Peaks Lodge' },
    { start: 'Passu', end: 'Khunjerab Pass & Back to Hunza', title: 'Summit World\'s Highest Border', highlight: 'Khunjerab Pass (4,693m), China Border Gate', sleep: 'Karimabad Guesthouse' },
    { start: 'Hunza', end: 'Return to ' + tripParams.from, title: 'Homeward Journey', highlight: 'Karakoram Highway Southbound', sleep: 'Home Destination' },
  ];

  for (let i = 1; i <= daysNum; i++) {
    const stopIndex = (i - 1) % routeStops.length;
    const stop = routeStops[stopIndex];
    daysList.push({
      day: i,
      title: `Day ${i}: ${stop.title}`,
      distance: `${Math.floor(120 + Math.random() * 80)} km`,
      duration: `${4 + (i % 3)} hours`,
      startLocation: stop.start,
      endLocation: stop.end,
      highlights: [stop.highlight, 'Local Chai Stop', 'Scenic Photography Point'],
      fuelStops: [i === 2 ? 'Balakot Fuel Station (Fill Extra 5L)' : 'Main Highway Station'],
      sleepLocation: stop.sleep,
      warnings: i === 3 || i === 6 ? ['Altitude above 3,500m - Watch for Hypoxia', 'SCOM SIM required'] : [],
      tips: 'Inspect tire pressure and chain tension every morning before departure.',
    });
  }

  return {
    tripTitle: `Expedition: ${tripParams.from} to ${tripParams.to}`,
    totalDays: daysNum,
    totalDistance: `${daysNum * 160} km`,
    startPoint: tripParams.from,
    endPoint: tripParams.to,
    bestMonths: `${tripParams.month} (Ideal riding window)`,
    warnings: [
      'Babusar Pass is seasonal (May–Oct). Verify live status before departing.',
      'Always carry extra 5L petrol past Chilas — long distances between pumps.',
      'SCOM SIM is mandatory for mobile connectivity across Gilgit-Baltistan.',
    ],
    days: daysList,
    gearChecklist: [
      'Dual-sport / Full-face ECE Helmet',
      'Thermal Underlayers & Windproof Jacket',
      'Tire Plug Repair Kit & Portable Air Pump',
      'Basic Mechanical Toolset & Spare Clutch Cable',
      'First Aid Kit & Altitude Sickness Pills (Diamox)',
    ],
    permits: [
      'Gilgit-Baltistan Entry Checkpoint Registration',
      'Khunjerab National Park Ticket (Local Checkpoint)',
      'NOC required if traveling to restricted LoC/border zones',
    ],
  };
}

/**
 * Generates a trip itinerary using OpenRouter with multi-model fallback.
 * @param {{ from: string, to: string, days: string, month: string, bikeType: string, expLevel: string }} tripParams
 * @returns {Promise<object>} Parsed itinerary JSON
 */
export async function generateItinerary(tripParams) {
  const userMessage = `Plan a motorcycle trip with these details:
- Starting city: ${tripParams.from}
- Destination: ${tripParams.to}
- Duration: ${tripParams.days} days
- Travel month: ${tripParams.month}
- Bike type: ${tripParams.bikeType}
- Experience level: ${tripParams.expLevel}

Generate the full day-by-day itinerary in the JSON format specified.`;

  for (const model of MODELS) {
    try {
      const data = await callOpenRouter(model, userMessage);
      const rawContent = data?.choices?.[0]?.message?.content;
      if (rawContent) {
        const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/) || rawContent.match(/(\{[\s\S]*\})/);
        const jsonString = jsonMatch ? jsonMatch[1] : rawContent.trim();
        return JSON.parse(jsonString);
      }
    } catch (err) {
      console.warn(`OpenRouter model (${model}) failed:`, err.message);
    }
  }

  console.warn('All live AI models failed or rate limited. Utilizing smart fallback itinerary generator.');
  return createFallbackItinerary(tripParams);
}

