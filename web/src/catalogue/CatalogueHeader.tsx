import type { Patient } from '../api/types';
import { initials } from '../lib/format';
import { useWording } from '../lib/wording';
import { Avatar, Button, GuideBand } from '../ui';
import { Check, EllipsisVertical, UserRoundPlus, X } from '../ui/icons';

/**
 * Sticky header of the catalogue: « Valider la sélection (n) », the chosen patient (or « Choisir un patient »),
 * and, during the guide, the step 2 band.
 * Pinned at top 0 with an opaque surface-page background (its top padding covers the strip above it),
 * above the scrolling content (z 5) but below the « Réduire le menu » button (z 10) and the overlays.
 */
export function CatalogueHeader({
  count,
  patient,
  guide,
  onValidate,
  onChoosePatient,
  onSkipGuide,
}: {
  /** Number of products selected. */
  count: number;
  patient: Patient | null;
  guide: boolean;
  onValidate: () => void;
  onChoosePatient: () => void;
  onSkipGuide: () => void;
}) {
  const w = useWording();
  const chip = patient && (
    <span className="inline-flex items-center gap-2 box-border h-9 pr-3 pl-2 bg-surface-card border border-border rounded-sm text-sm font-medium text-ink">
      <Avatar text={initials(patient.firstName, patient.lastName)} size={24} />
      {patient.firstName} {patient.lastName}
      <button type="button" aria-label={`Changer de ${w.n}`} onClick={onChoosePatient} className="flex text-ink-muted ml-2 border-0 bg-transparent p-0">
        <X size={14} strokeWidth={2} />
      </button>
    </span>
  );
  const band = guide && patient && (
    <GuideBand step={2} title={w.guideStep2Title} onSkip={onSkipGuide}>
      {w.guideStep2Text}
    </GuideBand>
  );
  return (
    <>
      <div className="sticky top-0 z-[5] bg-surface-page -mt-4 -mr-4 -ml-4 sm:-ml-6 pt-4 max-sm:pt-[23px] pr-4 pb-2 pl-4 sm:pl-6">
        {/* Mobile (app captures): « Catalogue » title with the patient chip, then « Valider la sélection » full width. */}
        <div className="sm:hidden flex items-center gap-2 mb-[9px]">
          <h1 className="m-0 flex-1 text-lg font-normal text-ink">Catalogue</h1>
          {chip}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 min-h-9 max-sm:min-h-7 max-sm:flex-nowrap">
          <Button disabled={count === 0} onClick={onValidate} className="max-sm:flex-1 max-sm:h-7 max-sm:text-13">
            <Check size={16} strokeWidth={1.75} />
            Valider la sélection{count > 0 && ` (${count})`}
          </Button>
          <span className="contents max-sm:hidden">
            {chip || (
              <Button variant="outline" onClick={onChoosePatient}>
                <UserRoundPlus size={16} strokeWidth={1.75} />
                Choisir un {w.n}
              </Button>
            )}
          </span>
          <span className="flex w-6 justify-center text-ink-muted">
            <EllipsisVertical size={18} strokeWidth={3} />
          </span>
        </div>
        {band && <div className="mt-3 max-sm:hidden">{band}</div>}
      </div>
      {/* Mobile: the guide band scrolls with the page, under the sticky header (never over the content). */}
      {band && <div className="sm:hidden mt-3">{band}</div>}
    </>
  );
}
