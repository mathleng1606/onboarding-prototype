import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Practitioner, Profession, RecoFrequency } from '../api/types';
import { keys, usePractitioner, useRefresh } from '../hooks/queries';
import { ensureAnonymousId, forgetAnonymousId, track, trackOnce } from '../lib/track';
import { WordingContext, wordingFor } from '../lib/wording';
import { Button } from '../ui';
import { ChevronDown, ChevronLeft } from '../ui/icons';
import { cx } from '../ui/utils';
import { SignupPreview } from './SignupPreview';
import { InfosStep, PracticeStep, ProfessionStep, Stepper } from './SignupSteps';
import { type Step, STEPS } from './steps';

/**
 * SIGNUP (screen 0): 3 steps (infos, profession, practice), one URL each (/inscription/infos…).
 * Each « Continuer » saves the step on the server, so a reload keeps what was typed.
 * On the right, a preview card of « your future recommendations » that follows what is typed.
 */
export function SignupPage() {
  const { step = 'infos' } = useParams();
  const { data: p } = usePractitioner();
  if (!p) return null;
  if (p.signupCompletedAt) return <Navigate to="/" replace />;
  if (!STEPS.includes(step as Step)) return <Navigate to="/inscription/infos" replace />;
  return <Signup step={step as Step} practitioner={p} />;
}

function Signup({ step, practitioner }: { step: Step; practitioner: Practitioner }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const refresh = useRefresh();
  const [firstName, setFirstName] = useState(practitioner.firstName ?? '');
  const [lastName, setLastName] = useState(practitioner.lastName ?? '');
  const [phone, setPhone] = useState(practitioner.phone ?? '+32 ');
  const [profession, setProfession] = useState<Profession | null>(practitioner.profession);
  const [frequency, setFrequency] = useState<RecoFrequency | null>(practitioner.recoFrequency);
  const [busy, setBusy] = useState(false);

  // No account yet: the events of the signup carry this browser's anonymous id.
  useEffect(() => {
    ensureAnonymousId();
  }, []);
  /** signup_started: at the first field filled, once for this anonymous id. */
  const edit =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      trackOnce(`signup_started:${ensureAnonymousId()}`, localStorage, 'signup_started', {});
      set(v);
    };

  const infosOk = !!(firstName.trim() && lastName.trim() && phone.replace(/\s/g, '').length > 3);
  const ok = step === 'infos' ? infosOk : step === 'profession' ? !!profession : !!frequency;

  /** « Continuer »: saves the step (PATCH), then goes to the next one; the last step completes the signup. */
  async function next() {
    if (!ok || busy) return;
    setBusy(true);
    try {
      if (step === 'infos') {
        await api.updatePractitioner({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() });
        track('signup_step_completed', { step: 1 });
        navigate('/inscription/profession');
      } else if (step === 'profession') {
        await api.updatePractitioner({ profession: profession! });
        track('signup_step_completed', { step: 2 });
        navigate('/inscription/pratique');
      } else {
        await api.updatePractitioner({ recoFrequency: frequency! });
        track('signup_step_completed', { step: 3, volume_declared: frequency! });
        // signup_completed is written by the server, which links this anonymous id to the account.
        await api.completeSignup(ensureAnonymousId());
        forgetAnonymousId();
        await refresh.onboarding();
        await qc.invalidateQueries({ queryKey: keys.practitioner });
        navigate('/', { replace: true });
        return;
      }
      await qc.invalidateQueries({ queryKey: keys.practitioner });
    } finally {
      setBusy(false);
    }
  }

  const back = step === 'profession' ? '/inscription/infos' : step === 'pratique' ? '/inscription/profession' : null;

  // The vocabulary follows the profession being chosen, so the preview card updates live.
  return (
    <WordingContext.Provider value={wordingFor(profession)}>
      <div className="min-h-full bg-surface-page">
        <div className="flex items-start justify-between pt-[31px] px-[21px] pr-[23px]">
          <img src="/img/logo.png" alt="Simplycure" className="w-[107px] h-auto mt-[7px]" />
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs leading-[18px] text-ink">
              Déjà un compte ? <span className="text-brand-link font-medium">Connectez-vous</span>
            </span>
            <span className="w-[141px] h-9 box-border px-3 flex items-center bg-surface-card border border-border rounded-md text-sm text-ink">
              <span className="flex-1">Français</span>
              <ChevronDown size={12} strokeWidth={2.5} />
            </span>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto flex justify-center lg:justify-start gap-[92px] px-4 lg:pl-[154px] lg:pr-0 pt-[11px] pb-12">
          <form
            className="w-full max-w-[355px]"
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
          >
            {back && (
              <button
                type="button"
                onClick={() => navigate(back)}
                className="flex items-center gap-2 h-5 pl-6 text-13 font-medium text-brand-900 bg-transparent border-0"
              >
                <ChevronLeft size={13} strokeWidth={2} />
                Retour
              </button>
            )}
            <Stepper step={step} />
            {step === 'infos' && (
              <InfosStep setFirstName={edit(setFirstName)} setLastName={edit(setLastName)} setPhone={edit(setPhone)} {...{ firstName, lastName, phone }} />
            )}
            {step === 'profession' && <ProfessionStep value={profession} onChange={edit(setProfession)} />}
            {step === 'pratique' && <PracticeStep value={frequency} onChange={edit(setFrequency)} />}

            <div className={step === 'infos' ? 'mt-3' : step === 'pratique' ? 'mt-4' : 'mt-3'}>
              {/* 35 px high as in the reference signup (the « ! » forces it over the standard heights). */}
              <Button type="submit" disabled={!ok || busy} className="w-full h-[35px]!">
                Continuer
              </Button>
            </div>
            <div className={cx(step === 'infos' ? 'mt-12' : 'mt-6', 'px-3 text-center text-xs leading-[18px] text-ink-muted')}>
              Les données traitées par Simplycure restent sur une infrastructure certifiée HDS (Hébergeur de Données de
              Santé) et hébergée en Europe.
            </div>
          </form>

          <SignupPreview
            name={`${(firstName || 'Camille').trim()} ${(lastName || 'Roche').trim()}`}
            profession={step === 'infos' ? null : profession}
            showProducts={step === 'pratique'}
          />
        </div>
      </div>
    </WordingContext.Provider>
  );
}
