import { RAAHBAR_SYSTEM_PROMPT } from './prompts.js';

const PRIMARY_MODEL = 'stepfun/step-3.5-flash:free';
const FALLBACK_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callOpenRouter(model, userMessage) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
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
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Generates a trip itinerary from OpenRouter.
 * @param {{ from: string, to: string, days: string, month: string, bikeType: string, expLevel: string }} tripParams
 * @returns {Promise<object>} Parsed itinerary JSON
 */
export async function generateItinerary(tripParams) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_OPENROUTER_API_KEY is not set. Check your .env file.');
  }

  const userMessage = `Plan a motorcycle trip with these details:
- Starting city: ${tripParams.from}
- Destination: ${tripParams.to}
- Duration: ${tripParams.days} days
- Travel month: ${tripParams.month}
- Bike type: ${tripParams.bikeType}
- Experience level: ${tripParams.expLevel}

Generate the full day-by-day itinerary in the JSON format specified.`;

  let data;
  try {
    data = await callOpenRouter(PRIMARY_MODEL, userMessage);
  } catch (primaryError) {
    console.warn('Primary model failed, trying fallback:', primaryError.message);
    try {
      data = await callOpenRouter(FALLBACK_MODEL, userMessage);
    } catch (fallbackError) {
      throw new Error('Both primary and fallback AI models failed. Please try again later.');
    }
  }

  const rawContent = data?.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('AI returned an empty response. Please try again.');
  }

  // Extract JSON from the response (model may wrap it in markdown code blocks)
  const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/) || rawContent.match(/(\{[\s\S]*\})/);
  const jsonString = jsonMatch ? jsonMatch[1] : rawContent.trim();

  try {
    return JSON.parse(jsonString);
  } catch {
    throw new Error('AI returned invalid JSON. Please try again.');
  }
}
