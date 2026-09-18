CREATE TABLE IF NOT EXISTS customers(
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions(
  token_hash TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS requests(
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  body JSONB NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS events(
  id BIGSERIAL PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS acorn_state(
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
CREATE TABLE IF NOT EXISTS acorn_events(
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  entity_id TEXT,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  actor TEXT NOT NULL,
  authority TEXT NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS acorn_evidence(
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
CREATE TABLE IF NOT EXISTS acorn_jobs(
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
CREATE INDEX IF NOT EXISTS idx_sessions_customer ON sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_requests_customer ON requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_events_request ON events(request_id);
CREATE INDEX IF NOT EXISTS idx_evidence_request ON acorn_evidence(request_id, measured_at);
CREATE INDEX IF NOT EXISTS idx_evidence_tenant ON acorn_evidence(tenant_id);
CREATE INDEX IF NOT EXISTS idx_acorn_state_tenant_entity ON acorn_state(tenant_id, entity);
CREATE INDEX IF NOT EXISTS idx_acorn_events_entity ON acorn_events(tenant_id, entity_id);
CREATE INDEX IF NOT EXISTS idx_acorn_jobs_claim ON acorn_jobs(state, created_at);
CREATE INDEX IF NOT EXISTS idx_acorn_jobs_tenant ON acorn_jobs(tenant_id, state);
CREATE TABLE IF NOT EXISTS idempotency_keys (
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status INTEGER NOT NULL,
  body JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (tenant_id, key)
);
CREATE INDEX IF NOT EXISTS idx_idempotency_created ON idempotency_keys(created_at);
CREATE INDEX IF NOT EXISTS idx_acorn_events_time ON acorn_events(tenant_id, measured_at);
CREATE INDEX IF NOT EXISTS idx_acorn_state_created ON acorn_state(tenant_id, created_at);
CREATE TABLE IF NOT EXISTS stripe_events (
  event_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  stripe_created INTEGER,
  payload JSONB NOT NULL,
  signature_valid INTEGER NOT NULL,
  processing_state TEXT NOT NULL,
  processed_at TIMESTAMPTZ,
  tenant_id TEXT,
  order_id TEXT,
  provenance TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS commercial_orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  offer_id TEXT NOT NULL,
  catalog_id TEXT,
  product_name TEXT,
  model TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  interval TEXT,
  pricing_version TEXT NOT NULL,
  state TEXT NOT NULL,
  stripe_checkout_id TEXT,
  stripe_payment_intent TEXT,
  stripe_customer_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS economic_ledger (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  epistemic TEXT NOT NULL,
  kind TEXT NOT NULL,
  gross_amount INTEGER,
  currency TEXT,
  net_amount INTEGER,
  fees INTEGER,
  taxes INTEGER,
  stripe_customer_id TEXT,
  stripe_object_id TEXT,
  stripe_event_id TEXT,
  customer_id TEXT,
  project_id TEXT,
  order_id TEXT,
  status TEXT NOT NULL,
  reconciliation TEXT NOT NULL,
  source TEXT NOT NULL,
  payload JSONB NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS usage_rights (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  project_id TEXT,
  order_id TEXT,
  product TEXT NOT NULL,
  product_version TEXT NOT NULL,
  rights JSONB NOT NULL,
  duration TEXT,
  scope TEXT,
  conditions JSONB,
  granted_at TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  state TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS acorn_idempotency (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  connector_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE(tenant_id, connector_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_acorn_idempotency_tenant ON acorn_idempotency(tenant_id, connector_id);
