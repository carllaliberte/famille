/** ACORN — SELF OPTIMIZATION ENGINE
 * Self-optimization means measured improvement toward explicit objectives.
 * It never grants authority, spends money, signs contracts, merges, or touches Breaker.
 * DEFINED ≠ TEST VERIFIED ≠ EXECUTED ≠ MEASURED ≠ LIVE VERIFIED.
 */
export const CONTRACT = "acorn.self-optimization.v1";
export const OBJECTIVES = Object.freeze([
  "CUSTOMER_VALUE",
  "RELIABILITY",
  "QUALITY",
  "LATENCY",
  "COST_EFFICIENCY",
  "REUSE",
  "REVENUE",
  "RISK_REDUCTION",
  "LEARNING_RATE"
]);
export const CONSTITUTION_FLAGS = Object.freeze([
  "breaker_touched",
  "authority_transfer",
  "auto_merge",
  "auto_spend",
  "auto_signature"
]);

const arr = (v) => (Array.isArray(v) ? v : []);
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

function finite(v) {
  return v != null && v !== "" && Number.isFinite(Number(v));
}

export function constitutionFlags(source = {}) {
  return {
    breaker_touched: source.breaker_touched === true,
    authority_transfer: source.authority_transfer === true,
    auto_merge: source.auto_merge === true,
    auto_spend: source.auto_spend === true,
    auto_signature: source.auto_signature === true
  };
}

export function defineObjective({ name, weight = 1, direction = "MAX", target = null, scope = "acorn" } = {}) {
  if (!OBJECTIVES.includes(name)) throw new Error("OBJECTIVE_UNSUPPORTED");
  if (weight <= 0) throw new Error("OBJECTIVE_WEIGHT_INVALID");
  if (!["MAX", "MIN"].includes(direction)) throw new Error("OBJECTIVE_DIRECTION_INVALID");
  return { name, weight, direction, target, scope, state: "DEFINED" };
}

export function observePerformance({ objective, baseline, current, evidence = [], cost = 0, risk = 0 } = {}) {
  if (!finite(baseline) || !finite(current)) {
    return {
      objective,
      baseline,
      current,
      delta: null,
      evidence: arr(evidence),
      cost: num(cost),
      risk: num(risk),
      state: "DEFINED",
      measured_at: null
    };
  }
  const b = Number(baseline);
  const c = Number(current);
  return {
    objective,
    baseline: b,
    current: c,
    delta: c - b,
    evidence: arr(evidence),
    cost: num(cost),
    risk: num(risk),
    state: "MEASURED",
    measured_at: new Date().toISOString()
  };
}

export function scoreOptimization({ objectives = [], measurements = [] } = {}) {
  const by = new Map(arr(measurements).map((m) => [m.objective, m]));
  let total = 0;
  let scored = 0;
  for (const o of objectives) {
    const m = by.get(o.name);
    if (!m || !finite(m.delta)) continue;
    const improvement = o.direction === "MAX" ? Number(m.delta) : -Number(m.delta);
    total += o.weight * improvement;
    scored += 1;
  }
  return {
    score: scored ? total : 0,
    objectives: arr(objectives).map((o) => o.name),
    measurements: arr(measurements).length,
    scored,
    state: scored ? "MEASURED" : "DEFINED"
  };
}

export function proposeOptimization({
  current_state,
  objectives = [],
  measurements = [],
  candidate,
  expected_gain = 0,
  expected_cost = 0,
  risk = "UNKNOWN",
  evidence = []
} = {}) {
  const score = scoreOptimization({ objectives, measurements });
  const proposal = {
    contract: CONTRACT,
    current_state,
    candidate,
    expected_gain: num(expected_gain),
    expected_cost: num(expected_cost),
    expected_net: num(expected_gain) - num(expected_cost),
    risk,
    evidence: arr(evidence),
    baseline_score: score.score,
    state: "PROPOSED",
    requires_measurement: true,
    requires_human_authorization: true,
    authority: false,
    live: false,
    ...constitutionFlags(),
    created_at: new Date().toISOString()
  };
  assertSelfOptimizationConstitution(proposal);
  return proposal;
}

