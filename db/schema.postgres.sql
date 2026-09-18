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
CREATE TABLE IF NOT EXISTS acorn_idempotency(
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
CREATE TABLE IF NOT EXISTS acorn_commerce_offers(
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  project_id TEXT,
  catalog_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  currency TEXT NOT NULL,
  unit_amount INTEGER,
  price_source TEXT NOT NULL DEFAULT 'SERVER_CATALOG',
  terms TEXT NOT NULL,
  usage_rights JSONB NOT NULL DEFAULT '[]'::jsonb,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS acorn_commerce_orders(
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  project_id TEXT,
  offer_id TEXT NOT NULL,
  offer_version INTEGER,
  currency TEXT,
  unit_amount INTEGER,
  payment_state TEXT NOT NULL DEFAULT 'UNPAID',
  stage TEXT NOT NULL DEFAULT 'ORDER',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS acorn_stripe_events(
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  type TEXT NOT NULL,
  class TEXT NOT NULL,
  livemode INTEGER NOT NULL DEFAULT 0,
  signature_verified INTEGER NOT NULL DEFAULT 0,
  processing_state TEXT NOT NULL,
  payload JSONB NOT NULL,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS acorn_economic_entries(
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  customer_id TEXT,
  project_id TEXT,
  order_id TEXT,
  offer_id TEXT,
  stripe_event_id TEXT,
  stripe_object_id TEXT,
  currency TEXT,
  gross INTEGER,
  fee INTEGER,
  net INTEGER,
  tax INTEGER,
  status TEXT NOT NULL,
  reconciliation TEXT NOT NULL DEFAULT 'UNRECONCILED',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_commerce_offers_tenant ON acorn_commerce_offers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_commerce_orders_tenant ON acorn_commerce_orders(tenant_id, payment_state);
CREATE INDEX IF NOT EXISTS idx_stripe_events_tenant ON acorn_stripe_events(tenant_id, processing_state);
CREATE INDEX IF NOT EXISTS idx_economic_entries_tenant ON acorn_economic_entries(tenant_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_economic_entries_event ON acorn_economic_entries(stripe_event_id) WHERE stripe_event_id IS NOT NULL;
