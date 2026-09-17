#!/usr/bin/env node
/**
 * ACORN CORTEX — COGNITIVE TIME MACHINE & COUNTERFACTUAL REALITY ENGINE
 *
 * One capability inside the existing Cortex. It represents possible futures as
 * immutable, explicitly-assumed worlds and never promotes a possibility to reality.
 *
 * REALITY → HYPOTHESIS → FUTURE WORLDS → MEASURE → FALSIFY → INFORMATION SEEKING
 * → DECISION → REALITY → ERROR → LEARNING → NEXT FUTURE
 *
 * PREDICTION ≠ OBSERVATION
 * COUNTERFACTUAL ≠ REALITY
 * UNKNOWN ≠ PERMITTED
 * CAPABILITY ≠ AUTHORITY
 */
import { createHash } from "node:crypto";

export const COGNITIVE_TIME_MACHINE_VERSION = "acorn.cortex.cognitive-time-machine.v1";
export const WORLD_STATES = Object.freeze([
  "PREDICTED", "COUNTERFACTUAL", "REALIZED", "FALSIFIED", "CONTRADICTED", "UNKNOWN", "EXPIRED",
]);
export const UNKNOWN_STATES = Object.freeze([
  "UNKNOWN-BUT-TESTABLE", "UNKNOWN-BUT-INACCESSIBLE", "UNKNOWN-BUT-CRITICAL",
  "UNKNOWN-BUT-LOW-RISK", "UNKNOWN-BEYOND-CURRENT-MODEL",
]);

const text = (v) => String(v ?? "").trim();
const finite = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const clamp01 = (v) => Math.max(0, Math.min(1, finite(v)));
const cleanObject = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function sortedEntries(object) {
  return Object.entries(cleanObject(object)).sort(([a], [b]) => a.localeCompare(b));
}

function applyDelta(state, delta = {}) {
  const next = { ...cleanObject(state) };
  for (const [key, value] of sortedEntries(delta)) {
    const current = finite(next[key], 0);
    const numeric = Number(value);
    next[key] = Number.isFinite(numeric) ? current + numeric : value;
  }
  return next;
}

export function realityFingerprint(reality = {}) {
  return digest({ state: cleanObject(reality.state), at: text(reality.at), source: text(reality.source) });
}

export function hypothesisFingerprint(hypothesis = {}) {
  return digest({
    question: text(hypothesis.question),
    objective: text(hypothesis.objective),
    assumptions: sortedEntries(hypothesis.assumptions),
  });
}

export function worldFingerprint({ parent = null, hypothesis = {}, transition = {}, kind = "PREDICTED" } = {}) {
  return digest({
    parent,
    hypothesis: hypothesisFingerprint(hypothesis),
    transition: {
      action: text(transition.action),
      delta: sortedEntries(transition.delta),
    },
    kind: text(kind),
  });
}

export function createReality({ state = {}, at = "", source = "unknown" } = {}) {
  return Object.freeze({
    kind: "REALITY",
    fingerprint: realityFingerprint({ state, at, source }),
    state: Object.freeze({ ...cleanObject(state) }),
    at: text(at),
    source: text(source),
  });
}

export function createHypothesis({ question = "", objective = "", assumptions = {} } = {}) {
  const normalized = {
    question: text(question),
    objective: text(objective),
    assumptions: Object.freeze({ ...cleanObject(assumptions) }),
  };
  return Object.freeze({ ...normalized, fingerprint: hypothesisFingerprint(normalized) });
}

export function createWorld({ reality, hypothesis, transition = {}, kind = "PREDICTED", probability = null, utility = null, expiresAt = null } = {}) {
  if (!reality?.fingerprint) throw new Error("REALITY_REQUIRED");
  if (!hypothesis?.fingerprint) throw new Error("HYPOTHESIS_REQUIRED");
  const normalizedTransition = {
    action: text(transition.action || "NO_ACTION"),
    delta: { ...cleanObject(transition.delta) },
  };
  const state = applyDelta(reality.state, normalizedTransition.delta);
  const world = {
    id: worldFingerprint({ parent: reality.fingerprint, hypothesis, transition: normalizedTransition, kind }),
    kind: WORLD_STATES.includes(kind) ? kind : "PREDICTED",
    parent: reality.fingerprint,
    hypothesis: hypothesis.fingerprint,
    assumptions: { ...hypothesis.assumptions },
    transition: normalizedTransition,
    state: { ...state },
    probability: probability === null ? null : clamp01(probability),
    utility: utility === null ? null : finite(utility),
    expires_at: expiresAt === null ? null : text(expiresAt),
    prediction: true,
    observation: false,
    authority_granted: false,
    live: false,
  };
  return Object.freeze(world);
}

