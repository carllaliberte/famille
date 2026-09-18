import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { selectLiveDatabaseAdapter, createLiveDatabase, now } from "../live/database.mjs";
import { applyMigrations, listMigrations } from "../live/migrate.mjs";
import { assessRuntimeStatus, localFactsCannotProve, RUNTIME_STATES } from "../live/runtime-status.mjs";
import { persistState, persistEvidence, loadTenantState, loadTenantEvidence, getTenantState } from "../live/enterprise-store.mjs";
import { registerEvidence, evidenceIsCurrent, proofGate } from "../scripts/acorn-evidence-registry.mjs";
import { createConnectorExecutor, executeConnector } from "../scripts/acorn-connector-execution-fabric.mjs";
import { createLiveServer } from "../live/server.mjs";
import { assertCapabilityAuthoritySeparation } from "../scripts/acorn-constitution.mjs";

function dbEnv(path) {
  return { ACORN_DB_ADAPTER: "sqlite", ACORN_DB: path, NODE_ENV: "test" };
}

async function withDb(fn) {
  const dir = mkdtempSync(join(tmpdir(), "acorn-live-"));
  const path = join(dir, "state.db");
  const db = await createLiveDatabase({ env: dbEnv(path), path });
  try { return await fn(db, path); }
  finally { await db.close(); }
}

async function withServer(fn, extraEnv = {}) {
  const dir = mkdtempSync(join(tmpdir(), "acorn-live-http-"));
  const path = join(dir, "state.db");
  const env = { ...dbEnv(path), ...extraEnv };
  const db = await createLiveDatabase({ env, path });
  const { server } = await createLiveServer({ env, db });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  try { return await fn({ base, db, port }); }
  finally {
    await new Promise((resolve) => server.close(resolve));
    await db.close();
  }
}

async function jsonReq(base, path, { method = "GET", token, body } = {}) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = "Bearer " + token;
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await res.json();
  return { status: res.status, json, headers: res.headers };
}

test("local sqlite adapter is selected only when explicit or non-production", () => {
  assert.equal(selectLiveDatabaseAdapter({ ACORN_DB_ADAPTER: "sqlite" }).mode, "sqlite");
  assert.equal(selectLiveDatabaseAdapter({ NODE_ENV: "test" }).mode, "sqlite");
  assert.equal(selectLiveDatabaseAdapter({}).mode, "sqlite");
});

test("PostgreSQL adapter is selected when DATABASE_URL is configured", () => {
  const selected = selectLiveDatabaseAdapter({ DATABASE_URL: "postgres://acorn:acorn@example.invalid:5432/acorn" });
  assert.equal(selected.mode, "postgres");
  assert.equal(selected.url.startsWith("postgres://"), true);
});

test("production configuration does not silently fall back to local SQLite", () => {
  assert.throws(() => selectLiveDatabaseAdapter({ NODE_ENV: "production" }), /DATABASE_URL_REQUIRED/);
  assert.throws(() => selectLiveDatabaseAdapter({ NODE_ENV: "production", ACORN_DB: "./live/acorn-live.db" }), /DATABASE_URL_REQUIRED/);
  assert.throws(() => selectLiveDatabaseAdapter({ ACORN_DB_ADAPTER: "postgres" }), /DATABASE_URL_REQUIRED/);
  assert.equal(selectLiveDatabaseAdapter({ NODE_ENV: "production", ACORN_DB_ADAPTER: "sqlite" }).mode, "sqlite");
});

test("postgres connection failure does not fall back to sqlite", async () => {
  await assert.rejects(
    () => createLiveDatabase({ env: { NODE_ENV: "production", DATABASE_URL: "postgres://acorn:acorn@127.0.0.1:1/acorn" } }),
    (err) => {
      assert.equal(String(err?.message || err), "POSTGRES_UNAVAILABLE");
      return true;
    }
  );
});

