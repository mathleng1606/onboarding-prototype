import { useWording } from '../lib/wording';
import { Button } from '../ui';
import { ChevronLeft, Save, Sparkles, Trash2 } from '../ui/icons';
import { useToast } from '../ui/toast';
import { NOT_IN_PROTOTYPE } from '../ui/utils';

/** Top bar of the recommendation editor: « Retour », title, Assist (static), delete and save. */
export function RecoHeader({ onBack, onDelete, onSave }: { onBack: () => void; onDelete: () => void; onSave: () => void }) {
  const w = useWording();
  const toast = useToast();
  return (
    // Mobile (app capture): white bar, smaller title, three 28 px icon-only buttons.
    <div className="flex flex-wrap items-start gap-2 py-4 max-sm:py-3 pr-4 pl-4 sm:pl-6 border-b border-border bg-surface-page max-sm:bg-surface-card">
      <div className="flex-1">
        <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-ink-muted max-sm:text-ink bg-transparent border-0 p-0">
          <ChevronLeft size={14} strokeWidth={1.75} />
          Retour
        </button>
        <h1 className="mt-1 max-sm:mt-3.5 mb-0 text-base max-sm:text-xs font-normal text-ink">{w.newRecoTitle}</h1>
      </div>
      <div className="hidden sm:flex items-center gap-2 pt-2">
        <Button variant="outline" onClick={() => toast(NOT_IN_PROTOTYPE)}>
          <Sparkles size={16} strokeWidth={1.75} />
          Simplycure Assist
        </Button>
        <Button variant="danger" padding="none" className="w-12" aria-label="Supprimer" onClick={onDelete}>
          <Trash2 size={16} strokeWidth={1.75} />
        </Button>
        <Button variant="outline" onClick={onSave}>
          <Save size={16} strokeWidth={1.75} />
          Enregistrer
        </Button>
      </div>
      <div className="sm:hidden flex items-center gap-2.5 pt-[11px]">
        <Button variant="outline" size="xs" padding="none" className="w-7 shadow-sm" aria-label="Simplycure Assist" onClick={() => toast(NOT_IN_PROTOTYPE)}>
          <Sparkles size={14} strokeWidth={1.75} />
        </Button>
        <Button variant="danger" size="xs" padding="none" className="w-7 shadow-sm" aria-label="Supprimer" onClick={onDelete}>
          <Trash2 size={14} strokeWidth={1.75} />
        </Button>
        <Button variant="outline" size="xs" padding="none" className="w-7 shadow-sm" aria-label="Enregistrer" onClick={onSave}>
          <Save size={14} strokeWidth={1.75} />
        </Button>
      </div>
    </div>
  );
}
