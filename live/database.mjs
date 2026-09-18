/** ACORN LIVE — durable database adapter.
 * PostgreSQL is the production backend when DATABASE_URL is present.
 * SQLite is an explicit local/test adapter only. Production never falls back silently.
 * Schema (via live/migrate.mjs): customers, sessions, requests, events,
 * acorn_state, acorn_events, acorn_evidence, acorn_jobs, schema_migrations,
 * idempotency_keys, stripe_events, commercial_orders, economic_ledger, usage_rights.
 */
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { applyMigrations } from "./migrate.mjs";

async function loadPgPool() {
  try {
    const mod = await import("pg");
    const Pool = (mod.default || mod).Pool;
    if (typeof Pool !== "function") throw new Error("POSTGRES_UNAVAILABLE");
    return Pool;
  } catch (error) {
    if (String(error?.message || error) === "POSTGRES_UNAVAILABLE") throw error;
    throw new Error("POSTGRES_UNAVAILABLE");
  }
}

export function adaptPgToSqlite(sql, params = []) {
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
  if (adapter === "sqlite") {
    if (nodeEnv === "production" && String(env.ACORN_ALLOW_SQLITE_IN_PRODUCTION || "") !== "1") {
      throw new Error("SQLITE_FORBIDDEN_IN_PRODUCTION");
    }
    return { mode: "sqlite", url: null };
  }
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

function wrapPostgres(pool) {
  const api = (client) => ({
    mode: "postgres",
    async health() { await client.query("SELECT 1"); return true; },
    async exec(sql) { await client.query(sql); },
    async get(sql, p = []) { const r = await client.query(sql, p); return r.rows[0] || null; },
    async all(sql, p = []) { const r = await client.query(sql, p); return r.rows; },
    async run(sql, p = []) { return client.query(sql, p); },
    async query(sql, p = []) { return client.query(sql, p); }
  });
  const db = {
    ...api(pool),
    pool,
    async close() { await pool.end(); },
    async tx(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await fn(api(client));
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    }
  };
  return db;
}

function wrapSqlite(native, path) {
  const runAdapted = (sql, p = []) => {
    const q = adaptPgToSqlite(sql, p);
    return native.prepare(q.sql).run(...q.params);
  };
  const db = {
    mode: "sqlite",
    path,
    async health() { native.prepare("SELECT 1").get(); return true; },
    async close() { native.close(); },
    async exec(sql) { native.exec(sql); },
    async get(sql, p = []) { const q = adaptPgToSqlite(sql, p); return native.prepare(q.sql).get(...q.params) || null; },
    async all(sql, p = []) { const q = adaptPgToSqlite(sql, p); return native.prepare(q.sql).all(...q.params); },
    async run(sql, p = []) { return runAdapted(sql, p); },
    async tx(fn) {
      native.exec("BEGIN");
      try {
        const result = await fn(db);
        native.exec("COMMIT");
        return result;
      } catch (error) {
        native.exec("ROLLBACK");
        throw error;
      }
    }
  };
  return db;
}

export async function createLiveDatabase(options = {}) {
  const env = options.env || process.env;
  const selected = selectLiveDatabaseAdapter(env);
  if (selected.mode === "postgres") {
    const Pool = await loadPgPool();
    const pool = new Pool({
      connectionString: selected.url,
      max: Number(env.DB_POOL_MAX || 5),
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000
    });
    const db = wrapPostgres(pool);
    try {
      await applyMigrations(db);
    } catch (error) {
      await pool.end().catch(() => {});
      const msg = String(error?.message || error);
      if (msg === "POSTGRES_UNAVAILABLE" || msg === "MIGRATION_FAILED") throw error;
      throw new Error("POSTGRES_UNAVAILABLE");
    }
    return db;
  }
  const path = options.path || resolve(env.ACORN_DB || "./live/acorn-live.db");
  mkdirSync(dirname(path), { recursive: true });
  const native = new DatabaseSync(path);
  native.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;");
  const db = wrapSqlite(native, path);
  await applyMigrations(db);
  return db;
}

export const now = () => new Date().toISOString();
export const makeId = (p) => p + "_" + crypto.randomUUID();
