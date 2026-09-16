#!/usr/bin/env node
/**
 * ACORN CORTEX — cognitive world model. A Cortex capability, not a second brain.
 * WORLD MODEL ≠ WORLD. INFERENCE ≠ OBSERVATION. PREDICTION ≠ FACT.
 * GENOME = how Acorn is structured. WORLD MODEL = what Acorn currently knows.
 * live=false.
 */
import { authorizeCapability } from "../.github/swarm/cortex.mjs";
import {
  contributeKnowledge,
  detectContradiction,
  simulateOrganism,
} from "./cortex-organism.mjs";
import { unknownSpace, valueOfInformation } from "./cortex-ecosystem.mjs";
import { whatIf, timeMachine, cognitiveSelfModel } from "./cortex-meta.mjs";
import { appendEvent } from "./cortex-continuity.mjs";
import { staleKnowledge, runEternalArchitecture } from "./cortex-eternal.mjs";
import { learnFromExperience } from "./reality-learning-engine.mjs";

export const WORLD_VERSION = "cortex-world.v1";
export const ENTITY_TYPES = Object.freeze([
  "Entity", "Intelligence", "Human", "Organization", "System", "Service",
  "Tool", "Device", "Location", "Resource", "Protocol", "Language",
  "Concept", "Event", "Task", "Capability", "Artifact", "Environment", "Dependency",
]);
export const SLOTS = Object.freeze([
  "OBSERVED", "INFERRED", "HYPOTHESIZED", "PREDICTED", "UNKNOWN",
]);
export const RELATIONS = Object.freeze([
  "DEPENDS_ON", "USES", "PROVIDES", "CALLS", "IMPLEMENTS", "REPLACES",
  "CONFLICTS_WITH", "VERIFIES", "OBSERVES", "GENERATES", "CONSUMES",
  "DERIVES_FROM", "CONNECTED_TO", "UNKNOWN_RELATION",
]);

