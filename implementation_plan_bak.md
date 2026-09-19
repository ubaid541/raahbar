# RaahBar Planner — Real-World Data Upgrade Plan

## Problem Statement

The current planner output is **entirely AI-hallucinated**. The AI model invents distances, km values, location names, highlights, and route paths with no connection to the real world. Riders relying on this data could follow wrong roads, underestimate fuel gaps, or miss real checkpoints. The root cause: the AI has no access to real-world routing or geographic data — it only guesses.

---

## The Core Idea: An Agent Pipeline

Instead of asking the AI to **invent** a route, we flip the model:

1. **Google Maps fetches real routing data first** (real distances, real intermediate towns, real road names, TWO_WHEELER mode).
2. **That real data is injected into the AI prompt** as factual context.
3. **The AI's job becomes a domain expert narrator** — it takes real coordinates, real distances, real waypoints and adds Pakistan-specific riders' knowledge on top (fuel gap alerts, SIM card info, pass timing, altitude warnings).

This is the classic **Retrieval-Augmented Generation (RAG) / Agent pattern** — ground the AI in facts, use it for reasoning.

---

## User Review Required

> [!IMPORTANT]
> **New environment variable required**: `VITE_GOOGLE_MAPS_API_KEY` must be added to `.env`.
> You'll need to create/enable the following in Google Cloud Console:
> - **Routes API** (for real road distances + TWO_WHEELER mode)
> - **Geocoding API** (to convert city names to lat/lng)
> - **Places API** (for Place Autocomplete on form inputs)
> Apply HTTP Referer restriction (`http://localhost:*` + your production domain) and API restriction to only these 3 APIs.

> [!WARNING]
> The Google Routes API and Geocoding API are **paid** (per-SKU free allowance per month). For low-volume dev usage (< ~10,000 requests/month), you will stay in the free tier. Set up a Budget Alert in Google Cloud Console to prevent surprise charges.

> [!NOTE]
> We are **NOT using Google Maps for map visualization** in this plan (that is a separate phase). We only use the Google APIs as a **data source** (REST calls from the frontend). No `@googlemaps/js-api-loader` SDK or embedded map widget is involved.

---

## Proposed Architecture

```
User Fills Form → [Phase 1: Google Geocoding]
                       ↓
               Resolve start + destination coordinates
                       ↓
           [Phase 2: Google Routes API (TWO_WHEELER)]
                       ↓
               Get real waypoints, roads, distances, ETAs per day leg
                       ↓
           [Phase 3: OpenRouter AI (stepfun/step-3.5-flash)]
                       ↓
               AI enriches route with domain knowledge:
               altitude flags, fuel alerts, pass timing,
               gear/permits, local tips, highlights
                       ↓
               [Rendered Itinerary — Real Data + AI Wisdom]
```

---

## Proposed Changes

### Phase 1 — Google Maps Integration (`src/lib/`)

#### [NEW] `src/lib/googlemaps.js`

A new dedicated module to abstract all Google Maps REST API calls. This file:

- **`geocodeLocation(cityName)`** — Calls the Geocoding API to get `{ lat, lng }` for any city name (e.g., "Islamabad", "Khunjerab Pass").
- **`planRoute(originCoords, destinationCoords, totalDays)`** — Calls the Routes API with `travelMode: TWO_WHEELER` to get real road information:
  - Total real distance & riding duration
  - Intermediate road segments (legs)
  - Distributes legs across user's selected number of days
  - Returns structured daily legs: `{ fromCity, toCity, distanceKm, durationHours, townsPassed }`
- All calls are REST `fetch()` — no Google Maps SDK dependency needed.
- Graceful fallback: if any API call fails (no key, quota exceeded, network), returns `null` so the AI can still generate without real data (degraded mode).

---

### Phase 2 — AI Prompt Upgrade (`src/lib/prompts.js`)

#### [MODIFY] `src/lib/prompts.js`

Replace the current static system prompt with a **dynamic context-aware prompt generator** function:

- `buildSystemPrompt()` stays as domain knowledge base (unchanged core content).
- **NEW**: `buildUserMessage(tripParams, realRouteData)` — This builds the user-turn message that includes:
  - The real segment-by-segment data from Google Maps injected as structured context:
    ```
    REAL ROUTING DATA (from Google Maps TWO_WHEELER mode):
    Day 1: Islamabad → Abbottabad, real distance: 127 km, est. ride time: 2.5 hours
    Day 2: Abbottabad → Naran, real distance: 154 km, est. ride time: 3.5 hours
    ...
    ```
  - AI is explicitly told: **"Do NOT invent distances or locations. Use the above real data exactly."**
  - AI is only asked to add: highlights, fuel stop positions, sleep location suggestion, altitude warnings, gear checklist, permits.

This transforms the AI from a **data inventor** into a **domain-expert annotator**.

---

### Phase 3 — OpenRouter Orchestrator (`src/lib/openrouter.js`)

#### [MODIFY] `src/lib/openrouter.js`

