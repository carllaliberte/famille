/** ACORN — ADAPTIVE LOOP
 * Discover → compose → constrain → compare → measure → learn → recompose.
 * Not a second runtime. Composes operateProblem, experiment, learning, repair.
 * More capabilities ≠ better. Hypothesis ≠ fact. Unknown ≠ crash.
 */
import { operateProblem, discoverUnknownIntelligence, economicRecord, temporalFact, asOf, recordLearningObservation } from "./acorn-operational-fabric.mjs";
import { compositionExperiment } from "./acorn-experiment.mjs";
import { proposeRepair } from "./acorn-self-build.mjs";

export const ADAPTIVE_VERSION = "acorn.adaptive-loop.v0";
export const MEMORY_KINDS = Object.freeze([
  "EVENT", "FACT", "OBSERVATION", "MEASUREMENT", "EVIDENCE", "HYPOTHESIS", "PATTERN", "DECISION"
]);
export const ZERO_TO_ONE = Object.freeze([
  "UNKNOWN", "DISCOVERED", "EXPERIMENT", "PROTOTYPE", "MEASURED", "VERIFIED", "PRODUCTIZED", "COMMERCIALIZED"
]);

const ISO = () => new Date().toISOString();
const str = (v) => String(v ?? "").trim();
const names = (caps = []) => [...new Set((Array.isArray(caps) ? caps : []).map((c) => str(c.name || c.id || c)).filter(Boolean))];

export function metric(value) {
  if (value == null || value === "") return { value: null, state: "NOT_MEASURED" };
  const n = Number(value);
  if (!Number.isFinite(n)) return { value: null, state: "NOT_MEASURED" };
  return { value: n, state: "OBSERVED" };
}

export function compositionRecord({
  id = null,
  capabilities = [],
  context = null,
  executor = null,
  inputs = [],
  dependencies = [],
  cost = null,
  latency = null,
  reliability = null,
  evidence = [],
  outcome = null,
  value = null,
  version = "1"
} = {}) {
  const caps = names(capabilities);
  return {
    id: id || ("comp_" + caps.join("_").slice(0, 48)),
    capabilities: caps,
    context,
    executor,
    inputs,
    dependencies,
    cost: metric(cost),
    latency: metric(latency),
    reliability: metric(reliability),
    evidence: Array.isArray(evidence) ? evidence : [],
    outcome: outcome || null,
    value: metric(value),
    version: str(version) || "1",
    provenance: "acorn-adaptive",
    score: null,
    best: false,
    selected: false,
    authorized: false,
    live: false
  };
}

export function constrain({ composition, constraints = {} } = {}) {
  const reasons = [];
  const cost = composition?.cost?.value;
  if (constraints.budget != null && cost != null && cost > Number(constraints.budget)) reasons.push("BUDGET");
  if (constraints.authority === false || constraints.authority === "none") {
    /* composition itself is never authority */
  }
  if (constraints.rights === false) reasons.push("RIGHTS");
  if (constraints.availability === false) reasons.push("AVAILABILITY");
  if (Array.isArray(constraints.required) && constraints.required.length) {
    const have = new Set(composition?.capabilities || []);
    const missing = constraints.required.filter((r) => !have.has(r));
    if (missing.length) reasons.push("MISSING_CAPABILITY");
  }
  return {
    composition_id: composition?.id || null,
    ok: reasons.length === 0,
    eliminated: reasons.length > 0,
    reasons,
    composition_is_not_authority: true,
    live: false
  };
}

export function compareCompositions(plans = [], { criterion = null } = {}) {
  const rows = (Array.isArray(plans) ? plans : []).map((p) => ({
    ...p,
    best: false,
    score: null
  }));
  let chosen = null;
  if (criterion && rows.length) {
    const key = str(criterion);
    const measured = rows.filter((p) => p[key]?.state === "OBSERVED");
    if (measured.length) {
      chosen = measured.reduce((a, b) => (a[key].value <= b[key].value ? a : b));
      chosen.best = false;
      chosen.selected_by = key;
    }
  }
  return {
    plans: rows,
    criterion: criterion || null,
    selected: chosen ? chosen.id : null,
    best: null,
    more_capabilities_is_not_better: true,
    live: false
  };
}

export function minimumSufficient({ requirements = [], compositions = [] } = {}) {
  const need = names(requirements);
  const feasible = (Array.isArray(compositions) ? compositions : []).filter((c) => {
    const have = new Set(c.capabilities || []);
    return need.every((n) => have.has(n));
  });
  feasible.sort((a, b) => (a.capabilities?.length || 0) - (b.capabilities?.length || 0));
  return {
    selected: feasible[0] || null,
    rejected: feasible.slice(1).map((c) => c.id),
    more_capabilities_is_not_better: true,
    reason: feasible[0] ? "MINIMUM_SUFFICIENT" : "NONE_SUFFICIENT",
    live: false
  };
}

export function discoverPatterns({ executions = [] } = {}) {
  const groups = new Map();
  for (const ex of Array.isArray(executions) ? executions : []) {
    const key = names(ex.capabilities || []).sort().join("+") || "empty";
    const g = groups.get(key) || { capabilities: names(ex.capabilities || []), count: 0 };
    g.count += 1;
    groups.set(key, g);
  }
  const patterns = [...groups.values()]
    .filter((g) => g.count >= 2)
    .map((g) => ({
      kind: "PATTERN",
      capabilities: g.capabilities,
      count: g.count,
      status: "PROPOSED",
      truth: false,
      live: false
    }));
  return { patterns, proposed: true, truth: false, live: false };
}

