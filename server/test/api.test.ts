import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.ts';
import { applySchema, type DB, openDb } from '../src/db/index.ts';
import { computeDurations, type Durations } from '../src/services/durations.ts';
import { type EventRow, recordEvent } from '../src/services/events.ts';
import { findPractitioner } from '../src/services/practitioners.ts';
import { PRACTITIONER_UID, seed, TEST_PATIENT_UID } from '../src/db/seed.ts';

const P = `/api/practitioners/${PRACTITIONER_UID}`;
const OMEGA = '7d1b0f5a-2c3e-4f60-9a1b-000000000001';
const MAGNESIUM = '7d1b0f5a-2c3e-4f60-9a1b-000000000002';

let app: FastifyInstance;
let db: DB;

async function call(method: string, url: string, payload?: unknown) {
  const res = await app.inject({ method: method as 'GET', url, payload: payload as object });
  return { status: res.statusCode, body: res.body ? res.json() : undefined };
}

const done = (o: { items: { key: string; done: boolean }[] }) =>
  Object.fromEntries(o.items.map((i) => [i.key, i.done]));

async function signup(anonymousId?: string) {
  await call('PATCH', P, {
    firstName: 'Camille',
    lastName: 'Roche',
    phone: '+32 470 12 34 56',
    profession: 'naturopath',
    recoFrequency: '1_5',
  });
  return call('POST', `${P}/signup/complete`, anonymousId ? { anonymousId } : undefined);
}

async function sendRecoTo(patientUid: string) {
  const created = await call('POST', `${P}/recommendations`, { patientUid, items: [{ productUid: OMEGA }] });
  assert.equal(created.status, 201);
  return call('POST', `${P}/recommendations/${created.body.uid}/send`, { source: 'accueil' });
}

async function createRealPatient() {
  const res = await call('POST', `${P}/patients`, { firstName: 'Claire', lastName: 'Martin', email: 'claire.martin@example.com' });
  assert.equal(res.status, 201);
  return res.body.uid as string;
}

beforeEach(() => {
  db = openDb(':memory:');
  applySchema(db);
  seed(db);
  app = buildApp(db);
});

describe('practitioner & signup', () => {
  test('unknown practitioner uid → 404', async () => {
    const res = await call('GET', '/api/practitioners/nope/onboarding');
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'practitioner_not_found');
  });

  test('signup cannot complete with missing fields', async () => {
    const res = await call('POST', `${P}/signup/complete`);
    assert.equal(res.status, 422);
    assert.deepEqual(res.body.error.details.missing, ['firstName', 'lastName', 'phone', 'profession', 'recoFrequency']);
  });

  test('discount must be between 0 and 20', async () => {
    assert.equal((await call('PATCH', P, { patientDiscountPct: 21 })).status, 422);
    const ok = await call('PATCH', P, { patientDiscountPct: 15, firstName: 'Camille' });
    assert.equal(ok.body.patientDiscountPct, 15);
    assert.equal(ok.body.discountCode, 'CAMILLE15');
  });

  test('no internal id is exposed', async () => {
    await signup();
    const reco = (await sendRecoTo(TEST_PATIENT_UID)).body.recommendation;
    const bodies = [
      (await call('GET', P)).body,
      (await call('GET', `${P}/patients`)).body,
      (await call('GET', `${P}/products`)).body,
      reco,
    ];
    assert.doesNotMatch(JSON.stringify(bodies), /"id"\s*:/);
  });
});

