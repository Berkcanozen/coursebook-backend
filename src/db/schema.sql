PRAGMA foreign_keys = ON;

-- One account == one family.
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  family_name   TEXT NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'EUR',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS children (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#C85A38',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_children_user ON children(user_id);

CREATE TABLE IF NOT EXISTS courses (
  id         TEXT PRIMARY KEY,
  child_id   TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  instructor TEXT NOT NULL DEFAULT '',
  location   TEXT NOT NULL DEFAULT '',
  schedule   TEXT NOT NULL DEFAULT '',
  fee        REAL NOT NULL DEFAULT 0,
  fee_type   TEXT NOT NULL DEFAULT 'session',
  icon       TEXT NOT NULL DEFAULT 'other',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_courses_child ON courses(child_id);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  course_id  TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,
  amount     REAL NOT NULL DEFAULT 0,
  paid       INTEGER NOT NULL DEFAULT 0,
  note       TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_course ON sessions(course_id);
