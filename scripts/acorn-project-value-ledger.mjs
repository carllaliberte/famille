#!/usr/bin/env node
/**
 * ACORN — PROJECT / VALUE ECONOMIC LEDGER
 *
 * Measurement-only economic state for the Universal Project & Value Engine.
 * It records observed/projected values without inventing revenue, contracts,
 * payment, custody, or LIVE state.
 *
 * CAPABILITY != AUTHORITY.
 * Evidence > assertion.
 * Measurement > assumption.
 * Human authority: Carl.
 */

export const PROJECT_VALUE_LEDGER_VERSION = "acorn.project-value-ledger.v1";

const str = (v) => String(v ?? "").trim();
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const pos = (v) => Math.max(0, num(v));

export const LEDGER_POLICY = Object.freeze({
  measured_only: true,
  invented_revenue: false,
  projected_is_not_realized: true,
  payment_is_not_receipt: true,
  no_auto_contract: true,
  no_auto_spend: true,
  no_private_key_custody: true,
  no_auto_merge: true,
  live: false,
  human_authority: "carl",
});

export function normalizeValueRecord({
  id = null,
  project_id = null,
  asset_id = null,
  offer_id = null,
  kind = "VALUE",
  status = "MEASURED",
  currency = "USD",
  amount = 0,
  cost = 0,
  source = "unknown",
  evidence_id = null,
  observed_at = null,
  usage_right = null,
} = {}) {
  const allowed = new Set([
    "VALUE", "COST", "OFFER", "REVENUE", "REFUND", "USAGE", "LICENSE", "SAVING",
  ]);
  const normalizedKind = str(kind).toUpperCase();
  const normalizedStatus = str(status).toUpperCase() || "MEASURED";
  return Object.freeze({
    version: PROJECT_VALUE_LEDGER_VERSION,
    id: id ? str(id) : null,
    project_id: project_id ? str(project_id) : null,
    asset_id: asset_id ? str(asset_id) : null,
    offer_id: offer_id ? str(offer_id) : null,
    kind: allowed.has(normalizedKind) ? normalizedKind : "VALUE",
    status: normalizedStatus,
    currency: str(currency || "USD").toUpperCase(),
    amount: pos(amount),
    cost: pos(cost),
    source: str(source || "unknown"),
    evidence_id: evidence_id ? str(evidence_id) : null,
    observed_at: observed_at ? str(observed_at) : null,
    usage_right: usage_right ? str(usage_right) : null,
    authority: "carl",
  });
}

export function buildProjectValueLedger({
  project_id = null,
  records = [],
  projected_revenue = 0,
  realized_revenue = 0,
  delivery_cost = 0,
  measured_value = 0,
  evidence_verified = false,
  currency = "USD",
} = {}) {
  const normalized = (Array.isArray(records) ? records : [])
    .map((record) => normalizeValueRecord({ ...record, project_id: record?.project_id || project_id, currency: record?.currency || currency }));

  const revenue = normalized.filter((r) => r.kind === "REVENUE" && r.status === "REALIZED");
  const costs = normalized.filter((r) => r.kind === "COST" && r.status === "REALIZED");
  const realizedFromRecords = revenue.reduce((sum, r) => sum + r.amount, 0);
  const costFromRecords = costs.reduce((sum, r) => sum + r.amount, 0);
  const realized = Math.max(0, pos(realized_revenue), realizedFromRecords);
  const cost = Math.max(0, pos(delivery_cost), costFromRecords);
  const projected = pos(projected_revenue);
  const value = evidence_verified ? pos(measured_value) : 0;

  return Object.freeze({
    version: PROJECT_VALUE_LEDGER_VERSION,
    project_id: project_id ? str(project_id) : null,
    currency: str(currency || "USD").toUpperCase(),
    records: normalized,
    measured_value: value,
    projected_revenue: projected,
    realized_revenue: realized,
    realized_cost: cost,
    realized_net_value: Math.max(0, realized - cost),
    projected_net_value: Math.max(0, projected - cost),
    revenue_realization_ratio: projected > 0 ? Number((realized / projected).toFixed(6)) : 0,
    evidence_verified: evidence_verified === true,
    reconciliation: {
      record_revenue: realizedFromRecords,
      record_cost: costFromRecords,
      input_revenue: pos(realized_revenue),
      input_cost: pos(delivery_cost),
      source_totals_preserved: true,
    },
    live: false,
    authority: "carl",
  });
}

export function buildAssetEconomics({
  asset_id = null,
  project_id = null,
  verified = false,
  reusable_uses = 0,
  similar_demand = 0,
  measured_value = 0,
  creation_cost = 0,
  realized_revenue = 0,
  currency = "USD",
  usage_right = "PERPETUAL_USE",
} = {}) {
  const uses = pos(reusable_uses);
  const demand = pos(similar_demand);
  const value = verified ? pos(measured_value) : 0;
  const cost = pos(creation_cost);
  const revenue = pos(realized_revenue);
  return Object.freeze({
    version: PROJECT_VALUE_LEDGER_VERSION,
    asset_id: asset_id ? str(asset_id) : null,
    project_id: project_id ? str(project_id) : null,
    verified: verified === true,
    reusable_uses: uses,
    similar_demand: demand,
    measured_value: value,
    creation_cost: cost,
    realized_revenue: revenue,
    realized_net_value: Math.max(0, revenue - cost),
    reuse_evidence: verified === true && uses > 0,
    productization_evidence: verified === true && uses > 0 && demand > 0,
    usage_right: str(usage_right || "PERPETUAL_USE"),
    currency: str(currency || "USD").toUpperCase(),
    auto_license: false,
    auto_contract: false,
    authority: "carl",
  });
}

export function buildEconomicProof({
  ledger = null,
  asset = null,
  evidence = null,
  payment_rail = null,
} = {}) {
  const evidenceVerified = evidence?.verified === true || ledger?.evidence_verified === true;
  const railVerified = payment_rail?.verified === true;
  const realized = pos(ledger?.realized_revenue);
  return Object.freeze({
    version: PROJECT_VALUE_LEDGER_VERSION,
    project_id: ledger?.project_id || asset?.project_id || null,
    evidence_verified: evidenceVerified,
    payment_rail_verified: railVerified,
    realized_revenue: realized,
    realized_net_value: pos(ledger?.realized_net_value),
    commercial_state: realized > 0 && evidenceVerified ? "REALIZED_AND_EVIDENCED" : realized > 0 ? "REALIZED_UNDER_EVIDENCE_GAP" : "NOT_REALIZED",
    proof_state: evidenceVerified ? "EVIDENCED" : "UNVERIFIED",
    payment_state: railVerified ? "RAIL_VERIFIED" : "RAIL_UNVERIFIED",
    no_receipt_claim: true,
    no_live_claim: true,
    authority: "carl",
  });
}

export function ledgerPolicy() {
  return LEDGER_POLICY;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(buildProjectValueLedger({ project_id: "demo" }), null, 2));
}
