import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLiveDatabase } from "../live/database.mjs";
import { createLiveServer } from "../live/server.mjs";
import { applyPaymentObservation, acceptOffer, createCommercialProject } from "../scripts/acorn-commercial-runtime.mjs";
import {
  createDemand,
  qualifyDemand,
  receiveDemand,
  recordDelivery,
  recordOutcome,
  projectCycleState
} from "../scripts/acorn-customer-value.mjs";

function dbEnv(path, extra = {}) {
  return { ACORN_DB_ADAPTER: "sqlite", ACORN_DB: path, NODE_ENV: "test", HOST: "127.0.0.1", PORT: "0", ...extra };
}

async function withServer(extra, fn) {
  if (typeof extra === "function") { fn = extra; extra = {}; }
  const path = join(mkdtempSync(join(tmpdir(), "acorn-cv-")), "state.db");
  const env = dbEnv(path, extra);
  const db = await createLiveDatabase({ env, path });
  const { server } = await createLiveServer({ env, db });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { return await fn({ base, db, env }); }
  finally {
    await new Promise((resolve) => server.close(resolve));
    await db.close();
  }
}

async function jsonReq(base, path, { method = "GET", token, body, headers = {} } = {}) {
  const h = { "content-type": "application/json", ...headers };
  if (token) h.authorization = "Bearer " + token;
  const res = await fetch(base + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

async function register(base, email = "value@example.com") {
  const r = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "Ada", email, password: "tenchars!!" } });
  assert.equal(r.status, 201);
  return r.json;
}

test("client authority and paid flags never enter the demand", () => {
  const demand = createDemand({
    tenantId: "t1",
    customerId: "c1",
    intent: "Need a GitHub intake that plans a measured workflow",
    paid: true,
    human_authorized: true,
    live: true
  });
  assert.equal(demand.authorized, false);
  assert.equal(demand.paid, false);
  assert.equal(demand.live, false);
  assert.equal(demand.client_paid_ignored, true);
  assert.equal(demand.client_authorization_ignored, true);
});

test("thin intent waits for information instead of inventing a solution", () => {
  const received = receiveDemand({ tenantId: "t", customerId: "c", intent: "hi" });
  assert.equal(received.stage, "WAITING_INFORMATION");
  assert.equal(received.qualification.waiting_information, true);
  assert.equal(received.invented_solution, false);
  assert.equal(received.offers.length, 0);
  assert.equal(received.commercial, null);
});

test("a real problem produces offers without claiming delivery", () => {
  const received = receiveDemand({
    tenantId: "t",
    customerId: "c",
    intent: "Need a GitHub intake that plans a measured workflow"
  });
  assert.equal(received.stage, "OFFERED");
  assert.ok(received.offers.length >= 1);
  assert.equal(received.proof.delivered, false);
  assert.equal(received.proof.paid, false);
  assert.equal(received.live, false);
});

test("payment observation is not delivery and missing value is not zero", () => {
  const commercial = createCommercialProject({
    tenantId: "t",
    customerId: "c",
    problem: "Need a GitHub intake that plans a measured workflow",
    requestId: "req_cv"
  });
  const accepted = acceptOffer({
    tenantId: "t",
    customerId: "c",
    projectId: "req_cv",
    offer: commercial.offers.find((o) => o.amount_cents)
  });
  const observed = applyPaymentObservation({
    order: accepted.order,
    entry: { kind: "PAYMENT", status: "PAYMENT_OBSERVED", epistemic: "OBSERVED", gross_amount: accepted.order.amount_cents, currency: "cad" }
  });
  const delivery = recordDelivery({
    projectId: "req_cv",
    order: observed.order,
    authorized: false,
    paid: true
  });
  assert.equal(delivery.delivered, false);
  assert.equal(delivery.reason, "PAYMENT_IS_NOT_DELIVERY");
  const outcome = recordOutcome({ delivery, order: observed.order });
  assert.equal(outcome.state, "VALUE_NOT_MEASURED");
  assert.equal(outcome.revenue_cents, null);
  assert.equal(outcome.cost_cents, null);
});

