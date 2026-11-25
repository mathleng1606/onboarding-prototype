import type { FastifyRequest } from 'fastify';
import type { DB } from '../db/index.ts';
import type { PractitionerRow } from '../services/practitioners.ts';

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by the practitioner scope (routes/index.ts) from the {practitionerUid} path segment. */
    practitioner: PractitionerRow;
  }
}

export type RouteOptions = { db: DB };

export const param = (req: FastifyRequest, name: string) => (req.params as Record<string, string>)[name];
