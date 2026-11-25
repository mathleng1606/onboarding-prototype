import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useRefresh } from '../hooks/queries';

/** Where a recommendation was started from (reco_started, reco_sent). Same list as the server. */
export type RecoSource = 'guide' | 'accueil' | 'checklist' | 'patients';
export type GuideStep = 1 | 2 | 3;

const RECO_SOURCE_KEY = 'reco-source';

/** The source of the recommendation in progress, kept for the tab until it is sent. */
export function currentRecoSource(): RecoSource {
  return (sessionStorage.getItem(RECO_SOURCE_KEY) as RecoSource | null) ?? 'accueil';
}

/**
 * Navigation of the recommendation flow. The same screens are used with and without
 * the guide: the "mode démarrage" additions only depend on onboarding.guideActive.
 */
export function useFlow() {
  const navigate = useNavigate();
  const refresh = useRefresh();
  return {
    /** « Créer une recommandation », « Commencer », « Nouvelle recommandation »… */
    startReco: (source: RecoSource, patientUid?: string) => {
      sessionStorage.setItem(RECO_SOURCE_KEY, source);
      navigate(patientUid ? `/catalogue?patient=${patientUid}` : '/catalogue?panel=patient');
    },
    /** « Passer le guide »: closes the guide for good and goes back to the home page. */
    skipGuide: async (step: GuideStep) => {
      refresh.onboarding(await api.skipGuide(step));
      navigate('/');
    },
  };
}