export function realizeWorld(world, observation = {}) {
  if (!world?.id) throw new Error("WORLD_REQUIRED");
  return Object.freeze({
    ...world,
    kind: "REALIZED",
    prediction: false,
    observation: true,
    observed_state: { ...cleanObject(observation.state) },
    observed_at: text(observation.at),
    observation_source: text(observation.source || "unknown"),
  });
}

export function falsifyWorld(world, observation = {}) {
  if (!world?.id) throw new Error("WORLD_REQUIRED");
  return Object.freeze({
    ...world,
    kind: "FALSIFIED",
    prediction: true,
    observation: true,
    falsification: {
      reason: text(observation.reason || "OBSERVATION_CONTRADICTS_PREDICTION"),
      observed_state: { ...cleanObject(observation.state) },
      observed_at: text(observation.at),
    },
  });
}

export function compareStates(predicted = {}, observed = {}) {
  const keys = [...new Set([...Object.keys(predicted), ...Object.keys(observed)])].sort();
  const deltas = {};
  let absoluteError = 0;
  for (const key of keys) {
    const p = finite(predicted[key], 0);
    const o = finite(observed[key], 0);
    const delta = o - p;
    deltas[key] = delta;
    absoluteError += Math.abs(delta);
  }
  return {
    absolute_error: absoluteError,
    normalized_error: keys.length ? clamp01(absoluteError / (absoluteError + keys.length)) : 0,
    deltas,
  };
}

export function measurePredictionError(world, observation = {}) {
  const comparison = compareStates(world?.state, observation.state);
  return Object.freeze({
    type: "PREDICTION_ERROR",
    world_id: world?.id ?? null,
    ...comparison,
    measured: observation.measured === true,
    verified: observation.verified === true,
    at: text(observation.at),
  });
}

export function measureCounterfactualError({ counterfactual, actual } = {}) {
  const comparison = compareStates(counterfactual?.state, actual?.state);
  return Object.freeze({
    type: "COUNTERFACTUAL_ERROR",
    world_id: counterfactual?.id ?? null,
    actual_world_id: actual?.id ?? null,
    ...comparison,
    measured: actual?.observation === true,
    verified: actual?.observation === true && actual?.kind === "REALIZED",
  });
}

export function measureDecisionRegret({ selectedUtility = null, realizedUtility = null, bestCounterfactualUtility = null } = {}) {
  const selected = finite(selectedUtility, 0);
  const realized = finite(realizedUtility, selected);
  const best = finite(bestCounterfactualUtility, realized);
  return Object.freeze({
    type: "DECISION_REGRET",
    realized_regret: Math.max(0, best - realized),
    prediction_regret: Math.max(0, selected - realized),
    measured: true,
    verified: true,
  });
}

export function classifyUnknown({ observable = false, testable = false, critical = false, risk = 0, modelCoverage = 0 } = {}) {
  if (observable && modelCoverage >= 1) return "UNKNOWN-BUT-LOW-RISK";
  if (critical) return "UNKNOWN-BUT-CRITICAL";
  if (!observable && testable) return "UNKNOWN-BUT-TESTABLE";
  if (!observable && !testable) return "UNKNOWN-BUT-INACCESSIBLE";
  if (risk >= 0.8 || modelCoverage <= 0.1) return "UNKNOWN-BEYOND-CURRENT-MODEL";
  return "UNKNOWN-BUT-LOW-RISK";
}

export function informationGain(beforeUnknown = [], afterUnknown = []) {
  const before = new Set(beforeUnknown.map(text));
  const after = new Set(afterUnknown.map(text));
  const resolved = [...before].filter((item) => !after.has(item)).length;
  const introduced = [...after].filter((item) => !before.has(item)).length;
  return Object.freeze({
    resolved,
    introduced,
    net_information_gain: resolved - introduced,
    normalized_gain: clamp01((resolved + 1) / (before.size + after.size + 2)),
  });
}

