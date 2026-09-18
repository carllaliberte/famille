#!/usr/bin/env node
/**
 * ACORN — STRIPE ADAPTER
 *
 * Isolated, replaceable Stripe HTTP boundary. Stripe is a rail, not Acorn's
 * brain. Domain modules must not call Stripe URLs directly.
 *
 * Test mode and Live mode are explicit and separate.
 * Checkout created ≠ payment. Webhook received ≠ verified proof.
 * Missing amounts stay null. Absence is never turned into 0.
 *
 * CAPABILITY != AUTHORITY. Carl is the only human money authority.
 */

import crypto from "node:crypto";
import { grantServerAuthority, isServerAuthority } from "./acorn-real-world-bridge.mjs";

export const STRIPE_ADAPTER_VERSION = "acorn.stripe-adapter.v1";
export const STRIPE_API_HOST = "api.stripe.com";
export const STRIPE_API_BASE = "https://api.stripe.com/v1";
export const WEBHOOK_TOLERANCE_SEC = 300;

export const STRIPE_MODES = Object.freeze(["unconfigured", "test", "hold_live", "live"]);

export const STRIPE_POLICY = Object.freeze({
  provider: "stripe",
  replaceable: true,
  stripe_is_not_authority: true,
  test_is_not_live: true,
  checkout_is_not_payment: true,
  webhook_is_not_receipt: true,
  preview_is_not_receipt: true,
  client_price_rejected: true,
  live_products_not_auto_created: true,
  auto_spend: false,
  auto_refund: false,
  auto_payout: false,
  auto_price_change: false,
  auto_contract: false,
  secret_custody: false,
  live: false,
  human_authority: "carl",
});

export const MONEY_AUTHORITIES = Object.freeze([
  "MONEY", "REFUND", "PRICE_CHANGE", "PAYOUT", "CONTRACT", "WRITE", "DELETE", "PUBLISH", "SIGN", "MERGE",
]);

const str = (v) => String(v ?? "").trim();
const ISO = () => new Date().toISOString();

function firstEnv(env, names) {
  for (const name of names) {
    const value = str(env[name]);
    if (value) return { name, value };
  }
  return { name: null, value: "" };
}

export function observedNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function loadStripeConfig(env = process.env) {
  const test = firstEnv(env, ["STRIPE_TEST_SECRET_KEY", "STRIPE_SECRET_KEY"]);
  const live = firstEnv(env, ["STRIPE_LIVE_SECRET_KEY"]);
  const testWebhook = firstEnv(env, ["STRIPE_TEST_WEBHOOK_SECRET", "STRIPE_WEBHOOK_SECRET"]);
  const liveWebhook = firstEnv(env, ["STRIPE_LIVE_WEBHOOK_SECRET"]);
  const liveEnabled = str(env.STRIPE_LIVE_ENABLED) === "1";
  let mode = "unconfigured";
  if (live.value && !liveEnabled) mode = "hold_live";
  else if (live.value && liveEnabled) mode = "live";
  else if (test.value) mode = "test";
  if (mode === "live" && test.value && !live.value) mode = "test";
  return Object.freeze({
    version: STRIPE_ADAPTER_VERSION,
    mode,
    test_key_present: Boolean(test.value),
    live_key_present: Boolean(live.value),
    live_enabled: liveEnabled,
    webhook_secret_present: mode === "live" ? Boolean(liveWebhook.value) : Boolean(testWebhook.value),
    success_url: str(env.STRIPE_SUCCESS_URL) || "https://acorn-royal-dune-blend.grok.me/app?checkout=success",
    cancel_url: str(env.STRIPE_CANCEL_URL) || "https://acorn-royal-dune-blend.grok.me/app?checkout=cancel",
    portal_return_url: str(env.STRIPE_PORTAL_RETURN_URL) || "https://acorn-royal-dune-blend.grok.me/app",
    api_version: str(env.STRIPE_API_VERSION) || "2024-06-20",
    _test_key: test.value,
    _live_key: live.value,
    _test_webhook: testWebhook.value,
    _live_webhook: liveWebhook.value,
  });
}

export function publicStripeConfig(config = loadStripeConfig()) {
  return Object.freeze({
    version: STRIPE_ADAPTER_VERSION,
    mode: config.mode,
    configured: config.mode === "test" || config.mode === "live",
    hold_human: config.mode === "hold_live" || config.mode === "unconfigured",
    test_key_present: config.test_key_present === true,
    live_key_present: config.live_key_present === true,
    live_enabled: config.live_enabled === true,
    webhook_secret_present: config.webhook_secret_present === true,
    success_url: config.success_url,
    cancel_url: config.cancel_url,
    portal_return_url: config.portal_return_url,
    secret: undefined,
    policy: STRIPE_POLICY,
    live: false,
  });
}

