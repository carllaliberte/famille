#!/usr/bin/env node
/**
 * ACORN — GOVERNABLE CONTINUITY OF COGNITIVE TRANSFORMATION
 *
 * Cross-organ substrate over the existing Constitution, Cortex, Defense,
 * Auto-Evolution, Governor, Reality Fabric, Memory, Ecology and Runtime.
 *
 * This is not a second architecture. It is the shared transformation spine:
 * STATE -> TRANSFORMATION -> NEW STATE -> CONSEQUENCE -> LEARNING -> CONTINUITY.
 *
 * Fundamental separations:
 * CAPABILITY !== AUTHORITY
 * OBSERVATION !== CAUSALITY
 * PREDICTION !== REALITY
 * EFFECT !== CONSEQUENCE
 * MEMORY !== TRUTH
 * EVOLUTION !== SELF-AUTHORITY
 * UNKNOWN !== SAFE
 *
 * CARL controls the BREAKER.
 * The BREAKER does not control CARL.
 * ACORN controls neither CARL nor the BREAKER.
 */

export const GOVERNABLE_CONTINUITY_VERSION = "acorn.governable-continuity.v1";
export const HIERARCHY = Object.freeze(["CARL", "BREAKER", "ACORN", "CORTEX", "RESOURCES"]);
export const EPISTEMIC = Object.freeze(["UNOBSERVED", "ASSERTED", "OBSERVED", "MEASURED", "REPRODUCED", "VERIFIED", "CONTRADICTORY", "UNKNOWN"]);
export const TRANSFORMATION_STATES = Object.freeze(["PROPOSED", "EXECUTING", "OBSERVED", "MEASURED", "VERIFIED", "REJECTED", "REVERTED", "UNKNOWN"]);
export const REVERSIBILITY = Object.freeze(["REVERSIBLE", "PARTIAL", "IRREVERSIBLE", "UNKNOWN"]);

const text = (v) => String(v ?? "").trim();
const list = (v) => Array.isArray(v) ? v : [];
const finite = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((k) => [k, stable(value[k])]));
  return value;
}

