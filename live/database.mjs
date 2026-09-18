/** ACORN LIVE — durable database adapter.
 * PostgreSQL is the production backend when DATABASE_URL is present.
 * SQLite is an explicit local/test adapter only. Production never falls back silently.
 */
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import pg from "pg";

const { Pool } = pg;

const postgresSchema = `
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
`;

const sqliteSchema = `
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS customers(
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions(
  token_hash TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS requests(
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS acorn_state(
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  state TEXT NOT NULL,
  tenant_id TEXT,
  provenance TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS acorn_events(
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  entity_id TEXT,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  actor TEXT NOT NULL,
  authority TEXT NOT NULL,
  measured_at TEXT NOT NULL
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
  measured_at TEXT NOT NULL,
  valid_until TEXT,
  strength REAL NOT NULL DEFAULT 0,
  margin REAL NOT NULL DEFAULT 0,
  confidence REAL NOT NULL DEFAULT 0,
  payload TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_sessions_customer ON sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_requests_customer ON requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_events_request ON events(request_id);
CREATE INDEX IF NOT EXISTS idx_evidence_request ON acorn_evidence(request_id, measured_at);
CREATE INDEX IF NOT EXISTS idx_evidence_tenant ON acorn_evidence(tenant_id);
CREATE INDEX IF NOT EXISTS idx_acorn_state_tenant_entity ON acorn_state(tenant_id, entity);
CREATE INDEX IF NOT EXISTS idx_acorn_events_entity ON acorn_events(tenant_id, entity_id);
`;

const postgresAlters = [
  "ALTER TABLE acorn_evidence ADD COLUMN IF NOT EXISTS tenant_id TEXT",
  "ALTER TABLE acorn_evidence ADD COLUMN IF NOT EXISTS request_id TEXT",
  "ALTER TABLE acorn_evidence ADD COLUMN IF NOT EXISTS claim TEXT",
  "ALTER TABLE acorn_evidence ADD COLUMN IF NOT EXISTS source TEXT",
  "ALTER TABLE acorn_evidence ADD COLUMN IF NOT EXISTS origin TEXT",
  "ALTER TABLE acorn_evidence ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ",
  "ALTER TABLE acorn_evidence ADD COLUMN IF NOT EXISTS strength DOUBLE PRECISION DEFAULT 0",
  "ALTER TABLE acorn_evidence ADD COLUMN IF NOT EXISTS margin DOUBLE PRECISION DEFAULT 0",
  "ALTER TABLE acorn_evidence ADD COLUMN IF NOT EXISTS confidence DOUBLE PRECISION DEFAULT 0",
  "ALTER TABLE acorn_evidence ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb"
];

function sqliteAlterStatements() {
  return [
    "ALTER TABLE acorn_evidence ADD COLUMN tenant_id TEXT",
    "ALTER TABLE acorn_evidence ADD COLUMN request_id TEXT",
    "ALTER TABLE acorn_evidence ADD COLUMN claim TEXT",
    "ALTER TABLE acorn_evidence ADD COLUMN source TEXT",
    "ALTER TABLE acorn_evidence ADD COLUMN origin TEXT",
    "ALTER TABLE acorn_evidence ADD COLUMN valid_until TEXT",
    "ALTER TABLE acorn_evidence ADD COLUMN strength REAL DEFAULT 0",
    "ALTER TABLE acorn_evidence ADD COLUMN margin REAL DEFAULT 0",
    "ALTER TABLE acorn_evidence ADD COLUMN confidence REAL DEFAULT 0",
    "ALTER TABLE acorn_evidence ADD COLUMN payload TEXT DEFAULT '{}'"
  ];
}

function adaptPgToSqlite(sql, params = []) {
  const indexes = [];
  const converted = sql.replace(/\$(\d+)/g, (_, n) => {
    indexes.push(Number(n) - 1);
    return "?";
  });
  return { sql: converted, params: indexes.map((i) => params[i]) };
}

export function selectLiveDatabaseAdapter(env = process.env) {
  const url = String(env.DATABASE_URL || "").trim();
  const adapter = String(env.ACORN_DB_ADAPTER || "").trim().toLowerCase();
  const nodeEnv = String(env.NODE_ENV || "").trim().toLowerCase();
  if (adapter === "sqlite") return { mode: "sqlite", url: null };
  if (adapter === "postgres") {
    if (!url) throw new Error("DATABASE_URL_REQUIRED");
    return { mode: "postgres", url };
  }
  if (url) return { mode: "postgres", url };
  if (nodeEnv === "production") throw new Error("DATABASE_URL_REQUIRED");
  return { mode: "sqlite", url: null };
}

export function parseJson(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(String(value)); } catch { return fallback; }
}

export function encodeJson(mode, value) {
  if (value == null) return mode === "postgres" ? {} : "{}";
  if (mode === "postgres") return typeof value === "string" ? parseJson(value, {}) : value;
  return typeof value === "string" ? value : JSON.stringify(value);
}

export async function createLiveDatabase(options = {}) {
  const env = options.env || process.env;
  const selected = selectLiveDatabaseAdapter(env);
  if (selected.mode === "postgres") {
    const pool = new Pool({
      connectionString: selected.url,
      max: Number(env.DB_POOL_MAX || 5),
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000
    });
    try {
      await pool.query(postgresSchema);
      for (const sql of postgresAlters) {
        await pool.query(sql);
      }
    } catch (error) {
      await pool.end().catch(() => {});
      throw new Error("POSTGRES_UNAVAILABLE");
    }
    return {
      mode: "postgres",
      async health() { await pool.query("SELECT 1"); return true; },
      async close() { await pool.end(); },
      async get(sql, p = []) { const r = await pool.query(sql, p); return r.rows[0] || null; },
      async all(sql, p = []) { const r = await pool.query(sql, p); return r.rows; },
      async run(sql, p = []) { return pool.query(sql, p); }
    };
  }
  const path = options.path || resolve(env.ACORN_DB || "./live/acorn-live.db");
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(sqliteSchema);
  for (const sql of sqliteAlterStatements()) {
    try { db.exec(sql); } catch { /* column already present on existing local files */ }
  }
  return {
    mode: "sqlite",
    path,
    async health() { db.prepare("SELECT 1").get(); return true; },
    async close() { db.close(); },
    async get(sql, p = []) { const q = adaptPgToSqlite(sql, p); return db.prepare(q.sql).get(...q.params) || null; },
    async all(sql, p = []) { const q = adaptPgToSqlite(sql, p); return db.prepare(q.sql).all(...q.params); },
    async run(sql, p = []) { const q = adaptPgToSqlite(sql, p); return db.prepare(q.sql).run(...q.params); }
  };
}

export const now = () => new Date().toISOString();
export const makeId = (p) => p + "_" + crypto.randomUUID();
