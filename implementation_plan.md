# RaahBar v1 MVP — Project Requirements & Implementation Plan

> [!IMPORTANT]
> **In-Place Upgrade (Not Rebuilding from Scratch)**
> This plan upgrades the **existing RaahBar React + Vite + Tailwind v4 application** in `d:\raahbar`. We keep the existing layout shell (`Navbar`, `Home`, `Planner`, `Footer`) and visual theme while replacing the broken AI/routing pipeline with a **100% Dynamic Live Data Pipeline**, switching to the single official free **`gemini-3.5-flash-lite`** model, upgrading the Day Cards, and adding the **Tactical Rally Roadbook PDF** generator.

---

## 1. Master Task Tracker (Live Progress)

- [x] **Task 1**: Save `implementation_plan.md` & initialize live progress tracking in `PROJECT_DETAILS.md` and `task.md`.
- [x] **Task 2**: Upgrade `src/lib/routing.js` — Add `searchLocations()` (live Nominatim autocomplete), fix `getRouteSegments()` to use ORS `/geojson` with `instructions: true` and `avoid_features: ["highways"]` (extracting real road names & coordinates), and build single-batch `getRoutePOIsAndInfrastructure()` on Overpass API for real towns, viewpoints, lakes, waterfalls, passes, fuel, and medical hubs.
- [x] **Task 3**: Upgrade `src/lib/prompts.js` & `vite.config.js` — Inject live ORS road names, Overpass viewpoints/lakes/towns/passes, multi-point elevations, and fuel gaps into the prompt; update JSON schema for Pass Status Banner + 4-Pillar Day Cards; expose `GEMINI_API_KEY` in `vite.config.js`.
- [x] **Task 4**: Upgrade `src/lib/openrouter.js` — Hold old OpenRouter models, integrate official Google `@google/genai` with `gemini-3.5-flash-lite` (plus Google Search grounding), and upgrade `createFallbackItinerary()` so it uses all live ORS/Overpass/Open-Meteo data instead of fake placeholders.
- [x] **Task 5**: Upgrade `src/pages/Home.jsx` & `src/components/TripForm.jsx` — Add URL query pre-fill from Home page "Legendary Roads" cards, live Nominatim autocomplete dropdowns on Start/Destination inputs, `Auto (Recommended)` days option, and all 12 travel months.
- [x] **Task 6**: Upgrade `src/components/ItineraryCard.jsx`, `src/components/ItineraryOutput.jsx`, and `src/pages/Planner.jsx` — Render the 4-Pillar Day Cards (Highway Corridor badge, En-Route Checkpoints & Viewpoints timeline, Surface/Terrain, Fuel/Mechanic/Signal), add the **Route Corridors & Pass Status Banner**, and add `localStorage` refresh protection.
- [x] **Task 7**: Create `src/lib/pdfRoadbook.js` & wire into `ItineraryOutput.jsx` — Build the high-contrast **Tactical Rally Roadbook PDF** generator (Option B) with Mission Brief, Pass Status Matrix, 4-Pillar Day Tables, and printable `[ ]` Gear/Permit/Emergency checklists.
- [x] **Task 8**: Final Verification & Build Check — Run `npm run build` and verify all tasks and documentation in `PROJECT_DETAILS.md`.

---

## 2. MVP Project Requirements (PRD)

### 2.1 Core Scope (v1 MVP)
- **Target User**: Pakistani motorcycle travellers & adventure riders (`125cc`, `150cc`, `250cc`, `Adventure`, `Scrambler`) riding into Northern Pakistan (KPK, Gilgit-Baltistan, AJK).
- **Journey Type**: **One-Way Expedition + En-Route & Destination Exploration** (covers real stops/detours along the road on the way to the destination, plus named excursions/lakes/viewpoints around the destination).
- **Single AI Model**: **`gemini-3.5-flash-lite`** via official Google Gemini SDK (`@google/genai`) with Google Search grounding (`googleSearch`) for live pass/road advisories. Old OpenRouter models are held/commented out.
- **Out of Scope for v1 (Saved for v2)**: Interactive visual map widgets, Guesthouse directory (`/guesthouses`), standalone `/passes` directory page.

