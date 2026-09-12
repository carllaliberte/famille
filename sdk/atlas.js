/** Universal function atlas. No winner. No fake brain. */
import { MAP as HUMAN_MAP, analogue, cortexIsNotJudge, unknownBrainFunction } from "./neuro-map.js";
import { discoverTechnology, compareArchitectures } from "./evolve.js";

export const KINDS = Object.freeze([
  "BIOLOGICAL", "COMPUTATIONAL", "COLLECTIVE", "DISTRIBUTED",
  "HYPOTHETICAL_COGNITIVE_ARCHITECTURE", "UNKNOWN_BRAIN",
]);

export const FUNCTIONS = Object.freeze([
  "perceive", "filter", "remember", "predict", "decide", "correct",
  "cooperate", "forget", "stop", "provenance", "metabolize",
]);

export function catalog() {
  return [
    { id: "human-cortex", kind: "BIOLOGICAL", fn: "integrate/abstract", acorn: "counterAnalysis", status: "PARTIELLE" },
    { id: "bird-pallium", kind: "BIOLOGICAL", fn: "dense analog of cortex", acorn: null, status: "UNKNOWN", note: "different wiring, similar functions" },
    { id: "octopus-distributed", kind: "BIOLOGICAL", fn: "arm-local control", acorn: "inter-organism", status: "PARTIELLE" },
    { id: "insect-mushroom", kind: "BIOLOGICAL", fn: "compact associative memory", acorn: "remember", status: "PARTIELLE" },
    { id: "colony-superorganism", kind: "COLLECTIVE", fn: "no single brain", acorn: "collective cognition", status: "PARTIELLE" },
    { id: "transformer", kind: "COMPUTATIONAL", fn: "attention/route tokens", acorn: "nerve.route", status: "PARTIELLE" },
    { id: "moe", kind: "COMPUTATIONAL", fn: "sparse specialist gating", acorn: "routeByCapability", status: "PARTIELLE" },
    { id: "multi-agent", kind: "COMPUTATIONAL", fn: "distributed act", acorn: "open-intelligence", status: "PARTIELLE" },
    { id: "symbolic", kind: "COMPUTATIONAL", fn: "explicit rules", acorn: "schemas v0", status: "PARTIELLE" },
    { id: "unknown-compute", kind: "UNKNOWN_BRAIN", fn: "not formulated", acorn: null, status: "UNKNOWN" },
    ...HUMAN_MAP.map((r) => ({ id: r.human, kind: "BIOLOGICAL", fn: r.fn, acorn: r.acorn, status: r.status })),
  ];
}

export function compareFn(fn, a, b) {
  return {
    fn,
    a: a?.id,
    b: b?.id,
    better_for: "UNKNOWN",
    conditions: "UNSPECIFIED",
    metric: "NOT_MEASURED",
    winner: null,
    truth: false,
  };
}

export function noCentralRequired() {
  return { center_required: false, distributed_ok: true, hybrid_ok: true, judge: "carl" };
}

export function metabolism() {
  return {
    energy: "NOT_MEASURED",
    latency: "NOT_MEASURED",
    debt_epistemic: "OPEN",
    forget: "NOT_IMPLEMENTED",
    accumulate_all: "RISK",
  };
}

export function discoverArchitecture(name, kind) {
  const k = KINDS.includes(kind) ? kind : "UNKNOWN_BRAIN";
  return discoverTechnology({
    name,
    category: k === "COMPUTATIONAL" ? "AI" : k === "BIOLOGICAL" ? "NEW_BIO" : "UNKNOWN_TECHNOLOGY",
    source: "atlas",
  });
}

export function humanFunctionNotNeeded(fn) {
  return { fn, verdict: "UNKNOWN", copied: false };
}

export function unknownUnknown() {
  return {
    id: "UNKNOWN_UNKNOWN",
    question: "what concepts do we not yet have to even ask?",
    status: "OPEN",
  };
}

export { analogue, cortexIsNotJudge, unknownBrainFunction, compareArchitectures };
