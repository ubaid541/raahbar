import { AlertTriangle, CheckCircle2, MapPin, ExternalLink, Fuel, Mountain } from 'lucide-react';

export default function ItineraryCard({ day }) {
  const startLoc = day.startLocation || 'Start';
  const endLoc = day.endLocation || 'Destination';
  const mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(startLoc + ', Pakistan')}/${encodeURIComponent(endLoc + ', Pakistan')}`;

  const distText = day.distanceKm != null ? `${day.distanceKm} km` : (day.distance || 'N/A');
  const durText = day.durationHrs != null ? `${day.durationHrs} hrs` : (day.duration || 'N/A');

  const getAltitudeBadgeClass = (level, metres) => {
    if (level === 'EXTREME' || (metres && metres >= 4000)) {
      return 'bg-error-container/40 text-error border-error/30';
    }
    if (level === 'HIGH' || (metres && metres >= 3000)) {
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
    if (level === 'MID' || (metres && metres >= 1800)) {
      return 'bg-secondary-container/30 text-secondary border-secondary/30';
    }
    return 'bg-surface-highest text-outline border-white/5';
  };

  return (
    <div className="group relative bg-surface rounded-2xl p-6 transition-all hover:bg-surface-high border border-white/5 space-y-4">
      <div className="absolute -left-3 top-6 w-1 h-12 bg-secondary rounded-full"></div>

      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-4">
          <p className="font-headline text-4xl font-bold text-outline-variant group-hover:text-secondary transition-colors shrink-0">
            {String(day.day).padStart(2, '0')}
          </p>
          <div>
            <h4 className="font-headline font-bold text-lg">{day.title}</h4>
            <p className="text-xs text-on-surface-variant flex items-center gap-1 font-mono">
              <MapPin className="w-3 h-3 text-secondary shrink-0" />
              {startLoc} → {endLoc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Real distance & duration badge */}
          <span className="bg-surface-highest text-on-surface font-mono text-xs font-bold px-3 py-1 rounded-full border border-white/5">
            {distText} · {durText}
          </span>

          {/* Altitude level badge */}
          {day.altitudeM != null && (
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border font-mono ${getAltitudeBadgeClass(day.altitudeLevel, day.altitudeM)}`}>
              <Mountain className="w-3 h-3" />
              {day.altitudeM}m
            </span>
          )}

          {/* Google Maps Link */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:text-primary transition-colors bg-secondary/10 hover:bg-secondary/20 px-3 py-1 rounded-full min-h-[32px]"
          >
            Maps <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* 3-Column Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* Highlights */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest font-label">Road Highlights</p>
          <ul className="space-y-1.5">
            {day.highlights?.slice(0, 4).map((h, i) => (
              <li key={i} className="text-xs text-on-surface-variant flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Fuel & Logistics */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest font-label">Fuel Logistics</p>
          {day.fuelStops?.length > 0 ? (
            <div className="space-y-1">
              {day.fuelStops.map((fuel, i) => (
                <p key={i} className="text-xs text-on-surface-variant flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{fuel}</span>
                </p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-outline italic">No dedicated fuel stops tagged</p>
          )}

          {day.fuelWarning && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mt-2">
              <p className="text-[11px] text-amber-300 font-medium leading-tight flex items-start gap-1">
                <Fuel className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                <span>{day.fuelWarning}</span>
              </p>
            </div>
          )}
        </div>

        {/* Overnight Stay */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest font-label">Night Stay</p>
          <p className="font-bold text-tertiary text-sm">{day.sleepLocation || 'Local Guesthouse / Hotel'}</p>
          {day.tips && (
            <p className="text-xs text-on-surface-variant bg-surface-highest/50 p-2.5 rounded-xl border border-white/5 leading-relaxed">
              <span className="font-bold text-primary">Pro Tip: </span>{day.tips}
            </p>
          )}
        </div>
      </div>

      {/* Warnings Row */}
      {day.warnings?.length > 0 && (
        <div className="pt-3 border-t border-white/5 flex flex-wrap gap-2">
          {day.warnings.map((w, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-error-container/30 text-error text-xs px-3 py-1 rounded-full font-label border border-error/20">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>{w}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
