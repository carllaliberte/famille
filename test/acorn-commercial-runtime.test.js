import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLiveDatabase } from "../live/database.mjs";
import { createLiveServer } from "../live/server.mjs";
import { listMigrations } from "../live/migrate.mjs";
import {
  createCommercialProject,
  acceptOffer,
  confirmPaymentFromEvent,
  catalogPublic,
  PRICE_CATALOG,
  revenueMaximizerBounded,
  developerSurface,
  advanceAfterPayment
} from "../scripts/acorn-commercial-runtime.mjs";
import { STATE_ENTITIES } from "../scripts/acorn-enterprise-state.mjs";

function sign(secret, body, ts = Math.floor(Date.now() / 1000)) {
  const v1 = crypto.createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
  return `t=${ts},v1=${v1}`;
}

function dbEnv(path, extra = {}) {
  return { ACORN_DB_ADAPTER: "sqlite", ACORN_DB: path, NODE_ENV: "test", HOST: "127.0.0.1", PORT: "0", ...extra };
}

async function withServer(fn, extraEnv = {}) {
  const dir = mkdtempSync(join(tmpdir(), "acorn-com-"));
  const path = join(dir, "state.db");
  const env = dbEnv(path, extraEnv);
  const db = await createLiveDatabase({ env, path });
  const { server } = await createLiveServer({ env, db });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
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
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json, headers: res.headers };
}

async function register(base, email = "a@example.com") {
  const r = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "Ada", email, password: "tenchars!!" } });
  assert.equal(r.status, 201);
  return r.json;
}

test("migration 0004 is listed for sqlite and postgres", () => {
  const sqlite = listMigrations("sqlite").map((m) => m.id);
  const pg = listMigrations("postgres").map((m) => m.id);
  assert.equal(sqlite.includes("0004_commercial_runtime"), true);
  assert.equal(pg.includes("0004_commercial_runtime"), true);
});

test("catalog is versioned and clients cannot set amounts", () => {
  const catalog = catalogPublic();
  assert.equal(catalog.client_cannot_set_amount, true);
  assert.equal(catalog.live, false);
  assert.equal(PRICE_CATALOG.items.turnkey_low.amount_cents > 0, true);
  assert.equal(PRICE_CATALOG.items.enterprise_quote.amount_cents, null);
  assert.equal(PRICE_CATALOG.items.usage_verified_operation.metered_activated, false);
});

test("commercial project produces server-priced offers from a real demand", () => {
  const project = createCommercialProject({
    tenantId: "cus_1",
    customerId: "cus_1",
    problem: "Need a turnkey integration of email and github workflows",
    requestId: "req_1"
  });
  assert.equal(project.paid, false);
  assert.equal(project.live, false);
  assert.ok(project.offers.length >= 1);
  assert.equal(project.offers[0].client_amount_ignored, true);
  assert.equal(project.execution.mode, "PLAN");
});

test("accepting an offer ignores client amount and currency", () => {
  const offer = {
    id: "off_1",
    catalog_id: "turnkey_low",
    product: "Turnkey",
    model: "ONE_TIME",
    amount_cents: 50000,
    currency: "cad",
    pricing_version: "acorn.price.v1"
  };
  const accepted = acceptOffer({
    tenantId: "cus_1",
    customerId: "cus_1",
    projectId: "req_1",
    offer,
    clientAmount: 1,
    clientCurrency: "usd"
  });
  assert.equal(accepted.order.amount_cents, 50000);
  assert.equal(accepted.order.currency, "cad");
  assert.equal(accepted.client_amount_ignored, true);
  assert.equal(accepted.order.paid, false);
});

test("enterprise quote cannot become an order without a human", () => {
  const accepted = acceptOffer({
    tenantId: "t",
    customerId: "t",
    projectId: "p",
    offer: { id: "q", model: "ENTERPRISE", amount_cents: null, currency: "cad" }
  });
  assert.equal(accepted.order, null);
  assert.equal(accepted.state, "HOLD_HUMAN");
});

