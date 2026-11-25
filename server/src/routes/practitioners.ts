import type { FastifyPluginAsync } from 'fastify';
import { parse } from '../lib.ts';
import { withOnboardingTracking } from '../services/onboarding.ts';
import {
  completeSignup,
  practitionerPatchSchema,
  reloadPractitioner,
  toPractitionerDto,
  updatePractitioner,
} from '../services/practitioners.ts';
import type { RouteOptions } from './context.ts';

/** /api/practitioners/{uid} */
export const practitionerRoutes: FastifyPluginAsync<RouteOptions> = async (app, { db }) => {
  app.get('/', async (req) => toPractitionerDto(req.practitioner));

  app.patch('/', async (req) => {
    updatePractitioner(db, req.practitioner, parse(practitionerPatchSchema, req.body));
    return toPractitionerDto(reloadPractitioner(db, req.practitioner));
  });

  app.post('/signup/complete', async (req) => {
    withOnboardingTracking(db, req.practitioner, () => completeSignup(db, req.practitioner));
    return toPractitionerDto(reloadPractitioner(db, req.practitioner));
  });
};
