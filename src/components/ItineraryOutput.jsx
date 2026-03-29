import { Wrench, FileText, CheckCircle2, Calendar } from 'lucide-react';
import ItineraryCard from './ItineraryCard.jsx';

export default function ItineraryOutput({ itinerary }) {
  if (!itinerary) return null;

  return (
    <div className="space-y-8">
      {/* Trip Header */}
      <div className="bg-secondary-container/10 rounded-3xl p-1 border border-secondary/10 overflow-hidden">
        <div className="bg-secondary-container/20 p-8 rounded-[1.4rem] space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="bg-secondary text-secondary-container px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-label">
                AI Optimized Route
              </span>
              <h3 className="text-3xl font-headline font-bold mt-2">{itinerary.tripTitle}</h3>
              <p className="text-on-surface-variant text-sm mt-1">
                {itinerary.startPoint} → {itinerary.endPoint}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="flex items-center gap-1 text-secondary font-headline font-bold text-xl">
                {itinerary.totalDistance} <span className="text-xs text-outline uppercase font-label">Total</span>
              </span>
              <span className="text-xs text-outline font-label uppercase">{itinerary.totalDays} Days</span>
              {itinerary.bestMonths && (
                <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                  <Calendar className="w-3 h-3" />
                  {itinerary.bestMonths}
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
                    <span className="text-error mt-0.5">⚠</span>{w}
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

      {/* Gear & Permits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {itinerary.gearChecklist?.length > 0 && (
          <div className="bg-surface rounded-3xl p-8 border-t-8 border-primary">
            <div className="flex items-center gap-3 mb-6">
              <Wrench className="text-primary w-6 h-6" />
              <h4 className="font-headline text-xl font-bold uppercase tracking-tight">Essential Gear</h4>
            </div>
            <ul className="space-y-4">
              {itinerary.gearChecklist.map((item, i) => (
                <li key={i} className="flex items-center gap-4 group">
                  <div className="w-6 h-6 rounded border-2 border-outline-variant group-hover:border-primary transition-colors flex items-center justify-center shrink-0">
                    <CheckCircle2 className="text-primary w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="font-medium text-on-surface-variant group-hover:text-on-surface">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {itinerary.permits?.length > 0 && (
          <div className="bg-surface rounded-3xl p-8 border-t-8 border-tertiary">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="text-tertiary w-6 h-6" />
              <h4 className="font-headline text-xl font-bold uppercase tracking-tight">Travel Permits</h4>
            </div>
            <div className="space-y-4">
              {itinerary.permits.map((permit, i) => (
                <div key={i} className="bg-surface-highest p-4 rounded-xl flex justify-between items-center">
                  <p className="font-bold text-sm">{permit}</p>
                  <FileText className="text-tertiary w-5 h-5 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
