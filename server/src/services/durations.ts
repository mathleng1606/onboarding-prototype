import type { DB } from '../db/index.ts';
import { iso } from '../lib.ts';
import type { EventRow } from './events.ts';

/**
 * DURATIONS, computed when read from the events (never stored), on the server timestamps:
 * - signup   = signup_completed − signup_started (same anonymous_id: the account does not exist yet at the start);
 * - tutorial = first reco_sent to the test patient − first guide_step_viewed step 1 (same account);
 * - reco     = reco_sent − the reco_started just before it (same account, each reco_started used once).
 * Pauses are not removed: the raw time is shown, the analysis decides what to do with long ones.
 */
export type Sample = { who: string; startedAt: string; endedAt: string; seconds: number };
export type Measure = { samples: Sample[]; medianSeconds: number | null };
export type Durations = { signup: Measure; tutorial: Measure; reco: Measure };

type Ev = { name: string; anonymousId: string | null; accountUid: string | null; props: Record<string, unknown>; at: number };

export function computeDurations(rows: EventRow[]): Durations {
  const events: Ev[] = rows
    .map((r) => ({
      name: r.name,
      anonymousId: r.anonymous_id,
      accountUid: r.account_uid,
      props: JSON.parse(r.props) as Record<string, unknown>,
      at: Date.parse(iso(r.created_at)),
    }))
    .sort((a, b) => a.at - b.at);

  return { signup: measure(signup(events)), tutorial: measure(tutorial(events)), reco: measure(reco(events)) };
}

function signup(events: Ev[]): Sample[] {
  return events
    .filter((e) => e.name === 'signup_completed' && e.anonymousId)
    .flatMap((end) => {
      const start = events.find((e) => e.name === 'signup_started' && e.anonymousId === end.anonymousId && e.at <= end.at);
      return start ? [sample(end.anonymousId!, start, end)] : [];
    });
}

function tutorial(events: Ev[]): Sample[] {
  return byAccount(events).flatMap(([account, evs]) => {
    const start = evs.find((e) => e.name === 'guide_step_viewed' && e.props.step === 1);
    const end = start && evs.find((e) => e.name === 'reco_sent' && e.props.is_test_patient === true && e.at >= start.at);
    return start && end ? [sample(account, start, end)] : [];
  });
}

function reco(events: Ev[]): Sample[] {
  return byAccount(events).flatMap(([account, evs]) => {
    const samples: Sample[] = [];
    let start: Ev | null = null; // the last reco_started not yet matched with a reco_sent
    for (const e of evs) {
      if (e.name === 'reco_started') start = e;
      else if (e.name === 'reco_sent' && start) {
        samples.push(sample(account, start, e));
        start = null;
      }
    }
    return samples;
  });
}

function byAccount(events: Ev[]): [string, Ev[]][] {
  const groups = new Map<string, Ev[]>();
  for (const e of events) {
    if (!e.accountUid) continue;
    groups.set(e.accountUid, [...(groups.get(e.accountUid) ?? []), e]);
  }
  return [...groups];
}

const sample = (who: string, start: Ev, end: Ev): Sample => ({
  who,
  startedAt: new Date(start.at).toISOString(),
  endedAt: new Date(end.at).toISOString(),
  seconds: (end.at - start.at) / 1000,
});

function measure(samples: Sample[]): Measure {
  const sorted = samples.map((s) => s.seconds).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianSeconds =
    sorted.length === 0 ? null : sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return { samples, medianSeconds };
}

/** All the events, every account and anonymous visitor (the /debug page). */
export function allEventRows(db: DB, limit?: number): EventRow[] {
  return db
    .prepare(
      `SELECT id, name, anonymous_id, account_uid, props, created_at FROM events
       ORDER BY created_at DESC, id DESC ${limit ? 'LIMIT ?' : ''}`,
    )
    .all(...(limit ? [limit] : [])) as EventRow[];
}
