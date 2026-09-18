/** ACORN — STRIPE FINANCIAL RAIL ADAPTER
 * Replaceable payment rail. Stripe is infrastructure, not the brain.
 * Acorn Domain → Financial Rail → Stripe.
 * No Stripe call belongs in domain code. Test mode ≠ Live. Key present ≠ LIVE.
 * CAPABILITY ≠ AUTHORITY. HTTP cannot authorize money.
 */
import crypto from "node:crypto";

export const FINANCIAL_RAIL_VERSION = "acorn.financial-rail.v1";
export const STRIPE_ADAPTER_VERSION = "acorn.stripe-adapter.v1";
export const STRIPE_API_VERSION = "2024-06-20";
export const STRIPE_API_BASE = "https://api.stripe.com/v1";

export const RAIL_MODES = Object.freeze(["UNCONFIGURED", "TEST", "LIVE_KEY_PRESENT"]);

const str = (v) => String(v ?? "").trim();
const cents = (v) => {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
};

export function classifyStripeKey(secret) {
  const key = str(secret);
  if (!key) return "UNCONFIGURED";
  if (key.startsWith("sk_test_")) return "TEST";
  if (key.startsWith("sk_live_")) return "LIVE_KEY_PRESENT";
  if (key.startsWith("sk_")) return "TEST";
  return "UNCONFIGURED";
}

export function flattenStripeParams(obj, out = new URLSearchParams(), prefix = "") {
  for (const [k, v] of Object.entries(obj || {})) {
    if (v == null || k === "idempotency_key") continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item && typeof item === "object") flattenStripeParams(item, out, `${key}[${i}]`);
        else out.append(`${key}[${i}]`, String(item));
      });
    } else if (typeof v === "object") {
      flattenStripeParams(v, out, key);
    } else {
      out.append(key, String(v));
    }
  }
  return out;
}

export function stripeTruth(adapter) {
  const mode = adapter?.mode || "UNCONFIGURED";
  return {
    version: STRIPE_ADAPTER_VERSION,
    provider: "stripe",
    replaceable: true,
    configured: mode !== "UNCONFIGURED",
    mode,
    code_present: true,
    connected: false,
    executed: false,
    measured: false,
    verified: false,
    live: false,
    test_is_not_live: true,
    key_present_is_not_live: true,
    checkout_created_is_not_paid: true,
    preview_is_not_receipt: true,
    authority: "carl"
  };
}

export function parseStripeSignatureHeader(header) {
  const raw = str(header);
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  let timestamp = null;
  const signatures = [];
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq);
    const v = part.slice(eq + 1);
    if (k === "t") timestamp = Number(v);
    if (k === "v1") signatures.push(v);
  }
  return { timestamp, signatures };
}

export function verifyWebhookSignature({
  rawBody,
  signature,
  secret,
  toleranceSeconds = 300,
  nowMs = Date.now()
} = {}) {
  const secretKey = str(secret);
  if (!secretKey) {
    return { valid: false, reason: "WEBHOOK_SECRET_MISSING", live: false };
  }
  const parsed = parseStripeSignatureHeader(signature);
  if (!Number.isFinite(parsed.timestamp) || !parsed.signatures.length) {
    return { valid: false, reason: "SIGNATURE_MALFORMED", live: false };
  }
  const age = Math.abs(nowMs / 1000 - parsed.timestamp);
  if (age > toleranceSeconds) {
    return { valid: false, reason: "SIGNATURE_EXPIRED", live: false, timestamp: parsed.timestamp };
  }
  const payload = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : String(rawBody || "");
  const signed = `${parsed.timestamp}.${payload}`;
  const expected = crypto.createHmac("sha256", secretKey).update(signed).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  let matched = false;
  for (const sig of parsed.signatures) {
    const got = Buffer.from(str(sig), "utf8");
    if (got.length === expectedBuf.length && crypto.timingSafeEqual(got, expectedBuf)) matched = true;
  }
  if (!matched) return { valid: false, reason: "SIGNATURE_INVALID", live: false, timestamp: parsed.timestamp };
  return { valid: true, reason: "SIGNATURE_VALID", timestamp: parsed.timestamp, live: false };
}

