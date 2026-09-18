CREATE TABLE IF NOT EXISTS acorn_idempotency(
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  connector_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(tenant_id, connector_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_acorn_idempotency_tenant ON acorn_idempotency(tenant_id, connector_id);