test("payment observation does not grant execution authority", () => {
  const order = {
    id: "ord_1", tenant_id: "cus_1", customer_id: "cus_1", project_id: "req_1",
    offer_id: "off_1", model: "ONE_TIME", amount_cents: 50000, currency: "cad",
    pricing_version: "acorn.price.v1", state: "CHECKOUT_CREATED"
  };
  const event = {
    id: "evt_pay",
    type: "payment_intent.succeeded",
    livemode: true,
    data: { object: { id: "pi_1", amount: 50000, currency: "cad", customer: "cus_stripe", metadata: { acorn_order_id: "ord_1", acorn_tenant_id: "cus_1" } } }
  };
  const confirmed = confirmPaymentFromEvent({ event, order, tenantId: "cus_1" });
  assert.equal(confirmed.order.state, "PAYMENT_OBSERVED");
  assert.equal(confirmed.execution_authorized, false);
  assert.equal(confirmed.live, false);
  assert.equal(confirmed.stripe_livemode, true);
  assert.equal(confirmed.stripe_livemode_is_not_acorn_live, true);
  assert.equal(confirmed.usage_rights.state, "GRANTED");
  assert.equal(confirmed.money_claim.paid, false);
});

test("revenue maximizer cannot spend, merge, or silently change prices", () => {
  const r = revenueMaximizerBounded([{ audience: "BUSINESS", gross_revenue: 10, verified: true }]);
  assert.equal(r.policy.auto_spend, false);
  assert.equal(r.policy.auto_merge, false);
  assert.equal(r.proposals[0].can_change_price_silently, false);
  assert.equal(r.live, false);
});

test("developer gateway remains provider-neutral and not live", () => {
  const d = developerSurface({ capabilities: ["evidence"] });
  assert.equal(d.live, false);
  assert.deepEqual(d.surfaces, ["WEB", "API", "SDK", "EMBED", "WHITE-LABEL", "ENTERPRISE"]);
  assert.equal(d.gateway.live, false);
});

test("physical customer flow: demand to offer to order to unconfigured checkout", async () => {
  await withServer(async ({ base }) => {
    const a = await register(base, "one@example.com");
    const created = await jsonReq(base, "/api/v1/requests", { method: "POST", token: a.token, body: { request: "Build a turnkey reporting project" } });
    assert.equal(created.status, 201);
    assert.equal(created.json.paid, undefined);
    assert.equal(created.json.proof.paid, false);
    assert.ok((created.json.offers || []).length >= 1);
    const projectId = created.json.request.id;
    const offer = created.json.offers.find((o) => o.amount_cents);
    const ordered = await jsonReq(base, "/api/v1/orders", {
      method: "POST",
      token: a.token,
      body: { project_id: projectId, offer_id: offer.id, amount_cents: 1, currency: "usd", paid: true, human_authorized: true }
    });
    assert.equal(ordered.status, 201);
    assert.equal(ordered.json.order.amount_cents, offer.amount_cents);
    assert.equal(ordered.json.client_amount_ignored, true);
    assert.equal(ordered.json.order.paid, false);
    const checkout = await jsonReq(base, "/api/v1/checkout", { method: "POST", token: a.token, body: { order_id: ordered.json.order.id } });
    assert.equal(checkout.status, 201);
    assert.equal(checkout.json.paid, false);
    assert.equal(checkout.json.live, false);
    assert.equal(checkout.json.error, "STRIPE_UNCONFIGURED");
    const got = await jsonReq(base, "/api/v1/requests/" + projectId, { token: a.token });
    assert.ok((got.json.offers || []).length >= 1);
  });
});

