import { DB_PATH, openDb } from '../src/db/index.ts';
import { PRACTITIONER_UID, resetDatabase } from '../src/db/seed.ts';

const db = openDb();
resetDatabase(db);
console.log(`Reset ${DB_PATH}\nPractitioner uid: ${PRACTITIONER_UID}`);
db.close();
