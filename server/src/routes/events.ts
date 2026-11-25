import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { parse } from '../lib.ts';
import { eventSchema, listEvents, recordEvent } from '../services/events.ts';
import type { RouteOptions } from './context.ts';

const listQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(500).default(100) });

/** /api/practitioners/{uid}/events */
export const eventRoutes: FastifyPluginAsync<RouteOptions> = async (app, { db }) => {
  app.post('/', async (req, reply) => {
    const { name, anonymousId, props } = parse(eventSchema, req.body);
    return reply.code(201).send(recordEvent(db, req.practitioner, name, props, { origin: 'web', anonymousId }));
  });

  app.get('/', async (req) => listEvents(db, req.practitioner, parse(listQuerySchema, req.query).limit));
};
