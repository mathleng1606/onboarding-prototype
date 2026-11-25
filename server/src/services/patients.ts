import { z } from 'zod';
import type { DB } from '../db/index.ts';
import { bool, HttpError, iso, newUid, notFound } from '../lib.ts';
import type { PractitionerRow } from './practitioners.ts';

export type PatientRow = {
  id: number;
  uid: string;
  practitioner_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  birth_date: string | null;
  sex: 'male' | 'female' | null;
  is_minor: number;
  notes: string | null;
  is_test: number;
  origin: 'manual' | 'import';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toPatientDto(r: PatientRow) {
  return {
    uid: r.uid,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phone: r.phone,
    birthDate: r.birth_date,
    sex: r.sex,
    isMinor: bool(r.is_minor),
    notes: r.notes,
    isTest: bool(r.is_test),
    origin: r.origin,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

const optionalText = (max: number) => z.string().trim().max(max).optional();

/** isTest and origin are not accepted: a created patient is always a real, manual one. */
export const patientCreateSchema = z.strictObject({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email().max(200),
  phone: optionalText(30),
  birthDate: z.iso.date().optional(),
  sex: z.enum(['male', 'female']).optional(),
  isMinor: z.boolean().default(false),
  notes: optionalText(2000),
});

/**
 * List of the « Clients » page: each patient with its number of recommendations (not deleted)
 * and its last activity (patient creation or last change of one of its recommendations).
 */
export function listPatients(db: DB, p: PractitionerRow) {
  const rows = db
    .prepare(
      `SELECT pt.*,
              (SELECT COUNT(*) FROM recommendations r WHERE r.patient_id = pt.id AND r.deleted_at IS NULL) AS reco_count,
              MAX(pt.created_at, COALESCE((SELECT MAX(r.updated_at) FROM recommendations r
                                          WHERE r.patient_id = pt.id AND r.deleted_at IS NULL), pt.created_at)) AS last_activity_at
       FROM patients pt
       WHERE pt.practitioner_id = ? AND pt.deleted_at IS NULL
       ORDER BY pt.is_test DESC, pt.created_at DESC, pt.id DESC`,
    )
    .all(p.id) as (PatientRow & { reco_count: number; last_activity_at: string })[];
  return rows.map((r) => ({
    ...toPatientDto(r),
    recommendationCount: r.reco_count,
    orderCount: 0, // orders are out of the prototype
    lastActivityAt: iso(r.last_activity_at),
  }));
}

export function findPatient(db: DB, p: PractitionerRow, uid: string): PatientRow {
  const row = db
    .prepare(`SELECT * FROM patients WHERE uid = ? AND practitioner_id = ? AND deleted_at IS NULL`)
    .get(uid, p.id) as PatientRow | undefined;
  if (!row) throw notFound('patient');
  return row;
}

export function createPatient(db: DB, p: PractitionerRow, input: z.infer<typeof patientCreateSchema>) {
  return db
    .prepare(
      `INSERT INTO patients (uid, practitioner_id, first_name, last_name, email, phone, birth_date, sex, is_minor, notes, is_test, origin)
       VALUES (@uid, @pid, @firstName, @lastName, @email, @phone, @birthDate, @sex, @isMinor, @notes, 0, 'manual')
       RETURNING *`,
    )
    .get({
      uid: newUid(),
      pid: p.id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone || null,
      birthDate: input.birthDate ?? null,
      sex: input.sex ?? null,
      isMinor: input.isMinor ? 1 : 0,
      notes: input.notes || null,
    }) as PatientRow;
}

/** Soft delete of the patient and of its recommendations. The test patient cannot be deleted. */
export function deletePatient(db: DB, p: PractitionerRow, uid: string) {
  const patient = findPatient(db, p, uid);
  if (patient.is_test === 1) {
    throw new HttpError(409, 'test_patient_not_deletable', 'The test patient cannot be deleted');
  }
  db.transaction(() => {
    db.prepare(`UPDATE recommendations SET deleted_at = datetime('now') WHERE patient_id = ? AND deleted_at IS NULL`).run(
      patient.id,
    );
    db.prepare(`UPDATE patients SET deleted_at = datetime('now') WHERE id = ?`).run(patient.id);
  })();
}
