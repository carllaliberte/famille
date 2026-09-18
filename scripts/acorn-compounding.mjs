/** ACORN — COMPOUNDING PRIMITIVES
 * One identity. Many representations. Provenance preserved.
 * Composition is not authority. Access is not ownership.
 * Private results are not public assets.
 */
import { stampTemporal } from "./acorn-omni-core.mjs";
import { describeUsageRights } from "./acorn-usage-rights.mjs";
import { buildAssetRecord, buildProductCandidate } from "./acorn-asset-product-factory.mjs";

export const COMPOUNDING_VERSION = "acorn.compounding.v0";
export const REPRESENTATIONS = Object.freeze([
  "COMPONENT", "CAPABILITY", "SERVICE", "PRODUCT", "PROJECT_COMPONENT",
  "API", "WORKFLOW_STEP", "RESOURCE", "ASSET"
]);
export const TRANSFORMS = Object.freeze([
  "WRAPPED", "COMPOSED", "ADAPTED", "SPECIALIZED", "GENERALIZED", "VERSIONED"
]);

const ISO = () => new Date().toISOString();
const str = (v) => String(v ?? "").trim();

export function primitiveIdentity({
  kind = "CAPABILITY",
  key,
  version = "1",
  valid_from = null,
  valid_until = null
} = {}) {
  const k = str(key);
  if (!k) return { error: "KEY_REQUIRED", live: false };
  const time = stampTemporal({ at: valid_from || ISO(), valid_until, version, source: "acorn-compounding" });
  return {
    id: str(kind).toLowerCase() + ":" + k,
    kind: str(kind).toUpperCase() || "CAPABILITY",
    key: k,
    version: str(version) || "1",
    valid_from: time.valid_from,
    valid_until: time.valid_until,
    expired: time.expired === true,
    identity_is_not_representation: true,
    composition_is_not_authority: true,
    live: false
  };
}

export function represent(identity, as = "CAPABILITY") {
  const form = str(as).toUpperCase();
  const allowed = REPRESENTATIONS.includes(form) ? form : "CAPABILITY";
  return {
    identity_id: identity?.id || null,
    key: identity?.key || null,
    version: identity?.version || "1",
    representation: allowed,
    same_identity: true,
    duplicated: false,
    published: false,
    live: false
  };
}

export function derive({ from, into = "ASSET", transform = "COMPOSED" } = {}) {
  const t = TRANSFORMS.includes(str(transform).toUpperCase()) ? str(transform).toUpperCase() : "COMPOSED";
  const derived = primitiveIdentity({
    kind: into,
    key: (from?.key || "unknown") + "_" + t.toLowerCase(),
    version: from?.version || "1"
  });
  return {
    ...derived,
    derived_from: from?.id || null,
    origin_key: from?.key || null,
    transform: t,
    rights: from?.rights || [],
    evidence: [],
    composition_is_not_authority: true,
    live: false
  };
}

export function pinVersion({ projectId, identity, version = null } = {}) {
  return {
    project_id: projectId || null,
    primitive_id: identity?.id || null,
    version: str(version || identity?.version || "1"),
    pinned: true,
    silent_upgrade: false,
    live: false
  };
}

export function resolveAt({ identity, pins = [], projectId = null } = {}) {
  const pin = pins.find((p) => p.project_id === projectId && p.primitive_id === identity?.id);
  return {
    identity_id: identity?.id || null,
    current_version: identity?.version || "1",
    resolved_version: pin ? pin.version : (identity?.version || "1"),
    pinned: Boolean(pin),
    live: false
  };
}

export function compatible({ a, b } = {}) {
  if (!a?.id || !b?.id) return { state: "UNKNOWN", compatible: false, live: false };
  return {
    a: a.id,
    b: b.id,
    a_version: a.version || "1",
    b_version: b.version || "1",
    compatible: a.kind === b.kind || Boolean(a.can_connect_to && a.can_connect_to.includes(b.id)),
    can_connect_to: Array.isArray(a.can_connect_to) ? a.can_connect_to : [],
    measured: false,
    live: false
  };
}

