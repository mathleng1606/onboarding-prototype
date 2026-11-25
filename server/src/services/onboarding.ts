import type { DB } from '../db/index.ts';
import { recordEvent } from './events.ts';
import { type PractitionerRow, reloadPractitioner } from './practitioners.ts';

/**
 * The checklist is computed from facts only, never stored.
 * "Done stays done": soft-deleted rows still count (a deleted patient
 * was still created, a deleted recommendation was still sent).
 */
export const CHECKLIST_ITEMS = [
  'account', //            1. Créer votre compte
  'test_recommendation', // 2. Envoyer une première recommandation test (test or real)
  'favorites', //          3. Choisir vos produits habituels (>= 1 favorite)
  'real_patient', //       4. Ajouter un vrai patient
  'real_recommendation', // 5. Faire votre première vraie recommandation
] as const;
export type ChecklistItem = (typeof CHECKLIST_ITEMS)[number];

export type Onboarding = ReturnType<typeof computeOnboarding>;

export function computeOnboarding(db: DB, p: PractitionerRow) {
  const facts = db
    .prepare(
      `SELECT
         EXISTS(SELECT 1 FROM recommendations WHERE practitioner_id = @id AND status = 'sent')                AS anySent,
         EXISTS(SELECT 1 FROM favorites       WHERE practitioner_id = @id)                                    AS anyFavorite,
         EXISTS(SELECT 1 FROM patients        WHERE practitioner_id = @id AND is_test = 0)                    AS realPatient,
         EXISTS(SELECT 1 FROM recommendations WHERE practitioner_id = @id AND status = 'sent' AND is_test = 0) AS realSent,
         EXISTS(SELECT 1 FROM recommendations WHERE practitioner_id = @id AND status = 'sent' AND is_test = 1) AS testSent`,
    )
    .get({ id: p.id }) as { anySent: number; anyFavorite: number; realPatient: number; realSent: number; testSent: number };

  const done: Record<ChecklistItem, boolean> = {
    account: p.signup_completed_at !== null,
    test_recommendation: facts.anySent === 1,
    favorites: facts.anyFavorite === 1,
    real_patient: facts.realPatient === 1,
    real_recommendation: facts.realSent === 1,
  };
  const items = CHECKLIST_ITEMS.map((key) => ({ key, done: done[key] }));
  const closed = done.real_recommendation; // closes at the first real recommendation
  const guideActive = done.account && p.guide_skipped_at === null && !done.test_recommendation;
  // Screen 11: the first recommendation sent was a real one, the test was never done.
  // The front then shows « Bravo, votre première recommandation est partie ! » instead of « tout est prêt ».
  const realFirstWithoutTest = done.real_recommendation && facts.testSent === 0;

  return {
    items,
    doneCount: items.filter((i) => i.done).length,
    total: items.length,
    nextItem: items.find((i) => !i.done)?.key ?? null,
    closed,
    realFirstWithoutTest,
    hidden: closed && p.checklist_dismissed_at !== null,
    guideActive,
    showWelcome: guideActive && p.welcome_dismissed_at === null,
  };
}

/** Runs a mutation, then records as server events what it changed in the onboarding. */
export function withOnboardingTracking<T>(db: DB, p: PractitionerRow, mutate: () => T): T {
  const before = computeOnboarding(db, p);
  const result = mutate();
  const after = reloadPractitioner(db, p);
  recordOnboardingChanges(db, after, before, computeOnboarding(db, after));
  return result;
}

const SERVER = { origin: 'server' } as const;

function recordOnboardingChanges(db: DB, p: PractitionerRow, before: Onboarding, after: Onboarding) {
  for (const item of after.items) {
    const was = before.items.find((i) => i.key === item.key)!;
    if (item.done && !was.done) recordEvent(db, p, 'checklist_item_completed', { item: item.key }, SERVER);
  }
  if (after.closed && !before.closed) {
    recordEvent(db, p, 'checklist_closed', { n_items_done: after.doneCount }, SERVER);
  }
  // The end of the guide is not an event of its own: a completed guide reads as the test reco_sent,
  // a skipped one is recorded by the skip-guide route as guide_dismissed (it knows the step).
}
