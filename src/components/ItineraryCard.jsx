import { useState } from 'react';
import { Fuel, Wrench, AlertTriangle, ChevronDown, MapPin, Phone } from 'lucide-react';
import { EMERGENCY_CONTACTS } from '../constants.ts';

/** One-line warning that expands on tap. */
function WarningRow({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button
        type="button"
        className="w-full flex items-start gap-2 text-left py-1.5 cursor-pointer"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <AlertTriangle
          className="w-4 h-4 mt-0.5 shrink-0"
          style={{ color: 'var(--tu-danger)' }}
        />
        <span className={`block flex-1 min-w-0 text-[14px] text-[var(--tu-text)] ${open ? '' : 'truncate'}`}>
          {text}
        </span>
        <ChevronDown
          className={`w-4 h-4 mt-0.5 shrink-0 text-[var(--tu-text-2)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
    </li>
  );
}

const HAZARD_RE =
  /closed|danger|landslide|rockfall|hazard|avalanche|washed|no fuel|extreme|do not|unsafe|snow|ice\b/i;

const REGION_KEYWORDS = {
  Rawalpindi: ['rawalpindi', 'pindi', 'islamabad', 'taxila', 'hasan abdal', 'murree'],
  Mansehra: ['mansehra', 'abbottabad', 'hazara', 'balakot', 'haripur'],
  Naran: ['naran', 'kaghan', 'babusar', 'shogran', 'kewai', 'batakundi', 'jalkhad', 'lulusar', 'saif-ul-malook'],
  Besham: ['besham', 'thakot', 'dasu', 'kohistan', 'shatial'],
  Chilas: ['chilas', 'diamer', 'jaglot', 'fairy meadows', 'raikot', 'astore', 'nanga parbat'],
  Gilgit: ['gilgit', 'hunza', 'karimabad', 'passu', 'sost', 'khunjerab', 'nagar', 'rakaposhi', 'ghulmet', 'attabad', 'ghizer', 'phander', 'gupis'],
  Skardu: ['skardu', 'deosai', 'shigar', 'khaplu', 'kachura', 'satpara', 'shangrila', 'indus gorge'],
  Chitral: ['chitral', 'shandur', 'lowari', 'dir', 'kalash', 'kumrat', 'mastuj', 'booni'],
};

const STOP_WORDS = new Set([
  'city', 'town', 'road', 'main', 'pass', 'lake', 'valley', 'market',
  'bazaar', 'bridge', 'basecamp', 'pakistan', 'viewpoint', 'corridor',
]);

/** Extract concise night temperature (or altitude fallback) for the 3-stat meta line. */
function getNightStat(weather, altitudeM) {
  if (weather) {
    const lowMatch = String(weather).match(/low\s*(-?\d+(?:\.\d+)?)\s*°?\s*c/i);
    if (lowMatch) return `${lowMatch[1]}°C night`;
    const nightMatch = String(weather).match(/(-?\d+(?:\.\d+)?)\s*°?\s*c\s*(?:at\s*)?night/i);
    if (nightMatch) return `${nightMatch[1]}°C night`;
    const tempMatch = String(weather).match(/(-?\d+(?:\.\d+)?)\s*°\s*c/i);
    if (tempMatch) return `${tempMatch[1]}°C night`;
  }
  if (altitudeM != null) {
    return `${Number(altitudeM).toLocaleString()} m peak`;
  }
  return null;
}

/** Extract clickable phone number from a contact line when available. */
function extractPhone(text) {
  const s = String(text || '');
  const telTagged = s.match(/(?:Tel:|Dial)\s*(\+?\d[\d\s-]{2,}\d)/i);
  if (telTagged) return telTagged[1].trim();
  const stdPhone = s.match(/(\+?\d{2,5}[-\s]\d{5,8}|\b1122\b|\b130\b)/);
  return stdPhone ? stdPhone[1].trim() : null;
}

/** Filter trip emergency contacts to the regions/stops covered by this day's route. */
function filterContactsForDay(day, tripContacts = []) {
  const list = Array.isArray(tripContacts) ? tripContacts.filter(Boolean) : [];
  const dayText = [
    day.startLocation,
    day.endLocation,
    day.title,
    day.sleepLocation,
    day.mechanicHub,
    ...(day.checkpoints || []).map((c) => c.name),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const matchedRegions = Object.entries(REGION_KEYWORDS)
    .filter(([, keywords]) => keywords.some((kw) => dayText.includes(kw)))
    .map(([region]) => region);

  const locationWords = [day.startLocation, day.endLocation]
    .filter(Boolean)
    .flatMap((loc) => String(loc).toLowerCase().split(/[\s/,()-]+/))
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));

  const matched = list.filter((contact) => {
    const lc = String(contact).toLowerCase();
    const matchesRegion = matchedRegions.some(
      (r) =>
        lc.includes(r.toLowerCase()) ||
        REGION_KEYWORDS[r].some((kw) => lc.includes(kw))
    );
    const matchesLocWord = locationWords.some((w) => lc.includes(w));
    return matchesRegion || matchesLocWord;
  });

  if (matchedRegions.length > 0) {
    const existingLower = matched.map((m) => String(m).toLowerCase());
    EMERGENCY_CONTACTS.forEach((c) => {
      if (!matchedRegions.includes(c.region)) return;
      const alreadyIncluded = existingLower.some((e) => e.includes(c.name.toLowerCase()));
      if (!alreadyIncluded) {
        const formatted = `${c.name} (${c.region})${c.contact ? ` — Tel: ${c.contact}` : ''} · ${c.note}`;
        matched.push(formatted);
        existingLower.push(formatted.toLowerCase());
      }
    });
  }

  if (matched.length > 0) return matched;
  return list.slice(0, 3);
}

/** One timeline row: dot on the rail + content. */
function Stop({ kind = 'stop', title, note, km, hazard }) {
  const isEnd = kind === 'start' || kind === 'end';
  const isMarker = kind === 'fuel' || kind === 'mechanic';
  return (
    <li className="relative pl-8 pb-3 last:pb-0">
      {/* dot / marker on the rail */}
      <span
        className="absolute left-0 top-[3px] flex items-center justify-center w-[18px] h-[18px] rounded-full"
        style={{
          background: hazard ? 'var(--tu-danger-bg)' : isMarker ? 'var(--tu-card-2)' : 'var(--tu-bg)',
          border: `2px solid ${
            hazard ? 'var(--tu-danger)' : isEnd ? 'var(--tu-text)' : 'var(--tu-line)'
          }`,
        }}
      >
        {hazard ? (
          <AlertTriangle className="w-[10px] h-[10px]" style={{ color: 'var(--tu-danger)' }} />
        ) : kind === 'fuel' ? (
          <Fuel className="w-[10px] h-[10px] text-[var(--tu-text-2)]" />
        ) : kind === 'mechanic' ? (
          <Wrench className="w-[10px] h-[10px] text-[var(--tu-text-2)]" />
        ) : null}
      </span>

      <div className="flex items-baseline justify-between gap-3">
        <p
          className={isMarker ? 'tu-sub' : 'text-[14px] text-[var(--tu-text)]'}
          style={{ fontWeight: isEnd ? 600 : 400, color: hazard ? 'var(--tu-danger)' : undefined }}
        >
          {title}
        </p>
        {km && <span className="tu-sub shrink-0">{km}</span>}
      </div>
      {note && <p className="tu-sub mt-0.5">{note}</p>}
    </li>
  );
}

export default function ItineraryCard({ day, weather, emergencyContacts = [] }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [corridorOpen, setCorridorOpen] = useState(false);

  const startLoc = day.startLocation || 'Start';
  const endLoc = day.endLocation || 'Destination';

  const dist = day.distanceKm != null ? `${day.distanceKm} km` : day.distance || null;
  const dur =
    day.durationHrs != null
      ? `${day.durationHrs}h`
      : day.duration
        ? String(day.duration).replace(/\s*(?:hrs?|hours?)/i, 'h')
        : null;
  const nightStat = getNightStat(weather, day.altitudeM);
  const statsLine = [dist, dur, nightStat].filter(Boolean).join(' · ');

  /* Build the ordered timeline: checkpoints + fuel/mechanic markers inline */
  const items = [];
  (day.checkpoints || []).forEach((cp) => {
    const t = String(cp.type || '').toLowerCase();
    items.push({
      sortKm: Number(cp.kmFromStart) || 0,
      kind: t === 'fuel' ? 'fuel' : 'stop',
      title: cp.name,
      note: cp.note,
      km: cp.kmFromStart != null ? `~${cp.kmFromStart} km` : null,
      hazard: t === 'hazard' || HAZARD_RE.test(cp.note || ''),
    });
  });
  (day.fuelStops || []).forEach((f, i) => {
    const m = String(f).match(/(\d+)\s*km/i);
    items.push({
      sortKm: m ? Number(m[1]) : 9998 + i,
      kind: 'fuel',
      title: f,
    });
  });
  if (day.mechanicHub) {
    items.push({ sortKm: 9998.5, kind: 'mechanic', title: `Mechanic: ${day.mechanicHub}` });
  }
  items.sort((a, b) => a.sortKm - b.sortKm);

  const hasMore =
    day.bikeAdvisory || (Array.isArray(day.highlights) && day.highlights.length > 0);

  const sleepText = day.sleepLocation || `${endLoc}, Pakistan`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    /pakistan/i.test(sleepText) ? sleepText : `${sleepText}, Pakistan`
  )}`;
  const phoneMatch = String(day.sleepLocation || '').match(/(\+?\d[\d\s-]{8,}\d)/);
  const phone = phoneMatch ? phoneMatch[1] : null;

  const dayContacts = filterContactsForDay(day, emergencyContacts);

  return (
    <article className="tu-card" style={{ padding: 16 }}>
      {/* Day header: 3 scannable stats + tap for highways */}
      <header>
        <h4 className="text-[18px] leading-snug" style={{ fontWeight: 600 }}>
          Day {day.day} · {startLoc} → {endLoc}
        </h4>
        {(statsLine || day.highwayCorridor) && (
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
            {statsLine && (
              <p className="text-[14px] text-[var(--tu-text)]" style={{ fontWeight: 600 }}>
                {statsLine}
              </p>
            )}
            {day.highwayCorridor && (
              <button
                type="button"
                className="inline-flex items-center gap-1 tu-label cursor-pointer"
                aria-expanded={corridorOpen}
                onClick={() => setCorridorOpen((o) => !o)}
              >
                Highways
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${corridorOpen ? 'rotate-180' : ''}`}
                />
              </button>
            )}
          </div>
        )}
        {corridorOpen && day.highwayCorridor && (
          <p className="tu-sub mt-2">
            {day.highwayCorridor}
            {day.altitudeM != null ? ` · Peak ${Number(day.altitudeM).toLocaleString()} m` : ''}
          </p>
        )}
      </header>

      {/* Vertical timeline */}
      <ol className="relative mt-6">
        <span
          aria-hidden="true"
          className="absolute left-[8px] top-2 bottom-2 w-px"
          style={{ background: 'var(--tu-line)' }}
        />
        <Stop kind="start" title={startLoc} />
        {items.map((it, i) => (
          <Stop key={i} {...it} />
        ))}
        {day.fuelWarning && (
          <Stop kind="fuel" hazard title={day.fuelWarning} />
        )}
        <Stop kind="end" title={endLoc} />
      </ol>

      {/* Road surface: pillar 3, one line; extras behind a tap */}
      {day.roadSurface && (
        <p className="tu-sub mt-4">
          <span className="tu-strong" style={{ fontSize: 13 }}>
            Road:
          </span>{' '}
          {day.roadSurface}
        </p>
      )}
      {hasMore && (
        <div className="mt-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 tu-label cursor-pointer"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((o) => !o)}
          >
            {moreOpen ? 'Less' : 'More about this day'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
          </button>
          {moreOpen && (
            <div className="mt-2 space-y-2">
              {day.bikeAdvisory && <p className="tu-sub">{day.bikeAdvisory}</p>}
              {Array.isArray(day.highlights) && day.highlights.length > 0 && (
                <ul className="space-y-1">
                  {day.highlights.slice(0, 4).map((h, i) => (
                    <li key={i} className="tu-sub">
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Day warnings: one line each, tap to expand (rider-specific safety info) */}
      {Array.isArray(day.warnings) && day.warnings.length > 0 && (
        <ul className="mt-6 space-y-1">
          {day.warnings.map((w, i) => (
            <WarningRow key={i} text={w} />
          ))}
        </ul>
      )}

      {/* Overnight block: distinct end-of-day card */}
      <section
        className="mt-6 rounded-xl p-4"
        style={{ background: 'var(--tu-card-2)', border: '1px solid var(--tu-line)' }}
      >
        <p className="tu-label">Overnight stay</p>
        <p className="mt-1 text-[16px]" style={{ fontWeight: 600 }}>
          {day.sleepLocation || 'Local valley guesthouse'}
        </p>
        {day.mobileSignal && <p className="tu-sub mt-1">Signal: {day.mobileSignal}</p>}
        {day.tips && <p className="tu-sub mt-1">Tip: {day.tips}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tu-btn-ghost"
          >
            <MapPin className="w-4 h-4" />
            Map
          </a>
          {phone && (
            <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="tu-btn-ghost">
              <Phone className="w-4 h-4" />
              Call
            </a>
          )}
        </div>
      </section>

      {/* Emergency contacts filtered to this day's route */}
      {dayContacts.length > 0 && (
        <section className="mt-6 pt-4 border-t border-[var(--tu-line)] space-y-2.5">
          <p className="tu-label">
            Emergency contacts · {startLoc} → {endLoc}
          </p>
          <ul className="space-y-2">
            {dayContacts.map((contact, i) => {
              const contactPhone = extractPhone(contact);
              return (
                <li key={i} className="flex items-start justify-between gap-3 text-[14px] text-[var(--tu-text)]">
                  <span className="min-w-0 flex-1">{contact}</span>
                  {contactPhone && (
                    <a
                      href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`}
                      className="shrink-0 inline-flex items-center gap-1 text-[13px] text-[var(--tu-brand)] hover:underline"
                      style={{ fontWeight: 600 }}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {contactPhone}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </article>
  );
}
