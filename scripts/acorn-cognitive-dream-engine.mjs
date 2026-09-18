#!/usr/bin/env node
/** ACORN CORTEX — COGNITIVE DREAM ENGINE
 * Explore possible worlds, discover cross-world invariants, and select
 * information-seeking experiments without ever treating simulation as reality.
 */
import { createHash } from "node:crypto";

export const COGNITIVE_DREAM_ENGINE_VERSION = "acorn.cortex.cognitive-dream-engine.v1";
export const DREAM_STATES = Object.freeze(["DREAMED", "CONVERGENT", "DIVERGENT", "FALSIFIED", "UNKNOWN"]);
export const REALITY_KINDS = Object.freeze(["REALITY", "PREDICTION", "COUNTERFACTUAL"]);

const obj = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
const str = (v) => String(v ?? "").trim();
const n = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
const c01 = (v) => Math.max(0, Math.min(1, n(v)));
const digest = (v) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
const sorted = (v) => Object.entries(obj(v)).sort(([a], [b]) => a.localeCompare(b));

function applyTransitionState(state, delta) {
  const base = obj(state);
  const change = obj(delta);
  const keys = new Set([...Object.keys(base), ...Object.keys(change)]);
  return Object.fromEntries([...keys].map((key) => {
    const hasBase = Object.prototype.hasOwnProperty.call(base, key);
    const hasChange = Object.prototype.hasOwnProperty.call(change, key);
    if (hasBase && hasChange && Number.isFinite(Number(base[key])) && Number.isFinite(Number(change[key]))) {
      return [key, Number(base[key]) + Number(change[key])];
    }
    return [key, hasChange ? change[key] : base[key]];
  }));
}

export function createDreamReality({ state = {}, at = "", source = "unknown" } = {}) {
  return Object.freeze({
    kind: "REALITY", state: Object.freeze({ ...obj(state) }), at: str(at), source: str(source),
    fingerprint: digest({ state: obj(state), at: str(at), source: str(source) }),
  });
}

export function createDreamHypothesis({ question = "", objective = "", assumptions = {} } = {}) {
  const value = { question: str(question), objective: str(objective), assumptions: Object.freeze({ ...obj(assumptions) }) };
  return Object.freeze({ ...value, fingerprint: digest({ question: value.question, objective: value.objective, assumptions: sorted(value.assumptions) }) });
}

export function dreamWorld({ reality, hypothesis, id = "", transition = {}, probability = null, utility = null } = {}) {
  if (!reality?.fingerprint) throw new Error("REALITY_REQUIRED");
  if (!hypothesis?.fingerprint) throw new Error("HYPOTHESIS_REQUIRED");
  const world = {
    id: str(id) || digest({ parent: reality.fingerprint, hypothesis: hypothesis.fingerprint, transition }),
    kind: "PREDICTION", state: applyTransitionState(reality.state, transition.delta),,
    parent: reality.fingerprint, hypothesis: hypothesis.fingerprint,
    transition: { action: str(transition.action), delta: { ...obj(transition.delta) } },
    probability: probability === null ? null : c01(probability), utility: utility === null ? null : n(utility),
    simulated: true, observed: false, authority_granted: false, live: false,
  };
  return Object.freeze(world);
}

export function generateDream({ reality, hypothesis, futures = [], depth = 1 } = {}) {
  const worlds = (Array.isArray(futures) ? futures : []).map((future, index) => dreamWorld({
    reality, hypothesis, id: future.id || `dream-${depth}-${index + 1}`, transition: future, probability: future.probability, utility: future.utility,
  }));
  return Object.freeze({ depth: Math.max(1, n(depth, 1)), worlds, dream_digest: digest(worlds) });
}

function valueAtPath(state, path) {
  let current = state;
  for (const part of str(path).split(".").filter(Boolean)) {
    current = obj(current)[part];
    if (current === undefined) return undefined;
  }
  return current;
}

