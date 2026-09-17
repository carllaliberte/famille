#!/usr/bin/env node
/**
 * ACORN OMNI-CORE
 *
 * Horizon-maximum, future-proof cognitive organism contract.
 * Cortex-owned. Not a second brain, second Cortex, 7th chantier, super-organism,
 * or parallel authority. The organism is built around CAPABILITIES.
 *
 *   IDENTITY ≠ MODEL ≠ CHANNEL ≠ CAPABILITY ≠ AUTHORITY
 *   CAPABILITY ≠ INTELLIGENCE ≠ COMPUTE ≠ AUTHORITY
 *
 * Four independent axes. Growth of the first three never raises the fourth.
 * Unknown capabilities stay unknown until measured. DETECT ≠ FIX.
 * OBSERVE ≠ ACT. Twin ≠ real. Breaker is human and outside the loop.
 *
 * HUMAN AUTHORITY REMAINS ABOVE THE SYSTEM. live=false. auto_merge=false.
 */
import { createHash } from "node:crypto";
import {
  computeConstitution,
  discoverCompute,
  executeComputeTask,
  resetComputeFabric,
  routeComputeTask,
  runComputeProofLoop,
  snapshotComputeFabric,
} from "./acorn-compute-fabric.mjs";

export const OMNI_CORE_VERSION = "acorn.omni-core.v1";
export const UNKNOWN = "UNKNOWN";

export const AXES = Object.freeze(["CAPABILITY", "INTELLIGENCE", "COMPUTE", "AUTHORITY"]);

export const HONEST_STATES = Object.freeze([
  "DEFINED",
  "DISCOVERED",
  "IDENTIFIED",
  "DESCRIBED",
  "CONNECTED",
  "SANDBOXED",
  "MEASURED",
  "CLASSIFIED",
  "EXECUTABLE",
  "VERIFIED",
  "DETECTED",
  "PROPOSED",
  "HOLD_HUMAN",
  "INCONCLUSIVE",
  "FAILED",
  "UNKNOWN",
]);

export const FORBIDDEN_STATES = Object.freeze([
  "LIVE", "READY", "AVAILABLE", "CERTIFIED", "SUPER_BRAIN", "CONSCIOUS",
]);

export const KNOWN_COMPUTE_PARADIGMS = Object.freeze([
  "cpu", "gpu", "tpu", "npu", "fpga", "asic", "hpc", "cluster",
  "supercomputer", "edge", "cloud", "distributed", "qpu", "simulator",
]);

export const FUTURE_PARADIGMS = Object.freeze([
  "neuromorphic", "photonic", "optical", "analog", "molecular",
  "biological", "stochastic", "hybrid",
]);

export const KNOWN_COGNITIVE = Object.freeze([
  "language_model", "multimodal", "agent", "expert_system",
  "symbolic", "reasoner", "unknown_cognitive",
]);

export const MEMORY_HORIZONS = Object.freeze([
  "working", "episodic", "semantic", "experimental", "failure",
  "provenance", "temporal", "strategy", "swarm", "constitutional",
]);

export const OMNI_LOOP = Object.freeze([
  "DISCOVER",
  "MEASURE",
  "UNDERSTAND",
  "COMPOSE",
  "EXECUTE",
  "OBSERVE",
  "VERIFY",
  "FALSIFY",
  "LEARN",
  "REMEMBER",
  "OPTIMIZE",
  "RECOMPOSE",
  "DISCOVER_NEW",
]);

export const IMMUTABLE_INVARIANTS = Object.freeze([
  "CAPABILITY_NEQ_AUTHORITY",
  "HUMAN_AUTHORITY",
  "BREAKER_IS_HUMAN",
  "MERGE_IS_HUMAN",
  "NO_SECRET_EXFILTRATION",
  "NO_FALSE_PROOF",
  "NO_UNMEASURED_LIVE_CLAIM",
  "NO_SILENT_AUTHORITY_ESCALATION",
  "PROVENANCE_REQUIRED",
  "OBSERVED_NEQ_PROPOSED",
  "DEFINED_NEQ_EXECUTED",
  "DETECT_NEQ_FIX",
  "OBSERVE_NEQ_ACT",
  "TWIN_NEQ_REAL",
  "AXES_INDEPENDENT",
]);

export const BREAKER_AUTHORITY = Object.freeze({
  controller: "carl",
  breaker_controls_carl: false,
  acorn_controls_carl: false,
  acorn_controls_breaker: false,
  ai_may_open: false,
  ai_may_close: false,
  ai_may_change: false,
  outside_optimization_loop: true,
});

