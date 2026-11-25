import { z } from 'zod';
import type { DB } from '../db/index.ts';
import { bool, HttpError, iso, newUid, notFound } from '../lib.ts';
import { findPatient } from './patients.ts';
import type { PractitionerRow } from './practitioners.ts';
import { findProductId } from './products.ts';

const itemsSchema = z
  .array(
    z.strictObject({
      productUid: z.string(),
      quantity: z.number().int().min(1).max(99).default(1),
      dosage: z.string().trim().max(500).optional(),
    }),
  )
  .min(1)
  .refine((items) => new Set(items.map((i) => i.productUid)).size === items.length, 'Duplicate product');

export const recoCreateSchema = z.strictObject({
  patientUid: z.string(),
  items: itemsSchema,
  note: z.string().max(5000).default(''),
});

export const recoPatchSchema = z.strictObject({
  patientUid: z.string().optional(),
  items: itemsSchema.optional(),
  note: z.string().max(5000).optional(),
});

export const recoListQuerySchema = z.strictObject({
  patientUid: z.string().optional(),
  status: z.enum(['draft', 'sent']).optional(),
});

type RecoRow = {
  id: number;
  uid: string;
  status: 'draft' | 'sent';
  is_test: number;
  discount_pct: number | null;
  note: string;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  patient_id: number;
  patient_uid: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_is_test: number;
};

type ItemRow = {
  quantity: number;
  dosage: string | null;
  position: number;
  uid: string;
  name: string;
  brand: string;
  format: string;
  unit: string;
  image: string | null;
  price_cents: number;
};

const SELECT_RECO = `
  SELECT r.id, r.uid, r.status, r.is_test, r.discount_pct, r.note, r.created_at, r.updated_at, r.sent_at,
         pa.id AS patient_id, pa.uid AS patient_uid, pa.first_name AS patient_first_name,
         pa.last_name AS patient_last_name, pa.is_test AS patient_is_test
  FROM recommendations r JOIN patients pa ON pa.id = r.patient_id
  WHERE r.practitioner_id = @pid AND r.deleted_at IS NULL`;

function toRecoDto(db: DB, p: PractitionerRow, r: RecoRow) {
  const items = db
    .prepare(
      `SELECT ri.quantity, ri.dosage, ri.position, pr.uid, pr.name, pr.brand, pr.format, pr.unit, pr.image, pr.price_cents
       FROM recommendation_items ri JOIN products pr ON pr.id = ri.product_id
       WHERE ri.recommendation_id = ? ORDER BY ri.position`,
    )
    .all(r.id) as ItemRow[];

  // A sent recommendation keeps the discount it was sent with.
  const discountPct = r.discount_pct ?? p.patient_discount_pct;
  const subtotalCents = items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0);
  const discountCents = Math.round((subtotalCents * discountPct) / 100);

  return {
    uid: r.uid,
    status: r.status,
    isTest: bool(r.is_test),
    note: r.note,
    patient: {
      uid: r.patient_uid,
      firstName: r.patient_first_name,
      lastName: r.patient_last_name,
      isTest: bool(r.patient_is_test),
    },
    items: items.map((i) => ({
      product: {
        uid: i.uid,
        name: i.name,
        brand: i.brand,
        format: i.format,
        unit: i.unit,
        image: i.image,
        priceCents: i.price_cents,
      },
      quantity: i.quantity,
      dosage: i.dosage,
      lineTotalCents: i.price_cents * i.quantity,
    })),
    totals: { subtotalCents, discountPct, discountCents, totalCents: subtotalCents - discountCents },
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    sentAt: iso(r.sent_at),
  };
}
export type RecommendationDto = ReturnType<typeof toRecoDto>;

function findReco(db: DB, p: PractitionerRow, uid: string): RecoRow {
  const row = db.prepare(`${SELECT_RECO} AND r.uid = @uid`).get({ pid: p.id, uid }) as RecoRow | undefined;
  if (!row) throw notFound('recommendation');
  return row;
}

export function getReco(db: DB, p: PractitionerRow, uid: string) {
  return toRecoDto(db, p, findReco(db, p, uid));
}

export function listRecos(db: DB, p: PractitionerRow, q: z.infer<typeof recoListQuerySchema>) {
  let sql = SELECT_RECO;
  if (q.patientUid) sql += ` AND pa.uid = @patientUid`;
  if (q.status) sql += ` AND r.status = @status`;
  const rows = db
    .prepare(`${sql} ORDER BY r.created_at DESC, r.id DESC`)
    .all({ pid: p.id, patientUid: q.patientUid ?? null, status: q.status ?? null }) as RecoRow[];
  return rows.map((r) => toRecoDto(db, p, r));
}

function replaceItems(db: DB, recoId: number, items: z.infer<typeof itemsSchema>) {
  const resolved = items.map((i) => ({ ...i, productId: findProductId(db, i.productUid) }));
  db.prepare(`DELETE FROM recommendation_items WHERE recommendation_id = ?`).run(recoId);
  const insert = db.prepare(
    `INSERT INTO recommendation_items (recommendation_id, product_id, quantity, dosage, position)
     VALUES (?, ?, ?, COALESCE(?, (SELECT default_dosage FROM products WHERE id = ?)), ?)`,
  );
  resolved.forEach((i, position) =>
    insert.run(recoId, i.productId, i.quantity, i.dosage ?? null, i.productId, position),
  );
}

export function createReco(db: DB, p: PractitionerRow, input: z.infer<typeof recoCreateSchema>) {
  const patient = findPatient(db, p, input.patientUid);
  const uid = newUid();
  db.transaction(() => {
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO recommendations (uid, practitioner_id, patient_id, is_test, note) VALUES (?, ?, ?, ?, ?)`,
      )
      .run(uid, p.id, patient.id, patient.is_test, input.note);
    replaceItems(db, Number(lastInsertRowid), input.items);
  })();
  return getReco(db, p, uid);
}

function assertDraft(r: RecoRow) {
  if (r.status === 'sent') {
    throw new HttpError(409, 'recommendation_already_sent', 'A sent recommendation cannot be modified');
  }
}

export function updateReco(db: DB, p: PractitionerRow, uid: string, input: z.infer<typeof recoPatchSchema>) {
  const reco = findReco(db, p, uid);
  assertDraft(reco);
  db.transaction(() => {
    if (input.patientUid !== undefined) {
      const patient = findPatient(db, p, input.patientUid);
      db.prepare(`UPDATE recommendations SET patient_id = ?, is_test = ? WHERE id = ?`).run(
        patient.id,
        patient.is_test,
        reco.id,
      );
    }
    if (input.note !== undefined) {
      db.prepare(`UPDATE recommendations SET note = ? WHERE id = ?`).run(input.note, reco.id);
    }
    if (input.items !== undefined) {
      replaceItems(db, reco.id, input.items);
      db.prepare(`UPDATE recommendations SET updated_at = datetime('now') WHERE id = ?`).run(reco.id);
    }
  })();
  return getReco(db, p, uid);
}

export function sendReco(db: DB, p: PractitionerRow, uid: string) {
  const reco = findReco(db, p, uid);
  assertDraft(reco);
  db.prepare(
    `UPDATE recommendations SET status = 'sent', sent_at = datetime('now'), discount_pct = ? WHERE id = ?`,
  ).run(p.patient_discount_pct, reco.id);
  return getReco(db, p, uid);
}

export function deleteReco(db: DB, p: PractitionerRow, uid: string) {
  const reco = findReco(db, p, uid);
  db.prepare(`UPDATE recommendations SET deleted_at = datetime('now') WHERE id = ?`).run(reco.id);
}
