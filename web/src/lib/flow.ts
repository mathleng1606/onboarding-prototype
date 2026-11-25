import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useRefresh } from '../hooks/queries';

/**
 * Navigation of the recommendation flow. The same screens are used with and without
 * the guide: the "mode démarrage" additions only depend on onboarding.guideActive.
 */
export function useFlow() {
  const navigate = useNavigate();
  const refresh = useRefresh();
  return {
    /** « Créer une recommandation », « Commencer », « Nouvelle recommandation »… */
    startReco: (patientUid?: string) =>
      navigate(patientUid ? `/catalogue?patient=${patientUid}` : '/catalogue?panel=patient'),
    /** « Passer le guide »: closes the guide for good and goes back to the home page. */
    skipGuide: async () => {
      refresh.onboarding(await api.skipGuide());
      navigate('/');
    },
  };
}
