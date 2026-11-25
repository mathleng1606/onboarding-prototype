import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { PatientListItem } from '../api/types';
import { keys, usePatients } from '../hooks/queries';
import { pagePadding } from '../layout/AppShell';
import { useFlow } from '../lib/flow';
import { useTrackView } from '../lib/track';
import { numericDate } from '../lib/format';
import { useWording } from '../lib/wording';
import { Button, TestBadge } from '../ui';
import { ArrowUpDown, EllipsisVertical, Search, Trash2, Upload } from '../ui/icons';
import { useToast } from '../ui/toast';
import { cx, NOT_IN_PROTOTYPE } from '../ui/utils';

type SortKey = 'name' | 'recommendationCount' | 'orderCount' | 'lastActivityAt' | 'createdAt';

/**
 * PATIENTS LIST (screen 10, view 1): copy of the app's « Clients » page.
 * Search and sorting are done in the browser on the list returned by GET /patients
 * (which also gives each patient's number of recommendations and last activity).
 * One header card, then one card per row.
 */
export function PatientsListPage() {
  const w = useWording();
  const toast = useToast();
  const navigate = useNavigate();
  const flow = useFlow();
  const qc = useQueryClient();
  const { data: patients = [], isSuccess } = usePatients();
  useTrackView(isSuccess, 'patient_list_viewed', { n_patients_shown: patients.length });
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean } | null>(null);

  /** Lower case without accents, so « eloise » finds « Éloïse ». */
  const norm = (v: string) => v.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const sortValue = (p: PatientListItem, key: SortKey) => (key === 'name' ? norm(`${p.lastName} ${p.firstName}`) : p[key]);
  const visible = patients
    .filter((p) => !q || norm(`${p.firstName} ${p.lastName} ${p.email} ${p.phone ?? ''}`).includes(norm(q)))
    .sort((a, b) => {
      if (!sort) return 0;
      const [x, y] = [sortValue(a, sort.key), sortValue(b, sort.key)];
      return (x < y ? -1 : x > y ? 1 : 0) * (sort.desc ? -1 : 1);
    });

  async function remove(p: PatientListItem) {
    if (p.isTest) return toast(`Le ${w.n} test ne peut pas être supprimé`);
    if (!window.confirm(`Supprimer ${p.firstName} ${p.lastName} ?`)) return;
    await api.deletePatient(p.uid);
    await qc.invalidateQueries({ queryKey: keys.patients });
  }

  // Header and rows are separate cards: fixed proportions keep their columns aligned
  // (the action column is fixed at 272 px: « Nouvelle recommandation » + trash button).
  const cols =
    'md:grid md:grid-cols-[minmax(0,1.8fr)_minmax(0,1.05fr)_minmax(0,1.6fr)_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.9fr)_272px] md:items-center';
  const head = (label: string, key?: SortKey) => (
    <span className="flex items-center gap-1 px-2 py-3 leading-[18px]">
      {label}
      {key && (
        <button
          type="button"
          aria-label={`Trier par ${label}`}
          onClick={() => setSort((s) => ({ key, desc: s?.key === key ? !s.desc : false }))}
          className={cx('flex p-0 border-0 bg-transparent', sort?.key === key ? 'text-ink' : 'text-ink-muted')}
        >
          <ArrowUpDown size={14} strokeWidth={1.75} />
        </button>
      )}
    </span>
  );

  return (
    <div className={pagePadding}>
      <div className="flex flex-wrap items-start gap-2">
        <div className="flex-1 min-w-[220px]">
          <h1 className="m-0 text-2xl font-medium text-ink">{w.Ns}</h1>
          <p className="m-0 text-sm text-ink-muted">{w.patientsSubtitle}</p>
        </div>
        <Button onClick={() => navigate('/patients/nouveau')}>Ajouter un {w.n}</Button>
        <Button variant="outline" onClick={() => toast(NOT_IN_PROTOTYPE)}>
          <Upload size={16} strokeWidth={1.75} />
          Importer mes {w.ns}
        </Button>
        {/* Transparent background (not the white of the « outline » buttons), as in the app. */}
        <button
          type="button"
          aria-label="Plus d'actions"
          onClick={() => toast(NOT_IN_PROTOTYPE)}
          className="inline-flex items-center justify-center box-border w-9 h-9 border border-brand-900 rounded-sm text-brand-900 bg-transparent"
        >
          <EllipsisVertical size={16} strokeWidth={3} />
        </button>
      </div>

      <label className="mt-6 flex items-center gap-3 box-border h-11 px-4 bg-surface-card border border-border rounded-lg">
        <span className="flex text-ink-muted">
          <Search size={18} strokeWidth={1.75} />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Recherchez un ${w.n}`}
          className="flex-1 min-w-0 text-base text-ink placeholder:text-ink-muted outline-none border-0 bg-transparent"
        />
      </label>
      <div className="mt-4 text-sm text-ink-muted">
        {visible.length} résultat{visible.length > 1 ? 's' : ''}
      </div>

      <section className={cx('hidden mt-3 bg-surface-card border border-border rounded-lg text-13 font-medium text-ink', cols)}>
        {head(w.N, 'name')}
        {head('Téléphone')}
        {head(w.Mots, 'recommendationCount')}
        {head('Commandes', 'orderCount')}
        {head('Dernière activité', 'lastActivityAt')}
        {head('Créé le', 'createdAt')}
        {head('Action')}
      </section>
      {visible.map((p) => (
        <section
          key={p.uid}
          onClick={() => navigate(`/patients/${p.uid}`)}
          className={cx('mt-3 p-3 md:p-0 md:py-3 bg-surface-card border border-border rounded-lg text-sm text-ink cursor-pointer hover:border-brand-link', cols)}
        >
          <span className="block md:px-2 min-w-0">
            <span className="flex flex-wrap items-center gap-2 font-medium">
              {p.firstName} {p.lastName}
              {p.isTest && <TestBadge />}
            </span>
            <span className="block text-ink-muted truncate">{p.email}</span>
          </span>
          <span className="block md:px-2 mt-1 md:mt-0 text-ink-muted md:text-ink">{p.phone ?? '-'}</span>
          {/* Mobile (canvas): the three numbers with their labels. */}
          <span className="md:hidden grid grid-cols-3 gap-2 mt-3">
            {(
              [
                [w.Mots, String(p.recommendationCount)],
                ['Commandes', String(p.orderCount)],
                ['Dernière activité', numericDate(p.lastActivityAt)],
              ] as const
            ).map(([label, value]) => (
              <span key={label} className="block min-w-0">
                <span className="block text-13 text-ink-muted truncate">{label}</span>
                <span className="block text-ink">{value}</span>
              </span>
            ))}
          </span>
          <span className="hidden md:block px-2">{p.recommendationCount}</span>
          <span className="hidden md:block px-2">{p.orderCount}</span>
          <span className="hidden md:block px-2">{numericDate(p.lastActivityAt)}</span>
          <span className="hidden md:block px-2">{numericDate(p.createdAt)}</span>
          {/* The buttons must not open the patient page (click on the row). */}
          <span className="flex items-center gap-2 md:px-2 mt-3 md:mt-0" onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" className="max-md:flex-1" onClick={() => flow.startReco('patients', p.uid)}>
              {w.newRecoTitle}
            </Button>
            <Button variant="danger" padding="none" className="w-9" aria-label={`Supprimer ${p.firstName} ${p.lastName}`} onClick={() => remove(p)}>
              <Trash2 size={16} strokeWidth={1.75} />
            </Button>
          </span>
        </section>
      ))}
    </div>
  );
}
