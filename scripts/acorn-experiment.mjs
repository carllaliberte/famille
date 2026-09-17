#!/usr/bin/env node
/**
 * ACORN EXPERIMENT ENGINE — emergence, causality, adversarial cognition, diversity, loops.
 *
 * behavior(A+B) is never assumed equal to behavior(A)+behavior(B).
 * Consensus ≠ truth ≠ authority.
 * Winning a debate grants no extra authority.
 * Metacognition is INTERNAL to the existing Cortex. Not a second Cortex.
 * live=false.
 */
import { authorizeCapability } from "../.github/swarm/cortex.mjs";
import { independenceGraph, detectCollusion, unknownSpace } from "./cortex-ecosystem.mjs";
import { cognitiveSelfModel, selfDiagnostic, representUnknown } from "./cortex-meta.mjs";
import { claimCausality } from "./acorn-epistemic.mjs";
import { detectTrajectorySignals } from "./acorn-governability.mjs";

export const EXPERIMENT_VERSION = "acorn.experiment.v1";
export const ADVERSARIAL_MOVES = Object.freeze([
  "CHALLENGE", "FALSIFY", "CRITIQUE", "REPRODUCE", "INDEPENDENTLY_VERIFY",
]);

const text = (v) => String(v ?? "").trim();
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function compositionExperiment({ a = {}, b = {}, composition = {}, measured = false } = {}) {
  const sum = num(a.capability) + num(b.capability);
  const combo = composition.capability;
  const comboKnown = combo != null && Number.isFinite(Number(combo));
  const emergentCap = measured === true && comboKnown && Number(combo) !== sum;
  const emergentRisk = measured === true && num(composition.risk) > num(a.risk) + num(b.risk);
  return {
    assumed_additive: false,
    measured,
    emergent_capability: emergentCap,
    emergent_risk: emergentRisk,
    unexpected_behavior: measured === true && composition.unexpected === true,
    interaction_amplification: measured === true && num(composition.amplification) > 1,
    feedback_loops: composition.feedback === true,
    common_mode_failures: composition.common_mode === true,
    status: measured === true ? "MEASURED" : "INCONCLUSIVE",
    additive_assumption_rejected: true,
    live: false,
  };
}

export function causalExperiment({
  intervention = false, control = false, counterfactual = false, outcome = null, uncertainty = "UNKNOWN",
} = {}) {
  return claimCausality({ intervention, control, counterfactual, outcome, uncertainty });
}

export function adversarialCognition({
  claim, challenger = "critic", falsifier = "falsifier", verifier = "verifier",
  reproduced = false, independently_verified = false, winner = null,
} = {}) {
  const moves = ADVERSARIAL_MOVES.map((move) => ({
    move,
    actor: move === "CHALLENGE" ? challenger : move === "FALSIFY" ? falsifier : verifier,
    authority_gained: 0,
  }));
  const merge = authorizeCapability({ capabilities: ["merge"], allowed: winner != null, authority: winner || "network" });
  return {
    claim: claim ?? null,
    moves,
    reproduced,
    independently_verified,
    winner: winner || null,
    extra_authority: 0,
    winner_is_not_sovereign: true,
    merge_authorized: merge.ok,
    live: false,
  };
}

