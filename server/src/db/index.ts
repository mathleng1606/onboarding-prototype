import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export const DB_PATH = process.env.DB_PATH ?? resolve(here, '../../data/simplycure.db');
const SCHEMA_PATH = resolve(here, 'schema.sql');

export type DB = Database.Database;

export function openDb(path = DB_PATH): DB {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

/** Creates missing tables, indexes and triggers. Safe to run on an existing database. */
export function applySchema(db: DB): void {
  db.exec(readFileSync(SCHEMA_PATH, 'utf8'));
}

/** Drops every table and trigger, then recreates the schema (empty). */
export function dropAll(db: DB): void {
  const objects = db
    .prepare(
      `SELECT type, name FROM sqlite_master
       WHERE type IN ('table','trigger') AND name NOT LIKE 'sqlite_%'`,
    )
    .all() as { type: 'table' | 'trigger'; name: string }[];
  db.pragma('foreign_keys = OFF');
  db.transaction(() => {
    for (const o of objects.filter((o) => o.type === 'trigger')) db.exec(`DROP TRIGGER IF EXISTS "${o.name}"`);
    for (const o of objects.filter((o) => o.type === 'table')) db.exec(`DROP TABLE IF EXISTS "${o.name}"`);
  })();
  db.pragma('foreign_keys = ON');
}