export function stripeSecret(config, { live = false } = {}) {
  return live ? config._live_key : config._test_key;
}

export function stripeWebhookSecret(config, { live = false } = {}) {
  return live ? config._live_webhook : config._test_webhook;
}

export function rejectClientPrice(input = {}) {
  const forbidden = ["amount", "unit_amount", "price", "price_id", "currency", "quantity"];
  const attempted = forbidden.filter((key) => input[key] != null && input[key] !== "");
  if (attempted.length) {
    return { ok: false, reason: "CLIENT_PRICE_REJECTED", attempted, accepted: false };
  }
  return { ok: true, accepted: false, attempted: [] };
}

export function requireMoneyAuthority({ action, authority, liveMode = false } = {}) {
  const name = str(action || "MONEY").toUpperCase();
  const gated = MONEY_AUTHORITIES.includes(name);
  if (!gated) return { ok: true, action: name };
  if (!isServerAuthority(authority) && !(authority && isServerAuthority(authority))) {
    return {
      ok: false,
      state: "HOLD_HUMAN",
      reason: "HUMAN_AUTHORIZATION_REQUIRED",
      action: name,
      live_mode: liveMode === true,
      authority: "carl",
    };
  }
  return { ok: true, action: name, actor: "carl" };
}

export function parseStripeSignature(header) {
  const raw = str(header);
  if (!raw) return { ok: false, reason: "SIGNATURE_HEADER_MISSING" };
  const parts = raw.split(",").map((p) => p.trim());
  let timestamp = null;
  const signatures = [];
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq < 1) continue;
    const key = part.slice(0, eq);
    const value = part.slice(eq + 1);
    if (key === "t") timestamp = Number(value);
    if (key === "v1") signatures.push(value);
  }
  if (!Number.isFinite(timestamp) || !signatures.length) {
    return { ok: false, reason: "SIGNATURE_HEADER_MALFORMED" };
  }
  return { ok: true, timestamp, signatures };
}

export function verifyStripeSignature({
  payload,
  header,
  secret,
  now = Date.now(),
  toleranceSec = WEBHOOK_TOLERANCE_SEC,
} = {}) {
  if (!str(secret)) return { ok: false, verified: false, reason: "WEBHOOK_SECRET_MISSING" };
  const parsed = parseStripeSignature(header);
  if (!parsed.ok) return { ok: false, verified: false, reason: parsed.reason };
  const age = Math.abs(now / 1000 - parsed.timestamp);
  if (age > toleranceSec) return { ok: false, verified: false, reason: "REPLAY_WINDOW_EXCEEDED", timestamp: parsed.timestamp };
  const signed = `${parsed.timestamp}.${typeof payload === "string" ? payload : Buffer.from(payload || "").toString("utf8")}`;
  const expected = crypto.createHmac("sha256", secret).update(signed, "utf8").digest("hex");
  let expectedBuf;
  try { expectedBuf = Buffer.from(expected, "hex"); } catch {
    return { ok: false, verified: false, reason: "SIGNATURE_INVALID" };
  }
  const match = parsed.signatures.some((sig) => {
    try {
      const got = Buffer.from(sig, "hex");
      return expectedBuf.length === got.length && crypto.timingSafeEqual(expectedBuf, got);
    } catch {
      return false;
    }
  });
  return match
    ? { ok: true, verified: true, timestamp: parsed.timestamp, replay_protected: true }
    : { ok: false, verified: false, reason: "SIGNATURE_INVALID", timestamp: parsed.timestamp };
}

export function signStripeWebhook({ payload, secret, timestamp }) {
  const t = Number.isFinite(timestamp) ? timestamp : Math.floor(Date.now() / 1000);
  const signed = `${t}.${payload}`;
  const v1 = crypto.createHmac("sha256", secret).update(signed, "utf8").digest("hex");
  return `t=${t},v1=${v1}`;
}

