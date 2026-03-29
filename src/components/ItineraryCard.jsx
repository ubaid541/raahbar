import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

export default function ItineraryCard({ day }) {
  return (
    <div className="group relative bg-surface rounded-2xl p-6 transition-all hover:bg-surface-high cursor-pointer border border-white/5">
      <div className="absolute -left-3 top-6 w-1 h-12 bg-secondary rounded-full"></div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-32 shrink-0">
          <p className="font-headline text-4xl font-bold text-outline-variant group-hover:text-secondary transition-colors">
            {String(day.day).padStart(2, '0')}
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-outline">{day.title}</p>
        </div>
        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Route</p>
            <p className="font-bold">{day.startLocation} → {day.endLocation}</p>
            <p className="text-xs text-on-surface-variant">{day.distance} · {day.duration}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Highlights</p>
            <ul className="space-y-1">
              {day.highlights?.slice(0, 3).map((h, i) => (
                <li key={i} className="text-xs text-on-surface-variant flex items-start gap-1">
                  <CheckCircle2 className="w-3 h-3 text-secondary shrink-0 mt-0.5" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Sleep</p>
            <p className="font-bold text-tertiary">{day.sleepLocation}</p>
            {day.fuelStops?.length > 0 && (
              <p className="text-xs text-on-surface-variant">⛽ {day.fuelStops[0]}</p>
            )}
          </div>
        </div>
      </div>
      {day.warnings?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
          {day.warnings.map((w, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-error-container/30 text-error text-xs px-3 py-1 rounded-full font-label">
              <AlertTriangle className="w-3 h-3" />
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
