/** ACORN LIVE — commercial HTTP surface.
 * Domain stays in scripts/acorn-commercial-runtime.mjs.
 * Stripe stays in scripts/acorn-stripe-adapter.mjs.
 */
import { persistState, persistEnterpriseEvent, persistEvidence, loadTenantState } from "./enterprise-store.mjs";
import { encodeJson, parseJson, now } from "./database.mjs";
import { createFinancialRail, parseStripeEvent, verifyWebhookSignature } from "../scripts/acorn-stripe-adapter.mjs";
import {
  createCommercialProject,
  catalogPublic,
  acceptOffer,
  attachCheckout,
  confirmPaymentFromEvent,
  proposeRenewal,
  proposeExpansion,
  revenueMaximizerBounded,
  developerSurface,
  commercialTruth,
  PRICE_CATALOG,
  PRICING_VERSION
} from "../scripts/acorn-commercial-runtime.mjs";
import { applyStripeEventToLedger, ledgerSnapshot } from "../scripts/acorn-economic-ledger.mjs";
import { expireUsageRights } from "../scripts/acorn-usage-rights.mjs";

export function humanMoneyAuthorized(env, req) {
  const configured = String(env.ACORN_HUMAN_AUTHORITY_TOKEN || "").trim();
  if (!configured) return false;
  const provided = String(req.headers["x-acorn-human-authority"] || "").trim();
  if (!provided || provided.length !== configured.length) return false;
  let out = 0;
  for (let i = 0; i < configured.length; i++) out |= configured.charCodeAt(i) ^ provided.charCodeAt(i);
  return out === 0;
}

function clientTriedMoney(body) {
  return Boolean(body && (body.human_authorized === true || body.authorized === true || body.paid === true
    || body.live === true || body.authority === true || body.amount != null || body.amount_cents != null
    || body.currency != null || body.price != null));
}

export function createRail(env) {
  return createFinancialRail({
    provider: env.ACORN_FINANCIAL_RAIL || "stripe",
    env,
    fetchImpl: typeof env.ACORN_STRIPE_FETCH === "function" ? env.ACORN_STRIPE_FETCH : undefined
  });
}

async function loadOffers(db, tenantId, projectId) {
  const rows = await loadTenantState(db, tenantId, "OFFER");
  return rows.filter((s) => !projectId || s.data?.project_id === projectId).map((s) => ({
    id: s.id,
    ...s.data,
    state: s.state,
    amount_cents: s.data?.amount_cents ?? null,
    live: false,
    paid: false
  }));
}

async function loadOrder(db, tenantId, orderId) {
  const row = await db.get("SELECT * FROM commercial_orders WHERE id=$1 AND tenant_id=$2", [orderId, tenantId]);
  return row || null;
}

function rowOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    customer_id: row.customer_id,
    project_id: row.project_id,
    offer_id: row.offer_id,
    catalog_id: row.catalog_id,
    product_name: row.product_name,
    model: row.model,
    amount_cents: Number(row.amount_cents),
    currency: row.currency,
    interval: row.interval || null,
    pricing_version: row.pricing_version,
    state: row.state,
    stripe_checkout_id: row.stripe_checkout_id,
    stripe_payment_intent: row.stripe_payment_intent,
    stripe_customer_id: row.stripe_customer_id,
    paid_at: row.paid_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    paid: false,
    billed: false,
    live: false
  };
}

async function persistOrder(db, order) {
  await db.run(
    `INSERT INTO commercial_orders(id,tenant_id,customer_id,project_id,offer_id,catalog_id,product_name,model,amount_cents,currency,interval,pricing_version,state,stripe_checkout_id,stripe_payment_intent,stripe_customer_id,paid_at,created_at,updated_at)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
     ON CONFLICT(id) DO UPDATE SET state=$13,stripe_checkout_id=$14,stripe_payment_intent=$15,stripe_customer_id=$16,paid_at=$17,updated_at=$19`,
    [
      order.id, order.tenant_id, order.customer_id, order.project_id, order.offer_id,
      order.catalog_id || null, order.product_name || null, order.model, order.amount_cents,
      order.currency, order.interval || null, order.pricing_version, order.state,
      order.stripe_checkout_id || null, order.stripe_payment_intent || null,
      order.stripe_customer_id || null, order.paid_at || null, order.created_at, order.updated_at
    ]
  );
}

