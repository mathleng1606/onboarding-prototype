import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { HttpError, parse } from '../lib.ts';
import { recordEvent } from '../services/events.ts';
import { computeOnboarding, withOnboardingTracking } from '../services/onboarding.ts';
import { reloadPractitioner, stamp } from '../services/practitioners.ts';
import type { RouteOptions } from './context.ts';

const skipGuideSchema = z.strictObject({ step: z.union([z.literal(1), z.literal(2), z.literal(3)]) });

/** /api/practitioners/{uid}/onboarding */
export const onboardingRoutes: FastifyPluginAsync<RouteOptions> = async (app, { db }) => {
  const current = (p: Parameters<typeof reloadPractitioner>[1]) => computeOnboarding(db, reloadPractitioner(db, p));

  app.get('/', async (req) => computeOnboarding(db, req.practitioner));

  /** « Passer le guide »: the body says on which guide step (1-3) it was clicked. */
  app.post('/skip-guide', async (req) => {
    const { step } = parse(skipGuideSchema, req.body);
    const p = req.practitioner;
    const wasActive = computeOnboarding(db, p).guideActive;
    withOnboardingTracking(db, p, () => stamp(db, p, 'guide_skipped_at'));
    if (wasActive) recordEvent(db, p.id, 'guide_dismissed', { step }, 'server');
    return current(p);
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
