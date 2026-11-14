# RaahBar (Ride North) — Project Documentation & Status

> **RaahBar** is an AI-powered motorcycle expedition & travel planning web application specifically designed for riders and adventure travelers navigating the high-altitude mountain passes and highways of Northern Pakistan (Gilgit-Baltistan, Khyber Pakhtunkhwa, and Azad Jammu & Kashmir).

---

## 1. Project Overview

- **Repository**: `ubaid541/raahbar`
- **Primary Objective**: Help motorcycling enthusiasts plan safe, grounded, day-by-day expedition itineraries across Northern Pakistan with real-world highway corridors, live weather, real altitude profiles, ordered en-route viewpoints/lakes, fuel gap warnings, mountain pass status advisories, and downloadable offline PDF rally roadbooks.
- **Tech Stack**:
  - **Frontend Framework**: React 19 (`react`, `react-dom`)
  - **Routing**: React Router v7 (`react-router-dom`)
  - **Build System**: Vite 6 (`vite`)
  - **Styling & Design System**: Tailwind CSS v4 (`@tailwindcss/vite`), Motion (`motion/react`)
  - **Icons**: Lucide React (`lucide-react`)
  - **AI Model & Live Search**: Official Google Gemini SDK (`@google/genai`) using **`gemini-3.5-flash-lite`** with `googleSearch` grounding
  - **Geocoding & Autocomplete API**: OpenStreetMap Nominatim API (Free, keyless)
  - **Routing API**: OpenRouteService GeoJSON API (`/v2/directions/driving-car/geojson` with `avoid_features: ["highways"]` & `instructions: true`)
  - **Weather API**: Open-Meteo Weather API (Free, keyless)
  - **Elevation API**: Open-Meteo Elevation API (Copernicus DEM 90m, Free, keyless)
  - **En-Route POIs & Infrastructure API**: Overpass API / OpenStreetMap (Single-batched query for towns, viewpoints, lakes, waterfalls, mountain passes, fuel stations, hospitals & mechanics)

---

## 2. Directory & File Structure

```
d:\raahbar
├── .env                  # Environment variables (GEMINI_API_KEY, VITE_ORS_API_KEY, VITE_OPENROUTER_API_KEY)
├── .gitignore            # Git ignore patterns
├── README.md             # Standard run and setup guide
├── PROJECT_DETAILS.md    # Master project documentation & progress tracker
├── implementation_plan.md# Master v1 MVP Requirements & Task Tracker
├── index.html            # Main HTML entry point (/src/main.jsx)
├── package.json          # Dependencies, dev dependencies, and scripts
├── vite.config.js        # Vite build, env exposure & Tailwind CSS plugin configuration
└── src/
    ├── App.jsx           # Application router shell & page layout wrapper
    ├── main.jsx          # React DOM entry point
    ├── index.css         # Main stylesheet with Tailwind CSS v4
    ├── constants.ts      # Pass & Guesthouse datasets, CRITICAL_FUEL_GAPS, EMERGENCY_CONTACTS
    ├── types.ts          # TypeScript interfaces
    ├── lib/
    │   ├── routing.js    # 100% Dynamic Live Data Module (Nominatim, ORS GeoJSON, Open-Meteo, Single-Batch Overpass)
    │   ├── openrouter.js # Gemini 3.5 Flash-Lite pipeline + Live-Grounded Deterministic Synthesizer
    │   ├── prompts.js    # 4-Pillar prompt builder + Seasonal & Live Pass Status evaluator
    │   ├── pdfRoadbook.js# Tactical Rally Roadbook PDF generator (Option B)
    │   └── supabase.js   # Supabase client setup (reserved for v2)
    ├── components/
    │   ├── Navbar.jsx           # Top navigation bar
    │   ├── BottomNav.jsx        # Mobile bottom navigation
    │   ├── Footer.jsx           # Global footer
    │   ├── TripForm.jsx         # Live Nominatim autocomplete + Auto/Custom Days + 12 Months + URL Pre-fill
    │   ├── ItineraryOutput.jsx  # Trip header, Pass Status Banner, Pacing Advisory, PDF Roadbook download
    │   ├── ItineraryCard.jsx    # 4-Pillar Day Cards (Highways, Checkpoints/Lakes, Surface, Fuel/Mechanic/Signal)
    │   ├── GuesthouseCard.jsx   # Basecamp directory card (v2)
    │   └── PassStatusBadge.jsx  # Pass status badge
    └── pages/
        ├── Home.jsx         # Hero landing page with pre-filled Legendary Roads links
        ├── Planner.jsx      # Expedition Planner interface with localStorage refresh protection
        ├── Guesthouses.jsx  # Basecamp directory (v2)
        └── PassStatus.jsx   # Standalone Pass directory (v2)
```

