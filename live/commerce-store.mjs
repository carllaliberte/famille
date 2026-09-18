/** ACORN LIVE — durable commercial / Stripe store.
 * Persists offers, orders, Stripe events and economic observations.
 * Does not invent amounts. Does not treat checkout as payment.
 */
import { encodeJson, parseJson, makeId } from "./database.mjs";
import { persistState, persistEnterpriseEvent, persistEvidence } from "./enterprise-store.mjs";
import {
  applyStripeObservation,
  buildCommercialLedgerEntry,
  createOrder,
  createVersionedOffer,
} from "../scripts/acorn-commercial-runtime.mjs";
import { classifyStripeEvent } from "../scripts/acorn-stripe-adapter.mjs";

function rowJson(row, key) {
  if (!row) return null;
  return { ...row, [key]: parseJson(row[key], {}) };
}

export async function persistOffer(db, offer) {
  const t = new Date().toISOString();
  await db.run(
    `INSERT INTO acorn_commerce_offers(
      id, tenant_id, customer_id, project_id, catalog_id, version, currency,
      unit_amount, price_source, terms, usage_rights, data, created_at, updated_at
    ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    ON CONFLICT(id) DO UPDATE SET version=$6, currency=$7, unit_amount=$8, terms=$10, usage_rights=$11, data=$12, updated_at=$14`,
    [
      offer.offer_id,
      offer.tenant_id,
      offer.customer_id,
      offer.project_id,
      offer.catalog_id,
      offer.version,
      offer.currency,
      offer.unit_amount,
      offer.price_source || "SERVER_CATALOG",
      offer.terms,
      encodeJson(db.mode, offer.usage_rights || []),
      encodeJson(db.mode, { name: offer.name, unit: offer.unit, interval: offer.interval, live: false }),
      t,
      t,
    ]
  );
  await persistState(db, {
    entity: "OFFER",
    id: offer.offer_id,
    tenant_id: offer.tenant_id,
    state: offer.stage || "OFFER",
    data: { catalog_id: offer.catalog_id, version: offer.version, currency: offer.currency, unit_amount: offer.unit_amount, price_source: "SERVER_CATALOG", live: false },
  });
  return offer;
}

export async function persistOrder(db, order) {
  const t = new Date().toISOString();
  await db.run(
    `INSERT INTO acorn_commerce_orders(
      id, tenant_id, customer_id, project_id, offer_id, offer_version, currency,
      unit_amount, payment_state, stage, data, created_at, updated_at
    ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT(id) DO UPDATE SET payment_state=$9, stage=$10, data=$11, updated_at=$13`,
    [
      order.order_id,
      order.tenant_id,
      order.customer_id,
      order.project_id,
      order.offer_id,
      order.offer_version,
      order.currency,
      order.unit_amount,
      order.payment_state || "UNPAID",
      order.stage || "ORDER",
      encodeJson(db.mode, { authorized: order.authorized === true, authorized_by: order.authorized_by || null, live: false }),
      t,
      t,
    ]
  );
  return order;
}

export async function persistLedgerEntry(db, entry) {
  if (!entry) return null;
  const t = new Date().toISOString();
  const id = entry.stripe_event_id || entry.id || makeId("econ");
  await db.run(
    `INSERT INTO acorn_economic_entries(
      id, tenant_id, customer_id, project_id, order_id, offer_id, stripe_event_id,
      stripe_object_id, currency, gross, fee, net, tax, status, reconciliation, payload, created_at
    ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    ON CONFLICT(id) DO NOTHING`,
    [
      id,
      entry.tenant_id || null,
      entry.customer_id || null,
      entry.project_id || null,
      entry.order_id || null,
      entry.offer_id || null,
      entry.stripe_event_id || null,
      entry.stripe_object_id || null,
      entry.currency || null,
      entry.gross,
      entry.fee,
      entry.net,
      entry.tax,
      entry.status || "OBSERVED",
      entry.reconciliation || "UNRECONCILED",
      encodeJson(db.mode, { kind: entry.kind, source: entry.source, invented_zero: false, live: false }),
      t,
    ]
  );
  return { ...entry, id };
}

export async function loadStripeEvent(db, eventId) {
  if (!eventId) return null;
  const row = await db.get("SELECT * FROM acorn_stripe_events WHERE id=$1", [eventId]);
  return row ? { ...row, payload: parseJson(row.payload, {}), result: parseJson(row.result, null) } : null;
}

