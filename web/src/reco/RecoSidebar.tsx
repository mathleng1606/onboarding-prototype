import type { Practitioner, Recommendation } from '../api/types';
import { euros, initials } from '../lib/format';
import { useWording } from '../lib/wording';
import { Avatar, Button } from '../ui';
import { ChevronDown, Pencil, Send, X } from '../ui/icons';

/** « Livraison à prix réduit » threshold: 23,31 € + 35,69 € in the reference. */
const REDUCED_SHIPPING_CENTS = 5900;

/**
 * Right column of the recommendation editor: patient, send buttons, totals, share link.
 * - During the guide: « Prévisualiser et envoyer » (sending happens in the preview).
 * - Otherwise: « Envoyer à <prénom> » and the « Prévisualiser ce qui va être envoyé » link.
 * Totals come from the server (`reco.totals`), with the practitioner's discount.
 */
export function RecoSidebar({
  reco,
  practitioner,
  guide,
  onPreview,
  onSend,
}: {
  reco: Recommendation;
  practitioner: Practitioner;
  guide: boolean;
  onPreview: () => void;
  onSend: () => void;
}) {
  const w = useWording();
  const { patient, totals } = reco;
  const fullName = `${patient.firstName} ${patient.lastName}`;
  const toFreeShipping = REDUCED_SHIPPING_CENTS - totals.totalCents;
  return (
    <section className="bg-surface-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 max-sm:p-5">
        <h2 className="m-0 text-lg max-sm:text-base font-semibold text-ink">{w.N}</h2>
        <div className="flex items-center gap-2 box-border h-10 max-sm:h-9 mt-3 pr-3 pl-2 border border-border rounded-sm text-sm font-medium text-ink">
          <Avatar text={initials(patient.firstName, patient.lastName)} size={26} />
          <span className="flex-1">{fullName}</span>
          <span className="text-ink-muted flex gap-3">
            <Pencil size={14} strokeWidth={1.75} />
            <X size={14} strokeWidth={2} />
          </span>
        </div>
        <div className="mt-2">
          {guide ? (
            // Guide: one highlighted button (ring = 3 px tint + 1 px brand-link); sending happens in the preview.
          <Button onClick={onPreview} className="w-full max-sm:h-7 max-sm:text-13 shadow-[0_0_0_3px_var(--color-surface-tint),0_0_0_4px_var(--color-brand-link)]">
              <Send size={16} strokeWidth={1.75} />
              Prévisualiser et envoyer
          </Button>
          ) : (
            // Normal mode: main « Envoyer à X » button, preview link below. The preview has no send button.
            <>
              <Button onClick={onSend} className="w-full max-sm:h-7 max-sm:text-13">
                <Send size={16} strokeWidth={1.75} />
                Envoyer à {patient.firstName}
            </Button>
              <button
                type="button"
                onClick={onPreview}
                className="block w-full mt-2 text-center text-13 font-semibold text-brand-900 underline bg-transparent border-0"
              >
                Prévisualiser ce qui va être envoyé
              </button>
            </>
          )}
        </div>
      </div>
      <div className="border-t border-border p-4 flex flex-col gap-3">
        <div className="flex items-center text-sm text-ink-muted">
          <span className="flex-1">Sous-total</span>
          <span>{euros(totals.subtotalCents)}</span>
        </div>
        {totals.discountPct > 0 && (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <span>Réduction −{totals.discountPct}%</span>
            <span className="py-1 px-3 rounded-sm bg-border text-ink-muted text-sm font-medium">{practitioner.discountCode}</span>
            <span className="flex-1 flex">
              <Pencil size={14} strokeWidth={1.75} />
            </span>
            <span>-{euros(totals.discountCents)}</span>
          </div>
        )}
        <div className="border-t border-border" />
        <div className="flex items-center text-sm font-semibold text-ink">
          <span className="flex-1">Total</span>
          <span>{euros(totals.totalCents)}</span>
        </div>
        {toFreeShipping > 0 && (
          <div className="text-sm text-ink">Plus que {euros(toFreeShipping)} pour la livraison à prix réduit</div>
        )}
      </div>
      <div className="border-t border-border flex items-center p-4 text-sm font-medium text-ink">
        <span className="flex-1">Lien de partage</span>
        <span className="text-ink-muted flex">
          <ChevronDown size={16} strokeWidth={1.75} />
        </span>
      </div>
    </section>
  );
}
