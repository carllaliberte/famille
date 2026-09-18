import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLiveDatabase } from "../live/database.mjs";
import { createLiveServer } from "../live/server.mjs";
import { describeCapability, operateProblem } from "../scripts/acorn-operational-fabric.mjs";
import { createIntelligence } from "../scripts/acorn-intelligence-fabric.mjs";
import { admitExtension } from "../scripts/acorn-self-build.mjs";
import {
  capabilityRecord,
  bindProvider,
  composeFromIntent,
  recordCapabilityFailure,
  learnPath,
  admitUnknown,
  architecturalLeverage,
  detectCycles,
  COMPOSITION_VERSION
} from "../scripts/acorn-capability-composition.mjs";

function dbEnv(path, extra = {}) {
  return { ACORN_DB_ADAPTER: "sqlite", ACORN_DB: path, NODE_ENV: "test", HOST: "127.0.0.1", PORT: "0", ...extra };
}

async function withServer(fn) {
  const path = join(mkdtempSync(join(tmpdir(), "acorn-cmp-")), "state.db");
  const env = dbEnv(path);
  const db = await createLiveDatabase({ env, path });
  const { server } = await createLiveServer({ env, db });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { return await fn({ base, db }); }
  finally {
    await new Promise((resolve) => server.close(resolve));
    await db.close();
  }
}

async function jsonReq(base, path, { method = "GET", token, body } = {}) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = "Bearer " + token;
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

async function register(base, email = "cmp@example.com") {
  const r = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "Ada", email, password: "tenchars!!" } });
  assert.equal(r.status, 201);
  return r.json;
}

test("capability record is provider-independent and refuses implicit authority", () => {
  const cap = capabilityRecord({
    name: "translation",
    exists: true,
    available: true,
    authorized: true,
    executed: true,
    verified: true,
    providers: [{ id: "openai", kind: "INTELLIGENCE" }],
    cost: null
  });
  assert.equal(cap.name, "translation");
  assert.equal(cap.authorized, false);
  assert.equal(cap.executed, false);
  assert.equal(cap.verified, false);
  assert.equal(cap.provider_independent, true);
  assert.equal(cap.live, false);
  assert.equal(cap.cost, null);
  const bound = bindProvider(cap, { id: "future-lab", kind: "INTELLIGENCE" });
  assert.equal(bound.name, "translation");
  assert.equal(bound.id, cap.id);
  assert.equal(bound.authorized, false);
  assert.equal(bound.providers.some((p) => p.id === "future-lab"), true);
});

test("describeCapability remains backward compatible", () => {
  const cap = describeCapability({ name: "github", exists: true, available: true, authorized: true, executed: true, verified: true });
  assert.equal(cap.authorized, false);
  assert.equal(cap.executed, false);
  assert.equal(cap.verified, false);
  assert.equal(cap.provider_independent, true);
});

test("composeFromIntent builds a graph without selecting or executing a path", () => {
  const intel = createIntelligence({ id: "intel_x", provider: "future-lab", model: "helix-9", capabilities: ["analysis"] });
  const graph = composeFromIntent({
    intent: "Need analysis of github workflows",
    tenantId: "t1",
    intelligences: [intel]
  });
  assert.equal(graph.version, COMPOSITION_VERSION);
  assert.equal(graph.selected_path, null);
  assert.equal(graph.executable, false);
  assert.equal(graph.authorized, false);
  assert.equal(graph.live, false);
  assert.ok(graph.demand.capabilities.includes("analysis"));
  assert.equal(graph.paths[0].executable, false);
  assert.equal(graph.paths[0].selected, false);
  assert.equal(graph.paths[0].authority, false);
});

test("cycles are detected and do not authorize", () => {
  const cycles = detectCycles([
    { from: "a", to: "b", rel: "requires" },
    { from: "b", to: "a", rel: "requires" }
  ]);
  assert.ok(cycles.length >= 1);
});

test("failure is routing data and never authority", () => {
  const fail = recordCapabilityFailure({ capability: "github", provider: "future-lab", cause: "TIMEOUT" });
  assert.equal(fail.kind, "FAILURE");
  assert.equal(fail.used_for_authority, false);
  assert.equal(fail.live, false);
  assert.equal(fail.impact, "ROUTING");
});