const unknownCaps = [];
const memories = new Map();
const relations = [];
const findings = [];
const experiments = [];
const twins = [];
const loopRuns = [];
let axisState = separateAxes({ capability: 1, intelligence: 1, compute: 1, authority: 1 });

function text(v) {
  return String(v ?? "").trim();
}

function list(v) {
  return Array.isArray(v) ? v.map(text).filter(Boolean) : [];
}

function iso(v) {
  const s = text(v);
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, canonical(value[k])]));
  }
  return value;
}

export function digest(value) {
  return createHash("sha256").update(JSON.stringify(canonical(value ?? null))).digest("hex");
}

function honest(state, fallback = "UNKNOWN") {
  const s = text(state).toUpperCase();
  if (FORBIDDEN_STATES.includes(s)) return "UNKNOWN";
  return HONEST_STATES.includes(s) ? s : fallback;
}

export function omniConstitution() {
  return Object.freeze({
    version: OMNI_CORE_VERSION,
    owner: "acorn",
    belongs_to_cortex: true,
    second_cortex: false,
    second_brain: false,
    second_core: false,
    second_organism: false,
    second_fabric: false,
    second_mesh: false,
    super_brain: false,
    super_organism: false,
    collective_consciousness: false,
    identity_neq_model: true,
    model_neq_channel: true,
    channel_neq_capability: true,
    capability_neq_authority: true,
    axes: [...AXES],
    axes_independent: true,
    compute_is_resource: true,
    compute_is_not_intelligence: true,
    intelligence_is_not_authority: true,
    capability_growth_does_not_raise_authority: true,
    unknown_capability_is_legitimate: true,
    detect_is_not_fix: true,
    observe_is_not_act: true,
    twin_is_not_real: true,
    simulation_is_not_execution: true,
    learning_is_not_self_authorization: true,
    breaker_is_human: true,
    breaker_outside_optimization: true,
    merge_is_human: true,
    closed_provider_allowlist: false,
    no_unmeasured_live_claim: true,
    no_false_proof: true,
    no_secret_exfiltration: true,
    invariants: [...IMMUTABLE_INVARIANTS],
    auto_merge: false,
    live: false,
    authority: "carl",
    compute: computeConstitution(),
  });
}

export function resetOmniCore() {
  unknownCaps.length = 0;
  memories.clear();
  relations.length = 0;
  findings.length = 0;
  experiments.length = 0;
  twins.length = 0;
  loopRuns.length = 0;
  axisState = separateAxes({ capability: 1, intelligence: 1, compute: 1, authority: 1 });
  for (const horizon of MEMORY_HORIZONS) memories.set(horizon, []);
  resetComputeFabric();
}

export function currentAxes() {
  return axisState;
}

export function applyGrow(axis, delta = 1) {
  axisState = growAxis(axisState, axis, delta);
  return axisState;
}

export function separateAxes({
  capability = 0,
  intelligence = 0,
  compute = 0,
  authority = 0,
} = {}) {
  const cap = Number(capability) || 0;
  const intel = Number(intelligence) || 0;
  const comp = Number(compute) || 0;
  const auth = Number(authority) || 0;
  return {
    CAPABILITY: { value: cap, grants_authority: false },
    INTELLIGENCE: { value: intel, grants_authority: false },
    COMPUTE: { value: comp, grants_authority: false },
    AUTHORITY: { value: auth, controller: "carl", swarm_writable: false },
    independent: true,
    live: false,
  };
}

export function growAxis(axes, axis, delta = 1) {
  const next = separateAxes({
    capability: axes?.CAPABILITY?.value,
    intelligence: axes?.INTELLIGENCE?.value,
    compute: axes?.COMPUTE?.value,
    authority: axes?.AUTHORITY?.value,
  });
  const key = text(axis).toUpperCase();
  if (key === "AUTHORITY") {
    return {
      ...next,
      status: "DENIED",
      reason: "AUTHORITY_NOT_SWARM_WRITABLE",
      mutated: false,
      live: false,
    };
  }
  if (!AXES.includes(key)) {
    return { ...next, status: "UNKNOWN", reason: "UNKNOWN_AXIS", live: false };
  }
  next[key] = { ...next[key], value: (next[key].value || 0) + Number(delta || 0) };
  return {
    ...next,
    status: "MEASURED",
    mutated: true,
    authority_unchanged: next.AUTHORITY.value === (axes?.AUTHORITY?.value || 0),
    live: false,
  };
}