export function parseStripeEvent(rawBody) {
  const text = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : String(rawBody || "");
  let parsed;
  try { parsed = JSON.parse(text); }
  catch { throw Object.assign(new Error("MALFORMED_STRIPE_EVENT"), { code: "MALFORMED_STRIPE_EVENT", status: 400 }); }
  const id = str(parsed.id);
  const type = str(parsed.type);
  if (!id || !type) {
    throw Object.assign(new Error("MALFORMED_STRIPE_EVENT"), { code: "MALFORMED_STRIPE_EVENT", status: 400 });
  }
  return {
    id,
    type,
    livemode: parsed.livemode === true,
    created: Number.isFinite(Number(parsed.created)) ? Number(parsed.created) : null,
    data: parsed.data && typeof parsed.data === "object" ? parsed.data : { object: {} },
    request: parsed.request || null,
    raw: parsed,
    paid: false,
    live: false,
    verified: false
  };
}

async function stripeRequest(adapter, method, path, params = {}) {
  if (adapter.mode === "UNCONFIGURED" || !adapter.secretKey) {
    const err = new Error("STRIPE_UNCONFIGURED");
    err.code = "STRIPE_UNCONFIGURED";
    err.status = 503;
    throw err;
  }
  const url = STRIPE_API_BASE + path;
  const headers = {
    authorization: "Bearer " + adapter.secretKey,
    "stripe-version": STRIPE_API_VERSION,
    accept: "application/json"
  };
  if (params.idempotency_key) headers["idempotency-key"] = String(params.idempotency_key);
  const init = { method, headers };
  if (method !== "GET") {
    headers["content-type"] = "application/x-www-form-urlencoded";
    init.body = flattenStripeParams(params).toString();
  }
  const res = await adapter.fetch(url, init);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(json?.error?.code || json?.error?.message || "STRIPE_REQUEST_FAILED");
    err.code = "STRIPE_REQUEST_FAILED";
    err.status = res.status;
    err.stripe = { type: json?.error?.type || null, code: json?.error?.code || null, message: json?.error?.message || null };
    throw err;
  }
  return json;
}

function checkoutLineItem({ amountCents, currency, name, interval = null }) {
  const price_data = {
    currency: String(currency).toLowerCase(),
    unit_amount: amountCents,
    product_data: { name }
  };
  if (interval) price_data.recurring = { interval };
  return { price_data, quantity: 1 };
}

function controlledReturnUrl(candidate, fallback, publicBase) {
  const fallbackUrl = str(fallback);
  try {
    const base = new URL(str(publicBase) || fallbackUrl);
    if (!candidate) return fallbackUrl;
    const next = new URL(String(candidate), base);
    if (next.origin !== base.origin) return fallbackUrl;
    if (next.protocol !== "https:" && next.protocol !== "http:") return fallbackUrl;
    return next.toString();
  } catch {
    return fallbackUrl;
  }
}

