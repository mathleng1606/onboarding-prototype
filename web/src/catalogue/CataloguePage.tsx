import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Patient, Product } from '../api/types';
import { keys, useOnboarding, usePatients, usePractitioner } from '../hooks/queries';
import { useFlow } from '../lib/flow';
import { track, useTrackView } from '../lib/track';
import { PROFESSION_PLURALS, useWording } from '../lib/wording';
import { PatientPanel } from '../patients/PatientPanel';
import { Upload } from '../ui/icons';
import { CatalogueHeader } from './CatalogueHeader';
import { FavoritesEmpty, Grid, MomentCategories, SectionTitle } from './CatalogueSections';
import { CatalogueToolbar } from './CatalogueToolbar';
import { ProductCard } from './ProductCard';

/** Products added to the recommendation being prepared: productUid -> quantity. */
type Selection = Map<string, number>;

/**
 * CATALOGUE (screens 1, 2 and 9): the real catalogue, with the guide additions while the guide is active.
 * URL: ?panel=patient|create opens the patient panel, ?patient=<uid> is the chosen patient,
 * ?reco=<uid> edits an existing draft (coming back from « Retour » on the recommendation page).
 */
export function CataloguePage() {
  const w = useWording();
  const navigate = useNavigate();
  const flow = useFlow();
  const [params, setParams] = useSearchParams();
  const { data: onboarding } = useOnboarding();
  const { data: practitioner } = usePractitioner();
  const { data: patients } = usePatients();

  const panel = params.get('panel') as 'patient' | 'create' | null;
  const patientUid = params.get('patient');
  const recoUid = params.get('reco');
  const patient = patients?.find((p) => p.uid === patientUid) ?? null;
  // The guide is about the test patient only: a recommendation for a real patient is in normal mode,
  // even when the guide is still active (real patient created from the Patients page).
  const guide = (onboarding?.guideActive ?? false) && (!patient || patient.isTest);

  const [selection, setSelection] = useState<Selection>(new Map());
  const [q, setQ] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);

  // Coming back from the recommendation page: start from its products.
  const { data: draft } = useQuery({
    queryKey: keys.recommendation(recoUid ?? ''),
    queryFn: () => api.recommendation(recoUid!),
    enabled: !!recoUid,
  });
  const [loadedDraft, setLoadedDraft] = useState<string | null>(null);
  if (draft && loadedDraft !== draft.uid) {
    setLoadedDraft(draft.uid);
    setSelection(new Map(draft.items.map((i) => [i.product.uid, i.quantity])));
  }

  const starter = useQuery({ queryKey: keys.products({ section: 'starter' }), queryFn: () => api.products({ section: 'starter' }) });
  const popular = useQuery({
    queryKey: keys.products({ section: 'popular' }),
    queryFn: () => api.products({ section: 'popular' }),
    enabled: !!practitioner?.profession,
  });
  const favorites = useQuery({ queryKey: keys.favorites, queryFn: api.favorites });
  const all = useQuery({ queryKey: keys.products({}), queryFn: () => api.products(), enabled: showAll || !!q });

  const results = useMemo(() => {
    if (!q || !all.data) return null;
    const n = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    return all.data.filter((p) => n(`${p.name} ${p.brand}`).includes(n(q)));
  }, [q, all.data]);

  // Guide step 2 = choosing the products, once the test patient is chosen (the band shows then).
  useTrackView(guide && !!patient, 'guide_step_viewed', { step: 2 });

  if (!onboarding || !practitioner) return null;

  const setParam = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    setParams(next);
  };

  const choosePatient = (p: Patient) => {
    // Guide step 1 = choosing the test patient (the only one offered during the guide).
    if (guide) track('guide_step_completed', { step: 1 });
    setParam({ patient: p.uid, panel: null });
  };
  const add = (product: Product, quantity: number) => setSelection(new Map(selection).set(product.uid, quantity));
  const remove = (product: Product) => {
    const next = new Map(selection);
    next.delete(product.uid);
    setSelection(next);
  };
  const card = (p: Product) => (
    <ProductCard key={p.uid} product={p} added={selection.has(p.uid)} onAdd={(n) => add(p, n)} onRemove={() => remove(p)} />
  );

  /** « Valider la sélection »: creates the recommendation (or updates the draft), then opens it. */
  async function validate() {
    if (selection.size === 0 || busy) return;
    if (!patient) return setParam({ panel: 'patient' });
    setBusy(true);
    try {
      const items = [...selection].map(([productUid, quantity]) => ({ productUid, quantity }));
      const reco =
        recoUid && draft?.status === 'draft'
          ? await api.updateRecommendation(recoUid, { patientUid: patient.uid, items })
          : await api.createRecommendation({ patientUid: patient.uid, items, note: w.defaultNote(patient.firstName) });
      if (guide) track('guide_step_completed', { step: 2 });
      navigate(`/recommandations/${reco.uid}`);
    } finally {
      setBusy(false);
    }
  }

  const count = selection.size;

  return (
    <div className="pt-4 pr-4 pb-6 pl-4 sm:pl-6">
      <CatalogueHeader
        count={count}
        patient={patient}
        guide={guide}
        onValidate={validate}
        onChoosePatient={() => setParam({ panel: 'patient' })}
        onSkipGuide={() => flow.skipGuide(2)}
      />
      <CatalogueToolbar q={q} onSearch={setQ} />

      {results ? (
        <>
          <SectionTitle>Résultats</SectionTitle>
          <Grid cols={4}>{results.map(card)}</Grid>
          {results.length === 0 && <div className="mt-3 text-sm text-ink-muted">Aucun produit trouvé.</div>}
        </>
      ) : (
        <>
          {guide && patient && starter.data && (
            <>
              <SectionTitle>Pour démarrer</SectionTitle>
              <div className="mt-1 text-sm text-ink-muted">Les produits les plus {w.motParticiple} par d'autres praticiens.</div>
              <Grid cols={3}>{starter.data.map(card)}</Grid>
            </>
          )}

          <MomentCategories />

          <div className="flex items-center mt-6">
            <h2 className="m-0 flex-1 text-xl font-semibold text-ink">Mes favoris</h2>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
              <Upload size={16} strokeWidth={1.75} />
              Importer des produits
            </span>
          </div>
          {favorites.data && favorites.data.length > 0 ? (
            <Grid cols={4}>{favorites.data.map(card)}</Grid>
          ) : (
            <FavoritesEmpty onConfigure={() => navigate('/favoris')} />
          )}

          {practitioner.profession && (
            <>
              <SectionTitle>Les plus {w.motParticiple} par d'autres {PROFESSION_PLURALS[practitioner.profession]}</SectionTitle>
              <Grid cols={4}>{(showAll ? (all.data ?? []) : (popular.data ?? [])).map(card)}</Grid>
              {!showAll && (
                <div className="flex justify-center mt-6 pb-6">
                  {/* Rounded 12 px and ink text: not one of the standard buttons, as in the reference. */}
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="inline-flex items-center h-10 px-4 max-sm:h-7 max-sm:px-2.5 max-sm:rounded-sm max-sm:text-13 box-border border border-brand-900 rounded-md text-sm font-medium text-ink bg-transparent"
                  >
                    Voir plus de produits
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {panel && (
        <PatientPanel
          guide={guide}
          initialTab={panel === 'create' ? 'create' : 'search'}
          onClose={() => setParam({ panel: null })}
          onChoose={choosePatient}
          onSkipGuide={() => flow.skipGuide(1)}
        />
      )}
    </div>
  );
}
