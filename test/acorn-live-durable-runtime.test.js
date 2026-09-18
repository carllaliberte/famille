import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { selectLiveDatabaseAdapter, createLiveDatabase, now } from "../live/database.mjs";
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

async function withServer(fn) {
  const dir = mkdtempSync(join(tmpdir(), "acorn-live-http-"));
  const path = join(dir, "state.db");
  const db = await createLiveDatabase({ env: dbEnv(path), path });
  const { server } = await createLiveServer({ env: dbEnv(path), db });
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
    const run = await jsonReq(base, "/api/v1/runtime/run", { method: "POST", token: auth.json.token, body: { request_id: "r1", problem: "x", human_authorized: true } });
    assert.equal(run.json.run.human_authorized, false);
    assert.equal(run.json.proof.external_effect, false);
  });
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
