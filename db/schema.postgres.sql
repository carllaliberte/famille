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
  claim TEXT NOT NULL,
  source TEXT NOT NULL,
  kind TEXT NOT NULL,
  strength DOUBLE PRECISION NOT NULL,
  margin DOUBLE PRECISION NOT NULL,
  valid_until TIMESTAMPTZ,
  status TEXT NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_acorn_evidence_tenant ON acorn_evidence(tenant_id);
