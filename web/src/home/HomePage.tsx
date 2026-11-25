import { useOnboarding, usePractitioner } from '../hooks/queries';
import { pagePadding } from '../layout/AppShell';
import { useFlow } from '../lib/flow';
import { track } from '../lib/track';
import { useWording } from '../lib/wording';
import { Button } from '../ui';
import { cx } from '../ui/utils';
import { FirstSteps } from './Checklist';
import { useChecklistTheme } from './checklistTheme';
import { ChecklistThemeMenu } from './ChecklistThemeMenu';
import { ActivityCard, FeaturedCard } from './HomeCards';
import { WelcomeModal } from './WelcomeModal';

/**
 * HOME PAGE (screens 0, 4 and 5)
 * Header, « Vos premiers pas » checklist, activity and featured cards,
 * and the welcome modal right after signup.
 */
export function HomePage() {
  const w = useWording();
  const { data: p } = usePractitioner();
  const { data: onboarding } = useOnboarding();
  const flow = useFlow();
  const theme = useChecklistTheme();

  if (!p || !onboarding) return null;

  return (
    // Mobile (app captures): title alone on its line, no sub-title, a smaller button below it.
    <div className={cx(pagePadding, 'max-sm:pt-[27px]')}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start gap-2">
          <div className="flex-1 min-w-0 max-sm:basis-full max-sm:mb-2">
            <h1 className="m-0 text-2xl font-semibold text-ink">Bonjour {p.firstName} !</h1>
            <p className="m-0 text-sm text-ink-muted max-sm:hidden">Voici un aperçu de votre activité récente.</p>
          </div>
          <Button size="sm" padding="compact" className="flex-none max-sm:h-7 max-sm:text-13" onClick={() => {
              track('reco_cta_clicked', { location: 'en_tete' });
              flow.startReco('accueil');
            }}>
            {w.createRecoCta}
          </Button>
          <ChecklistThemeMenu value={theme.name} onChange={theme.choose} />
        </div>

        <FirstSteps onboarding={onboarding} theme={theme.theme} />

        <ActivityCard />
        <FeaturedCard />
      </div>

      {onboarding.showWelcome && <WelcomeModal firstName={p.firstName ?? ''} />}
    </div>
  );
}
