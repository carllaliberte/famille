import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLiveDatabase } from "../live/database.mjs";
import { createLiveServer } from "../live/server.mjs";
import { signStripeWebhook } from "../scripts/acorn-stripe-adapter.mjs";
import { listMigrations } from "../live/migrate.mjs";

function dbEnv(path) {
  return {
    ACORN_DB_ADAPTER: "sqlite",
    ACORN_DB: path,
    NODE_ENV: "test",
    STRIPE_TEST_SECRET_KEY: "sk_test_x",
    STRIPE_TEST_WEBHOOK_SECRET: "whsec_test",
    STRIPE_CATALOG_PRICES: "custom:5000:CAD",
  };
}

async function withServer(fn, extra = {}) {
  const dir = mkdtempSync(join(tmpdir(), "acorn-commerce-"));
  const path = join(dir, "state.db");
  const env = { ...dbEnv(path), ...extra.env };
  const db = await createLiveDatabase({ env, path });
  const { server } = await createLiveServer({ env, db, stripeFetch: extra.stripeFetch });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  try { return await fn({ base, db, port }); }
  finally {
    await new Promise((resolve) => server.close(resolve));
    await db.close();
  }
}

async function jsonReq(base, path, { method = "GET", token, body, headers = {} } = {}) {
  const h = { "content-type": "application/json", ...headers };
  if (token) h.authorization = "Bearer " + token;
  const res = await fetch(base + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await res.json();
  return { status: res.status, json };
}

test("commerce migration is present for sqlite and postgres", () => {
  assert.ok(listMigrations("sqlite").some((row) => row.id === "0004_commerce"));
  assert.ok(listMigrations("postgres").some((row) => row.id === "0004_commerce"));
});

test("catalog is public, priced only by the server, and checkout rejects client amounts", async () => {
  const stripeFetch = async (url, opts) => {
    assert.match(url, /^https:\/\/api\.stripe\.com\/v1\/checkout\/sessions$/);
    assert.match(String(opts.body), /unit_amount%5D=5000/);
    return { ok: true, status: 200, text: async () => JSON.stringify({ id: "cs_test_1", url: "https://checkout.stripe.com/c/pay/cs_test_1", livemode: false }) };
  };
  await withServer(async ({ base }) => {
    const catalog = await jsonReq(base, "/api/v1/commerce/catalog");
    assert.equal(catalog.status, 200);
    assert.equal(catalog.json.client_price_accepted, false);
    assert.equal(catalog.json.live, false);
    const custom = catalog.json.catalog.find((row) => row.id === "custom");
    assert.equal(custom.unit_amount, 5000);
    const reg = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "Ada", email: "ada-commerce@example.com", password: "correct-horse" } });
    const rejected = await jsonReq(base, "/api/v1/commerce/checkout", { method: "POST", token: reg.json.token, body: { catalog_id: "custom", amount: 1 } });
    assert.equal(rejected.status, 400);
    assert.equal(rejected.json.error, "CLIENT_PRICE_REJECTED");
    const live = await jsonReq(base, "/api/v1/commerce/checkout", { method: "POST", token: reg.json.token, body: { catalog_id: "custom", live: true } });
    assert.equal(live.status, 409);
    assert.equal(live.json.state, "HOLD_HUMAN");
    const checkout = await jsonReq(base, "/api/v1/commerce/checkout", { method: "POST", token: reg.json.token, body: { catalog_id: "custom", problem: "Need a measured custom delivery" } });
    assert.equal(checkout.status, 201);
    assert.equal(checkout.json.checkout_is_not_payment, true);
    assert.equal(checkout.json.checkout.session_id, "cs_test_1");
    assert.equal(checkout.json.live, false);
  }, { stripeFetch });
});