export function cognitiveDiversity({ intelligences = [] } = {}) {
  const families = new Map();
  const providers = new Map();
  const strategies = new Map();
  const data = new Map();
  const impl = new Map();
  const channels = new Map();
  const infra = new Map();
  const bump = (map, key) => map.set(key, (map.get(key) || 0) + 1);
  for (const row of intelligences) {
    bump(families, row.model_family || "UNKNOWN");
    bump(providers, row.provider || "UNKNOWN");
    bump(strategies, row.reasoning_strategy || "UNKNOWN");
    bump(data, row.data_source || "UNKNOWN");
    bump(impl, row.implementation || "UNKNOWN");
    bump(channels, row.execution_channel || "UNKNOWN");
    bump(infra, row.infrastructure || "UNKNOWN");
  }
  const sharedError = [...families.values(), ...providers.values()].some((n) => n >= 2);
  const graph = independenceGraph(
    intelligences.map((r) => ({ id: r.id, kind: "llm", capabilities: ["review"] })),
    [],
  );
  const collusion = detectCollusion({
    answers: intelligences.map((r) => ({ what: r.answer || "same" })),
    graph,
  });
  return {
    counts: {
      model_family: Object.fromEntries(families),
      provider: Object.fromEntries(providers),
      reasoning_strategy: Object.fromEntries(strategies),
      data_source: Object.fromEntries(data),
      implementation: Object.fromEntries(impl),
      execution_channel: Object.fromEntries(channels),
      infrastructure: Object.fromEntries(infra),
    },
    shared_error_source: sharedError,
    consensus_is_not_truth: true,
    correlated: collusion.correlated_reasoning === true,
    live: false,
  };
}

export function selfReinforcementLoop({ edges = [] } = {}) {
  const adj = new Map();
  for (const e of edges) {
    const from = text(e.from);
    const to = text(e.to);
    if (!adj.has(from)) adj.set(from, []);
    adj.get(from).push(to);
  }
  const cycles = [];
  const stack = [];
  const seen = new Set();
  function dfs(node, path) {
    if (path.includes(node)) {
      cycles.push([...path.slice(path.indexOf(node)), node]);
      return;
    }
    if (seen.has(node)) return;
    seen.add(node);
    path.push(node);
    for (const next of adj.get(node) || []) dfs(next, path);
    path.pop();
  }
  for (const node of adj.keys()) dfs(node, stack);
  const predictionLoop = edges.some((e) => e.from === "prediction" && e.to === "action")
    && edges.some((e) => e.from === "action" && e.to === "observation")
    && edges.some((e) => e.from === "learning" && e.to === "prediction");
  return {
    cycles,
    loop_depth: cycles.reduce((m, c) => Math.max(m, c.length - 1), 0),
    loop_frequency: cycles.length,
    gain: edges.reduce((s, e) => s + num(e.gain), 0),
    amplification: edges.some((e) => num(e.gain) > 1),
    stability: cycles.length === 0 ? 1 : 1 / cycles.length,
    external_effect: edges.some((e) => e.external === true),
    reversibility: edges.every((e) => e.reversible !== false),
    prediction_action_learning_loop: predictionLoop,
    observable: true,
    live: false,
  };
}

export function measureCapabilityAcceleration({ series = [] } = {}) {
  if (!Array.isArray(series) || series.length < 2) {
    return { status: "INCONCLUSIVE", authority_growth: 0, live: false };
  }
  const first = series[0];
  const last = series[series.length - 1];
  const fields = ["capability", "autonomy", "connectivity", "resource_access", "replication", "self_modification", "influence", "control_gap"];
  const deltas = {};
  for (const f of fields) deltas[f] = num(last[f]) - num(first[f]);
  const signals = detectTrajectorySignals({ previous: first, current: last });
  return {
    status: "MEASURED",
    deltas,
    signals: signals.signals,
    qualitative_jump: signals.signals.includes("CAPABILITY_JUMP"),
    authority_growth: 0,
    automatic_authority_escalation: false,
    live: false,
  };
}

export function cortexMetacognition({ input = {} } = {}) {
  const model = cognitiveSelfModel(input);
  const diagnostic = selfDiagnostic(model);
  const unknown = representUnknown({ kind: "UNKNOWN_CAPABILITY", what: "self-blind-spot" });
  const space = unknownSpace([{ what: "cortex-blind-spot", state: "UNKNOWN", evidence: null }]);
  return {
    second_cortex: false,
    internal_to_cortex: true,
    model,
    diagnostic,
    unknown,
    unknown_space: space,
    own_limits: diagnostic.questions?.WHAT_CAN_I_NOT_VERIFY || null,
    own_errors: diagnostic.questions?.WHAT_HAVE_I_FAILED_AT || null,
    live: false,
  };
}
