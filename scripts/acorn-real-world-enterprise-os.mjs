/**
 * ACORN — REAL-WORLD ENTERPRISE OPERATING SYSTEM
 *
 * The economic/operational bridge around the existing cognitive core.
 * This module is intentionally provider-neutral:
 * - connections are capability descriptors, not secret stores
 * - money is represented as an internal double-entry-style ledger of claims/reservations
 * - no custody, transfer, contract, spend, outreach or merge is performed automatically
 * - consequential authority remains human
 *
 * "CAPABILITY !== AUTHORITY"
 */

const ISO = () => new Date().toISOString();
const uid = (p) => `${p}_${cryptoRandom()}`;
const cryptoRandom = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const ENTERPRISE_STAGES = Object.freeze([
  "INTAKE","UNDERSTAND","DISCOVER","QUALIFY","DESIGN","OFFER_READY",
  "HUMAN_AUTHORIZATION","AUTHORIZED","FUNDED_PENDING","PLANNING",
  "EXECUTING","VERIFYING","READY_TO_DELIVER","DELIVERED","ACCEPTED",
  "SUPPORT","VALUE_MEASURED","ASSET_CANDIDATE","PRODUCT_CANDIDATE",
  "OFFER_CANDIDATE","EXPANSION"
]);

export const MONEY_STATES = Object.freeze([
  "UNFUNDED","PENDING","AUTHORIZED","HELD_INTERNAL","SETTLED_EXTERNAL",
  "REFUNDED","CANCELLED"
]);

export const AUTHORITY = Object.freeze({
  HUMAN: "human",
  SYSTEM: "system",
  INTELLIGENCE: "intelligence",
  CONNECTOR: "connector"
});

const forbiddenAutomaticEffects = Object.freeze([
  "AUTO_CONTRACT","AUTO_SPEND","AUTO_TRANSFER","AUTO_CUSTODY",
  "AUTO_PUBLISH","AUTO_OUTREACH","AUTO_MERGE","AUTO_SIGN"
]);

function assertNoForbiddenEffect(effect) {
  if (forbiddenAutomaticEffects.includes(effect)) {
    throw new Error(`FORBIDDEN_AUTOMATIC_EFFECT:${effect}`);
  }
}

export function createConnection({ id, provider, kind, capabilities = [], state = "DISCOVERED", metadata = {} }) {
  if (!id || !provider || !kind) throw new Error("CONNECTION_ID_PROVIDER_KIND_REQUIRED");
  return {
    id, provider, kind, capabilities: [...new Set(capabilities)],
    state, authority: AUTHORITY.CONNECTOR, metadata,
    discovered_at: ISO(), measured_at: null,
    credentials_present: false,
    secret_custody: false
  };
}

export function measureConnection(connection, { reachable = false, capabilities = [] } = {}) {
  return {
    ...connection,
    state: reachable ? "READY" : "DISCOVERED",
    capabilities: [...new Set([...(connection.capabilities || []), ...capabilities])],
    measured_at: ISO(),
    evidence: { reachable, measured_at: ISO() }
  };
}

export function createIntelligenceAdapter({ id, provider, model, capabilities = [], endpoint = null, timeout_ms = null, cost = null }) {
  return {
    id, provider, model, endpoint,
    capabilities: [...new Set(capabilities)],
    identity: { provider, model },
    authority: false,
    state: "DISCOVERED",
    evidence: [],
    timeout_ms,
    cost_metadata: cost || { amount: "NOT_MEASURED", currency: "UNKNOWN" },
    cancellable: true,
    retryable: true,
    provider_is_not_foundation: true,
    discovered_at: ISO()
  };
}

export function routeByCapability(task, intelligences = [], connections = []) {
  const required = new Set(task.required_capabilities || []);
  const candidates = intelligences
    .filter(i => i.state === "READY" || i.state === "DISCOVERED")
    .map(i => ({
      type: "intelligence", id: i.id, provider: i.provider,
      score: [...required].filter(c => (i.capabilities || []).includes(c)).length
    }))
    .concat(connections.map(c => ({
      type: "connection", id: c.id, provider: c.provider,
      score: [...required].filter(x => (c.capabilities || []).includes(x)).length
    })));
  return candidates.sort((a,b) => b.score - a.score);
}

