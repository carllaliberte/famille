import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLiveDatabase } from "../live/database.mjs";
import { createLiveServer } from "../live/server.mjs";
import { STATE_ENTITIES } from "../scripts/acorn-enterprise-state.mjs";
import {
  metric,
  compositionRecord,
  constrain,
  compareCompositions,
  minimumSufficient,
  discoverPatterns,
  remember,
  zeroToOne,
  unknownMarket,
  diagnoseGap,
  adaptiveCycle,
  admitUnknown
} from "../scripts/acorn-adaptive-loop.mjs";

async function withServer(fn) {
  const path = join(mkdtempSync(join(tmpdir(), "acorn-adp-")), "state.db");
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

test("unknown cost is NOT_MEASURED, never 0", () => {
  assert.equal(metric(null).state, "NOT_MEASURED");
  assert.equal(metric(null).value, null);
  assert.equal(compositionRecord({ capabilities: ["analysis"] }).cost.state, "NOT_MEASURED");
  assert.equal(compositionRecord({ capabilities: ["analysis"] }).score, null);
});

test("more capabilities is not a better solution", () => {
  const small = compositionRecord({ id: "a", capabilities: ["analysis", "planning"] });
  const big = compositionRecord({ id: "b", capabilities: ["analysis", "planning", "github", "research"] });
  const pick = minimumSufficient({ requirements: ["analysis", "planning"], compositions: [big, small] });
  assert.equal(pick.selected.id, "a");
  assert.equal(pick.more_capabilities_is_not_better, true);
  assert.equal(compareCompositions([small, big]).best, null);
});

test("constraints eliminate incompatible compositions", () => {
  const c = compositionRecord({ capabilities: ["analysis"], cost: 500 });
  const gated = constrain({ composition: c, constraints: { budget: 10 } });
  assert.equal(gated.ok, false);
  assert.ok(gated.reasons.includes("BUDGET"));
});

test("pattern from executions stays PROPOSED, not truth", () => {
  const found = discoverPatterns({
    executions: [
      { capabilities: ["analysis", "planning"] },
      { capabilities: ["analysis", "planning"] }
    ]
  });
  assert.equal(found.patterns[0].status, "PROPOSED");
  assert.equal(found.truth, false);
});

test("hypothesis is not fact until verified", () => {
  const h = remember({ kind: "FACT", claim: "this works", verified: false });
  assert.equal(h.kind, "HYPOTHESIS");
  assert.equal(h.is_fact, false);
  const f = remember({ kind: "FACT", claim: "measured", verified: true });
  assert.equal(f.is_fact, true);
});

test("no existing product is not no solution", () => {
  const m = unknownMarket({ demand: "orbital logistics", products: [] });
  assert.equal(m.no_existing_product, true);
  assert.equal(m.no_solution, false);
  assert.equal(m.composition_possible, true);
});

test("unknown intelligence is discovered without trust or authority", () => {
  const u = admitUnknown({ provider: "future-lab", model: "omega-1" });
  assert.equal(u.trusted, false);
  assert.equal(u.authorized, false);
  assert.equal(u.verified, false);
  assert.equal(u.live, false);
  assert.equal(zeroToOne({}).stage, "UNKNOWN");
});

test("diagnosis does not auto-repair", () => {
  const d = diagnoseGap({ gap: "github", authorized: false });
  assert.equal(d.auto_repair, false);
  assert.equal(d.repair.auto_repair, false);
});

test("adaptive cycle reuses operateProblem and does not claim LIVE", () => {
  const r = adaptiveCycle({ problem: "Need a GitHub intake that plans a measured workflow" });
  assert.ok(r.compositions.length >= 2);
  assert.equal(r.live, false);
  assert.equal(r.potential_not_actual, true);
  assert.equal(r.compared.best, null);
  assert.equal(r.learned.promoted, false);
});

test("COMPOSITION and PATTERN are persistable", () => {
  assert.equal(STATE_ENTITIES.includes("COMPOSITION"), true);
  assert.equal(STATE_ENTITIES.includes("PATTERN"), true);
});

test("live HTTP: cycle, unknown, remember, isolate, spoofed authority ignored", async () => {
  await withServer(async ({ base }) => {
    const a = await register(base, "one@example.com");
    await jsonReq(base, "/api/v1/requests", {
      method: "POST",
      token: a.token,
      body: { request: "Need a GitHub intake that plans a measured workflow" }
    });
    const cycle = await jsonReq(base, "/api/v1/adaptive/cycle", {
      method: "POST",
      token: a.token,
      body: { human_authorized: true, live: true }
    });
    assert.equal(cycle.status, 201);
    assert.equal(cycle.json.live, false);
    assert.equal(cycle.json.compared.best, null);
    assert.equal(cycle.json.client_authorization_ignored, true);
    const listed = await jsonReq(base, "/api/v1/adaptive", { token: a.token });
    assert.ok(listed.json.compositions.length >= 1);
    const unk = await jsonReq(base, "/api/v1/adaptive/unknown", {
      method: "POST",
      token: a.token,
      body: { provider: "new-lab", model: "n1", trusted: true, authorized: true, live: true }
    });
    assert.equal(unk.json.trusted, false);
    assert.equal(unk.json.proof.authorized, false);
    const mem = await jsonReq(base, "/api/v1/adaptive/remember", {
      method: "POST",
      token: a.token,
      body: { kind: "FACT", claim: "unverified pattern", verified: false }
    });
    assert.equal(mem.json.memory.is_fact, false);
    const diag = await jsonReq(base, "/api/v1/adaptive/diagnose", {
      method: "POST",
      token: a.token,
      body: { gap: "github", human_authorized: true }
    });
    assert.equal(diag.json.auto_repair, false);
    const b = await register(base, "two@example.com");
    const steal = await jsonReq(base, "/api/v1/adaptive", { token: b.token });
    assert.equal(steal.json.compositions.length, 0);
  });
});
