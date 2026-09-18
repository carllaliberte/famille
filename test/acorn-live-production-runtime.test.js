import test from "node:test";
import assert from "node:assert/strict";
import { selectLiveDatabaseAdapter } from "../live/database.mjs";

test("production runtime contract", () => {
  assert.equal(typeof process.env.NODE_ENV, "string");
  assert.ok("postgres".length > 0);
});

test("production refuses silent sqlite fallback", () => {
  assert.throws(() => selectLiveDatabaseAdapter({ NODE_ENV: "production" }), /DATABASE_URL_REQUIRED/);
  assert.equal(selectLiveDatabaseAdapter({ NODE_ENV: "production", DATABASE_URL: "postgres://example.invalid/db" }).mode, "postgres");
});
