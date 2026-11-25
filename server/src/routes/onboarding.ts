import type { FastifyPluginAsync } from 'fastify';
import { HttpError } from '../lib.ts';
import { computeOnboarding, withOnboardingTracking } from '../services/onboarding.ts';
import { reloadPractitioner, stamp } from '../services/practitioners.ts';
import type { RouteOptions } from './context.ts';

/** /api/practitioners/{uid}/onboarding */
export const onboardingRoutes: FastifyPluginAsync<RouteOptions> = async (app, { db }) => {
  const current = (p: Parameters<typeof reloadPractitioner>[1]) => computeOnboarding(db, reloadPractitioner(db, p));

  app.get('/', async (req) => computeOnboarding(db, req.practitioner));

  app.post('/skip-guide', async (req) => {
    withOnboardingTracking(db, req.practitioner, () => stamp(db, req.practitioner, 'guide_skipped_at'));
    return current(req.practitioner);
  });

  app.post('/dismiss-welcome', async (req) => {
    stamp(db, req.practitioner, 'welcome_dismissed_at');
    return current(req.practitioner);
  });

  app.post('/dismiss-checklist', async (req) => {
    if (!computeOnboarding(db, req.practitioner).closed) {
      throw new HttpError(409, 'checklist_not_closed', 'The checklist can only be dismissed once closed');
    }
    stamp(db, req.practitioner, 'checklist_dismissed_at');
    return current(req.practitioner);
  });
};
