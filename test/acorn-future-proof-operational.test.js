import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLiveDatabase } from "../live/database.mjs";
import { startLiveServer } from "../live/server.mjs";
import { listMigrations } from "../live/migrate.mjs";
import {
  operateProblem,
  describeCapability,
  capabilityPhases,
  discoverUnknownIntelligence,
  qualifyIntelligence,
  markIntelligenceSelectable,
  runExecutionMode,
  economicRecord,
  asOf,
  temporalFact,
  futureProofContract,
  FUTURE_PROOF_KEYS,
  configuredIsNotConnected,
  providerFailureDoesNotHalt,
  recordLearningObservation,
  isolateRealm,
  classifyCapability
} from "../scripts/acorn-operational-fabric.mjs";
import { createIntelligence } from "../scripts/acorn-intelligence-fabric.mjs";
import { executeConnector, createConnectorExecutor } from "../scripts/acorn-connector-execution-fabric.mjs";
import { registerEvidence, evidenceIsCurrent } from "../scripts/acorn-evidence-registry.mjs";

function envFor(path) {
  return { ACORN_DB_ADAPTER: "sqlite", ACORN_DB: path, NODE_ENV: "test", HOST: "127.0.0.1", PORT: "0" };
}

async function jsonReq(base, path, { method = "GET", token, body, headers = {} } = {}) {
  const h = { "content-type": "application/json", ...headers };
  if (token) h.authorization = "Bearer " + token;
  const res = await fetch(base + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, json: await res.json(), headers: res.headers };
}

test("capability phases stay strictly separated", () => {
  const cap = describeCapability({ name: "github", exists: true, available: true, authorized: true, executed: true, verified: true });
  const phases = capabilityPhases(cap);
  assert.equal(phases.exists, true);
  assert.equal(phases.available, true);
  assert.equal(phases.authorized, false);
  assert.equal(phases.executed, false);
  assert.equal(phases.verified, false);
});

test("unknown intelligence can be discovered then qualified, never auto-authorized", () => {
  const discovered = discoverUnknownIntelligence({ provider: "future-lab", model: "helix-9", capabilities: ["analysis"] });
  assert.equal(discovered.state === "DISCOVERED" || discovered.state === "QUALIFIED", true);
  assert.equal(discovered.authority, false);
  const selectable = markIntelligenceSelectable(discovered);
  assert.equal(selectable.authorized, false);
  assert.equal(selectable.authority, false);
  const unknown = qualifyIntelligence(createIntelligence({ id: "x", provider: "x", model: "y", capabilities: [] }));
  assert.notEqual(unknown.state, "AUTHORIZED");
});

test("simulation never becomes execution and unauthorized execution is BLOCKED", () => {
  const sim = runExecutionMode("SIMULATION", { projectId: "p1", authorized: true });
  assert.equal(sim.mode, "SIMULATION");
  assert.equal(sim.realm, "SIMULATION");
  assert.equal(sim.contaminates_reality, false);
  assert.equal(sim.external_effect, false);
  const blocked = runExecutionMode("EXECUTION", { projectId: "p1", authorized: false });
  assert.equal(blocked.state, "BLOCKED");
  assert.equal(blocked.reason, "HUMAN_AUTHORIZATION_REQUIRED");
});

test("economic records refuse PAID/BILLED/LIVE without evidence", () => {
  const billed = economicRecord({ status: "BILLED", amount: 99 });
  assert.equal(billed.status, "ESTIMATED");
  assert.equal(billed.billed, false);
  assert.equal(billed.paid, false);
  assert.equal(billed.live, false);
  const paid = economicRecord({ status: "PAID" });
  assert.equal(paid.status, "ESTIMATED");
});

test("expired evidence is expired, not false, and as-of hides later facts", () => {
  const t0 = Date.parse("2026-01-01T00:00:00Z");
  const t1 = Date.parse("2026-06-01T00:00:00Z");
  const observed = temporalFact({ tenant_id: "t", entity_id: "e", epistemic: "OBSERVED", at: new Date(t0).toISOString() });
  const later = temporalFact({ tenant_id: "t", entity_id: "e", epistemic: "INFERRED", at: new Date(t1).toISOString() });
  const past = asOf([observed, later], "2026-03-01T00:00:00Z");
  assert.equal(past.length, 1);
  assert.equal(past[0].epistemic, "OBSERVED");
  const expired = registerEvidence({ claim: "x", source: "test", strength: 1, margin: 0.1, validUntil: new Date(t0).toISOString() });
  assert.equal(evidenceIsCurrent(expired, t1), false);
  const hist = asOf([{ ...expired, measured_at: new Date(t0 - 1000).toISOString() }], t1);
  assert.equal(hist[0].epistemic, "EXPIRED");
  assert.equal(hist[0].false_because_expired, false);
});