export function canReuse({ rights = [], purpose = "PROJECT" } = {}) {
  const list = Array.isArray(rights) ? rights.map(str) : [];
  const goal = str(purpose).toUpperCase();
  if (!list.length) {
    return { allowed: false, reason: "ACCESS_IS_NOT_OWNERSHIP", live: false };
  }
  if (goal === "PUBLIC" && !(list.includes("DISTRIBUTE") || list.includes("COMMERCIAL_USE") || list.includes("WHITE_LABEL"))) {
    return { allowed: false, reason: "PROJECT_RESULT_IS_NOT_UNIVERSAL_REUSE", live: false };
  }
  if (goal === "PRODUCT" && !(list.includes("COMMERCIAL_USE") || list.includes("RESELL") || list.includes("WHITE_LABEL") || list.includes("PERPETUAL_VERSIONED"))) {
    return { allowed: false, reason: "RIGHTS_INSUFFICIENT", live: false };
  }
  return { allowed: true, reason: null, rights: list, live: false };
}

export function generalizeLearning({ outcome = null, customer_data = null } = {}) {
  return {
    generalized: outcome ? {
      capability: outcome.capability || null,
      quality: outcome.quality == null ? null : outcome.quality,
      cost_state: outcome.cost == null ? "COST_NOT_MEASURED" : "OBSERVED"
    } : null,
    customer_data: null,
    input_customer_data_discarded: customer_data != null,
    leaked: false,
    anonymization_guaranteed: false,
    promoted: false,
    live: false
  };
}

export function assetize({ result = null, rights = [], evidence = [] } = {}) {
  const reuse = canReuse({ rights, purpose: "PRODUCT" });
  if (!reuse.allowed) {
    return {
      state: "PRIVATE_RESULT",
      public: false,
      reusable: false,
      reason: reuse.reason,
      measured_value: result?.measured_value == null ? null : result.measured_value,
      live: false
    };
  }
  if (result?.verified !== true) {
    return {
      state: "PRIVATE_RESULT",
      public: false,
      reusable: false,
      reason: "UNVERIFIED",
      measured_value: null,
      live: false
    };
  }
  const asset = buildAssetRecord({
    project_id: result.project_id || null,
    name: result.name || result.capability || "Reusable asset",
    components: result.components || [result.capability].filter(Boolean),
    evidence,
    usage_rights: rights,
    verified: true
  });
  const product = buildProductCandidate({
    asset,
    minimum_right: "COMMERCIAL_USE",
    price: null
  });
  return { state: "ASSET", asset, product, public: false, published: false, live: false };
}

export function adapt({ identity, market = null, country = null, currency = null, language = null } = {}) {
  return {
    identity_id: identity?.id || null,
    key: identity?.key || null,
    version: identity?.version || "1",
    market: market ? str(market) : null,
    country: country ? str(country) : null,
    currency: currency ? str(currency).toLowerCase() : null,
    language: language ? str(language) : null,
    core_unchanged: true,
    duplicated: false,
    regulation: null,
    live: false
  };
}

export function leverage({ future_uses = null, complexity = null } = {}) {
  const uses = Number(future_uses);
  const cost = Number(complexity);
  if (!Number.isFinite(uses) || !Number.isFinite(cost) || cost <= 0) {
    return { leverage: null, state: "NOT_MEASURED", economic: false, live: false };
  }
  return {
    leverage: uses / cost,
    state: "DESIGN_METRIC",
    economic: false,
    economic_truth: false,
    live: false
  };
}

export function compound({ identity, representations = [], derivations = [] } = {}) {
  const forms = (representations.length ? representations : REPRESENTATIONS).map((as) => represent(identity, as));
  return {
    version: COMPOUNDING_VERSION,
    identity,
    representations: forms,
    derivations,
    unique_identities: 1,
    unique_representations: forms.length,
    composition_is_not_authority: true,
    live: false
  };
}

export function rightsEnvelope(input = {}) {
  return describeUsageRights({
    ...input,
    perpetual: input.perpetual === true,
    rights: input.rights || ["CUSTOMER_USE"]
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const id = primitiveIdentity({ key: "analysis" });
  console.log(JSON.stringify({
    version: COMPOUNDING_VERSION,
    identity: id.id,
    representations: compound({ identity: id }).unique_representations,
    live: false
  }));
}
