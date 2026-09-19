# RaahBar (Ride North) — Project Documentation & Status

> **RaahBar** is an AI-powered motorcycle expedition & travel planning web application specifically designed for riders and adventure travelers navigating the high-altitude mountain passes and highways of Northern Pakistan (Gilgit-Baltistan, Khyber Pakhtunkhwa, and Azad Jammu & Kashmir).

---

## 1. Project Overview

- **Repository**: `ubaid541/raahbar`
- **Primary Objective**: Help motorcycling enthusiasts plan safe, grounded, day-by-day expedition itineraries across Northern Pakistan with real-world road data, live weather, real altitude profiles, fuel gap warnings, permit requirements, and emergency medical/repair contacts.
- **Tech Stack**:
  - **Frontend Framework**: React 19 (`react`, `react-dom`)
  - **Routing**: React Router v7 (`react-router-dom`)
  - **Build System**: Vite 6 (`vite`)
  - **Styling & Design System**: Tailwind CSS v4 (`@tailwindcss/vite`), Motion (`motion/react`)
  - **Icons**: Lucide React (`lucide-react`)
  - **AI Model & Web Search**: OpenRouter API (`stepfun/step-3.5-flash` with `web_search` tool enabled)
  - **Geocoding API**: OpenStreetMap Nominatim API (Free, keyless)
  - **Routing API**: OpenRouteService (ORS driving-car profile)
  - **Weather API**: Open-Meteo Weather API (Free, keyless)
  - **Elevation API**: Open-Meteo Elevation API (Copernicus DEM 90m, Free, keyless)
  - **Infrastructure API**: Overpass API / OpenStreetMap (Free, keyless fuel & hospital query)
  - **Database & Backend**: Supabase JS Client (`@supabase/supabase-js`)

---

## 2. Directory & File Structure

```
d:\raahbar
├── .env                  # Environment variables (OpenRouter key, ORS key, Supabase config)
├── .gitignore            # Git ignore patterns
├── README.md             # Standard run and setup guide
├── PROJECT_DETAILS.md    # Master project documentation & progress tracker
├── index.html            # Main HTML entry point (/src/main.jsx)
├── package.json          # Dependencies, dev dependencies, and scripts
├── vite.config.js        # Vite build & Tailwind CSS plugin configuration
└── src/
    ├── App.jsx           # Application router shell & page layout wrapper
    ├── main.jsx          # React DOM entry point
    ├── index.css         # Main stylesheet with Tailwind CSS v4
    ├── constants.ts      # Pass & Guesthouse datasets, CRITICAL_FUEL_GAPS, EMERGENCY_CONTACTS
    ├── types.ts          # TypeScript interfaces
    ├── lib/
    │   ├── routing.js    # Grounding module orchestrating Nominatim, ORS, Open-Meteo & Overpass
    │   ├── openrouter.js # Multi-stage agent pipeline + AbortController + fallback generator
    │   ├── prompts.js    # Strict anti-hallucination prompt builder with fuel & emergency injection
    │   └── supabase.js   # Supabase client setup
    ├── components/
    │   ├── Navbar.jsx           # Top navigation bar
    │   ├── BottomNav.jsx        # Mobile bottom navigation
    │   ├── Footer.jsx           # Global footer
    │   ├── TripForm.jsx         # Form parameters + cancellation + progressive loading steps
    │   ├── ItineraryOutput.jsx  # Trip header, weather alert, day cards, copy button, emergency contacts
    │   ├── ItineraryCard.jsx    # Day cards with real distance, duration, altitude level & Google Maps link
    │   ├── GuesthouseCard.jsx   # Basecamp directory card
    │   └── PassStatusBadge.jsx  # Pass status badge
    └── pages/
        ├── Home.jsx         # Hero landing page
        ├── Planner.jsx      # Expedition Planner interface
        ├── Guesthouses.jsx  # Basecamp directory
        └── PassStatus.jsx   # Pass status directory
```

---

## 3. Core Features & Pipeline

### 3.1 Grounded Agentic AI Planner (`/planner`)
- **Stage 1 (Parallel Data Fetch)**:
  - **Nominatim**: Geocodes user start city and destination.
  - **OpenRouteService**: Fetches exact road distance, duration, and daily legs.
  - **Open-Meteo Weather**: Retrieves current temperature, rain/snow conditions, wind, and weather alerts for destination.
  - **Open-Meteo Elevation**: Obtains elevation in meters for each day's endpoint.
  - **Overpass API**: Searches for mapped fuel stations, hospitals, and motorcycle repair shops near endpoints.
- **Stage 2 (AI Enrichment)**:
  - Injects all fetched data into `stepfun/step-3.5-flash`.
  - Enables `web_search` tool so the model scans live advisories for active landslides, road blockages, and pass openings.
  - Applies static expert knowledge bases for **CRITICAL_FUEL_GAPS** and **EMERGENCY_CONTACTS**.
- **Stage 3 (User Experience)**:
  - Progressive status updates during loading (`🗺️ Locating...`, `🛣️ Fetching road data...`, `🤖 Scanning live passes...`).
  - Request cancellation (`AbortController`) if user re-submits form while loading.
  - Google Maps direct links (`https://www.google.com/maps/dir/...`) per day card.
  - One-click **Copy Expedition Plan** formatted for WhatsApp/clipboard sharing.

---

## 4. Development & Progress Tracker

| Feature / Task | Status | Details |
| :--- | :---: | :--- |
| **Planner Real-World Grounding** | `[x] Completed` | Grounded AI planner in ORS, Nominatim, Open-Meteo, Overpass & stepfun web_search. |
| **Fuel Gap & Emergency Database** | `[x] Completed` | Added hand-verified fuel gaps & regional emergency contacts in `constants.ts`. |
| **Altitude & Terrain Engine** | `[x] Completed` | Open-Meteo Elevation integration with altitude level badges and acclimatization warnings. |
| **Progressive Status & Abort Logic** | `[x] Completed` | Added real-time stage progress updates and request cancellation support. |
| **Google Maps Deep-Links & Copying** | `[x] Completed` | Added Google Maps direction links per day card and one-click copy button. |
| **Focus on Planner Section** | `[x] Active` | Guesthouses & Passes routes temporarily commented out to focus 100% on Expedition Planner. |
| **Supabase Sync & Trip Saving** | `[ ] Pending` | Allow riders to save generated trips to Supabase database. |

---

## 5. Environment Variables Guide

In `.env`:

```env
# OpenRouter API Key for AI Expedition Planner
VITE_OPENROUTER_API_KEY="sk-or-v1-..."

# OpenRouteService API Key (Free tier, no billing required)
VITE_ORS_API_KEY="eyJvcm..."

# Supabase Credentials (Optional)
VITE_SUPABASE_URL="https://your-supabase-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

---

## 6. How to Run Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Start Dev Server**:
   ```bash
   npm run dev
   ```
3. **Build for Production**:
   ```bash
   npm run build
   ```

---

*Last Updated: September 19, 2026*