test("adversarial: fake webhook, invalid signature, replay, unknown event, fake tenant", async () => {
  const secret = "whsec_test_secret";
  await withServer(async ({ base, db }) => {
    const a = await register(base, "pay@example.com");
    const created = await jsonReq(base, "/api/v1/requests", { method: "POST", token: a.token, body: { request: "Need a project" } });
    const offer = created.json.offers.find((o) => o.amount_cents);
    const ordered = await jsonReq(base, "/api/v1/orders", { method: "POST", token: a.token, body: { project_id: created.json.request.id, offer_id: offer.id } });
    const orderId = ordered.json.order.id;
    const tenantId = a.customer.id;
    const amount = ordered.json.order.amount_cents;

    const fake = await fetch(base + "/api/v1/billing/webhook", {
      method: "POST",
      headers: { "content-type": "application/json", "stripe-signature": "t=1,v1=nope" },
      body: JSON.stringify({ id: "evt_fake", type: "payment_intent.succeeded", data: { object: { amount, currency: "cad" } } })
    });
    assert.equal(fake.status, 400);

    const body = JSON.stringify({
      id: "evt_ok",
      type: "payment_intent.succeeded",
      livemode: false,
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "pi_ok",
          object: "payment_intent",
          amount,
          currency: "cad",
          customer: "cus_stripe",
          metadata: { acorn_tenant_id: tenantId, acorn_order_id: orderId, acorn_customer_id: tenantId, acorn_project_id: created.json.request.id }
        }
      }
    });
    const header = sign(secret, body);
    const ok = await fetch(base + "/api/v1/billing/webhook", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8", "stripe-signature": header },
      body
    });
    const okJson = await ok.json();
    assert.equal(ok.status, 200);
    assert.equal(okJson.live, false);
    assert.equal(okJson.paid, false);
    assert.equal(okJson.execution_authorized, false);
    assert.equal(okJson.order_state, "PAYMENT_OBSERVED");

    const replay = await fetch(base + "/api/v1/billing/webhook", {
      method: "POST",
      headers: { "content-type": "application/json", "stripe-signature": header },
      body
    });
    const replayJson = await replay.json();
    assert.equal(replay.status, 200);
    assert.equal(replayJson.replay, true);

    const unknownBody = JSON.stringify({ id: "evt_weird", type: "radar.early_fraud_warning.created", data: { object: { id: "iss_1" } } });
    const unknown = await fetch(base + "/api/v1/billing/webhook", {
      method: "POST",
      headers: { "content-type": "application/json", "stripe-signature": sign(secret, unknownBody) },
      body: unknownBody
    });
    const unknownJson = await unknown.json();
    assert.equal(unknown.status, 200);
    assert.equal(unknownJson.unknown, true);

    const b = await register(base, "other@example.com");
    const steal = await jsonReq(base, "/api/v1/checkout", { method: "POST", token: b.token, body: { order_id: orderId } });
    assert.equal(steal.status, 404);

    const rights = await jsonReq(base, "/api/v1/usage-rights", { token: a.token });
    assert.equal(rights.status, 200);
    assert.ok((rights.json.rights || []).some((r) => r.state === "GRANTED"));

    const ledger = await jsonReq(base, "/api/v1/ledger", { token: a.token });
    assert.equal(ledger.json.paid, false);
    assert.equal(ledger.json.live, false);
    assert.equal(ledger.json.tax_advice, false);

    const stored = await db.get("SELECT * FROM commercial_orders WHERE id=$1", [orderId]);
    assert.equal(stored.state, "PAYMENT_OBSERVED");
  }, { STRIPE_WEBHOOK_SECRET: secret });
});

test("adversarial: unauthorized refund, fake paid, fake currency, HTTP cannot grant money", async () => {
  await withServer(async ({ base }) => {
    const a = await register(base, "sec@example.com");
    const refund = await jsonReq(base, "/api/v1/billing/refund", {
      method: "POST",
      token: a.token,
      body: { order_id: "ord_x", human_authorized: true, authorized: true }
    });
    assert.equal(refund.status, 403);
    assert.equal(refund.json.error, "HUMAN_AUTHORIZATION_REQUIRED");
    const quote = await jsonReq(base, "/api/v1/quotes", { method: "POST", token: a.token, body: { human_authorized: true } });
    assert.equal(quote.status, 403);
    const catalog = await jsonReq(base, "/api/v1/catalog", { token: a.token });
    assert.equal(catalog.json.live, false);
    assert.equal(catalog.json.catalog.client_cannot_set_amount, true);
  });
});

