import { useState } from 'react';
import type { Patient } from '../api/types';
import { usePatients } from '../hooks/queries';
import { initials } from '../lib/format';
import { useWording } from '../lib/wording';
import { Avatar, CloseButton, GuideBand, SidePanel, TestBadge } from '../ui';
import { buttonClass } from '../ui/buttons';
import { ChevronRight, Search, UserRoundPlus } from '../ui/icons';
import { cx } from '../ui/utils';
import { CreatePatientForm } from './CreatePatientForm';

type Tab = 'search' | 'create';

/**
 * The real « Sélectionner un patient » side panel.
 * Guide mode: help band, only the test patient, no tabs and no « Créer un patient ».
 * Normal mode: « Rechercher » and « Créer » tabs; a patient created here is chosen right away (screen 12),
 * which takes the practitioner straight to the catalogue with this patient.
 */
export function PatientPanel({
  guide,
  initialTab = 'search',
  onClose,
  onChoose,
  onSkipGuide,
}: {
  guide: boolean;
  initialTab?: Tab;
  onClose: () => void;
  onChoose: (patient: Patient) => void;
  onSkipGuide: () => void;
}) {
  const w = useWording();
  const [tab, setTab] = useState<Tab>(guide ? 'search' : initialTab);

  return (
    <SidePanel label={`Sélectionner un ${w.n}`} onClose={onClose}>
      <div className={cx('sticky top-0 z-10 bg-surface-card pt-8 px-6 max-sm:px-8', tab === 'search' && 'pb-0')}>
        <div className="flex items-center">
          <h2 className="m-0 flex-1 text-xl font-semibold text-ink">Sélectionner un {w.n}</h2>
          <CloseButton onClick={onClose} />
        </div>
        {guide ? (
          <div className="mt-4">
            <GuideBand step={1} title={w.guideStep1Title} onSkip={onSkipGuide} />
          </div>
        ) : (
          <div className="flex gap-6 mt-4 border-b border-border">
            {(
              [
                ['search', `Rechercher un ${w.n}`],
                ['create', `Créer un ${w.n}`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cx(
                  'py-3 px-0 -mb-px text-sm font-medium bg-transparent border-0',
                  tab === key ? 'border-b-[3px] border-solid border-brand-900 text-ink' : 'text-ink-muted',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="px-6 max-sm:px-8 pb-8">
        {tab === 'search' ? (
          <PatientSearch guide={guide} onChoose={onChoose} onCreate={() => setTab('create')} />
        ) : (
          <CreatePatientForm onCreated={onChoose} />
        )}
      </div>
    </SidePanel>
  );
}

function PatientSearch({
  guide,
  onChoose,
  onCreate,
}: {
  guide: boolean;
  onChoose: (p: Patient) => void;
  onCreate: () => void;
}) {
  const w = useWording();
  const { data: patients = [] } = usePatients();
  const [q, setQ] = useState('');
  const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const visible = patients
    .filter((p) => !guide || p.isTest) // during the guide, only the test patient is offered
    .filter((p) => !q || norm(`${p.firstName} ${p.lastName} ${p.email} ${p.phone ?? ''}`).includes(norm(q)));

  return (
    <>
      <label className={cx('flex items-center gap-3 box-border h-11 px-4 border border-border rounded-lg', guide ? 'mt-4' : 'mt-6')}>
        <span className="flex text-ink-muted">
          <Search size={18} strokeWidth={1.75} />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher"
          className="flex-1 min-w-0 text-base text-ink placeholder:text-ink-muted outline-none border-0 bg-transparent"
        />
      </label>
      <section className="mt-2 p-2 flex flex-col gap-2 bg-surface-card border border-border rounded-lg">
        {!guide && (
          <button type="button" onClick={onCreate} className="flex items-center gap-3 p-3 bg-surface-subtle rounded-md border-0 text-left">
            <span className="w-9 h-9 rounded-full bg-surface-card text-brand-900 flex items-center justify-center">
              <UserRoundPlus size={16} strokeWidth={1.75} />
            </span>
            <span className="flex-1 text-base font-medium text-ink">Créer un {w.n}</span>
            <span className="flex text-ink-muted">
              <ChevronRight size={16} strokeWidth={2} />
            </span>
          </button>
        )}
        {visible.map((p) => (
          <div
            key={p.uid}
            role="button"
            tabIndex={0}
            onClick={() => onChoose(p)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChoose(p)}
            className={cx(
              'flex items-center gap-3 p-3 rounded-md border cursor-pointer max-sm:flex-wrap',
              guide ? 'border-brand-link bg-surface-tint' : 'border-transparent bg-transparent hover:bg-surface-subtle',
            )}
          >
            <Avatar text={initials(p.firstName, p.lastName)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm leading-[22px] font-medium text-ink">
                {p.firstName} {p.lastName}
                {p.isTest && <TestBadge />}
              </div>
              <div className="text-sm text-ink truncate">{p.email}</div>
              {p.phone && <div className="text-13 leading-4 text-ink-muted">{p.phone}</div>}
            </div>
            {guide && (
              // Mobile (canvas): full-width button under the patient.
              <span className={cx(buttonClass('primary', 'sm'), 'flex-none max-sm:basis-full max-sm:h-10 max-sm:text-base')}>
                Choisir ce {w.n}
              </span>
            )}
          </div>
        ))}
        {visible.length === 0 && <div className="p-3 text-sm text-ink-muted">Aucun {w.n} trouvé.</div>}
      </section>
    </>
  );
}