export function compareOutcomes({ before, after, objectives = [] } = {}) {
  const measurements = arr(objectives).map((o) =>
    observePerformance({
      objective: o.name,
      baseline: before?.[o.name],
      current: after?.[o.name],
      evidence: ["OBSERVED_OUTCOME"]
    })
  );
  return scoreOptimization({ objectives, measurements });
}

export function acceptOptimization({ proposal, measured_gain, minimum_gain = 0 } = {}) {
  if (!proposal || proposal.state !== "PROPOSED") throw new Error("PROPOSAL_REQUIRED");
  assertSelfOptimizationConstitution(proposal);
  return {
    ...proposal,
    measured_gain: num(measured_gain),
    accepted: num(measured_gain) > num(minimum_gain),
    state: "MEASURED_OUTCOME",
    authority: false,
    live: false,
    ...constitutionFlags(proposal)
  };
}

export function authorizeOptimization({ proposal, human_authorized = false } = {}) {
  if (!proposal || proposal.state !== "PROPOSED") throw new Error("PROPOSAL_REQUIRED");
  assertSelfOptimizationConstitution(proposal);
  return {
    ...proposal,
    state: human_authorized ? "AUTHORIZED" : "HOLD_HUMAN",
    authorized: Boolean(human_authorized),
    requires_human_authorization: !human_authorized,
    authority: false,
    live: false,
    executed: false,
    ...constitutionFlags(proposal)
  };
}

/** Pose APPLIED_IN_MEMORY. Pas un effet réel. Exige authorize(), pas un score. */
export function applyOptimization({ proposal } = {}) {
  if (!proposal || proposal.state !== "AUTHORIZED") throw new Error("AUTHORIZATION_REQUIRED");
  assertSelfOptimizationConstitution(proposal);
  return {
    ...proposal,
    state: "APPLIED_IN_MEMORY",
    live: false,
    executed: false,
    external_effect: false,
    authority: false,
    ...constitutionFlags(proposal)
  };
}

export function learnOptimization({ history = [] } = {}) {
  const successful = arr(history).filter((x) => x.accepted);
  const learned = {
    successful_count: successful.length,
    patterns: [...new Set(successful.map((x) => x.candidate).filter(Boolean))],
    state: "LEARNED",
    authority: false,
    live: false,
    ...constitutionFlags()
  };
  assertSelfOptimizationConstitution(learned);
  return learned;
}

export function reuseOptimization({ learning, candidate } = {}) {
  if (!learning || learning.state !== "LEARNED") throw new Error("LEARNING_REQUIRED");
  if (!arr(learning.patterns).includes(candidate)) throw new Error("PATTERN_NOT_MEASURED");
  return {
    candidate,
    state: "REUSED_AS_HYPOTHESIS",
    live: false,
    requires_measurement: true,
    authority: false,
    ...constitutionFlags()
  };
}

export function assertSelfOptimizationConstitution(snapshot) {
  if (snapshot == null || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error("CONSTITUTION_SNAPSHOT_REQUIRED");
  }
  for (const key of CONSTITUTION_FLAGS) {
    if (!Object.hasOwn(snapshot, key)) throw new Error("CONSTITUTION_SNAPSHOT_REQUIRED");
  }
  if (snapshot.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
  if (snapshot.authority_transfer) throw new Error("SELF_OPTIMIZATION_CANNOT_GRANT_AUTHORITY");
  if (snapshot.auto_merge) throw new Error("AUTO_MERGE_FORBIDDEN");
  if (snapshot.auto_spend) throw new Error("AUTO_SPEND_FORBIDDEN");
  if (snapshot.auto_signature) throw new Error("AUTO_SIGNATURE_FORBIDDEN");
  return true;
}
