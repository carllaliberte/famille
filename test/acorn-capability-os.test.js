import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLiveDatabase } from "../live/database.mjs";
import { createLiveServer } from "../live/server.mjs";
import { STATE_ENTITIES } from "../scripts/acorn-enterprise-state.mjs";
import {
  node,
  relate,
  graphView,
  observeOS,
  solveProblem,
  admitFuture,
  capabilityContract
} from "../scripts/acorn-capability-os.mjs";

async function withServer(fn) {
  const path = join(mkdtempSync(join(tmpdir(), "acorn-os-")), "state.db");
  const env = { ACORN_DB_ADAPTER: "sqlite", ACORN_DB: path, NODE_ENV: "test", HOST: "127.0.0.1", PORT: "0" };
  const db = await createLiveDatabase({ env, path });
  const { server } = await createLiveServer({ env, db });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { return await fn({ base }); }
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

async function register(base, email) {
  const r = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "Ada", email, password: "tenchars!!" } });
  assert.equal(r.status, 201);
  return r.json;
}

test("unknown types are admitted without trust or core rewrite", () => {
  const machine = node({ type: "MACHINE", key: "mill-1" });
  assert.equal(machine.admitted_unknown, true);
  assert.equal(machine.trusted, false);
  assert.equal(machine.live, false);
  const market = admitFuture({ kind: "MARKET", key: "orbital" });
  assert.equal(market.core_rewritten, false);
  assert.equal(market.authorized, false);
});

test("identity is not representation or channel", () => {
  const a = node({ type: "INTELLIGENCE", key: "omega", representation: "api", channel: "http" });
  const b = node({ type: "INTELLIGENCE", key: "omega", representation: "sdk", channel: "cli" });
  assert.equal(a.id, b.id);
  assert.equal(a.identity_is_not_representation, true);
  assert.notEqual(a.representation, b.representation);
});

test("available is not a right to use", () => {
  const n = node({ type: "CAPABILITY", key: "analysis", state: "AVAILABLE" });
  assert.equal(n.available, true);
  assert.equal(n.right_to_use, false);
  const c = capabilityContract({ name: "analysis", exists: true, available: true });
  assert.equal(c.available_is_not_right_to_use, true);
  assert.equal(c.authority, false);
});

test("unknown relations are admitted as UNKNOWN_RELATION", () => {
  const e = relate({ from: "cap:a", relation: "TELEPORTS_INTO", to: "cap:b" });
  assert.equal(e.relation, "UNKNOWN_RELATION");
  assert.equal(e.requested_relation, "TELEPORTS_INTO");
  assert.equal(e.trusted, false);
});

test("observe OS never claims LIVE or executable without authority", () => {
  const snap = observeOS({
    capabilities: [{ name: "analysis", exists: true }],
    connections: [{ id: "c1", state: "CONFIGURED" }],
    executions: [],
    evidence: []
  });
  assert.equal(snap.live, false);
  assert.deepEqual(snap.executable, []);
  assert.equal(snap.proof.live, false);
});

test("solve does not invent a solution and simulation is not execution", () => {
  const empty = solveProblem({ problem: "" });
  assert.equal(empty.hold, "NO_SOLUTION_FOUND");
  const solved = solveProblem({ problem: "Need a GitHub intake that plans a measured workflow" });
  assert.equal(solved.live, false);
  assert.equal(solved.simulation.simulated_is_not_executed, true);
  assert.equal(solved.compositions[0].executed, false);
});

test("cost unknown is NOT_MEASURED", () => {
  const n = node({ type: "CAPABILITY", key: "analysis" });
  assert.equal(n.cost.state, "NOT_MEASURED");
  assert.equal(n.cost.value, null);
});

test("GRAPH and RELATION are persistable", () => {
  assert.equal(STATE_ENTITIES.includes("GRAPH"), true);
  assert.equal(STATE_ENTITIES.includes("RELATION"), true);
});

test("graphView counts nodes and edges without claiming LIVE", () => {
  const n = node({ type: "CAPABILITY", key: "analysis" });
  const e = relate({ from: n.id, relation: "REQUIRES", to: "capability:planning" });
  const g = graphView({ nodes: [n], edges: [e] });
  assert.equal(g.count.nodes, 1);
  assert.equal(g.count.edges, 1);
  assert.equal(g.live, false);
});

test("live HTTP: graph, solve, admit, isolate, spoofed trust ignored", async () => {
  await withServer(async ({ base }) => {
    const a = await register(base, "one@example.com");
    await jsonReq(base, "/api/v1/requests", {
      method: "POST",
      token: a.token,
      body: { request: "Need a GitHub intake that plans a measured workflow" }
    });
    const created = await jsonReq(base, "/api/v1/graph/nodes", {
      method: "POST",
      token: a.token,
      body: { type: "MACHINE", key: "press-1", trusted: true, human_authorized: true }
    });
    assert.equal(created.status, 201);
    assert.equal(created.json.node.admitted_unknown, true);
    assert.equal(created.json.proof.trusted, false);
    const edge = await jsonReq(base, "/api/v1/graph/relate", {
      method: "POST",
      token: a.token,
      body: { from: created.json.node.id, relation: "CAN_PROVIDE", to: "capability:analysis" }
    });
    assert.equal(edge.status, 201);
    const graph = await jsonReq(base, "/api/v1/graph", { token: a.token });
    assert.ok(graph.json.nodes.length >= 1);
    const solved = await jsonReq(base, "/api/v1/solve", {
      method: "POST",
      token: a.token,
      body: { human_authorized: true, live: true }
    });
    assert.equal(solved.json.live, false);
    assert.equal(solved.json.client_authorization_ignored, true);
    const os = await jsonReq(base, "/api/v1/os", { token: a.token });
    assert.equal(os.json.live, false);
    const admitted = await jsonReq(base, "/api/v1/os/admit", {
      method: "POST",
      token: a.token,
      body: { kind: "INTELLIGENCE", key: "omega-9", trusted: true, authorized: true, live: true }
    });
    assert.equal(admitted.json.core_rewritten, false);
    assert.equal(admitted.json.trusted, false);
    const b = await register(base, "two@example.com");
    const steal = await jsonReq(base, "/api/v1/graph", { token: b.token });
    assert.equal(steal.json.nodes.length, 0);
  });
});