describe('checklist', () => {
  test('fresh practitioner: nothing done, no guide yet', async () => {
    const o = (await call('GET', `${P}/onboarding`)).body;
    assert.equal(o.doneCount, 0);
    assert.equal(o.guideActive, false);
    assert.equal(o.nextItem, 'account');
  });

  test('after signup: 1/5, guide + welcome modal, next = test reco', async () => {
    await signup();
    const o = (await call('GET', `${P}/onboarding`)).body;
    assert.equal(o.doneCount, 1);
    assert.equal(o.guideActive, true);
    assert.equal(o.showWelcome, true);
    assert.equal(o.nextItem, 'test_recommendation');
  });

  test('dismissing the welcome modal keeps the guide', async () => {
    await signup();
    const o = (await call('POST', `${P}/onboarding/dismiss-welcome`)).body;
    assert.equal(o.showWelcome, false);
    assert.equal(o.guideActive, true);
  });

  test('test reco → item 2 done, guide over, checklist still open', async () => {
    await signup();
    const { body } = await sendRecoTo(TEST_PATIENT_UID);
    assert.equal(body.recommendation.isTest, true);
    assert.deepEqual(done(body.onboarding), {
      account: true, test_recommendation: true, favorites: false, real_patient: false, real_recommendation: false,
    });
    assert.equal(body.onboarding.guideActive, false);
    assert.equal(body.onboarding.closed, false);
    assert.equal(body.onboarding.nextItem, 'favorites');
  });

  test('skipping the guide ends the guide without ticking item 2', async () => {
    await signup();
    const o = (await call('POST', `${P}/onboarding/skip-guide`, { step: 1 })).body;
    assert.equal(o.guideActive, false);
    assert.equal(done(o).test_recommendation, false);
  });

  test('a first REAL reco ticks items 2, 4 and 5 and closes the checklist', async () => {
    await signup();
    await call('POST', `${P}/onboarding/skip-guide`, { step: 1 });
    const { body } = await sendRecoTo(await createRealPatient());
    assert.equal(body.recommendation.isTest, false);
    assert.deepEqual(done(body.onboarding), {
      account: true, test_recommendation: true, favorites: false, real_patient: true, real_recommendation: true,
    });
    assert.equal(body.onboarding.closed, true);
    assert.equal(body.onboarding.nextItem, 'favorites'); // stays as a discreet line under "Tout est prêt"
  });

  test('item 3 needs one favorite', async () => {
    await signup();
    assert.equal((await call('PUT', `${P}/favorites/${MAGNESIUM}`)).status, 204);
    assert.equal(done((await call('GET', `${P}/onboarding`)).body).favorites, true);
  });

  test('done stays done: deleting the patient, the reco and the favorite changes nothing', async () => {
    await signup();
    const claire = await createRealPatient();
    const reco = (await sendRecoTo(claire)).body.recommendation;
    await call('PUT', `${P}/favorites/${OMEGA}`);

    assert.equal((await call('DELETE', `${P}/recommendations/${reco.uid}`)).status, 204);
    assert.equal((await call('DELETE', `${P}/patients/${claire}`)).status, 204);
    assert.equal((await call('DELETE', `${P}/favorites/${OMEGA}`)).status, 204);

    const o = (await call('GET', `${P}/onboarding`)).body;
    assert.equal(o.doneCount, 5);
    assert.equal(o.closed, true);
    assert.equal((await call('GET', `${P}/patients`)).body.length, 1); // only Jean is listed
  });

  test('the checklist can only be dismissed once closed', async () => {
    await signup();
    assert.equal((await call('POST', `${P}/onboarding/dismiss-checklist`)).status, 409);
    await sendRecoTo(await createRealPatient());
    assert.equal((await call('POST', `${P}/onboarding/dismiss-checklist`)).body.hidden, true);
  });
});

describe('first recommendation real, without the test (screen 11)', () => {
  test('flagged only when the test was never sent', async () => {
    await signup();
    await sendRecoTo(await createRealPatient());
    const o = (await call('GET', `${P}/onboarding`)).body;
    assert.equal(o.realFirstWithoutTest, true);
    assert.equal(o.doneCount, 4); // account, test (any reco sent), real patient, real reco
    assert.equal(o.nextItem, 'favorites');
    await sendRecoTo(TEST_PATIENT_UID);
    assert.equal((await call('GET', `${P}/onboarding`)).body.realFirstWithoutTest, false);
  });
});

describe('patients', () => {
  test('a created patient is always real and manual, even if the body says otherwise', async () => {
    const res = await call('POST', `${P}/patients`, { firstName: 'A', lastName: 'B', email: 'a@example.com', isTest: true });
    assert.equal(res.status, 422); // isTest is not an accepted field
    const uid = await createRealPatient();
    const p = (await call('GET', `${P}/patients/${uid}`)).body;
    assert.equal(p.isTest, false);
    assert.equal(p.origin, 'manual');
  });

  test('the list counts the recommendations of each patient', async () => {
    const claire = await createRealPatient();
    await sendRecoTo(claire);
    const list = (await call('GET', `${P}/patients`)).body;
    assert.equal(list[0].isTest, true); // test patient first
    const c = list.find((p: { uid: string }) => p.uid === claire);
    assert.equal(c.recommendationCount, 1);
    assert.equal(c.orderCount, 0);
    assert.ok(c.lastActivityAt >= c.createdAt);
  });

  test('the test patient cannot be deleted', async () => {
    const res = await call('DELETE', `${P}/patients/${TEST_PATIENT_UID}`);
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'test_patient_not_deletable');
  });
});

