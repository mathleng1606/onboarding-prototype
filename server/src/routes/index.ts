import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { resetDatabase } from '../db/seed.ts';
import { parse } from '../lib.ts';
import { allEventRows, computeDurations } from '../services/durations.ts';
import { toEventDto } from '../services/events.ts';
import { CATEGORIES } from '../services/products.ts';
import { findPractitioner, type PractitionerRow } from '../services/practitioners.ts';
import { param, type RouteOptions } from './context.ts';
import { eventRoutes } from './events.ts';
import { onboardingRoutes } from './onboarding.ts';
import { patientRoutes } from './patients.ts';
import { practitionerRoutes } from './practitioners.ts';
import { favoriteRoutes, productRoutes } from './products.ts';
import { recommendationRoutes } from './recommendations.ts';

/** Everything a practitioner owns lives under /api/practitioners/{practitionerUid}. */
const practitionerScope: FastifyPluginAsync<RouteOptions> = async (app, { db }) => {
  const opts = { db }; // not the parent options: they carry the parent prefix
  app.decorateRequest('practitioner', null as unknown as PractitionerRow);
  app.addHook('preHandler', async (req) => {
    req.practitioner = findPractitioner(db, param(req, 'practitionerUid'));
  });

  await app.register(practitionerRoutes, opts);
  await app.register(onboardingRoutes, { ...opts, prefix: '/onboarding' });
  await app.register(patientRoutes, { ...opts, prefix: '/patients' });
  await app.register(productRoutes, { ...opts, prefix: '/products' });
  await app.register(favoriteRoutes, { ...opts, prefix: '/favorites' });
  await app.register(recommendationRoutes, { ...opts, prefix: '/recommendations' });
  await app.register(eventRoutes, { ...opts, prefix: '/events' });
};

export const apiRoutes: FastifyPluginAsync<RouteOptions & { devRoutes: boolean }> = async (app, { db, devRoutes }) => {
  app.get('/health', async () => ({ ok: true }));
  app.get('/categories', async () => CATEGORIES);

  if (devRoutes) {
    app.post('/dev/reset', async (_req, reply) => {
      resetDatabase(db);
      return reply.code(204).send();
    });

    // The /debug page: every event (all accounts and anonymous visitors), the durations, and a reset.
    const limitSchema = z.object({ limit: z.coerce.number().int().min(1).max(1000).default(300) });
    app.get('/dev/events', async (req) => allEventRows(db, parse(limitSchema, req.query).limit).map(toEventDto));
    app.get('/dev/durations', async () => computeDurations(allEventRows(db)));
    app.delete('/dev/events', async (_req, reply) => {
      db.prepare(`DELETE FROM events`).run();
      return reply.code(204).send();
    });
  }

  await app.register(practitionerScope, { db, prefix: '/practitioners/:practitionerUid' });
};
