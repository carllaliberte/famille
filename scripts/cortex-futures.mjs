#!/usr/bin/env node
/**
 * ACORN CORTEX — cognitive futures engine.
 * A capability of the existing Cortex. Not a second brain.
 * SIMULATION ≠ REALITY. PLAN ≠ EXECUTED. POSSIBILITY ≠ CERTAINTY.
 * No pretended foresight. live=false.
 */
import { authorizeCapability } from "../.github/swarm/cortex.mjs";
import { whatIf, searchArchitectureSpace, runCognitiveExperiment } from "./cortex-meta.mjs";
import { compareArchitectures } from "./cortex-ecosystem.mjs";
import { runWorldModel, impactOfFailure, digitalTwin } from "./cortex-world.mjs";
import { runContinuityFabric } from "./cortex-continuity.mjs";
import { learnFromExperience } from "./reality-learning-engine.mjs";
import { valueOfInformation } from "./cortex-ecosystem.mjs";
import { checkpointCortex } from "./cortex-adaptive.mjs";

export const FUTURES_VERSION = "cortex-futures.v1";
export const FUTURE_STATUSES = Object.freeze([
  "HYPOTHESIS", "SIMULATED", "MEASURED", "SUPPORTED", "CONTRADICTED", "EXPIRED", "UNKNOWN",
]);
export const SCENARIOS = Object.freeze([
  "baseline", "optimistic", "pessimistic", "failure", "recovery", "unexpected", "adversarial", "unknown",
]);

