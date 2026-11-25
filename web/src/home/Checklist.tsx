import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { ChecklistItemKey, Onboarding } from '../api/types';
import { useRefresh } from '../hooks/queries';
import { useFlow } from '../lib/flow';
import { track, trackOnce } from '../lib/track';
import { useWording } from '../lib/wording';
import { SrOnly } from '../ui';
import { buttonClass } from '../ui/buttons';
import { ChevronRight, Check, X } from '../ui/icons';
import { useToast } from '../ui/toast';
import { cx, NOT_IN_PROTOTYPE } from '../ui/utils';
import type { ChecklistTheme } from './checklistTheme';

/**
 * « VOS PREMIERS PAS » CHECKLIST (screens 4 and 5)
 *
 * Which items are done is computed by the server from facts (GET /onboarding):
 * the front only displays `onboarding.items`, `doneCount`, `nextItem`, `closed`, `hidden`.
 * Three looks:
 * - full card (items, progress bar, next item highlighted with a button);
 * - collapsed pill, after its « X » (kept for this browser tab only);
 * - one closing line once the first real recommendation is sent (`closed`).
 */
export function FirstSteps({ onboarding, theme }: { onboarding: Onboarding; theme: ChecklistTheme }) {
  const [collapsed, setCollapsed] = useState(() => sessionStorage.getItem(COLLAPSED_KEY) === '1');
  const collapse = (v: boolean) => {
    sessionStorage.setItem(COLLAPSED_KEY, v ? '1' : '0');
    setCollapsed(v);
  };

  const favoritesDone = onboarding.items.find((i) => i.key === 'favorites')!.done;
  // Screen 11: first recommendation real without the test, favorites not chosen yet → the full checklist
  // with a « Bravo » line, instead of « tout est prêt » (which would contradict the remaining step).
  const realFirst = onboarding.realFirstWithoutTest && !favoritesDone;

  if (onboarding.hidden) return null;
  if (onboarding.closed && !realFirst) return <ChecklistDone onboarding={onboarding} t={theme} />;
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => collapse(false)}
        className={cx('self-start inline-flex items-center gap-2 py-3 px-4 min-h-11 box-border rounded-full text-sm font-medium border-0', theme.pill)}
      >
        Vos premiers pas · {onboarding.doneCount} sur {onboarding.total}
        <ChevronRight size={16} strokeWidth={1.75} />
      </button>
    );
  }
  return <Checklist onboarding={onboarding} t={theme} realFirst={realFirst} onCollapse={() => collapse(true)} />;
}

/** The checklist « X » collapses it until the end of this browser session. */
const COLLAPSED_KEY = 'checklist-collapsed';

/** checklist_item_viewed: each item still to do that is visible, once per browser session. */
function useItemsViewed(keys: ChecklistItemKey[]) {
  const shown = keys.join(',');
  useEffect(() => {
    for (const item of shown ? (shown.split(',') as ChecklistItemKey[]) : []) {
      trackOnce(`checklist_item_viewed:${item}`, sessionStorage, 'checklist_item_viewed', { item });
    }
  }, [shown]);
}

/** What each checklist item opens. */
function useItemAction() {
  const flow = useFlow();
  const navigate = useNavigate();
  const toast = useToast();
  return (key: ChecklistItemKey) => {
    track('checklist_item_clicked', { item: key });
    if (key === 'test_recommendation' || key === 'real_recommendation') {
      track('reco_cta_clicked', { location: 'checklist' });
      flow.startReco('checklist');
    }
    // Item 3 opens the catalogue outside the guide (screen 9), where « Configurer mes favoris » lives.
    else if (key === 'favorites') navigate('/catalogue');
    else if (key === 'real_patient') navigate('/patients/nouveau', { state: { source: 'checklist' } });
    else toast(NOT_IN_PROTOTYPE);
  };
}

/** Status dot, 20 px (not a token), check 12 px: two states only, done or empty circle. */
function StatusDot({ done, t }: { done: boolean; t: ChecklistTheme }) {
  return done ? (
    <span className={cx('flex-none w-5 h-5 rounded-full flex items-center justify-center', t.doneDot)} aria-hidden="true">
      <Check size={12} strokeWidth={3} />
    </span>
  ) : (
    <span className={cx('flex-none box-border w-5 h-5 rounded-full border-2', t.ring)} aria-hidden="true" />
  );
}

/** « X » that closes the card (round 48 px touch target). */
function CloseCard({ t, onClick }: { t: ChecklistTheme; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Fermer la liste, elle reviendra à votre prochaine visite"
      onClick={onClick}
      className={cx('flex-none w-12 h-12 -m-2 border-0 bg-transparent rounded-full flex items-center justify-center', t.muted)}
    >
      <X size={18} strokeWidth={2} />
    </button>
  );
}

