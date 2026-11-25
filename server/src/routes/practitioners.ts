import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { parse } from '../lib.ts';
import { linkAnonymousEvents, recordEvent } from '../services/events.ts';
import { withOnboardingTracking } from '../services/onboarding.ts';
import {
  completeSignup,
  practitionerPatchSchema,
  reloadPractitioner,
  toPractitionerDto,
  updatePractitioner,
} from '../services/practitioners.ts';
import type { RouteOptions } from './context.ts';

const signupCompleteSchema = z.strictObject({ anonymousId: z.uuid().optional() });

/** /api/practitioners/{uid} */
export const practitionerRoutes: FastifyPluginAsync<RouteOptions> = async (app, { db }) => {
  app.get('/', async (req) => toPractitionerDto(req.practitioner));

  app.patch('/', async (req) => {
    updatePractitioner(db, req.practitioner, parse(practitionerPatchSchema, req.body));
    return toPractitionerDto(reloadPractitioner(db, req.practitioner));
  });

  /** The body carries the browser's anonymous_id: signup_completed links it to the account. */
  app.post('/signup/complete', async (req) => {
    const { anonymousId } = parse(signupCompleteSchema, req.body);
    const p = req.practitioner;
    withOnboardingTracking(db, p, () => {
      const firstTime = p.signup_completed_at === null;
      completeSignup(db, p);
      if (!firstTime) return;
      recordEvent(db, reloadPractitioner(db, p), 'signup_completed', {}, { origin: 'server', anonymousId });
      if (anonymousId) linkAnonymousEvents(db, p, anonymousId);
    });
    return toPractitionerDto(reloadPractitioner(db, p));
  });
};