### 2.2 Dynamic Data Sources (100% Free)

| Data Layer | Live Resource / API | What It Fetches Dynamically |
| :--- | :--- | :--- |
| **1. Geocoding & Autocomplete** | **OpenStreetMap Nominatim API** (`nominatim.openstreetmap.org`) | Live debounced search suggestions for Pakistani cities/valleys/passes + exact `[lat, lng]` resolution. |
| **2. Route Geometry, Highways & Distances** | **OpenRouteService (ORS) GeoJSON API** (`/v2/directions/driving-car/geojson`) | Real road geometry (`coordinates`), exact highway names (`N-5`, `N-35`, `N-15`) via `instructions: true`, step distances, and motorway avoidance (`avoid_features: ["highways"]`). |
| **3. En-Route Towns, Viewpoints, Lakes, Waterfalls & Passes** | **OpenStreetMap Overpass API** (1 Single Batched Request) | Queries along the ORS route coordinates for:<br>• `place="town"` (intermediate biker stops)<br>• `tourism="viewpoint"` & `tourism="attraction"`<br>• `natural="water"` & `waterway="waterfall"` (real named lakes & waterfalls)<br>• `mountain_pass="yes"` (real passes & altitudes)<br>• `amenity="fuel"`, `amenity="hospital"`, `shop="motorcycle"` |
| **4. Multi-Point Elevation & Weather** | **Open-Meteo Elevation & Forecast APIs** (`api.open-meteo.com`) | Real altitude in meters for every sampled point along the route + live temperature, wind, precipitation, and snow/rain alerts. |
| **5. Live Pass Status & Synthesis** | **Google Gemini (`gemini-3.5-flash-lite`)** + `constants.ts` | Uses live Google Search grounding + seasonal snow rules to flag which passes on the route are **OPEN vs. CLOSED** and synthesizes the real ORS/Overpass/Open-Meteo data into the structured itinerary. |

### 2.3 Functional Requirements

| ID | Requirement | Details |
| :--- | :--- | :--- |
| **FR-1** | **Live Nominatim Location Autocomplete** | Debounced (350ms) live search dropdown powered by OpenStreetMap Nominatim (`countrycodes=pk`) for `Start City` and `Destination`, allowing the user to pick from live OSM matches or type any custom town. |
| **FR-2** | **Home Page Route Pre-Fill** | Clicking *"Plan This Route"* on any of the 3 Legendary Roads cards on `Home.jsx` navigates to `/planner?from=...&to=...&days=...` and pre-fills the form. |
| **FR-3** | **Smart Duration & Pacing (Auto + Custom Days)** | Add **"Auto (Recommended)"** to the Days selector alongside `2, 3, 5, 7, 10, 14` days, and include all 12 months (`January`–`December`). Paces transit based on bike capability (`125cc` vs `Adventure`) and fills extra days with real named viewpoints/lakes discovered via Overpass around the destination. |
| **FR-4** | **In-Planner Pass Status Banner** | Show an explicit **Route Corridors & Pass Status** banner at the top of the generated itinerary displaying each mountain pass relevant to the route (`OPEN` / `CLOSED` / `CAUTION`), its altitude, why it is open/closed in the selected month, and which open corridor is used instead. |
| **FR-5** | **4-Pillar Uncluttered Day Cards** | Upgrade each Day Card in `ItineraryCard.jsx` to cleanly display:<br>1. **Exact Route Corridor / Highway Names**<br>2. **Ordered En-Route Waypoints & Named Viewpoints/Lakes**<br>3. **Road Surface & Terrain Condition**<br>4. **Fuel, Mechanic & Mobile Signal Logistics** |
| **FR-6** | **Tactical Rally Roadbook PDF (Option B)** | Add a **"Download PDF Roadbook"** button in `ItineraryOutput.jsx` that generates a high-contrast, sunlight-readable, print-ready **Tactical Rally Roadbook PDF**. |
| **FR-7** | **Accidental Refresh Protection** | Keep the active itinerary in `localStorage` so an accidental browser refresh on laptop doesn't wipe the plan before the user downloads the PDF. |
