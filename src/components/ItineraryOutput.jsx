import { useState } from 'react';
import { Wrench, FileText, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import ItineraryCard from './ItineraryCard.jsx';
import ShareMenu from './ShareMenu.jsx';
import AlertStrip from './AlertStrip.jsx';
import DayTabs from './DayTabs.jsx';
import { downloadTacticalRoadbookPDF } from '../lib/pdfRoadbook.js';

export default function ItineraryOutput({ itinerary }) {
  const [paceOpen, setPaceOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  if (!itinerary) return null;

  const totalDistText =
    itinerary.totalDistanceKm != null
      ? `${itinerary.totalDistanceKm} km`
      : itinerary.totalDistance || 'N/A';

  const handleCopy = () => {
    const passLines =
      Array.isArray(itinerary.passStatuses) && itinerary.passStatuses.length > 0
        ? [
            '--- MOUNTAIN PASS & CORRIDOR STATUS ---',
            ...itinerary.passStatuses.map(
              (p) =>
                `• ${p.name} (${p.altitudeM || ''}m): [${p.status}] — ${p.reason}${
                  p.alternativeCorridor ? ` | Active Route: ${p.alternativeCorridor}` : ''
                }`
            ),
            '',
          ]
        : [];

    const textLines = [
      `🏍️ ${itinerary.tripTitle || 'RaahBar Expedition Plan'}`,
      `📍 Route: ${itinerary.startPoint} → ${itinerary.endPoint}`,
      itinerary.primaryCorridor ? `🛣️ Corridor: ${itinerary.primaryCorridor}` : '',
      `📏 Total Distance: ${totalDistText} | Duration: ${itinerary.totalDays} Days`,
      itinerary.weatherSummary ? `🌤️ Weather: ${itinerary.weatherSummary}` : '',
      '',
      ...passLines,
      '--- DAY BY DAY 4-PILLAR ITINERARY ---',
      ...(itinerary.days || []).map(
        (d) =>
          `Day ${d.day}: ${d.title} (${d.distanceKm || d.distance || ''} km, ${
            d.durationHrs || d.duration || ''
          } hrs)\n` +
          `  Corridor: ${d.highwayCorridor || itinerary.primaryCorridor || 'Highway'}\n` +
          `  Route: ${d.startLocation} -> ${d.endLocation} (Peak Alt: ${
            d.altitudeM ? d.altitudeM + 'm' : 'N/A'
          })\n` +
          `  Surface: ${d.roadSurface || 'Paved / Mountain Road'}\n` +
          (d.checkpoints?.length
            ? `  Checkpoints: ${d.checkpoints.map((c) => `${c.name} (${c.kmFromStart}km)`).join(' -> ')}\n`
            : '') +
          `  Sleep: ${d.sleepLocation || 'N/A'} | Signal: ${d.mobileSignal || 'Standard'}\n` +
          (d.fuelWarning ? `  ⚠️ Fuel Warning: ${d.fuelWarning}\n` : '')
      ),
      '',
      '--- EMERGENCY CONTACTS ---',
      ...(itinerary.emergencyContacts || []).map((c) => `- ${c}`),
    ]
      .filter((line) => line !== null && line !== undefined && line !== '')
      .join('\n');

    navigator.clipboard.writeText(textLines);
  };

  const routeTitle =
    itinerary.startPoint && itinerary.endPoint
      ? `${itinerary.startPoint} → ${itinerary.endPoint}`
      : itinerary.tripTitle || 'Your trip';
  const hasGear = itinerary.gearChecklist?.length > 0;
  const hasPermits = itinerary.permits?.length > 0;
  const showPrep = hasGear || hasPermits;
  const days = Array.isArray(itinerary.days) ? itinerary.days : [];
  const isPrep = activeTab === 'prep' && showPrep;
  const safeIndex =
    typeof activeTab === 'number'
      ? Math.min(Math.max(activeTab, 0), Math.max(days.length - 1, 0))
      : 0;
  const activeDay = days[safeIndex];
  const paceDetails = [
    itinerary.pacingAdvisory,
    itinerary.bestMonths ? `Best time to ride: ${itinerary.bestMonths}.` : '',
    itinerary.primaryCorridor ? `Main corridor: ${itinerary.primaryCorridor}.` : '',
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <div className="trip-ui">
        {/* Header: title + subline + share (top right) */}
        <header>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="tu-title truncate">{routeTitle}</h3>
              <p className="tu-sub mt-1">
                {totalDistText} · {itinerary.totalDays} days
              </p>
            </div>
            <ShareMenu
              onPdf={() => downloadTacticalRoadbookPDF(itinerary)}
              onCopy={handleCopy}
            />
          </div>

          {/* Smart pacing folded into header as one line (expands on tap) */}
          {paceDetails.length > 0 && (
            <button
              type="button"
              className="mt-3 w-full text-left cursor-pointer"
              aria-expanded={paceOpen}
              onClick={() => setPaceOpen((o) => !o)}
            >
              <span className={`block tu-sub ${paceOpen ? '' : 'truncate'}`}>
                {paceOpen ? paceDetails.join(' ') : paceDetails[0]}
              </span>
            </button>
          )}
        </header>

        {/* Single alert strip: pass status + route warnings */}
        <div className="tu-section">
          <AlertStrip
            passStatuses={itinerary.passStatuses}
            warnings={itinerary.warnings}
          />
        </div>

        {/* Day tabs + active view (active day OR "Before you go") */}
        {(days.length > 0 || showPrep) && (
          <div className="tu-section space-y-4">
            <DayTabs
              days={days}
              activeTab={isPrep ? 'prep' : safeIndex}
              onSelect={setActiveTab}
              showPrep={showPrep}
            />

            {isPrep ? (
              <>
                <section className="tu-card space-y-6" style={{ padding: 16 }}>
                  {hasGear && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-[var(--tu-text-2)] shrink-0" />
                        <h4 className="text-[16px] text-[var(--tu-text)]" style={{ fontWeight: 600 }}>
                          Essential gear
                        </h4>
                      </div>
                      <ul className="space-y-2">
                        {itinerary.gearChecklist.map((g, i) => (
                          <li key={i} className="flex items-start gap-2 text-[14px] text-[var(--tu-text)]">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[var(--tu-text-2)]" />
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {hasPermits && (
                    <div className={`space-y-3 ${hasGear ? 'pt-4 border-t border-[var(--tu-line)]' : ''}`}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[var(--tu-text-2)] shrink-0" />
                        <h4 className="text-[16px] text-[var(--tu-text)]" style={{ fontWeight: 600 }}>
                          Permits and entry
                        </h4>
                      </div>
                      <ul className="space-y-2">
                        {itinerary.permits.map((p, i) => (
                          <li key={i} className="text-[14px] text-[var(--tu-text)]">
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>

                {days.length > 0 && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      className="tu-btn-primary"
                      onClick={() => {
                        setActiveTab(0);
                        window.scrollTo?.({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Day 1
                    </button>
                  </div>
                )}
              </>
            ) : (
              activeDay && (
                <>
                  <ItineraryCard
                    key={activeDay.day}
                    day={activeDay}
                    weather={itinerary.weatherSummary}
                    emergencyContacts={itinerary.emergencyContacts}
                  />

                  {/* Footer: single Next day button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      className="tu-btn-primary"
                      disabled={safeIndex >= days.length - 1}
                      style={safeIndex >= days.length - 1 ? { opacity: 0.4, cursor: 'default' } : undefined}
                      onClick={() => {
                        setActiveTab(safeIndex + 1);
                        window.scrollTo?.({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      Next day
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
