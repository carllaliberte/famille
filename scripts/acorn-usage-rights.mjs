/** ACORN — EXPLICIT USAGE RIGHTS
 * Rights are sold, versioned, scoped, and never inferred.
 * A perpetual grant is a commercial versioned right, not a silent forever license.
 */
import crypto from "node:crypto";

export const USAGE_RIGHTS_VERSION = "acorn.usage-rights.v1";
export const RIGHTS_STATES = Object.freeze(["PENDING", "GRANTED", "EXPIRED", "REVOKED", "HOLD_HUMAN"]);
export const KNOWN_RIGHTS = Object.freeze([
  "CUSTOMER_USE",
  "INTERNAL_USE",
  "COMMERCIAL_USE",
  "PERPETUAL_VERSIONED",
  "SUBSCRIPTION_TERM",
  "ENTERPRISE_CONTRACT",
  "EVALUATION"
]);

const ISO = () => new Date().toISOString();
const uid = (p) => `${p}_${crypto.randomUUID()}`;
const str = (v) => String(v ?? "").trim();
const list = (v) => [...new Set((Array.isArray(v) ? v : [v]).map(str).filter(Boolean))];

export function describeUsageRights({
  id,
  tenant_id,
  customer_id,
  project_id = null,
  product,
  version = "1",
  rights = [],
  duration = null,
  scope = "tenant",
  conditions = [],
  perpetual = false,
  granted_at = null,
  valid_until = null,
  state = "PENDING",
  order_id = null
} = {}) {
  const sold = list(rights);
  const perpetualExplicit = perpetual === true || sold.includes("PERPETUAL_VERSIONED");
  if (perpetualExplicit && !sold.includes("PERPETUAL_VERSIONED")) sold.push("PERPETUAL_VERSIONED");
  const st = RIGHTS_STATES.includes(str(state).toUpperCase()) ? str(state).toUpperCase() : "PENDING";
  return {
    id: id || uid("right"),
    version: USAGE_RIGHTS_VERSION,
    tenant_id: str(tenant_id) || null,
    customer_id: str(customer_id) || null,
    project_id: project_id ? str(project_id) : null,
    order_id: order_id ? str(order_id) : null,
    product: str(product) || "acorn.project",
    product_version: str(version) || "1",
    rights: sold,
    duration: perpetualExplicit ? "PERPETUAL_VERSIONED" : (duration ? str(duration) : null),
    scope: str(scope) || "tenant",
    conditions: list(conditions),
    perpetual: perpetualExplicit,
    perpetual_inferred: false,
    granted_at: st === "GRANTED" ? (granted_at || ISO()) : null,
    valid_until: perpetualExplicit ? null : (valid_until || null),
    state: st,
    live: false,
    authority: "carl"
  };
}

export function rightsFromOffer(offer, { tenant_id, customer_id, project_id, order_id } = {}) {
  const model = str(offer?.model || offer?.pricing_model).toUpperCase();
  const rights = list(offer?.usage_rights);
  if (model === "SUBSCRIPTION" && !rights.length) rights.push("SUBSCRIPTION_TERM", "CUSTOMER_USE");
  if (model === "ENTERPRISE" && !rights.length) rights.push("ENTERPRISE_CONTRACT", "CUSTOMER_USE");
  if (model === "ONE_TIME" && !rights.length) rights.push("PERPETUAL_VERSIONED", "CUSTOMER_USE");
  if (model === "USAGE" && !rights.length) rights.push("CUSTOMER_USE");
  const duration = model === "SUBSCRIPTION" ? (offer?.interval === "year" ? "P1Y" : "P1M") : (model === "ONE_TIME" ? "PERPETUAL_VERSIONED" : null);
  return describeUsageRights({
    tenant_id,
    customer_id,
    project_id,
    order_id,
    product: offer?.id || offer?.product || "acorn.offer",
    version: offer?.pricing_version || "acorn.price.v1",
    rights,
    duration,
    perpetual: model === "ONE_TIME",
    state: "PENDING"
  });
}

export function grantUsageRights(record, { paymentObserved = false, measuredAt = ISO() } = {}) {
  if (!paymentObserved) {
    return { ...record, state: "PENDING", granted_at: null, reason: "PAYMENT_OBSERVED_REQUIRED" };
  }
  if (record.state === "REVOKED") return { ...record, reason: "REVOKED" };
  return {
    ...record,
    state: "GRANTED",
    granted_at: measuredAt,
    reason: null,
    live: false
  };
}

export function expireUsageRights(record, { at = ISO() } = {}) {
  if (record.perpetual && record.duration === "PERPETUAL_VERSIONED") {
    return { ...record, expired: false, false_because_expired: false, note: "perpetual_is_versioned_commercial_right" };
  }
  if (!record.valid_until) return { ...record, expired: false, false_because_expired: false };
  const expired = Date.parse(record.valid_until) < Date.parse(at);
  return {
    ...record,
    state: expired ? "EXPIRED" : record.state,
    expired,
    false_because_expired: false
  };
}