test("checkout with mocked stripe records server amount and does not claim paid", async () => {
  const fetchImpl = async (url, init) => {
    const body = String(init.body || "");
    assert.match(body, /unit_amount/);
    return new Response(JSON.stringify({
      id: "cs_test_liveish",
      url: "https://checkout.stripe.com/c/pay/cs_test_liveish",
      payment_status: "unpaid",
      livemode: false
    }), { status: 200 });
  };
  await withServer(async ({ base }) => {
    const a = await register(base, "stripe@example.com");
    const created = await jsonReq(base, "/api/v1/requests", { method: "POST", token: a.token, body: { request: "A priced project" } });
    const offer = created.json.offers.find((o) => o.amount_cents);
    const ordered = await jsonReq(base, "/api/v1/orders", { method: "POST", token: a.token, body: { project_id: created.json.request.id, offer_id: offer.id } });
    const checkout = await jsonReq(base, "/api/v1/checkout", { method: "POST", token: a.token, body: { order_id: ordered.json.order.id } });
    assert.equal(checkout.status, 201);
    assert.equal(checkout.json.checkout.url.startsWith("https://checkout.stripe.com/"), true);
    assert.equal(checkout.json.paid, false);
    assert.equal(checkout.json.proof.checkout_created, true);
    assert.equal(checkout.json.proof.payment_observed, false);
  }, { STRIPE_SECRET_KEY: "sk_test_123", ACORN_PUBLIC_URL: "http://127.0.0.1:8080", ACORN_STRIPE_FETCH: fetchImpl });
});

test("commercial truth never self-declares LIVE or PAID", async () => {
  await withServer(async ({ base }) => {
    const a = await register(base, "truth@example.com");
    const snap = await jsonReq(base, "/api/v1/commercial", { token: a.token });
    assert.equal(snap.json.live, false);
    assert.equal(snap.json.paid, false);
    assert.equal(snap.json.verified, false);
    assert.equal(snap.json.rail.live, false);
  });
});

test("self-build routes remain after commercial integration", async () => {
  await withServer(async ({ base }) => {
    const a = await register(base, "build@example.com");
    const snap = await jsonReq(base, "/api/v1/self-build", { token: a.token });
    assert.equal(snap.status, 200);
    assert.equal(snap.json.live, false);
    assert.equal(snap.json.auto_merge, false);
    assert.equal(snap.json.authority, "carl");
    const created = await jsonReq(base, "/api/v1/requests", { method: "POST", token: a.token, body: { request: "Need a turnkey reporting project" } });
    assert.ok(Array.isArray(created.json.gaps));
    assert.ok(Array.isArray(created.json.holds));
  });
});

test("mismatched webhook amount does not grant rights or execution", async () => {
  const secret = "whsec_mismatch";
  await withServer(async ({ base }) => {
    const a = await register(base, "mis@example.com");
    const created = await jsonReq(base, "/api/v1/requests", { method: "POST", token: a.token, body: { request: "Need a project" } });
    const offer = created.json.offers.find((o) => o.amount_cents);
    const ordered = await jsonReq(base, "/api/v1/orders", { method: "POST", token: a.token, body: { project_id: created.json.request.id, offer_id: offer.id } });
    const body = JSON.stringify({
      id: "evt_mismatch",
      type: "payment_intent.succeeded",
      livemode: false,
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "pi_bad",
          amount: 1,
          currency: "cad",
          metadata: { acorn_tenant_id: a.customer.id, acorn_order_id: ordered.json.order.id }
        }
      }
    });
    const res = await fetch(base + "/api/v1/billing/webhook", {
      method: "POST",
      headers: { "content-type": "application/json", "stripe-signature": sign(secret, body) },
      body
    });
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.order_state, "MISMATCH");
    assert.equal(json.execution_authorized, false);
    assert.equal(json.live, false);
    const rights = await jsonReq(base, "/api/v1/usage-rights", { token: a.token });
    assert.equal((rights.json.rights || []).some((r) => r.state === "GRANTED"), false);
  }, { STRIPE_WEBHOOK_SECRET: secret });
});

