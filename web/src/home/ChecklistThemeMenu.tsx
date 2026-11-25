import { useState } from 'react';
import { Check, EllipsisVertical } from '../ui/icons';
import type { ChecklistThemeName } from './checklistTheme';

const OPTIONS: [ChecklistThemeName, string][] = [
  ['dark', 'Sombre'],
  ['light', 'Claire'],
];

/** Menu ⋮ at the top right of the home page: switch the checklist between its dark and light variants. */
export function ChecklistThemeMenu({ value, onChange }: { value: ChecklistThemeName; onChange: (v: ChecklistThemeName) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex-none">
      <button
        type="button"
        aria-label="Plus d'actions"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-6 h-8 border-0 bg-transparent text-ink-muted flex items-center justify-center"
      >
        <EllipsisVertical size={18} strokeWidth={3} style={{ width: 12 }} />
      </button>
      {open && (
        <div role="menu" aria-label="Variante de la checklist" className="absolute right-0 top-9 z-20 w-56 py-1 bg-surface-card border border-border rounded-md shadow-lg">
          <div className="px-3 py-1.5 text-xs text-ink-muted">Variante de « Vos premiers pas »</div>
          {OPTIONS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="menuitemradio"
              aria-checked={value === key}
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-ink bg-transparent border-0 hover:bg-surface-subtle"
            >
              <span className="w-4 flex text-brand-900">{value === key && <Check size={14} strokeWidth={2.5} />}</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