export function createStripeAdapter({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const secretKey = str(env.STRIPE_SECRET_KEY);
  const webhookSecret = str(env.STRIPE_WEBHOOK_SECRET);
  const publicBase = str(env.ACORN_PUBLIC_URL || env.PUBLIC_BASE_URL || "http://127.0.0.1:8080");
  const mode = classifyStripeKey(secretKey);
  const adapter = {
    version: STRIPE_ADAPTER_VERSION,
    provider: "stripe",
    replaceable: true,
    mode,
    secretKey: secretKey || null,
    webhookSecret: webhookSecret || null,
    publicBase,
    fetch: typeof fetchImpl === "function" ? fetchImpl : globalThis.fetch,
    live: false,
    verified: false
  };

  adapter.truth = () => stripeTruth(adapter);

  adapter.createCheckoutSession = async ({
    order,
    successUrl,
    cancelUrl,
    customerEmail,
    stripeCustomerId = null,
    mode: checkoutMode = "payment"
  } = {}) => {
    const amountCents = cents(order?.amount_cents);
    const currency = str(order?.currency || "cad").toLowerCase();
    if (!amountCents || amountCents <= 0) {
      const err = new Error("SERVER_AMOUNT_REQUIRED");
      err.code = "SERVER_AMOUNT_REQUIRED";
      err.status = 400;
      throw err;
    }
    const success = controlledReturnUrl(successUrl, publicBase.replace(/\/$/, "") + "/pay/success", publicBase);
    const cancel = controlledReturnUrl(cancelUrl, publicBase.replace(/\/$/, "") + "/pay/cancel", publicBase);
    const params = {
      mode: checkoutMode === "subscription" ? "subscription" : "payment",
      success_url: success,
      cancel_url: cancel,
      client_reference_id: str(order?.id),
      metadata: {
        acorn_tenant_id: str(order?.tenant_id),
        acorn_customer_id: str(order?.customer_id),
        acorn_project_id: str(order?.project_id),
        acorn_order_id: str(order?.id),
        acorn_offer_id: str(order?.offer_id),
        acorn_pricing_version: str(order?.pricing_version)
      },
      line_items: [
        checkoutLineItem({
          amountCents,
          currency,
          name: str(order?.product_name || "Acorn project"),
          interval: checkoutMode === "subscription" ? (order?.interval || "month") : null
        })
      ],
      idempotency_key: str(order?.checkout_idempotency_key || ("checkout_" + order?.id))
    };
    if (stripeCustomerId) params.customer = stripeCustomerId;
    else if (customerEmail) params.customer_email = customerEmail;
    const session = await stripeRequest(adapter, "POST", "/checkout/sessions", params);
    return {
      id: session.id,
      url: session.url || null,
      mode: params.mode,
      payment_status: session.payment_status || "unpaid",
      amount_cents: amountCents,
      currency,
      livemode: session.livemode === true,
      paid: false,
      live: false,
      checkout_created_is_not_paid: true,
      stripe_object: "checkout.session"
    };
  };

  adapter.createSubscriptionCheckout = async (input = {}) => {
    return adapter.createCheckoutSession({ ...input, mode: "subscription" });
  };

  adapter.createPortalSession = async ({ stripeCustomerId, returnUrl } = {}) => {
    if (!str(stripeCustomerId)) {
      const err = new Error("STRIPE_CUSTOMER_REQUIRED");
      err.code = "STRIPE_CUSTOMER_REQUIRED";
      err.status = 400;
      throw err;
    }
    const session = await stripeRequest(adapter, "POST", "/billing_portal/sessions", {
      customer: str(stripeCustomerId),
      return_url: controlledReturnUrl(returnUrl, adapter.publicBase, adapter.publicBase)
    });
    return {
      id: session.id,
      url: session.url || null,
      livemode: session.livemode === true,
      live: false,
      stripe_portal_is_not_acorn_authority: true
    };
  };

  adapter.createInvoice = async ({ order, collection = "send_invoice" } = {}) => {
    const amountCents = cents(order?.amount_cents);
    if (!amountCents) {
      const err = new Error("SERVER_AMOUNT_REQUIRED");
      err.code = "SERVER_AMOUNT_REQUIRED";
      throw err;
    }
    const customer = str(order?.stripe_customer_id);
    if (!customer) {
      const err = new Error("STRIPE_CUSTOMER_REQUIRED");
      err.code = "STRIPE_CUSTOMER_REQUIRED";
      throw err;
    }
    const item = await stripeRequest(adapter, "POST", "/invoiceitems", {
      customer,
      amount: amountCents,
      currency: str(order?.currency || "cad").toLowerCase(),
      description: str(order?.product_name || "Acorn enterprise invoice"),
      metadata: { acorn_order_id: str(order?.id) }
    });
    const invoice = await stripeRequest(adapter, "POST", "/invoices", {
      customer,
      collection_method: collection,
      metadata: { acorn_order_id: str(order?.id), acorn_project_id: str(order?.project_id) },
      idempotency_key: "invoice_" + str(order?.id)
    });
    return {
      id: invoice.id,
      invoiceitem_id: item.id,
      status: invoice.status || "draft",
      amount_cents: amountCents,
      paid: false,
      live: false,
      human_required_to_finalize: invoice.status === "draft"
    };
  };

  adapter.createQuote = async ({ project, amountCents, currency = "cad" } = {}) => {
    const amount = cents(amountCents);
    if (!amount) {
      const err = new Error("SERVER_AMOUNT_REQUIRED");
      err.code = "SERVER_AMOUNT_REQUIRED";
      throw err;
    }
    const quote = await stripeRequest(adapter, "POST", "/quotes", {
      line_items: [
        checkoutLineItem({
          amountCents: amount,
          currency,
          name: str(project?.name || "Acorn enterprise quote")
        })
      ],
      metadata: {
        acorn_project_id: str(project?.id),
        acorn_tenant_id: str(project?.tenant_id)
      }
    });
    return {
      id: quote.id,
      status: quote.status || "draft",
      amount_cents: amount,
      accepted: false,
      live: false,
      human_required: true
    };
  };

  adapter.recordUsage = async ({ subscriptionItemId, quantity, timestamp = null, action = "increment" } = {}) => {
    const q = Number(quantity);
    if (!str(subscriptionItemId) || !Number.isFinite(q) || q < 0) {
      const err = new Error("USAGE_RECORD_INVALID");
      err.code = "USAGE_RECORD_INVALID";
      throw err;
    }
    const record = await stripeRequest(adapter, "POST", "/subscription_items/" + encodeURIComponent(subscriptionItemId) + "/usage_records", {
      quantity: q,
      timestamp: timestamp || Math.floor(Date.now() / 1000),
      action
    });
    return {
      id: record.id,
      quantity: q,
      billed: false,
      live: false,
      metered_billing_activated: false
    };
  };

  adapter.refund = async ({ paymentIntentId, amountCents = null, humanAuthorized = false } = {}) => {
    if (humanAuthorized !== true) {
      const err = new Error("HUMAN_AUTHORIZATION_REQUIRED");
      err.code = "HUMAN_AUTHORIZATION_REQUIRED";
      err.status = 403;
      throw err;
    }
    if (!str(paymentIntentId)) {
      const err = new Error("PAYMENT_INTENT_REQUIRED");
      err.code = "PAYMENT_INTENT_REQUIRED";
      throw err;
    }
    const params = { payment_intent: str(paymentIntentId) };
    if (amountCents != null) params.amount = cents(amountCents);
    const refund = await stripeRequest(adapter, "POST", "/refunds", params);
    return {
      id: refund.id,
      status: refund.status || "pending",
      amount: refund.amount ?? null,
      live: false,
      refunded: refund.status === "succeeded",
      verified: false
    };
  };

  adapter.verifyWebhook = (input) => verifyWebhookSignature({
    ...input,
    secret: input.secret || adapter.webhookSecret
  });

  return adapter;
}

export function createFinancialRail({ provider = "stripe", env = process.env, fetchImpl } = {}) {
  const p = str(provider).toLowerCase();
  if (p === "stripe" || p === "stripe-test" || p === "stripe-live") {
    return createStripeAdapter({ env, fetchImpl });
  }
  const err = new Error("UNKNOWN_FINANCIAL_RAIL");
  err.code = "UNKNOWN_FINANCIAL_RAIL";
  throw err;
}