---

## 3. v1 MVP Development & Progress Tracker

| Task ID | Feature / Task | Status | Details |
| :---: | :--- | :---: | :--- |
| **Task 1** | **MVP Requirements & Plan Setup** | `[x] Completed` | Saved `implementation_plan.md` & initialized task trackers. |
| **Task 2** | **100% Dynamic Live Routing (`routing.js`)** | `[x] Completed` | Added `searchLocations()` live autocomplete, fixed ORS `/geojson` with motorway avoidance & road name extraction, and built single-batch Overpass POI/infrastructure query. |
| **Task 3** | **4-Pillar Prompt & Pass Evaluator (`prompts.js`)** | `[x] Completed` | Added `evaluateRoutePasses()`, injected live ORS/Overpass/Open-Meteo data, and enforced 4-pillar JSON schema. |
| **Task 4** | **Single Free Gemini (`gemini-3.5-flash-lite`)** | `[x] Completed` | Held old OpenRouter models, integrated `@google/genai` (`gemini-3.5-flash-lite` + `googleSearch`), and built live-grounded synthesizer fallback. |
| **Task 5** | **Form Autocomplete & Home Pre-Fill** | `[x] Completed` | Added live Nominatim dropdowns, `Auto (Recommended)` days, 12 months, and URL pre-fill from `Home.jsx`. |
| **Task 6** | **4-Pillar Day Cards & Pass Status Banner** | `[x] Completed` | Upgraded `ItineraryCard.jsx`, `ItineraryOutput.jsx`, and `Planner.jsx` with Pass Status Banner and `localStorage` refresh protection. |
| **Task 7** | **Tactical Rally Roadbook PDF (`pdfRoadbook.js`)** | `[x] Completed` | Built high-contrast sunlight-readable & print-ready PDF Roadbook generator (Option B). |
| **Task 8** | **Production Build & Final Verification** | `[x] Completed` | Verified clean Vite production build (`npm run build`) and updated documentation. |

---

## 4. Environment Variables Guide

In `.env`:

```env
# Official Google AI Studio Free Tier Key (for gemini-3.5-flash-lite)
GEMINI_API_KEY="AIza..."

# OpenRouteService API Key (Free tier, no billing required)
VITE_ORS_API_KEY="eyJvcm..."

# Optional OpenRouter Free Fallback Key
VITE_OPENROUTER_API_KEY="sk-or-v1-..."
```

---

## 5. Trip Planner UI/UX Redesign (Post-MVP)

Rider-first itinerary screen: header + Share menu, single alert strip (pass status + warnings), day tabs, one-day hero card with vertical timeline, overnight block, Next-day footer, collapsible trip essentials. Dark theme kept; orange = brand/CTA only, red = danger only.

- New components: `ShareMenu.jsx`, `AlertStrip.jsx`, `DayTabs.jsx`; rewritten: `ItineraryOutput.jsx`, `ItineraryCard.jsx`; scoped styles (`.trip-ui`) appended to `index.css`.
- Data schema, `Planner.jsx`, `pdfRoadbook.js` and the AI/routing pipeline are unchanged (FR-4/5/6/7 preserved).
- Backups of the previous UI: `ItineraryOutput.bak.jsx`, `ItineraryCard.bak.jsx`.
- Task-by-task status: `UI_REDESIGN_TRACKER.md`.