test("authorized delivery still requires execution evidence", () => {
  const delivery = recordDelivery({
    projectId: "req_cv",
    execution: { state: "PLANNED" },
    evidence: [{ id: "ev1", claim: "demand_persisted" }],
    authorized: true
  });
  assert.equal(delivery.delivered, false);
  assert.equal(delivery.reason, "EXECUTION_NOT_COMPLETE");
});

test("project cycle state is customer-facing and never live", () => {
  const view = projectCycleState({
    demand: { intent: "Need analysis of github workflows" },
    qualification: { waiting_information: false, qualified: true },
    offers: [{ id: "off_1" }],
    order: { state: "PAYMENT_OBSERVED" },
    delivery: { delivered: false }
  });
  assert.equal(view.stage, "EXECUTION_HOLD");
  assert.equal(view.customer.payment, true);
  assert.equal(view.customer.result, false);
  assert.equal(view.live, false);
  assert.equal(view.proof.payment_is_not_delivery, true);
});

test("live HTTP: demand to state to spoofed payment/delivery, tenant isolation", async () => {
  await withServer(async ({ base }) => {
    const a = await register(base, "one@example.com");
    const thin = await jsonReq(base, "/api/v1/customer/demand", {
      method: "POST",
      token: a.token,
      body: { problem: "hi", paid: true, human_authorized: true, live: true }
    });
    assert.equal(thin.status, 201);
    assert.equal(thin.json.qualification.waiting_information, true);
    assert.equal(thin.json.offers.length, 0);
    assert.equal(thin.json.proof.client_authorization_ignored, true);
    const created = await jsonReq(base, "/api/v1/customer/demand", {
      method: "POST",
      token: a.token,
      body: { problem: "Need a GitHub intake that plans a measured workflow", paid: true }
    });
    assert.equal(created.status, 201);
    assert.ok(created.json.offers.length >= 1);
    const pid = created.json.request.id;
    const state = await jsonReq(base, "/api/v1/projects/" + pid + "/state", { token: a.token });
    assert.equal(state.status, 200);
    assert.equal(state.json.live, false);
    assert.equal(state.json.customer.offer, true);
    assert.equal(state.json.customer.payment, false);
    const deliver = await jsonReq(base, "/api/v1/projects/" + pid + "/deliver", {
      method: "POST",
      token: a.token,
      body: { paid: true, human_authorized: true, live: true }
    });
    assert.equal(deliver.status, 403);
    assert.equal(deliver.json.delivery.delivered, false);
    assert.equal(deliver.json.client_authorization_ignored, true);
    const outcome = await jsonReq(base, "/api/v1/projects/" + pid + "/outcome", {
      method: "POST",
      token: a.token,
      body: { measurements: { customer_value_cents: 999999 } }
    });
    assert.equal(outcome.status, 200);
    assert.equal(outcome.json.outcome.state, "VALUE_NOT_MEASURED");
    const b = await register(base, "two@example.com");
    const steal = await jsonReq(base, "/api/v1/projects/" + pid + "/state", { token: b.token });
    assert.equal(steal.status, 404);
  });
});

test("integration cycle labels simulated payment as not live and not delivered", async () => {
  await withServer(async ({ base }) => {
    const a = await register(base, "cycle@example.com");
    const created = await jsonReq(base, "/api/v1/customer/demand", {
      method: "POST",
      token: a.token,
      body: { problem: "Need a GitHub intake that plans a measured workflow" }
    });
    const pid = created.json.request.id;
    const offer = created.json.offers.find((o) => o.amount_cents);
    const order = await jsonReq(base, "/api/v1/orders", {
      method: "POST",
      token: a.token,
      body: { project_id: pid, offer_id: offer.id }
    });
    assert.equal(order.status, 201);
    const checkout = await jsonReq(base, "/api/v1/checkout", {
      method: "POST",
      token: a.token,
      body: { order_id: order.json.order.id }
    });
    assert.equal(checkout.json.checkout.configured, false);
    const state = await jsonReq(base, "/api/v1/projects/" + pid + "/state", { token: a.token });
    assert.equal(state.json.customer.payment, false);
    assert.equal(state.json.delivery.delivered, false);
    assert.equal(state.json.live, false);
    assert.equal(state.json.proof.payment_is_not_delivery, true);
  });
});
