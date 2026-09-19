# RaahBar API Architecture & Data Flow

This document details the ecosystem of APIs powering the RaahBar Expedition Planner, mapping out the flow of data and the specific files responsible for the orchestrations.

---

## The Core Files

The routing intelligence is heavily concentrated in the following modular files located in `src/lib/`:

| File | Purpose / Role |
| :--- | :--- |
| **`routing.js`** | The raw data fetcher. Makes all outbound API calls for geographical, infrastructural, and weather data. Does not contain AI logic. |
| **`openrouter.js`** | The orchestrator. It manages the pipeline, triggering the parallel API calls to gather context, building the prompt, instructing the LLM via OpenRouter, and providing a robust fallback system if everything fails. |
| **`prompts.js`** | The brain. Contains the domain knowledge mappings, crucial safety rules, and strings together the raw API data and the user's inputs into a cohesive instruction set for the AI model. |

---

## The APIs in Operation

The system leverages 6 external APIs to build a comprehensive, safe, and factual itinerary. **Five of these are utilized purely for grounding context (No Hallucinations)** before any AI sees the prompt.

### 1. Nominatim (OpenStreetMap)
- **Purpose**: Geocoding. Converts string city names (e.g., "Islamabad") into precise Latitude/Longitude coordinates.
- **Endpoint**: `https://nominatim.openstreetmap.org/search`
- **Location**: `routing.js` > `geocodeLocation()`
- **Billing**: Free / Open Source

### 2. OpenRouteService (ORS)
- **Purpose**: Establishes the real road route footprint. Provides total minimum direct distance and a sequence of route coordinate waypoints.
- **Endpoint**: `https://api.openrouteservice.org/v2/directions/driving-car/json`
- **Location**: `routing.js` > `getRouteSegments()`
- **Usage**: Used to ensure the AI knows the baseline driving time and distance. The app samples exactly **5 waypoints** from this geometry to pass along to environmental APIs. 

### 3. Open-Meteo Weather API
- **Purpose**: Provides real-time weather conditions and precipitation at the absolute final destination.
- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Location**: `routing.js` > `getWeather()`
- **Usage**: If high precipitation or severe alerts are detected, the AI is warned to apply trip-level and gear-level caution flags.

### 4. Open-Meteo Elevation API
- **Purpose**: Looks up the topography map and determines true altitude across the sampled route coords. 
- **Endpoint**: `https://api.open-meteo.com/v1/elevation`
- **Location**: `routing.js` > `getElevations()`
- **Usage**: Feeds maximum elevation data to the AI. If the route crosses >3,500m, the AI knows to flag it aggressively, especially based on smaller engine capabilities (e.g., 125CC).

### 5. Overpass API (OpenStreetMap)
- **Purpose**: Maps local infrastructure (hospitals, clinics, fuel stations, moto-shops) around the sampled route coordinates using a specific radius.
- **Endpoint**: `https://overpass-api.de/api/interpreter`
- **Location**: `routing.js` > `getNearbyInfrastructure()`
- **Usage**: Creates "fuel gaps" and identifies if parts of the route are dangerously sparse of medical assistance. AI pairs this with hardcoded knowledge for the final output.

### 6. OpenRouter API
- **Purpose**: Hosts the Large Language Models (LLMs) executing the final Scenic Tour Guide prompt and returning the `JSON` structured itinerary.
- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Location**: `openrouter.js` > `callOpenRouter()`
- **Models Used**: Runs against `stepfun/step-3.5-flash` natively, alongside `llama-3.3-70b-instruct` and `gemini-2.0-flash-001` in sequence attempts. Note that some models (like Stepfun) utilize an integrated `web_search` tool dynamically requested via OpenRouter payload.

---

## 🌊 The Pipeline Flow

When a user hits "Generate Expedition", the pipeline follows this timeline entirely housed in `openrouter.js`:

1. **Phase 1: Location Setup**
   - The user's `Start` and `End` cities are fired to **Nominatim**.
   - Result: Coordinate markers `originCoords` and `destCoords`.

2. **Phase 2: The Parallel Data Gathering**
   - A `Promise.allSettled` is fired for speed, grabbing context concurrently:
     - Fetches baseline routing from **OpenRouteService**. 
     - Pulls live weather at `destCoords` from **Open-Meteo Weather**.
     - From the ORS route, 5 waypoints are sampled. Those points are fired to **Open-Meteo Elevation** and **Overpass API**.

3. **Phase 3: Prompt Construction**
   - `buildUserMessage()` in `prompts.js` strings all of this data together.
   - Example prompt chunk: *"TRIP REQUEST: 125CC, Rookie. REAL ROUTE DATA: 280km. Max route elevation: 4170m. Infrastructure: sparse fuel. INSTRUCTION: Do not exceed 125CC capabilities."*

4. **Phase 4: AI Generation**
   - The highly constrained prompt is sent to the models via **OpenRouter API**. The LLM processes the facts, dynamically paces the one-way routing using "Scenic Tour Guide" logic, searches real-time web conditions (like Pass closures), and replies strictly with our JSON Schema.
   - *If the AI fails, timeouts, or hits a rate limit*: The `createFallbackItinerary()` function catches the error and utilizes the gathered geographical data to mathematically construct an offline itinerary so the user is never left hanging.
