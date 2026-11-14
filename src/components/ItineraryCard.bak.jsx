import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  ExternalLink,
  Fuel,
  Mountain,
  Route,
  Wrench,
  Wifi,
  Compass,
} from 'lucide-react';

export default function ItineraryCard({ day }) {
  const startLoc = day.startLocation || 'Start';
  const endLoc = day.endLocation || 'Destination';
  const mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(
    startLoc + ', Pakistan'
  )}/${encodeURIComponent(endLoc + ', Pakistan')}`;

  const distText = day.distanceKm != null ? `${day.distanceKm} km` : day.distance || 'N/A';
  const durText = day.durationHrs != null ? `${day.durationHrs} hrs` : day.duration || 'N/A';

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

  const getCheckpointBadgeColor = (type) => {
    const t = String(type || '').toLowerCase();
    if (t === 'lake') return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    if (t === 'pass') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    if (t === 'fuel') return 'bg-primary/20 text-primary border-primary/30';
    if (t === 'town') return 'bg-surface-highest text-on-surface-variant border-white/10';
    return 'bg-secondary-container/40 text-secondary border-secondary/30';
  };

  const hasCheckpoints = Array.isArray(day.checkpoints) && day.checkpoints.length > 0;

  return (
    <div className="group relative bg-surface rounded-2xl p-6 transition-all hover:bg-surface-high border border-white/5 space-y-5">
      <div className="absolute -left-3 top-6 w-1 h-12 bg-secondary rounded-full"></div>

      {/* Top Header Row + Pillar 1 (Highway Corridor) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div className="flex items-start md:items-center gap-4">
          <p className="font-headline text-4xl font-bold text-outline-variant group-hover:text-secondary transition-colors shrink-0">
            {String(day.day).padStart(2, '0')}
          </p>
          <div className="space-y-1">
            <h4 className="font-headline font-bold text-lg leading-snug">{day.title}</h4>
            <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant font-mono">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 text-secondary shrink-0" />
                {startLoc} → {endLoc}
              </span>
              {day.highwayCorridor && (
                <span className="inline-flex items-center gap-1 bg-primary/15 text-primary border border-primary/25 px-2.5 py-0.5 rounded-md font-sans font-bold text-[11px]">
                  <Route className="w-3 h-3 shrink-0" />
                  {day.highwayCorridor}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Real distance & duration badge */}
          <span className="bg-surface-highest text-on-surface font-mono text-xs font-bold px-3 py-1 rounded-full border border-white/5">
            {distText} · {durText}
          </span>

          {/* Altitude level badge */}
          {day.altitudeM != null && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border font-mono ${getAltitudeBadgeClass(
                day.altitudeLevel,
                day.altitudeM
              )}`}
            >
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

      {/* Pillar 2: En-Route Checkpoints, Lakes & Named Viewpoints Timeline */}
      {hasCheckpoints ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest font-label flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-secondary" />
              En-Route Waypoints, Lakes &amp; Named Viewpoints
            </p>
            <span className="text-[10px] font-mono text-outline">Ordered Start → Finish</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {day.checkpoints.map((cp, idx) => (
              <div
                key={idx}
                className="bg-surface-highest/60 border border-white/5 rounded-xl p-3 flex flex-col justify-between gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${getCheckpointBadgeColor(
                      cp.type
                    )}`}
                  >
                    {cp.type || 'Stop'}
                  </span>
                  {cp.kmFromStart != null && (
                    <span className="font-mono text-[10px] font-bold text-outline">
                      ~{cp.kmFromStart} km
                    </span>
                  )}
                </div>
                <p className="font-bold text-xs text-on-surface leading-snug">{cp.name}</p>
                {cp.note && (
                  <p className="text-[11px] text-on-surface-variant leading-tight">{cp.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* 3-Column Tactical Breakdown (Highlights/Surface, Fuel/Mechanic, Signal/Sleep) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 border-t border-white/5">
        {/* Column 1: Pillar 3 (Road Surface, Terrain & Key Sights) */}
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest font-label">
            Road Surface &amp; Sights
          </p>
          {day.roadSurface && (
            <div className="bg-surface-highest/50 border border-white/5 rounded-xl p-2.5 space-y-1">
              <p className="text-xs font-bold text-on-surface">{day.roadSurface}</p>
              {day.bikeAdvisory && (
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  {day.bikeAdvisory}
                </p>
              )}
            </div>
          )}
          {day.highlights?.length > 0 && (
            <ul className="space-y-1 pt-1">
              {day.highlights.slice(0, 4).map((h, i) => (
                <li key={i} className="text-xs text-on-surface-variant flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Column 2: Pillar 4A (Fuel Stops, Gaps & Mechanic Hub) */}
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest font-label">
            Fuel &amp; Mechanic Hubs
          </p>
          {day.fuelStops?.length > 0 ? (
            <div className="space-y-1">
              {day.fuelStops.map((fuel, i) => (
                <p key={i} className="text-xs text-on-surface-variant flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{fuel}</span>
                </p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-outline italic">Top up at departure town</p>
          )}

          {day.fuelWarning && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
              <p className="text-[11px] text-amber-300 font-medium leading-tight flex items-start gap-1.5">
                <Fuel className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                <span>{day.fuelWarning}</span>
              </p>
            </div>
          )}

          {day.mechanicHub && (
            <div className="bg-surface-highest/40 border border-white/5 rounded-lg p-2 flex items-start gap-1.5 text-[11px] text-on-surface-variant">
              <Wrench className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>
                <strong className="text-on-surface">Mechanic: </strong>
                {day.mechanicHub}
              </span>
            </div>
          )}
        </div>

        {/* Column 3: Pillar 4B (Signal, Night Stay & Pro Tip) */}
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest font-label">
            Night Basecamp &amp; Signal
          </p>
          <p className="font-bold text-tertiary text-sm">
            {day.sleepLocation || 'Local Valley Guesthouse'}
          </p>

          {day.mobileSignal && (
            <div className="bg-surface-highest/40 border border-white/5 rounded-lg p-2 flex items-start gap-1.5 text-[11px] text-on-surface-variant">
              <Wifi className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
              <span>
                <strong className="text-on-surface">Signal: </strong>
                {day.mobileSignal}
              </span>
            </div>
          )}

          {day.tips && (
            <p className="text-xs text-on-surface-variant bg-surface-highest/50 p-2.5 rounded-xl border border-white/5 leading-relaxed">
              <span className="font-bold text-primary">Pro Tip: </span>
              {day.tips}
            </p>
          )}
        </div>
      </div>

      {/* Warnings Row */}
      {day.warnings?.length > 0 && (
        <div className="pt-3 border-t border-white/5 flex flex-wrap gap-2">
          {day.warnings.map((w, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 bg-error-container/30 text-error text-xs px-3 py-1 rounded-full font-label border border-error/20"
            >
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>{w}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
