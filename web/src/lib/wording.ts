import { createContext, useContext } from 'react';
import type { Profession, RecoFrequency } from '../api/types';

/**
 * VOCABULARY
 *
 * The words depend on the practitioner's profession:
 * - physicians say « prescription » and « patient »;
 * - the other professions say « recommandation » and « client ».
 *
 * Every text that contains one of these words is written here, once, so that changing a text
 * means changing one line. Screens read the texts with `const w = useWording()`, then `w.welcomeTitle`…
 * The provider is set in App.tsx (from the practitioner's profession) and in SignupPage.tsx
 * (from the profession being chosen, so the preview card updates live).
 */
export type Mot = 'recommandation' | 'prescription';
export type Noun = 'patient' | 'client';

/** Professions that are physicians. */
const PHYSICIANS: Profession[] = ['general_practitioner', 'nutrition_physician', 'functional_physician'];

/** Vocabulary of a profession. Before the profession is chosen (signup), the non-physician vocabulary is used. */
export const wordingFor = (profession: Profession | null) =>
  profession && PHYSICIANS.includes(profession) ? wording('prescription', 'patient') : wording('recommandation', 'client');

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function wording(mot: Mot, n: Noun) {
  const presc = mot === 'prescription';
  return {
    /* ---- Basic words ---- */
    /** « recommandation » / « prescription » */
    mot,
    /** « Recommandation » / « Prescription » */
    Mot: cap(mot),
    /** « recommandations » / « prescriptions » */
    mots: `${mot}s`,
    /** « Recommandations » / « Prescriptions » (menu, tabs, table headers) */
    Mots: `${cap(mot)}s`,
    /** « recommandés » / « prescrits » */
    motParticiple: presc ? 'prescrits' : 'recommandés',
    /** « client » / « patient » */
    n,
    /** « Client » / « Patient » */
    N: cap(n),
    /** « clients » / « patients » */
    ns: `${n}s`,
    /** « Clients » / « Patients » */
    Ns: `${cap(n)}s`,

    /* ---- Screen 0: signup (preview card on the right, step 3 question) ---- */
    signupPreviewTitle: `Un aperçu de vos futures ${mot}s de compléments :`,
    signupPreviewFor: `${cap(mot)} pour`,
    signupPreviewProducts: `PRODUITS ${presc ? 'PRESCRITS' : 'RECOMMANDÉS'}`,
    signupFrequencyQuestion: `En moyenne, combien de fois ${presc ? 'prescrivez' : 'recommandez'}-vous des compléments chaque mois?`,
    signupFrequencies: {
      none: presc ? 'Je n’en prescris pas encore' : 'Je n’en recommande pas encore',
      '1_5': `1-5 ${mot}s`,
      '6_10': `6-10 ${mot}s`,
      '11_20': `11-20 ${mot}s`,
      '21_40': `21-40 ${mot}s`,
      '41_plus': `41 ${mot}s et plus`,
    } satisfies Record<RecoFrequency, string>,

    /* ---- Screen 0: welcome modal on the home page ---- */
    welcomeTitle: `Faites votre première ${mot}`,
    welcomeText: `2 minutes, 1 ${n} test, 1 ${mot} pour comprendre comment Simplycure peut vous faciliter le quotidien.`,
    welcomeCta: `Créer ma première ${mot}`,

    /* ---- Screens 1 to 3: guide band (« mode démarrage ») ---- */
    guideStep1Title: `Sélectionnez le ${n} test pour cette première ${mot}`,
    guideStep2Title: 'Choisissez un ou deux produits',
    guideStep2Text: `Cochez ce que vous voulez ${presc ? 'prescrire' : 'recommander'}, vous pourrez modifier doses et durées à l'étape suivante.`,
    guideStep3Title: `Envoyez votre ${mot}`,
    guideStep3Text: 'Ajustez les posologies et ajoutez vos notes, puis cliquez sur « Prévisualiser et envoyer ».',

    /* ---- Screen 3: recommendation editor and preview before sending ---- */
    newRecoTitle: `Nouvelle ${mot}`,
    defaultNote: (firstName: string) => `Bonjour ${firstName}, voici ma ${mot}.`,
    previewSubtitle: `Votre ${mot} sera accompagnée du message suivant :`,
    previewEmailEnd: ` vous a préparé une ${mot} personnalisée.`,
    previewEmailCta: `Voir ma ${mot}`,

    /* ---- Screen 3 bis: « C'est parti pour Jean » modal ---- */
    sentModalLead: (fullName: string) => `${fullName} va recevoir votre ${mot} par e-mail et SMS dans les 30 secondes.`,
    sentModalLabsLabel: `${presc ? 'prescrits' : 'recommandés'} en 5 minutes`,
    sentModalTestBold: `C'était une ${mot} test.`,
    sentModalTestRest: ` Prochaine étape : envoyer une vraie ${mot} à votre prochain ${n} !`,
    sentModalCta: 'Voir les prochaines étapes',
    phoneMockupTitle: `Bonjour, voici votre ${mot} de compléments :`,

    /* ---- Screens 4 and 5: home page and « Vos premiers pas » checklist ---- */
    createRecoCta: `Créer une ${mot}`,
    checklistItem2Title: `Envoyer une première ${mot} test`,
    checklistItem3Text: `Ils seront proposés en premier à chaque ${mot}.`,
    checklistItem5Title: `Faire votre première vraie ${mot}`,
    checklistDoneLead: 'Félicitations, tout est prêt !',
    checklistDoneRest: ` Vous savez maintenant faire une ${mot}.`,
    /** Screen 11: the first recommendation was a real one, without the test. */
    checklistRealFirstLead: `Bravo, votre première ${mot} est partie !`,
    checklistRealFirstRest: ' Dernière étape : choisir vos produits habituels.',

    /* ---- Screens 6, 7 and 10: patients ---- */
    patientsSubtitle: `Gérez vos ${n}s et leurs ${mot}s.`,
    sentBannerTitle: (firstName: string) => `${cap(mot)} envoyée à ${firstName}`,
    smsConversionHint: `quand la ${mot} est aussi envoyée par SMS`,
  };
}
export type Wording = ReturnType<typeof wording>;

export const WordingContext = createContext<Wording>(wordingFor(null));
export const useWording = () => useContext(WordingContext);

export const PROFESSION_LABELS: Record<Profession, string> = {
  naturopath: 'Naturopathe',
  dietitian: 'Diététicien(ne)',
  general_practitioner: 'Médecin généraliste',
  nutrition_physician: 'Médecin nutritionniste',
  functional_physician: 'Médecin fonctionnel',
  nutritionist: 'Nutritionniste',
  micronutritionist: 'Micronutritionniste',
};

/** Plural used in « Les plus recommandés par d'autres Naturopathes ». */
export const PROFESSION_PLURALS: Record<Profession, string> = {
  naturopath: 'Naturopathes',
  dietitian: 'Diététiciens',
  general_practitioner: 'Médecins généralistes',
  nutrition_physician: 'Médecins nutritionnistes',
  functional_physician: 'Médecins fonctionnels',
  nutritionist: 'Nutritionnistes',
  micronutritionist: 'Micronutritionnistes',
};

/** « pot », « flacon », « sachet » after a price (« 23,31 € /pot »). */
export const UNIT_LABELS = { jar: 'pot', bottle: 'flacon', sachet: 'sachet' } as const;