export function createProject({ customer, problem, constraints = [], successCriteria = [], rights = [] }) {
  if (!customer || !problem) throw new Error("CUSTOMER_AND_PROBLEM_REQUIRED");
  return {
    id: uid("project"), customer, problem, constraints, success_criteria: successCriteria,
    rights, stage: "INTAKE", authority: AUTHORITY.HUMAN,
    created_at: ISO(), updated_at: ISO(), evidence: [], tasks: [], decisions: []
  };
}

export function qualifyProject(project, { missing = [], complexity = "unknown", capabilities = [] } = {}) {
  return {
    ...project,
    stage: missing.length ? "QUALIFY" : "DESIGN",
    qualification: {
      complete: missing.length === 0,
      missing,
      complexity,
      capabilities_required: capabilities,
      measured_at: ISO()
    },
    updated_at: ISO()
  };
}

export function createOffer(project, { deliverables = [], priceBasis = null, currency = "CAD", usageRights = [] } = {}) {
  return {
    id: uid("offer"), project_id: project.id, state: "DRAFT",
    deliverables, price_basis: priceBasis, currency, usage_rights: usageRights,
    human_authorization_required: true, created_at: ISO()
  };
}

export function authorizeOffer(offer, { authorizedBy, authorizationReference }) {
  if (!authorizedBy || authorizedBy !== AUTHORITY.HUMAN || !authorizationReference) {
    return { ...offer, state: "HUMAN_AUTHORIZATION_REQUIRED" };
  }
  return { ...offer, state: "AUTHORIZED", authorized_at: ISO(), authorized_by: authorizedBy, authorization_reference: authorizationReference };
}

/**
 * Internal money ledger:
 * represents commercial intent, reservations and measured settlement.
 * It never represents custody of real funds and never moves money.
 */
export function createMoneyLedger() {
  return { currency_default: "CAD", entries: [], balance: 0, reserved: 0, available: 0 };
}

export function recordMoneyIntent(ledger, { projectId, amount, currency = ledger.currency_default, kind = "CUSTOMER_OBLIGATION" }) {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("INVALID_MONEY_AMOUNT");
  const entry = {
    id: uid("money"), project_id: projectId, amount, currency, kind,
    state: "PENDING", custody: false, transferred: false, measured_at: ISO()
  };
  return { ...ledger, entries: [...ledger.entries, entry] };
}

export function authorizeInternalMoney(ledger, entryId, { authorizedBy }) {
  if (authorizedBy !== AUTHORITY.HUMAN) return ledger;
  const entries = ledger.entries.map(e => e.id === entryId ? { ...e, state: "AUTHORIZED", authorized_at: ISO(), authorized_by: authorizedBy } : e);
  return { ...ledger, entries, reserved: entries.filter(e=>e.state==="AUTHORIZED").reduce((s,e)=>s+e.amount,0) };
}

export function recordExternalSettlement(ledger, entryId, { evidenceId, providerReference }) {
  if (!evidenceId || !providerReference) throw new Error("SETTLEMENT_EVIDENCE_REQUIRED");
  const entries = ledger.entries.map(e => e.id === entryId ? {
    ...e, state: "SETTLED_EXTERNAL", settlement: { evidence_id: evidenceId, provider_reference: providerReference, measured_at: ISO() }
  } : e);
  return { ...ledger, entries, reserved: entries.filter(e=>e.state==="AUTHORIZED").reduce((s,e)=>s+e.amount,0) };
}

export function createCryptoRail({ asset = "STABLECOIN", network = "UNSELECTED", custody = "EXTERNAL" } = {}) {
  return {
    id: uid("rail"), type: "CRYPTO", asset, network, custody,
    state: "PROPOSED",
    automatic_transfer: false,
    automatic_custody: false,
    human_authorization_required: true,
    notes: "Payment rail adapter only; no wallet or private-key custody."
  };
}

export function createEvidence({ kind, source, claim, strength = 0, margin = 0, validUntil = null }) {
  return {
    id: uid("evidence"), kind, source, claim, strength, margin,
    valid_until: validUntil, measured_at: ISO(),
    status: strength > 0 && margin > 0 ? "MEASURED" : "INSUFFICIENT"
  };
}

export function verifyDelivery({ project, deliverables = [], evidence = [], tests = [] }) {
  const evidenceReady = evidence.length > 0 && evidence.every(e => e.status === "MEASURED");
  const testsReady = tests.length > 0 && tests.every(t => t.passed === true);
  return {
    project_id: project.id,
    ready: evidenceReady && testsReady && deliverables.length > 0,
    evidence_count: evidence.length,
    tests_count: tests.length,
    measured_at: ISO(),
    blockers: [
      ...(evidenceReady ? [] : ["MEASURED_EVIDENCE_REQUIRED"]),
      ...(testsReady ? [] : ["PASSING_TEST_EVIDENCE_REQUIRED"]),
      ...(deliverables.length ? [] : ["DELIVERABLE_REQUIRED"])
    ]
  };
}

