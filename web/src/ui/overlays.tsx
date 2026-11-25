import { useEffect, type ReactNode } from 'react';
import { X } from './icons';
import { cx } from './utils';

/**
 * OVERLAYS: scrim, centered modal, right side panel.
 *
 * Stacking order (z-index), from bottom to top:
 * page content (sticky headers: 5, « Réduire le menu » button: 10) < scrim 40 < side panel 50
 * < help bubble 52 < modal 55 < toast 60.
 */

/** Closes the overlay with the Escape key. */
function useEscape(onClose?: () => void) {
  useEffect(() => {
    if (!onClose) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
}

export function Scrim({ onClick }: { onClick?: () => void }) {
  return <div className="fixed inset-0 bg-scrim z-40" onClick={onClick} />;
}

export function Modal({
  label,
  onClose,
  className,
  children,
}: {
  label: string;
  onClose?: () => void;
  className?: string;
  children: ReactNode;
}) {
  useEscape(onClose);
  return (
    <>
      <Scrim onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cx('fixed z-[55] left-1/2 -translate-x-1/2 max-w-[calc(100vw-32px)] box-border rounded-lg', className)}
      >
        {children}
      </div>
    </>
  );
}

export function SidePanel({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  useEscape(onClose);
  return (
    <>
      <Scrim onClick={onClose} />
      <aside
        aria-label={label}
        // Desktop: panel stuck to the right edge. Mobile: full-height sheet coming up from the bottom (rounded top).
        className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[520px] box-border bg-surface-card overflow-y-auto sm:rounded-l-md max-sm:rounded-t-lg max-sm:animate-sheet-up"
      >
        {children}
      </aside>
    </>
  );
}

export function CloseButton({ onClick, label = 'Fermer', size = 20 }: { onClick: () => void; label?: string; size?: number }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="flex text-ink p-0 border-0 bg-transparent">
      <X size={size} strokeWidth={2} />
    </button>
  );
}

