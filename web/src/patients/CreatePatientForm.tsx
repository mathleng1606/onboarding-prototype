import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Patient } from '../api/types';
import { keys, useRefresh } from '../hooks/queries';
import { useWording } from '../lib/wording';
import { PhonePrefix } from '../ui/PhonePrefix';
import { Button } from '../ui';
import { CalendarDays, Info, Minus, Plus } from '../ui/icons';
import { cx } from '../ui/utils';

/* « Créer un patient » form: used in the side panel (screen 7) and on the create page (screen 10). */

const label = 'text-sm font-semibold text-ink';
const optional = <span className="ml-2 text-xs font-normal text-ink-muted">(Optionnel)</span>;
const input =
  'mt-2 w-full h-[35px] box-border px-3 bg-surface-card border border-border rounded-sm text-sm text-ink placeholder:text-ink-muted outline-none focus:border-2 focus:border-brand-900';

function Field({ children, error, className }: { children: ReactNode; error?: string; className?: string }) {
  return (
    <label className={cx('block', className)}>
      {children}
      {error && <div className="mt-1 text-xs text-danger">{error}</div>}
    </label>
  );
}

/**
 * « Créer un patient » tab (screen 7), also used by the « Créez un nouveau client » page (screen 10),
 * which keeps the app's « client » wording. The created patient is always a real one.
 */
export function CreatePatientForm({ onCreated }: { onCreated: (p: Patient) => void }) {
  const w = useWording();
  const qc = useQueryClient();
  const refresh = useRefresh();
  const [f, setF] = useState({ firstName: '', lastName: '', email: '', phone: '', birthDate: '', sex: '', notes: '', isMinor: false });
  const [showMore, setShowMore] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  // As in the reference: « Enregistrer » stays grey until the required fields are filled.
  const ready = !!(f.firstName.trim() && f.lastName.trim() && f.email.trim());
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!f.firstName.trim()) errs.firstName = 'Champ obligatoire';
    if (!f.lastName.trim()) errs.lastName = 'Champ obligatoire';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) errs.email = 'Adresse e-mail invalide';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const phone = f.phone.replace(/\s/g, '');
      const patient = await api.createPatient({
        firstName: f.firstName.trim(),
        lastName: f.lastName.trim(),
        email: f.email.trim(),
        phone: phone ? `+32 ${f.phone.trim()}` : undefined,
        birthDate: f.birthDate || undefined,
        sex: f.sex || undefined,
        notes: f.notes.trim() || undefined,
        isMinor: f.isMinor,
      });
      await qc.invalidateQueries({ queryKey: keys.patients });
      refresh.onboarding();
      onCreated(patient);
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : 'Erreur inattendue' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save}>
      <label className="flex items-center gap-3 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={f.isMinor}
          onChange={(e) => setF({ ...f, isMinor: e.target.checked })}
          className="w-3.5 h-3.5 accent-brand-900"
        />
        Ce {w.n} a moins de 18 ans
      </label>
      <div className="mt-6 flex gap-4 max-sm:flex-col">
        <Field className="flex-1" error={errors.firstName}>
          <div className={label}>
            Prénom<span className="text-danger ml-1.5">*</span>
          </div>
          <input className={input} placeholder="Prénom" value={f.firstName} onChange={set('firstName')} autoFocus />
        </Field>
        <Field className="flex-1" error={errors.lastName}>
          <div className={label}>
            Nom<span className="text-danger ml-1.5">*</span>
          </div>
          <input className={input} placeholder="Nom" value={f.lastName} onChange={set('lastName')} />
        </Field>
      </div>
      <Field className="mt-4" error={errors.email}>
        <div className={label}>
          Email<span className="text-danger ml-1.5">*</span>
        </div>
        <input className={input} type="email" placeholder="prenom.nom@email.com" value={f.email} onChange={set('email')} />
      </Field>
      <Field className="mt-4">
        <div className={label}>
          Téléphone
          <span className="inline-flex align-[-3px] ml-1.5 text-ink-muted">
            <Info size={14} strokeWidth={1.75} />
          </span>
          {optional}
        </div>
        <div className="mt-2 h-[35px] box-border flex items-stretch bg-surface-card border border-border rounded-sm overflow-hidden focus-within:border-brand-900">
          <PhonePrefix />
          <span className="flex items-center pl-3 text-sm text-ink">+32</span>
          <input className="flex-1 min-w-0 pl-2 text-sm text-ink outline-none border-0 bg-transparent" value={f.phone} onChange={set('phone')} />
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
          <span className="flex-none whitespace-nowrap py-0.5 px-2 rounded-full bg-surface-tint text-ink font-semibold">+2× conversion</span>
          <span>{w.smsConversionHint}</span>
        </div>
      </Field>

      <div className="mt-6 flex items-center gap-3">
        <span className="text-11 font-medium tracking-[.08em] text-ink-muted">INFOS SUPPLÉMENTAIRES</span>
        <span className="flex-1 h-px bg-border" />
      </div>
      <button
        type="button"
        onClick={() => setShowMore((s) => !s)}
        className="mt-4 w-full h-[34px] box-border flex items-center justify-center gap-2 bg-surface-subtle border border-dashed border-border rounded-sm text-sm font-medium text-ink-muted"
      >
        {showMore ? <Minus size={16} strokeWidth={1.75} /> : <Plus size={16} strokeWidth={1.75} />}
        {showMore ? 'Masquer les infos supplémentaires' : 'Afficher les infos supplémentaires'}
      </button>
      {showMore && (
        <>
          <div className="mt-6 flex gap-4 max-sm:flex-col">
            <Field className="flex-1">
              <div className={label}>Date de naissance{optional}</div>
              <div className="relative">
                <input
                  className={cx(input, 'pr-9 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer')}
                  type="date"
                  value={f.birthDate}
                  onChange={set('birthDate')}
                />
                <CalendarDays size={16} strokeWidth={1.75} className="absolute right-3 top-[19px] text-ink pointer-events-none" />
              </div>
            </Field>
            <Field className="flex-1">
              <div className={label}>Sexe{optional}</div>
              <select className={cx(input, f.sex ? 'text-ink' : 'text-ink-muted')} value={f.sex} onChange={set('sex')}>
                <option value="">Homme ou Femme</option>
                <option value="male">Homme</option>
                <option value="female">Femme</option>
              </select>
            </Field>
          </div>
          <Field className="mt-6">
            <div className={label}>Notes{optional}</div>
            <textarea
              className="block mt-2 w-full h-24 box-border p-3 bg-surface-card border border-border rounded-sm text-sm text-ink placeholder:text-ink-muted outline-none resize-none focus:border-2 focus:border-brand-900"
              placeholder="Notes"
              value={f.notes}
              onChange={set('notes')}
            />
          </Field>
        </>
      )}
      {errors.form && <div className="mt-4 text-sm text-danger">{errors.form}</div>}
      <div className="mt-6 pb-6">
        {/* « Enregistrer » stays grey until the required fields are filled (not while saving). 30 px high as in the reference panel: the « ! » forces this height over the standard ones. */}
        <Button type="submit" size="sm" disabled={busy || !ready} className="h-[30px]!">
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