describe('catalogue', () => {
  test('starter row = 3 products, prices with the practitioner discount', async () => {
    const products = (await call('GET', `${P}/products?section=starter`)).body;
    assert.deepEqual(products.map((p: { name: string }) => p.name), ['Oméga 3 EPAX®', 'Magnésium Taurine B6', 'Vitamine D3K2 Forte (2000 UI)']);
    assert.equal(products[0].priceCents, 2590);
    assert.equal(products[0].discountedPriceCents, 2331);
  });

  test('popular ranking depends on the profession, which is required', async () => {
    const res = await call('GET', `${P}/products?section=popular`);
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'profession_required');
    const first = async () => (await call('GET', `${P}/products?section=popular`)).body[0].name;
    await call('PATCH', P, { profession: 'naturopath' });
    assert.equal(await first(), 'Magnésium Taurine B6');
    await call('PATCH', P, { profession: 'dietitian' });
    assert.equal(await first(), 'Multivitamines');
  });

  test('search ignores accents and case', async () => {
    const res = (await call('GET', `${P}/products?q=omega`)).body;
    assert.equal(res.length, 2);
  });
});

describe('recommendations', () => {
  test('totals follow the reference (25,90 − 10 % = 23,31)', async () => {
    const reco = (await call('POST', `${P}/recommendations`, { patientUid: TEST_PATIENT_UID, items: [{ productUid: OMEGA }] })).body;
    assert.deepEqual(reco.totals, { subtotalCents: 2590, discountPct: 10, discountCents: 259, totalCents: 2331 });
    assert.equal(reco.items[0].dosage, 'Prendre 1 capsule molle 3 fois par jour pendant le repas.');
  });

  test('a sent reco cannot be modified nor re-sent, and keeps its discount', async () => {
    await signup();
    const reco = (await sendRecoTo(TEST_PATIENT_UID)).body.recommendation;
    assert.equal((await call('PATCH', `${P}/recommendations/${reco.uid}`, { note: 'x' })).status, 409);
    assert.equal((await call('POST', `${P}/recommendations/${reco.uid}/send`, { source: 'accueil' })).status, 409);
    await call('PATCH', P, { patientDiscountPct: 20 });
    assert.equal((await call('GET', `${P}/recommendations/${reco.uid}`)).body.totals.discountPct, 10);
  });

  test('a reco needs at least one product', async () => {
    const res = await call('POST', `${P}/recommendations`, { patientUid: TEST_PATIENT_UID, items: [] });
    assert.equal(res.status, 422);
  });
});

type Ev = { name: string; props: Record<string, unknown> };
const SERVER_EVENTS = new Set(['checklist_item_completed', 'checklist_closed', 'guide_dismissed', 'reco_sent']);
/** Server events in chronological order, without the profession added to every event. */
const serverEvents = async () =>
  ((await call('GET', `${P}/events`)).body as Ev[])
    .filter((e) => SERVER_EVENTS.has(e.name))
    .map(({ name, props: { profession: _, ...props } }) => ({ name, props }))
    .reverse();

describe('events table', () => {
  test('an old events table (practitioner_id, source) is replaced by the new one', () => {
    const db = openDb(':memory:');
    db.exec(`CREATE TABLE events (id INTEGER PRIMARY KEY, practitioner_id INTEGER, name TEXT, source TEXT)`);
    applySchema(db);
    const cols = (db.prepare(`SELECT name FROM pragma_table_info('events')`).all() as { name: string }[]).map((c) => c.name);
    assert.deepEqual(cols, ['id', 'name', 'anonymous_id', 'account_uid', 'props', 'created_at']);
  });

  test('an event needs an anonymous_id or an account_uid', () => {
    const db = openDb(':memory:');
    applySchema(db);
    assert.throws(() => db.prepare(`INSERT INTO events (name) VALUES ('signup_started')`).run(), /CHECK/);
  });
});

