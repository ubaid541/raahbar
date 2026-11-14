import { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';

/**
 * One alert strip replacing: pass-status banner + critical warnings block.
 * CLOSED is shown once (in the summary), details live behind a tap.
 * Red is used only for danger (closed passes / warnings); CAUTION and OPEN stay neutral.
 */
export default function AlertStrip({ passStatuses = [], warnings = [] }) {
  const [open, setOpen] = useState(false);
  const [openWarn, setOpenWarn] = useState(null);

  const passes = Array.isArray(passStatuses) ? passStatuses : [];
  const closed = passes.filter((p) => String(p.status).toUpperCase() === 'CLOSED');
  const caution = passes.filter((p) => String(p.status).toUpperCase() === 'CAUTION');
  const warns = Array.isArray(warnings) ? warnings : [];

  if (passes.length === 0 && warns.length === 0) return null;

  const hasDanger = closed.length > 0 || warns.length > 0;

  let summary;
  if (closed.length > 0) {
    summary = `${closed.length} pass${closed.length > 1 ? 'es' : ''} closed: ${closed
      .map((p) => p.name)
      .join(', ')}`;
  } else if (caution.length > 0) {
    summary = `${caution.length} pass${caution.length > 1 ? 'es' : ''} need caution: ${caution
      .map((p) => p.name)
      .join(', ')}`;
  } else if (passes.length > 0) {
    summary = `All ${passes.length} pass${passes.length > 1 ? 'es' : ''} open`;
  } else {
    summary = `${warns.length} route warning${warns.length > 1 ? 's' : ''}`;
  }

  const hint = closed.length > 0 ? 'Tap for alternatives' : 'Tap for details';

  const stateLabel = (s) => {
    const u = String(s || 'OPEN').toUpperCase();
    return u === 'CLOSED' ? 'Closed' : u === 'CAUTION' ? 'Caution' : 'Open';
  };

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{
        background: hasDanger ? 'var(--tu-danger-bg)' : 'var(--tu-card)',
        borderColor: hasDanger ? 'var(--tu-danger-line)' : 'var(--tu-line)',
      }}
    >
      <button
        type="button"
        className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <AlertTriangle
          className="w-[18px] h-[18px] shrink-0"
          style={{ color: hasDanger ? 'var(--tu-danger)' : 'var(--tu-text-2)' }}
        />
        <span className="flex-1 min-w-0 text-[14px] text-[var(--tu-text)]">
          <span className="tu-strong">{summary}</span>
          <span className="tu-sub"> · {hint}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-[var(--tu-text-2)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-6">
          {passes.length > 0 && (
            <div className="space-y-3">
              <p className="tu-label">Passes on this route</p>
              <ul className="space-y-3">
                {passes.map((p, i) => {
                  const isClosed = String(p.status).toUpperCase() === 'CLOSED';
                  return (
                    <li key={i} className="space-y-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="tu-strong text-[14px]">
                          {p.name}
                          {p.altitudeM ? (
                            <span className="tu-sub"> · {p.altitudeM} m</span>
                          ) : null}
                        </span>
                        <span
                          className="text-[13px] shrink-0"
                          style={{
                            color: isClosed ? 'var(--tu-danger)' : 'var(--tu-text-2)',
                            fontWeight: isClosed ? 600 : 400,
                          }}
                        >
                          {stateLabel(p.status)}
                        </span>
                      </div>
                      {p.reason && <p className="tu-sub">{p.reason}</p>}
                      {p.alternativeCorridor && (
                        <p className="tu-sub">
                          <span className="tu-strong" style={{ fontSize: 13 }}>
                            Use instead:
                          </span>{' '}
                          {p.alternativeCorridor}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {warns.length > 0 && (
            <div className="space-y-2">
              <p className="tu-label">Rider warnings</p>
              <ul className="space-y-1">
                {warns.map((w, i) => {
                  const expanded = openWarn === i;
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        className="w-full flex items-start gap-2 text-left py-1.5 cursor-pointer"
                        aria-expanded={expanded}
                        onClick={() => setOpenWarn(expanded ? null : i)}
                      >
                        <span
                          className={`block text-[14px] text-[var(--tu-text)] flex-1 min-w-0 ${expanded ? '' : 'truncate'}`}
                        >
                          {w}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 mt-0.5 shrink-0 text-[var(--tu-text-2)] transition-transform ${
                            expanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