- Import and call `geocodeLocation` + `planRoute` from `googlemaps.js` **before** calling the AI.
- Pass the resolved real route data into `buildUserMessage()`.
- Add an **AbortController** to `callOpenRouter()` so if the user hits Generate again before completion, the previous in-flight request is cancelled cleanly (prevents double-submissions and race conditions).
- Keep the existing multi-model fallback strategy for the AI call itself.
- Keep `createFallbackItinerary()` as last-resort if both Maps + AI fail.

---

### Phase 4 — Form UX Upgrade (`src/components/TripForm.jsx`)

#### [MODIFY] `src/components/TripForm.jsx`

- **Location Autocomplete**: Replace free-text inputs for Start City and Destination with a debounced **Places Autocomplete** using the Google Places API (Text Search). Shows a dropdown of suggested Pakistani cities/locations as the user types. Prevents users from entering gibberish.
- **Abort on Re-generate**: Wire up `AbortController` — if user changes inputs and clicks Generate again, the previous call is cancelled so the UI never shows stale data.
- **Progressive Loading Status**: Instead of a single spinner, show a step-by-step status to the user:
  1. `🗺️ Resolving your route on Google Maps...`
  2. `🛣️ Calculating road distances (TWO_WHEELER mode)...`
  3. `🤖 AI is analyzing terrain, fuel gaps & passes...`
  4. `✅ Building your expedition...`
  This makes the 5–10s wait feel purposeful and informative instead of a dead spinner.

---

### Phase 5 — Cards & Output Upgrade (`src/components/ItineraryCard.jsx`, `src/components/ItineraryOutput.jsx`)

#### [MODIFY] `src/components/ItineraryCard.jsx`

- Add a **Google Maps Link** per day card — a small button "View on Maps →" that opens `https://www.google.com/maps/dir/{startCity}/{endCity}` in a new tab. Simple, free, no SDK.
- Show real distance and real duration prominently (pulled from Maps data, not AI).
- Display **altitude level indicator** (Low / Medium / High / Extreme) as a color-coded badge per day based on the AI's altitude warnings.
- Improve highlights display: move from a 3-item flat list to a styled "points of interest" grid.

#### [MODIFY] `src/components/ItineraryOutput.jsx`

- Add a **Route Summary Bar** at the top with real data pills: `Real Distance | Riding Days | Avg Daily Km | Elevation Profile`.
- Add a **"Copy Expedition" button** that formats the whole itinerary as clean text and copies it to clipboard.
- Add `bestMonths` as a highlighted seasonal badge (currently underutilized).

---

### Phase 6 — Config & Environment

#### [MODIFY] `.env` (user action)

```env
VITE_OPENROUTER_API_KEY="sk-or-v1-..."
VITE_GOOGLE_MAPS_API_KEY="AIza..."
```

#### [MODIFY] `PROJECT_DETAILS.md`

Update tech stack and feature status table.

---

## Implementation Sequence (Order Matters)

1. `src/lib/googlemaps.js` — New file, foundation for everything.
2. `src/lib/prompts.js` — Upgrade prompt builder to accept real route data.
3. `src/lib/openrouter.js` — Wire Maps → AI pipeline + abort controller.
4. `src/components/TripForm.jsx` — Autocomplete + progressive status messages.
5. `src/components/ItineraryCard.jsx` — Add Maps links, altitude badges.
6. `src/components/ItineraryOutput.jsx` — Summary bar + copy button.

---

## Open Questions

> [!IMPORTANT]
> **Q1 — Do you have a Google Cloud account?**
> You'll need to create a Google Cloud project and enable the Routes API, Geocoding API, and Places API to get your `VITE_GOOGLE_MAPS_API_KEY`. This takes ~10 minutes. I can guide you step by step if needed.

> [!IMPORTANT]
> **Q2 — Place Autocomplete preference?**
> For the city inputs, do you want:
> - **(A) Google Places Autocomplete** — Accurate, real-time suggestions, but uses your Google Maps API key & quota.
> - **(B) A local curated list** — Pre-built dropdown of ~50 major Pakistani cities/destinations we maintain ourselves. Zero API cost, no quota risk, but limited to what we include.
> Option B is safer for MVP and costs nothing. Option A is more polished but needs the key.

> [!NOTE]
> **Q3 — TWO_WHEELER coverage in Pakistan?**
> The Google Routes API TWO_WHEELER mode has regional coverage restrictions. I will test this during implementation. If the API doesn't support TWO_WHEELER in Pakistan, I'll fall back to `DRIVE` mode (car roads) which on KKH routes is effectively the same since the KKH is a highway. I'll confirm and report back during implementation.

---

## Verification Plan

### Automated
- After implementation, run `npm run build` to ensure no compilation errors.

### Manual Testing
- Fill form: `Islamabad → Khunjerab Pass, 7 days, July, Adventure`.
- Verify Network tab shows exactly **2–3 API calls** (1 geocode for origin, 1 geocode for destination, 1 Routes API call) before the AI call.
- Verify distances on each day card match real Google Maps distances (spot-check Day 1 against manually opening Google Maps).
- Verify the AI output no longer says "motorway" but uses actual road names (KKH, M-1, N-35).
- Click "View on Maps" button on a day card and verify it opens the correct Google Maps route.
- Test with no Google Maps key (key removed from .env) to verify graceful degraded fallback.

---

*Status: Awaiting user approval before execution.*