test("persisted customer/request/event/enterprise state survives a new process against the same database", async () => {
  const dir = mkdtempSync(join(tmpdir(), "acorn-persist-"));
  const path = join(dir, "state.db");
  const first = await createLiveDatabase({ env: dbEnv(path), path });
  await first.run("INSERT INTO customers(id,email,name,password_hash,created_at) VALUES($1,$2,$3,$4,$5)", ["cus_1", "a@example.com", "A", "x:y", now()]);
  await first.run("INSERT INTO requests(id,customer_id,body,status,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6)", ["req_1", "cus_1", "{\"request\":\"hello\"}", "HOLD_HUMAN_AUTHORIZATION", now(), now()]);
  await persistState(first, { entity: "PROJECT", id: "req_1", tenant_id: "cus_1", state: "HOLD_HUMAN_AUTHORIZATION", data: { request_id: "req_1" } });
  await persistEvidence(first, { tenantId: "cus_1", claim: "request_persisted", source: "acorn-live", kind: "OBSERVATION", strength: 1, margin: 0.1, validUntil: new Date(Date.now() + 86400000).toISOString() }, "req_1");
  await first.close();
  const second = await createLiveDatabase({ env: dbEnv(path), path });
  try {
    const customer = await second.get("SELECT email FROM customers WHERE id=$1", ["cus_1"]);
    const request = await second.get("SELECT status FROM requests WHERE id=$1", ["req_1"]);
    const project = await getTenantState(second, "req_1", "cus_1");
    const evidence = await loadTenantEvidence(second, "cus_1");
    assert.equal(customer.email, "a@example.com");
    assert.equal(request.status, "HOLD_HUMAN_AUTHORIZATION");
    assert.equal(project.entity, "PROJECT");
    assert.equal(evidence.length, 1);
    assert.equal(evidence[0].claim, "request_persisted");
  } finally {
    await second.close();
  }
});

test("tenant isolation rejects cross-tenant access", async () => {
  await withDb(async (db) => {
    await persistState(db, { entity: "PROJECT", id: "p1", tenant_id: "t1", state: "INTAKE", data: { secret: "alpha" } });
    await persistState(db, { entity: "PROJECT", id: "p2", tenant_id: "t2", state: "INTAKE", data: { secret: "beta" } });
    const t1 = await loadTenantState(db, "t1");
    assert.equal(t1.length, 1);
    assert.equal(t1[0].id, "p1");
    assert.equal(await getTenantState(db, "p2", "t1"), null);
  });
});

test("expired sessions fail and invalid credentials fail", async () => {
  await withServer(async ({ base, db }) => {
    const created = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "Ada", email: "ada@example.com", password: "correct-horse" } });
    assert.equal(created.status, 201);
    const bad = await jsonReq(base, "/api/v1/login", { method: "POST", body: { email: "ada@example.com", password: "wrong-password" } });
    assert.equal(bad.status, 401);
    assert.equal(bad.json.error, "INVALID_CREDENTIALS");
    await db.run("UPDATE sessions SET expires_at=$1 WHERE customer_id=$2", [new Date(Date.now() - 1000).toISOString(), created.json.customer.id]);
    const expired = await jsonReq(base, "/api/v1/me", { token: created.json.token });
    assert.equal(expired.status, 401);
  });
});

test("unauthorized connector execution remains BLOCKED", async () => {
  const executor = createConnectorExecutor({ connection: { id: "crm" }, execute: async () => ({ ok: true }) });
  const blocked = await executeConnector(executor, { task: {}, authorized: false });
  assert.equal(blocked.state, "BLOCKED");
  await withServer(async ({ base }) => {
    const auth = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "Bo", email: "bo@example.com", password: "correct-horse" } });
    const spoof = await jsonReq(base, "/api/v1/connectors/execute", { method: "POST", token: auth.json.token, body: { connection_id: "crm", provider: "example", kind: "crm", human_authorized: true } });
    assert.equal(spoof.status, 403);
    assert.equal(spoof.json.result.state, "BLOCKED");
    const run = await jsonReq(base, "/api/v1/runtime/run", { method: "POST", token: auth.json.token, body: { problem: "x", human_authorized: true } });
    assert.equal(run.json.run.human_authorized, false);
    assert.equal(run.json.proof.external_effect, false);
  });
});

