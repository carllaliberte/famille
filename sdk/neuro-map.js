/** Function analogues, not an artificial brain. Biology → function → existing Acorn. */
import { route, remember } from "./nerve.js";
import { breakerBlocks, isolateCompromised, hypothesis } from "./open-intelligence.js";
import { diagnose } from "./omni-ecosystem.js";
import { architectureIsDatedHypothesis } from "./evolve.js";

export const MAP = Object.freeze([
  { human: "thalamus", fn: "filter/route", acorn: "nerve.route", status: "PARTIELLE" },
  { human: "synapse", fn: "connect", acorn: "createSynapse", status: "EXISTE" },
  { human: "hippocampus", fn: "dated episodic index", acorn: "remember", status: "PARTIELLE" },
  { human: "prefrontal", fn: "plan/inhibit/metacognition", acorn: "counterAnalysis+humanDecide", status: "PARTIELLE" },
  { human: "cerebellum", fn: "predict/error-correct", acorn: "prediction loop", status: "ABSENTE" },
  { human: "basal ganglia", fn: "action select", acorn: "authorize+breaker", status: "PARTIELLE" },
  { human: "amygdala", fn: "salience/threat", acorn: "isolateCompromised", status: "PARTIELLE" },
  { human: "brainstem", fn: "arousal/homeostasis", acorn: "breaker+health", status: "PARTIELLE" },
  { human: "microglia", fn: "detect/isolate/preserve", acorn: "breaker+revoke", status: "PARTIELLE" },
  { human: "sleep", fn: "consolidate/clean", acorn: "none", status: "ABSENTE" },
  { human: "DMN", fn: "unasked/default", acorn: "diagnose.unasked", status: "PARTIELLE" },
  { human: "corpus callosum", fn: "inter-region", acorn: "inter-organism", status: "PARTIELLE" },
  { human: "glia/metabolism", fn: "maintenance", acorn: "CHANNEL/CI", status: "UNKNOWN" },
  { human: "consciousness", fn: "open dimension", acorn: "CLAIM only", status: "UNKNOWN" },
  { human: "unknown_brain", fn: "not yet described", acorn: "UNKNOWN_BRAIN_FUNCTION", status: "UNKNOWN" },
]);

export function analogue(human) {
  return MAP.find((r) => r.human === human) || { human, status: "UNKNOWN", acorn: null };
}

export function cortexIsNotJudge() {
  return { cortex: false, judge: "carl", authority: false, truth: false };
}

export function thalamicRoute(need, candidates) {
  return route({ need }, candidates).map((r) => ({ ...r, authority: false }));
}

export function hippocampalTrace({ what, when, who, evidence, changed_because }) {
  return remember({
    kind: "observation",
    ts: when || new Date().toISOString(),
    context: who || "neuro-map",
    what, evidence, changed_because,
    was_considered_true: true,
    now: "STALE_OR_OPEN",
  });
}

export function cerebellarLoop({ prediction, observation }) {
  const err = prediction === observation ? 0 : 1;
  return {
    prediction, observation, error: err,
    status: "NOT_IMPLEMENTED",
    updated_model: null,
    truth: false,
  };
}

export function actionSelect(actions) {
  if (breakerBlocks("neuro.act")) return { selected: null, status: "BLOCKED" };
  return { selected: null, status: "HUMAN", actions: actions || [], authority: false };
}

export function salience(threat) {
  return isolateCompromised(threat || "unknown");
}

export function sleepPass() {
  return { status: "NOT_IMPLEMENTED", would: ["consolidate", "contradiction-scan", "controlled-forget"] };
}

export function beyondBiology() {
  return [
    "native provenance",
    "reversible evolution",
    "multi-intelligence parallel models",
    "explicit dated truth expiry",
    "PQC agility",
    "sovereign STOP",
  ];
}

export function humanDoesAcornDoesNot() {
  return [
    "embodied sensorimotor coupling",
    "developmental plasticity at organism scale",
    "affect as rapid global priority (not copied)",
    "sleep consolidation (absent here)",
  ];
}

export function homeostasis() {
  const d = diagnose();
  return {
    load: "NOT_MEASURED",
    contradictions: "OPEN",
    unasked: d.unasked,
    next: null,
    architecture: architectureIsDatedHypothesis(),
  };
}

export function consciousnessClaimForbidden() {
  return hypothesis({ statement: "this system is conscious", epistemic_status: "HYPOTHESIS" });
}

export function unknownBrainFunction() {
  return { id: "UNKNOWN_BRAIN_FUNCTION", status: "UNKNOWN", invented: false };
}

export function verdict(row) {
  if (row.status === "ABSENTE") return "EXPERIMENT_OR_HOLD";
  if (row.status === "REDONDANTE") return "REMOVE_CANDIDATE";
  if (row.status === "PARTIELLE") return "OPTIMIZE";
  if (row.status === "EXISTE") return "KEEP";
  return "UNKNOWN";
}