function Checklist({
  onboarding,
  t,
  realFirst,
  onCollapse,
}: {
  onboarding: Onboarding;
  t: ChecklistTheme;
  /** Show the « Bravo, votre première recommandation est partie ! » line (screen 11). */
  realFirst: boolean;
  onCollapse: () => void;
}) {
  const w = useWording();
  const act = useItemAction();
  // Not while the welcome modal covers the checklist: the items are not seen yet.
  useItemsViewed(onboarding.showWelcome ? [] : onboarding.items.filter((i) => !i.done).map((i) => i.key));
  const title: Record<ChecklistItemKey, string> = {
    account: 'Créer votre compte',
    test_recommendation: w.checklistItem2Title,
    favorites: 'Choisir vos produits habituels',
    real_patient: `Ajouter un vrai ${w.n}`,
    real_recommendation: w.checklistItem5Title,
  };
  const sub: Partial<Record<ChecklistItemKey, string>> = {
    test_recommendation: `Votre ${w.n} test la reçoit par e-mail ou par SMS.`,
    favorites: w.checklistItem3Text,
    real_patient: "Ceci ne prend qu'1 minute",
    real_recommendation: `Votre ${w.n} la reçoit par e-mail ou par SMS.`,
  };
  const cta: Partial<Record<ChecklistItemKey, string>> = {
    test_recommendation: 'Commencer',
    favorites: 'Choisir',
    real_patient: 'Ajouter',
    real_recommendation: 'Commencer',
  };
  return (
    <section aria-label="Vos premiers pas" className={cx('rounded-lg overflow-hidden', t.card)}>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <h2 className={cx('m-0 text-lg font-semibold', t.title)}>Vos premiers pas</h2>
          <span className="flex-1" />
          <span className={cx('text-sm font-medium', t.count)}>
            {onboarding.doneCount} sur {onboarding.total}
          </span>
          <CloseCard t={t} onClick={onCollapse} />
        </div>
        <div
          role="progressbar"
          aria-label="Progression"
          aria-valuemin={0}
          aria-valuemax={onboarding.total}
          aria-valuenow={onboarding.doneCount}
          className={cx('mt-3 h-2 rounded-full overflow-hidden', t.track)}
        >
          <div className={cx('h-full rounded-full', t.fill)} style={{ width: `${(onboarding.doneCount / onboarding.total) * 100}%` }} />
        </div>
      </div>
      <div className={cx('border-t', t.divider)}>
        {realFirst && (
          // Lighter background (surface-tint, or white 8 % in dark), bottom separator, no close button.
          <div className={cx('flex gap-3 items-center py-3 px-4 min-h-12 box-border border-b', t.highlight, t.divider)}>
            <StatusDot done t={t} />
            <span className={cx('flex-1 min-w-0 text-sm', t.label)}>
              <span className="font-semibold">{w.checklistRealFirstLead}</span>
              {w.checklistRealFirstRest}
            </span>
          </div>
        )}
        {onboarding.items.map(({ key, done }, i) => {
          const isNext = key === onboarding.nextItem;
          // Sub-text: on the next item, and on items 3 and 4 while they are not done.
          const showSub = !done && (isNext || key === 'favorites' || key === 'real_patient');
          return (
            <button
              key={key}
              type="button"
              onClick={() => act(key)}
              className={cx(
                'w-full text-left flex gap-3 items-center py-3 px-4 min-h-12 box-border border-0',
                i > 0 && cx('border-t border-solid', t.divider),
                isNext ? t.highlight : 'bg-transparent',
              )}
            >
              <span className={cx('pt-1 flex', done || !showSub ? 'self-center' : 'self-start')}>
                <StatusDot done={done} t={t} />
              </span>
              <span className="flex-1 min-w-0 block">
                <span className={cx('block text-sm', done ? cx('font-medium', t.done) : isNext ? cx('font-medium', t.label) : cx('font-normal', t.label))}>
                  {title[key]}
                  <SrOnly>{done ? ' (fait)' : ' (à faire)'}</SrOnly>
                </span>
                {showSub && <span className={cx('block text-xs', t.muted)}>{sub[key]}</span>}
              </span>
              {isNext ? (
                // Looks like a button; the whole row is the clickable element.
                <span className={cx(buttonClass(t.cta, 'sm'), 'flex-none')}>{cta[key]}</span>
              ) : (
                <span className={cx('flex-none flex', t.muted)}>
                  <ChevronRight size={20} strokeWidth={2} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** State B: closed at the first real recommendation; item 3 stays as a discreet line if not done. */
function ChecklistDone({ onboarding, t }: { onboarding: Onboarding; t: ChecklistTheme }) {
  const w = useWording();
  const refresh = useRefresh();
  const act = useItemAction();
  const favoritesDone = onboarding.items.find((i) => i.key === 'favorites')!.done;
  useItemsViewed(favoritesDone ? [] : ['favorites']);
  return (
    <section aria-label="Vos premiers pas" className={cx('flex flex-wrap items-center gap-3 py-3 px-4 min-h-12 box-border rounded-lg', t.card)}>
      <StatusDot done t={t} />
      <span className={cx('flex-1 min-w-0 text-sm', t.label)}>
        <span className="font-medium">{w.checklistDoneLead}</span>
        {w.checklistDoneRest}
      </span>
      <CloseCard
        t={t}
        onClick={async () => {
          track('checklist_dismissed', { n_items_done: onboarding.doneCount });
          refresh.onboarding(await api.dismissChecklist());
        }}
      />
      {!favoritesDone && (
        <button
          type="button"
          onClick={() => act('favorites')}
          className={cx('basis-full box-border flex gap-3 items-center py-2 px-4 border-0 border-t border-solid bg-transparent text-left', t.divider)}
        >
          <span className="pt-1 flex self-center">
            <StatusDot done={false} t={t} />
          </span>
          <span className={cx('flex-1 min-w-0 text-sm font-normal', t.muted)}>
            Choisir vos produits habituels<SrOnly> (à faire)</SrOnly>
          </span>
          <span className={cx('flex-none flex', t.muted)}>
            <ChevronRight size={20} strokeWidth={2} />
          </span>
        </button>
      )}
    </section>
  );
}
