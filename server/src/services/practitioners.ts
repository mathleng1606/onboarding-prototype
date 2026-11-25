import { z } from 'zod';
import type { DB } from '../db/index.ts';
import { PROFESSIONS } from '../db/seed.ts';
import { HttpError, iso, notFound } from '../lib.ts';

export const RECO_FREQUENCIES = ['none', '1_5', '6_10', '11_20', '21_40', '41_plus'] as const;

export type PractitionerRow = {
  id: number;
  uid: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  profession: (typeof PROFESSIONS)[number] | null;
  reco_frequency: (typeof RECO_FREQUENCIES)[number] | null;
  patient_discount_pct: number;
  signup_completed_at: string | null;
  welcome_dismissed_at: string | null;
  guide_skipped_at: string | null;
  checklist_dismissed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function findPractitioner(db: DB, uid: string): PractitionerRow {
  const row = db
    .prepare(`SELECT * FROM practitioners WHERE uid = ? AND deleted_at IS NULL`)
    .get(uid) as PractitionerRow | undefined;
  if (!row) throw notFound('practitioner');
  return row;
}

export function reloadPractitioner(db: DB, p: PractitionerRow): PractitionerRow {
  return db.prepare(`SELECT * FROM practitioners WHERE id = ?`).get(p.id) as PractitionerRow;
}

export function toPractitionerDto(p: PractitionerRow) {
  return {
    uid: p.uid,
    firstName: p.first_name,
    lastName: p.last_name,
    phone: p.phone,
    profession: p.profession,
    recoFrequency: p.reco_frequency,
    patientDiscountPct: p.patient_discount_pct,
    // Code shown on the recommendation ("CAMILLE10"); derived, not stored.
    discountCode: p.first_name ? `${p.first_name.toUpperCase()}${p.patient_discount_pct}` : null,
    signupCompletedAt: iso(p.signup_completed_at),
    createdAt: iso(p.created_at),
    updatedAt: iso(p.updated_at),
  };
}

const text = (max: number) => z.string().trim().min(1).max(max);

export const practitionerPatchSchema = z.strictObject({
  firstName: text(80).optional(),
  lastName: text(80).optional(),
  phone: text(30).optional(),
  profession: z.enum(PROFESSIONS).optional(),
  recoFrequency: z.enum(RECO_FREQUENCIES).optional(),
  patientDiscountPct: z.number().int().min(0).max(20).optional(),
});

const COLUMNS = {
  firstName: 'first_name',
  lastName: 'last_name',
  phone: 'phone',
  profession: 'profession',
  recoFrequency: 'reco_frequency',
  patientDiscountPct: 'patient_discount_pct',
} as const;

export function updatePractitioner(db: DB, p: PractitionerRow, patch: z.infer<typeof practitionerPatchSchema>) {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined) as [keyof typeof COLUMNS, unknown][];
  if (entries.length === 0) return;
  const set = entries.map(([k]) => `${COLUMNS[k]} = @${k}`).join(', ');
  db.prepare(`UPDATE practitioners SET ${set} WHERE id = @id`).run({ ...Object.fromEntries(entries), id: p.id });
}

/** Item 1. Idempotent: the first completion date is kept. */
export function completeSignup(db: DB, p: PractitionerRow) {
  const missing = (
    [
      ['firstName', p.first_name],
      ['lastName', p.last_name],
      ['phone', p.phone],
      ['profession', p.profession],
      ['recoFrequency', p.reco_frequency],
    ] as const
  )
    .filter(([, v]) => v === null)
    .map(([k]) => k);
  if (missing.length > 0) {
    throw new HttpError(422, 'signup_incomplete', 'Some signup fields are missing', { missing });
  }
  stamp(db, p, 'signup_completed_at');
}

/** Sets a "done" timestamp once; later calls keep the first date. */
export function stamp(
  db: DB,
  p: PractitionerRow,
  column: 'signup_completed_at' | 'welcome_dismissed_at' | 'guide_skipped_at' | 'checklist_dismissed_at',
) {
  db.prepare(`UPDATE practitioners SET ${column} = COALESCE(${column}, datetime('now')) WHERE id = ?`).run(p.id);
}
