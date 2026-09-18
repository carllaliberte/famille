import test from "node:test";
import assert from "node:assert/strict";
import {
  COMMERCIAL_STAGES,
  COMMERCIAL_POLICY,
  publicCatalog,
  serverPriceTable,
  commercialJourney,
  applyStripeObservation,
  buildCommercialLedgerEntry,
  reconcileEconomicRecords,
  createVersionedOffer,
  paymentStateFromClass,
} from "../scripts/acorn-commercial-runtime.mjs";
import { signStripeWebhook, verifyStripeSignature } from "../scripts/acorn-stripe-adapter.mjs";

const env = { STRIPE_CATALOG_PRICES: "custom:5000:CAD,evidence:2500:CAD" };

test("server catalog never accepts a browser price", () => {
  const table = serverPriceTable(env);
  assert.equal(table.custom.unit_amount, 5000);
  const catalog = publicCatalog(env);
  assert.equal(catalog.every((row) => row.client_may_set_price === false), true);
  const blocked = createVersionedOffer({
    catalog_id: "custom",
    customer: { customer_id: "c1", tenant_id: "c1" },
    project: { project_id: "p1" },
    unit_amount: 5000,
    currency: "CAD",
    client: { unit_amount: 1 },
  });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, "CLIENT_PRICE_REJECTED");
});

test("journey persists the named commercial stages without claiming LIVE", () => {
  assert.ok(COMMERCIAL_STAGES.includes("PROSPECT"));
  assert.ok(COMMERCIAL_STAGES.includes("RENEWAL"));
  const journey = commercialJourney({
    customer_id: "acme",
    name: "Acme",
    request: "Need measured evidence delivery",
    capabilities: ["evidence", "general"],
    catalog_id: "custom",
    unit_amount: 5000,
    currency: "CAD",
    human_authorized: false,
    env,
  });
  assert.equal(journey.live, false);
  assert.equal(journey.policy.checkout_is_not_payment, true);
  assert.equal(journey.stage, "HOLD_HUMAN");
  assert.equal(journey.offer.price_source, "SERVER_CATALOG");
  assert.equal(journey.offer.unit_amount, 5000);
  assert.equal(journey.truth.live, false);
  assert.equal(COMMERCIAL_POLICY.absence_is_not_zero, true);
});

test("checkout webhook does not mark payment; signed payment_intent does", () => {
  const secret = "whsec_test";
  const checkoutEvent = {
    id: "evt_checkout",
    type: "checkout.session.completed",
    livemode: false,
    data: { object: { id: "cs_1", amount_total: 5000, currency: "cad", metadata: { order_id: "order_1" } } },
  };
  const payload = JSON.stringify(checkoutEvent);
  const header = signStripeWebhook({ payload, secret, timestamp: 1_700_000_100 });
  const signature = verifyStripeSignature({ payload, header, secret, now: 1_700_000_100_000 });
  const checkout = applyStripeObservation({
    order: { order_id: "order_1", offer_id: "offer_1", currency: "CAD" },
    event: checkoutEvent,
    signature,
  });
  assert.equal(checkout.accepted, true);
  assert.equal(checkout.payment_state, "CHECKOUT_COMPLETED");
  assert.equal(checkout.payment.verified, false);
  assert.equal(checkout.checkout_is_not_payment, true);

  const unsigned = applyStripeObservation({
    order: { order_id: "order_1" },
    event: { id: "evt_pay", type: "payment_intent.succeeded", data: { object: { id: "pi_1", amount_received: 5000, currency: "cad" } } },
    signature: { verified: false, reason: "SIGNATURE_INVALID" },
  });
  assert.equal(unsigned.accepted, false);
  assert.equal(unsigned.payment_state, "UNPAID");

  const paidEvent = {
    id: "evt_pay",
    type: "payment_intent.succeeded",
    livemode: false,
    created: 1_700_000_120,
    data: { object: { id: "pi_1", amount_received: 5000, currency: "cad", fee: 150 } },
  };
  const paidPayload = JSON.stringify(paidEvent);
  const paidHeader = signStripeWebhook({ payload: paidPayload, secret, timestamp: 1_700_000_120 });
  const paidSig = verifyStripeSignature({ payload: paidPayload, header: paidHeader, secret, now: 1_700_000_120_000 });
  const paid = applyStripeObservation({
    order: { order_id: "order_1", offer_id: "offer_1", project_id: "p1", tenant_id: "t1", customer_id: "c1", currency: "CAD" },
    event: paidEvent,
    signature: paidSig,
  });
  assert.equal(paid.payment_state, "PAID");
  assert.equal(paid.payment.verified, true);
  const entry = buildCommercialLedgerEntry({
    observation: paid.money,
    order: { order_id: "order_1", offer_id: "offer_1", project_id: "p1", tenant_id: "t1", customer_id: "c1" },
    event: paidEvent,
    classified: paid.classified,
  });
  assert.equal(entry.gross, 5000);
  assert.equal(entry.fee, 150);
  assert.equal(entry.net, 4850);
  assert.equal(entry.invented_zero, false);
  const incomplete = buildCommercialLedgerEntry({
    observation: { gross: null, fee: null, net: null, currency: null },
    order: { order_id: "order_1" },
    event: { id: "evt_empty" },
    classified: { event_id: "evt_empty", class: "OBSERVED_UNKNOWN" },
  });
  assert.equal(incomplete.gross, null);
  assert.equal(incomplete.reconciliation, "MISSING_AMOUNT");
});

test("refunds, disputes and failures are measurable states", () => {
  assert.equal(paymentStateFromClass("REFUND_OBSERVED", "PAID"), "REFUNDED");
  assert.equal(paymentStateFromClass("DISPUTE_OBSERVED", "PAID"), "DISPUTED");
  assert.equal(paymentStateFromClass("PAYMENT_FAILED", "CHECKOUT_COMPLETED"), "FAILED");
  assert.equal(paymentStateFromClass("INVOICE_FAILED", "INVOICE_OPEN"), "INVOICE_FAILED");
  assert.equal(paymentStateFromClass("SUBSCRIPTION_CANCELLED", "SUBSCRIPTION_ACTIVE"), "SUBSCRIPTION_CANCELLED");
});

test("reconciliation holds on mismatch and never invents a match", () => {
  const result = reconcileEconomicRecords({
    internal: [{ id: "evt_1", stripe_event_id: "evt_1", gross: 5000, currency: "CAD" }],
    stripe: [{ id: "evt_1", stripe_event_id: "evt_1", gross: 4000, currency: "CAD" }],
  });
  assert.equal(result.rows[0].reconciliation, "HOLD");
  assert.equal(result.invented, false);
  const missing = reconcileEconomicRecords({
    internal: [{ id: "evt_2", stripe_event_id: "evt_2", gross: null, currency: "CAD" }],
    stripe: [{ id: "evt_2", stripe_event_id: "evt_2", gross: null, currency: "CAD" }],
  });
  assert.equal(missing.rows[0].reconciliation, "MISSING_AMOUNT");
});

test("live Stripe events stay HOLD_HUMAN", () => {
  const live = applyStripeObservation({
    order: { order_id: "order_1" },
    event: { id: "evt_live", type: "payment_intent.succeeded", livemode: true, data: { object: { id: "pi_live" } } },
    signature: { verified: true },
  });
  assert.equal(live.accepted, false);
  assert.equal(live.state, "HOLD_HUMAN");
  assert.equal(live.live, false);
});