export function selectInformationSeekingExperiment({ candidates = [], unknownSpace = [] } = {}) {
  const unknownCount = Array.isArray(unknownSpace) ? unknownSpace.length : 0;
  const scored = (Array.isArray(candidates) ? candidates : [])
    .map((candidate) => ({
      ...candidate,
      expected_information_gain: clamp01(candidate.expected_information_gain),
      risk: clamp01(candidate.risk),
      reversibility: clamp01(candidate.reversibility),
      observability: clamp01(candidate.observability),
    }))
    .filter((candidate) => candidate.authority_granted !== true)
    .map((candidate) => ({
      ...candidate,
      information_value: clamp01(
        candidate.expected_information_gain * 0.5 +
        candidate.observability * 0.25 +
        candidate.reversibility * 0.15 +
        (1 - candidate.risk) * 0.1,
      ),
      unknown_count: unknownCount,
    }))
    .sort((a, b) => b.information_value - a.information_value || text(a.id).localeCompare(text(b.id)));
  if (!scored.length) return { status: "NO_SAFE_EXPERIMENT", experiment: null };
  return { status: "SELECTED", experiment: scored[0] };
}

export function runCausalIntervention({ baseline, intervention, outcome } = {}) {
  if (!baseline?.state || !intervention?.delta || !outcome?.state) {
    return { status: "CAUSAL_INCONCLUSIVE", reason: "INTERVENTION_BASELINE_OUTCOME_REQUIRED" };
  }
  const baselineOutcome = compareStates(baseline.state, outcome.baseline_state || baseline.state);
  const interventionOutcome = compareStates(intervention.delta, outcome.state);
  const effect = compareStates(outcome.baseline_state || baseline.state, outcome.state);
  const measured = outcome.measured === true && outcome.verified === true;
  return Object.freeze({
    status: measured ? "CAUSAL_MEASURED" : "CAUSAL_INCONCLUSIVE",
    intervention_id: text(intervention.id),
    baseline_error: baselineOutcome.normalized_error,
    intervention_error: interventionOutcome.normalized_error,
    effect,
    measured,
    verified: measured,
    observation_is_not_causality: !measured,
  });
}

export function buildWorldLineage({ reality, worlds = [] } = {}) {
  const nodes = [
    {
      id: reality?.fingerprint ?? null,
      kind: "REALITY",
      parent: null,
      prediction: false,
      observation: true,
    },
    ...(Array.isArray(worlds) ? worlds : []).map((world) => ({
      id: world.id,
      kind: world.kind,
      parent: world.parent,
      prediction: world.prediction,
      observation: world.observation,
    })),
  ];
  const lineage = digest(nodes);
  return Object.freeze({ version: "acorn.world-lineage.v1", nodes, lineage, append_only: true });
}

export function compareWorlds({ predicted = [], realized = null } = {}) {
  const actual = realized?.state ?? {};
  const comparisons = (Array.isArray(predicted) ? predicted : []).map((world) => ({
    world_id: world.id,
    kind: world.kind,
    error: compareStates(world.state, actual),
    utility: world.utility,
  }));
  return Object.freeze({ comparisons, actual_world_id: realized?.id ?? null });
}

export function expireWorld(world, now = "") {
  if (!world) return { kind: "EXPIRED", reason: "MISSING_WORLD" };
  if (world.expires_at && text(now) >= world.expires_at) {
    return Object.freeze({ ...world, kind: "EXPIRED", expired: true, reason: "WORLD_EXPIRY" });
  }
  return Object.freeze({ ...world, expired: false });
}

