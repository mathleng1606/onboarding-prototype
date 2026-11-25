import { api } from '../api/client';
import { useRefresh } from '../hooks/queries';
import { useFlow } from '../lib/flow';
import { useWording } from '../lib/wording';
import { Button, Modal } from '../ui';
import { X } from '../ui/icons';

/**
 * « Faites votre première recommandation » modal (screen 0), shown once after signup
 * (`onboarding.showWelcome`). Its button starts the guide; its cross only closes it.
 * Position and size (top 185 px, 638 × 372 px) are measured on the reference HTML.
 */
export function WelcomeModal({ firstName }: { firstName: string }) {
  const w = useWording();
  const refresh = useRefresh();
  const flow = useFlow();
  const dismiss = async () => refresh.onboarding(await api.dismissWelcome());
  // Mini drawing of a recommendation (4 product lines). #c9c0f3 comes from the reference: it is not a token.
  const row = (color: string) => (
    <div className="flex items-center gap-2 mt-1.5">
      <span className="flex-none w-[18px] h-5 rounded-[4px] block" style={{ background: color }} />
      <span className="flex-1">
        <span className="block h-[3px] rounded-[2px] bg-surface-neutral" />
        <span className="block h-[3px] w-3/5 rounded-[2px] bg-surface-neutral mt-1" />
      </span>
    </div>
  );
  return (
    <Modal label="Bienvenue" onClose={dismiss} className="top-[185px] w-[638px] h-[372px] p-6 flex flex-col items-center text-center bg-surface-subtle">
      <button type="button" aria-label="Fermer" onClick={dismiss} className="absolute right-5 top-5 text-ink-muted flex border-0 bg-transparent p-0">
        <X size={18} strokeWidth={2} />
      </button>
      <div className="mt-4 text-13 text-ink">👋 Bienvenue {firstName},</div>
      <div className="mt-1 text-lg font-semibold text-ink">{w.welcomeTitle}</div>
      <div className="mt-2 max-w-[470px] text-xs leading-[18px] text-ink-muted">{w.welcomeText}</div>
      <div className="mt-4">
        <div className="w-[109px] h-[165px] box-border p-2 bg-surface-card border border-border rounded-sm">
          <div className="h-[22px] rounded-[4px] bg-surface-subtle" />
          {row('var(--color-brand-sage)')}
          {row('#c9c0f3')}
          {row('var(--color-accent-peach)')}
          {row('var(--color-brand-600)')}
        </div>
      </div>
      <Button
        size="xs"
        className="mt-4 shrink-0"
        onClick={async () => {
          await dismiss();
          flow.startReco('guide');
        }}
      >
        {w.welcomeCta}
      </Button>
    </Modal>
  );
}

