#!/usr/bin/env node
/**
 * ACORN — ASSET & PRODUCT FACTORY
 *
 * Converts a verified delivered project into a reusable economic asset and,
 * when evidence and rights permit, a repeatable product offer.
 *
 * This is productization infrastructure, not autonomous contracting.
 * CAPABILITY != AUTHORITY. Evidence > assertion.
 */

export const ASSET_PRODUCT_FACTORY_VERSION = "acorn.asset-product-factory.v1";

const str = (v) => String(v ?? "").trim();
const arr = (v) => Array.isArray(v) ? v : [];
const pos = (v) => Math.max(0, Number.isFinite(Number(v)) ? Number(v) : 0);

export const FACTORY_POLICY = Object.freeze({
  evidence_before_productization: true,
  measured_value_only: true,
  rights_must_be_explicit: true,
  reuse_before_rebuild: true,
  build_once_sell_many: true,
  auto_contract: false,
  auto_spend: false,
  auto_outreach: false,
  auto_publish: false,
  no_fake_live: true,
  human_authority: "carl",
});

export const PRODUCT_STATES = Object.freeze([
  "CANDIDATE",
  "VALIDATED",
  "READY_FOR_OFFER",
  "PUBLISHED_BY_HUMAN",
  "ACTIVE",
  "HOLD_HUMAN",
]);

export function buildAssetRecord({
  asset_id = null,
  project_id = null,
  name = "",
  description = "",
  components = [],
  evidence = [],
  measured_value = 0,
  creation_cost = 0,
  usage_rights = [],
  verified = false,
} = {}) {
  const verifiedEvidence = arr(evidence).filter((x) =>
    x?.verified === true || x?.proven === true || ["VERIFIED", "PROVEN"].includes(str(x?.status).toUpperCase())
  );
  const rights = [...new Set(arr(usage_rights).map(str).filter(Boolean))];
  const reusableComponents = [...new Set(arr(components).map(str).filter(Boolean))];

  return Object.freeze({
    version: ASSET_PRODUCT_FACTORY_VERSION,
    asset_id: asset_id ? str(asset_id) : null,
    project_id: project_id ? str(project_id) : null,
    name: str(name || "Acorn Reusable Asset"),
    description: str(description),
    components: reusableComponents,
    evidence_count: verifiedEvidence.length,
    evidence: verifiedEvidence.map((x) => ({
      id: x?.id || x?.evidence_id || null,
      status: "VERIFIED",
      source: x?.source || null,
      observed_at: x?.observed_at || null,
    })),
    verified: verified === true && verifiedEvidence.length > 0,
    measured_value: verifiedEvidence.length > 0 ? pos(measured_value) : 0,
    creation_cost: pos(creation_cost),
    usage_rights: rights,
    reusable: reusableComponents.length > 0,
    state: verified === true && verifiedEvidence.length > 0 && reusableComponents.length > 0
      ? "VALIDATED" : "CANDIDATE",
    live: false,
    authority: "carl",
  });
}

export function buildProductCandidate({
  asset = null,
  target_audience = "BUSINESS",
  revenue_streams = ["PROJECT", "LICENSE"],
  price = null,
  currency = "USD",
  repeat_demand = 0,
  minimum_right = "COMMERCIAL_USE",
  delivery_mode = "TURNKEY",
} = {}) {
  const rights = arr(asset?.usage_rights).map(str);
  const rightAllowsUse = rights.includes(minimum_right) ||
    rights.includes("PERPETUAL_USE") ||
    rights.includes("COMMERCIAL_USE");
  const verified = asset?.verified === true;
  const reusable = asset?.reusable === true;
  const demand = pos(repeat_demand);
  const validPrice = price == null ? null : pos(price);
  const streams = [...new Set(arr(revenue_streams).map((x) => str(x).toUpperCase()).filter(Boolean))];

  const eligible = verified && reusable && rightAllowsUse && demand > 0;
  return Object.freeze({
    version: ASSET_PRODUCT_FACTORY_VERSION,
    product_id: asset?.asset_id ? `${asset.asset_id}:product` : null,
    source_asset_id: asset?.asset_id || null,
    name: asset?.name || "Acorn Product",
    audience: str(target_audience || "BUSINESS").toUpperCase(),
    delivery_mode: str(delivery_mode || "TURNKEY").toUpperCase(),
    revenue_streams: streams.length ? streams : ["PROJECT"],
    price: validPrice,
    currency: str(currency || "USD").toUpperCase(),
    repeat_demand: demand,
    rights_sufficient: rightAllowsUse,
    state: eligible ? (validPrice != null ? "READY_FOR_OFFER" : "VALIDATED") : "HOLD_HUMAN",
    billable_candidate: eligible && validPrice != null,
    auto_publish: false,
    auto_contract: false,
    authority: "carl",
  });
}

export function buildCatalogEntry({ asset = null, product = null, proof = [] } = {}) {
  const evidence = arr(proof).filter((x) =>
    x?.verified === true || x?.proven === true || ["VERIFIED", "PROVEN"].includes(str(x?.status).toUpperCase())
  );
  const ready = product?.state === "READY_FOR_OFFER" || product?.state === "VALIDATED";
  return Object.freeze({
    version: ASSET_PRODUCT_FACTORY_VERSION,
    catalog_id: product?.product_id || asset?.asset_id || null,
    asset_id: asset?.asset_id || null,
    product_id: product?.product_id || null,
    name: product?.name || asset?.name || "Acorn Catalog Item",
    description: asset?.description || "",
    proof_count: evidence.length,
    proof_state: evidence.length > 0 ? "EVIDENCED" : "UNVERIFIED",
    customer_value: asset?.verified === true ? pos(asset?.measured_value) : 0,
    usage_rights: arr(asset?.usage_rights),
    state: ready && evidence.length > 0 ? "READY_FOR_OFFER" : "HOLD_HUMAN",
    published: false,
    live: false,
    requires_human_publication: true,
    authority: "carl",
  });
}

export function buildFactoryCycle(input = {}) {
  const asset = buildAssetRecord({
    asset_id: input.asset_id,
    project_id: input.project_id,
    name: input.name,
    description: input.description,
    components: input.components,
    evidence: input.evidence,
    measured_value: input.measured_value,
    creation_cost: input.creation_cost,
    usage_rights: input.usage_rights,
    verified: input.verified,
  });
  const product = buildProductCandidate({
    asset,
    target_audience: input.target_audience,
    revenue_streams: input.revenue_streams,
    price: input.price,
    currency: input.currency,
    repeat_demand: input.repeat_demand,
    minimum_right: input.minimum_right,
    delivery_mode: input.delivery_mode,
  });
  const catalog = buildCatalogEntry({ asset, product, proof: input.evidence });
  return {
    version: ASSET_PRODUCT_FACTORY_VERSION,
    cycle: ["DELIVERED_PROJECT", "VERIFY", "CAPTURE_ASSET", "VALIDATE_REUSE", "PRODUCTIZE", "PREPARE_OFFER", "HUMAN_PUBLISH", "REPEAT"],
    asset,
    product,
    catalog,
    policy: FACTORY_POLICY,
    live: false,
    authority: "carl",
  };
}

export function factoryPolicy() {
  return FACTORY_POLICY;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(factoryPolicy(), null, 2));
}
