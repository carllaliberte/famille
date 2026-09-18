/** ACORN LIVE — deterministic schema migrations.
 * Production schema is not ad-hoc CREATE TABLE inside route handlers.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MIGRATION_DIR = join(dirname(fileURLToPath(import.meta.url)), "../db/migrations");

export function listMigrations(mode) {
  const suffix = mode === "postgres" ? ".postgres.sql" : ".sqlite.sql";
  return readdirSync(MIGRATION_DIR)
    .filter((name) => name.endsWith(suffix))
    .sort()
    .map((name) => ({
      id: name.replace(suffix, ""),
      name,
      sql: readFileSync(join(MIGRATION_DIR, name), "utf8")
    }));
}

async function ensureMigrationTable(db) {
  if (db.mode === "postgres") {
    await db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL)");
  } else {
    await db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
  }
}

export async function applyMigrations(db) {
  if (!db?.exec) throw new Error("MIGRATION_EXEC_REQUIRED");
  await ensureMigrationTable(db);
  const appliedRows = await db.all("SELECT id FROM schema_migrations");
  const applied = new Set((appliedRows || []).map((row) => row.id));
  const ran = [];
  for (const file of listMigrations(db.mode)) {
    if (applied.has(file.id)) continue;
    try {
      await db.exec(file.sql);
    } catch (error) {
      const text = String(error?.message || error);
      if (db.mode === "sqlite" && /duplicate column name/i.test(text)) {
        /* repeatable local compat */
      } else {
        throw error;
      }
    }
    await db.run("INSERT INTO schema_migrations(id, applied_at) VALUES($1,$2)", [file.id, new Date().toISOString()]);
    ran.push(file.id);
  }
  return { mode: db.mode, applied: ran, total: listMigrations(db.mode).length };
}
