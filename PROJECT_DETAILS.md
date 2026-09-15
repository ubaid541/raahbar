# RaahBar (Ride North) — Project Documentation & Status

> **RaahBar** is an AI-powered motorcycle expedition & travel planning web application specifically designed for riders and adventure travelers navigating the high-altitude mountain passes and highways of Northern Pakistan (Gilgit-Baltistan, Khyber Pakhtunkhwa, and Azad Jammu & Kashmir).

---

## 1. Project Overview

- **Repository**: `ubaid541/raahbar`
- **Primary Objective**: Help motorcycling enthusiasts plan safe, optimized, day-by-day expedition itineraries across Northern Pakistan with real-time pass updates, fuel stop alerts, altitude warnings, permit requirements, and rider-friendly basecamp recommendations.
- **Tech Stack**:
  - **Frontend Framework**: React 19 (`react`, `react-dom`)
  - **Routing**: React Router v7 (`react-router-dom`)
  - **Build System**: Vite 6 (`vite`)
  - **Styling & Design System**: Tailwind CSS v4 (`@tailwindcss/vite`), Motion (`motion/react`)
  - **Icons**: Lucide React (`lucide-react`)
  - **AI Service**: OpenRouter API (`stepfun/step-3.5-flash:free` with `nvidia/nemotron` fallback)
  - **Database & Backend**: Supabase JS Client (`@supabase/supabase-js`)

---

## 2. Directory & File Structure

```
d:\raahbar
├── .env                  # Environment variables (OpenRouter key, Supabase configuration)
├── .gitignore            # Git ignore patterns
├── README.md             # Standard run and setup guide
├── PROJECT_DETAILS.md    # Master project documentation & progress tracker
├── index.html            # Main HTML entry point (/src/main.jsx)
├── metadata.json         # Project metadata
├── package.json          # Dependencies, dev dependencies, and scripts
├── package-lock.json     # Locked dependency graph
├── vite.config.js        # Vite build & Tailwind CSS plugin configuration
├── public/
│   └── favicon.svg       # Application logo SVG
└── src/
    ├── App.jsx           # Application router shell & page layout wrapper
    ├── main.jsx          # React DOM entry point wrapping App with BrowserRouter
    ├── index.css         # Main stylesheet importing Tailwind CSS v4 & theme variables
    ├── constants.ts      # Static fallback datasets (Passes, Guesthouses, Mock Routes)
    ├── types.ts          # TypeScript interface definitions (Screen, MountainPass, Guesthouse, RouteDay)
    ├── lib/
    │   ├── openrouter.js # OpenRouter AI service caller with error handling & JSON parser
    │   ├── prompts.js    # Domain-specific AI prompt for Northern Pakistan routes
    │   └── supabase.js   # Supabase client setup with automatic mock fallback
    ├── components/
    │   ├── Navbar.jsx           # Top navigation bar (Desktop)
    │   ├── BottomNav.jsx        # Mobile bottom navigation bar
    │   ├── Footer.jsx           # Global footer with navigation links
    │   ├── TripForm.jsx         # Form parameters for expedition generator
    │   ├── ItineraryOutput.jsx  # Rendered trip results, gear checklist & permit requirements
    │   ├── ItineraryCard.jsx    # Card component for individual itinerary days
    │   ├── GuesthouseCard.jsx   # Card displaying guesthouse info & WhatsApp booking action
    │   └── PassStatusBadge.jsx  # Status indicator badge (OPEN / CLOSED)
    └── pages/
        ├── Home.jsx         # Hero landing page, features overview & legendary routes
        ├── Planner.jsx      # AI trip planning interface (TripForm + ItineraryOutput)
        ├── Guesthouses.jsx  # Basecamp directory with regional filter & rider tips
        └── PassStatus.jsx   # Real-time mountain pass status & seasonal advisories
```

---

## 3. Core Features Breakdown

### 3.1 AI Expedition Planner (`/planner`)
- **Inputs**: Starting City, Destination, Trip Duration (3–14 days), Travel Month, Bike Type (125cc, 150cc, 250cc, Adventure, Scrambler), and Rider Experience Level (Rookie, Intermediate, Veteran).
- **AI System Prompt**: Enforces critical domain knowledge:
  - Seasonal pass availability (Babusar, Shandur, Deosai, Khunjerab).
  - Fuel gaps (e.g. 200km+ gap on Skardu road, Chilas fuel warning).
  - Altitude sickness flags for days exceeding 3,500m.
  - Required SIM cards (SCOM in Gilgit-Baltistan).
  - Permits (NOC for restricted areas / foreigners).
- **Output**: Day-by-day route details, checkpoint recommendations, elevation indicators, fuel stop flags, lodging suggestions, essential gear checklist, and travel permits required.

### 3.2 Mountain Pass Status (`/passes`)
- Live indicators for key passes: Khunjerab, Babusar, Shandur, Lowari, Deosai, Broghil.
- Displays elevation in meters, open months/seasons, road conditions, and seasonal weather advisories.
- Queries Supabase `pass_status` table with automatic fallback to static data.

### 3.3 Rider Basecamps / Guesthouses (`/guesthouses`)
- Directory of motorcycle-friendly accommodation options across Gilgit-Baltistan (GB), Khyber Pakhtunkhwa (KPK), and Azad Jammu & Kashmir (AJK).
- Tags for "Rider Friendly" and "Budget Pro", direct WhatsApp contact link, and insider advice (parking security, solar power backup, advance booking).
- Queries Supabase `guesthouses` table with automatic fallback to static data.

---

## 4. Development & Progress Tracker

| Feature / Task | Status | Details |
| :--- | :---: | :--- |
| **Component Modularization** | `[x] Completed` | Converted prototype into modular JSX components and React Router v7 pages. |
| **OpenRouter AI Integration** | `[x] Completed` | AI generator setup with primary (`step-3.5-flash`) & fallback (`nemotron`) models. |
| **Supabase Setup & Fallbacks** | `[x] Completed` | Client created with automatic fallback to local datasets if env vars are missing. |
| **Responsive UX & Animation** | `[x] Completed` | Modern glassmorphism UI with Tailwind v4, Motion page transitions & mobile bottom nav. |
| **Clean Up Unused Legacy Files** | `[x] Completed` | Removed redundant `src/App.tsx` and `src/main.tsx` prototype files. |
| **Trip Saving & Sharing** | `[ ] Pending` | Allow users to save generated AI trips to database & generate shareable links. |
| **Interactive Map & Elevation** | `[ ] Pending` | Add visual route map (Leaflet/Mapbox) and elevation profile graph. |
| **Live Weather API Integration** | `[ ] Pending` | Fetch live meteorological advisory for mountain passes. |

---

## 5. Environment Variables Guide

In `.env`:

```env
# OpenRouter API Key for AI Expedition Planner
VITE_OPENROUTER_API_KEY="sk-or-v1-..."

# Supabase Credentials (Optional — static fallback used if not provided)
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
3. **Open Application**: Navigate to `http://localhost:3000` in your browser.

---

*Last Updated: September 15, 2026*