test("HTTP cannot authorize a consequential real-world effect", async () => {
  const connectors = JSON.stringify([{ id: "pay", provider: "example", base_url: "https://example.invalid/", effect: "MONEY", credential_env: "ACORN_TEST_SECRET" }]);
  await withServer(async ({ base }) => {
    const auth = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "Pay", email: "pay@example.com", password: "correct-horse" } });
    const created = await jsonReq(base, "/api/v1/requests", { method: "POST", token: auth.json.token, body: { request: "pay something" } });
    const listed = await jsonReq(base, "/api/v1/real-world", { token: auth.json.token });
    assert.equal(listed.status, 200);
    assert.equal(listed.json.proof.connected, false);
    assert.equal(listed.json.proof.live, false);
    const spoof = await jsonReq(base, "/api/v1/runtime/external", { method: "POST", token: auth.json.token, body: { request_id: created.json.request.id, connector_id: "pay", path: "charges", method: "POST", body: { amount: 1 }, human_authorized: true } });
    assert.equal(spoof.status, 403);
    assert.equal(spoof.json.result.state, "BLOCKED");
    assert.equal(spoof.json.result.reason, "HUMAN_AUTHORIZATION_REQUIRED");
    assert.equal(spoof.json.proof.client_authorization_ignored, true);
    assert.equal(spoof.json.proof.http_cannot_grant_authority, true);
    assert.equal(JSON.stringify(spoof.json).includes("not-a-real-secret"), false);
  }, { ACORN_REAL_WORLD_CONNECTORS: connectors, ACORN_TEST_SECRET: "not-a-real-secret" });
});

test("HTTP runtime/external ignores client authority routing and unknown connectors", async () => {
  const connectors = JSON.stringify([
    { id: "pay", provider: "example", base_url: "https://example.invalid/api/", effect: "WRITE", credential_env: "ACORN_TEST_SECRET" },
    { id: "read", provider: "example", base_url: "https://example.invalid/api/", effect: "READ" }
  ]);
  await withServer(async ({ base }) => {
    const auth = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "Ext", email: "ext@example.com", password: "correct-horse" } });
    const created = await jsonReq(base, "/api/v1/requests", { method: "POST", token: auth.json.token, body: { request: "external probe" } });
    const requestId = created.json.request.id;
    const token = auth.json.token;
    for (const effect of ["WRITE", "MONEY", "PUBLISH", "SIGN", "DELETE", "MERGE"]) {
      const lockedConnectors = JSON.stringify([{ id: "act", provider: "example", base_url: "https://example.invalid/", effect, credential_env: "ACORN_TEST_SECRET" }]);
      const inner = await withServer(async ({ base: innerBase }) => {
        const a = await jsonReq(innerBase, "/api/v1/register", { method: "POST", body: { name: "Lock", email: `lock-${effect.toLowerCase()}@example.com`, password: "correct-horse" } });
        const r = await jsonReq(innerBase, "/api/v1/requests", { method: "POST", token: a.json.token, body: { request: effect } });
        return jsonReq(innerBase, "/api/v1/runtime/external", {
          method: "POST",
          token: a.json.token,
          body: {
            request_id: r.json.request.id,
            connector_id: "act",
            path: "https://evil.example/x",
            method: "DELETE",
            base_url: "https://evil.example/",
            human_authorized: true,
            authorized: true,
            authority: { source: "server", actor: "carl" },
            body: { amount: 1 }
          }
        });
      }, { ACORN_REAL_WORLD_CONNECTORS: lockedConnectors, ACORN_TEST_SECRET: "not-a-real-secret" });
      assert.equal(inner.status, 403, effect);
      assert.equal(inner.json.result.state, "BLOCKED", effect);
      assert.equal(inner.json.result.reason, "HUMAN_AUTHORIZATION_REQUIRED", effect);
      assert.equal(inner.json.result.human_authorized, false, effect);
    }
    const unknown = await jsonReq(base, "/api/v1/runtime/external", { method: "POST", token, body: { request_id: requestId, connector_id: "not-configured", human_authorized: true } });
    assert.equal(unknown.status, 404);
    assert.equal(unknown.json.error, "CONNECTOR_NOT_CONFIGURED");
    const ssrf = await jsonReq(base, "/api/v1/runtime/external", {
      method: "POST",
      token,
      body: { request_id: requestId, connector_id: "read", path: "https://127.0.0.1/secrets", method: "POST", base_url: "https://127.0.0.1/", human_authorized: true }
    });
    assert.equal(ssrf.status, 403);
    assert.equal(ssrf.json.result.state, "BLOCKED");
    assert.ok(["URL_OUT_OF_SCOPE", "METHOD_NOT_ALLOWED"].includes(ssrf.json.result.reason));
    assert.equal(ssrf.json.proof.external_effect, false);
  }, { ACORN_REAL_WORLD_CONNECTORS: connectors, ACORN_TEST_SECRET: "not-a-real-secret" });
});

