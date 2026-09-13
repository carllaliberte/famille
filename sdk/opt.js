/** Cognitive optimization primitives. Not a new brain. Not authority. */
import { diagnose } from "./omni-ecosystem.js";
import { breakerBlocks, hypothesis, falsify } from "./open-intelligence.js";
import { architectureIsDatedHypothesis } from "./evolve.js";

export function errorLoop({ prediction, observation }) {
  const error = prediction === observation ? 0 : 1;
  return {
    prediction, observation, error,
    correction: error ? "REVISE" : "HOLD",
    truth: false,
    status: "TESTED",
  };
}

export function forgetOperational(items, { keepHistory = true } = {}) {
  return {
    dropped: items.filter((x) => x.stale),
    kept: items.filter((x) => !x.stale),
    history_preserved: keepHistory,
    erased_origin: false,
  };
}

export function metabolism() {
  const m = process.memoryUsage();
  return {
    rss_bytes: m.rss,
    heap_used: m.heapUsed,
    latency: "NOT_MEASURED",
    energy: "NOT_MEASURED",
    epistemic_debt: "OPEN",
    status: "MEASURED",
  };
}

export function novelty(event, known = []) {
  const seen = known.includes(event);
  return { event, state: seen ? "KNOWN" : "NEW_EVENT", important: false };
}

export function outOfDistribution(x, domain = []) {
  return { x, ood: !domain.includes(x), forced_category: false };
}

export function regime(prev, next) {
  if (prev === next) return { state: "NORMAL" };
  return { state: "DRIFT", previous: prev, next, models_maybe_stale: true };
}

export function correlationIsNotCause(a, b) {
  return { a, b, relation: "ASSOCIATION", causality: "HYPOTHESIS" };
}

export function counterfactual(ifNot) {
  return { ifNot, kind: "SIMULATION", observation: false };
}

export function curiosity({ uncertainty = 1, cost = 1, risk = 1 } = {}) {
  return { score: uncertainty - cost - risk, authority: false, formula: "CONCEPTUAL" };
}

export function missingQuestions() {
  const d = diagnose();
  return {
    unasked: d.unasked,
    missing: ["MISSING_CAUSAL_TEST", "MISSING_COUNTERARGUMENT", "UNKNOWN_UNKNOWN"],
  };
}

export function diversity(models = []) {
  const uniq = new Set(models.map((m) => m.kind || m));
  return { n: models.length, distinct: uniq.size, same_error_is_not_diversity: true };
}

export function selfFalsify(observation) {
  return falsify(architectureIsDatedHypothesis(), observation);
}

export function observeVsAct() {
  return {
    ACORN_OBSERVES_WORLD: "DECLARED",
    ACORN_INTERACTS_WITH_WORLD: "CHANNEL_NOT_PRESENT",
    WORLD_INFLUENCES_ACORN: "UNKNOWN",
    ACORN_INFLUENCES_WORLD: "NOT_IMPLEMENTED",
  };
}

export function blockedIfStop(op) {
  if (breakerBlocks(op)) return { status: "BLOCKED" };
  return { status: "ALLOWED", authority: false };
}

export function refuseToRepresent(reason = "distortion") {
  return { status: "REFUSE_TO_REPRESENT", reason, category: false, truth: false };
}