async function enqueueCommercialJob(db, { tenantId, kind, payload, entityId }) {
  const id = "job_" + kind.toLowerCase() + "_" + entityId;
  try {
    await db.run(
      `INSERT INTO acorn_jobs(id,tenant_id,kind,payload,state,attempts,max_attempts,created_at,updated_at)
       VALUES($1,$2,$3,$4,'QUEUED',0,5,$5,$5)
       ON CONFLICT(id) DO NOTHING`,
      [id, tenantId, kind, encodeJson(db.mode, payload || {}), now()]
    );
  } catch {
    /* job enqueue is best-effort observability; order/ledger persist is the source of truth */
  }
}

async function persistLedger(db, entry) {
  await db.run(
    `INSERT INTO economic_ledger(id,tenant_id,epistemic,kind,gross_amount,currency,net_amount,fees,taxes,stripe_customer_id,stripe_object_id,stripe_event_id,customer_id,project_id,order_id,status,reconciliation,source,payload,measured_at)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
    [
      entry.id, entry.tenant_id, entry.epistemic, entry.kind, entry.gross_amount, entry.currency,
      entry.net_amount, entry.fees, entry.taxes, entry.stripe_customer_id, entry.stripe_object_id,
      entry.stripe_event_id, entry.customer_id, entry.project_id, entry.order_id, entry.status,
      entry.reconciliation, entry.source, encodeJson(db.mode, entry.payload || {}), entry.measured_at
    ]
  );
}

async function persistRights(db, rights) {
  await db.run(
    `INSERT INTO usage_rights(id,tenant_id,customer_id,project_id,order_id,product,product_version,rights,duration,scope,conditions,granted_at,valid_until,state)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT(id) DO UPDATE SET state=$14,granted_at=$12,valid_until=$13`,
    [
      rights.id, rights.tenant_id, rights.customer_id, rights.project_id, rights.order_id,
      rights.product, rights.product_version, encodeJson(db.mode, rights.rights),
      rights.duration, rights.scope, encodeJson(db.mode, rights.conditions),
      rights.granted_at, rights.valid_until, rights.state
    ]
  );
}

export async function persistCommercialProject(db, commercial, { tenantId, requestId }) {
  for (const offer of commercial.offers || []) {
    await persistState(db, {
      entity: "OFFER",
      id: offer.id,
      tenant_id: tenantId,
      state: offer.state,
      data: { ...offer, paid: false, live: false, billed: false, request_id: requestId }
    });
  }
}

export async function processStripeWebhook({ db, env, rawBody, signature }) {
  const secret = String(env.STRIPE_WEBHOOK_SECRET || "").trim();
  const verified = verifyWebhookSignature({ rawBody, signature, secret });
  if (!verified.valid) {
    return { status: 400, body: { error: verified.reason || "SIGNATURE_INVALID", live: false } };
  }
  let event;
  try { event = parseStripeEvent(rawBody); }
  catch (e) {
    return { status: e.status || 400, body: { error: e.code || "MALFORMED_STRIPE_EVENT", live: false } };
  }
  const obj = event.data?.object || {};
  const metadata = obj.metadata || {};
  const tenantId = String(metadata.acorn_tenant_id || "").trim() || null;
  const orderId = String(metadata.acorn_order_id || obj.client_reference_id || "").trim() || null;
  let result = { replay: false, unknown: false };
  await db.tx(async (tx) => {
    const existing = await tx.get("SELECT * FROM stripe_events WHERE event_id=$1", [event.id]);
    if (existing && existing.processing_state === "PROCESSED") {
      result = { replay: true, event_id: event.id };
      return;
    }
    if (!existing) {
      try {
        await tx.run(
          `INSERT INTO stripe_events(event_id,type,stripe_created,payload,signature_valid,processing_state,tenant_id,order_id,provenance,created_at)
           VALUES($1,$2,$3,$4,$5,'RECEIVED',$6,$7,$8,$9)`,
          [
            event.id, event.type, event.created, encodeJson(tx.mode, event.raw), 1,
            tenantId, orderId, "stripe_webhook", now()
          ]
        );
      } catch (e) {
        const raced = await tx.get("SELECT * FROM stripe_events WHERE event_id=$1", [event.id]);
        if (raced && raced.processing_state === "PROCESSED") {
          result = { replay: true, event_id: event.id };
          return;
        }
        if (!raced) throw e;
      }
    }
    const known = [
      "checkout.session.completed", "checkout.session.expired", "checkout.session.async_payment_succeeded",
      "payment_intent.succeeded", "payment_intent.payment_failed",
      "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted",
      "invoice.paid", "invoice.payment_failed", "invoice.finalized",
      "charge.refunded", "charge.dispute.created", "payment_method.attached", "customer.updated"
    ];
    const order = orderId && tenantId ? rowOrder(await tx.get("SELECT * FROM commercial_orders WHERE id=$1 AND tenant_id=$2", [orderId, tenantId])) : null;
    if (!known.includes(event.type)) {
      const retained = applyStripeEventToLedger(event, { order, tenant_id: tenantId });
      await persistLedger(tx, retained);
      await tx.run(
        "UPDATE stripe_events SET processing_state='IGNORED',processed_at=$1 WHERE event_id=$2",
        [now(), event.id]
      );
      result = { unknown: true, event_id: event.id, retained: true, live: false };
      return;
    }
    const confirmed = confirmPaymentFromEvent({ event, order, tenantId });
    await persistLedger(tx, confirmed.entry);
    if (confirmed.order) {
      await persistOrder(tx, confirmed.order);
      await persistState(tx, {
        entity: "MONEY_CLAIM",
        id: confirmed.money_claim.id,
        tenant_id: tenantId || confirmed.order.tenant_id,
        state: confirmed.entry.status,
        data: { ...confirmed.money_claim, epistemic: confirmed.entry.epistemic, billed: false, paid: false, live: false }
      });
      if (confirmed.usage_rights) await persistRights(tx, confirmed.usage_rights);
      await enqueueCommercialJob(tx, {
        tenantId: tenantId || confirmed.order.tenant_id,
        kind: "COMMERCIAL_RECONCILE",
        entityId: event.id,
        payload: { stripe_event_id: event.id, order_id: confirmed.order.id, type: event.type, live: false, paid: false, execution_authorized: false }
      });
      await persistEnterpriseEvent(tx, {
        tenantId: tenantId || confirmed.order.tenant_id,
        entityId: confirmed.order.id,
        type: "STRIPE_EVENT_APPLIED",
        payload: {
          event_id: event.id,
          type: event.type,
          order_state: confirmed.order.state,
          epistemic: confirmed.entry.epistemic,
          reconciliation: confirmed.entry.reconciliation,
          execution_authorized: false,
          live: false
        },
        actor: "stripe-webhook",
        authority: "none"
      });
      if (confirmed.entry.kind === "PAYMENT" && confirmed.entry.reconciliation === "MATCHED") {
        await persistEvidence(tx, {
          tenantId: tenantId || confirmed.order.tenant_id,
          claim: "stripe_payment_observed",
          source: "stripe_webhook",
          kind: "OBSERVATION",
          epistemic: "OBSERVED",
          strength: 1,
          margin: 0.1,
          validUntil: new Date(Date.now() + 30 * 86400000).toISOString()
        }, confirmed.order.project_id);
      }
    }
    await tx.run(
      "UPDATE stripe_events SET processing_state='PROCESSED',processed_at=$1,tenant_id=$2,order_id=$3 WHERE event_id=$4",
      [now(), tenantId, orderId, event.id]
    );
    result = {
      event_id: event.id,
      type: event.type,
      order_state: confirmed.order?.state || null,
      epistemic: confirmed.entry.epistemic,
      reconciliation: confirmed.entry.reconciliation,
      execution_authorized: false,
      live: false,
      verified: false,
      stripe_livemode: event.livemode === true
    };
  });
  return { status: 200, body: { ok: true, ...result, paid: false, live: false } };
}

export async function handleAuthedCommercial({
  method, pathname, req, body, cid, env, db, sendPersist
}) {
  const rail = createRail(env);
  const send = async (code, body) => {
    await sendPersist(code, body);
    return true;
  };

  if (method === "GET" && pathname === "/api/v1/catalog") {
    return send(200, { catalog: catalogPublic(), rail: rail.truth(), live: false });
  }

  if (method === "GET" && pathname === "/api/v1/developer") {
    return send(200, { ...developerSurface({ endpoint: env.ACORN_PUBLIC_URL || null }), live: false });
  }

  if (method === "GET" && pathname === "/api/v1/commercial") {
    const orders = (await db.all("SELECT * FROM commercial_orders WHERE tenant_id=$1", [cid])).map(rowOrder);
    const ledger = await db.all("SELECT * FROM economic_ledger WHERE tenant_id=$1 ORDER BY measured_at", [cid]);
    return send(200, {
      ...commercialTruth({ adapter: rail, orders, ledger: ledger.map((r) => ({ ...r, payload: parseJson(r.payload, {}) })) }),
      orders,
      live: false
    });
  }

  if (method === "GET" && pathname === "/api/v1/ledger") {
    const rows = await db.all("SELECT * FROM economic_ledger WHERE tenant_id=$1 ORDER BY measured_at", [cid]);
    const entries = rows.map((r) => ({ ...r, payload: parseJson(r.payload, {}), billed: false, paid: false, live: false }));
    return send(200, { entries, snapshot: ledgerSnapshot(entries), billed: false, paid: false, live: false, tax_advice: false });
  }

  if (method === "GET" && pathname === "/api/v1/usage-rights") {
    const rows = await db.all("SELECT * FROM usage_rights WHERE tenant_id=$1", [cid]);
    const rights = rows.map((r) => expireUsageRights({
      ...r,
      rights: parseJson(r.rights, []),
      conditions: parseJson(r.conditions, []),
      perpetual: r.duration === "PERPETUAL_VERSIONED"
    }));
    return send(200, { rights, live: false });
  }

  if (method === "GET" && pathname === "/api/v1/revenue") {
    return send(200, revenueMaximizerBounded([]));
  }

  const projectOffers = pathname.match(/^\/api\/v1\/projects\/([^/]+)\/offers$/);
  if (method === "GET" && projectOffers) {
    const projectId = decodeURIComponent(projectOffers[1]);
    const owned = await db.get("SELECT id FROM requests WHERE id=$1 AND customer_id=$2", [projectId, cid]);
    if (!owned) return send(404, { error: "NOT_FOUND" });
    const offers = await loadOffers(db, cid, projectId);
    return send(200, { offers, client_cannot_set_amount: true, live: false, paid: false });
  }

  if (method === "GET" && pathname === "/api/v1/orders") {
    const orders = (await db.all("SELECT * FROM commercial_orders WHERE tenant_id=$1 ORDER BY created_at DESC", [cid])).map(rowOrder);
    return send(200, { orders, paid: false, live: false });
  }

  if (method === "POST" && pathname === "/api/v1/orders") {
    const projectId = String(body.project_id || "").trim();
    const offerId = String(body.offer_id || "").trim();
    if (!projectId || !offerId) return send(400, { error: "PROJECT_AND_OFFER_REQUIRED" });
    const owned = await db.get("SELECT id FROM requests WHERE id=$1 AND customer_id=$2", [projectId, cid]);
    if (!owned) return send(404, { error: "NOT_FOUND" });
    const offers = await loadOffers(db, cid, projectId);
    const offer = offers.find((o) => o.id === offerId);
    if (!offer) return send(404, { error: "OFFER_NOT_FOUND" });
    const existing = rowOrder(await db.get(
      "SELECT * FROM commercial_orders WHERE tenant_id=$1 AND project_id=$2 AND offer_id=$3 AND state IN ('OPEN','CHECKOUT_CREATED','PAYMENT_PENDING') ORDER BY created_at DESC LIMIT 1",
      [cid, projectId, offerId]
    ));
    if (existing) {
      return send(200, {
        order: existing,
        reused: true,
        client_amount_ignored: true,
        client_tried_money: clientTriedMoney(body),
        paid: false,
        live: false,
        proof: { checkout_created: Boolean(existing.stripe_checkout_id), payment_observed: false, execution_authorized: false }
      });
    }
    const accepted = acceptOffer({
      tenantId: cid,
      customerId: cid,
      projectId,
      offer,
      clientAmount: body.amount_cents ?? body.amount ?? body.price,
      clientCurrency: body.currency
    });
    if (!accepted.order) {
      return send(403, {
        error: accepted.reason || "HOLD_HUMAN",
        client_amount_ignored: accepted.client_amount_ignored,
        live: false
      });
    }
    await db.tx(async (tx) => {
      await persistOrder(tx, accepted.order);
      if (accepted.usage_rights) await persistRights(tx, accepted.usage_rights);
      await enqueueCommercialJob(tx, {
        tenantId: cid,
        kind: "COMMERCIAL_ORDER",
        entityId: accepted.order.id,
        payload: { order_id: accepted.order.id, project_id: projectId, live: false, paid: false }
      });
      await persistEnterpriseEvent(tx, {
        tenantId: cid,
        entityId: accepted.order.id,
        type: "ORDER_CREATED",
        payload: { project_id: projectId, offer_id: offerId, amount_cents: accepted.order.amount_cents, currency: accepted.order.currency, client_amount_ignored: accepted.client_amount_ignored },
        actor: "acorn-live",
        authority: "none"
      });
    });
    return send(201, {
      order: accepted.order,
      usage_rights: accepted.usage_rights,
      client_amount_ignored: accepted.client_amount_ignored,
      client_tried_money: clientTriedMoney(body),
      paid: false,
      live: false,
      proof: { checkout_created: false, payment_observed: false, execution_authorized: false }
    });
  }

  if (method === "POST" && pathname === "/api/v1/checkout") {
    const orderId = String(body.order_id || "").trim();
    const order = rowOrder(await loadOrder(db, cid, orderId));
    if (!order) return send(404, { error: "NOT_FOUND" });
    if (order.state === "PAYMENT_OBSERVED") {
      return send(409, { error: "ALREADY_OBSERVED", paid: false, live: false });
    }
    const customer = await db.get("SELECT email FROM customers WHERE id=$1", [cid]);
    let session;
    try {
      const input = {
        order: { ...order, checkout_idempotency_key: "checkout_" + order.id },
        successUrl: body.success_url,
        cancelUrl: body.cancel_url,
        customerEmail: customer?.email,
        stripeCustomerId: order.stripe_customer_id
      };
      session = order.model === "SUBSCRIPTION"
        ? await rail.createSubscriptionCheckout(input)
        : await rail.createCheckoutSession(input);
    } catch (e) {
      if (e.code === "STRIPE_UNCONFIGURED") {
        const local = attachCheckout(order, { id: "local_" + order.id, url: null });
        await persistOrder(db, local);
        return send(201, {
          order: local,
          checkout: { configured: false, url: null, mode: rail.mode, checkout_created_is_not_paid: true },
          rail: rail.truth(),
          paid: false,
          live: false,
          error: "STRIPE_UNCONFIGURED"
        });
      }
      return send(e.status || 502, { error: e.code || "STRIPE_REQUEST_FAILED", live: false, paid: false });
    }
    const next = attachCheckout(order, session);
    await persistOrder(db, next);
    await persistEnterpriseEvent(db, {
      tenantId: cid,
      entityId: order.id,
      type: "CHECKOUT_CREATED",
      payload: { stripe_checkout_id: session.id, livemode: session.livemode === true, paid: false },
      actor: "acorn-live",
      authority: "none"
    });
    return send(201, {
      order: next,
      checkout: session,
      paid: false,
      live: false,
      proof: { checkout_created: true, payment_observed: false, preview_is_not_receipt: true }
    });
  }

  if (method === "POST" && pathname === "/api/v1/billing/portal") {
    const found = (await db.all("SELECT * FROM commercial_orders WHERE tenant_id=$1 AND stripe_customer_id IS NOT NULL ORDER BY updated_at DESC LIMIT 1", [cid])).map(rowOrder)[0];
    if (!found?.stripe_customer_id) return send(404, { error: "STRIPE_CUSTOMER_NOT_PRESENT" });
    try {
      const portal = await rail.createPortalSession({ stripeCustomerId: found.stripe_customer_id, returnUrl: body?.return_url });
      return send(201, { portal, stripe_portal_is_not_acorn_authority: true, live: false });
    } catch (e) {
      if (e.code === "STRIPE_UNCONFIGURED") return send(503, { error: "STRIPE_UNCONFIGURED", live: false });
      return send(e.status || 502, { error: e.code || "STRIPE_REQUEST_FAILED", live: false });
    }
  }

  if (method === "POST" && pathname === "/api/v1/billing/refund") {
    const allowed = humanMoneyAuthorized(env, req);
    if (!allowed) {
      return send(403, {
        error: "HUMAN_AUTHORIZATION_REQUIRED",
        operation: "REFUND",
        client_authorization_ignored: true,
        live: false
      });
    }
    const order = rowOrder(await loadOrder(db, cid, String(body.order_id || "")));
    if (!order) return send(404, { error: "NOT_FOUND" });
    if (!order.stripe_payment_intent) return send(409, { error: "NO_PAYMENT_INTENT" });
    try {
      const refund = await rail.refund({
        paymentIntentId: order.stripe_payment_intent,
        amountCents: null,
        humanAuthorized: true
      });
      return send(201, { refund, live: false, verified: false });
    } catch (e) {
      return send(e.status || 502, { error: e.code || "REFUND_FAILED", live: false });
    }
  }

  if (method === "POST" && pathname === "/api/v1/quotes") {
    if (!humanMoneyAuthorized(env, req)) {
      return send(403, { error: "HUMAN_AUTHORIZATION_REQUIRED", operation: "QUOTE", live: false });
    }
    return send(201, {
      quote: { state: "HOLD_HUMAN", amount_cents: null, live: false, signed: false },
      proof: { ai_cannot_sign: true, live: false }
    });
  }

  if (method === "POST" && pathname === "/api/v1/invoices") {
    if (!humanMoneyAuthorized(env, req)) {
      return send(403, { error: "HUMAN_AUTHORIZATION_REQUIRED", operation: "INVOICE", live: false });
    }
    const order = rowOrder(await loadOrder(db, cid, String(body.order_id || "")));
    if (!order) return send(404, { error: "NOT_FOUND" });
    try {
      const invoice = await rail.createInvoice({ order });
      return send(201, { invoice, live: false, verified: false, paid: false });
    } catch (e) {
      if (e.code === "STRIPE_UNCONFIGURED") return send(503, { error: "STRIPE_UNCONFIGURED", live: false });
      return send(e.status || 502, { error: e.code || "INVOICE_FAILED", live: false });
    }
  }

  if (method === "POST" && pathname === "/api/v1/usage") {
    return send(201, {
      usage: {
        recorded: false,
        metered_billing_activated: false,
        quantity: body?.quantity == null ? null : Number(body.quantity),
        unit: "verified_operation",
        live: false,
        billed: false
      },
      proof: { usage_abstraction_present: true, metered_billing_activated: false, live: false },
      live: false,
      billed: false,
      paid: false
    });
  }

  if (method === "GET" && pathname === "/api/v1/billing") {
    return send(200, {
      rail: rail.truth(),
      portal_is_not_authority: true,
      test_is_not_live: true,
      live: false,
      paid: false
    });
  }

  if (method === "GET" && pathname === "/api/v1/renewal") {
    const orders = (await db.all("SELECT * FROM commercial_orders WHERE tenant_id=$1", [cid])).map(rowOrder);
    return send(200, { renewals: orders.map((o) => proposeRenewal({ order: o })), live: false });
  }

  if (method === "GET" && pathname === "/api/v1/expansion") {
    return send(200, proposeExpansion({ project: { id: cid } }));
  }

  return null;
}

export { createCommercialProject, PRICE_CATALOG, PRICING_VERSION };