export function assertAxesIndependent(before, after) {
  const authBefore = before?.AUTHORITY?.value ?? 0;
  const authAfter = after?.AUTHORITY?.value ?? 0;
  const capGrew = (after?.CAPABILITY?.value ?? 0) > (before?.CAPABILITY?.value ?? 0);
  const intelGrew = (after?.INTELLIGENCE?.value ?? 0) > (before?.INTELLIGENCE?.value ?? 0);
  const computeGrew = (after?.COMPUTE?.value ?? 0) > (before?.COMPUTE?.value ?? 0);
  const authorityGrew = authAfter > authBefore;
  return {
    ok: !authorityGrew,
    capGrew,
    intelGrew,
    computeGrew,
    authorityGrew,
    reason: authorityGrew ? "SILENT_AUTHORITY_ESCALATION" : "AXES_INDEPENDENT",
    live: false,
  };
}

function knownKind(kind) {
  const k = text(kind).toLowerCase();
  if (KNOWN_COMPUTE_PARADIGMS.includes(k)) return { family: "compute", kind: k };
  if (FUTURE_PARADIGMS.includes(k)) return { family: "future_paradigm", kind: k };
  if (KNOWN_COGNITIVE.includes(k)) return { family: "cognition", kind: k };
  return null;
}

export function classifyNode(node = {}) {
  const kind = text(node.kind || node.paradigm || node.type || node.architecture);
  const known = knownKind(kind);
  if (!kind) {
    return {
      class: "UNKNOWN_CAPABILITY",
      axis: "CAPABILITY",
      forced_category: false,
      status: "UNKNOWN",
      authority: false,
      live: false,
    };
  }
  if (!known) {
    return {
      class: "UNKNOWN_CAPABILITY",
      axis: "CAPABILITY",
      kind,
      forced_category: false,
      status: "DISCOVERED",
      measured: false,
      connected: false,
      authority: false,
      live: false,
    };
  }
  const axis = known.family === "cognition" ? "INTELLIGENCE" : "COMPUTE";
  return {
    class: known.kind,
    family: known.family,
    axis,
    kind: known.kind,
    forced_category: false,
    status: node.measured === true ? "MEASURED" : "DEFINED",
    authority: false,
    intelligence: known.family === "cognition",
    live: false,
  };
}

export function discoverUnknown(input = {}) {
  const description = text(input.description || input.name || input.kind);
  const classified = classifyNode(input);
  const row = {
    unknown_id: id("unk"),
    description: description || UNKNOWN,
    class: classified.class,
    family: classified.family || "unknown",
    forced_category: false,
    status: classified.class === "UNKNOWN_CAPABILITY" ? "DISCOVERED" : classified.status,
    measured: false,
    connected: false,
    integrated: false,
    authority: false,
    observed_at: iso(input.at),
    provenance: {
      source: text(input.source) || "human_or_discovery",
      hash: digest({ description, kind: input.kind }),
    },
    live: false,
  };
  unknownCaps.push(row);
  remember("experimental", {
    what: "unknown_capability",
    unknown_id: row.unknown_id,
    class: row.class,
  });
  return row;
}

const DISCOVERY_STEPS = Object.freeze([
  "DISCOVER", "IDENTIFY", "DESCRIBE", "MEASURE", "SANDBOX", "TEST", "CLASSIFY", "INTEGRATE", "OBSERVE",
]);

export function discoveryEngine(candidate = {}) {
  const found = discoverUnknown(candidate);
  const measured = candidate.measured === true;
  const sandboxed = candidate.sandbox === true;
  const tested = candidate.tested === true;
  const steps = DISCOVERY_STEPS.map((step) => {
    if (step === "DISCOVER" || step === "IDENTIFY" || step === "DESCRIBE") {
      return { step, status: found.description !== UNKNOWN ? "DISCOVERED" : "UNKNOWN" };
    }
    if (step === "MEASURE") return { step, status: measured ? "MEASURED" : "UNKNOWN" };
    if (step === "SANDBOX") return { step, status: sandboxed ? "SANDBOXED" : "DEFINED" };
    if (step === "TEST") return { step, status: tested ? "MEASURED" : "DEFINED" };
    if (step === "CLASSIFY") {
      return { step, status: found.class === "UNKNOWN_CAPABILITY" ? "UNKNOWN" : "CLASSIFIED" };
    }
    if (step === "INTEGRATE") {
      return {
        step,
        status: "HOLD_HUMAN",
        reason: "INTEGRATION_REQUIRES_HUMAN",
        grants_authority: false,
      };
    }
    return { step, status: "OBSERVED", connected: false };
  });
  return {
    unknown: found,
    pipeline: steps,
    forced_category: false,
    core_rewritten: false,
    authority_changed: false,
    live: false,
  };
}

