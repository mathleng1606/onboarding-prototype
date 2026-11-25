import { z } from 'zod';
import type { DB } from '../db/index.ts';
import { iso } from '../lib.ts';

/** Where a recommendation was started from (reco_started, reco_sent). */
export const RECO_SOURCES = ['guide', 'accueil', 'checklist', 'patients'] as const;

export const eventSchema = z.strictObject({
  name: z.string().regex(/^[a-z][a-z0-9_]*$/, 'snake_case expected').max(64),
  props: z.record(z.string(), z.unknown()).default({}),
});

export function recordEvent(
  db: DB,
  practitionerId: number,
  name: string,
  props: Record<string, unknown>,
  source: 'web' | 'server',
) {
  const row = db
    .prepare(
      `INSERT INTO events (practitioner_id, name, props, source) VALUES (?, ?, ?, ?)
       RETURNING name, props, source, created_at`,
    )
    .get(practitionerId, name, JSON.stringify(props), source) as EventRow;
  return toEventDto(row);
}

type EventRow = { name: string; props: string; source: 'web' | 'server'; created_at: string };

export function listEvents(db: DB, practitionerId: number, limit: number) {
  const rows = db
    .prepare(
      `SELECT name, props, source, created_at FROM events
       WHERE practitioner_id = ? ORDER BY created_at DESC, id DESC LIMIT ?`,
    )
    .all(practitionerId, limit) as EventRow[];
  return rows.map(toEventDto);
}

const toEventDto = (r: EventRow) => ({
  name: r.name,
  props: JSON.parse(r.props) as Record<string, unknown>,
  source: r.source,
  createdAt: iso(r.created_at),
});