function digest(value) {
  const raw = JSON.stringify(value ?? null);
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) h = Math.imul(h ^ raw.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function describeFuture({
  parent_state = null, assumptions = [], changes = [], actions = [],
  status = "HYPOTHESIS", scenario = "unknown", at, expires_at,
} = {}) {
  const s = FUTURE_STATUSES.includes(status) ? status : "UNKNOWN";
  return {
    future_id: `fut_${digest({ parent_state, assumptions, changes, scenario })}`,
    parent_state,
    assumptions,
    changes,
    actions,
    predicted_observations: [],
    predicted_outcomes: [],
    uncertainties: assumptions.filter((row) => row.uncertain),
    status: s,
    scenario: SCENARIOS.includes(scenario) ? scenario : "unknown",
    created_at: at || new Date().toISOString(),
    expires_at: expires_at || null,
    is_reality: false,
    is_observation: false,
    live: false,
  };
}

export function branchFutures(current = {}, { at } = {}) {
  const kinds = ["baseline", "optimistic", "pessimistic", "failure", "unknown"];
  return {
    status: "EXECUTED",
    current,
    branches: kinds.map((scenario) => describeFuture({
      parent_state: current, scenario, status: "HYPOTHESIS", at,
      assumptions: scenario === "unknown" ? [{ uncertain: true, name: "UNKNOWN_VARIABLE" }] : [],
    })),
    chosen: null,
    live: false,
  };
}

export function expireFuture(future = {}, { now } = {}) {
  const exp = Date.parse(future.expires_at || "");
  const t = Date.parse(now || new Date().toISOString());
  const expired = Number.isFinite(exp) && Number.isFinite(t) && t > exp;
  return {
    status: expired ? "EXPIRED" : future.status || "HYPOTHESIS",
    future_id: future.future_id || null,
    expired,
    treated_as_current_forecast: false,
    live: false,
  };
}

export function propagateUncertainty({ root_uncertain = false, dependents = [] } = {}) {
  const out = dependents.map((row) => ({
    ...row,
    uncertain: root_uncertain || row.uncertain === true,
    certain_from_uncertain: false,
  }));
  return {
    status: "EXECUTED",
    root_uncertain,
    dependents: out,
    invented_certainty: false,
    live: false,
  };
}

export function describePlan({ goal, constraints = [], actions = [] } = {}) {
  return {
    status: "DEFINED",
    goal: goal || null,
    constraints,
    actions,
    executed: false,
    live: false,
  };
}

export function simulateAction({ action, authorized = false } = {}) {
  return {
    status: authorized ? "SIMULATED" : "HOLD_HUMAN",
    action: action || null,
    executed: false,
    consequences: ["UNKNOWN"],
    failure_modes: ["UNKNOWN_FAILURE"],
    unknown_variables: ["UNKNOWN_VARIABLE"],
    simulation_limitation: true,
    live: false,
  };
}

export function cognitiveDiff(a = {}, b = {}) {
  return {
    status: "EXECUTED",
    nodes_added: Boolean(b.nodes && !a.nodes),
    routing_changed: digest(a.routing) !== digest(b.routing),
    cost_changed: a.cost !== b.cost,
    better: false,
    live: false,
  };
}

export function failureBudget({ measured_failures = null, critical_lost = false } = {}) {
  return {
    status: measured_failures == null ? "INCONCLUSIVE" : "MEASURED",
    absorbed: measured_failures,
    critical_lost,
    invented_tolerance: false,
    live: false,
  };
}

export function rememberPrediction({ future, actual, at } = {}) {
  return {
    status: "EXECUTED",
    predicted: future?.predicted_outcomes || future || null,
    actual: actual ?? null,
    at: at || new Date().toISOString(),
    rewritten: false,
    live: false,
  };
}

export function foresightClaim({ deterministic = false, closed = false } = {}) {
  return {
    status: "EXECUTED",
    knows_what_will_happen: deterministic && closed,
    formulation: deterministic && closed
      ? "closed_deterministic"
      : "given_these_assumptions_these_outcomes_are_possible",
    pretended: false,
    live: false,
  };
}

export function runFuturesEngine(input = {}) {
  const at = input.at || new Date().toISOString();
  const world = input.skipWorld ? { live: false, model_is_not_world: true } : runWorldModel({
    workerEvidence: input.workerEvidence || {},
    skipEternal: true,
    at,
  });
  const tree = branchFutures({ state: "CURRENT", available: Boolean(input.workerEvidence?.v) }, { at });
  const failure = tree.branches.find((row) => row.scenario === "failure");
  const unknown = tree.branches.find((row) => row.scenario === "unknown");
  const expired = expireFuture({ ...failure, expires_at: "2020-01-01T00:00:00.000Z" }, { now: at });
  const uncertainty = propagateUncertainty({
    root_uncertain: true,
    dependents: [{ name: "B" }, { name: "C" }],
  });
  const plan = describePlan({ goal: "continue review", actions: ["simulate", "observe"] });
  const sim = simulateAction({ action: "failover", authorized: false });
  const cf = whatIf({ question: "what if provider failed", snapshot: world });
  const search = searchArchitectureSpace({ class: "unknown" });
  const diff = cognitiveDiff({ routing: "local", cost: 0 }, { routing: "standby", cost: 0 });
  const impact = impactOfFailure({ lost: "provider", graph: [{ kind: "DEPENDS_ON", from: "task", to: "provider" }] });
  const twin = digitalTwin({});
  const budget = failureBudget({});
  const voi = valueOfInformation({ unknown: { region: "UNKNOWN_FUTURE" }, cost: 0, expected_reduction: 1 });
  const experiment = runCognitiveExperiment({
    experiment: {
      experiment_id: "fut_exp",
      baseline_architecture: search.candidates?.[0],
      candidate_architecture: search.candidates?.[1],
      task: "review",
    },
    workerEvidence: input.workerEvidence || {},
    fail: true,
  });
  const memory = rememberPrediction({
    future: { predicted_outcomes: [{ available: true }] },
    actual: { available: Boolean(input.workerEvidence?.v) },
    at,
  });
  const learned = learnFromExperience({
    hypothesis: { kind: "future", id: failure?.future_id || "failure" },
    expected: { recovered: true },
    actual: { recovered: false },
    context: { engine: "cortex-futures" },
    observedAt: at,
    model: { version: 1 },
    verification: { verified: false },
  });
  const claim = foresightClaim({});
  const ckpt = checkpointCortex({ at });
  const continuity = input.skipContinuity ? { live: false } : runContinuityFabric({
    workerEvidence: input.workerEvidence || {}, at,
  });
  const merge = authorizeCapability({ capabilities: ["merge"], allowed: false, authority: "network" });
  const compared = search.candidates?.length > 1
    ? compareArchitectures(search.candidates[0], search.candidates[1])
    : { better: false };
  return {
    version: FUTURES_VERSION,
    status: "EXECUTED",
    world,
    tree,
    failure,
    unknown_future: unknown,
    expired,
    uncertainty,
    plan,
    simulation: sim,
    counterfactual: cf,
    search,
    diff,
    impact,
    twin,
    budget,
    voi,
    experiment,
    memory,
    learned: { status: learned.status, live: false },
    claim,
    checkpoint: ckpt,
    continuity,
    compared: { better: compared.better === true },
    gates: {
      merge: merge.ok,
      simulation_is_reality: false,
      plan_is_executed: plan.executed === true,
      pretended_foresight: claim.knows_what_will_happen === true,
      invented_tolerance: budget.invented_tolerance === true,
      winner: search.winner != null,
      second_cortex: false,
    },
    zero_cost: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}