test("signed webhook is idempotent; unsigned and live events do not become receipts", async () => {
  await withServer(async ({ base, db }) => {
    const reg = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "Ada", email: "ada-hook@example.com", password: "correct-horse" } });
    const offer = await jsonReq(base, "/api/v1/commerce/offers", { method: "POST", token: reg.json.token, body: { catalog_id: "custom", problem: "Need evidence" } });
    assert.equal(offer.status, 201);
    const checkout = await jsonReq(base, "/api/v1/commerce/checkout", {
      method: "POST",
      token: reg.json.token,
      body: { catalog_id: "custom", problem: "Need evidence" },
    });
    const orderId = checkout.json.order.order_id;
    const checkoutEvent = {
      id: "evt_checkout_1",
      type: "checkout.session.completed",
      livemode: false,
      data: {
        object: {
          id: "cs_test_1",
          amount_total: 5000,
          currency: "cad",
          metadata: { tenant_id: reg.json.customer?.id || "", customer_id: "", order_id: orderId },
        },
      },
    };
    const payload = JSON.stringify(checkoutEvent);
    const header = signStripeWebhook({ payload, secret: "whsec_test", timestamp: Math.floor(Date.now() / 1000) });
    const first = await fetch(base + "/webhooks/stripe", { method: "POST", headers: { "stripe-signature": header, "content-type": "application/json" }, body: payload });
    const firstJson = await first.json();
    assert.equal(first.status, 200);
    assert.equal(firstJson.payment_state, "CHECKOUT_COMPLETED");
    assert.equal(firstJson.checkout_is_not_payment, true);
    const second = await fetch(base + "/webhooks/stripe", { method: "POST", headers: { "stripe-signature": header, "content-type": "application/json" }, body: payload });
    const secondJson = await second.json();
    assert.equal(second.status, 200);
    assert.equal(secondJson.duplicate, true);
    const unsigned = await fetch(base + "/webhooks/stripe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: "evt_bad", type: "payment_intent.succeeded", data: { object: { id: "pi_x" } } }) });
    assert.equal(unsigned.status, 400);
    const livePayload = JSON.stringify({ id: "evt_live_1", type: "payment_intent.succeeded", livemode: true, data: { object: { id: "pi_live" } } });
    const liveHeader = signStripeWebhook({ payload: livePayload, secret: "whsec_test", timestamp: Math.floor(Date.now() / 1000) });
    const live = await fetch(base + "/webhooks/stripe", { method: "POST", headers: { "stripe-signature": liveHeader, "content-type": "application/json" }, body: livePayload });
    const liveJson = await live.json();
    assert.equal(live.status, 202);
    assert.equal(liveJson.state, "HOLD_HUMAN");
    const payEvent = {
      id: "evt_pay_1",
      type: "payment_intent.succeeded",
      livemode: false,
      data: { object: { id: "pi_1", amount_received: 5000, currency: "cad", fee: 150, metadata: { tenant_id: "", order_id: orderId } } },
    };
    const payPayload = JSON.stringify(payEvent);
    const payHeader = signStripeWebhook({ payload: payPayload, secret: "whsec_test", timestamp: Math.floor(Date.now() / 1000) });
    const paid = await fetch(base + "/webhooks/stripe", { method: "POST", headers: { "stripe-signature": payHeader, "content-type": "application/json" }, body: payPayload });
    const paidJson = await paid.json();
    assert.equal(paid.status, 200);
    assert.equal(paidJson.payment_state, "PAID");
    const journey = await jsonReq(base, "/api/v1/commerce/journey", { token: reg.json.token });
    assert.equal(journey.json.live, false);
    const ledger = await jsonReq(base, "/api/v1/commerce/ledger", { token: reg.json.token });
    const paidEntry = ledger.json.entries.find((row) => row.stripe_event_id === "evt_pay_1");
    assert.equal(paidEntry.gross, 5000);
    assert.equal(paidEntry.fee, 150);
    assert.equal(paidEntry.net, 4850);
    const invoice = await jsonReq(base, "/api/v1/commerce/invoice", { method: "POST", token: reg.json.token, body: { kind: "quote" } });
    assert.equal(invoice.json.hold_human, true);
    const usage = await jsonReq(base, "/api/v1/commerce/usage", { method: "POST", token: reg.json.token, body: { offer_id: offer.json.offer.offer_id, units: 3 } });
    assert.equal(usage.json.usage.recorded_to_stripe, false);
    const events = await db.all("SELECT id,processing_state FROM acorn_stripe_events");
    assert.ok(events.some((row) => row.id === "evt_checkout_1" && row.processing_state === "PROCESSED"));
    assert.ok(events.some((row) => row.id === "evt_bad" && row.processing_state === "REJECTED"));
  }, {
    stripeFetch: async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ id: "cs_test_1", url: "https://checkout.stripe.com/c/pay/cs_test_1", livemode: false }) }),
  });
});

test("HTTP client cannot grant commerce or money authority", async () => {
  await withServer(async ({ base }) => {
    const reg = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "Ada", email: "ada-auth@example.com", password: "correct-horse" } });
    const spoof = await jsonReq(base, "/api/v1/commerce/checkout", {
      method: "POST",
      token: reg.json.token,
      body: { catalog_id: "custom", human_authorized: true, authority: "carl", amount: 9 },
    });
    assert.equal(spoof.status, 400);
    assert.equal(spoof.json.error, "CLIENT_PRICE_REJECTED");
  });
});