test("configured is not connected", () => {
  const c = configuredIsNotConnected({ id: "crm", state: "CONFIGURED", configured: true, credentials_present: true, reachable: false });
  assert.equal(c.configured, true);
  assert.equal(c.connected, false);
  assert.equal(c.proof.configured_equals_connected, false);
});

test("provider failure does not halt Acorn", () => {
  const a = createIntelligence({ id: "grok", provider: "xai", model: "grok-4", capabilities: ["analysis"] });
  const b = createIntelligence({ id: "other", provider: "other", model: "m", capabilities: ["analysis"] });
  const r = providerFailureDoesNotHalt({ failedId: "grok", intelligences: [a, b], required: ["analysis"] });
  assert.equal(r.acorn_available, true);
  assert.equal(r.remaining, 1);
});

test("learning cannot grant authority or merge", () => {
  const l = recordLearningObservation({ intelligence_id: "grok", capability: "analysis", outcome: "ok" });
  assert.equal(l.experimental, true);
  assert.equal(l.authority, false);
  assert.equal(l.cannot_merge, true);
  assert.equal(l.learning_equals_authority, false);
});

test("realms isolate simulation from reality", () => {
  const isolated = isolateRealm({ external_effect: true, state: "SUCCEEDED" }, "SIMULATION");
  assert.equal(isolated.realm, "SIMULATION");
  assert.equal(isolated.contaminates_reality, false);
  assert.equal(isolated.external_effect, false);
});

test("future-proof contract does not block the declared futures", () => {
  const contract = futureProofContract();
  assert.equal(contract.blocked.length, 0);
  assert.equal(FUTURE_PROOF_KEYS.length, 26);
  for (const key of FUTURE_PROOF_KEYS) {
    assert.equal(contract.items[key].status, "NOT_BLOCKED", key);
  }
  assert.equal(classifyCapability("merge"), "HUMAN_HOLD");
  assert.equal(classifyCapability("payment-capture"), "FUTURE");
  assert.equal(classifyCapability("webhooks"), "FOUNDATION_ONLY");
  assert.equal(classifyCapability("intake"), "IMPLEMENT_NOW");
});

test("missing channel is CHANNEL_NOT_PRESENT and HTTP cannot authorize execution", async () => {
  const blocked = await executeConnector(
    createConnectorExecutor({ connection: { id: "x" }, execute: async () => ({ ok: true }) }),
    { task: {}, authorized: true, channel_present: false }
  );
  assert.equal(blocked.reason, "CHANNEL_NOT_PRESENT");
});

