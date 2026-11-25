import Fastify, { type FastifyInstance } from 'fastify';
import type { DB } from './db/index.ts';
import { HttpError } from './lib.ts';
import { apiRoutes } from './routes/index.ts';

/** Builds the Fastify server: error format + routes (see routes/). */
export function buildApp(db: DB, opts: { logger?: boolean | object; devRoutes?: boolean } = {}): FastifyInstance {
  const app = Fastify({ logger: opts.logger ?? false });

  app.setErrorHandler((err: unknown, req, reply) => {
    if (err instanceof HttpError) {
      return reply.code(err.status).send({ error: { code: err.code, message: err.message, details: err.details } });
    }
    const e = err as { code?: string; message?: string; statusCode?: number };
    // Business rules enforced by SQLite triggers (safety net behind the service checks).
    if (e.code === 'SQLITE_CONSTRAINT_TRIGGER') {
      return reply.code(409).send({ error: { code: e.message, message: e.message } });
    }
    if (e.statusCode && e.statusCode < 500) {
      return reply.code(e.statusCode).send({ error: { code: e.code ?? 'bad_request', message: e.message } });
    }
    req.log.error(err);
    return reply.code(500).send({ error: { code: 'internal_error', message: 'Internal error' } });
  });

  app.register(apiRoutes, { db, devRoutes: opts.devRoutes ?? true, prefix: '/api' });
  return app;
}
