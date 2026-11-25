import type { Patient } from '../api/types';
import { useWording } from '../lib/wording';
import { Button } from '../ui';
import { CircleCheckBig } from '../ui/icons';

/** Screen 7, step 2: « Patient ajouté », then « Faire une recommandation à Claire » or « Plus tard ». */
export function PatientCreated({ patient, onChoose, onLater }: { patient: Patient; onChoose: () => void; onLater: () => void }) {
  const w = useWording();
  return (
    <div className="pt-6">
      <section className="flex gap-3 items-start p-4 bg-surface-tint border border-brand-sage rounded-lg">
        <span className="flex text-brand-900 pt-0.5">
          <CircleCheckBig size={18} strokeWidth={1.75} />
        </span>
        <div>
          <div className="text-sm font-medium text-ink">{w.N} ajouté</div>
          <div className="text-sm text-ink-muted">
            {patient.firstName} {patient.lastName} · {patient.email}
          </div>
        </div>
      </section>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={onChoose}>
          Faire une {w.mot} à {patient.firstName}
        </Button>
        <Button variant="outline" onClick={onLater}>
          Plus tard
        </Button>
      </div>
    </div>
  );
}