test("authorized execution produces a measured record but does not claim external effect", async () => {
  const executor = createConnectorExecutor({ connection: { id: "crm" }, execute: async () => ({ ok: true }) });
  const result = await executeConnector(executor, { task: { id: "t1" }, authorized: true });
  assert.equal(result.state, "SUCCEEDED");
  assert.equal(result.external_effect_claimed, false);
});

test("evidence without valid measurement remains INSUFFICIENT and expired evidence is not current", () => {
  const insufficient = registerEvidence({ claim: "LIVE", source: "local", strength: 0, margin: 0 });
  assert.equal(insufficient.status, "INSUFFICIENT");
  assert.equal(evidenceIsCurrent(insufficient), false);
  assert.equal(proofGate({ evidence: [insufficient] }).ready, false);
  const expired = registerEvidence({ claim: "request_persisted", source: "test", strength: 1, margin: 0.1, validUntil: new Date(Date.now() - 1000).toISOString() });
  assert.equal(expired.status, "MEASURED");
  assert.equal(evidenceIsCurrent(expired), false);
});

test("LIVE/VERIFIED claims cannot be generated solely from local code presence", async () => {
  assert.equal(localFactsCannotProve("LIVE"), true);
  assert.equal(localFactsCannotProve("VERIFIED"), true);
  assert.equal(localFactsCannotProve("EXECUTED"), true);
  const local = assessRuntimeStatus({ processBound: true, dbHealthy: true, evidence: [] });
  assert.equal(local.status, "READY");
  assert.equal(local.live, false);
  assert.equal(local.verified, false);
  assert.equal(RUNTIME_STATES.includes(local.status), true);
  const asserted = registerEvidence({ claim: "LIVE_MEASURED", source: "acorn-live", strength: 1, margin: 0.1, validUntil: new Date(Date.now() + 86400000).toISOString() });
  const spoofed = assessRuntimeStatus({ processBound: true, dbHealthy: true, evidence: [asserted] });
  assert.notEqual(spoofed.status, "LIVE_MEASURED");
  assert.equal(spoofed.live, false);
  await withServer(async ({ base }) => {
    const root = await jsonReq(base, "/");
    assert.equal(root.status, 200);
    assert.notEqual(root.json.status, "LIVE");
    assert.notEqual(root.json.status, "VERIFIED");
    assert.equal(root.json.live, false);
    assert.equal(root.json.verified, false);
    const health = await jsonReq(base, "/healthz");
    assert.equal(health.json.ok, true);
    assert.notEqual(health.json.status, "LIVE");
    assert.equal(String(health.headers.get("x-content-type-options")), "nosniff");
    assert.equal(JSON.stringify(health.json).includes("password"), false);
    assert.equal(JSON.stringify(health.json).includes("token"), false);
  });
});

test("customer request flow persists one project identity and does not claim delivery", async () => {
  await withServer(async ({ base }) => {
    const a = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "A", email: "a@example.com", password: "correct-horse" } });
    const b = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "B", email: "b@example.com", password: "correct-horse" } });
    const created = await jsonReq(base, "/api/v1/requests", { method: "POST", token: a.json.token, body: { request: "Need a measured intake", password: "should-not-store" } });
    assert.equal(created.status, 201);
    assert.equal(created.json.proof.live, false);
    assert.equal(created.json.proof.delivered, false);
    assert.equal(created.json.cycle.stage, "HOLD_HUMAN_AUTHORIZATION");
    const got = await jsonReq(base, "/api/v1/requests/" + created.json.request.id, { token: a.json.token });
    assert.equal(got.json.project.id, created.json.request.id);
    assert.equal(JSON.stringify(got.json).includes("should-not-store"), false);
    const leak = await jsonReq(base, "/api/v1/requests/" + created.json.request.id, { token: b.json.token });
    assert.equal(leak.status, 404);
    const enterprise = await jsonReq(base, "/api/v1/enterprise", { token: b.json.token });
    assert.equal(enterprise.json.projects.count, 0);
    const raw = await fetch(base + "/api/v1/requests", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + a.json.token }, body: "{not json" });
    const rawJson = await raw.json();
    assert.equal(raw.status, 400);
    assert.equal(rawJson.error, "INVALID_JSON");
  });
});