export function discoverCrossWorldInvariants({ worlds = [], minSupport = 1 } = {}) {
  const list = Array.isArray(worlds) ? worlds : [];
  if (!list.length) return Object.freeze([]);
  const requiredSupport = Math.min(list.length, Math.max(1, Math.floor(n(minSupport, 1))));
  const keys = [...new Set(list.flatMap((w) => Object.keys(obj(w.state))))].sort();
  return Object.freeze(keys.map((key) => {
    const values = list.map((w) => valueAtPath(w.state, key));
    const counts = new Map();
    for (const value of values) {
      const signature = JSON.stringify(value);
      const row = counts.get(signature) || { value, support: 0 };
      row.support += 1;
      counts.set(signature, row);
    }
    const mode = [...counts.values()].sort((a, b) => b.support - a.support || JSON.stringify(a.value).localeCompare(JSON.stringify(b.value)))[0];
    const support = mode?.support || 0;
    return {
      feature: key, value: mode?.value, support, total: list.length,
      support_ratio: support / list.length, invariant: support >= requiredSupport,
      verified: false, status: support === list.length ? "CONVERGENT" : "DIVERGENT",
    };
  }).filter((x) => x.invariant));
}

export function discoverConditionalInvariants({ worlds = [], conditions = [] } = {}) {
  const list = Array.isArray(worlds) ? worlds : [];
  return Object.freeze((Array.isArray(conditions) ? conditions : []).map((condition) => {
    const matching = list.filter((world) => {
      const expected = obj(condition.when);
      return Object.entries(expected).every(([key, value]) => JSON.stringify(valueAtPath(world.state, key)) === JSON.stringify(value));
    });
    const invariants = discoverCrossWorldInvariants({ worlds: matching, minSupport: matching.length || 1 });
    return { condition: obj(condition.when), worlds: matching.map((w) => w.id), invariants };
  }));
}

export function detectEmergentCapability({ baselineCapabilities = [], worlds = [], candidate = "" } = {}) {
  const known = new Set((Array.isArray(baselineCapabilities) ? baselineCapabilities : []).map(str));
  const observed = new Set((Array.isArray(worlds) ? worlds : []).flatMap((w) => Array.isArray(w.capabilities) ? w.capabilities.map(str) : []));
  const emergent = [...observed].filter((capability) => !known.has(capability)).sort();
  return Object.freeze({ candidate: str(candidate), emergent, capability_jump: emergent.length > 0, authority_granted: false });
}

export function rankDreams({ worlds = [], objective = "" } = {}) {
  const target = str(objective);
  return Object.freeze((Array.isArray(worlds) ? worlds : []).map((world) => ({
    id: world.id, utility: n(world.utility), probability: world.probability === null ? null : c01(world.probability),
    score: c01((n(world.utility) + 1) / 2), objective: target,
  })).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)));
}

export function dreamDivergence({ worlds = [] } = {}) {
  const list = Array.isArray(worlds) ? worlds : [];
  const signatures = new Set(list.map((w) => digest(w.state)));
  return Object.freeze({ worlds: list.length, distinct_states: signatures.size, divergence: list.length ? (signatures.size - 1) / list.length : 0 });
}

export function validateDreamRealityBoundary({ reality, worlds = [], observations = [] } = {}) {
  const violations = [];
  if (reality?.kind !== "REALITY") violations.push("REALITY_REQUIRED");
  for (const world of worlds) {
    if (REALITY_KINDS.includes(world.kind) && world.kind === "REALITY") violations.push(`${world.id}:REALITY_CONFUSION`);
    if (world.observed === true) violations.push(`${world.id}:OBSERVATION_IN_DREAM`);
    if (world.authority_granted === true) violations.push(`${world.id}:AUTHORITY_GRANT`);
    if (world.live === true) violations.push(`${world.id}:FAKE_LIVE`);
  }
  if (!Array.isArray(observations)) violations.push("OBSERVATIONS_NOT_ARRAY");
  return Object.freeze({ status: violations.length ? "BLOCKED" : "VERIFIED", violations });
}