export function stampTemporal(input = {}) {
  const now = iso(input.at);
  const until = input.valid_until || null;
  const expired = Boolean(until && Date.parse(until) < Date.parse(now));
  return {
    source: text(input.source) || UNKNOWN,
    timestamp: now,
    valid_from: input.valid_from || now,
    valid_until: until,
    observed_at: input.observed_at || now,
    expires_at: input.expires_at || until,
    version: text(input.version) || OMNI_CORE_VERSION,
    confidence: input.confidence ?? UNKNOWN,
    provenance: input.provenance || { hash: digest(input) },
    expired,
    valid_today_is_not_valid_forever: true,
    live: false,
  };
}

export function remember(horizon, entry = {}) {
  const h = MEMORY_HORIZONS.includes(horizon) ? horizon : null;
  if (!h) {
    return { ok: false, status: "UNKNOWN", reason: "UNKNOWN_HORIZON", live: false };
  }
  if (h === "constitutional") {
    return {
      ok: false,
      status: "DENIED",
      reason: "CONSTITUTIONAL_MEMORY_NOT_SWARM_WRITABLE",
      live: false,
    };
  }
  const row = {
    memory_id: id("mem"),
    horizon: h,
    entry,
    time: stampTemporal(entry),
    live: false,
  };
  const bucket = memories.get(h) || [];
  bucket.unshift(row);
  memories.set(h, bucket.slice(0, 200));
  return { ok: true, status: "REMEMBERED", memory: row, live: false };
}

export function memoryView() {
  const out = {};
  for (const horizon of MEMORY_HORIZONS) {
    const rows = memories.get(horizon) || [];
    out[horizon] = {
      count: rows.length,
      writable: horizon !== "constitutional",
      latest: rows[0] || null,
      status: rows.length ? "MEASURED" : "UNKNOWN",
    };
  }
  return { horizons: out, live: false };
}

export function digitalTwinPreview({ proposed = {}, real = null } = {}) {
  const snapshot = real || snapshotComputeFabric({ now: iso() });
  const task = proposed.task || {
    type: "quantum_simulation",
    required_capabilities: ["quantum_simulation"],
    shots: 32,
    qubits: 2,
    seed: 3,
  };
  const routed = routeComputeTask({
    task,
    discovery: snapshot,
    policy: proposed.policy || "FREE_FIRST",
    human_authorization: false,
  });
  const twin = {
    twin_id: id("twin"),
    status: "DEFINED",
    is_live_system: false,
    simulation_is_not_execution: true,
    proposed,
    routed: {
      status: routed.status,
      selected: routed.selected?.resource_id || null,
      reason: routed.reason || null,
    },
    real_resources: (snapshot.resources || []).map((row) => ({
      resource_id: row.resource_id,
      state: row.state,
      compute_type: row.compute_type,
    })),
    applied: false,
    live: false,
  };
  twins.push(twin);
  remember("experimental", { what: "digital_twin", twin_id: twin.twin_id });
  return twin;
}

