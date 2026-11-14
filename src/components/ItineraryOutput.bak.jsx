import { useState } from 'react';
import {
  Wrench,
  FileText,
  CheckCircle2,
  Calendar,
  CloudSun,
  Phone,
  Copy,
  Check,
  FileDown,
  Mountain,
  Route,
  Info,
} from 'lucide-react';
import ItineraryCard from './ItineraryCard.jsx';
import { downloadTacticalRoadbookPDF } from '../lib/pdfRoadbook.js';

export default function ItineraryOutput({ itinerary }) {
  const [copied, setCopied] = useState(false);

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
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getPassBadgeStyle = (status) => {
    const s = String(status || 'OPEN').toUpperCase();
    if (s === 'CLOSED') {
      return 'bg-error-container/40 text-error border-error/40';
    }
    if (s === 'CAUTION') {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
    return 'bg-secondary-container text-secondary border-secondary/40';
  };

  return (
    <div className="space-y-8">
      {/* Trip Header */}
      <div className="bg-secondary-container/10 rounded-3xl p-1 border border-secondary/10 overflow-hidden">
        <div className="bg-secondary-container/20 p-6 md:p-8 rounded-[1.4rem] space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-secondary text-secondary-container px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-label">
                  Grounded Real-World Route
                </span>
                {itinerary.bestMonths && (
                  <span className="bg-surface-highest text-on-surface-variant text-xs px-3 py-1 rounded-full inline-flex items-center gap-1.5 font-medium border border-white/5">
                    <Calendar className="w-3.5 h-3.5 text-secondary shrink-0" />
                    <span>Best: {itinerary.bestMonths}</span>
                  </span>
                )}
                {itinerary.weatherSummary && (
                  <span className="bg-surface-highest text-secondary text-xs px-3 py-1 rounded-full inline-flex items-center gap-1.5 font-medium border border-white/5">
                    <CloudSun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{itinerary.weatherSummary}</span>
                  </span>
                )}
              </div>
              <h3 className="text-2xl md:text-3xl font-headline font-bold">{itinerary.tripTitle}</h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
                <span>
                  {itinerary.startPoint} → {itinerary.endPoint}
                </span>
                {itinerary.primaryCorridor && (
                  <span className="inline-flex items-center gap-1 text-xs bg-surface-highest px-3 py-1 rounded-lg border border-white/5 text-primary font-bold">
                    <Route className="w-3.5 h-3.5 shrink-0" />
                    <span>{itinerary.primaryCorridor}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-3 shrink-0 w-full md:w-auto">
              {/* Action Buttons: Download Tactical PDF Roadbook + Copy Plan */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => downloadTacticalRoadbookPDF(itinerary)}
                  className="inline-flex items-center gap-1.5 bg-primary text-background font-bold text-xs px-4 py-2.5 rounded-full hover:brightness-110 transition-all shadow-lg shadow-primary/20 min-h-[38px]"
                >
                  <FileDown className="w-4 h-4" />
                  Download PDF Roadbook
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 bg-surface-highest text-on-surface border border-white/10 font-bold text-xs px-4 py-2.5 rounded-full hover:bg-surface-high transition-all min-h-[38px]"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-secondary" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Plan
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3 text-right">
                <div>
                  <span className="block text-secondary font-headline font-bold text-xl leading-none">
                    {totalDistText}
                  </span>
                  <span className="text-[10px] text-outline uppercase font-label font-bold">
                    Total Distance
                  </span>
                </div>
                <div className="border-l border-white/10 pl-3">
                  <span className="block text-on-surface font-headline font-bold text-xl leading-none">
                    {itinerary.totalDays} Days
                  </span>
                  <span className="text-[10px] text-outline font-label uppercase font-bold">
                    Duration
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Route Corridors & Pass Status Banner (Option 1 MVP Integration) */}
          {Array.isArray(itinerary.passStatuses) && itinerary.passStatuses.length > 0 && (
            <div className="bg-surface/90 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="font-label text-xs font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                  <Mountain className="w-4 h-4 text-primary" />
                  Route Corridors &amp; Mountain Pass Status
                </p>
                <span className="text-[10px] font-mono text-on-surface-variant">
                  Seasonal + Corridor Verification
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {itinerary.passStatuses.map((pass, idx) => (
                  <div
                    key={idx}
                    className="bg-surface-highest/70 border border-white/5 rounded-xl p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-headline font-bold text-sm text-on-surface">
                        {pass.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {pass.altitudeM && (
                          <span className="font-mono text-[11px] text-on-surface-variant">
                            {pass.altitudeM}m
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border ${getPassBadgeStyle(
                            pass.status
                          )}`}
                        >
                          {pass.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-snug">{pass.reason}</p>
                    {pass.alternativeCorridor && (
                      <p className="text-[11px] text-primary font-semibold pt-1 border-t border-white/5">
                        Active Bypass: {pass.alternativeCorridor}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Smart Pacing Advisory */}
          {itinerary.pacingAdvisory && (
            <div className="bg-primary/10 border border-primary/25 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-on-surface leading-relaxed">
                <span className="font-bold uppercase tracking-wider text-primary block mb-0.5">
                  Smart Rider Pacing &amp; Excursions
                </span>
                {itinerary.pacingAdvisory}
              </div>
            </div>
          )}

          {/* Global Warnings */}
          {itinerary.warnings?.length > 0 && (
            <div className="bg-error-container/20 border border-error/20 rounded-xl p-4 space-y-2">
              <p className="font-label text-xs font-black uppercase text-error">
                Critical Route Warnings
              </p>
              <ul className="space-y-1">
                {itinerary.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-on-background flex items-start gap-2">
                    <span className="text-error mt-0.5">⚠</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Day Cards */}
          <div className="space-y-6">
            {itinerary.days?.map((day) => (
              <ItineraryCard key={day.day} day={day} />
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Contacts, Gear & Permits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Emergency Contacts */}
        {itinerary.emergencyContacts?.length > 0 && (
          <div className="bg-surface rounded-3xl p-8 border-t-8 border-amber-500 space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="text-amber-400 w-6 h-6" />
              <h4 className="font-headline text-lg font-bold uppercase tracking-tight">
                Emergency Contacts
              </h4>
            </div>
            <ul className="space-y-3">
              {itinerary.emergencyContacts.map((contact, i) => (
                <li
                  key={i}
                  className="bg-surface-highest/60 p-3 rounded-xl border border-white/5 text-xs"
                >
                  <p className="font-bold text-on-surface">{contact}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Essential Gear */}
        {itinerary.gearChecklist?.length > 0 && (
          <div className="bg-surface rounded-3xl p-8 border-t-8 border-primary space-y-4">
            <div className="flex items-center gap-3">
              <Wrench className="text-primary w-6 h-6" />
              <h4 className="font-headline text-lg font-bold uppercase tracking-tight">
                Essential Gear
              </h4>
            </div>
            <ul className="space-y-3">
              {itinerary.gearChecklist.map((item, i) => (
                <li key={i} className="flex items-center gap-3 group">
                  <div className="w-5 h-5 rounded border-2 border-outline-variant group-hover:border-primary transition-colors flex items-center justify-center shrink-0">
                    <CheckCircle2 className="text-primary w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="font-medium text-xs text-on-surface-variant group-hover:text-on-surface">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Permits */}
        {itinerary.permits?.length > 0 && (
          <div className="bg-surface rounded-3xl p-8 border-t-8 border-tertiary space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="text-tertiary w-6 h-6" />
              <h4 className="font-headline text-lg font-bold uppercase tracking-tight">
                Permits &amp; Entry
              </h4>
            </div>
            <div className="space-y-3">
              {itinerary.permits.map((permit, i) => (
                <div
                  key={i}
                  className="bg-surface-highest/60 p-3 rounded-xl flex justify-between items-center border border-white/5"
                >
                  <p className="font-bold text-xs text-on-surface">{permit}</p>
                  <FileText className="text-tertiary w-4 h-4 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