test("learning a path does not promote or authorize", () => {
  const learned = learnPath({ path: { id: "path_primary" }, outcome: "SUCCEEDED" });
  assert.equal(learned.recorded, true);
  assert.equal(learned.promoted, false);
  assert.equal(learned.authorized, false);
  assert.equal(learned.live, false);
});

test("unknown kinds are admitted as UNKNOWN; protected kinds are refused", () => {
  const robot = admitUnknown({ kind: "ROBOT_SWARM", id: "future.swarm" });
  assert.equal(robot.admitted, true);
  assert.equal(robot.kind, "UNKNOWN");
  assert.equal(robot.authorized, false);
  assert.equal(robot.core_modified, false);
  const machine = admitExtension({ kind: "MACHINE", id: "future.press" });
  assert.equal(machine.admitted, true);
  assert.equal(machine.kind, "MACHINE");
  assert.equal(machine.authorized, false);
  const banned = admitUnknown({ kind: "MERGE", id: "nope" });
  assert.equal(banned.admitted, false);
  assert.equal(banned.reason, "PROTECTED_KIND");
});

test("architectural leverage: future domains do not rewrite the core and power is not authority", () => {
  const q = architecturalLeverage();
  assert.equal(q.new_intelligence_requires_core_change, false);
  assert.equal(q.new_capability_requires_new_engine, false);
  assert.equal(q.new_market_requires_new_economy, false);
  assert.equal(q.new_connector_requires_special_architecture, false);
  assert.equal(q.new_machine_requires_second_runtime, false);
  assert.equal(q.new_rail_contaminates_core, false);
  assert.equal(q.more_power_grants_authority, false);
  assert.equal(q.stripe_imported, false);
  assert.equal(q.second_runtime, false);
  const source = readFileSync(new URL("../scripts/acorn-capability-composition.mjs", import.meta.url), "utf8");
  assert.equal(/from\s+["'].*stripe/i.test(source), false);
  assert.equal(/from\s+["'].*openai/i.test(source), false);
  assert.equal(/if\s*\(\s*provider\s*===/.test(source), false);
});

test("operateProblem exposes composition without claiming execution", () => {
  const operated = operateProblem({
    tenantId: "t1",
    customerId: "c1",
    problem: "Need a GitHub intake that plans a measured workflow",
    requestId: "req_cmp"
  });
  assert.ok(operated.composition);
  assert.equal(operated.composition.executable, false);
  assert.equal(operated.composition.selected_path, null);
  assert.equal(operated.composition.live, false);
  const github = operated.capabilities.find((c) => c.name === "github");
  assert.equal(github.exists, false);
  assert.equal(github.authorized, false);
});

test("live HTTP: composition persists, admit is tenant-bound, forged authority is ignored", async () => {
  await withServer(async ({ base }) => {
    const a = await register(base, "one@example.com");
    const created = await jsonReq(base, "/api/v1/requests", {
      method: "POST",
      token: a.token,
      body: { request: "Need analysis of a future machine", human_authorized: true, live: true }
    });
    assert.equal(created.status, 201);
    assert.equal(created.json.composition.executable, false);
    assert.equal(created.json.composition.selected_path, null);
    assert.equal(created.json.proof.live, false);
    const got = await jsonReq(base, "/api/v1/requests/" + created.json.request.id, { token: a.token });
    assert.ok(got.json.composition);
    assert.equal(got.json.composition.live, false);
    const snap = await jsonReq(base, "/api/v1/composition", { token: a.token });
    assert.equal(snap.status, 200);
    assert.equal(snap.json.live, false);
    assert.equal(snap.json.leverage.more_power_grants_authority, false);
    const admitted = await jsonReq(base, "/api/v1/capabilities/admit", {
      method: "POST",
      token: a.token,
      body: { kind: "MACHINE", id: "press-7", human_authorized: true, live: true }
    });
    assert.equal(admitted.status, 201);
    assert.equal(admitted.json.admission.authorized, false);
    assert.equal(admitted.json.client_authorization_ignored, true);
    const banned = await jsonReq(base, "/api/v1/capabilities/admit", {
      method: "POST",
      token: a.token,
      body: { kind: "MERGE", id: "nope", human_authorized: true }
    });
    assert.equal(banned.status, 403);
    const b = await register(base, "two@example.com");
    const steal = await jsonReq(base, "/api/v1/requests/" + created.json.request.id, { token: b.token });
    assert.equal(steal.status, 404);
  });
});