test("existing capability/authority constitution remains intact", () => {
  const r = assertCapabilityAuthoritySeparation();
  assert.equal(r.status, "VERIFIED");
});

test("migrations are deterministic and repeatable", async () => {
  await withDb(async (db) => {
    const listed = listMigrations("sqlite");
    assert.ok(listed.some((row) => row.id === "0001_init"));
    const rows = await db.all("SELECT id FROM schema_migrations");
    assert.ok(rows.some((row) => row.id === "0001_init"));
    const second = await applyMigrations(db);
    assert.deepEqual(second.applied, []);
  });
});

test("logout revokes the session", async () => {
  await withServer(async ({ base }) => {
    const created = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "Ada", email: "ada-logout@example.com", password: "correct-horse" } });
    const out = await jsonReq(base, "/api/v1/logout", { method: "POST", token: created.json.token });
    assert.equal(out.status, 200);
    assert.equal(out.json.revoked, true);
    const me = await jsonReq(base, "/api/v1/me", { token: created.json.token });
    assert.equal(me.status, 401);
  });
});

test("oversized request is rejected", async () => {
  await withServer(async ({ base }) => {
    const created = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "Ada", email: "ada-size@example.com", password: "correct-horse" } });
    const res = await fetch(base + "/api/v1/requests", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + created.json.token },
      body: "{\"request\":\"" + "x".repeat(400) + "\"}"
    });
    const json = await res.json();
    assert.equal(res.status, 413);
    assert.equal(json.error, "BODY_TOO_LARGE");
  }, { MAX_BODY_BYTES: "256" });
});

test("database unavailable is not READY and is not LIVE", async () => {
  const down = {
    mode: "sqlite",
    async health() { throw new Error("down"); },
    async get() { return null; },
    async all() { return []; },
    async run() { return {}; },
    async close() {}
  };
  const { server } = await createLiveServer({ env: { NODE_ENV: "test", ACORN_DB_ADAPTER: "sqlite" }, db: down });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  try {
    const health = await jsonReq(base, "/healthz");
    const ready = await jsonReq(base, "/readyz");
    assert.equal(health.status, 503);
    assert.equal(ready.status, 503);
    assert.notEqual(health.json.status, "LIVE");
    assert.notEqual(health.json.status, "READY");
    assert.equal(health.json.live, false);
    assert.equal(health.json.database, "UNAVAILABLE");
    assert.equal(ready.json.db, false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("tenant cannot plan or execute another tenant request", async () => {
  await withServer(async ({ base }) => {
    const a = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "A", email: "own-a@example.com", password: "correct-horse" } });
    const b = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "B", email: "own-b@example.com", password: "correct-horse" } });
    const created = await jsonReq(base, "/api/v1/requests", { method: "POST", token: a.json.token, body: { request: "A problem" } });
    const plan = await jsonReq(base, "/api/v1/runtime/plan", { method: "POST", token: b.json.token, body: { request_id: created.json.request.id, problem: "steal" } });
    assert.equal(plan.status, 404);
    const run = await jsonReq(base, "/api/v1/runtime/run", { method: "POST", token: b.json.token, body: { request_id: created.json.request.id, human_authorized: true } });
    assert.equal(run.status, 404);
  });
});

test("Dockerfile is production-shaped and does not claim a container measurement", () => {
  const df = readFileSync(new URL("../live/Dockerfile", import.meta.url), "utf8");
  assert.match(df, /USER node/);
  assert.match(df, /NODE_ENV=production/);
  assert.match(df, /live\/server.mjs/);
  assert.match(df, /npm install --omit=dev/);
});

