-- Simplycure onboarding prototype, SQLite schema.
-- Internal INTEGER ids are for joins only; the API only exposes `uid`.
-- Soft delete everywhere it applies: rows are never physically removed,
-- so "something that was done stays done" (onboarding checklist facts).

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS practitioners (
  id                      INTEGER PRIMARY KEY,
  uid                     TEXT NOT NULL UNIQUE,
  first_name              TEXT,
  last_name               TEXT,
  phone                   TEXT,
  profession              TEXT CHECK (profession IN ('naturopath','dietitian','general_practitioner',
                            'nutrition_physician','functional_physician','nutritionist','micronutritionist')),
  reco_frequency          TEXT CHECK (reco_frequency IN ('none','1_5','6_10','11_20','21_40','41_plus')),
  patient_discount_pct    INTEGER NOT NULL DEFAULT 10 CHECK (patient_discount_pct BETWEEN 0 AND 20),
  signup_completed_at     TEXT,
  welcome_dismissed_at    TEXT,
  guide_skipped_at        TEXT,
  checklist_dismissed_at  TEXT,
  created_at              TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at              TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at              TEXT
);

CREATE TABLE IF NOT EXISTS patients (
  id              INTEGER PRIMARY KEY,
  uid             TEXT NOT NULL UNIQUE,
  practitioner_id INTEGER NOT NULL REFERENCES practitioners(id),
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  birth_date      TEXT,
  sex             TEXT CHECK (sex IN ('male','female')),
  is_minor        INTEGER NOT NULL DEFAULT 0 CHECK (is_minor IN (0,1)),
  notes           TEXT,
  is_test         INTEGER NOT NULL DEFAULT 0 CHECK (is_test IN (0,1)),
  origin          TEXT NOT NULL DEFAULT 'manual' CHECK (origin IN ('manual','import')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT
);
CREATE INDEX IF NOT EXISTS patients_practitioner ON patients(practitioner_id);
CREATE UNIQUE INDEX IF NOT EXISTS one_test_patient ON patients(practitioner_id) WHERE is_test = 1;

CREATE TABLE IF NOT EXISTS products (
  id             INTEGER PRIMARY KEY,
  uid            TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  brand          TEXT NOT NULL,
  format         TEXT NOT NULL,            -- displayed text, kept as in the app
  unit           TEXT NOT NULL CHECK (unit IN ('jar','bottle','sachet')),
  price_cents    INTEGER NOT NULL CHECK (price_cents >= 0),  -- list price, before practitioner discount
  category       TEXT NOT NULL CHECK (category IN ('vitamins','minerals','omega_3','amino_acids',
                   'gemmotherapy','multivitamins')),
  default_dosage TEXT,
  image          TEXT,
  starter_rank   INTEGER UNIQUE,           -- 1..3 -> "Pour démarrer" row
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at     TEXT
);

-- "Les plus recommandés par d'autres <profession>": one ranking per profession.
CREATE TABLE IF NOT EXISTS product_profession_ranks (
  product_id  INTEGER NOT NULL REFERENCES products(id),
  profession  TEXT NOT NULL CHECK (profession IN ('naturopath','dietitian','general_practitioner',
                'nutrition_physician','functional_physician','nutritionist','micronutritionist')),
  rank        INTEGER NOT NULL CHECK (rank >= 1),
  PRIMARY KEY (product_id, profession),
  UNIQUE (profession, rank)
);

CREATE TABLE IF NOT EXISTS recommendations (
  id              INTEGER PRIMARY KEY,
  uid             TEXT NOT NULL UNIQUE,
  practitioner_id INTEGER NOT NULL REFERENCES practitioners(id),
  patient_id      INTEGER NOT NULL REFERENCES patients(id),
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent')),
  is_test         INTEGER NOT NULL CHECK (is_test IN (0,1)),  -- copied from patients.is_test by the server
  discount_pct    INTEGER CHECK (discount_pct BETWEEN 0 AND 20), -- snapshot at send time
  note            TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at         TEXT,
  deleted_at      TEXT,
  CHECK ((status = 'sent') = (sent_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS recommendations_practitioner ON recommendations(practitioner_id);
CREATE INDEX IF NOT EXISTS recommendations_patient ON recommendations(patient_id);

CREATE TABLE IF NOT EXISTS recommendation_items (
  recommendation_id INTEGER NOT NULL REFERENCES recommendations(id),
  product_id        INTEGER NOT NULL REFERENCES products(id),
  quantity          INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  dosage            TEXT,
  position          INTEGER NOT NULL,
  PRIMARY KEY (recommendation_id, product_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  practitioner_id INTEGER NOT NULL REFERENCES practitioners(id),
  product_id      INTEGER NOT NULL REFERENCES products(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT,                    -- remove = soft delete; re-add = back to NULL
  PRIMARY KEY (practitioner_id, product_id)
);

-- Product analytics. Before the signup is completed the visitor has no account yet: events carry the
-- anonymous_id kept by the browser; signup_completed links it to the account (account_uid).
-- created_at is always set here, by the server, never by the browser. No duration is stored:
-- durations are computed when read (see services/durations.ts).
CREATE TABLE IF NOT EXISTS events (
  id           INTEGER PRIMARY KEY,
  name         TEXT NOT NULL,
  anonymous_id TEXT,
  account_uid  TEXT REFERENCES practitioners(uid),
  props        TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(props)),  -- JSON, never patient data
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f','now')),
  CHECK (anonymous_id IS NOT NULL OR account_uid IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS events_created ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS events_account ON events(account_uid);
CREATE INDEX IF NOT EXISTS events_anonymous ON events(anonymous_id);

-- updated_at maintained by the database, not by each query.
CREATE TRIGGER IF NOT EXISTS practitioners_updated_at AFTER UPDATE ON practitioners
  WHEN NEW.updated_at = OLD.updated_at
  BEGIN UPDATE practitioners SET updated_at = datetime('now') WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS patients_updated_at AFTER UPDATE ON patients
  WHEN NEW.updated_at = OLD.updated_at
  BEGIN UPDATE patients SET updated_at = datetime('now') WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS products_updated_at AFTER UPDATE ON products
  WHEN NEW.updated_at = OLD.updated_at
  BEGIN UPDATE products SET updated_at = datetime('now') WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS recommendations_updated_at AFTER UPDATE ON recommendations
  WHEN NEW.updated_at = OLD.updated_at
  BEGIN UPDATE recommendations SET updated_at = datetime('now') WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS favorites_updated_at AFTER UPDATE ON favorites
  WHEN NEW.updated_at = OLD.updated_at
  BEGIN UPDATE favorites SET updated_at = datetime('now')
        WHERE practitioner_id = NEW.practitioner_id AND product_id = NEW.product_id; END;

-- Business rules enforced by the database as a safety net (the API checks them first).
CREATE TRIGGER IF NOT EXISTS test_patient_not_deletable BEFORE UPDATE OF deleted_at ON patients
  WHEN OLD.is_test = 1 AND NEW.deleted_at IS NOT NULL
  BEGIN SELECT RAISE(ABORT, 'test_patient_not_deletable'); END;
CREATE TRIGGER IF NOT EXISTS patient_is_test_immutable BEFORE UPDATE OF is_test ON patients
  WHEN NEW.is_test <> OLD.is_test
  BEGIN SELECT RAISE(ABORT, 'patient_is_test_immutable'); END;
CREATE TRIGGER IF NOT EXISTS sent_recommendation_frozen BEFORE UPDATE OF note, patient_id, is_test ON recommendations
  WHEN OLD.status = 'sent'
  BEGIN SELECT RAISE(ABORT, 'recommendation_already_sent'); END;
