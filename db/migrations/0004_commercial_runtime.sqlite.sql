CREATE TABLE IF NOT EXISTS stripe_events (
  event_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  stripe_created INTEGER,
  payload TEXT NOT NULL,
  signature_valid INTEGER NOT NULL,
  processing_state TEXT NOT NULL,
  processed_at TEXT,
  tenant_id TEXT,
  order_id TEXT,
  provenance TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stripe_events_state ON stripe_events(processing_state, created_at);
CREATE INDEX IF NOT EXISTS idx_stripe_events_tenant ON stripe_events(tenant_id);

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
  paid_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON commercial_orders(tenant_id, state);
CREATE INDEX IF NOT EXISTS idx_orders_project ON commercial_orders(tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_orders_checkout ON commercial_orders(stripe_checkout_id);

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
  payload TEXT NOT NULL,
  measured_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ledger_tenant ON economic_ledger(tenant_id, measured_at);
CREATE INDEX IF NOT EXISTS idx_ledger_event ON economic_ledger(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_ledger_order ON economic_ledger(order_id);

CREATE TABLE IF NOT EXISTS usage_rights (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  project_id TEXT,
  order_id TEXT,
  product TEXT NOT NULL,
  product_version TEXT NOT NULL,
  rights TEXT NOT NULL,
  duration TEXT,
  scope TEXT,
  conditions TEXT,
  granted_at TEXT,
  valid_until TEXT,
  state TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rights_tenant ON usage_rights(tenant_id, state);
