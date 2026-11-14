import { useEffect, useRef } from 'react';

/**
 * Horizontal scrolling day tabs (D1 D2 D3 ...) plus optional "Before you go" tab.
 * Active tab uses the brand orange.
 */
export default function DayTabs({ days = [], activeTab, onSelect, showPrep = false }) {
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activeTab]);

  if (days.length <= 1 && !showPrep) return null;

  const pillStyle = (active) => ({
    background: active ? 'var(--tu-brand)' : 'var(--tu-card)',
    color: active ? '#1a1008' : 'var(--tu-text)',
    borderColor: active ? 'var(--tu-brand)' : 'var(--tu-line)',
    fontWeight: active ? 600 : 400,
  });

  return (
    <div
      role="tablist"
      aria-label="Trip days"
      className="tu-scroll flex gap-2 overflow-x-auto -mx-1 px-1 py-1"
    >
      {days.map((d, i) => {
        const active = activeTab === i;
        return (
          <button
            key={d.day ?? i}
            ref={active ? activeRef : null}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onSelect(i)}
            className="shrink-0 min-w-[48px] h-10 px-4 rounded-full text-[14px] cursor-pointer border transition-colors"
            style={pillStyle(active)}
          >
            D{d.day ?? i + 1}
          </button>
        );
      })}

      {showPrep && (
        <button
          ref={activeTab === 'prep' ? activeRef : null}
          role="tab"
          type="button"
          aria-selected={activeTab === 'prep'}
          onClick={() => onSelect('prep')}
          className="shrink-0 h-10 px-4 rounded-full text-[14px] cursor-pointer border transition-colors whitespace-nowrap"
          style={pillStyle(activeTab === 'prep')}
        >
          Before you go
        </button>
      )}
    </div>
  );
}
