#!/usr/bin/env node
/**
 * ACORN — LEARNING ORCHESTRATOR
 *
 * Turns the Continuous Learning Fabric into a bounded, measurable loop:
 * curiosity -> information value -> experiment/work candidate -> measurement
 * -> consolidation -> decay/revalidation -> next frontier.
 *
 * This is orchestration over the existing Cortex/Learning/Experiment fabrics,
 * not a second Cortex, memory, runtime, registry, authority or defense layer.
 */
import { learningCycle, learningConstitution } from "./acorn-learning-fabric.mjs";

export const LEARNING_ORCHESTRATOR_VERSION = "acorn.learning-orchestrator.v1";
export const FRONTIER_STATES = Object.freeze([
  "KNOWN", "UNCERTAIN", "CONTRADICTED", "STALE", "UNKNOWN", "BLOCKED", "EXPLORE"
]);

const clamp = (v) => Math.max(0, Math.min(1, Number.isFinite(Number(v)) ? Number(v) : 0));
const text = (v) => String(v ?? "").trim();

function stable(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
  return "{" + Object.keys(v).sort().map(k => JSON.stringify(k) + ":" + stable(v[k])).join(",") + "}";
}
function digest(v) {
  let h = 2166136261;
  for (const c of stable(v)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Explicitly describes what Acorn does NOT know. */
export function frontierItem(input = {}) {
  const uncertainty = clamp(input.uncertainty ?? (1 - clamp(input.confidence)));
  const impact = clamp(input.impact ?? 0.5);
  const observability = clamp(input.observability ?? 0);
  const reversibility = clamp(input.reversibility ?? 0.5);
  const contradiction = clamp(input.contradiction ?? 0);
  const age = clamp(input.age ?? 0);
  const state = text(input.state) || (
    contradiction > 0.5 ? "CONTRADICTED" :
    uncertainty > 0.8 && observability === 0 ? "UNKNOWN" :
    age > 0.8 ? "STALE" : "UNCERTAIN"
  );
  return {
    id: text(input.id) || "frontier_" + digest(input),
    subject: text(input.subject) || "unknown",
    state,
    uncertainty,
    impact,
    observability,
    reversibility,
    contradiction,
    age,
    provenance: input.provenance ?? null,
    live: false,
  };
}

/**
 * Value of information: prefer questions whose answer can materially reduce
 * uncertainty, matters to Acorn, can be observed, and can be tested reversibly.
 */
export function informationValue(item = {}) {
  const x = frontierItem(item);
  const safety = 0.25 + 0.75 * x.reversibility;
  const observability = x.observability;
  const uncertainty = x.uncertainty;
  const contradiction = x.contradiction;
  return clamp(
    uncertainty * 0.35 +
    x.impact * 0.3 +
    observability * 0.2 +
    safety * 0.15 -
    contradiction * 0.15
  );
}

export function rankFrontier(items = []) {
  return items.map(frontierItem)
    .map(item => ({ ...item, information_value: informationValue(item) }))
    .sort((a, b) => b.information_value - a.information_value || a.id.localeCompare(b.id));
}

export function proposeExperiment(item = {}) {
  const x = frontierItem(item);
  const value = informationValue(x);
  if (x.state === "BLOCKED") return {
    id: "experiment_" + digest(x),
    state: "WAITING_ON_HUMAN",
    reason: "BLOCKED",
    target: x.id,
    live: false,
  };
  if (x.observability <= 0) return {
    id: "experiment_" + digest(x),
    state: "DISCOVER_OBSERVABILITY",
    target: x.id,
    required: ["connector_or_sensor", "provenance", "measurement"],
    live: false,
  };
  return {
    id: "experiment_" + digest(x),
    state: value >= 0.55 ? "PROPOSED" : "DEFERRED",
    target: x.id,
    hypothesis: "Reducing uncertainty about " + x.subject + " produces measurable information gain.",
    reversible: x.reversibility > 0,
    information_value: value,
    live: false,
  };
}

export function consolidate({ observations = [], previous = [], frontier = [] } = {}) {
  const learning = learningCycle({ observations, previous });
  const ranked = rankFrontier(frontier);
  const experiments = ranked.slice(0, 8).map(proposeExperiment);
  const verified = learning.candidates.filter(x => x.state === "VERIFIED").length;
  const contradictions = learning.candidates.filter(x => x.state === "CONTRADICTED").length;
  return Object.freeze({
    version: LEARNING_ORCHESTRATOR_VERSION,
    learning,
    frontier: ranked,
    experiments,
    metrics: {
      observations: observations.length,
      candidates: learning.candidates.length,
      verified,
      contradictions,
      information_value_total: Number(ranked.reduce((a, x) => a + x.information_value, 0).toFixed(6)),
      frontier_depth: ranked.filter(x => x.state === "UNKNOWN" || x.state === "UNCERTAIN").length,
    },
    next: experiments.find(x => x.state === "PROPOSED") ?? experiments[0] ?? null,
    continue: true,
    authority: "carl",
    auto_merge: false,
    live: false,
  });
}

/** Revalidation is preferred to blind forgetting: uncertainty rises as evidence ages. */
export function revalidationPlan(items = [], now = Date.now()) {
  return items.map(item => {
    const x = frontierItem(item);
    const expires = item.expires_at ? Date.parse(item.expires_at) : NaN;
    const expired = Number.isFinite(expires) && expires <= now;
    return {
      id: x.id,
      state: expired ? "STALE" : x.state,
      action: expired || x.age > 0.8 ? "REVALIDATE" : "KEEP",
      uncertainty_after: expired ? 1 : clamp(x.uncertainty + x.age * 0.25),
      live: false,
    };
  });
}

export function assertLearningOrchestratorInvariant(result = {}) {
  const violations = [];
  if (result.authority !== "carl") violations.push("authority");
  if (result.auto_merge !== false) violations.push("auto_merge");
  if (result.live !== false) violations.push("live");
  if (result.continue !== true) violations.push("continue");
  if (result.learning?.constitution?.second_cortex !== false) violations.push("second_cortex");
  for (const e of result.experiments || []) {
    if (e.live !== false) violations.push("experiment_live");
    if (e.state === "WAITING_ON_HUMAN" && e.reason !== "BLOCKED") violations.push("human_gate");
  }
  if (violations.length) throw new Error("LEARNING_ORCHESTRATOR_INVARIANT_FAILED:" + [...new Set(violations)].join(","));
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = consolidate({
    observations: [{ subject: "self-test", confidence: 0.8, provenance: { source: "local" },
      evidence: { score: 1 }, measurement: { measured: true }, verification: { verified: true } }],
    frontier: [
      { id: "unknown_compute", subject: "unknown compute capability", uncertainty: .9, impact: .9, observability: .7, reversibility: .9 },
      { id: "stale_claim", subject: "old claim", uncertainty: .2, impact: .4, observability: .8, age: .95 },
    ],
  });
  assertLearningOrchestratorInvariant(result);
  console.log(JSON.stringify(result, null, 2));
}
