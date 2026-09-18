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
  usage_rights TEXT NOT NULL DEFAULT '[]',
  data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
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
  data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS acorn_stripe_events(
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  type TEXT NOT NULL,
  class TEXT NOT NULL,
  livemode INTEGER NOT NULL DEFAULT 0,
  signature_verified INTEGER NOT NULL DEFAULT 0,
  processing_state TEXT NOT NULL,
  payload TEXT NOT NULL,
  result TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
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
  payload TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_commerce_offers_tenant ON acorn_commerce_offers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_commerce_orders_tenant ON acorn_commerce_orders(tenant_id, payment_state);
CREATE INDEX IF NOT EXISTS idx_stripe_events_tenant ON acorn_stripe_events(tenant_id, processing_state);
CREATE INDEX IF NOT EXISTS idx_economic_entries_tenant ON acorn_economic_entries(tenant_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_economic_entries_event ON acorn_economic_entries(stripe_event_id) WHERE stripe_event_id IS NOT NULL;