export function classifyStripeEvent(event = {}) {
  const type = str(event.type);
  const object = event.data?.object || {};
  const map = {
    "checkout.session.completed": "CHECKOUT_COMPLETED",
    "checkout.session.expired": "CHECKOUT_EXPIRED",
    "payment_intent.succeeded": "PAYMENT_SUCCEEDED",
    "payment_intent.payment_failed": "PAYMENT_FAILED",
    "invoice.paid": "INVOICE_PAID",
    "invoice.payment_failed": "INVOICE_FAILED",
    "invoice.finalized": "INVOICE_OPEN",
    "customer.subscription.created": "SUBSCRIPTION_CREATED",
    "customer.subscription.updated": "SUBSCRIPTION_UPDATED",
    "customer.subscription.deleted": "SUBSCRIPTION_CANCELLED",
    "charge.refunded": "REFUND_OBSERVED",
    "charge.dispute.created": "DISPUTE_OBSERVED",
    "charge.dispute.closed": "DISPUTE_CLOSED",
  };
  return {
    event_id: str(event.id) || null,
    type: type || "unknown",
    class: map[type] || "OBSERVED_UNKNOWN",
    object_id: str(object.id) || null,
    object_type: str(object.object) || null,
    livemode: event.livemode === true,
    known: Object.hasOwn(map, type),
    checkout_is_not_payment: type === "checkout.session.completed",
    webhook_is_not_receipt: true,
  };
}

export function observeStripeMoney(object = {}) {
  const amount = observedNumber(object.amount_total ?? object.amount_received ?? object.amount_paid ?? object.amount);
  const currency = str(object.currency).toUpperCase() || null;
  const fee = observedNumber(object.application_fee_amount ?? object.fee ?? object.balance_transaction?.fee);
  const netSource = object.net ?? object.balance_transaction?.net;
  const net = amount != null && fee != null
    ? amount - fee
    : observedNumber(netSource);
  return Object.freeze({
    gross: amount,
    currency,
    fee,
    net,
    tax: observedNumber(object.total_details?.amount_tax ?? object.tax),
    invented: false,
    missing_stays_null: true,
  });
}