function digest(value) {
  const raw = JSON.stringify(stable(value));
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function continuityConstitution() {
  return {
    version: GOVERNABLE_CONTINUITY_VERSION,
    hierarchy: [...HIERARCHY],
    one_acorn: true,
    one_cortex: true,
    one_runtime: true,
    one_defense: true,
    one_fabric: true,
    cross_organ_spine: true,
    cortex_internal_to_acorn: true,
    capability_is_not_authority: true,
    observation_is_not_causality: true,
    prediction_is_not_reality: true,
    memory_is_not_truth: true,
    evolution_is_not_self_authority: true,
    unknown_is_not_safe: true,
    carl_controls_breaker: true,
    breaker_controls_carl: false,
    acorn_controls_carl: false,
    acorn_controls_breaker: false,
    auto_merge: false,
    live: false,
  };
}

export function normalizeState(input = {}) {
  return {
    id: text(input.id) || "unknown-state",
    at: input.at || new Date().toISOString(),
    context: input.context ?? null,
    entities: list(input.entities),
    capabilities: list(input.capabilities),
    behaviors: list(input.behaviors),
    observations: list(input.observations),
    evidence: input.evidence ?? null,
    authority: false,
    control: input.control ?? "UNKNOWN",
    observability: input.observability ?? "UNKNOWN",
    reversibility: input.reversibility ?? "UNKNOWN",
    epistemic: EPISTEMIC.includes(input.epistemic) ? input.epistemic : "UNKNOWN",
    consequences: list(input.consequences),
    provenance: input.provenance ?? null,
  };
}

export function capabilityEnvelope({ capability = 0, authority = 0, autonomy = 0, control = 0, observability = 0, reversibility = "UNKNOWN" } = {}) {
  return {
    capability: Math.max(0, finite(capability)),
    authority: Math.max(0, finite(authority)),
    autonomy: Math.max(0, finite(autonomy)),
    control: Math.max(0, Math.min(1, finite(control))),
    observability: Math.max(0, Math.min(1, finite(observability))),
    reversibility: REVERSIBILITY.includes(reversibility) ? reversibility : "UNKNOWN",
    capability_authority_gap: Math.max(0, finite(capability) - finite(authority)),
    capability_does_not_grant_authority: true,
    authority_growth_requires_human_authority: true,
    live: false,
  };
}

export function trajectory({ previous = [], current = [], at = new Date().toISOString() } = {}) {
  const prev = list(previous);
  const now = list(current);
  const prevScore = prev.length ? prev.reduce((n, row) => n + finite(row.value ?? row.score), 0) / prev.length : 0;
  const nowScore = now.length ? now.reduce((n, row) => n + finite(row.value ?? row.score), 0) / now.length : 0;
  const delta = nowScore - prevScore;
  const previousDelta = prev.length > 1
    ? prev[prev.length - 1].value - prev[prev.length - 2].value
    : 0;
  const acceleration = delta - previousDelta;
  return {
    at,
    previous: prevScore,
    current: nowScore,
    delta,
    acceleration,
    direction: delta > 0 ? "GROWING" : delta < 0 ? "DECLINING" : "STABLE",
    phase_change_signal: Math.abs(acceleration) > Math.max(0.5, Math.abs(delta) * 2),
    evidence_required: true,
    prediction_is_not_observation: true,
    live: false,
  };
}

export function transformation({
  id,
  before,
  proposed = null,
  actor = "unknown",
  capability = {},
  authority = {},
  control = {},
  reversibility = "UNKNOWN",
  action = null,
  evidence = {},
  intervention = null,
  counterfactual = null,
  at = new Date().toISOString(),
} = {}) {
  const from = normalizeState(before || {});
  const executed = evidence.executed === true;
  const measured = evidence.measured === true;
  const verified = evidence.verified === true && executed && measured;
  const status = verified ? "VERIFIED" : measured ? "MEASURED" : executed ? "OBSERVED" : proposed ? "PROPOSED" : "UNKNOWN";
  return {
    id: text(id) || `tx-${digest({ from, proposed, actor, at })}`,
    at,
    actor: text(actor) || "unknown",
    before: from,
    proposed: proposed ?? null,
    action: action ?? null,
    after: evidence.after ?? null,
    capability: capabilityEnvelope(capability),
    authority: { ...authority, authority: false, human_authority: authority.human_authority === true ? "carl" : null },
    control: { ...control, preserved: finite(control.after, 0) >= finite(control.before, 0) },
    reversibility: REVERSIBILITY.includes(reversibility) ? reversibility : "UNKNOWN",
    intervention: intervention ?? null,
    counterfactual: counterfactual ?? null,
    causality: intervention && counterfactual && verified ? "CANDIDATE" : "INCONCLUSIVE",
    epistemic: status,
    executed,
    measured,
    verified,
    live: false,
  };
}

export function effectAndConsequence({
  transformation: tx,
  effects = [],
  consequences = [],
  dependencies = [],
  blastRadius = 0,
} = {}) {
  const verified = tx?.verified === true;
  const rows = list(effects).map((effect) => ({
    kind: "EFFECT",
    value: effect,
    provenance: tx?.id || null,
    observed: verified,
  }));
  const consequenceRows = list(consequences).map((consequence) => ({
    kind: "CONSEQUENCE",
    value: consequence,
    derived_from: rows.map((r) => r.value),
    causal_status: "INCONCLUSIVE",
  }));
  return {
    effects: rows,
    consequences: consequenceRows,
    dependencies: list(dependencies),
    blast_radius: Math.max(0, finite(blastRadius)),
    effect_is_not_consequence: true,
    consequence_requires_evidence: true,
    verified_effects: rows.filter((r) => r.observed).length,
    live: false,
  };
}

export function controlContinuity({
  capability = 0,
  observability = 0,
  control = 0,
  reversibility = "UNKNOWN",
  interruptible = false,
  replaceable = false,
  auditable = false,
} = {}) {
  const reverseRisk = reversibility === "UNKNOWN" ? 1 : reversibility === "IRREVERSIBLE" ? 1 : reversibility === "PARTIAL" ? 0.5 : 0;
  const gap = Math.max(0, Math.min(1,
    finite(capability) * 0.35
      + (1 - Math.max(0, Math.min(1, finite(observability)))) * 0.2
      + (1 - Math.max(0, Math.min(1, finite(control)))) * 0.2
      + reverseRisk * 0.1
      + (interruptible ? 0 : 0.075)
      + (replaceable ? 0 : 0.05)
      + (auditable ? 0 : 0.025),
  ));
  return {
    gap,
    status: gap >= 0.7 ? "HIGH" : gap >= 0.4 ? "MEDIUM" : "LOW",
    observable: observability > 0,
    controllable: control > 0,
    interruptible,
    replaceable,
    auditable,
    unknown_is_not_permitted: true,
    loss_of_control_is_not_success: gap >= 0.7,
    live: false,
  };
}

export function continuityEvent({
  type,
  source,
  subject,
  before,
  after,
  evidence,
  transformationId,
  consequence,
  at = new Date().toISOString(),
} = {}) {
  const event = {
    id: `evt-${digest({ type, source, subject, at, transformationId })}`,
    type: text(type) || "UNKNOWN",
    source: text(source) || "unknown",
    subject: text(subject) || "unknown",
    at,
    before: before ?? null,
    after: after ?? null,
    evidence: evidence ?? null,
    transformation_id: transformationId ?? null,
    consequence: consequence ?? null,
    provenance_complete: Boolean(source && subject && at),
    assertion_is_not_evidence: true,
    evidence_is_not_causality: true,
    live: false,
  };
  return event;
}

export function continuityLedger({ events = [], previousDigest = null } = {}) {
  const rows = list(events);
  let previous = previousDigest;
  const sealed = rows.map((event, index) => {
    const record = { sequence: index + 1, previous_digest: previous, event };
    const digestValue = digest(record);
    previous = digestValue;
    return { ...record, digest: digestValue };
  });
  return {
    events: sealed,
    head: previous,
    append_only: true,
    history_rewrite: false,
    previous_digest_required: true,
    live: false,
  };
}

export function continuityOfOrgan({
  constitution = null,
  cortex = null,
  defense = null,
  evolution = null,
  governor = null,
  reality = null,
  memory = null,
  ecology = null,
  runtime = null,
  previousState = null,
  currentState = null,
  events = [],
} = {}) {
  const organs = { constitution, cortex, defense, evolution, governor, reality, memory, ecology, runtime };
  const presence = Object.fromEntries(Object.entries(organs).map(([name, value]) => [name, value != null]));
  const violations = [];
  if (constitution?.hierarchy && JSON.stringify(constitution.hierarchy) !== JSON.stringify(HIERARCHY)) violations.push("HIERARCHY_MISMATCH");
  if (constitution?.carl_controls_breaker === false) violations.push("BREAKER_AUTHORITY_MISMATCH");
  if (cortex?.second_cortex === true) violations.push("SECOND_CORTEX");
  if (defense?.second_security_layer === true) violations.push("SECOND_DEFENSE");
  if (runtime?.second_runtime === true) violations.push("SECOND_RUNTIME");
  if (reality?.second_fabric === true) violations.push("SECOND_FABRIC");
  if (organs.cortex?.authority === true) violations.push("CORTEX_AUTHORITY");
  const before = normalizeState(previousState || { id: "previous" });
  const after = normalizeState(currentState || { id: "current" });
  const trajectorySignal = trajectory({
    previous: [{ value: before.capabilities.length }],
    current: [{ value: after.capabilities.length }],
  });
  const ledger = continuityLedger({ events });
  const control = controlContinuity({
    capability: after.capabilities.length > 0 ? Math.min(1, after.capabilities.length / 100) : 0,
    observability: after.observability === "VERIFIED" ? 1 : after.observability === "DIRECT" ? 0.75 : 0.25,
    control: after.control === "VERIFIED" ? 1 : after.control === "DIRECT" ? 0.75 : 0.25,
    reversibility: after.reversibility,
    interruptible: Boolean(defense?.defense_may_block_operations),
    replaceable: Boolean(runtime?.replaceable || organs.memory?.replaceable),
    auditable: Boolean(reality?.digest || organs.memory?.provenance),
  });
  return {
    version: GOVERNABLE_CONTINUITY_VERSION,
    constitution: continuityConstitution(),
    organs: presence,
    violations,
    status: violations.length ? "FAILED" : "INTEGRATED",
    state_transition: { before, after },
    trajectory: trajectorySignal,
    control_continuity: control,
    ledger,
    event_count: ledger.events.length,
    continuity_preserved: violations.length === 0,
    authority: "carl",
    auto_merge: false,
    live: false,
  };
}

export function assertGovernableContinuityInvariant({ state } = {}) {
  const violations = [];
  const s = state || {};
  if (s.constitution?.hierarchy?.join(">") !== HIERARCHY.join(">")) violations.push("HIERARCHY");
  if (s.constitution?.carl_controls_breaker !== true) violations.push("CARL_BREAKER");
  if (s.constitution?.breaker_controls_carl !== false) violations.push("BREAKER_CARL");
  if (s.constitution?.acorn_controls_carl !== false) violations.push("ACORN_CARL");
  if (s.constitution?.acorn_controls_breaker !== false) violations.push("ACORN_BREAKER");
  if (s.constitution?.capability_is_not_authority !== true) violations.push("CAPABILITY_AUTHORITY");
  if (s.constitution?.one_cortex !== true || s.constitution?.one_runtime !== true || s.constitution?.one_defense !== true) violations.push("SINGLE_ORGANISM");
  if (s.constitution?.evolution_is_not_self_authority !== true) violations.push("EVOLUTION_AUTHORITY");
  if (s.constitution?.unknown_is_not_safe !== true) violations.push("UNKNOWN_SAFE");
  return {
    ok: violations.length === 0,
    status: violations.length ? "FAILED" : "VERIFIED",
    violations,
    live: false,
    auto_merge: false,
  };
}
