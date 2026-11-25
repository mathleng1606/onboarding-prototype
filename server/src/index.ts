import { buildApp } from './app.ts';
import { applySchema, openDb } from './db/index.ts';
import { isSeeded, PRACTITIONER_UID, seed } from './db/seed.ts';

const db = openDb();
applySchema(db);
if (!isSeeded(db)) seed(db);

const app = buildApp(db, {
  logger: { transport: { target: 'pino-pretty', options: { ignore: 'pid,hostname', translateTime: 'HH:MM:ss' } } },
  devRoutes: process.env.NODE_ENV !== 'production',
});

const port = Number(process.env.PORT ?? 3001);
await app.listen({ port, host: '127.0.0.1' });
app.log.info(`Practitioner uid: ${PRACTITIONER_UID}`);