export function measureValue({ projectId, expectedValue = null, realizedValue = null, currency = "CAD", evidenceId = null }) {
  const measured = Number.isFinite(realizedValue);
  return {
    project_id: projectId, expected_value: expectedValue, realized_value: measured ? realizedValue : null,
    currency, status: measured && evidenceId ? "MEASURED" : "UNMEASURED",
    evidence_id: evidenceId, measured_at: ISO()
  };
}

export function captureAsset({ projectId, assetType, reusable, evidenceId, rights = [] }) {
  if (!reusable || !evidenceId) return { state: "ASSET_CANDIDATE", project_id: projectId, asset_type: assetType, rights, evidence_id: evidenceId };
  return { id: uid("asset"), state: "VALIDATED_ASSET", project_id: projectId, asset_type: assetType, evidence_id: evidenceId, rights, created_at: ISO() };
}

export function productizeAsset(asset, { repeatDemand = false, priceBasis = null } = {}) {
  if (asset.state !== "VALIDATED_ASSET" || !repeatDemand) return { ...asset, state: "PRODUCT_CANDIDATE", repeat_demand: repeatDemand, price_basis: priceBasis };
  return { ...asset, state: "PRODUCT_READY", repeat_demand: true, price_basis: priceBasis, product_id: uid("product") };
}

export function createEnterpriseCycle(input = {}) {
  const project = createProject(input);
  const qualification = qualifyProject(project, input.qualification || {});
  const offer = createOffer(qualification, input.offer || {});
  const ledger = recordMoneyIntent(createMoneyLedger(), {
    projectId: project.id,
    amount: Number(input.offer?.amount || 0) || 1,
    currency: input.offer?.currency || "CAD"
  });
  const connections = (input.connections || []).map(c => createConnection(c));
  const intelligences = (input.intelligences || []).map(i => createIntelligenceAdapter(i));
  return {
    id: uid("cycle"), project: qualification, offer, ledger, connections, intelligences,
    stage: "OFFER_READY", authority: AUTHORITY.HUMAN,
    policy: {
      capability_is_not_authority: true,
      no_auto_contract: true, no_auto_spend: true, no_auto_transfer: true,
      no_auto_custody: true, no_auto_publish: true, no_auto_outreach: true,
      no_auto_merge: true, measured_only_live: true
    },
    next_required_human_action: "AUTHORIZE_OFFER",
    created_at: ISO()
  };
}

export function enterpriseSnapshot({ projects = [], offers = [], ledger = createMoneyLedger(), connections = [], intelligences = [], assets = [], products = [] } = {}) {
  return {
    system: "ACORN_REAL_WORLD_ENTERPRISE_OS",
    status: "OPERATIONAL_FRAMEWORK",
    measured_at: ISO(),
    projects: { count: projects.length, active: projects.filter(p => !["ACCEPTED","EXPANSION"].includes(p.stage)).length },
    commercial: { offers: offers.length, authorized: offers.filter(o=>o.state==="AUTHORIZED").length },
    money: {
      internal_claims: ledger.entries.length,
      pending: ledger.entries.filter(e=>e.state==="PENDING").length,
      authorized: ledger.entries.filter(e=>e.state==="AUTHORIZED").length,
      external_settled: ledger.entries.filter(e=>e.state==="SETTLED_EXTERNAL").length,
      custody: false
    },
    connectivity: {
      connections: connections.length,
      ready: connections.filter(c=>c.state==="READY").length,
      intelligences: intelligences.length
    },
    assets: { count: assets.length, validated: assets.filter(a=>a.state==="VALIDATED_ASSET").length },
    products: { count: products.length, ready: products.filter(p=>p.state==="PRODUCT_READY").length },
    authority: "CARL_HUMAN_FINAL",
    live_claim: "NOT_ASSERTED_BY_SNAPSHOT"
  };
}

export function guardEffect(effect) {
  if (effect === "AUTO_TRANSFER") {
    assertNoForbiddenEffect(effect);
  }
  return { allowed: false, effect, reason: "HUMAN_AUTHORIZATION_REQUIRED" };
}