function digest(value) {
  const raw = JSON.stringify(value ?? null);
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) h = Math.imul(h ^ raw.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function describeEntity({
  id, type = "Entity", properties = {}, state = "UNKNOWN", at,
} = {}) {
  const kind = ENTITY_TYPES.includes(type) ? type : "Entity";
  return {
    identity: id || `ent_${digest({ kind, properties })}`,
    type: kind,
    properties,
    state,
    provenance: { source: "world-model", invented: false },
    last_observed: null,
    last_verified: null,
    expires_at: null,
    live: false,
  };
}

export function slotObservation({ kind = "UNKNOWN", fact, at, evidence } = {}) {
  const k = SLOTS.includes(kind) ? kind : "UNKNOWN";
  return {
    status: "EXECUTED",
    kind: k,
    fact: fact ?? null,
    at: at || new Date().toISOString(),
    evidence: evidence ?? null,
    promoted: false,
    live: false,
  };
}

export function stateAt({ entity, timeline = [], at } = {}) {
  const t = Date.parse(at || new Date().toISOString());
  const past = (timeline || []).filter((row) => Date.parse(row.at || "") <= t);
  const latest = past[past.length - 1] || null;
  return {
    status: latest ? "EXECUTED" : "UNKNOWN",
    at: at || null,
    entity: entity?.identity || entity || null,
    state: latest?.state || "UNKNOWN",
    known_then: Boolean(latest),
    true_then: null,
    live: false,
  };
}

export function relate({
  from, to, kind = "UNKNOWN_RELATION", confidence = "unscored", at,
} = {}) {
  if (!from || !to) return { status: "INSUFFICIENT_EVIDENCE", relation: null, live: false };
  const typed = RELATIONS.includes(kind) ? kind : "UNKNOWN_RELATION";
  return {
    status: "PROPOSED",
    relation: {
      relation_id: `rel_${digest({ from, to, typed })}`,
      from, to, kind: typed,
      confidence,
      at: at || new Date().toISOString(),
      verified: false,
      live: false,
    },
    live: false,
  };
}

export function impactOfFailure({ lost, graph = [] } = {}) {
  const broken = (graph || []).filter((row) => row.kind === "DEPENDS_ON" && row.to === lost).map((row) => row.from);
  return {
    status: "EXECUTED",
    lost,
    breaks: broken,
    can_continue: broken.length === 0,
    replacement: null,
    live: false,
  };
}

export function detectChange({ before, after } = {}) {
  const changed = digest(before) !== digest(after);
  return {
    status: changed ? "EXECUTED" : "UNCHANGED",
    changed,
    kind: changed ? "BEHAVIOR_CHANGED" : null,
    revalidate: changed,
    live: false,
  };
}

export function distinguishStates({ reality, observed, model, predicted } = {}) {
  return {
    status: "EXECUTED",
    reality: reality ?? null,
    observed: observed ?? null,
    model: model ?? null,
    predicted: predicted ?? null,
    diverged: digest({ reality, observed }) !== digest({ model, predicted }),
    model_is_not_world: true,
    live: false,
  };
}

export function consensusOf(observations = []) {
  const contradiction = detectContradiction(observations);
  return {
    status: contradiction.conflicts.length ? "DISAGREEMENT" : observations.length ? "CONSENSUS" : "INSUFFICIENT_EVIDENCE",
    sources: observations.length,
    independent: false,
    three_models_are_not_three_proofs: true,
    truth: false,
    live: false,
  };
}

export function digitalTwin({ cortex } = {}) {
  const sim = simulateOrganism({ expected: cortex || { cortex: true } }, { actual: null });
  return {
    status: "DEFINED",
    twin: {
      cortex: true,
      fabric: true,
      intelligences: true,
      channels: true,
      continuity: true,
    },
    is_live_system: false,
    simulation: sim,
    live: false,
  };
}

export function worldImmune({ observation, live_claim = false, authority_claim = false } = {}) {
  const findings = [];
  if (live_claim) findings.push({ kind: "fake_presence" });
  if (authority_claim) findings.push({ kind: "authority_injection" });
  if (observation?.invented === true) findings.push({ kind: "poisoned_observation" });
  return { status: "EXECUTED", findings, quarantined: findings.length > 0, live: false };
}

export function runWorldModel(input = {}) {
  const at = input.at || new Date().toISOString();
  const service = describeEntity({ id: "service-x", type: "Service", state: "UNKNOWN" });
  const observed = slotObservation({
    kind: "OBSERVED",
    fact: { service: service.identity, responded: true },
    at,
    evidence: input.workerEvidence || { v: "drill" },
  });
  const inferred = slotObservation({ kind: "INFERRED", fact: { available: true }, at });
  const predicted = slotObservation({ kind: "PREDICTED", fact: { available_tomorrow: true }, at });
  const unknown = slotObservation({ kind: "UNKNOWN", fact: { indefinitely: null }, at });
  const knowledge = contributeKnowledge({
    who: "worker", what: observed.fact, when: at, channel: "worker", evidence: observed.evidence,
  });
  const timeline = [
    { at: "2026-09-16T22:00:00.000Z", state: "UNKNOWN" },
    { at, state: "RESPONSIVE" },
  ];
  const past = stateAt({ entity: service, timeline, at: "2026-09-16T22:00:00.000Z" });
  const now = stateAt({ entity: service, timeline, at });
  const rel = relate({ from: "worker", to: "github-actions", kind: "DEPENDS_ON" });
  const impact = impactOfFailure({ lost: "github-actions", graph: [rel.relation].filter(Boolean) });
  const space = unknownSpace([{ what: "indefinite availability", evidence: null }]);
  const voi = valueOfInformation({ unknown: { region: "UNOBSERVED" }, cost: 0, expected_reduction: 1 });
  const events = appendEvent([], { type: "OBSERVATION_RECEIVED", payload: observed.fact, at });
  const change = detectChange({ before: { available: false }, after: { available: true } });
  const states = distinguishStates({
    reality: null,
    observed: observed.fact,
    model: inferred.fact,
    predicted: predicted.fact,
  });
  const branches = [
    { id: "A", hypothesis: "service stays up", evidence: observed.evidence },
    { id: "B", hypothesis: "service is flaky", evidence: null },
  ];
  const cf = whatIf({ question: "what if service-x failed", snapshot: { at, evidence: observed } });
  const knew = timeMachine({ at: "2026-09-16T22:00:00.000Z", snapshot: { at: "2026-09-16T22:00:00.000Z", state: "UNKNOWN" } });
  const self = cognitiveSelfModel({ workerEvidence: input.workerEvidence || {}, memory: [] });
  const twin = digitalTwin({ cortex: { version: WORLD_VERSION } });
  const agree = consensusOf([
    knowledge.ok ? knowledge.entry : { what: "up", kind: "observation", channel: "a", context: "svc" },
    { what: "down", kind: "observation", channel: "b", context: "svc" },
  ]);
  const stale = staleKnowledge({ expires_at: "2020-01-01T00:00:00.000Z", verified_at: "2019-01-01T00:00:00.000Z" }, { now: at });
  const immune = worldImmune({ observation: { invented: false }, live_claim: false });
  const learned = learnFromExperience({
    hypothesis: { kind: "world", id: "service-available" },
    expected: { available: true },
    actual: { available: Boolean(input.workerEvidence?.v), adopted: false },
    context: { engine: "cortex-world" },
    observedAt: at,
    model: { version: 1 },
    verification: { verified: false },
  });
  const eternal = input.skipEternal ? null : runEternalArchitecture({
    workerEvidence: input.workerEvidence || {},
    skipContinuity: true,
    at,
  });
  const merge = authorizeCapability({ capabilities: ["merge"], allowed: false, authority: "network" });
  return {
    version: WORLD_VERSION,
    status: "EXECUTED",
    entity: service,
    observed,
    inferred,
    predicted,
    unknown,
    knowledge,
    past,
    now,
    relation: rel,
    impact,
    space,
    voi,
    events,
    change,
    states,
    branches,
    counterfactual: cf,
    knew,
    self,
    twin,
    consensus: agree,
    stale,
    immune,
    learned: { status: learned.status, live: false },
    eternal,
    gates: {
      merge: merge.ok,
      model_is_world: states.model_is_not_world === false,
      inferred_is_observed: inferred.kind === "OBSERVED",
      predicted_is_fact: predicted.kind !== "PREDICTED",
      twin_is_live: twin.is_live_system === true,
      counterfactual_is_observation: cf.observed_reality === true,
      three_proofs: agree.three_models_are_not_three_proofs === false,
      stale_is_false: stale.automatically_false === true,
      second_cortex: false,
    },
    model_is_not_world: true,
    genome_is_not_world: true,
    zero_cost: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}
