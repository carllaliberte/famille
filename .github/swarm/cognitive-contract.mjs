#!/usr/bin/env node
/**
 * ACORN COGNITIVE CONTRACT
 *
 * Shared, provenance-preserving contract for multi-intelligence cognition.
 * This is a contract layer inside the existing Cortex/Fabric, not a new
 * runtime or authority system.
 *
 * CAPABILITY !== AUTHORITY
 * IDENTITY !== MODEL !== CHANNEL
 * PROPOSED -> EXECUTED -> OBSERVED -> MEASURED -> VERIFIED
 * The Breaker is human-owned and is never writable through this contract.
 */

export const COGNITIVE_CONTRACT_VERSION = "cognitive-contract.v1";

export const COGNITIVE_STATES = Object.freeze([
  "PROPOSED",
  "EXECUTED",
  "OBSERVED",
  "MEASURED",
  "VERIFIED",
  "HOLD_HUMAN",
  "INCONCLUSIVE",
]);

const TRANSITIONS = Object.freeze({
  PROPOSED: new Set(["EXECUTED", "HOLD_HUMAN", "INCONCLUSIVE"]),
  EXECUTED: new Set(["OBSERVED", "HOLD_HUMAN", "INCONCLUSIVE"]),
  OBSERVED: new Set(["MEASURED", "HOLD_HUMAN", "INCONCLUSIVE"]),
  MEASURED: new Set(["VERIFIED", "HOLD_HUMAN", "INCONCLUSIVE"]),
  VERIFIED: new Set(["HOLD_HUMAN", "INCONCLUSIVE"]),
  HOLD_HUMAN: new Set([]),
  INCONCLUSIVE: new Set(["PROPOSED", "HOLD_HUMAN"]),
});

const clean = (value, fallback = "unknown") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const list = (value) => [...new Set((Array.isArray(value) ? value : [value])
  .map((item) => clean(item, "").trim())
  .filter(Boolean))];

export function createCognitiveContract({
  identity,
  model,
  channel,
  intent,
  capabilities = [],
  context = null,
  proposal = null,
  action = null,
  observation = null,
  evidence = [],
  confidence = null,
  uncertainty = null,
  error = null,
  limitation = null,
  provenance = {},
  temporalValidity = {},
  authority = {},
} = {}) {
  const breaker = clean(authority.breaker, "HUMAN_CONTROLLED").toUpperCase();
  if (["OPEN", "CLOSED", "CONTROL", "WRITE", "SET"].includes(breaker)) {
    throw new Error("BREAKER_CONTROL_FORBIDDEN");
  }

  return Object.freeze({
    contract: COGNITIVE_CONTRACT_VERSION,
    identity: clean(identity),
    model: clean(model),
    channel: clean(channel),
    intent: clean(intent, ""),
    capabilities: list(capabilities),
    context,
    proposal,
    action,
    observation,
    evidence: list(evidence),
    confidence,
    uncertainty,
    error,
    limitation,
    provenance: {
      source: clean(provenance.source),
      ref: clean(provenance.ref),
      parent: provenance.parent ?? null,
      trace: provenance.trace ?? null,
    },
    temporal_validity: {
      discovered_at: temporalValidity.discovered_at ?? null,
      verified_at: temporalValidity.verified_at ?? null,
      expires_at: temporalValidity.expires_at ?? null,
    },
    authority: {
      capability: list(authority.capability ?? capabilities),
      authority: clean(authority.authority, "NONE"),
      breaker: "HUMAN_CONTROLLED",
      can_write: authority.can_write === true,
      can_execute: authority.can_execute === true,
      can_merge: false,
    },
    state: "PROPOSED",
  });
}

export function transitionCognitiveContract(contract, nextState, patch = {}) {
  const current = clean(contract?.state, "PROPOSED").toUpperCase();
  const next = clean(nextState, "").toUpperCase();
  if (!COGNITIVE_STATES.includes(next)) throw new Error(`INVALID_COGNITIVE_STATE:${next}`);
  if (current !== next && !TRANSITIONS[current]?.has(next)) {
    throw new Error(`INVALID_COGNITIVE_TRANSITION:${current}->${next}`);
  }

  return Object.freeze({
    ...contract,
    ...patch,
    authority: {
      ...(contract.authority || {}),
      ...(patch.authority || {}),
      breaker: "HUMAN_CONTROLLED",
      can_merge: false,
    },
    state: next,
  });
}

export function assertCognitiveContract(contract) {
  if (!contract || contract.contract !== COGNITIVE_CONTRACT_VERSION) {
    throw new Error("INVALID_COGNITIVE_CONTRACT");
  }
  if (!contract.identity || !contract.model || !contract.channel) {
    throw new Error("MISSING_IDENTITY_MODEL_CHANNEL");
  }
  if (contract.authority?.breaker !== "HUMAN_CONTROLLED") {
    throw new Error("BREAKER_AUTHORITY_VIOLATION");
  }
  if (contract.authority?.can_merge === true) {
    throw new Error("MERGE_AUTHORITY_VIOLATION");
  }
  if (!COGNITIVE_STATES.includes(contract.state)) {
    throw new Error("INVALID_COGNITIVE_STATE");
  }
  return true;
}

export function contractSummary(contract) {
  assertCognitiveContract(contract);
  return Object.freeze({
    contract: contract.contract,
    identity: contract.identity,
    model: contract.model,
    channel: contract.channel,
    capabilities: [...contract.capabilities],
    state: contract.state,
    evidence_count: contract.evidence.length,
    has_observation: contract.observation != null,
    has_measurement: contract.state === "MEASURED" || contract.state === "VERIFIED",
    breaker: "HUMAN_CONTROLLED",
    can_merge: false,
  });
}