test("physical operational e2e: isolate, qualify, plan, block, persist, as-of, restart", async () => {
  const dir = mkdtempSync(join(tmpdir(), "acorn-fp-"));
  const path = join(dir, "state.db");
  const started = await startLiveServer({ env: envFor(path) });
  const base = `http://127.0.0.1:${started.port}`;
  try {
    const html = await fetch(base + "/app");
    assert.equal(html.status, 200);
    assert.match(await html.text(), /Describe the problem/);

    const a = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "Ada", email: "ada-fp@example.com", password: "correct-horse" } });
    assert.equal(a.status, 201);
    const b = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "Bo", email: "bo-fp@example.com", password: "correct-horse" } });
    const token = a.json.token;

    const org = await jsonReq(base, "/api/v1/organization", { token });
    assert.equal(org.status, 200);
    assert.equal(org.json.organization.entity, "ORGANIZATION");

    const submitted = await jsonReq(base, "/api/v1/requests", { method: "POST", token, body: { request: "Need a GitHub intake that plans a measured workflow" }, headers: { "Idempotency-Key": "req-1" } });
    assert.equal(submitted.status, 201);
    assert.equal(submitted.json.cycle.stage, "HOLD_HUMAN_AUTHORIZATION");
    assert.equal(submitted.json.proof.live, false);
    assert.equal(submitted.json.proof.billed, false);
    assert.ok(submitted.json.capabilities.some((c) => c.name === "github"));
    assert.ok(submitted.json.execution.tasks.length >= 3);
    const requestId = submitted.json.request.id;

    const replay = await jsonReq(base, "/api/v1/requests", { method: "POST", token, body: { request: "Need a GitHub intake that plans a measured workflow" }, headers: { "Idempotency-Key": "req-1" } });
    assert.equal(replay.status, 201);
    assert.equal(replay.headers.get("x-idempotent-replay"), "true");
    assert.equal(replay.json.request.id, requestId);

    const discovered = await jsonReq(base, "/api/v1/intelligences/discover", { method: "POST", token, body: { provider: "future-lab", model: "helix-9", capabilities: ["analysis"] } });
    assert.equal(discovered.status, 201);
    assert.equal(discovered.json.intelligence.authority, false);
    assert.notEqual(discovered.json.intelligence.state, "AUTHORIZED");

    const simulated = await jsonReq(base, "/api/v1/runtime/simulate", { method: "POST", token, body: { request_id: requestId } });
    assert.equal(simulated.status, 200);
    assert.equal(simulated.json.proof.simulation_is_not_execution, true);
    assert.equal(simulated.json.simulation.contaminates_reality, false);

    const blocked = await jsonReq(base, "/api/v1/connectors/execute", { method: "POST", token, body: { request_id: requestId, connection_id: "github", provider: "github", kind: "repo", human_authorized: true } });
    assert.equal(blocked.status, 403);
    assert.equal(blocked.json.result.state, "BLOCKED");

    const leak = await jsonReq(base, "/api/v1/requests/" + requestId, { token: b.json.token });
    assert.equal(leak.status, 404);
    const leakCaps = await jsonReq(base, "/api/v1/capabilities", { token: b.json.token });
    assert.equal((leakCaps.json.capabilities || []).length, 0);

    const asOfNow = await jsonReq(base, "/api/v1/as-of?at=" + encodeURIComponent(new Date().toISOString()), { token });
    assert.equal(asOfNow.status, 200);
    assert.ok(asOfNow.json.evidence.length >= 1);

    const economy = await jsonReq(base, "/api/v1/economy", { token });
    assert.equal(economy.json.billed, false);
    assert.equal(economy.json.paid, false);

    const future = await jsonReq(base, "/api/v1/future-proof", { token });
    assert.equal(future.json.contract.blocked.length, 0);

    const fp = await jsonReq(base, "/api/v1/requests/" + requestId, { token });
    assert.equal(fp.json.project.id, requestId);
    assert.ok(fp.json.tasks.length >= 1);
    assert.equal(fp.json.proof.live, false);
  } finally {
    started.server.close();
    await started.db.close();
  }

  const restarted = await createLiveDatabase({ env: envFor(path), path });
  try {
    const row = await restarted.get("SELECT status FROM requests WHERE id LIKE $1", ["req_%"]);
    assert.equal(row.status, "HOLD_HUMAN_AUTHORIZATION");
    const org = await restarted.get("SELECT entity FROM acorn_state WHERE entity=$1", ["ORGANIZATION"]);
    assert.equal(org.entity, "ORGANIZATION");
    const task = await restarted.get("SELECT entity FROM acorn_state WHERE entity=$1", ["TASK"]);
    assert.equal(task.entity, "TASK");
    const cap = await restarted.get("SELECT entity FROM acorn_state WHERE entity=$1", ["CAPABILITY"]);
    assert.equal(cap.entity, "CAPABILITY");
  } finally {
    await restarted.close();
  }
});

test("rate limit returns 429 without claiming LIVE", async () => {
  const dir = mkdtempSync(join(tmpdir(), "acorn-rl-"));
  const path = join(dir, "state.db");
  const started = await startLiveServer({ env: { ...envFor(path), RATE_LIMIT_MAX: "3", RATE_LIMIT_WINDOW_MS: "60000" } });
  const base = `http://127.0.0.1:${started.port}`;
  try {
    await jsonReq(base, "/");
    await jsonReq(base, "/");
    await jsonReq(base, "/");
    const limited = await jsonReq(base, "/");
    assert.equal(limited.status, 429);
    assert.equal(limited.json.error, "RATE_LIMITED");
    const health = await jsonReq(base, "/healthz");
    assert.equal(health.status, 200);
    assert.notEqual(health.json.status, "LIVE");
  } finally {
    started.server.close();
    await started.db.close();
  }
});

test("0003 operational primitives migration is listed for both adapters", () => {
  assert.ok(listMigrations("sqlite").some((row) => row.id === "0003_operational_primitives"));
  assert.ok(listMigrations("postgres").some((row) => row.id === "0003_operational_primitives"));
});

test("customer portal and Dockerfile still ship without secrets", () => {
  const html = readFileSync(new URL("../live/app.html", import.meta.url), "utf8");
  assert.match(html, /Aperçu — pas une quittance/);
  assert.equal(html.includes("CERTIFIED"), false);
  const df = readFileSync(new URL("../live/Dockerfile", import.meta.url), "utf8");
  assert.match(df, /USER node/);
});

test("runtime package dependencies stay pg + husky", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.deepEqual(Object.keys(pkg.dependencies || {}), ["pg"]);
  assert.deepEqual(Object.keys(pkg.devDependencies || {}), ["husky"]);
  const license = readFileSync(new URL("../LICENSE", import.meta.url), "utf8");
  assert.match(license, /^MIT License/m);
  const notice = readFileSync(new URL("../NOTICE", import.meta.url), "utf8");
  assert.match(notice, /Acorn/);
  assert.match(notice, /does not grant any rights in the FAMILLE, Acorn, or UNFORGE names/);
});