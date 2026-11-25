import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { HttpError, parse } from '../lib.ts';
import { parseWebEvent } from '../services/eventCatalog.ts';
import { daysSinceSignup, listEvents, recordEvent } from '../services/events.ts';
import type { RouteOptions } from './context.ts';

const listQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(500).default(100) });

/** /api/practitioners/{uid}/events — the browser's events (the list is in services/eventCatalog.ts). */
export const eventRoutes: FastifyPluginAsync<RouteOptions> = async (app, { db }) => {
  app.post('/', async (req, reply) => {
    const p = req.practitioner;
    const { name, anonymousId, props } = parseWebEvent(req.body);
    // Before the account exists, the anonymous_id is the only way to know who did it.
    if (p.signup_completed_at === null && !anonymousId) {
      throw new HttpError(422, 'validation_error', 'Invalid request', {
        formErrors: [],
        fieldErrors: { anonymousId: ['Required until the signup is completed'] },
      });
    }
    const enriched = name === 'session_started' ? { ...props, days_since_signup: daysSinceSignup(db, p) } : props;
    return reply.code(201).send(recordEvent(db, p, name, enriched, { origin: 'web', anonymousId }));
  });

  app.get('/', async (req) => listEvents(db, req.practitioner, parse(listQuerySchema, req.query).limit));
};
