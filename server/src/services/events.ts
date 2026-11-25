import type { DB } from '../db/index.ts';
import { iso } from '../lib.ts';
import type { PractitionerRow } from './practitioners.ts';

/**
 * Writes one event. The server decides who it belongs to and when:
 * - account_uid once the signup is completed (or always for server events: the server knows the account);
 * - anonymous_id as sent by the browser, until the signup is completed;
 * - profession added to every event, read from the database;
 * - created_at set by SQLite (`at` only exists so the tests can place events in time).
 */
export function recordEvent(
  db: DB,
  p: PractitionerRow,
  name: string,
  props: Record<string, unknown>,
  opts: { origin: 'web' | 'server'; anonymousId?: string | null; at?: string },
) {
  const accountUid = opts.origin === 'server' || p.signup_completed_at !== null ? p.uid : null;
  const row = db
    .prepare(
      `INSERT INTO events (name, anonymous_id, account_uid, props, created_at)
       VALUES (@name, @anonymousId, @accountUid, @props, COALESCE(@at, strftime('%Y-%m-%d %H:%M:%f','now')))
       RETURNING ${COLUMNS}`,
    )
    .get({
      name,
      anonymousId: opts.anonymousId ?? null,
      accountUid,
      props: JSON.stringify({ ...props, profession: p.profession }),
      at: opts.at ?? null,
    }) as EventRow;
  return toEventDto(row);
}

const COLUMNS = 'id, name, anonymous_id, account_uid, props, created_at';
export type EventRow = {
  id: number;
  name: string;
  anonymous_id: string | null;
  account_uid: string | null;
  props: string;
  created_at: string;
};

/** signup_completed: the anonymous events of this browser now belong to the account. */
export function linkAnonymousEvents(db: DB, p: PractitionerRow, anonymousId: string) {
  db.prepare(`UPDATE events SET account_uid = ? WHERE anonymous_id = ? AND account_uid IS NULL`).run(p.uid, anonymousId);
}

/** Whole days between the end of the signup and now (session_started). */
export function daysSinceSignup(db: DB, p: PractitionerRow): number | null {
  if (p.signup_completed_at === null) return null;
  const { days } = db.prepare(`SELECT CAST(julianday('now') - julianday(?) AS INTEGER) AS days`).get(p.signup_completed_at) as {
    days: number;
  };
  return days;
}

/** The practitioner's events, plus the anonymous ones that were linked to the account at signup. */
export function listEvents(db: DB, p: PractitionerRow, limit: number) {
  const rows = db
    .prepare(`SELECT ${COLUMNS} FROM events WHERE account_uid = ? ORDER BY created_at DESC, id DESC LIMIT ?`)
    .all(p.uid, limit) as EventRow[];
  return rows.map(toEventDto);
}

export const toEventDto = (r: EventRow) => ({
  id: r.id,
  name: r.name,
  anonymousId: r.anonymous_id,
  accountUid: r.account_uid,
  props: JSON.parse(r.props) as Record<string, unknown>,
  createdAt: iso(r.created_at),
});
