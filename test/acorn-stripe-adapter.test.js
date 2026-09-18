import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  classifyStripeKey,
  flattenStripeParams,
  verifyWebhookSignature,
  parseStripeEvent,
  createStripeAdapter,
  createFinancialRail,
  stripeTruth
} from "../scripts/acorn-stripe-adapter.mjs";
import { createLedgerEntry, applyStripeEventToLedger, ledgerSnapshot, moneyOrNull } from "../scripts/acorn-economic-ledger.mjs";
import { describeUsageRights, rightsFromOffer, grantUsageRights, expireUsageRights } from "../scripts/acorn-usage-rights.mjs";

function sign(secret, body, ts = Math.floor(Date.now() / 1000)) {
  const v1 = crypto.createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
  return { header: `t=${ts},v1=${v1}`, ts };
}

test("stripe key presence is not live and test is not live", () => {
  assert.equal(classifyStripeKey(""), "UNCONFIGURED");
  assert.equal(classifyStripeKey("sk_test_abc"), "TEST");
  assert.equal(classifyStripeKey("sk_live_abc"), "LIVE_KEY_PRESENT");
  const adapter = createStripeAdapter({ env: { STRIPE_SECRET_KEY: "sk_live_abc" } });
  const truth = stripeTruth(adapter);
  assert.equal(truth.live, false);
  assert.equal(truth.mode, "LIVE_KEY_PRESENT");
  assert.equal(truth.test_is_not_live, true);
  assert.equal(truth.key_present_is_not_live, true);
});

test("financial rail is replaceable and unknown providers fail closed", () => {
  const rail = createFinancialRail({ provider: "stripe", env: {} });
  assert.equal(rail.provider, "stripe");
  assert.equal(rail.replaceable, true);
  assert.throws(() => createFinancialRail({ provider: "paypal" }), /UNKNOWN_FINANCIAL_RAIL/);
});

test("webhook signature rejects invalid, replay-window, and missing secret", () => {
  const secret = "whsec_test";
  const body = "{\"id\":\"evt_1\"}";
  const { header } = sign(secret, body);
  assert.equal(verifyWebhookSignature({ rawBody: body, signature: header, secret }).valid, true);
  assert.equal(verifyWebhookSignature({ rawBody: body, signature: header, secret: "other" }).valid, false);
  assert.equal(verifyWebhookSignature({ rawBody: body + "x", signature: header, secret }).reason, "SIGNATURE_INVALID");
  assert.equal(verifyWebhookSignature({ rawBody: body, signature: "t=1,v1=dead", secret }).valid, false);
  const old = sign(secret, body, Math.floor(Date.now() / 1000) - 400);
  assert.equal(verifyWebhookSignature({ rawBody: body, signature: old.header, secret }).reason, "SIGNATURE_EXPIRED");
  assert.equal(verifyWebhookSignature({ rawBody: body, signature: header, secret: "" }).reason, "WEBHOOK_SECRET_MISSING");
});

test("malformed stripe events do not crash the parser", () => {
  assert.throws(() => parseStripeEvent("not-json"), /MALFORMED_STRIPE_EVENT/);
  assert.throws(() => parseStripeEvent("{}"), /MALFORMED_STRIPE_EVENT/);
  const ev = parseStripeEvent(JSON.stringify({ id: "evt_x", type: "ping.unknown", livemode: true, data: { object: {} } }));
  assert.equal(ev.live, false);
  assert.equal(ev.paid, false);
  assert.equal(ev.livemode, true);
});

test("checkout amount is chosen server-side and client urls stay on origin", async () => {
  const seen = [];
  const fetchImpl = async (url, init) => {
    seen.push({ url, body: String(init.body || ""), headers: init.headers });
    return new Response(JSON.stringify({
      id: "cs_test_1",
      url: "https://checkout.stripe.com/c/pay/cs_test_1",
      payment_status: "unpaid",
      livemode: false
    }), { status: 200, headers: { "content-type": "application/json" } });
  };
  const adapter = createStripeAdapter({
    env: { STRIPE_SECRET_KEY: "sk_test_123", ACORN_PUBLIC_URL: "https://acorn.example" },
    fetchImpl
  });
  const session = await adapter.createCheckoutSession({
    order: { id: "ord_1", tenant_id: "cus_1", customer_id: "cus_1", project_id: "req_1", offer_id: "off_1", amount_cents: 250000, currency: "cad", pricing_version: "acorn.price.v1", product_name: "Turnkey" },
    successUrl: "https://evil.example/steal",
    cancelUrl: "https://acorn.example/pay/cancel"
  });
  assert.equal(session.paid, false);
  assert.equal(session.live, false);
  assert.equal(session.checkout_created_is_not_paid, true);
  assert.match(seen[0].body, /unit_amount%5D=250000/);
  assert.match(seen[0].body, /success_url=https%3A%2F%2Facorn.example%2Fpay%2Fsuccess/);
  assert.equal(seen[0].body.includes("evil.example"), false);
});