function encodeForm(value, prefix, out) {
  if (value == null) return;
  if (Array.isArray(value)) {
    value.forEach((item, i) => encodeForm(item, `${prefix}[${i}]`, out));
    return;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value)) encodeForm(v, prefix ? `${prefix}[${k}]` : k, out);
    return;
  }
  out.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(value))}`);
}

export function formEncode(body = {}) {
  const out = [];
  encodeForm(body, "", out);
  return out.join("&");
}

export async function stripeRequest({
  config = loadStripeConfig(),
  path,
  method = "POST",
  body = {},
  idempotencyKey = null,
  liveMode = false,
  authority = null,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (liveMode && config.mode !== "live") {
    return { ok: false, state: "HOLD_HUMAN", reason: config.mode === "hold_live" ? "LIVE_STRIPE_DISABLED" : "LIVE_STRIPE_NOT_CONFIGURED", live: false };
  }
  if (liveMode) {
    const gate = requireMoneyAuthority({ action: "MONEY", authority, liveMode: true });
    if (!gate.ok) return { ...gate, live: false };
  }
  const secret = stripeSecret(config, { live: liveMode });
  if (!secret) {
    return { ok: false, state: "UNAVAILABLE", reason: "STRIPE_CHANNEL_NOT_PRESENT", live: false };
  }
  if (!str(path).startsWith("/")) {
    return { ok: false, state: "BLOCKED", reason: "INVALID_STRIPE_PATH", live: false };
  }
  const url = `${STRIPE_API_BASE}${path}`;
  const headers = {
    authorization: `Bearer ${secret}`,
    "content-type": "application/x-www-form-urlencoded",
    "stripe-version": config.api_version,
  };
  if (idempotencyKey) headers["idempotency-key"] = String(idempotencyKey);
  let response;
  try {
    response = await fetchImpl(url, {
      method,
      headers,
      body: method === "GET" ? undefined : formEncode(body),
    });
  } catch (error) {
    return { ok: false, state: "UNAVAILABLE", reason: "STRIPE_TRANSPORT_FAILED", error_class: String(error?.name || "Error"), live: false };
  }
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }
  return {
    ok: response.ok,
    status: response.status,
    http_ok_is_not_verified: true,
    payload,
    live: false,
    mode: liveMode ? "live" : "test",
  };
}

export async function createCheckoutSession({
  config = loadStripeConfig(),
  offer,
  order,
  customer,
  checkoutMode = "payment",
  successUrl,
  cancelUrl,
  liveMode = false,
  authority = null,
  client = {},
  fetchImpl = globalThis.fetch,
} = {}) {
  const rejected = rejectClientPrice(client);
  if (!rejected.ok) return { ok: false, state: "BLOCKED", ...rejected, live: false };
  if (liveMode) {
    const gate = requireMoneyAuthority({ action: "MONEY", authority, liveMode: true });
    if (!gate.ok) return { ...gate, live: false };
  }
  if (config.mode === "unconfigured") {
    return { ok: false, state: "UNAVAILABLE", reason: "STRIPE_CHANNEL_NOT_PRESENT", live: false };
  }
  if (liveMode && config.mode !== "live") {
    return { ok: false, state: "HOLD_HUMAN", reason: "LIVE_STRIPE_HOLD", live: false };
  }
  const amount = observedNumber(offer?.unit_amount ?? offer?.price_cents);
  const currency = str(offer?.currency).toLowerCase();
  if (amount == null || amount <= 0 || !currency) {
    return { ok: false, state: "HOLD_HUMAN", reason: "SERVER_PRICE_MISSING", live: false };
  }
  const mode = checkoutMode === "subscription" ? "subscription" : "payment";
  const line = {
    quantity: 1,
    price_data: {
      currency,
      unit_amount: amount,
      product_data: { name: str(offer?.name || offer?.product || "Acorn offer") },
    },
  };
  if (mode === "subscription") line.price_data.recurring = { interval: str(offer?.interval || "month") };
  const body = {
    mode,
    success_url: str(successUrl || config.success_url),
    cancel_url: str(cancelUrl || config.cancel_url),
    client_reference_id: str(order?.order_id || ""),
    customer_email: str(customer?.email || "") || undefined,
    metadata: {
      tenant_id: str(order?.tenant_id || customer?.tenant_id || ""),
      customer_id: str(customer?.customer_id || ""),
      project_id: str(order?.project_id || ""),
      order_id: str(order?.order_id || ""),
      offer_id: str(offer?.offer_id || ""),
      offer_version: str(offer?.version || ""),
    },
    line_items: [line],
  };
  const result = await stripeRequest({
    config,
    path: "/checkout/sessions",
    method: "POST",
    body,
    idempotencyKey: order?.order_id ? `checkout_${order.order_id}` : null,
    liveMode,
    authority,
    fetchImpl,
  });
  if (!result.ok) return { ...result, checkout_is_not_payment: true };
  return {
    ok: true,
    state: "CHECKOUT_OPEN",
    checkout_is_not_payment: true,
    session_id: result.payload?.id || null,
    url: result.payload?.url || null,
    mode,
    livemode: result.payload?.livemode === true,
    stripe_mode: liveMode ? "live" : "test",
    live: false,
  };
}

export async function createBillingPortalSession({
  config = loadStripeConfig(),
  stripeCustomerId,
  returnUrl,
  liveMode = false,
  authority = null,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!str(stripeCustomerId)) return { ok: false, state: "BLOCKED", reason: "STRIPE_CUSTOMER_REQUIRED", live: false };
  if (liveMode) {
    const gate = requireMoneyAuthority({ action: "MONEY", authority, liveMode: true });
    if (!gate.ok) return { ...gate, live: false };
  }
  const result = await stripeRequest({
    config,
    path: "/billing_portal/sessions",
    method: "POST",
    body: { customer: stripeCustomerId, return_url: str(returnUrl || config.portal_return_url) },
    liveMode,
    authority,
    fetchImpl,
  });
  if (!result.ok) return result;
  return { ok: true, state: "PORTAL_OPEN", url: result.payload?.url || null, live: false };
}

export function enterpriseDocument({ kind = "invoice", offer, order, customer } = {}) {
  const type = str(kind).toLowerCase() === "quote" ? "QUOTE" : "INVOICE";
  return Object.freeze({
    version: STRIPE_ADAPTER_VERSION,
    type,
    state: "ABSTRACTED",
    offer_id: offer?.offer_id || null,
    order_id: order?.order_id || null,
    customer_id: customer?.customer_id || null,
    currency: offer?.currency || null,
    amount: observedNumber(offer?.unit_amount ?? offer?.price_cents),
    provider: "stripe",
    live_document_created: false,
    human_authorization_required: true,
    live: false,
  });
}

export function usageBasedExtension({ offer, units = null } = {}) {
  return Object.freeze({
    version: STRIPE_ADAPTER_VERSION,
    type: "USAGE_BASED_EXTENSION",
    ready: false,
    offer_id: offer?.offer_id || null,
    units: observedNumber(units),
    stripe_subscription_item: null,
    recorded_to_stripe: false,
    live: false,
    note: "Extension point only. No Stripe usage record is sent from this chantier.",
  });
}

export function stripeAdapterSnapshot(env = process.env) {
  return {
    version: STRIPE_ADAPTER_VERSION,
    policy: STRIPE_POLICY,
    config: publicStripeConfig(loadStripeConfig(env)),
    authority: { human: "carl", ai_cannot_commit_money: true },
    live: false,
    measured_at: ISO(),
  };
}

export { grantServerAuthority, isServerAuthority };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(stripeAdapterSnapshot(), null, 2));
}
