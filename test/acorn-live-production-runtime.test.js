import test from "node:test";
import assert from "node:assert/strict";
import { selectLiveDatabaseAdapter } from "../live/database.mjs";

test("production runtime contract", () => {
  assert.equal(typeof process.env.NODE_ENV, "string");
  assert.ok("postgres".length > 0);
});

test("production refuses silent sqlite fallback", () => {
  assert.throws(() => selectLiveDatabaseAdapter({ NODE_ENV: "production" }), /DATABASE_URL_REQUIRED/);
  assert.throws(() => selectLiveDatabaseAdapter({ NODE_ENV: "production", ACORN_DB_ADAPTER: "sqlite" }), /SQLITE_FORBIDDEN_IN_PRODUCTION/);
  assert.equal(selectLiveDatabaseAdapter({ NODE_ENV: "production", DATABASE_URL: "postgres://example.invalid/db" }).mode, "postgres");
  assert.equal(selectLiveDatabaseAdapter({ NODE_ENV: "test", ACORN_DB_ADAPTER: "sqlite" }).mode, "sqlite");
  assert.equal(selectLiveDatabaseAdapter({ NODE_ENV: "production", ACORN_DB_ADAPTER: "sqlite", ACORN_ALLOW_SQLITE_IN_PRODUCTION: "1" }).mode, "sqlite");
});