test("refund without human authorization is denied in the adapter", async () => {
  const adapter = createStripeAdapter({ env: { STRIPE_SECRET_KEY: "sk_test_123" }, fetchImpl: async () => new Response("{}") });
  await assert.rejects(() => adapter.refund({ paymentIntentId: "pi_1", humanAuthorized: false }), /HUMAN_AUTHORIZATION_REQUIRED/);
});

test("unconfigured stripe fails closed", async () => {
  const adapter = createStripeAdapter({ env: {} });
  await assert.rejects(() => adapter.createCheckoutSession({ order: { id: "o", amount_cents: 100, currency: "cad" } }), /STRIPE_UNCONFIGURED/);
});

test("flatten encodes nested stripe params", () => {
  const q = flattenStripeParams({ metadata: { acorn_order_id: "ord_1" }, line_items: [{ quantity: 1 }] }).toString();
  assert.match(q, /metadata%5Bacorn_order_id%5D=ord_1/);
});

test("ledger never invents net or tax and missing is not zero", () => {
  const e = createLedgerEntry({
    tenant_id: "t1",
    kind: "PAYMENT",
    epistemic: "OBSERVED",
    gross_amount: 50000,
    currency: "cad"
  });
  assert.equal(e.net_amount, null);
  assert.equal(e.fees, null);
  assert.equal(e.taxes, null);
  assert.equal(e.paid, false);
  assert.equal(e.live, false);
  assert.equal(moneyOrNull(undefined), null);
  const withFee = createLedgerEntry({ tenant_id: "t1", gross_amount: 50000, fees: 1500 });
  assert.equal(withFee.net_amount, 48500);
  const snap = ledgerSnapshot([e]);
  assert.equal(snap.fees_cents, null);
  assert.equal(snap.net_cents, null);
  assert.equal(snap.paid, false);
  assert.equal(snap.tax_advice, false);
});

test("stripe event with mismatched order amount reconciles as MISMATCH", () => {
  const event = {
    id: "evt_m",
    type: "payment_intent.succeeded",
    data: { object: { id: "pi_1", amount: 1, currency: "cad", metadata: { acorn_order_id: "ord_1" } } }
  };
  const entry = applyStripeEventToLedger(event, { order: { id: "ord_1", amount_cents: 50000, currency: "cad" } });
  assert.equal(entry.reconciliation, "MISMATCH");
  assert.equal(entry.paid, false);
});

test("usage rights never infer perpetual silently", () => {
  const pending = describeUsageRights({ tenant_id: "t", customer_id: "c", product: "turnkey", rights: ["CUSTOMER_USE"] });
  assert.equal(pending.perpetual, false);
  assert.equal(pending.perpetual_inferred, false);
  const grantedTooEarly = grantUsageRights(pending, { paymentObserved: false });
  assert.equal(grantedTooEarly.state, "PENDING");
  const versioned = rightsFromOffer({ id: "turnkey_low", model: "ONE_TIME", pricing_version: "acorn.price.v1" }, { tenant_id: "t", customer_id: "c" });
  assert.equal(versioned.duration, "PERPETUAL_VERSIONED");
  assert.equal(versioned.perpetual, true);
  const granted = grantUsageRights(versioned, { paymentObserved: true });
  assert.equal(granted.state, "GRANTED");
  const expired = expireUsageRights({ ...granted, valid_until: "2000-01-01T00:00:00.000Z" }, { at: "2026-01-01T00:00:00.000Z" });
  assert.equal(expired.expired, false);
  assert.equal(expired.false_because_expired, false);
});