export function remember({ kind = "HYPOTHESIS", claim = "", verified = false, at = null } = {}) {
  const k = MEMORY_KINDS.includes(str(kind).toUpperCase()) ? str(kind).toUpperCase() : "HYPOTHESIS";
  const asFact = k === "FACT" && verified === true;
  return {
    kind: asFact ? "FACT" : (k === "FACT" ? "HYPOTHESIS" : k),
    claim: str(claim),
    is_fact: asFact,
    is_hypothesis: !asFact && (k === "HYPOTHESIS" || k === "PATTERN" || (k === "FACT" && verified !== true)),
    verified: verified === true,
    temporal: temporalFact({ epistemic: asFact ? "VERIFIED" : "PROPOSED", at: at || ISO(), payload: { claim: str(claim), kind: asFact ? "FACT" : k } }),
    live: false
  };
}

export function zeroToOne({ unknown = null, measured = false, verified = false, productized = false } = {}) {
  let stage = "UNKNOWN";
  if (unknown) stage = "DISCOVERED";
  if (unknown && measured !== true && verified !== true) stage = unknown.experimented ? "EXPERIMENT" : "DISCOVERED";
  if (measured === true) stage = "MEASURED";
  if (verified === true && measured === true) stage = "VERIFIED";
  if (productized === true && verified === true) stage = "PRODUCTIZED";
  return {
    stages: ZERO_TO_ONE,
    stage,
    trusted: false,
    authorized: false,
    verified: verified === true && measured === true,
    live: false
  };
}

export function unknownMarket({ demand = "", products = [] } = {}) {
  const text = str(demand).toLowerCase();
  const existing = (Array.isArray(products) ? products : []).filter((p) => text && str(p.name || p).toLowerCase() && text.includes(str(p.name || p).toLowerCase()));
  return {
    demand: str(demand),
    existing_product: existing.length > 0,
    no_existing_product: existing.length === 0,
    no_solution: false,
    composition_possible: true,
    live: false
  };
}

export function diagnoseGap({ gap = "", authorized = false } = {}) {
  const repair = proposeRepair({ failure: gap, failure_class: "MISSING_CAPABILITY" });
  return {
    diagnosis: str(gap) || "MISSING_CAPABILITY",
    repair: authorized === true ? repair : { status: "WAITING_HUMAN", auto_repair: false },
    auto_repair: false,
    authority: false,
    live: false
  };
}

export function adaptiveCycle({
  tenantId = null,
  customerId = null,
  problem = "",
  capabilities = [],
  executions = [],
  constraints = {},
  products = []
} = {}) {
  const operated = operateProblem({ tenantId, customerId, problem, capabilities });
  const required = names(operated.capabilities || capabilities);
  const min = compositionRecord({ id: "comp_min", capabilities: required.slice(0, Math.min(3, required.length || 3)) });
  const verified = compositionRecord({
    id: "comp_verified",
    capabilities: [...new Set([...required, "verification"])]
  });
  const heavy = compositionRecord({
    id: "comp_heavy",
    capabilities: [...new Set([...required, "verification", "github", "research"])]
  });
  const plans = [min, verified, heavy];
  const gated = plans.map((p) => ({ plan: p, constraint: constrain({ composition: p, constraints }) }));
  const feasible = gated.filter((g) => g.constraint.ok).map((g) => g.plan);
  const compared = compareCompositions(feasible);
  const sufficient = minimumSufficient({ requirements: required.slice(0, 3), compositions: feasible.length ? feasible : plans });
  const patterns = discoverPatterns({ executions });
  const market = unknownMarket({ demand: problem, products });
  const learned = recordLearningObservation({ capability: required[0] || null, outcome: null, cost: null });
  const experiment = compositionExperiment({ a: { capability: required.length }, b: { capability: 1 }, measured: false });
  return {
    version: ADAPTIVE_VERSION,
    cycle: ["OBSERVE", "DISCOVER", "QUALIFY", "COMPOSE", "TEST", "PRODUCTIZE", "OFFER", "SELL", "EXECUTE", "MEASURE", "LEARN", "RECOMPOSE"],
    operated: { request_id: operated.request?.request_id || operated.customer?.customer_id || null, capabilities: required },
    compositions: plans,
    constraints: gated.map((g) => g.constraint),
    compared,
    sufficient,
    patterns,
    market,
    experiment,
    learned: { ...learned, promoted: false },
    more_capabilities_is_not_better: true,
    potential_not_actual: true,
    live: false
  };
}

export function admitUnknown({ provider, model, capabilities = [] } = {}) {
  if (!provider || !model) {
    return { class: "UNKNOWN_CAPABILITY", discovery_required: true, trusted: false, authorized: false, live: false };
  }
  const intel = discoverUnknownIntelligence({ provider, model, capabilities });
  const path = zeroToOne({ unknown: intel });
  return {
    intelligence: intel,
    path,
    trusted: false,
    authorized: false,
    verified: false,
    live: false
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = adaptiveCycle({ problem: "Need analysis of a github workflow" });
  console.log(JSON.stringify({
    version: ADAPTIVE_VERSION,
    sufficient: r.sufficient.reason,
    market: r.market.no_solution,
    live: false
  }));
}
