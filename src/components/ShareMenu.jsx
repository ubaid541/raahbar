import { useEffect, useRef, useState } from 'react';
import { Share2, FileDown, Copy, Check } from 'lucide-react';

/**
 * Single icon-only Share button. PDF roadbook + Copy plan live inside.
 * Behavior is delegated: onPdf / onCopy keep the original MVP handlers.
 */
export default function ShareMenu({ onPdf, onCopy }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const itemClass =
    'w-full flex items-center gap-3 px-4 py-3 text-left text-[14px] text-[var(--tu-text)] hover:bg-[var(--tu-card-2)] cursor-pointer';

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        className="tu-btn-icon"
        aria-label="Share trip"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Share2 className="w-[18px] h-[18px]" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 rounded-xl overflow-hidden z-20 border border-[var(--tu-line)] bg-[var(--tu-card)] shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              onPdf();
              setOpen(false);
            }}
          >
            <FileDown className="w-4 h-4 text-[var(--tu-text-2)]" />
            Download PDF roadbook
          </button>
          <button
            type="button"
            role="menuitem"
            className={`${itemClass} border-t border-[var(--tu-line)]`}
            onClick={() => {
              onCopy();
              setCopied(true);
              setTimeout(() => {
                setCopied(false);
                setOpen(false);
              }, 1200);
            }}
          >
            {copied ? (
              <Check className="w-4 h-4 text-[var(--tu-text-2)]" />
            ) : (
              <Copy className="w-4 h-4 text-[var(--tu-text-2)]" />
            )}
            {copied ? 'Copied' : 'Copy plan'}
          </button>
        </div>
      )}
    </div>
  );
}

