import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { AppEvent, DurationMeasure } from '../api/types';
import { Button } from '../ui';
import { cx } from '../ui/utils';

/**
 * /debug: what the tracking records, for the team (not in the menu).
 * Durations are computed by the server from the events, with their server timestamps.
 * Refreshed every 2 s, so it can stay open in a second tab while using the app.
 */
export function DebugPage() {
  const qc = useQueryClient();
  const events = useQuery({ queryKey: ['dev', 'events'], queryFn: () => api.devEvents(), refetchInterval: 2000 });
  const durations = useQuery({ queryKey: ['dev', 'durations'], queryFn: api.devDurations, refetchInterval: 2000 });
  const [confirming, setConfirming] = useState(false);

  async function clear() {
    if (!confirming) return setConfirming(true);
    await api.clearEvents();
    setConfirming(false);
    await qc.invalidateQueries({ queryKey: ['dev'] });
  }

  return (
    <div className="min-h-full bg-surface-page p-6 text-ink">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
        <header className="flex flex-wrap items-center gap-3">
          <h1 className="m-0 flex-1 text-2xl font-semibold">Debug · events et durées</h1>
          <Link to="/" className="text-sm text-brand-link">
            Retour à l'app
          </Link>
          <Button variant="danger" onClick={clear} onBlur={() => setConfirming(false)}>
            {confirming ? 'Confirmer : vider tous les events' : 'Vider les events'}
          </Button>
        </header>

        <section aria-label="Durées" className="grid gap-4 md:grid-cols-3">
          <DurationCard title="Inscription" rule="signup_completed − signup_started" m={durations.data?.signup} />
          <DurationCard title="Tutoriel" rule="reco_sent (test) − guide_step_viewed (étape 1)" m={durations.data?.tutorial} />
          <DurationCard title="Une recommandation" rule="reco_sent − reco_started" m={durations.data?.reco} />
        </section>
        <p className="m-0 text-xs text-ink-muted">
          Temps bruts, pauses comprises : rien n'est retiré, l'analyse décide quoi faire des longues pauses.
        </p>

        <section aria-label="Events" className="bg-surface-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-sm font-medium">
            {events.data?.length ?? 0} events, du plus récent au plus ancien
          </div>
          {events.error && <div className="p-4 text-sm text-danger">API injoignable : lancez npm run dev à la racine.</div>}
          <table className="w-full text-xs border-collapse">
            <thead className="text-left text-ink-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Heure (serveur)</th>
                <th className="px-4 py-2 font-medium">Event</th>
                <th className="px-4 py-2 font-medium">Qui</th>
                <th className="px-4 py-2 font-medium">Props</th>
              </tr>
            </thead>
            <tbody>
              {events.data?.map((e) => <EventRow key={e.id} e={e} />)}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function EventRow({ e }: { e: AppEvent }) {
  return (
    <tr className="border-t border-border align-top">
      <td className="px-4 py-2 whitespace-nowrap tabular-nums">{time(e.createdAt)}</td>
      <td className="px-4 py-2 font-medium whitespace-nowrap">{e.name}</td>
      <td className="px-4 py-2 whitespace-nowrap text-ink-muted">
        {e.accountUid ? `compte ${short(e.accountUid)}` : `anonyme ${short(e.anonymousId)}`}
      </td>
      <td className="px-4 py-2 font-mono break-all">{JSON.stringify(e.props)}</td>
    </tr>
  );
}

function DurationCard({ title, rule, m }: { title: string; rule: string; m?: DurationMeasure }) {
  return (
    <div className="bg-surface-card border border-border rounded-lg p-4">
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-ink-muted font-mono mt-1">{rule}</div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">{m?.medianSeconds == null ? '—' : duration(m.medianSeconds)}</span>
        <span className="text-xs text-ink-muted">
          médiane · {m?.samples.length ?? 0} mesure{(m?.samples.length ?? 0) > 1 ? 's' : ''}
        </span>
      </div>
      {m && m.samples.length > 0 && (
        <ul className="m-0 mt-3 p-0 list-none flex flex-col gap-1 text-xs text-ink-muted">
          {m.samples.map((s) => (
            <li key={`${s.who}-${s.startedAt}`} className={cx('flex gap-2 tabular-nums')}>
              <span className="flex-1">
                {time(s.startedAt)} → {time(s.endedAt)}
              </span>
              <span className="text-ink">{duration(s.seconds)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const time = (isoDate: string) =>
  new Date(isoDate).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const short = (uid: string | null) => (uid ? uid.slice(0, 8) : '?');

/** 83.4 → « 1 min 23 s »; 4000 → « 1 h 06 min ». */
function duration(seconds: number): string {
  const s = Math.round(seconds);
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
  return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')} min`;
}