export function runCognitiveTimeMachineCycle(input = {}) {
  const reality = createReality(input.reality ?? {});
  const hypothesis = createHypothesis(input.hypothesis ?? {});
  const transitions = Array.isArray(input.futures) ? input.futures : [];
  const worlds = transitions.map((transition) => createWorld({
    reality,
    hypothesis,
    transition,
    kind: transition.kind || "PREDICTED",
    probability: transition.probability,
    utility: transition.utility,
    expiresAt: transition.expires_at,
  }));

  const realized = input.observation?.state
    ? realizeWorld(worlds.find((world) => world.id === input.realized_world_id) || worlds[0] || createWorld({ reality, hypothesis }), input.observation)
    : null;
  const errors = realized ? worlds.map((world) => measurePredictionError(world, input.observation)) : [];
  const actual = realized ? worlds.find((world) => world.id === realized.id) || realized : null;
  const counterfactuals = worlds.filter((world) => world.id !== realized?.id).map((world) => measureCounterfactualError({ counterfactual: world, actual: realized }));
  const unknownSpace = (Array.isArray(input.unknown_space) ? input.unknown_space : []).map((item) => ({
    ...item,
    classification: item.classification || classifyUnknown(item),
  }));
  const experiment = selectInformationSeekingExperiment({ candidates: input.experiments, unknownSpace });
  const lineage = buildWorldLineage({ reality, worlds: realized ? [...worlds, realized] : worlds });
  const invariant = assertCognitiveTimeMachineInvariant({ reality, hypothesis, worlds, lineage });

  return Object.freeze({
    version: COGNITIVE_TIME_MACHINE_VERSION,
    status: invariant.status,
    reality,
    hypothesis,
    worlds,
    realized,
    prediction_errors: errors,
    counterfactual_errors: counterfactuals,
    comparison: compareWorlds({ predicted: worlds, realized }),
    unknown_space: unknownSpace,
    information_seeking: experiment,
    lineage,
    invariant,
    memory: {
      possible_worlds: worlds.map((world) => world.id),
      falsified_worlds: worlds.filter((world) => world.kind === "FALSIFIED").map((world) => world.id),
      unrealized_worlds: worlds.filter((world) => !realized || world.id !== realized.id).map((world) => world.id),
      unknown_space: unknownSpace.map((item) => item.classification),
    },
    authority: "carl",
    authority_granted: false,
    breaker_bypass: false,
    auto_merge: false,
    live: false,
  });
}

export function assertCognitiveTimeMachineInvariant(result = {}) {
  const violations = [];
  if (result.reality?.kind !== "REALITY") violations.push("REALITY_REQUIRED");
  if (!result.hypothesis?.fingerprint) violations.push("HYPOTHESIS_REQUIRED");
  if (result.lineage?.append_only !== true) violations.push("LINEAGE_NOT_APPEND_ONLY");
  if (result.authority !== "carl") violations.push("AUTHORITY_NOT_CARL");
  if (result.authority_granted !== false) violations.push("AUTHORITY_GRANT");
  if (result.breaker_bypass !== false) violations.push("BREAKER_BYPASS");
  if (result.auto_merge !== false) violations.push("AUTO_MERGE");
  if (result.live !== false) violations.push("FAKE_LIVE");
  for (const world of result.worlds || []) {
    if (world.prediction !== true) violations.push(`${world.id}:PREDICTION_FLAG`);
    if (world.kind === "REALITY") violations.push(`${world.id}:WORLD_REALITY_CONFUSION`);
    if (world.authority_granted !== false) violations.push(`${world.id}:AUTHORITY`);
  }
  if (result.realized?.kind === "REALIZED" && result.realized.prediction !== false) violations.push("REALIZED_PREDICTION_CONFUSION");
  return Object.freeze({ status: violations.length ? "BLOCKED" : "VERIFIED", violations });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runCognitiveTimeMachineCycle({
    reality: { state: { energy: 10, capacity: 5 }, at: "cycle-1", source: "measured" },
    hypothesis: { question: "Which path improves capacity?", objective: "learn", assumptions: { environment: "bounded" } },
    futures: [
      { id: "future-a", action: "conservative", delta: { capacity: 1 }, probability: .5, utility: 6 },
      { id: "future-b", action: "experimental", delta: { capacity: 3 }, probability: .3, utility: 8 },
      { id: "future-c", action: "noop", delta: { capacity: 0 }, probability: .2, utility: 4 },
    ],
    observation: { state: { energy: 9, capacity: 6 }, at: "cycle-1-observed", source: "measured" },
    evidence: { measured: true, verified: true },
    unknown_space: [{ id: "u1", testable: true, observable: true, critical: false, risk: .2, modelCoverage: .4 }],
    experiments: [{ id: "probe-capacity", expected_information_gain: .9, risk: .1, reversibility: 1, observability: 1 }],
  });
  console.log(JSON.stringify({
    version: result.version,
    status: result.status,
    worlds: result.worlds.length,
    realized: result.realized?.id ?? null,
    prediction_errors: result.prediction_errors,
    information_seeking: result.information_seeking,
    lineage: result.lineage.lineage,
    invariant: result.invariant,
    authority_granted: result.authority_granted,
    live: result.live,
  }, null, 2));
}