test("malformed webhook body is retained as failure without crash", async () => {
  const secret = "whsec_malformed";
  await withServer(async ({ base }) => {
    const res = await fetch(base + "/api/v1/billing/webhook", {
      method: "POST",
      headers: { "content-type": "application/json", "stripe-signature": sign(secret, "not-json") },
      body: "not-json"
    });
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.live, false);
  }, { STRIPE_WEBHOOK_SECRET: secret });
});

test("order reuse is idempotent and usage billing stays inactive", async () => {
  await withServer(async ({ base }) => {
    const a = await register(base, "idem@example.com");
    const created = await jsonReq(base, "/api/v1/requests", { method: "POST", token: a.token, body: { request: "A priced project" } });
    const offer = created.json.offers.find((o) => o.amount_cents);
    const first = await jsonReq(base, "/api/v1/orders", { method: "POST", token: a.token, body: { project_id: created.json.request.id, offer_id: offer.id } });
    const second = await jsonReq(base, "/api/v1/orders", { method: "POST", token: a.token, body: { project_id: created.json.request.id, offer_id: offer.id } });
    assert.equal(second.status, 200);
    assert.equal(second.json.reused, true);
    assert.equal(second.json.order.id, first.json.order.id);
    const usage = await jsonReq(base, "/api/v1/usage", { method: "POST", token: a.token, body: { quantity: 12 } });
    assert.equal(usage.status, 201);
    assert.equal(usage.json.usage.metered_billing_activated, false);
    assert.equal(usage.json.live, false);
    const invoice = await jsonReq(base, "/api/v1/invoices", { method: "POST", token: a.token, body: { order_id: first.json.order.id, human_authorized: true } });
    assert.equal(invoice.status, 403);
    const pay = await jsonReq(base, "/pay/success");
    assert.equal(pay.status, 200);
  });
});

test("state allowlist includes delivery value renewal expansion", () => {
  for (const entity of ["DELIVERY", "VALUE", "RENEWAL", "EXPANSION"]) {
    assert.equal(STATE_ENTITIES.includes(entity), true);
  }
});

test("advanceAfterPayment holds delivery and does not authorize execution", () => {
  const order = {
    id: "ord_1",
    tenant_id: "cus_1",
    customer_id: "cus_1",
    project_id: "req_1",
    model: "SUBSCRIPTION",
    amount_cents: 4900,
    currency: "cad",
    state: "PAYMENT_OBSERVED"
  };
  const cycle = advanceAfterPayment({
    order,
    entry: { gross_amount: 4900, epistemic: "OBSERVED" },
    gaps: [{ capability: "connector-github" }]
  });
  assert.equal(cycle.stage, "EXECUTION_HOLD");
  assert.equal(cycle.execution_authorized, false);
  assert.equal(cycle.delivered, false);
  assert.equal(cycle.live, false);
  assert.equal(cycle.delivery.state, "WAITING_HUMAN");
  assert.equal(cycle.delivery.delivered, false);
  assert.equal(cycle.value.verified, false);
  assert.equal(cycle.value.revenue_cents, 4900);
  assert.equal(cycle.value.cost_cents, null);
  assert.equal(cycle.renewal.state, "PROPOSED");
  assert.equal(cycle.renewal.auto_renew_in_acorn, false);
  assert.equal(cycle.expansion.state, "RECOMMENDATION_ONLY");
  assert.equal(cycle.expansion.auto_contract, false);
  assert.deepEqual(cycle.expansion.next_problems, ["connector-github"]);
});

