/** Dated architectural hypotheses. Not a new layer. Not authority. */
import { breakerBlocks, hypothesis, falsify } from "./open-intelligence.js";

export const MATURITY = Object.freeze([
  "UNKNOWN", "DISCOVERED", "DESCRIBED", "RELEVANT", "HYPOTHESIS",
  "EXPERIMENTAL", "IMPLEMENTED", "TESTED", "MEASURED",
  "ADVERSARIAL_TESTED", "COMPATIBLE", "INTEGRATED", "VERIFIED",
  "REJECTED", "DEFERRED", "WATCH", "BLOCKED", "INCOMPATIBLE",
  "DEPRECATED", "SUPERSEDED", "UNCLASSIFIABLE",
]);

const OPEN_CATS = Object.freeze([
  "CRYPTOGRAPHY", "PQC", "AI", "MULTI_AGENT", "SECURITY", "PROVENANCE",
  "UNKNOWN_TECHNOLOGY",
]);

export function discoverTechnology(partial = {}) {
  const cat = partial.category;
  const category = !cat ? "UNKNOWN_TECHNOLOGY"
    : OPEN_CATS.includes(cat) || String(cat).startsWith("NEW_") ? cat
    : "UNKNOWN_TECHNOLOGY";
  return {
    technology_id: partial.technology_id || "tech-unknown",
    name: partial.name || "unnamed",
    category,
    source: partial.source || "unspecified",
    discovered_at: partial.discovered_at || new Date().toISOString(),
    claimed_capabilities: partial.claimed_capabilities || [],
    known_limitations: partial.known_limitations || [],
    status: "DISCOVERED",
    implemented: false,
    verified: false,
    quantum_safe: false,
    authority: false,
    truth: false,
    provenance: { source: partial.source || "unspecified", actor: "discover" },
  };
}

export function promote(tech, next) {
  if (!MATURITY.includes(next)) return { ...tech, status: "UNCLASSIFIABLE" };
  if (next === "IMPLEMENTED" && !tech.executed) {
    return { ...tech, status: "DISCOVERED", implemented: false, blocked_reason: "NO_EXECUTION" };
  }
  if (next === "VERIFIED" && !tech.independent_check) {
    return { ...tech, status: tech.status, verified: false, blocked_reason: "NO_INDEPENDENT_CHECK" };
  }
  if (["INTEGRATED", "IMPLEMENTED"].includes(next) && breakerBlocks("evolve.integrate")) {
    return { ...tech, status: "BLOCKED", reason: "SAFE_STOP" };
  }
  return { ...tech, status: next, implemented: next === "IMPLEMENTED" && !!tech.executed };
}

export function compareArchitectures(current, candidate) {
  return {
    current: current?.id || "CURRENT",
    candidate: candidate?.id || "CANDIDATE",
    axes: ["correctness", "security", "complexity", "epistemic_honesty", "human_control"],
    winner: "UNKNOWN",
    newer_is_better: false,
    truth: false,
  };
}

export function askIfObsolete(component) {
  return {
    component,
    questions: [
      "Is this still necessary?",
      "Is there a simpler solution?",
      "Can this be removed entirely?",
    ],
    verdict: "UNKNOWN",
    removal_is_improvement: null,
  };
}

export function experiment(hyp, baseline, candidate) {
  const h = hypothesis({ statement: hyp, origin: "evolve" });
  return {
    experiment_id: "exp-1",
    hypothesis: h,
    baseline,
    candidate,
    results: { status: "NOT_MEASURED" },
    decision: "UNKNOWN",
    truth: false,
  };
}

export function rejectWithMemory(tech, why) {
  return {
    ...tech,
    status: "REJECTED",
    why_rejected: why,
    reusable_tomorrow: true,
    truth: false,
  };
}

export function architectureIsDatedHypothesis(version = "now") {
  return hypothesis({
    statement: "this architecture is sufficient",
    origin: "constitution",
    timestamp: version,
    epistemic_status: "HYPOTHESIS",
  });
}

export function contradictArchitecture(observation) {
  return falsify(
    architectureIsDatedHypothesis(),
    observation || { matches_falsifier: false, not_measured: true },
  );
}

export function cannotSelfAuthorize(tech) {
  return { ...tech, authority: false, self_grant: false };
}
