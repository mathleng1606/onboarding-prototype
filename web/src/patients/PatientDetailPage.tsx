import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { keys } from '../hooks/queries';
import { pagePadding } from '../layout/AppShell';
import { useFlow } from '../lib/flow';
import { frenchDate, shortDateTime } from '../lib/format';
import { useWording } from '../lib/wording';
import { Button, TestBadge } from '../ui';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleCheckBig,
  ClipboardList,
  Download,
  EllipsisVertical,
  Eye,
  Link as LinkIcon,
  Pencil,
  Sparkles,
  X,
} from '../ui/icons';
import { useToast } from '../ui/toast';
import { NOT_IN_PROTOTYPE } from '../ui/utils';

/**
 * PATIENT PAGE (reference screen I): identity, information, note, and the list of recommendations.
 * `?envoyee=<recoUid>` shows the « Recommandation envoyée à Claire » banner (after sending, screen 6).
 */
export function PatientDetailPage() {
  const { uid = '' } = useParams();
  const w = useWording();
  const toast = useToast();
  const navigate = useNavigate();
  const flow = useFlow();
  const [params, setParams] = useSearchParams();
  const { data: p, error } = useQuery({ queryKey: keys.patient(uid), queryFn: () => api.patient(uid) });
  if (error) return <div className={pagePadding}>{w.N} introuvable.</div>;
  if (!p) return null;
  const sentUid = params.get('envoyee');
  const notDone = () => toast(NOT_IN_PROTOTYPE);
  // Flat label / value spans (desktop spacing of the reference); on mobile, a line break after each value.
  const info = (label: string, value: string) => [
    <span key={label} className="text-sm font-medium text-ink">{label}</span>,
    <span key={label + 'v'} className="text-sm text-ink-muted ml-2">{value}</span>,
    <span key={label + 'br'} className="hidden max-sm:block basis-full h-3" />,
  ];
  /** « Envoyée » or « Brouillon » chip. */
  const RecoStatus = ({ status }: { status: 'draft' | 'sent' }) =>
    status === 'sent' ? (
      <span className="inline-flex items-center gap-1 py-1 px-3 rounded-full bg-info-bg text-info-ink text-13 font-semibold">
        <Check size={12} strokeWidth={2} />
        Envoyée
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 py-1 px-3 rounded-full bg-surface-subtle text-ink-muted text-13 font-semibold">
        <Pencil size={14} strokeWidth={1.75} />
        Brouillon
      </span>
    );
  /** Small 28 px outlined square with an icon (actions of a recommendation row). */
  const square = 'w-7 h-7 box-border border border-brand-900 rounded-sm flex items-center justify-center';
  /** Actions of a recommendation: open (draft) or copy instructions / link (sent), then ⋮. */
  const RecoActions = ({ r }: { r: { uid: string; status: 'draft' | 'sent' } }) => (
    <>
      {r.status === 'draft' ? (
        <button type="button" aria-label="Ouvrir" onClick={() => navigate(`/recommandations/${r.uid}`)} className={`${square} bg-transparent text-brand-900`}>
          <Eye size={14} strokeWidth={1.75} />
        </button>
      ) : (
        <>
          <span className={square}>
            <ClipboardList size={14} strokeWidth={1.75} />
          </span>
          <span className={square}>
            <LinkIcon size={14} strokeWidth={1.75} />
          </span>
        </>
      )}
      <span className={square}>
        <EllipsisVertical size={14} strokeWidth={3} />
      </span>
    </>
  );

  return (
    <div className={pagePadding}>
      <button type="button" onClick={() => navigate('/patients')} className="flex items-center gap-2 text-sm text-ink bg-transparent border-0 p-0">
        <ArrowLeft size={16} strokeWidth={1.75} />
        Tous les {w.ns}
      </button>
      <section className="mt-3 bg-surface-card border border-border rounded-lg">
        <div className="flex flex-wrap items-start gap-2 pt-4 px-4 pb-3">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 text-sm leading-[22px] font-medium text-ink">
              {p.firstName} {p.lastName}
              {p.isTest && <TestBadge />}
            </div>
            <div className="text-sm text-ink-muted">{p.email}</div>
          </div>
          <Button variant="outline" className="max-sm:hidden" onClick={notDone}>
            <Sparkles size={16} strokeWidth={1.75} />
            Simplycure Assist
          </Button>
          <Button variant="outline" className="max-sm:hidden" onClick={notDone}>
            <Pencil size={16} strokeWidth={1.75} />
            Modifier
          </Button>
          <span className="max-sm:hidden inline-flex items-center justify-center box-border w-9 h-9 border border-brand-900 rounded-sm text-brand-900">
            <EllipsisVertical size={16} strokeWidth={3} />
          </span>
          {/* Mobile (app capture): three 28 px icon-only buttons. */}
          <span className="sm:hidden flex gap-2.5">
            <Button variant="outline" size="xs" padding="none" className="w-7 shadow-sm" aria-label="Simplycure Assist" onClick={notDone}>
              <Sparkles size={14} strokeWidth={1.75} />
            </Button>
            <Button variant="outline" size="xs" padding="none" className="w-7 shadow-sm" aria-label="Modifier" onClick={notDone}>
              <Pencil size={14} strokeWidth={1.75} />
            </Button>
            <Button variant="outline" size="xs" padding="none" className="w-7 shadow-sm" aria-label="Plus d'actions" onClick={notDone}>
              <EllipsisVertical size={14} strokeWidth={3} />
            </Button>
          </span>
        </div>
        <div className="border-t border-border flex flex-wrap items-center gap-x-8 gap-y-2 max-sm:gap-x-0 max-sm:gap-y-0 p-4">
          {info('Téléphone :', p.phone ?? '-')}
          {info('Date de naissance :', p.birthDate ? frenchDate(p.birthDate) : '-')}
          {info('Sexe :', p.sex === 'male' ? 'Homme' : p.sex === 'female' ? 'Femme' : '-')}
          {info('Origine :', p.origin === 'manual' ? 'Ajouté manuellement' : 'Importé')}
        </div>
        <div className="mx-4 mb-4 flex items-center gap-3 py-3 px-4 bg-surface-subtle border border-border rounded-md text-sm text-ink-muted">
          <span className="text-ink flex">
            <ClipboardList size={16} strokeWidth={1.75} />
          </span>
          <span className="text-sm font-medium text-ink">Note {w.n}</span>
          <span className="flex-1 truncate">{p.notes}</span>
          <ChevronRight size={16} strokeWidth={2} />
        </div>
      </section>

      {sentUid && (
        <section className="mt-4 flex gap-3 items-start p-4 bg-surface-tint border-2 border-brand-800 rounded-lg">
          <span className="flex-none flex text-brand-900">
            <CircleCheckBig size={22} strokeWidth={1.75} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-ink">{w.sentBannerTitle(p.firstName)}</div>
            <div className="mt-1 text-sm text-ink-muted">
              Envoyée par e-mail et par SMS. Vous pouvez aussi partager le lien ou les instructions vous-même.
            </div>
            {/* Mobile (app capture): buttons stacked, full width. */}
            <div className="flex flex-wrap gap-2 mt-3 max-sm:flex-col max-sm:-ml-[34px] max-sm:-mr-8">
              <Button variant="outline" className="max-sm:w-full max-sm:h-7" onClick={notDone}>
                <LinkIcon size={16} strokeWidth={1.75} />
                Copier le lien
              </Button>
              <Button variant="outline" className="max-sm:w-full max-sm:h-7" onClick={notDone}>
                <ClipboardList size={16} strokeWidth={1.75} />
                Copier les instructions
              </Button>
              <Button variant="outline" className="max-sm:w-full max-sm:h-7" onClick={notDone}>
                <Download size={16} strokeWidth={1.75} />
                Télécharger le PDF
              </Button>
            </div>
          </div>
          <button type="button" aria-label="Fermer le message" onClick={() => setParams({})} className="flex text-ink-muted bg-transparent border-0 p-0">
            <X size={20} strokeWidth={2} />
          </button>
        </section>
      )}

      <div className="flex gap-6 mt-6">
        <span className="pb-2 border-b-[3px] border-brand-link text-base text-ink">{w.Mots}</span>
        <span className="text-base text-ink-muted">Questionnaires</span>
        <span className="text-base text-ink-muted">Commandes</span>
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={() => flow.startReco('patients', p.uid)} className="max-sm:h-7 max-sm:text-13">{w.newRecoTitle}</Button>
      </div>
      <section className="flex max-sm:hidden mt-4 bg-surface-card border border-border rounded-lg text-sm font-medium text-ink">
        <span className="flex-[1.3] p-4 text-center">Date de création</span>
        <span className="flex-1 p-4 text-center border-l border-border">Statut</span>
        <span className="flex-[.5] p-4 text-center border-l border-border">Action</span>
      </section>
      {p.recommendations.map((r) => (
        <section key={r.uid} className="flex max-sm:hidden items-center mt-3 py-4 bg-surface-card border border-border rounded-lg">
          <span className="flex-[1.3] text-center text-sm text-ink-muted">{shortDateTime(r.sentAt ?? r.createdAt)}</span>
          <span className="flex-1 flex justify-center">
            <RecoStatus status={r.status} />
          </span>
          <span className="flex-[.5] flex justify-center gap-2 text-brand-900">
            <RecoActions r={r} />
          </span>
        </section>
      ))}
      {/* Mobile (app capture): one card per recommendation. */}
      {p.recommendations.map((r) => (
        <section key={r.uid + 'm'} className="sm:hidden mt-3 p-4 bg-surface-card border border-border rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <span className="text-ink-muted">
              {p.firstName} {p.lastName}
            </span>
            {p.isTest && <TestBadge />}
            <span className="flex-1" />
            <RecoStatus status={r.status} />
          </div>
          <div className="flex items-center mt-3">
            <span className="flex-1 text-ink-muted">Date de création</span>
            <span className="text-base font-semibold text-ink">{shortDateTime(r.sentAt ?? r.createdAt)}</span>
          </div>
          <div className="mt-3 text-ink-muted">{w.N}</div>
          <div className="flex justify-end gap-2 text-brand-900">
            <RecoActions r={r} />
          </div>
        </section>
      ))}
    </div>
  );
}
