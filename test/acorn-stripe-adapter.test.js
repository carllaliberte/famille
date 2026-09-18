import test from "node:test";
import assert from "node:assert/strict";
import {
  STRIPE_POLICY,
  loadStripeConfig,
  publicStripeConfig,
  rejectClientPrice,
  requireMoneyAuthority,
  verifyStripeSignature,
  signStripeWebhook,
  classifyStripeEvent,
  observeStripeMoney,
  createCheckoutSession,
  createBillingPortalSession,
  enterpriseDocument,
  usageBasedExtension,
  stripeAdapterSnapshot,
  grantServerAuthority,
  formEncode,
} from "../scripts/acorn-stripe-adapter.mjs";

test("stripe adapter separates test, unconfigured, hold_live and live", () => {
  assert.equal(loadStripeConfig({}).mode, "unconfigured");
  assert.equal(loadStripeConfig({ STRIPE_TEST_SECRET_KEY: "sk_test_x" }).mode, "test");
  assert.equal(loadStripeConfig({ STRIPE_LIVE_SECRET_KEY: "sk_live_x" }).mode, "hold_live");
  assert.equal(loadStripeConfig({ STRIPE_LIVE_SECRET_KEY: "sk_live_x", STRIPE_LIVE_ENABLED: "1" }).mode, "live");
  const pub = publicStripeConfig(loadStripeConfig({ STRIPE_TEST_SECRET_KEY: "sk_test_x" }));
  assert.equal(pub.secret, undefined);
  assert.equal(pub.configured, true);
  assert.equal(pub.live, false);
  assert.equal(STRIPE_POLICY.checkout_is_not_payment, true);
});

test("client price fields are rejected", () => {
  const rejected = rejectClientPrice({ amount: 12, currency: "usd" });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.reason, "CLIENT_PRICE_REJECTED");
  assert.ok(rejected.attempted.includes("amount"));
  assert.equal(rejectClientPrice({ catalog_id: "custom" }).ok, true);
});

test("money authority stays with Carl", () => {
  const denied = requireMoneyAuthority({ action: "REFUND", authority: { actor: "cursor" } });
  assert.equal(denied.ok, false);
  assert.equal(denied.state, "HOLD_HUMAN");
  const granted = requireMoneyAuthority({ action: "REFUND", authority: grantServerAuthority({ actor: "carl" }) });
  assert.equal(granted.ok, true);
});

test("webhook signature verifies, rejects tamper, and blocks replay outside window", () => {
  const secret = "whsec_test";
  const payload = "{\"id\":\"evt_1\"}";
  const header = signStripeWebhook({ payload, secret, timestamp: 1_700_000_000 });
  const ok = verifyStripeSignature({ payload, header, secret, now: 1_700_000_000_000 });
  assert.equal(ok.verified, true);
  const bad = verifyStripeSignature({ payload: "{\"id\":\"evt_2\"}", header, secret, now: 1_700_000_000_000 });
  assert.equal(bad.verified, false);
  assert.equal(bad.reason, "SIGNATURE_INVALID");
  const replay = verifyStripeSignature({ payload, header, secret, now: 1_700_000_400_000 });
  assert.equal(replay.reason, "REPLAY_WINDOW_EXCEEDED");
  assert.equal(verifyStripeSignature({ payload, header, secret: "" }).reason, "WEBHOOK_SECRET_MISSING");
});

test("checkout completed is not payment and unknown events stay observed", () => {
  const checkout = classifyStripeEvent({ id: "evt_c", type: "checkout.session.completed", data: { object: { id: "cs_1" } } });
  assert.equal(checkout.class, "CHECKOUT_COMPLETED");
  assert.equal(checkout.checkout_is_not_payment, true);
  const unknown = classifyStripeEvent({ id: "evt_u", type: "radar.early_fraud_warning.created", data: { object: { id: "issfr_1" } } });
  assert.equal(unknown.class, "OBSERVED_UNKNOWN");
  assert.equal(unknown.known, false);
});

test("missing stripe amounts stay null and are not invented as zero", () => {
  const empty = observeStripeMoney({});
  assert.equal(empty.gross, null);
  assert.equal(empty.fee, null);
  assert.equal(empty.net, null);
  assert.equal(empty.invented, false);
  const partial = observeStripeMoney({ amount_total: 5000, currency: "cad" });
  assert.equal(partial.gross, 5000);
  assert.equal(partial.fee, null);
  assert.equal(partial.net, null);
  const full = observeStripeMoney({ amount: 5000, fee: 150, currency: "cad" });
  assert.equal(full.net, 4850);
});

test("checkout session is server-priced and test-only unless Carl enables live", async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url, body: String(opts.body), headers: opts.headers });
    return { ok: true, status: 200, text: async () => JSON.stringify({ id: "cs_test_1", url: "https://checkout.stripe.com/c/pay/cs_test_1", livemode: false }) };
  };
  const offer = { offer_id: "offer_1", name: "Custom", currency: "CAD", unit_amount: 5000 };
  const order = { order_id: "order_1", tenant_id: "cus_1", project_id: "proj_1" };
  const created = await createCheckoutSession({
    config: loadStripeConfig({ STRIPE_TEST_SECRET_KEY: "sk_test_x" }),
    offer,
    order,
    customer: { customer_id: "cus_1", email: "a@example.com" },
    client: { amount: 1 },
    fetchImpl,
  });
  assert.equal(created.ok, false);
  assert.equal(created.reason, "CLIENT_PRICE_REJECTED");
  const ok = await createCheckoutSession({
    config: loadStripeConfig({ STRIPE_TEST_SECRET_KEY: "sk_test_x" }),
    offer,
    order,
    customer: { customer_id: "cus_1", email: "a@example.com" },
    fetchImpl,
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.checkout_is_not_payment, true);
  assert.equal(ok.live, false);
  assert.match(calls[0].url, /^https:\/\/api\.stripe\.com\/v1\/checkout\/sessions$/);
  assert.match(calls[0].body, /unit_amount%5D=5000/);
  assert.doesNotMatch(calls[0].body, /unit_amount%5D=1/);
  const liveHold = await createCheckoutSession({
    config: loadStripeConfig({ STRIPE_LIVE_SECRET_KEY: "sk_live_x" }),
    offer,
    order,
    customer: { customer_id: "cus_1" },
    liveMode: true,
    fetchImpl,
  });
  assert.equal(liveHold.state, "HOLD_HUMAN");
});

test("customer portal, invoice abstraction and usage extension do not go live", async () => {
  const fetchImpl = async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ url: "https://billing.stripe.com/p/session/test" }) });
  const portal = await createBillingPortalSession({
    config: loadStripeConfig({ STRIPE_TEST_SECRET_KEY: "sk_test_x" }),
    stripeCustomerId: "cus_123",
    fetchImpl,
  });
  assert.equal(portal.ok, true);
  assert.equal(portal.live, false);
  const invoice = enterpriseDocument({ kind: "quote", offer: { offer_id: "offer_1", currency: "CAD", unit_amount: 5000 } });
  assert.equal(invoice.type, "QUOTE");
  assert.equal(invoice.live_document_created, false);
  const usage = usageBasedExtension({ offer: { offer_id: "offer_1" }, units: 12 });
  assert.equal(usage.ready, false);
  assert.equal(usage.recorded_to_stripe, false);
  assert.equal(formEncode({ metadata: { order_id: "o1" } }).includes("metadata%5Border_id%5D=o1"), true);
  const snap = stripeAdapterSnapshot({});
  assert.equal(snap.live, false);
  assert.equal(snap.policy.stripe_is_not_authority, true);
});
