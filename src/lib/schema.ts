/** Esquema SQL compartilhado entre o app e o script de seed. */
export const SCHEMA = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('youth','professional','admin')),
  display_name TEXT NOT NULL,
  birth_year INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS professional_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  profession TEXT NOT NULL,
  registry_number TEXT NOT NULL,
  registry_state TEXT NOT NULL,
  specialties TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  modality TEXT NOT NULL CHECK (modality IN ('online','presencial','ambos')),
  city TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  review_note TEXT NOT NULL DEFAULT '',
  reviewed_at INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS journal_user ON journal_entries(user_id, updated_at);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ai_conv_user ON ai_conversations(user_id, updated_at);

CREATE TABLE IF NOT EXISTS ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  flagged INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ai_msg_conv ON ai_messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS progress (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_path TEXT NOT NULL,
  last_label TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS support_requests (
  id TEXT PRIMARY KEY,
  youth_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  professional_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','accepted','closed','cancelled')),
  response TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS req_youth ON support_requests(youth_id, updated_at);
CREATE INDEX IF NOT EXISTS req_pro ON support_requests(professional_id, updated_at);

CREATE TRIGGER IF NOT EXISTS journal_only_youth BEFORE INSERT ON journal_entries
WHEN (SELECT role FROM users WHERE id = NEW.user_id) IS NOT 'youth'
BEGIN SELECT RAISE(ABORT, 'journal_only_youth'); END;

CREATE TRIGGER IF NOT EXISTS ai_only_youth BEFORE INSERT ON ai_conversations
WHEN (SELECT role FROM users WHERE id = NEW.user_id) IS NOT 'youth'
BEGIN SELECT RAISE(ABORT, 'ai_only_youth'); END;

CREATE TRIGGER IF NOT EXISTS profile_only_professional BEFORE INSERT ON professional_profiles
WHEN (SELECT role FROM users WHERE id = NEW.user_id) IS NOT 'professional'
BEGIN SELECT RAISE(ABORT, 'profile_only_professional'); END;

CREATE TRIGGER IF NOT EXISTS request_rules BEFORE INSERT ON support_requests
WHEN (SELECT role FROM users WHERE id = NEW.youth_id) IS NOT 'youth'
  OR (SELECT status FROM professional_profiles WHERE user_id = NEW.professional_id) IS NOT 'approved'
BEGIN SELECT RAISE(ABORT, 'request_rules'); END;

CREATE TRIGGER IF NOT EXISTS request_owner_fixed BEFORE UPDATE OF youth_id, professional_id ON support_requests
BEGIN SELECT RAISE(ABORT, 'request_owner_fixed'); END;

CREATE TRIGGER IF NOT EXISTS journal_owner_fixed BEFORE UPDATE OF user_id ON journal_entries
BEGIN SELECT RAISE(ABORT, 'journal_owner_fixed'); END;
`;