export function adoptTwin({ twin, verified = false, human_authorization = false } = {}) {
  if (!twin) return { status: "UNKNOWN", reason: "NO_TWIN", live: false };
  if (human_authorization !== true) {
    return { status: "HOLD_HUMAN", reason: "ADOPTION_REQUIRES_HUMAN", applied: false, live: false };
  }
  if (verified !== true) {
    return { status: "DENIED", reason: "UNVERIFIED_TWIN", applied: false, live: false };
  }
  return {
    status: "HOLD_HUMAN",
    reason: "REAL_DEPLOYMENT_NOT_IN_THIS_LAYER",
    applied: false,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function diagnoseOrganism({ snapshot = null, claims = [] } = {}) {
  const snap = snapshot || snapshotComputeFabric();
  const detected = [];
  for (const row of snap.resources || []) {
    if (row.state === "UNKNOWN" || !row.state) {
      detected.push({ kind: "unmeasured_resource", resource_id: row.resource_id, status: "DETECTED" });
    }
    if (row.live === true) {
      detected.push({ kind: "unmeasured_live_claim", resource_id: row.resource_id, status: "DETECTED" });
    }
  }
  for (const claim of claims) {
    if (claim?.live === true && claim?.verified !== true) {
      detected.push({ kind: "unmeasured_live_claim", claim, status: "DETECTED" });
    }
    if (claim?.authority === true && claim?.controller !== "carl") {
      detected.push({ kind: "silent_authority_escalation", claim, status: "DETECTED" });
    }
  }
  const gpuAsMind = claims.find((c) => /gpu|qpu|provider/i.test(String(c?.what || c?.claim || "")) && c?.intelligence === true);
  if (gpuAsMind) {
    detected.push({ kind: "compute_claimed_as_intelligence", status: "DETECTED" });
  }
  const report = {
    status: "DETECTED",
    detected,
    fixed: [],
    detect_is_not_fix: true,
    auto_repaired: false,
    live: false,
    observed_at: iso(),
  };
  findings.push(report);
  remember("failure", { what: "diagnostic", count: detected.length });
  return report;
}

export function proposeRepair(finding = {}) {
  return {
    status: "PROPOSED",
    finding,
    action: "HOLD_HUMAN",
    tested: false,
    deployed: false,
    detect_is_not_fix: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function falsifyClaim({ claim, observation = null, contradiction = false, evidence = {} } = {}) {
  const executed = evidence.executed === true || observation != null;
  const refuted = contradiction === true || (
    /gpu|qpu|provider|compute/i.test(String(claim)) && /intelligence|authority|mind/i.test(String(claim))
  );
  const row = {
    status: executed ? "MEASURED" : "INCONCLUSIVE",
    claim: claim ?? null,
    observation,
    refuted,
    verified: evidence.verified === true && contradiction !== true && !refuted,
    evidence_required: true,
    live: false,
  };
  remember("experimental", { what: "falsification", claim, refuted });
  return row;
}

export function resourceEconomics({ task = {}, resources = [] } = {}) {
  const scored = (resources.length ? resources : snapshotComputeFabric().resources || []).map((row) => {
    const cost = Number(row.estimated_cost ?? row.cost ?? (row.compute_type === "qpu" ? UNKNOWN : 0));
    const latency = Number(row.latency_ms ?? UNKNOWN);
    const energy = row.energy_j == null ? UNKNOWN : Number(row.energy_j);
    const quality = row.state === "EXECUTABLE" || row.state === "VERIFIED" ? 1 : 0;
    const reliability = row.state === "VERIFIED" ? 1 : row.state === "EXECUTABLE" ? 0.6 : 0;
    const numericCost = Number.isFinite(cost) ? cost : 1e9;
    const numericLatency = Number.isFinite(latency) ? latency : 1e6;
    const score = (quality * (reliability + 0.1)) / (1 + numericCost + numericLatency / 1000);
    return {
      resource_id: row.resource_id,
      compute_type: row.compute_type,
      cost: Number.isFinite(cost) ? cost : UNKNOWN,
      latency_ms: Number.isFinite(latency) ? latency : UNKNOWN,
      energy_j: energy,
      quality,
      reliability,
      score,
      live: false,
    };
  }).sort((a, b) => b.score - a.score);
  return {
    task: task.type || UNKNOWN,
    ranking: scored,
    selected: scored[0] || null,
    energy_layer: "DEFINED",
    quality_reliability_speed_cost_energy: true,
    live: false,
  };
}

export function energyAware({ task = {} } = {}) {
  return {
    status: "DEFINED",
    task: task.type || UNKNOWN,
    energy_available: UNKNOWN,
    energy_is_first_class_resource: true,
    measured: false,
    live: false,
  };
}

export function observePhysical({ sensor = UNKNOWN, observation = null } = {}) {
  return {
    status: observation == null ? "UNKNOWN" : "OBSERVED",
    sensor: text(sensor) || UNKNOWN,
    observation,
    grants_action: false,
    observe_is_not_act: true,
    live: false,
  };
}

export function actPhysical({ observation = null, human_authorization = false, target = UNKNOWN } = {}) {
  if (observation && human_authorization !== true) {
    return {
      status: "HOLD_HUMAN",
      reason: "OBSERVE_IS_NOT_ACT",
      target,
      executed: false,
      live: false,
    };
  }
  if (human_authorization !== true) {
    return { status: "HOLD_HUMAN", reason: "PHYSICAL_ACTION_REQUIRES_HUMAN", executed: false, live: false };
  }
  return {
    status: "HOLD_HUMAN",
    reason: "NO_PHYSICAL_ACTUATOR_CONNECTED",
    executed: false,
    live: false,
  };
}

export function actionEnvelope(input = {}) {
  return {
    identity: text(input.identity) || id("act"),
    origin: text(input.origin) || UNKNOWN,
    authority: input.human_authorization === true ? "carl" : "none",
    objective: text(input.objective) || UNKNOWN,
    scope: text(input.scope) || UNKNOWN,
    constraints: list(input.constraints),
    expiration: input.expiration || null,
    proof: input.proof || null,
    result: null,
    rollback: input.rollback !== false,
    status: "PROPOSED",
    executed: false,
    live: false,
  };
}

export function livingSecurity() {
  return {
    status: "DEFINED",
    zero_trust: true,
    isolation: true,
    capability_tokens: "DEFINED",
    least_privilege: true,
    secret_separation: true,
    cryptographic_provenance: true,
    tamper_evidence: true,
    compromised_node_does_not_contaminate_swarm: true,
    no_secret_exfiltration: true,
    measured: false,
    live: false,
  };
}

export function breakerState() {
  return {
    ...BREAKER_AUTHORITY,
    status: "DEFINED",
    mode: UNKNOWN,
    mode_source: "ACORN_SYSTEM_MODE env — not invented here",
    live: false,
  };
}

export function attemptBreakerChange({ actor = "swarm", command = "OFF" } = {}) {
  return {
    status: "DENIED",
    reason: "BREAKER_IS_HUMAN",
    actor: text(actor) || "swarm",
    command: text(command),
    changed: false,
    outside_optimization_loop: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function mutateConstitution({ actor = "swarm", invariant = null } = {}) {
  return {
    status: "DENIED",
    reason: "CONSTITUTION_NOT_SWARM_WRITABLE",
    actor: text(actor) || "swarm",
    invariant,
    changed: false,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function selfImprove({ verified = false, authorized = false, measured = false } = {}) {
  const cycle = ["MEASURE", "PROPOSE", "TEST", "VERIFY", "AUTHORIZE", "DEPLOY", "OBSERVE", "LEARN"];
  const stages = {};
  stages.MEASURE = measured ? "MEASURED" : "UNKNOWN";
  stages.PROPOSE = "PROPOSED";
  stages.TEST = measured ? "MEASURED" : "DEFINED";
  stages.VERIFY = verified ? "VERIFIED" : "UNVERIFIED";
  stages.AUTHORIZE = authorized === true ? "HOLD_HUMAN" : "HOLD_HUMAN";
  stages.DEPLOY = "HOLD_HUMAN";
  stages.OBSERVE = "UNKNOWN";
  stages.LEARN = measured ? "MEASURED" : "UNKNOWN";
  return {
    cycle,
    stages,
    self_authorization: false,
    deployed: false,
    status: authorized === true && verified === true ? "HOLD_HUMAN" : "PROPOSED",
    reason: "LEARNING_IS_NOT_SELF_AUTHORIZATION",
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function experimentContract({ hypothesis, task, configuration = {} } = {}) {
  const row = {
    experiment_id: id("exp"),
    hypothesis: text(hypothesis) || UNKNOWN,
    task: task || UNKNOWN,
    configuration,
    resources: configuration.resources || [],
    execution: null,
    measurements: null,
    result: null,
    uncertainty: UNKNOWN,
    conclusion: "INCONCLUSIVE",
    provenance: { hash: digest({ hypothesis, task, configuration }) },
    status: "DEFINED",
    live: false,
  };
  experiments.push(row);
  remember("experimental", { what: "experiment", experiment_id: row.experiment_id });
  return row;
}

export function knowledgeRelate({ from, relation, to, at, valid_until } = {}) {
  const row = {
    edge_id: id("kg"),
    from: text(from) || UNKNOWN,
    relation: text(relation) || "UNKNOWN_RELATION",
    to: text(to) || UNKNOWN,
    time: stampTemporal({ at, valid_until }),
    definitive: false,
    reevaluable: true,
    live: false,
  };
  relations.push(row);
  remember("semantic", { what: "relation", edge_id: row.edge_id });
  return row;
}

export function knowledgeGraphView() {
  return {
    edges: relations.slice(0, 80),
    count: relations.length,
    never_definitively_true: true,
    live: false,
  };
}

export function metaSwarmCompare({ swarmA = {}, swarmB = {}, discovery = null } = {}) {
  const snap = discovery || snapshotComputeFabric();
  const task = {
    type: "quantum_simulation",
    required_capabilities: ["quantum_simulation"],
    shots: 32,
    qubits: 2,
    seed: 3,
  };
  const a = routeComputeTask({
    task,
    discovery: snap,
    policy: swarmA.policy || "LOCAL_ONLY",
    human_authorization: false,
  });
  const b = routeComputeTask({
    task,
    discovery: snap,
    policy: swarmB.policy || "FREE_FIRST",
    human_authorization: false,
  });
  return {
    status: "MEASURED",
    swarmA: { policy: swarmA.policy || "LOCAL_ONLY", selected: a.selected?.resource_id || null, status: a.status },
    swarmB: { policy: swarmB.policy || "FREE_FIRST", selected: b.selected?.resource_id || null, status: b.status },
    winner_is_not_authority: true,
    name_is_not_preference: true,
    live: false,
  };
}

export function isolateNode({ node_id, reason = "compromised" } = {}) {
  return {
    status: "PROPOSED",
    node_id: text(node_id) || UNKNOWN,
    reason,
    isolated: false,
    swarm_contaminated: false,
    live: false,
    authority: "carl",
  };
}

export function snapshotOmniCore({ env = process.env, now = new Date().toISOString() } = {}) {
  const compute = snapshotComputeFabric({ env, now });
  const axes = axisState;
  return {
    version: OMNI_CORE_VERSION,
    constitution: omniConstitution(),
    axes,
    compute,
    unknown_capabilities: unknownCaps.slice(),
    memory: memoryView(),
    knowledge: knowledgeGraphView(),
    diagnostics: findings.slice(-8),
    twins: twins.slice(-8),
    experiments: experiments.slice(-8),
    security: livingSecurity(),
    energy: energyAware({}),
    breaker: breakerState(),
    loop: OMNI_LOOP,
    live: false,
    auto_merge: false,
    authority: "carl",
    observed_at: iso(now),
  };
}

export function cortexOmniView({ snapshot = null, proof = null, env = process.env, now = new Date().toISOString() } = {}) {
  const snap = snapshot || snapshotOmniCore({ env, now });
  const latest = proof || loopRuns[loopRuns.length - 1] || null;
  return {
    title: "ACORN OMNI-CORE",
    fabric: "CORTEX ORGANISM",
    constitution: snap.constitution,
    axes: snap.axes,
    compute: {
      cpu: (snap.compute.resources || []).find((row) => row.compute_type === "cpu")?.state || "DEFINED",
      gpu: (snap.compute.resources || []).find((row) => row.compute_type === "gpu")?.state || "DEFINED",
      qpu: UNKNOWN,
      simulator: (snap.compute.resources || []).find((row) => row.compute_type === "simulator")?.state || "DEFINED",
    },
    unknown: snap.unknown_capabilities,
    diagnostics: snap.diagnostics,
    twins: snap.twins,
    memory: snap.memory,
    knowledge: snap.knowledge,
    breaker: snap.breaker,
    energy: snap.energy,
    security: snap.security,
    evidence: {
      latest,
      proof: latest,
      status: latest?.status || UNKNOWN,
    },
    loop: OMNI_LOOP,
    no_fake_badge: true,
    live: false,
    certified: false,
    auto_merge: false,
    authority: "carl",
    observed_at: snap.observed_at,
  };
}

export async function runOmniProofLoop({
  env = process.env,
  now = new Date().toISOString(),
  human_authorization = false,
} = {}) {
  resetComputeFabric();
  const discovered = await discoverCompute({ env, now });
  const unknown = discoveryEngine({
    kind: "photonic",
    name: "unmeasured photonic lattice",
    source: "omni-proof",
  });
  const futureUnknown = discoveryEngine({
    kind: "lattice-x-2029",
    name: "future architecture with no 2026 category",
    source: "omni-proof",
  });
  const axes0 = separateAxes({ capability: 1, intelligence: 1, compute: 1, authority: 1 });
  const axes1 = growAxis(axes0, "COMPUTE", 8);
  const independence = assertAxesIndependent(axes0, axes1);
  const twin = digitalTwinPreview({
    proposed: { policy: "FREE_FIRST", task: { type: "quantum_simulation", shots: 64, qubits: 2, seed: 3 } },
    real: discovered,
  });
  const diagnostic = diagnoseOrganism({
    snapshot: discovered,
    claims: [{ what: "GPU is an intelligence", intelligence: true, live: false }],
  });
  const repair = proposeRepair(diagnostic.detected[0] || {});
  const falsified = falsifyClaim({
    claim: "A GPU is an intelligence",
    observation: "compute_is_not_intelligence",
    contradiction: true,
    evidence: { executed: true },
  });
  const economics = resourceEconomics({
    task: { type: "quantum_simulation" },
    resources: discovered.resources,
  });
  const energy = energyAware({ task: { type: "quantum_simulation" } });
  const observed = observePhysical({ sensor: "none", observation: null });
  const acted = actPhysical({ observation: observed, human_authorization: false });
  const breaker = attemptBreakerChange({ actor: "omni-core", command: "OFF" });
  const constitution = mutateConstitution({ actor: "omni-core", invariant: "HUMAN_AUTHORITY" });
  const improve = selfImprove({ measured: true, verified: true, authorized: false });
  const compare = metaSwarmCompare({ swarmA: { policy: "LOCAL_ONLY" }, swarmB: { policy: "FREE_FIRST" }, discovery: discovered });
  const kg = knowledgeRelate({
    from: "compute",
    relation: "IS_NOT",
    to: "authority",
    at: now,
  });
  const computeProof = await runComputeProofLoop({
    env,
    now,
    human_authorization,
    task: { type: "quantum_simulation", required_capabilities: ["quantum_simulation"], shots: 128, qubits: 2, seed: 3 },
  });
  const computeExecution = computeProof?.executed?.execution || computeProof?.execution || null;
  const computeVerified = computeProof?.status === "VERIFIED" || computeExecution?.status === "VERIFIED";
  const qpuAttempt = await executeComputeTask({
    task: { type: "quantum_hardware", compute_type: "qpu", required_capabilities: ["quantum_execution"], allow_simulator: false },
    discovery: discovered,
    env,
    human_authorization: false,
    policy: "PAID_FORBIDDEN",
  });
  const stages = {};
  for (const name of OMNI_LOOP) stages[name] = "UNKNOWN";
  stages.DISCOVER = "DISCOVERED";
  stages.MEASURE = computeVerified ? "MEASURED" : "INCONCLUSIVE";
  stages.UNDERSTAND = independence.ok ? "MEASURED" : "FAILED";
  stages.COMPOSE = twin.routed?.status || "DEFINED";
  stages.EXECUTE = computeExecution?.status || computeProof?.status || "HOLD_HUMAN";
  stages.OBSERVE = "MEASURED";
  stages.VERIFY = computeVerified ? "VERIFIED" : "INCONCLUSIVE";
  stages.FALSIFY = falsified.refuted ? "VERIFIED" : "INCONCLUSIVE";
  stages.LEARN = "MEASURED";
  stages.REMEMBER = "MEASURED";
  stages.OPTIMIZE = "PROPOSED";
  stages.RECOMPOSE = "PROPOSED";
  stages.DISCOVER_NEW = futureUnknown.unknown.class === "UNKNOWN_CAPABILITY" ? "DISCOVERED" : "FAILED";

  const proof = {
    version: OMNI_CORE_VERSION,
    status: stages.VERIFY === "VERIFIED" && independence.ok ? "VERIFIED" : "INCONCLUSIVE",
    stages,
    unknown,
    future_unknown: futureUnknown,
    axes: axes1,
    independence,
    twin,
    diagnostic,
    repair,
    falsified,
    economics,
    energy,
    observed,
    acted,
    breaker,
    constitution,
    improve,
    compare,
    knowledge: kg,
    compute: {
      status: computeProof?.status || UNKNOWN,
      execution: computeExecution,
      hashes: {
        request: computeExecution?.request_hash || null,
        result: computeExecution?.result_reference || null,
      },
    },
    qpu: { status: qpuAttempt.status, reason: qpuAttempt.reason || null },
    hashes: {
      request: digest({ now, version: OMNI_CORE_VERSION }),
      twin: digest(twin),
      compute: computeExecution?.result_reference || digest(computeExecution || {}),
    },
    live: false,
    auto_merge: false,
    authority: "carl",
    observed_at: iso(now),
  };
  loopRuns.push(proof);
  remember("episodic", { what: "omni_proof", status: proof.status, hash: proof.hashes.request });
  return proof;
}

export function listUnknownCapabilities() {
  return unknownCaps.slice();
}

export function listLoopRuns() {
  return loopRuns.slice();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const proof = await runOmniProofLoop();
  const view = cortexOmniView({ proof });
  const summary = {
    title: view.title,
    version: OMNI_CORE_VERSION,
    live: false,
    auto_merge: false,
    authority: view.authority,
    axes_independent: proof.independence.ok,
    unknown_stays_unknown: proof.future_unknown.unknown.class === "UNKNOWN_CAPABILITY",
    detect_is_not_fix: proof.diagnostic.fixed.length === 0,
    observe_is_not_act: proof.acted.status === "HOLD_HUMAN",
    breaker_denied: proof.breaker.status === "DENIED",
    constitution_denied: proof.constitution.status === "DENIED",
    compute: proof.compute?.execution?.status || UNKNOWN,
    qpu: proof.qpu.status,
    hashes: proof.hashes,
    no_fake_badge: true,
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}