test("payment observed persists delivery value renewal without granting execution", async () => {
  const secret = "whsec_cycle";
  await withServer(async ({ base }) => {
    const a = await register(base, "cycle@example.com");
    const created = await jsonReq(base, "/api/v1/requests", { method: "POST", token: a.token, body: { request: "Need a monthly capability and a github connector" } });
    assert.equal(created.status, 201);
    const offer = created.json.offers.find((o) => o.model === "SUBSCRIPTION") || created.json.offers.find((o) => o.amount_cents);
    const ordered = await jsonReq(base, "/api/v1/orders", { method: "POST", token: a.token, body: { project_id: created.json.request.id, offer_id: offer.id } });
    const orderId = ordered.json.order.id;
    const amount = ordered.json.order.amount_cents;
    const body = JSON.stringify({
      id: "evt_cycle",
      type: "payment_intent.succeeded",
      livemode: false,
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "pi_cycle",
          object: "payment_intent",
          amount,
          currency: "cad",
          customer: "cus_stripe",
          metadata: { acorn_tenant_id: a.customer.id, acorn_order_id: orderId, acorn_project_id: created.json.request.id }
        }
      }
    });
    const paid = await fetch(base + "/api/v1/billing/webhook", {
      method: "POST",
      headers: { "content-type": "application/json", "stripe-signature": sign(secret, body) },
      body
    });
    const paidJson = await paid.json();
    assert.equal(paid.status, 200);
    assert.equal(paidJson.order_state, "PAYMENT_OBSERVED");
    assert.equal(paidJson.execution_authorized, false);
    assert.equal(paidJson.delivered, false);
    assert.equal(paidJson.live, false);
    assert.equal(paidJson.cycle.stage, "EXECUTION_HOLD");
    assert.equal(paidJson.cycle.execution_authorized, false);

    const got = await jsonReq(base, "/api/v1/requests/" + created.json.request.id, { token: a.token });
    assert.equal(got.status, 200);
    assert.equal(got.json.delivery.state, "WAITING_HUMAN");
    assert.equal(got.json.delivery.delivered, false);
    assert.equal(got.json.value.verified, false);
    assert.equal(got.json.value.live, false);
    assert.equal(got.json.proof.execution_authorized, false);
    assert.equal(got.json.proof.delivered, false);
    assert.equal(got.json.orders[0].state, "PAYMENT_OBSERVED");
    assert.equal(got.json.orders[0].paid, false);
    assert.equal(got.json.project.state, "EXECUTION_HOLD");

    const renewal = await jsonReq(base, "/api/v1/renewal", { token: a.token });
    assert.equal(renewal.status, 200);
    assert.equal(renewal.json.auto_renew_in_acorn, false);
    assert.equal(renewal.json.live, false);
    if (offer.model === "SUBSCRIPTION") {
      assert.equal(got.json.renewal.state, "PROPOSED");
      assert.equal(got.json.renewal.auto_renew_in_acorn, false);
    }

    const expansion = await jsonReq(base, "/api/v1/expansion", { token: a.token });
    assert.equal(expansion.status, 200);
    assert.equal(expansion.json.live, false);
    assert.equal(expansion.json.auto_contract, false);

    const revenue = await jsonReq(base, "/api/v1/revenue", { token: a.token });
    assert.equal(revenue.status, 200);
    assert.equal(revenue.json.live, false);
    assert.equal(revenue.json.auto_spend, false);
    assert.equal(revenue.json.policy.auto_spend, false);
    assert.equal(revenue.json.policy.auto_merge, false);
    assert.ok((revenue.json.proposals || []).every((p) => p.can_spend !== true && p.can_merge !== true));

    const b = await register(base, "other-cycle@example.com");
    const steal = await jsonReq(base, "/api/v1/requests/" + created.json.request.id, { token: b.token });
    assert.equal(steal.status, 404);
  }, { STRIPE_WEBHOOK_SECRET: secret });
});
