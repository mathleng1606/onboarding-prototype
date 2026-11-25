import { type ReactNode, useState } from 'react';
import { type Profession, PROFESSIONS, RECO_FREQUENCIES, type RecoFrequency } from '../api/types';
import { PROFESSION_LABELS, useWording } from '../lib/wording';
import { PhonePrefix } from '../ui/PhonePrefix';
import { ChevronDown } from '../ui/icons';
import { cx } from '../ui/utils';
import { type Step, STEPS } from './steps';

/* Steps of the signup form and their fields, copied from the reference. */

/** Signup progress: « Compte » (always done), Infos, Profession, Pratique. Not clickable. */
export function Stepper({ step }: { step: Step }) {
  const labels = ['Compte', 'Infos', 'Profession', 'Pratique'];
  const current = STEPS.indexOf(step) + 1; // "Compte" (0) is always done
  return (
    <div className="flex items-start justify-center h-[46px]" aria-label={`Étape ${current} sur 3`}>
      {labels.map((label, i) => (
        <span key={label} className="contents">
          {i > 0 && (
            <span className={cx('flex-none w-[52px] h-0.5 mt-[7px] rounded-sm', i <= current ? 'bg-brand-link' : 'bg-border')} />
          )}
          <div className="flex-none relative w-[15px] h-[15px]">
            <span
              className={cx(
                'block w-[15px] h-[15px] box-border rounded-full border',
                i < current
                  ? 'bg-brand-link border-brand-link'
                  : i === current
                    ? 'bg-surface-tint border-border'
                    : 'bg-surface-card border-border',
              )}
            />
            <span
              className={cx(
                'absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs leading-[18px]',
                i === current ? 'text-brand-600' : 'text-ink-muted',
              )}
            >
              {label}
            </span>
          </div>
        </span>
      ))}
    </div>
  );
}

function StepTitle({ title, sub }: { title: ReactNode; sub: ReactNode }) {
  return (
    <div className="text-center mt-6">
      <div className="text-base font-semibold text-ink">{title}</div>
      <div className="mt-2 text-xs leading-[18px] text-ink-muted">{sub}</div>
    </div>
  );
}

const fieldLabel = 'text-13 leading-5 font-semibold text-ink';
const fieldBox =
  'mt-2 w-full h-[35px] box-border px-3 flex items-center bg-surface-card border border-border rounded-sm text-sm text-ink outline-none focus:border-brand-900';

function Required() {
  return <span className="text-danger ml-1.5">*</span>;
}

export function InfosStep(props: {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
}) {
  const w = useWording();
  return (
    <>
      <StepTitle title="Faisons plus ample connaissance" sub={<>Ces informations permettent à vos {w.ns} de vous identifier sur leurs {w.mots}.</>} />
      <div className="mt-4" />
      <label className="block mt-4">
        <div className={fieldLabel}>
          Prénom
          <Required />
        </div>
        <input className={fieldBox} value={props.firstName} onChange={(e) => props.setFirstName(e.target.value)} autoComplete="given-name" />
      </label>
      <label className="block mt-4">
        <div className={fieldLabel}>
          Nom
          <Required />
        </div>
        <input className={fieldBox} value={props.lastName} onChange={(e) => props.setLastName(e.target.value)} autoComplete="family-name" />
      </label>
      <label className="block mt-4">
        <div className={fieldLabel}>
          Téléphone
          <Required />
        </div>
        <div className="mt-2 h-[35px] box-border flex items-stretch bg-surface-card border border-border rounded-sm overflow-hidden focus-within:border-brand-900">
          <PhonePrefix />
          <input
            className="flex-1 min-w-0 pl-3 text-sm text-ink outline-none border-0 bg-transparent"
            value={props.phone}
            onChange={(e) => props.setPhone(e.target.value)}
            autoComplete="tel"
          />
        </div>
      </label>
      <div className="mt-3 text-xs leading-[18px] text-ink-muted">
        En continuant, vous acceptez la <span className="text-ink underline">politique de cookies</span>, la{' '}
        <span className="text-ink underline">politique de vie privée</span>, la{' '}
        <span className="text-ink underline">convention de traitement de données</span> et les{' '}
        <span className="text-ink underline">conditions générales d'utilisation</span> de Simplycure.
      </div>
    </>
  );
}

export function ProfessionStep({ value, onChange }: { value: Profession | null; onChange: (p: Profession) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <StepTitle title="Quelle est votre spécialité ?" sub="Cette information nous permet d'adapter l’expérience à votre spécialité." />
      <div className="mt-6 text-xs leading-[18px] text-ink-muted">Les plus fréquentes</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {PROFESSIONS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={cx(
              'inline-flex items-center h-[30px] box-border px-3 rounded-full text-sm text-ink border',
              value === p ? 'bg-surface-tint border-brand-900' : 'bg-surface-card border-border',
            )}
          >
            {PROFESSION_LABELS[p]}
          </button>
        ))}
      </div>
      <div className="relative mt-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cx(
            'w-full h-9 box-border px-3 flex items-center bg-surface-card border border-border rounded-sm text-sm text-left',
            value ? 'text-ink' : 'text-ink-muted',
          )}
        >
          <span className="flex-1">{value ? PROFESSION_LABELS[value] : 'Sélectionnez votre profession'}</span>
          <span className="text-ink-muted flex">
            <ChevronDown size={10} strokeWidth={3} />
          </span>
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 bg-surface-card border border-border rounded-sm py-1 shadow-[0_1px_2px_#07003514,0_2px_6px_#0700350d]">
            {PROFESSIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                }}
                className={cx(
                  'block w-full text-left py-2 px-3 text-sm text-ink border-0',
                  value === p ? 'bg-surface-tint font-medium' : 'bg-transparent',
                )}
              >
                {PROFESSION_LABELS[p]}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function PracticeStep({ value, onChange }: { value: RecoFrequency | null; onChange: (f: RecoFrequency) => void }) {
  const w = useWording();
  return (
    <>
      <StepTitle title={w.signupFrequencyQuestion} sub="Nous adapterons l’interface à votre pratique." />
      <div className="mt-4 flex flex-col items-center gap-2">
        {RECO_FREQUENCIES.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onChange(f)}
            className={cx(
              'inline-flex items-center h-[33px] box-border px-3 rounded-sm text-sm border',
              value === f ? 'bg-surface-tint border-brand-link text-brand-600' : 'bg-surface-card border-border text-ink',
            )}
          >
            {w.signupFrequencies[f]}
          </button>
        ))}
      </div>
    </>
  );
}
