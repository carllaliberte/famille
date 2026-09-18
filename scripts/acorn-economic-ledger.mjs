/** ACORN — ECONOMIC LEDGER
 * Connects an observed financial-rail event to Acorn's existing economic records.
 * Not a second economic engine. Does not invent net, tax, or zero.
 * ASSERTED ≠ OBSERVED ≠ MEASURED ≠ VERIFIED. Never PAID/LIVE from code presence.
 */
import crypto from "node:crypto";
import { economicRecord } from "./acorn-operational-fabric.mjs";
import { measureRevenueEconomics, buildTaxReadyLedger } from "./acorn-revenue-maximizer.mjs";

export const LEDGER_VERSION = "acorn.economic-ledger.v1";
export const LEDGER_EPISTEMIC = Object.freeze(["ASSERTED", "OBSERVED", "MEASURED", "VERIFIED"]);
export const LEDGER_KINDS = Object.freeze([
  "CHECKOUT", "PAYMENT", "PAYMENT_FAILED", "REFUND", "DISPUTE",
  "FEE", "TAX", "INVOICE", "SUBSCRIPTION", "USAGE", "PAYOUT"
]);
export const RECONCILIATION = Object.freeze(["UNRECONCILED", "MATCHED", "MISMATCH", "HOLD_HUMAN"]);

const ISO = () => new Date().toISOString();
const uid = (p) => `${p}_${crypto.randomUUID()}`;
const str = (v) => String(v ?? "").trim();