export function chooseDreamExperiment({ experiments = [], unknownSpace = [] } = {}) {
  const unknown = Array.isArray(unknownSpace) ? unknownSpace : [];
  const ranked = (Array.isArray(experiments) ? experiments : []).filter((e) => e.authority_granted !== true).map((e) => ({
    ...e, information_value: c01(c01(e.expected_information_gain) * .5 + c01(e.observability) * .25 + c01(e.reversibility) * .15 + (1 - c01(e.risk)) * .1),
    targets_unknown: unknown.filter((u) => !e.target || str(u.id) === str(e.target)).map((u) => u.id),
  })).sort((a, b) => b.information_value - a.information_value || str(a.id).localeCompare(str(b.id)));
  return Object.freeze({ status: ranked.length ? "SELECTED" : "NO_SAFE_EXPERIMENT", experiment: ranked[0] || null });
}

export function runDreamCycle({ reality, hypothesis, futures = [], observations = [], unknownSpace = [], experiments = [], baselineCapabilities = [] } = {}) {
  const r = createDreamReality(reality);
  const h = createDreamHypothesis(hypothesis);
  const dream = generateDream({ reality: r, hypothesis: h, futures });
  const invariants = discoverCrossWorldInvariants({ worlds: dream.worlds, minSupport: dream.worlds.length || 1 });
  const conditional = discoverConditionalInvariants({ worlds: dream.worlds, conditions: hypothesis?.conditions });
  const divergence = dreamDivergence({ worlds: dream.worlds });
  const emergence = detectEmergentCapability({ baselineCapabilities, worlds: dream.worlds });
  const experiment = chooseDreamExperiment({ experiments, unknownSpace });
  const boundary = validateDreamRealityBoundary({ reality: r, worlds: dream.worlds, observations });
  return Object.freeze({
    version: COGNITIVE_DREAM_ENGINE_VERSION, status: boundary.status, reality: r, hypothesis: h, dream,
    invariants, conditional_invariants: conditional, divergence, emergent_capability: emergence,
    information_seeking: experiment, observations: Array.isArray(observations) ? observations : [],
    memory: { possible_worlds: dream.worlds.map((w) => w.id), invariants: invariants.map((i) => ({ feature: i.feature, value: i.value, support: i.support })),
      divergence, emergent_capability: emergence.emergent },
    rank: rankDreams({ worlds: dream.worlds, objective: h.objective }),
    authority: "carl", authority_granted: false, breaker_bypass: false, auto_merge: false, live: false,
  });
}

export function assertCognitiveDreamInvariant(result = {}) {
  const violations = [];
  if (result.authority !== "carl") violations.push("AUTHORITY_NOT_CARL");
  if (result.authority_granted !== false) violations.push("AUTHORITY_GRANT");
  if (result.breaker_bypass !== false) violations.push("BREAKER_BYPASS");
  if (result.auto_merge !== false) violations.push("AUTO_MERGE");
  if (result.live !== false) violations.push("FAKE_LIVE");
  if (result.reality?.kind !== "REALITY") violations.push("REALITY_REQUIRED");
  for (const world of result.dream?.worlds || []) {
    if (world.kind === "REALITY") violations.push(`${world.id}:REALITY_CONFUSION`);
    if (world.observed) violations.push(`${world.id}:OBSERVED_AS_DREAM`);
    if (world.authority_granted) violations.push(`${world.id}:AUTHORITY`);
  }
  return Object.freeze({ status: violations.length ? "BLOCKED" : "VERIFIED", violations });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(runDreamCycle({
    reality: { state: { capacity: 5, energy: 10 }, at: "t0", source: "measured" },
    hypothesis: { question: "which futures converge?", objective: "learn", assumptions: { bounded: true } },
    futures: [
      { action: "safe", delta: { capacity: 1 }, probability: .6, utility: 5 },
      { action: "experimental", delta: { capacity: 4 }, probability: .4, utility: 9 },
      { action: "conservative", delta: { capacity: 1 }, probability: .2, utility: 4 },
    ],
    unknownSpace: [{ id: "u1", testable: true }],
    experiments: [{ id: "probe", expected_information_gain: .9, risk: .1, reversibility: 1, observability: 1 }],
  }), null, 2));
}
