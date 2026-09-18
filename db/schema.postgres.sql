-- ACORN LIVE + durable enterprise state. PostgreSQL production schema.
-- Customer runtime tables and enterprise records share one database.

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  body JSONB NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS acorn_state (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  state TEXT NOT NULL,
  tenant_id TEXT,
  provenance TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_acorn_state_tenant_entity ON acorn_state(tenant_id,entity);
CREATE INDEX IF NOT EXISTS idx_acorn_state_updated ON acorn_state(updated_at);

CREATE TABLE IF NOT EXISTS acorn_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  entity_id TEXT,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  actor TEXT NOT NULL,
  authority TEXT NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_acorn_events_entity ON acorn_events(tenant_id,entity_id);
CREATE INDEX IF NOT EXISTS idx_acorn_events_time ON acorn_events(measured_at);

CREATE TABLE IF NOT EXISTS acorn_evidence (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  request_id TEXT,
  claim TEXT,
  source TEXT,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  origin TEXT,
  measured_at TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ,
  strength DOUBLE PRECISION NOT NULL DEFAULT 0,
  margin DOUBLE PRECISION NOT NULL DEFAULT 0,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_acorn_evidence_tenant ON acorn_evidence(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evidence_request ON acorn_evidence(request_id, measured_at);

CREATE TABLE IF NOT EXISTS acorn_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  state TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  worker_id TEXT,
  result JSONB,
  error TEXT,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_acorn_jobs_claim ON acorn_jobs(state, created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_customer ON sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_requests_customer ON requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_events_request ON events(request_id);
