import { useState } from 'react';
import { Wrench, FileText, CheckCircle2, Calendar, CloudSun, Phone, Copy, Check } from 'lucide-react';
import ItineraryCard from './ItineraryCard.jsx';

export default function ItineraryOutput({ itinerary }) {
  const [copied, setCopied] = useState(false);

  if (!itinerary) return null;

  const totalDistText = itinerary.totalDistanceKm != null
    ? `${itinerary.totalDistanceKm} km`
    : (itinerary.totalDistance || 'N/A');

  const handleCopy = () => {
    const textLines = [
      `🏍️ ${itinerary.tripTitle || 'RaahBar Expedition Plan'}`,
      `📍 Route: ${itinerary.startPoint} → ${itinerary.endPoint}`,
      `📏 Total Distance: ${totalDistText} | Duration: ${itinerary.totalDays} Days`,
      itinerary.weatherSummary ? `🌤️ Weather: ${itinerary.weatherSummary}` : '',
      '',
      '--- DAY BY DAY ITINERARY ---',
      ...(itinerary.days || []).map(
        (d) =>
          `Day ${d.day}: ${d.title} (${d.distanceKm || d.distance || ''} km, ${d.durationHrs || d.duration || ''} hrs)\n` +
          `  Route: ${d.startLocation} -> ${d.endLocation}\n` +
          `  Altitude: ${d.altitudeM ? d.altitudeM + 'm' : 'N/A'}\n` +
          `  Sleep: ${d.sleepLocation || 'N/A'}\n` +
          (d.fuelWarning ? `  ⚠️ Fuel Warning: ${d.fuelWarning}\n` : '')
      ),
      '',
      '--- EMERGENCY CONTACTS ---',
      ...(itinerary.emergencyContacts || []).map((c) => `- ${c}`),
    ]
      .filter((line) => line !== null && line !== undefined)
      .join('\n');

    navigator.clipboard.writeText(textLines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Trip Header */}
      <div className="bg-secondary-container/10 rounded-3xl p-1 border border-secondary/10 overflow-hidden">
        <div className="bg-secondary-container/20 p-8 rounded-[1.4rem] space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-secondary text-secondary-container px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-label">
                  Grounded Real-World Route
                </span>
                {itinerary.weatherSummary && (
                  <span className="bg-surface-highest text-secondary text-xs px-3 py-1 rounded-full flex items-center gap-1 font-medium border border-white/5">
                    <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                    {itinerary.weatherSummary}
                  </span>
                )}
              </div>
              <h3 className="text-3xl font-headline font-bold mt-2">{itinerary.tripTitle}</h3>
              <p className="text-on-surface-variant text-sm mt-1">
                {itinerary.startPoint} → {itinerary.endPoint}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 bg-primary text-background font-bold text-xs px-4 py-2 rounded-full hover:brightness-110 transition-all shadow-md min-h-[36px]"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-background" /> Copied!
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
                  <span className="text-[10px] text-outline uppercase font-label font-bold">Total Distance</span>
                </div>
                <div className="border-l border-white/10 pl-3">
                  <span className="block text-on-surface font-headline font-bold text-xl leading-none">
                    {itinerary.totalDays} Days
                  </span>
                  <span className="text-[10px] text-outline font-label uppercase font-bold">Duration</span>
                </div>
              </div>

              {itinerary.bestMonths && (
                <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                  <Calendar className="w-3.5 h-3.5 text-secondary" />
                  Best: {itinerary.bestMonths}
                </span>
              )}
            </div>
          </div>

          {/* Global Warnings */}
          {itinerary.warnings?.length > 0 && (
            <div className="bg-error-container/20 border border-error/20 rounded-xl p-4 space-y-2">
              <p className="font-label text-xs font-black uppercase text-error">Critical Warnings</p>
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
              <h4 className="font-headline text-lg font-bold uppercase tracking-tight">Emergency Contacts</h4>
            </div>
            <ul className="space-y-3">
              {itinerary.emergencyContacts.map((contact, i) => (
                <li key={i} className="bg-surface-highest/60 p-3 rounded-xl border border-white/5 text-xs">
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
              <h4 className="font-headline text-lg font-bold uppercase tracking-tight">Essential Gear</h4>
            </div>
            <ul className="space-y-3">
              {itinerary.gearChecklist.map((item, i) => (
                <li key={i} className="flex items-center gap-3 group">
                  <div className="w-5 h-5 rounded border-2 border-outline-variant group-hover:border-primary transition-colors flex items-center justify-center shrink-0">
                    <CheckCircle2 className="text-primary w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="font-medium text-xs text-on-surface-variant group-hover:text-on-surface">{item}</span>
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
              <h4 className="font-headline text-lg font-bold uppercase tracking-tight">Permits & Entry</h4>
            </div>
            <div className="space-y-3">
              {itinerary.permits.map((permit, i) => (
                <div key={i} className="bg-surface-highest/60 p-3 rounded-xl flex justify-between items-center border border-white/5">
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