export async function persistStripeEvent(db, { event, signature, tenantId = null } = {}) {
  const classified = classifyStripeEvent(event);
  if (!classified.event_id) return { ok: false, reason: "EVENT_ID_MISSING" };
  const existing = await loadStripeEvent(db, classified.event_id);
  if (existing) {
    return { ok: true, duplicate: true, replay_protected: true, event: existing, classified, already_processed: existing.processing_state === "PROCESSED", live: false };
  }
  const t = new Date().toISOString();
  await db.run(
    `INSERT INTO acorn_stripe_events(
      id, tenant_id, type, class, livemode, signature_verified, processing_state, payload, result, created_at, updated_at
    ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      classified.event_id,
      tenantId,
      classified.type,
      classified.class,
      classified.livemode === true ? 1 : 0,
      signature?.verified === true ? 1 : 0,
      signature?.verified === true ? "RECEIVED" : "REJECTED",
      encodeJson(db.mode, event || {}),
      encodeJson(db.mode, { reason: signature?.reason || null, checkout_is_not_payment: true, webhook_is_not_receipt: true }),
      t,
      t,
    ]
  );
  return { ok: true, duplicate: false, classified, live: false };
}

export async function applyVerifiedStripeEvent(db, { event, signature } = {}) {
  const stored = await persistStripeEvent(db, {
    event,
    signature,
    tenantId: event?.data?.object?.metadata?.tenant_id || null,
  });
  if (stored.duplicate && stored.already_processed) return stored;
  if (stored.duplicate && stored.event?.processing_state === "REJECTED") {
    return { ...stored, accepted: false, reason: "PREVIOUSLY_REJECTED", live: false };
  }
  if (signature?.verified !== true) {
    return { ...stored, accepted: false, reason: signature?.reason || "SIGNATURE_UNVERIFIED", live: false };
  }
  const metadata = event?.data?.object?.metadata || {};
  const orderId = metadata.order_id || event?.data?.object?.client_reference_id || null;
  const orderRow = orderId
    ? await db.get("SELECT * FROM acorn_commerce_orders WHERE id=$1", [orderId])
    : null;
  const order = orderRow
    ? {
      order_id: orderRow.id,
      tenant_id: orderRow.tenant_id,
      customer_id: orderRow.customer_id,
      project_id: orderRow.project_id,
      offer_id: orderRow.offer_id,
      currency: orderRow.currency,
      unit_amount: orderRow.unit_amount,
      payment_state: orderRow.payment_state,
      stage: orderRow.stage,
    }
    : {
      order_id: orderId,
      tenant_id: metadata.tenant_id || null,
      customer_id: metadata.customer_id || null,
      project_id: metadata.project_id || null,
      offer_id: metadata.offer_id || null,
    };
  const observation = applyStripeObservation({
    order,
    event,
    signature,
    currentPaymentState: order.payment_state || "UNPAID",
  });
  if (!observation.accepted) {
    await db.run(
      "UPDATE acorn_stripe_events SET processing_state=$1, result=$2, updated_at=$3 WHERE id=$4",
      [observation.state === "HOLD_HUMAN" ? "HOLD_HUMAN" : "REJECTED", encodeJson(db.mode, observation), new Date().toISOString(), stored.classified.event_id]
    );
    return { ...stored, ...observation };
  }
  const ledger = buildCommercialLedgerEntry({
    observation: observation.money,
    order,
    event,
    classified: observation.classified,
  });
  await db.tx(async (tx) => {
    if (order.order_id && orderRow) {
      await tx.run(
        "UPDATE acorn_commerce_orders SET payment_state=$1, stage=$2, updated_at=$3 WHERE id=$4 AND tenant_id=$5",
        [observation.payment_state, observation.stage, new Date().toISOString(), order.order_id, order.tenant_id]
      );
    }
    await persistLedgerEntry(tx, ledger);
    if (order.tenant_id) {
      await persistEnterpriseEvent(tx, {
        tenantId: order.tenant_id,
        entityId: order.order_id || stored.classified.event_id,
        type: "STRIPE_EVENT_OBSERVED",
        payload: { class: observation.classified.class, payment_state: observation.payment_state, checkout_is_not_payment: true },
        actor: "acorn-stripe",
        authority: "none",
      });
      await persistEvidence(tx, {
        tenantId: order.tenant_id,
        claim: "stripe_event_observed",
        source: "stripe-webhook",
        kind: "OBSERVATION",
        strength: 1,
        margin: 0.1,
        validUntil: new Date(Date.now() + 86400000).toISOString(),
        payload: { event_id: stored.classified.event_id, class: observation.classified.class, verified: observation.payment?.verified === true, live: false },
      }, order.project_id || null);
    }
    await tx.run(
      "UPDATE acorn_stripe_events SET processing_state=$1, result=$2, tenant_id=$3, updated_at=$4 WHERE id=$5",
      ["PROCESSED", encodeJson(tx.mode, { payment_state: observation.payment_state, stage: observation.stage, live: false }), order.tenant_id || null, new Date().toISOString(), stored.classified.event_id]
    );
  });
  return { ...stored, ...observation, ledger, duplicate: false, live: false };
}

export async function loadTenantCommerce(db, tenantId) {
  const offers = await db.all("SELECT * FROM acorn_commerce_offers WHERE tenant_id=$1 ORDER BY created_at DESC", [tenantId]);
  const orders = await db.all("SELECT * FROM acorn_commerce_orders WHERE tenant_id=$1 ORDER BY created_at DESC", [tenantId]);
  const ledger = await db.all("SELECT * FROM acorn_economic_entries WHERE tenant_id=$1 ORDER BY created_at DESC", [tenantId]);
  const events = await db.all("SELECT id,type,class,livemode,signature_verified,processing_state,created_at FROM acorn_stripe_events WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 50", [tenantId]);
  return {
    offers: offers.map((row) => ({ ...rowJson(row, "data"), usage_rights: parseJson(row.usage_rights, []) })),
    orders: orders.map((row) => rowJson(row, "data")),
    ledger: ledger.map((row) => ({
      ...row,
      payload: parseJson(row.payload, {}),
      gross: row.gross == null ? null : Number(row.gross),
      fee: row.fee == null ? null : Number(row.fee),
      net: row.net == null ? null : Number(row.net),
      tax: row.tax == null ? null : Number(row.tax),
    })),
    stripe_events: events,
    live: false,
  };
}

export function serverOfferFromCatalog(catalogId, { customer, project, qualification, unitAmount, currency, interval, authorizedBy, humanAuthorized } = {}) {
  const offer = createVersionedOffer({
    catalog_id: catalogId,
    customer,
    project,
    qualification,
    unit_amount: unitAmount,
    currency,
    interval,
  });
  const order = createOrder({
    offer,
    authorization: { authorized: humanAuthorized === true, authorized_by: authorizedBy || null },
    customer,
  });
  return { offer, order };
}

export { persistState, persistEnterpriseEvent, persistEvidence };
