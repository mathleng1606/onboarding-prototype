import { applySchema, DB_PATH, openDb } from '../src/db/index.ts';
import { isSeeded, PRACTITIONER_UID, seed } from '../src/db/seed.ts';

const db = openDb();
applySchema(db);
if (isSeeded(db)) {
  console.log(`Already seeded (${DB_PATH}). Use "npm run db:reset" to start over.`);
} else {
  seed(db);
  console.log(`Seeded ${DB_PATH}\nPractitioner uid: ${PRACTITIONER_UID}`);
}
db.close();
