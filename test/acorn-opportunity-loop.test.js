import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLiveDatabase } from "../live/database.mjs";
import { createLiveServer } from "../live/server.mjs";
import { STATE_ENTITIES } from "../scripts/acorn-enterprise-state.mjs";
import {
  discoverFromCapabilities,
  matchDemandCapability,
  composeSolutions,
  productizeCapability,
  valueNetwork,
  learnFromOutcome,
  COMMERCIAL_FORMS
} from "../scripts/acorn-opportunity-loop.mjs";

function dbEnv(path) {
  return { ACORN_DB_ADAPTER: "sqlite", ACORN_DB: path, NODE_ENV: "test", HOST: "127.0.0.1", PORT: "0" };
}

async function withServer(fn) {
  const path = join(mkdtempSync(join(tmpdir(), "acorn-opp-")), "state.db");
  const env = dbEnv(path);
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

test("capability without a demand still yields a PROPOSED opportunity, not a customer", () => {
  const found = discoverFromCapabilities({
    capabilities: [{ id: "cap_analysis", name: "analysis", exists: true }]
  });
  assert.ok(found.opportunities.length >= 1);
  assert.equal(found.opportunities[0].status, "PROPOSED");
  assert.equal(found.opportunities[0].is_demand, false);
  assert.equal(found.opportunities[0].is_customer, false);
  assert.equal(found.customer, false);
  assert.equal(found.live, false);
});

test("unknown cost is COST_NOT_MEASURED, never 0", () => {
  const found = discoverFromCapabilities({
    capabilities: [{ name: "github", exists: false }]
  });
  assert.equal(found.opportunities[0].estimated_cost, null);
  assert.equal(found.opportunities[0].cost_state, "COST_NOT_MEASURED");
  assert.equal(found.opportunities[0].estimated_value, null);
});

test("one capability productizes into many commercial forms without duplicating identity", () => {
  const product = productizeCapability({ capability: { id: "cap_x", name: "analysis" } });
  assert.equal(product.forms.length, COMMERCIAL_FORMS.length);
  assert.ok(product.forms.every((f) => f.capability_id === "cap_x"));
  assert.ok(product.forms.every((f) => f.published === false));
  assert.equal(product.published, false);
  assert.equal(product.live, false);
  assert.equal(product.ownership.usage_is_not_ownership, true);
});

test("solutions are tradeoffs, never a silent best", () => {
  const sols = composeSolutions({
    opportunity: { id: "opp_1", required_capabilities: ["analysis"] },
    capabilities: [{ name: "analysis" }]
  });
  assert.equal(sols.solutions.length, 3);
  assert.equal(sols.best, null);
  assert.ok(sols.solutions.every((s) => s.best === false));
});

test("demand and capability keep multiplicity and no authority", () => {
  const matched = matchDemandCapability({
    demands: [{ id: "d1", intent: "Need analysis of github workflows" }],
    capabilities: [{ id: "cap_analysis", name: "analysis" }, { id: "cap_github", name: "github" }]
  });
  assert.equal(matched.multiplicity, true);
  assert.equal(matched.best, null);
  assert.ok(matched.matches.length >= 2);
  assert.ok(matched.matches.every((m) => m.authority === false));
});

test("learning does not productize or authorize", () => {
  const learned = learnFromOutcome({ outcome: { state: "OBSERVED" } });
  assert.equal(learned.recorded, true);
  assert.equal(learned.promoted, false);
  assert.equal(learned.productized, false);
  assert.equal(learned.authorized, false);
});

test("value network does not invent revenue", () => {
  const net = valueNetwork({
    capabilities: [{ id: "cap_a", name: "analysis" }],
    projects: [{ id: "p1", customer_id: "c1" }]
  });
  assert.equal(net.revenue, null);
  assert.equal(net.cost_state, "COST_NOT_MEASURED");
  assert.equal(net.live, false);
});

test("OPPORTUNITY is persistable", () => {
  assert.equal(STATE_ENTITIES.includes("OPPORTUNITY"), true);
  assert.equal(STATE_ENTITIES.includes("PRODUCT"), true);
});

test("live HTTP: discover, isolate, spoofed authority ignored, product stays unpublished", async () => {
  await withServer(async ({ base }) => {
    const a = await register(base, "one@example.com");
    await jsonReq(base, "/api/v1/requests", {
      method: "POST",
      token: a.token,
      body: { request: "Need a GitHub intake that plans a measured workflow" }
    });
    const discovered = await jsonReq(base, "/api/v1/opportunities/discover", {
      method: "POST",
      token: a.token,
      body: { human_authorized: true, live: true, customer: true }
    });
    assert.equal(discovered.status, 201);
    assert.ok(discovered.json.opportunities.length >= 1);
    assert.equal(discovered.json.customer, false);
    assert.equal(discovered.json.live, false);
    assert.equal(discovered.json.client_authorization_ignored, true);
    const listed = await jsonReq(base, "/api/v1/opportunities", { token: a.token });
    assert.equal(listed.status, 200);
    assert.ok(listed.json.opportunities.length >= 1);
    const matched = await jsonReq(base, "/api/v1/matching", { token: a.token });
    assert.equal(matched.status, 200);
    assert.equal(matched.json.best, null);
    const product = await jsonReq(base, "/api/v1/capabilities/productize", {
      method: "POST",
      token: a.token,
      body: { capability: "analysis", published: true, live: true, human_authorized: true }
    });
    assert.equal(product.status, 201);
    assert.equal(product.json.product.published, false);
    assert.equal(product.json.proof.sale, false);
    assert.equal(product.json.solutions.best, null);
    const b = await register(base, "two@example.com");
    const steal = await jsonReq(base, "/api/v1/opportunities", { token: b.token });
    assert.equal(steal.status, 200);
    assert.equal(steal.json.opportunities.length, 0);
  });
});
