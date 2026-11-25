import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.ts';
import { applySchema, openDb } from '../src/db/index.ts';
import { PRACTITIONER_UID, seed, TEST_PATIENT_UID } from '../src/db/seed.ts';

const P = `/api/practitioners/${PRACTITIONER_UID}`;
const OMEGA = '7d1b0f5a-2c3e-4f60-9a1b-000000000001';
const MAGNESIUM = '7d1b0f5a-2c3e-4f60-9a1b-000000000002';

let app: FastifyInstance;

async function call(method: string, url: string, payload?: unknown) {
  const res = await app.inject({ method: method as 'GET', url, payload: payload as object });
  return { status: res.statusCode, body: res.body ? res.json() : undefined };
}

const done = (o: { items: { key: string; done: boolean }[] }) =>
  Object.fromEntries(o.items.map((i) => [i.key, i.done]));

async function signup() {
  await call('PATCH', P, {
    firstName: 'Camille',
    lastName: 'Roche',
    phone: '+32 470 12 34 56',
    profession: 'naturopath',
    recoFrequency: '1_5',
  });
  return call('POST', `${P}/signup/complete`);
}

async function sendRecoTo(patientUid: string) {
  const created = await call('POST', `${P}/recommendations`, { patientUid, items: [{ productUid: OMEGA }] });
  assert.equal(created.status, 201);
  return call('POST', `${P}/recommendations/${created.body.uid}/send`);
}

async function createRealPatient() {
  const res = await call('POST', `${P}/patients`, { firstName: 'Claire', lastName: 'Martin', email: 'claire.martin@example.com' });
  assert.equal(res.status, 201);
  return res.body.uid as string;
}

beforeEach(() => {
  const db = openDb(':memory:');
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
    const o = (await call('POST', `${P}/onboarding/skip-guide`)).body;
    assert.equal(o.guideActive, false);
    assert.equal(done(o).test_recommendation, false);
  });

  test('a first REAL reco ticks items 2, 4 and 5 and closes the checklist', async () => {
    await signup();
    await call('POST', `${P}/onboarding/skip-guide`);
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
    assert.equal((await call('POST', `${P}/recommendations/${reco.uid}/send`)).status, 409);
    await call('PATCH', P, { patientDiscountPct: 20 });
    assert.equal((await call('GET', `${P}/recommendations/${reco.uid}`)).body.totals.discountPct, 10);
  });

  test('a reco needs at least one product', async () => {
    const res = await call('POST', `${P}/recommendations`, { patientUid: TEST_PATIENT_UID, items: [] });
    assert.equal(res.status, 422);
  });
});

describe('events', () => {
  test('web events are stored, server events are added on facts', async () => {
    assert.equal((await call('POST', `${P}/events`, { name: 'guide_started', props: { from: 'welcome_modal' } })).status, 201);
    assert.equal((await call('POST', `${P}/events`, { name: 'Bad Name' })).status, 422);
    await signup();
    await sendRecoTo(TEST_PATIENT_UID);
    const names = (await call('GET', `${P}/events`)).body.map((e: { name: string; source: string }) => `${e.source}:${e.name}`);
    assert.deepEqual(names.reverse(), [
      'web:guide_started',
      'server:onboarding_item_completed',
      'server:recommendation_sent',
      'server:onboarding_item_completed',
      'server:guide_ended',
    ]);
  });
});
