import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Patient } from '../api/types';
import { useFlow } from '../lib/flow';
import { type PatientSource, track } from '../lib/track';
import { useWording } from '../lib/wording';
import { Button } from '../ui';
import { ArrowLeft } from '../ui/icons';
import { CreatePatientForm } from './CreatePatientForm';
import { PatientCreated } from './PatientCreated';

/**
 * « Créez un nouveau client » (screen 10, view 2): white top bar with « Retour », form centered on 590 px.
 * Opened by « Ajouter un client » and by item 4 of the checklist.
 * After saving: « Patient ajouté » with « Faire une recommandation à Claire » or « Plus tard » (screen 7).
 */
export function PatientCreatePage() {
  const w = useWording();
  const navigate = useNavigate();
  const flow = useFlow();
  const [created, setCreated] = useState<Patient | null>(null);
  // Item 4 of the checklist says where it comes from (router state); otherwise it is the Patients page.
  const source: PatientSource = (useLocation().state as { source?: PatientSource } | null)?.source ?? 'page_patients';
  return (
    <>
      {/* z 5: above the scrolling form, below the « Réduire le menu » button (z 10). */}
      <div className="sticky top-0 z-[5] flex items-center py-3 px-4 sm:px-6 bg-surface-card border-b border-border">
        <Button variant="outline" onClick={() => navigate('/patients')}>
          <ArrowLeft size={16} strokeWidth={1.75} />
          Retour
        </Button>
      </div>
      <div className="max-w-[590px] mx-auto px-4 pt-8 pb-12">
        {created ? (
          <PatientCreated patient={created} onChoose={() => flow.startReco('patients', created.uid)} onLater={() => navigate('/patients')} />
        ) : (
          <>
            <h1 className="mt-0 mb-6 text-2xl font-medium text-ink">Créez un nouveau {w.n}</h1>
            <CreatePatientForm
              onCreated={(p) => {
                track('patient_created', { source });
                setCreated(p);
              }}
            />
          </>
        )}
      </div>
    </>
  );
}
