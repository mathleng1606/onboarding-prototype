import type { Recommendation } from '../api/types';
import { useWording } from '../lib/wording';
import { Button, Modal } from '../ui';

/** Practitioner credits shown in the reference: 5,18 € for 25,90 € of products (20 %). */
const CREDITS_PCT = 20;

/** « C'est parti pour Jean ✅ » (screen 3 bis): only after the first test recommendation, sent during the guide. */
export function SentModal({ reco, onDone }: { reco: Recommendation; onDone: () => void }) {
  const w = useWording();
  const labs = new Set(reco.items.map((i) => i.product.brand)).size;
  const credits = ((reco.totals.subtotalCents * CREDITS_PCT) / 100 / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const chip = (text: string, label: string) => (
    <div className="flex items-center gap-3 mt-3">
      <span className="inline-flex items-center h-[30px] px-3 box-border border border-brand-sage bg-surface-tint rounded-full text-sm text-ink">
        {text}
      </span>
      <span className="text-sm text-ink-muted">{label}</span>
    </div>
  );
  const bar = (width?: string) => (
    <div className="h-1.5 rounded-[3px] bg-surface-neutral" style={width ? { width, marginTop: 4 } : undefined} />
  );

  return (
    <Modal label="Envoi confirmé" className="top-1/2 -translate-y-1/2 w-[864px] p-8 max-sm:p-6 flex gap-8 items-center bg-surface-card">
      <div className="flex-1 min-w-0">
        <h2 className="m-0 text-2xl font-semibold text-ink">C'est parti pour {reco.patient.firstName} ✅</h2>
        <p className="mt-4 mb-0 text-sm text-ink">{w.sentModalLead(`${reco.patient.firstName} ${reco.patient.lastName}`)}</p>
        {chip(`${labs} labo${labs > 1 ? 's' : ''}`, w.sentModalLabsLabel)}
        {chip(`${credits}€`, "en crédits dès qu'il passera commande")}
        {reco.isTest && (
          <div className="mt-6 p-4 bg-surface-tint border border-border rounded-md text-sm text-ink">
            <strong className="font-semibold">{w.sentModalTestBold}</strong>
            <span>{w.sentModalTestRest}</span>
          </div>
        )}
        <Button size="lg" className="mt-6 max-sm:w-full" onClick={onDone}>
          {w.sentModalCta}
        </Button>
      </div>
      <div className="hidden md:block flex-none w-[170px] h-[340px] box-border border-[6px] border-ink rounded-[30px] bg-surface-card relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-3 bg-ink rounded-b-[10px]" />
        <div className="pt-[22px] px-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-brand-sage" />
            <span className="flex-1 h-1.5 rounded-[3px] bg-surface-neutral" />
          </div>
          <div className="mt-2 text-[7px] leading-[9px] font-semibold text-ink">{w.phoneMockupTitle}</div>
          <div className="mt-1.5 h-[34px] box-border border border-brand-sage border-l-[3px] rounded-[4px] bg-surface-tint" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-1.5 items-center mt-2">
              <div className="flex-none w-4 h-4 rounded-[4px] bg-surface-neutral" />
              <div className="flex-1">
                {bar()}
                {bar('55%')}
              </div>
            </div>
          ))}
        </div>
        <div className="absolute left-2 right-2 bottom-2.5 h-5 rounded-[4px] bg-ink text-white text-[7px] flex items-center justify-center">
          Commander en 1 clic
        </div>
      </div>
    </Modal>
  );
}