describe('server events (aligned names)', () => {
  test('signup + test reco: checklist_item_completed and reco_sent, no guide event', async () => {
    await signup();
    await sendRecoTo(TEST_PATIENT_UID);
    assert.deepEqual(
      (await serverEvents()).map((e) => [e.name, e.props]),
      [
        ['checklist_item_completed', { item: 'account' }],
        ['reco_sent', { is_test_patient: true, source: 'accueil', n_products: 1 }],
        ['checklist_item_completed', { item: 'test_recommendation' }],
      ],
    );
  });

  test('« Passer le guide » records guide_dismissed with the step, only while the guide is active', async () => {
    await signup();
    await call('POST', `${P}/onboarding/skip-guide`, { step: 2 });
    await call('POST', `${P}/onboarding/skip-guide`, { step: 3 }); // already skipped: nothing more
    const dismissed = (await serverEvents()).filter((e) => e.name === 'guide_dismissed');
    assert.deepEqual(dismissed.map((e) => e.props), [{ step: 2 }]);
    assert.equal((await call('POST', `${P}/onboarding/skip-guide`, {})).status, 422);
  });

  test('the first real reco records checklist_closed with the number of items done', async () => {
    await signup();
    await sendRecoTo(await createRealPatient());
    const closed = (await serverEvents()).filter((e) => e.name === 'checklist_closed');
    assert.deepEqual(closed.map((e) => e.props), [{ n_items_done: 4 }]);
  });

  test('every event carries the account and the profession, set by the server', async () => {
    await signup();
    const [e] = (await call('GET', `${P}/events`)).body;
    assert.equal(e.accountUid, PRACTITIONER_UID);
    assert.equal(e.props.profession, 'naturopath');
    assert.match(e.createdAt, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
  });

  test('old names are gone', async () => {
    await signup();
    await call('POST', `${P}/onboarding/skip-guide`, { step: 1 });
    await sendRecoTo(await createRealPatient());
    const names = new Set((await serverEvents()).map((e) => e.name));
    for (const old of ['onboarding_item_completed', 'guide_ended', 'recommendation_sent']) assert.equal(names.has(old), false);
  });

  test('sending needs a known source', async () => {
    const created = await call('POST', `${P}/recommendations`, { patientUid: TEST_PATIENT_UID, items: [{ productUid: OMEGA }] });
    assert.equal((await call('POST', `${P}/recommendations/${created.body.uid}/send`, { source: 'ailleurs' })).status, 422);
  });
});

const ANON = '0f9e8d7c-6b5a-4c3d-8e2f-1a2b3c4d5e6f';
const track = (name: string, props: Record<string, unknown> = {}, anonymousId: string | null = ANON) =>
  call('POST', `${P}/events`, { name, props, ...(anonymousId ? { anonymousId } : {}) });

describe('POST /events', () => {
  test('a known event with its exact props is accepted, the server adds the common props', async () => {
    const res = await track('signup_step_completed', { step: 3, volume_declared: '6_10' });
    assert.equal(res.status, 201);
    assert.equal(res.body.anonymousId, ANON);
    assert.equal(res.body.accountUid, null); // no account before the signup is completed
    assert.deepEqual(res.body.props, { step: 3, volume_declared: '6_10', profession: null });
  });

  test('before the signup, an event without anonymous_id is refused', async () => {
    assert.equal((await track('signup_started', {}, null)).status, 422);
  });

  test('signup_completed links the anonymous events to the account', async () => {
    await track('signup_started');
    await signup(ANON);
    const events = (await call('GET', `${P}/events`)).body.reverse();
    const started = events.find((e: { name: string }) => e.name === 'signup_started');
    const completed = events.find((e: { name: string }) => e.name === 'signup_completed');
    assert.equal(started.accountUid, PRACTITIONER_UID);
    assert.equal(completed.anonymousId, ANON);
    assert.equal(completed.accountUid, PRACTITIONER_UID);
  });

  test('after the signup, the account is set by the server and session_started gets days_since_signup', async () => {
    await signup();
    const res = await track('session_started', {}, null);
    assert.equal(res.status, 201);
    assert.equal(res.body.accountUid, PRACTITIONER_UID);
    assert.equal(res.body.props.days_since_signup, 0);
  });

  test('refused, with the usual error format', async () => {
    const cases: [string, Record<string, unknown>][] = [
      ['guide_started', {}], //                                 unknown name
      ['patient_order_paid', { reco_id: 'x' }], //             out of the prototype
      ['reco_sent', { is_test_patient: true }], //             server only
      ['reco_started', { source: 'ailleurs' }], //             unknown value
      ['reco_started', {}], //                                 missing prop
      ['reco_started', { source: 'guide', extra: 1 }], //      unexpected prop
      ['patient_created', { source: 'checklist', email: 'a@b.fr' }], // patient data: key
      ['tool_connected', { tool: 'claire.martin@example.com' }], //     patient data: value
      ['patient_created', { source: 'checklist', nom: 'Martin' }],
      ['protocol_created', { note: '+32 470 12 34 56' }], //            phone number
    ];
    for (const [name, props] of cases) {
      const res = await track(name, props);
      assert.equal(res.status, 422, `${name} ${JSON.stringify(props)}`);
      assert.equal(res.body.error.code, 'validation_error');
      assert.equal(typeof res.body.error.message, 'string');
    }
    assert.equal((await call('POST', `${P}/events`, { name: 'session_started', createdAt: '2020-01-01' })).status, 422);
    assert.equal((await call('GET', `${P}/events`)).body.length, 0);
  });
});

describe('durations (/debug)', () => {
  /** Places an event at a given minute of 2026-01-01 (server clock), as the app would write it. */
  const at = (min: number, sec = 0) => `2026-01-01 10:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.000`;
  const put = (name: string, props: Record<string, unknown>, when: string, anonymousId?: string) =>
    recordEvent(db, findPractitioner(db, PRACTITIONER_UID), name, props, { origin: 'web', anonymousId, at: when });
  const durations = async () => (await call('GET', '/api/dev/durations')).body as Durations;
  const seconds = (m: Durations[keyof Durations]) => m.samples.map((s) => s.seconds);

  test('signup = signup_completed − signup_started, paired by anonymous_id; an abandoned signup is not a duration', async () => {
    const OTHER = '11111111-2222-4333-8444-555555555555';
    put('signup_started', {}, at(0), ANON);
    put('signup_started', {}, at(1), OTHER); // never completed
    put('signup_step_completed', { step: 1 }, at(2), ANON);
    put('signup_completed', {}, at(3, 30), ANON);
    const d = await durations();
    assert.deepEqual(seconds(d.signup), [210]);
    assert.equal(d.signup.medianSeconds, 210);
  });

  test('tutorial = first test reco_sent − guide_step_viewed step 1; a real reco does not end it', async () => {
    await signup();
    put('guide_step_viewed', { step: 1 }, at(10));
    put('guide_step_viewed', { step: 2 }, at(11));
    put('reco_sent', { is_test_patient: false, source: 'accueil', n_products: 1 }, at(12));
    put('reco_sent', { is_test_patient: true, source: 'guide', n_products: 2 }, at(14));
    put('reco_sent', { is_test_patient: true, source: 'checklist', n_products: 1 }, at(20)); // not the first
    assert.deepEqual(seconds((await durations()).tutorial), [240]);
  });

  test('no tutorial duration when the guide was skipped (no test reco_sent)', async () => {
    await signup();
    put('guide_step_viewed', { step: 1 }, at(10));
    put('guide_dismissed', { step: 1 }, at(11));
    assert.deepEqual((await durations()).tutorial, { samples: [], medianSeconds: null });
  });

  test('reco = reco_sent − the reco_started just before it, each start used once; median of the recos', async () => {
    await signup();
    put('reco_started', { source: 'accueil' }, at(0)); //    abandoned, replaced by the next start
    put('reco_started', { source: 'accueil' }, at(10));
    put('reco_sent', { is_test_patient: false, source: 'accueil', n_products: 1 }, at(12)); //  120 s
    put('reco_started', { source: 'patients' }, at(20));
    put('reco_sent', { is_test_patient: false, source: 'patients', n_products: 1 }, at(21)); // 60 s
    put('reco_sent', { is_test_patient: false, source: 'patients', n_products: 1 }, at(22)); // no start left: ignored
    put('reco_started', { source: 'checklist' }, at(30));
    put('reco_sent', { is_test_patient: false, source: 'checklist', n_products: 1 }, at(35)); // 300 s
    const d = await durations();
    assert.deepEqual(seconds(d.reco), [120, 60, 300]);
    assert.equal(d.reco.medianSeconds, 120);
  });

  test('pauses are kept: a 2-hour break counts as is', async () => {
    await signup();
    put('reco_started', { source: 'accueil' }, '2026-01-01 08:00:00.000');
    put('reco_sent', { is_test_patient: false, source: 'accueil', n_products: 1 }, '2026-01-01 10:00:00.000');
    assert.deepEqual(seconds((await durations()).reco), [7200]);
  });

  test('median of an even number of samples is the mean of the two middle ones', () => {
    const row = (id: number, name: string, min: number): EventRow => ({
      id, name, anonymous_id: null, account_uid: PRACTITIONER_UID, props: '{}', created_at: at(min),
    });
    const d = computeDurations([
      row(1, 'reco_started', 0), row(2, 'reco_sent', 1),
      row(3, 'reco_started', 2), row(4, 'reco_sent', 5),
    ]);
    assert.equal(d.reco.medianSeconds, 120);
  });

  test('« Vider les events » empties the table', async () => {
    await signup();
    assert.equal((await call('DELETE', '/api/dev/events')).status, 204);
    assert.equal((await call('GET', '/api/dev/events')).body.length, 0);
  });
});