export function moneyOrNull(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

function epistemicOf(v) {
  const e = str(v).toUpperCase();
  return LEDGER_EPISTEMIC.includes(e) ? e : "ASSERTED";
}

export function createLedgerEntry({
  id,
  tenant_id,
  customer_id = null,
  project_id = null,
  order_id = null,
  epistemic = "ASSERTED",
  kind = "PAYMENT",
  gross_amount = null,
  currency = null,
  net_amount = null,
  fees = null,
  taxes = null,
  stripe_customer_id = null,
  stripe_object_id = null,
  stripe_event_id = null,
  status = "RECORDED",
  reconciliation = "UNRECONCILED",
  source = "acorn",
  payload = {},
  measured_at = ISO()
} = {}) {
  const kindName = LEDGER_KINDS.includes(str(kind).toUpperCase()) ? str(kind).toUpperCase() : "PAYMENT";
  const gross = moneyOrNull(gross_amount);
  const fee = moneyOrNull(fees);
  const tax = moneyOrNull(taxes);
  let net = moneyOrNull(net_amount);
  if (net == null && gross != null && fee != null) net = gross - fee;
  if (net != null && gross == null) net = null;
  return {
    id: id || uid("led"),
    version: LEDGER_VERSION,
    tenant_id: str(tenant_id) || null,
    customer_id: customer_id ? str(customer_id) : null,
    project_id: project_id ? str(project_id) : null,
    order_id: order_id ? str(order_id) : null,
    epistemic: epistemicOf(epistemic),
    kind: kindName,
    gross_amount: gross,
    currency: currency ? str(currency).toLowerCase() : null,
    net_amount: net,
    fees: fee,
    taxes: tax,
    stripe_customer_id: stripe_customer_id ? str(stripe_customer_id) : null,
    stripe_object_id: stripe_object_id ? str(stripe_object_id) : null,
    stripe_event_id: stripe_event_id ? str(stripe_event_id) : null,
    status: str(status) || "RECORDED",
    reconciliation: RECONCILIATION.includes(str(reconciliation).toUpperCase()) ? str(reconciliation).toUpperCase() : "UNRECONCILED",
    source: str(source) || "acorn",
    payload: payload && typeof payload === "object" ? payload : {},
    measured_at,
    billed: false,
    paid: false,
    live: false,
    verified: epistemicOf(epistemic) === "VERIFIED",
    tax_advice: false,
    accounting_advice: false,
    invented_net: false,
    invented_tax: false,
    missing_is_not_zero: true
  };
}

export function extractStripeMoney(object = {}) {
  const amount = moneyOrNull(
    object.amount_total ?? object.amount_received ?? object.amount_paid ?? object.amount ?? object.total
  );
  const currency = object.currency ? str(object.currency).toLowerCase() : null;
  const feeDetails = object.application_fee_amount ?? object.fee ?? object.charges?.data?.[0]?.fee ?? null;
  const fees = moneyOrNull(feeDetails);
  const tax = moneyOrNull(
    object.total_details?.amount_tax ?? object.tax ?? object.automatic_tax?.amount
  );
  return {
    gross_amount: amount,
    currency,
    fees,
    taxes: tax,
    net_amount: amount != null && fees != null ? amount - fees : null
  };
}

export function applyStripeEventToLedger(event, { order = null, tenant_id = null } = {}) {
  const obj = event?.data?.object || {};
  const money = extractStripeMoney(obj);
  const type = str(event?.type);
  let kind = "PAYMENT";
  let epistemic = "OBSERVED";
  let status = "RECORDED";
  if (type.startsWith("checkout.session")) {
    kind = "CHECKOUT";
    epistemic = type.endsWith("completed") ? "OBSERVED" : "ASSERTED";
    status = type.endsWith("completed") ? "CHECKOUT_COMPLETED" : (type.endsWith("expired") ? "CHECKOUT_EXPIRED" : "CHECKOUT_CREATED");
  } else if (type === "payment_intent.succeeded" || type === "invoice.paid" || type === "charge.succeeded") {
    kind = "PAYMENT";
    epistemic = "OBSERVED";
    status = "PAYMENT_OBSERVED";
  } else if (type.includes("payment_failed") || type === "payment_intent.payment_failed") {
    kind = "PAYMENT_FAILED";
    epistemic = "OBSERVED";
    status = "PAYMENT_FAILED";
  } else if (type.includes("refund")) {
    kind = "REFUND";
    epistemic = "OBSERVED";
    status = "REFUND_OBSERVED";
  } else if (type.includes("dispute")) {
    kind = "DISPUTE";
    epistemic = "OBSERVED";
    status = "DISPUTE_OBSERVED";
  } else if (type.startsWith("customer.subscription")) {
    kind = "SUBSCRIPTION";
    epistemic = "OBSERVED";
    status = "SUBSCRIPTION_OBSERVED";
  } else if (type.startsWith("invoice.")) {
    kind = "INVOICE";
    epistemic = "OBSERVED";
    status = "INVOICE_OBSERVED";
  } else {
    kind = "PAYMENT";
    epistemic = "ASSERTED";
    status = "UNKNOWN_EVENT_RETAINED";
  }

  let reconciliation = "UNRECONCILED";
  if (order && money.gross_amount != null && Number(order.amount_cents) === Number(money.gross_amount)
    && (!order.currency || str(order.currency).toLowerCase() === money.currency)) {
    reconciliation = "MATCHED";
  } else if (order && money.gross_amount != null) {
    reconciliation = "MISMATCH";
  }

  const metadata = obj.metadata || {};
  return createLedgerEntry({
    tenant_id: tenant_id || metadata.acorn_tenant_id || order?.tenant_id || null,
    customer_id: metadata.acorn_customer_id || order?.customer_id || null,
    project_id: metadata.acorn_project_id || order?.project_id || null,
    order_id: metadata.acorn_order_id || order?.id || null,
    epistemic,
    kind,
    gross_amount: money.gross_amount,
    currency: money.currency,
    net_amount: money.net_amount,
    fees: money.fees,
    taxes: money.taxes,
    stripe_customer_id: obj.customer || null,
    stripe_object_id: obj.id || null,
    stripe_event_id: event?.id || null,
    status,
    reconciliation,
    source: "stripe_webhook",
    payload: {
      type,
      livemode: event?.livemode === true,
      object_type: obj.object || null,
      payment_status: obj.payment_status || obj.status || null
    }
  });
}

export function reconcileAgainstOrder(entry, order) {
  if (!order) return { ...entry, reconciliation: "UNRECONCILED" };
  if (entry.gross_amount == null) return { ...entry, reconciliation: "UNRECONCILED" };
  const amountOk = Number(order.amount_cents) === Number(entry.gross_amount);
  const currencyOk = !order.currency || str(order.currency).toLowerCase() === str(entry.currency).toLowerCase();
  const next = amountOk && currencyOk ? "MATCHED" : "MISMATCH";
  return { ...entry, reconciliation: next, epistemic: next === "MATCHED" && entry.epistemic === "OBSERVED" ? "MEASURED" : entry.epistemic };
}

export function moneyClaimFromLedger(entry) {
  return economicRecord({
    id: "econ_" + (entry.order_id || entry.id),
    tenant_id: entry.tenant_id,
    kind: entry.kind,
    amount: entry.gross_amount == null ? 0 : Number(entry.gross_amount) / 100,
    currency: (entry.currency || "CAD").toUpperCase(),
    status: "ESTIMATED",
    related_id: entry.order_id,
    evidence: { ledger_id: entry.id, epistemic: entry.epistemic, stripe_event_id: entry.stripe_event_id }
  });
}

export function ledgerSnapshot(entries = []) {
  const rows = Array.isArray(entries) ? entries : [];
  const observed = rows.filter((e) => e.epistemic === "OBSERVED" || e.epistemic === "MEASURED" || e.epistemic === "VERIFIED");
  const payments = observed.filter((e) => e.kind === "PAYMENT" && e.gross_amount != null && e.reconciliation !== "MISMATCH");
  const refunds = observed.filter((e) => e.kind === "REFUND" && e.gross_amount != null);
  const feesKnown = observed.filter((e) => e.fees != null);
  const gross = payments.reduce((s, e) => s + Number(e.gross_amount), 0);
  const refunded = refunds.reduce((s, e) => s + Number(e.gross_amount), 0);
  const fees = feesKnown.length ? feesKnown.reduce((s, e) => s + Number(e.fees || 0), 0) : null;
  const nets = payments.filter((e) => e.net_amount != null);
  const economics = measureRevenueEconomics({
    gross_revenue: gross / 100,
    payment_fees: fees == null ? 0 : fees / 100,
    refunds: refunded / 100,
    verified_units: payments.length,
    transactions: rows.length
  });
  return {
    version: LEDGER_VERSION,
    entry_count: rows.length,
    observed_count: observed.length,
    gross_observed_cents: payments.length ? gross : null,
    refunded_cents: refunds.length ? refunded : null,
    fees_cents: fees,
    net_cents: nets.length === payments.length && payments.length ? nets.reduce((s, e) => s + Number(e.net_amount), 0) : null,
    currency: payments[0]?.currency || null,
    billed: false,
    paid: false,
    live: false,
    verified: false,
    tax_advice: false,
    missing_is_not_zero: true,
    economics: {
      ...economics,
      payment_fees: fees == null ? null : economics.payment_fees,
      net_value: fees == null ? null : economics.net_value
    },
    tax_ready: buildTaxReadyLedger({
      invoices: payments.map((e) => ({ amount: (e.gross_amount || 0) / 100 })),
      settlements: [],
      costs: feesKnown.map((e) => ({ amount: Number(e.fees) / 100 }))
    }),
    measured_at: ISO()
  };
}
