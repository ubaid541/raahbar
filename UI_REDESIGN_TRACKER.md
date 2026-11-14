# Trip Planner UI/UX Redesign - Progress Tracker

> **Resume rule:** find the first task that is not `[x]`, read its notes, continue. Update this file after every task.

**Scope:** `ItineraryOutput.jsx` + `ItineraryCard.jsx` (+ new sub-components, scoped CSS in `index.css`).
**Untouched (MVP-critical):** `Planner.jsx` (localStorage refresh protection, FR-7), `pdfRoadbook.js` (FR-6 engine), `routing.js`, `openrouter.js`, `prompts.js`, data schema (`itinerary` JSON shape).
**Backups:** `src/components/ItineraryOutput.bak.jsx`, `src/components/ItineraryCard.bak.jsx` (restore = copy over originals).

## MVP guard-rails (must remain true after every task)
- FR-4: pass statuses (name, altitude, status, reason, bypass corridor) all still reachable.
- FR-5: 4 pillars present per day (corridor, ordered checkpoints, surface/terrain, fuel/mechanic/signal).
- FR-6: PDF download still calls `downloadTacticalRoadbookPDF(itinerary)`.
- FR-7: `Planner.jsx` unchanged.
- No itinerary data fields dropped (emergency contacts, gear, permits, pacing, warnings, weather).

## Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 0 | Backup current UI + MVP conflict review | `[x]` Done | `.bak.jsx` files created |
| 1 | Design tokens (scoped `.trip-ui`: #0F1115, #E5E7EB, #A1A8B3, 14/13/12px, weights 400/600) in `index.css` | `[x]` Done | Appended to end of `src/index.css`; classes `tu-*` |
| 2 | `ShareMenu.jsx` - single icon Share button (PDF + Copy inside) | `[x]` Done | Props `onPdf`, `onCopy`; not wired yet (Task 4) |
| 3 | `AlertStrip.jsx` - single red row, expands to pass details + warnings + bypass; dedupes CLOSED | `[x]` Done | Props `passStatuses`, `warnings`; not wired yet (Task 4) |
| 4 | Trip header (22px/600 title, "km - days" subline, pacing one-liner, Share right) + remove badges; wire ShareMenu + AlertStrip | `[x]` Done | ItineraryOutput.jsx rewritten top part; build OK. Old badges/banners/pass block removed. bestMonths + primaryCorridor moved into expandable pacing line. Weather chip removed from header (goes into Day card in Task 6 via `itinerary.weatherSummary`). Ancillary (emergency/gear/permits) still OLD style until Task 8 |
| 5 | `DayTabs.jsx` + Day selection state in `ItineraryOutput.jsx` (Day card above fold) | `[x]` Done | Only active day rendered; state `dayIndex` (clamped). Footer "Next day" comes in Task 8 |
| 6 | `ItineraryCard.jsx` rewrite - one-line day header, weather, vertical timeline, inline fuel/hazard markers | `[x]` Done | New props `day`, `weather`. Timeline merges checkpoints + fuelStops (km parsed from text) + mechanic + fuelWarning (hazard). Road surface one line; bikeAdvisory/highlights behind "More about this day". `sleepLocation`, `mobileSignal`, `tips`, `day.warnings` NOT yet rendered -> Task 7 (placeholder comment in file) |
| 7 | Overnight block (hotel, area, map/call, signal, tip) + per-day warnings as one-line expandable items | `[x]` Done | In ItineraryCard.jsx. Map link always; Call only if a phone number is found in `sleepLocation` (no phone field in schema) |
| 8 | Footer "Next day" + Emergency/Gear/Permits as neutral collapsible section | `[x]` Done | `Collapse` accordion in ItineraryOutput.jsx; Next day disabled on last day. Build OK |
| 9a | `vite build` + SSR render smoke test (13 structural checks + empty-days edge case) | `[x]` Done | All pass |
| 9b | Update `PROJECT_DETAILS.md` | `[x]` Done | Added UI redesign section |
| 9c | Real-browser visual check (spacing, overflow, 14px legibility, interactions) | `[x]` Done | Full end-to-end test on `/planner` (Lahore -> Skardu, 7 days, Dec, 150CC) on desktop & 375x812 mobile. Header, ShareMenu, AlertStrip, DayTabs, DayCard timeline, Overnight block, Next day, Trip essentials all passed with zero horizontal overflow. |

## Log
- 14:23 - Task 0 done (backups).
- 14:28 - Tasks 1-3 done (new files only; ItineraryOutput still renders the OLD UI until Task 4/5).
- 14:32 - Tasks 4-8 done, `vite build` passes. Remaining: Task 9 (visual check with sample data, docs).
- 14:34 - Task 9a/9b done. 9c waiting on user (see above). Dev server stopped; scratch files removed.
- 14:39 - Task 9c done: full browser QA pass completed (desktop + 375x812 mobile). Dev server stopped. All tasks complete.
- 14:46 - Aligned `.trip-ui` palette and card framing in `src/index.css` (`--color-surface`, `--color-surface-high`, `--color-surface-highest`, `--color-on-surface`, `--color-on-surface-variant`, `--color-primary`, `--color-error`) and replaced hardcoded cool slate hex classes in `ShareMenu.jsx`, `AlertStrip.jsx`, `ItineraryCard.jsx`, and `ItineraryOutput.jsx` with `var(--tu-*)` tokens so the trip planner matches the warm dark site theme.
- 15:21 - Split Day card meta line into 3 scannable stats (`km · hrs · °C night`) + tap-to-reveal `Highways` corridor toggle; moved `Essential gear` and `Permits and entry` into a dedicated `Before you go` tab in `DayTabs.jsx` / `ItineraryOutput.jsx` (nothing sits below `Next day`); moved `Emergency contacts` inside `ItineraryCard.jsx` filtered to each day's route with clickable `tel:` links. Verified via `npx vite build` (`8.73s`) and full desktop (1440x900) + mobile (375x812) browser QA with 0 console errors. Dev server stopped.
