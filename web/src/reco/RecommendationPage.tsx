import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { ItemInput, Practitioner, Recommendation } from '../api/types';
import { keys, useOnboarding, usePractitioner, useRefresh } from '../hooks/queries';
import { useFlow } from '../lib/flow';
import { useWording } from '../lib/wording';
import { GuideBand } from '../ui';
import { useToast } from '../ui/toast';
import { NoteEditor } from './NoteEditor';
import { PreviewModal } from './PreviewModal';
import { RecoHeader } from './RecoHeader';
import { RecoProducts } from './RecoProducts';
import { RecoSidebar } from './RecoSidebar';
import { SentModal } from './SentModal';

/**
 * « NOUVELLE RECOMMANDATION » EDITOR (screens 3 and 6)
 * Loads the recommendation, then the Editor keeps it in local state: every change is sent to the API,
 * which answers with the updated recommendation (items, totals).
 * After sending: during the guide, the « C'est parti pour Jean » modal; otherwise, the patient page
 * with the « Recommandation envoyée » banner.
 */
export function RecommendationPage() {
  const { uid = '' } = useParams();
  const { data: reco, error } = useQuery({ queryKey: keys.recommendation(uid), queryFn: () => api.recommendation(uid) });
  const { data: practitioner } = usePractitioner();
  const { data: onboarding } = useOnboarding();
  if (error) return <Navigate to="/" replace />;
  if (!reco || !practitioner || !onboarding) return null;
  return <Editor key={reco.uid} initial={reco} practitioner={practitioner} guideActive={onboarding.guideActive} />;
}

function Editor({ initial, practitioner, guideActive }: { initial: Recommendation; practitioner: Practitioner; guideActive: boolean }) {
  const w = useWording();
  const toast = useToast();
  const navigate = useNavigate();
  const flow = useFlow();
  const qc = useQueryClient();
  const refresh = useRefresh();
  const [reco, setReco] = useState(initial);
  const [note, setNote] = useState(initial.note);
  const [preview, setPreview] = useState(false);
  const [sent, setSent] = useState<Recommendation | null>(null);
  // The guide band stays under the confirmation modal, as in the reference.
  const [guide] = useState(guideActive);
  const saveTimer = useRef<number | undefined>(undefined);
  const patient = reco.patient;

  // A sent recommendation is not editable: go to where it can be seen.
  if (initial.status === 'sent' && !sent) {
    return <Navigate to={patient.isTest ? '/' : `/patients/${patient.uid}`} replace />;
  }

  /** The note is saved 600 ms after the last keystroke, on blur, and before sending. */
  async function saveNote(value = note) {
    window.clearTimeout(saveTimer.current);
    if (value !== reco.note) setReco(await api.updateRecommendation(reco.uid, { note: value }));
  }
  function onNoteChange(value: string) {
    setNote(value);
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => saveNote(value), 600);
  }

  async function setItems(items: ItemInput[]) {
    if (items.length === 0) return toast(`Une ${w.mot} contient au moins un produit`);
    setReco(await api.updateRecommendation(reco.uid, { items }));
  }
  

  async function send() {
    await saveNote();
    const res = await api.sendRecommendation(reco.uid);
    refresh.onboarding(res.onboarding);
    await qc.invalidateQueries({ queryKey: ['recommendations'] });
    await qc.invalidateQueries({ queryKey: keys.patients });
    setPreview(false);
    // « C'est parti pour Jean » only for the first (test) recommendation, sent during the guide.
    if (guide) setSent(res.recommendation);
    else navigate(`/patients/${patient.uid}?envoyee=${reco.uid}`);
  }

  async function remove() {
    await api.deleteRecommendation(reco.uid);
    await qc.invalidateQueries({ queryKey: ['recommendations'] });
    navigate('/');
  }

  /** Back to the catalogue, keeping this patient and this recommendation's selection. */
  const back = () => navigate(`/catalogue?patient=${patient.uid}&reco=${reco.uid}`);

  return (
    <>
      <RecoHeader
        onBack={back}
        onDelete={remove}
        onSave={async () => {
          await saveNote();
          toast('Enregistré');
        }}
      />

      {/* Mobile (app capture): 12 px side margins. */}
      <div className="pt-4 pr-4 pb-6 pl-4 sm:pl-6 max-sm:px-3">
        {guide && (
          <GuideBand step={3} title={w.guideStep3Title} onSkip={flow.skipGuide}>
            {w.guideStep3Text}
          </GuideBand>
        )}

        <div className="flex flex-col-reverse lg:flex-row gap-6 items-start mt-6 max-sm:mt-4">
          <div className="w-full lg:flex-1 min-w-0">
            <NoteEditor
              note={note}
              signature={`${practitioner.firstName} ${practitioner.lastName}`}
              onChange={onNoteChange}
              onBlur={() => saveNote()}
            />
            <RecoProducts reco={reco} onAddProduct={back} onItemsChange={setItems} />
          </div>
          <div className="w-full lg:flex-[0_0_433px]">
            <RecoSidebar reco={reco} practitioner={practitioner} guide={guide} onPreview={() => setPreview(true)} onSend={send} />
          </div>
        </div>
      </div>

      {preview && <PreviewModal reco={reco} practitioner={practitioner} onClose={() => setPreview(false)} onSend={guide ? send : undefined} />}
      {sent && <SentModal reco={sent} onDone={() => navigate('/')} />}
    </>
  );
}
