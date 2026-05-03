CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  description TEXT,
  permissions TEXT[]
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  photo_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  installed_apps JSONB DEFAULT '{}'::jsonb,
  roles TEXT[] DEFAULT '{}',
  email_verified BOOLEAN DEFAULT false,
  created_at BIGINT,
  updated_at BIGINT,
  password_hash TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  to_uid TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT,
  created_at BIGINT,
  read BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  type TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at BIGINT
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  uid TEXT REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT,
  last_seen BIGINT,
  is_current BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  uid TEXT REFERENCES users(id) ON DELETE CASCADE,
  ip TEXT,
  user_agent TEXT,
  created_at BIGINT,
  ended_at BIGINT
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  support_email TEXT,
  allowed_regions TEXT[]
);
