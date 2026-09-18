import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLiveDatabase } from "../live/database.mjs";
import { startLiveServer } from "../live/server.mjs";
import { runSyntheticExecution } from "../scripts/acorn-execution-fabric.mjs";
import { registerEvidence, evidenceIsCurrent } from "../scripts/acorn-evidence-registry.mjs";
import { createConnectorExecutor, executeConnector } from "../scripts/acorn-connector-execution-fabric.mjs";

function envFor(path) {
  return { ACORN_DB_ADAPTER: "sqlite", ACORN_DB: path, NODE_ENV: "test", HOST: "127.0.0.1", PORT: "0" };
}

async function jsonReq(base, path, { method = "GET", token, body } = {}) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = "Bearer " + token;
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, json: await res.json() };
}

test("physical end-to-end customer runtime", async () => {
  const dir = mkdtempSync(join(tmpdir(), "acorn-e2e-"));
  const path = join(dir, "state.db");
  const env = envFor(path);
  const started = await startLiveServer({ env });
  const base = `http://127.0.0.1:${started.port}`;
  try {
    const health = await jsonReq(base, "/healthz");
    assert.equal(health.json.ok, true);
    assert.notEqual(health.json.status, "LIVE");
    const ready = await jsonReq(base, "/readyz");
    assert.equal(ready.json.ok, true);

    const created = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "E2E", email: "e2e@example.com", password: "correct-horse" } });
    assert.equal(created.status, 201);
    const token = created.json.token;
    const login = await jsonReq(base, "/api/v1/login", { method: "POST", body: { email: "e2e@example.com", password: "correct-horse" } });
    assert.equal(login.status, 200);

    const submitted = await jsonReq(base, "/api/v1/requests", { method: "POST", token, body: { request: "Need a measured intake for a real customer problem" } });
    assert.equal(submitted.status, 201);
    assert.equal(submitted.json.proof.live, false);
    assert.equal(submitted.json.proof.delivered, false);
    const requestId = submitted.json.request.id;

    const read = await jsonReq(base, "/api/v1/requests/" + requestId, { token });
    assert.equal(read.status, 200);
    assert.equal(read.json.request.id, requestId);
    assert.equal(read.json.project.id, requestId);

    const plan = await jsonReq(base, "/api/v1/runtime/plan", { method: "POST", token, body: { request_id: requestId, problem: "Need a measured intake for a real customer problem" } });
    assert.equal(plan.status, 201);
    assert.equal(plan.json.proof.external_effect, false);
    assert.equal(plan.json.plan.authority.human_required, true);

    const blocked = await jsonReq(base, "/api/v1/connectors/execute", { method: "POST", token, body: { request_id: requestId, connection_id: "crm", provider: "example", kind: "crm", human_authorized: true } });
    assert.equal(blocked.status, 403);
    assert.equal(blocked.json.result.state, "BLOCKED");
    assert.equal(blocked.json.result.reason, "HUMAN_AUTHORIZATION_REQUIRED");

    const synthetic = runSyntheticExecution({ projectId: requestId, authorized: false });
    assert.equal(synthetic.authorized, false);
    assert.ok(synthetic.tasks.some((t) => t.state === "BLOCKED") || synthetic.state === "AWAITING_AUTHORIZATION");

    const evidence = submitted.json.evidence;
    assert.equal(evidence.claim, "request_persisted");
    assert.equal(evidence.status, "MEASURED");
    assert.equal(evidenceIsCurrent(registerEvidence({ claim: "LIVE", source: "local", strength: 0, margin: 0 })), false);

    const other = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "Other", email: "other-e2e@example.com", password: "correct-horse" } });
    const leak = await jsonReq(base, "/api/v1/requests/" + requestId, { token: other.json.token });
    assert.equal(leak.status, 404);
  } finally {
    started.server.close();
    await started.db.close();
  }

  const restarted = await createLiveDatabase({ env, path });
  try {
    const row = await restarted.get("SELECT id,status FROM requests WHERE id LIKE $1", ["req_%"]);
    assert.ok(row);
    assert.equal(row.status, "HOLD_HUMAN_AUTHORIZATION");
    const project = await restarted.get("SELECT entity,tenant_id FROM acorn_state WHERE entity=$1", ["PROJECT"]);
    assert.equal(project.entity, "PROJECT");
  } finally {
    await restarted.close();
  }

  const authorized = await executeConnector(
    createConnectorExecutor({ connection: { id: "crm" }, execute: async () => ({ ok: true }) }),
    { task: { id: "t" }, authorized: true }
  );
  assert.equal(authorized.state, "SUCCEEDED");
  assert.equal(authorized.external_effect_claimed, false);
});
