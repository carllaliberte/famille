import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLiveDatabase } from "../live/database.mjs";
import { createLiveServer } from "../live/server.mjs";
import { STATE_ENTITIES } from "../scripts/acorn-enterprise-state.mjs";
import {
  primitiveIdentity,
  represent,
  derive,
  pinVersion,
  resolveAt,
  compatible,
  canReuse,
  generalizeLearning,
  assetize,
  adapt,
  leverage,
  compound,
  REPRESENTATIONS
} from "../scripts/acorn-compounding.mjs";

async function withServer(fn) {
  const path = join(mkdtempSync(join(tmpdir(), "acorn-cmp-")), "state.db");
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

test("one identity has many representations without duplication", () => {
  const id = primitiveIdentity({ key: "analysis" });
  const packed = compound({ identity: id });
  assert.equal(packed.unique_identities, 1);
  assert.equal(packed.unique_representations, REPRESENTATIONS.length);
  assert.ok(packed.representations.every((r) => r.identity_id === id.id && r.duplicated === false));
  const api = represent(id, "API");
  const sub = represent(id, "SERVICE");
  assert.equal(api.key, sub.key);
  assert.equal(api.identity_id, sub.identity_id);
});

test("derivation keeps DERIVED_FROM and does not grant authority", () => {
  const from = primitiveIdentity({ key: "analysis" });
  const d = derive({ from, into: "ASSET", transform: "COMPOSED" });
  assert.equal(d.derived_from, from.id);
  assert.equal(d.composition_is_not_authority, true);
  assert.equal(d.live, false);
});

test("pinned project keeps v1 when identity moves to v2", () => {
  const v1 = primitiveIdentity({ key: "analysis", version: "1" });
  const v2 = primitiveIdentity({ key: "analysis", version: "2" });
  const pin = pinVersion({ projectId: "proj_1", identity: v1, version: "1" });
  const resolved = resolveAt({ identity: v2, pins: [pin], projectId: "proj_1" });
  assert.equal(resolved.current_version, "2");
  assert.equal(resolved.resolved_version, "1");
  assert.equal(resolved.pinned, true);
  assert.equal(pin.silent_upgrade, false);
});

test("private result does not become a public asset without rights", () => {
  const denied = assetize({
    result: { name: "client workflow", verified: true, capability: "analysis" },
    rights: ["CUSTOMER_USE"],
    evidence: [{ status: "VERIFIED" }]
  });
  assert.equal(denied.state, "PRIVATE_RESULT");
  assert.equal(denied.public, false);
  assert.equal(canReuse({ rights: [], purpose: "PROJECT" }).reason, "ACCESS_IS_NOT_OWNERSHIP");
});

test("learning discards customer data and does not claim anonymization", () => {
  const learned = generalizeLearning({
    outcome: { capability: "analysis", quality: 0.8, cost: null },
    customer_data: { email: "secret@example.com", files: ["invoice.pdf"] }
  });
  assert.equal(learned.customer_data, null);
  assert.equal(learned.leaked, false);
  assert.equal(learned.anonymization_guaranteed, false);
  assert.equal(learned.promoted, false);
  assert.equal(learned.generalized.cost_state, "COST_NOT_MEASURED");
});

test("market adaptation does not duplicate the core", () => {
  const id = primitiveIdentity({ key: "analysis" });
  const fr = adapt({ identity: id, market: "fr", country: "FR", currency: "eur", language: "fr" });
  assert.equal(fr.identity_id, id.id);
  assert.equal(fr.core_unchanged, true);
  assert.equal(fr.duplicated, false);
});

test("leverage is a design metric, not economic truth", () => {
  const m = leverage({ future_uses: 10, complexity: 2 });
  assert.equal(m.leverage, 5);
  assert.equal(m.economic, false);
  assert.equal(m.economic_truth, false);
  assert.equal(leverage({}).state, "NOT_MEASURED");
});

test("compatibility is unknown until measured, never a rewrite", () => {
  const a = primitiveIdentity({ key: "analysis" });
  const b = primitiveIdentity({ key: "github" });
  const c = compatible({ a, b });
  assert.equal(c.measured, false);
  assert.equal(c.live, false);
});

test("DERIVATION is persistable", () => {
  assert.equal(STATE_ENTITIES.includes("DERIVATION"), true);
  assert.equal(STATE_ENTITIES.includes("ASSET"), true);
});

test("live HTTP: represent, derive, isolate, private asset, pin v1", async () => {
  await withServer(async ({ base }) => {
    const a = await register(base, "one@example.com");
    const represented = await jsonReq(base, "/api/v1/primitives/represent", {
      method: "POST",
      token: a.token,
      body: { key: "analysis", as: "API", human_authorized: true, published: true }
    });
    assert.equal(represented.status, 201);
    assert.equal(represented.json.identity.key, "analysis");
    assert.equal(represented.json.representation.duplicated, false);
    assert.equal(represented.json.proof.published, false);
    assert.equal(represented.json.client_authorization_ignored, true);
    const derived = await jsonReq(base, "/api/v1/primitives/derive", {
      method: "POST",
      token: a.token,
      body: { from: "analysis", into: "ASSET" }
    });
    assert.equal(derived.status, 201);
    assert.equal(derived.json.derivation.derived_from, "capability:analysis");
    const priv = await jsonReq(base, "/api/v1/assets/from-result", {
      method: "POST",
      token: a.token,
      body: { result: { verified: true, name: "secret workflow" }, rights: ["CUSTOMER_USE"], public: true }
    });
    assert.equal(priv.json.asset.state, "PRIVATE_RESULT");
    assert.equal(priv.json.proof.public, false);
    const pin = await jsonReq(base, "/api/v1/primitives/pin", {
      method: "POST",
      token: a.token,
      body: { key: "analysis", project_id: "proj_keep", version: "1", current_version: "2" }
    });
    assert.equal(pin.status, 201);
    assert.equal(pin.json.pin.version, "1");
    assert.equal(pin.json.proof.silent_upgrade, false);
    const view = await jsonReq(base, "/api/v1/compounding", { token: a.token });
    assert.equal(view.status, 200);
    assert.ok(view.json.identities.some((i) => i.key === "analysis"));
    const b = await register(base, "two@example.com");
    const steal = await jsonReq(base, "/api/v1/compounding", { token: b.token });
    assert.equal(steal.json.identities.length, 0);
    const adapted = await jsonReq(base, "/api/v1/primitives/adapt", {
      method: "POST",
      token: a.token,
      body: { key: "analysis", market: "eu", currency: "eur", customer_data: { email: "x@y.z" } }
    });
    assert.equal(adapted.json.adaptation.core_unchanged, true);
    assert.equal(adapted.json.learning.leaked, false);
  });
});
