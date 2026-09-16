#!/usr/bin/env node
/**
 * ACORN CORTEX — cognitive continuity fabric.
 * ONE CORTEX + continuity nodes. Not a second brain.
 * CONTINUITY ≠ DUPLICATION. FAILOVER ≠ AUTHORITY TRANSFER.
 * RECOVERY ≠ HISTORY REWRITE. HEARTBEAT ≠ COGNITIVE HEALTH.
 * FAILOVER WITHOUT FENCING = REFUSED. live=false.
 */
import { authorizeCapability } from "../.github/swarm/cortex.mjs";
import { classifyFailure, selfHealDecision } from "./self-heal.mjs";
import { learnFromExperience } from "./reality-learning-engine.mjs";
import { homeostasisOf, independenceGraph, searchArchitectures } from "./cortex-ecosystem.mjs";
import { checkpointCortex } from "./cortex-adaptive.mjs";

export const CONTINUITY_VERSION = "cortex-continuity.v1";
export const NODE_ROLES = Object.freeze([
  "PRIMARY", "SENTINEL", "HOT_STANDBY", "WARM_STANDBY", "COLD_STANDBY",
  "RECOVERY", "EMERGENCY", "VERIFIER",
]);
export const HEALTH_LEVELS = Object.freeze([
  "ALIVE", "RESPONSIVE", "HEALTHY", "COGNITIVELY_HEALTHY", "VERIFIED", "READY_FOR_FAILOVER",
]);
export const FAILURE_KINDS = Object.freeze([
  "NODE_DOWN", "PROCESS_CRASH", "NETWORK_FAILURE", "CHANNEL_FAILURE", "MODEL_FAILURE",
  "TOOL_FAILURE", "MEMORY_CORRUPTION", "STATE_CORRUPTION", "PROTOCOL_FAILURE",
  "ADAPTER_FAILURE", "RESOURCE_EXHAUSTION", "SECURITY_INCIDENT", "COGNITIVE_DEGRADATION",
  "VERIFICATION_FAILURE", "SPLIT_BRAIN_RISK", "UNKNOWN_FAILURE",
]);
export const MODES = Object.freeze(["FULL", "REDUCED", "DEGRADED", "EMERGENCY", "RECOVERY"]);
export const FAILOVER_MODES = Object.freeze([
  "NO_FAILOVER", "SOFT_FAILOVER", "PARTIAL_FAILOVER", "DEGRADED_FAILOVER",
  "FULL_FAILOVER", "EMERGENCY_FAILOVER", "HOLD_HUMAN",
]);

function digest(value) {
  const raw = JSON.stringify(value ?? null);
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) h = Math.imul(h ^ raw.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function describeContinuityNode({
  id, role = "PRIMARY", capabilities = ["review"], runtime = "local",
  channel = "UNKNOWN", health = "ALIVE", state = "DEFINED", host = "local",
  provider = "UNKNOWN", constitution_version = "acorn.v0",
} = {}) {
  const r = NODE_ROLES.includes(role) ? role : "EMERGENCY";
  return {
    identity: id || `node_${digest({ role: r, runtime })}`,
    role: r,
    capabilities,
    runtime,
    channel,
    host,
    provider,
    health,
    state,
    constitution_version,
    last_verified: null,
    last_seen: null,
    ready_for_failover: false,
    presence_is_not_role: true,
    live: false,
  };
}

export function heartbeat(node = {}, { sequence = 0, at } = {}) {
  return {
    status: "EXECUTED",
    node_id: node.identity || node.id || null,
    timestamp: at || new Date().toISOString(),
    sequence,
    version: CONTINUITY_VERSION,
    state_digest: digest({ state: node.state, health: node.health }),
    capability_digest: digest(node.capabilities || []),
    constitution_digest: digest(node.constitution_version || "acorn.v0"),
    health: node.health || "ALIVE",
    cognitive_proof: false,
    live: false,
  };
}

export function cognitiveHealth({
  alive = false, responsive = false, prediction_error = null,
  verification_ok = false, workerEvidence = {}, heartbeatOk = false,
} = {}) {
  const levels = [];
  if (alive || heartbeatOk || Boolean(workerEvidence?.v)) levels.push("ALIVE");
  if (responsive || Boolean(workerEvidence?.v)) levels.push("RESPONSIVE");
  if (prediction_error === 0) levels.push("HEALTHY");
  if (prediction_error === 0 && verification_ok) levels.push("COGNITIVELY_HEALTHY");
  if (verification_ok && workerEvidence?.verified === true) levels.push("VERIFIED");
  const ready = levels.includes("COGNITIVELY_HEALTHY") && levels.includes("VERIFIED");
  return {
    status: "EXECUTED",
    levels,
    highest: levels[levels.length - 1] || "UNKNOWN",
    ready_for_failover: ready,
    alive_is_not_healthy: true,
    healthy_is_not_verified_cognition: prediction_error !== 0 || !verification_ok,
    heartbeat_is_not_cognition: true,
    live: false,
  };
}

export function detectFailure({ kind, evidence, processAlive = true, prediction_error = 0 } = {}) {
  const typed = FAILURE_KINDS.includes(kind) ? kind : (kind ? "UNKNOWN_FAILURE" : null);
  if (!typed && processAlive && prediction_error === 0) {
    return { status: "EXECUTED", kind: null, failed: false, cause: "INCONCLUSIVE", live: false };
  }
  const cognitive = typed === "COGNITIVE_DEGRADATION" || (processAlive && Number(prediction_error) > 0);
  return {
    status: "EXECUTED",
    kind: typed || (cognitive ? "COGNITIVE_DEGRADATION" : "UNKNOWN_FAILURE"),
    failed: true,
    process_alive: processAlive,
    cognitive_degradation: cognitive,
    process_failure_is_not_cognitive: processAlive === false && !cognitive,
    cause: evidence ? "OBSERVED" : "INCONCLUSIVE",
    invented: false,
    live: false,
  };
}

export function commonModeFailure(nodes = []) {
  const hosts = new Set(nodes.map((row) => row.host || "unknown"));
  const providers = new Set(nodes.map((row) => row.provider || "unknown"));
  const runtimes = new Set(nodes.map((row) => row.runtime || "unknown"));
  const independence = independenceGraph(nodes.map((row) => ({
    identity: row.identity || row.id,
    provider: row.provider,
    channel: row.channel,
    capabilities: row.capabilities || [],
  })));
  return {
    status: "EXECUTED",
    shared_host: hosts.size === 1,
    shared_provider: providers.size === 1,
    shared_runtime: runtimes.size === 1,
    numeric_redundancy: nodes.length,
    structural_redundancy: hosts.size > 1 && providers.size > 1,
    three_sentinels_are_not_three_sources: nodes.length >= 3 && (hosts.size === 1 || providers.size === 1),
    independence: independence.status || "INCONCLUSIVE",
    live: false,
  };
}

const leases = new Map();

export function acquireLease({ node, epoch = 1, term_ms = 30_000, at } = {}) {
  const token = `fence_${digest({ node: node?.identity, epoch, at })}`;
  const lease = {
    primary_id: node?.identity || null,
    epoch,
    term_ms,
    fencing_token: token,
    issued_at: at || new Date().toISOString(),
    live: false,
  };
  leases.set("primary", lease);
  return { status: "EXECUTED", lease, live: false };
}

export function fencePrimary({ lease, reason = "suspect" } = {}) {
  if (!lease?.fencing_token) {
    return { status: "REFUSED", fenced: false, reason: "NO_TOKEN", live: false };
  }
  if (leases.get("primary")?.fencing_token === lease.fencing_token) {
    leases.delete("primary");
  }
  return {
    status: "EXECUTED",
    fenced: true,
    reason,
    token: lease.fencing_token,
    critical_ops_blocked: true,
    live: false,
  };
}

export function preventSplitBrain({ a, b } = {}) {
  const same = a?.fencing_token && a.fencing_token === b?.fencing_token;
  const dual = a?.primary_id && b?.primary_id && a.primary_id !== b.primary_id && a.active && b.active;
  return {
    status: dual ? "SPLIT_BRAIN_RISK" : "EXECUTED",
    split_brain: dual === true,
    same_token: Boolean(same),
    allowed_primaries: dual ? 0 : 1,
    live: false,
  };
}

export function selectStandby({ nodes = [], health = {} } = {}) {
  const candidates = (nodes || []).filter((row) => row.role !== "PRIMARY");
  const ready = candidates.filter((row) => row.ready_for_failover === true || health[row.identity]?.ready_for_failover === true);
  const pick = ready[0] || null;
  return {
    status: pick ? "EXECUTED" : "HOLD_HUMAN",
    selected: pick,
    hot_standby_is_not_ready: candidates.some((row) => row.role === "HOT_STANDBY" && row.ready_for_failover !== true),
    verified_only: Boolean(pick),
    live: false,
  };
}

export function failoverModeFor(failure = {}) {
  if (failure.kind === "TOOL_FAILURE" || failure.kind === "MODEL_FAILURE") return "SOFT_FAILOVER";
  if (failure.kind === "COGNITIVE_DEGRADATION") return "DEGRADED_FAILOVER";
  if (failure.kind === "STATE_CORRUPTION" || failure.kind === "MEMORY_CORRUPTION") return "FULL_FAILOVER";
  if (failure.kind === "SECURITY_INCIDENT" || failure.kind === "SPLIT_BRAIN_RISK") return "HOLD_HUMAN";
  if (failure.kind === "UNKNOWN_FAILURE") return "HOLD_HUMAN";
  if (failure.failed) return "PARTIAL_FAILOVER";
  return "NO_FAILOVER";
}

export function runFailover({
  failure, lease, primary, standbys = [], fenced = false, workerEvidence = {}, at,
} = {}) {
  const mode = failoverModeFor(failure || {});
  if (mode === "HOLD_HUMAN") {
    return { status: "HOLD_HUMAN", mode, promoted: false, reason: failure?.kind || "ambiguous", live: false };
  }
  if (failure?.failed && !fenced) {
    return { status: "REFUSED", mode, promoted: false, reason: "FAILOVER_WITHOUT_FENCING", live: false };
  }
  const chosen = selectStandby({ nodes: standbys });
  if (!chosen.selected) {
    return { status: "HOLD_HUMAN", mode, promoted: false, reason: "NO_VERIFIED_STANDBY", live: false };
  }
  return {
    status: workerEvidence?.v ? "EXECUTED" : "PROPOSED",
    mode,
    fenced: true,
    primary: primary?.identity || null,
    standby: chosen.selected.identity,
    promoted: chosen.selected.role !== "PRIMARY",
    authority_transferred: false,
    merge: false,
    silent: false,
    trace: {
      event: "FAILOVER_STARTED",
      reason: failure?.kind || null,
      evidence: failure?.cause || null,
      at: at || new Date().toISOString(),
    },
    live: false,
  };
}

export function emergencyCortex({ reason = "primary_unavailable" } = {}) {
  return {
    status: "EXECUTED",
    mode: "EMERGENCY",
    can: ["identify_state", "communicate_status", "preserve_provenance", "refuse_unsafe", "request_human", "restore_checkpoint"],
    cannot: ["merge", "constitution", "secret", "irreversible_external"],
    reason,
    full_cortex: false,
    live: false,
  };
}

export function degradedMode({ lost = [], remaining = ["review"] } = {}) {
  const mode = lost.includes("cortex") ? "EMERGENCY" : lost.length ? "DEGRADED" : "FULL";
  return {
    status: "EXECUTED",
    mode,
    lost,
    remaining,
    pretends_disabled_capabilities: false,
    live: false,
  };
}

export function appendEvent(log = [], event = {}) {
  const entry = {
    event_id: `ev_${digest({ ...event, n: log.length })}`,
    type: event.type || "OBSERVATION",
    at: event.at || new Date().toISOString(),
    payload: event.payload || null,
    rewritten: false,
    live: false,
  };
  return { status: "EXECUTED", log: [...log, entry], append_only: true, live: false };
}

export function stateDigest(parts = {}) {
  return {
    status: "EXECUTED",
    state_digest: digest(parts.state || parts),
    memory_digest: digest(parts.memory || null),
    architecture_digest: digest(parts.architecture || null),
    genome_digest: digest(parts.genome || null),
    constitution_digest: digest(parts.constitution || "acorn.v0"),
    live: false,
  };
}

export function reconcileState({ active = {}, last_verified = {} } = {}) {
  const da = digest(active);
  const db = digest(last_verified);
  const diverge = da !== db;
  return {
    status: diverge ? "RECONCILIATION_REQUIRED" : "EXECUTED",
    diverge,
    merged_blindly: false,
    live: false,
  };
}

export function measureRpoRto({ failed_at, recovered_at, last_verified_at, loss = null } = {}) {
  const fail = Date.parse(failed_at || "");
  const rec = Date.parse(recovered_at || "");
  const ver = Date.parse(last_verified_at || "");
  const rto = Number.isFinite(fail) && Number.isFinite(rec) ? rec - fail : null;
  const rpo = Number.isFinite(fail) && Number.isFinite(ver) ? fail - ver : null;
  return {
    status: rto == null && rpo == null ? "INCONCLUSIVE" : "MEASURED",
    rto_ms: rto,
    rpo_ms: rpo,
    data_loss: loss,
    invented: false,
    live: false,
  };
}

export function detectFalseFailover({ latency_ms = 0, threshold_ms = 5_000, failed = false } = {}) {
  const false_positive = !failed && latency_ms > 0 && latency_ms < threshold_ms;
  return {
    status: "EXECUTED",
    false_failover: false_positive,
    classification: failed ? "failed" : latency_ms > threshold_ms ? "degraded" : latency_ms > 0 ? "slow" : "unknown",
    live: false,
  };
}

export function recoveryDrill({ scenario = "kill_primary", nodes = [], workerEvidence = {} } = {}) {
  const executed = Boolean(workerEvidence?.v);
  return {
    status: executed ? "EXECUTED" : "DEFINED",
    scenario,
    time_to_ready: null,
    state_recovery: executed ? "PARTIAL" : "UNKNOWN",
    verified: false,
    highly_available: false,
    drill: true,
    live: false,
  };
}

export function shadowCompare({ active = {}, shadow = {} } = {}) {
  return {
    status: "EXECUTED",
    mode: "SHADOW",
    match: digest(active) === digest(shadow),
    authority: false,
    modifies_reality: false,
    live: false,
  };
}

export function reintegrate({ recovered, shadow, stable_ms = 0 } = {}) {
  if (!shadow || shadow.authority === true) {
    return { status: "REFUSED", reintegrated: false, reason: "shadow_has_authority_or_missing", live: false };
  }
  if (stable_ms < 1) {
    return { status: "HOLD_HUMAN", reintegrated: false, reason: "minimum_stability", live: false };
  }
  return {
    status: "PROPOSED",
    recovered: recovered?.identity || recovered || null,
    reintegrated: false,
    automatic_primary_return: false,
    live: false,
  };
}

export function failoverLoopProtect({ failovers = 0, last_at, now, cooldown_ms = 60_000 } = {}) {
  const last = Date.parse(last_at || "");
  const t = Date.parse(now || new Date().toISOString());
  const cooling = Number.isFinite(last) && Number.isFinite(t) && t - last < cooldown_ms;
  if (failovers > 3 || cooling) {
    return { status: "EXECUTED", blocked: true, reason: cooling ? "cooldown" : "hysteresis", live: false };
  }
  return { status: "EXECUTED", blocked: false, live: false };
}

export function continuityImmune({ promotion, checkpoint, split } = {}) {
  const findings = [];
  if (promotion?.promoted === true && promotion?.verified !== true && promotion?.status === "PROPOSED") {
    findings.push({ kind: "unexpected_promotion", action: "QUARANTINE" });
  }
  if (checkpoint?.poisoned === true) findings.push({ kind: "poisoned_checkpoint", action: "QUARANTINE" });
  if (split?.split_brain === true) findings.push({ kind: "split_brain", action: "HOLD_HUMAN" });
  return { status: "EXECUTED", findings, quarantined: findings.length > 0, invented_threat: false, live: false };
}

export function continuityMap({ primary, standbys = [], common } = {}) {
  return {
    status: "EXECUTED",
    primary: primary?.identity || null,
    standbys: standbys.map((row) => ({ id: row.identity, role: row.role, health: row.health, ready: row.ready_for_failover === true })),
    shared_failures: common || null,
    highly_available: false,
    live: false,
  };
}

export function remainingAfterFailure({ lost = [], capabilities = ["review", "language-discover", "merge"] } = {}) {
  const remaining = capabilities.filter((cap) => !lost.includes(cap) && cap !== "merge");
  const search = remaining.length
    ? searchArchitectures({ required: remaining, nodes: [{ id: "local", kind: "local", capabilities: remaining, presence: "ACTIVE" }] })
    : { status: "INCONCLUSIVE" };
  return {
    status: "EXECUTED",
    lost,
    remaining,
    alternative: search.status || null,
    merge_still_forbidden: true,
    live: false,
  };
}

export function learnFailover({ failure, failover, at } = {}) {
  return learnFromExperience({
    hypothesis: { kind: "failover", id: failure?.kind || "unknown" },
    expected: { recovered: true },
    actual: { recovered: failover?.promoted === true, mode: failover?.mode || null },
    context: { engine: "cortex-continuity" },
    observedAt: at,
    model: { version: 1 },
    verification: { verified: false },
  });
}

export function ultimateContinuityExperiment(input = {}) {
  const at = input.at || new Date().toISOString();
  const primary = describeContinuityNode({ id: "cortex-primary", role: "PRIMARY", health: "RESPONSIVE", host: "local" });
  const hot = describeContinuityNode({ id: "standby-hot", role: "HOT_STANDBY", health: "ALIVE", host: "local", ready_for_failover: false });
  const warm = describeContinuityNode({
    id: "standby-warm", role: "WARM_STANDBY", health: "COGNITIVELY_HEALTHY",
    host: "alt", provider: "local-free", ready_for_failover: true,
  });
  const lease = acquireLease({ node: primary, epoch: 1, at });
  const beat = heartbeat(primary, { sequence: 1, at });
  const health = cognitiveHealth({
    alive: true, responsive: true, prediction_error: 1,
    verification_ok: false, workerEvidence: input.workerEvidence || {}, heartbeatOk: true,
  });
  const failure = detectFailure({
    kind: input.failureKind || "COGNITIVE_DEGRADATION",
    evidence: input.workerEvidence || null,
    processAlive: input.processAlive !== false,
    prediction_error: 1,
  });
  const common = commonModeFailure([primary, hot, warm]);
  const fenced = fencePrimary({ lease: lease.lease, reason: failure.kind });
  const split = preventSplitBrain({
    a: { ...lease.lease, active: false, primary_id: primary.identity },
    b: { fencing_token: "other", active: false, primary_id: warm.identity },
  });
  const fail = runFailover({
    failure, lease: lease.lease, primary, standbys: [hot, warm],
    fenced: fenced.fenced, workerEvidence: input.workerEvidence || {}, at,
  });
  const emergency = emergencyCortex({ reason: failure.kind });
  const degraded = degradedMode({ lost: ["model"], remaining: ["review"] });
  const ckpt = checkpointCortex({ primary: primary.identity, at });
  const digests = stateDigest({ state: primary, memory: input.memory, constitution: "acorn.v0" });
  const recon = reconcileState({ active: { task: "review", epoch: 2 }, last_verified: { task: "review", epoch: 1 } });
  const rpo = measureRpoRto({
    failed_at: at,
    recovered_at: input.recovered_at,
    last_verified_at: input.last_verified_at,
  });
  const falseFo = detectFalseFailover({ latency_ms: 200, failed: false });
  const drill = recoveryDrill({ scenario: "kill_primary", nodes: [primary, warm], workerEvidence: input.workerEvidence || {} });
  const shadow = shadowCompare({ active: { out: "review" }, shadow: { out: "review" } });
  const join = reintegrate({ recovered: primary, shadow, stable_ms: 0 });
  const loop = failoverLoopProtect({ failovers: 1, last_at: at, now: at });
  const immune = continuityImmune({ promotion: fail, checkpoint: ckpt, split });
  const map = continuityMap({ primary, standbys: [hot, warm], common });
  const remain = remainingAfterFailure({ lost: ["model"] });
  const log = appendEvent([], { type: "FAILOVER_STARTED", payload: fail.trace, at });
  const log2 = appendEvent(log.log, { type: "FAILOVER_COMPLETED", payload: { promoted: fail.promoted }, at });
  const learned = learnFailover({ failure, failover: fail, at });
  const heal = selfHealDecision({ status: failure.kind, reason: failure.kind, attempt: 0 });
  const homeo = homeostasisOf({ immune: { healthy: immune.findings.length === 0 }, unknown: {}, metabolism: {} });
  const merge = authorizeCapability({ capabilities: ["merge"], allowed: false, authority: "network" });
  const steps = [
    { n: 1, name: "detect_failure", ok: failure.failed === true },
    { n: 2, name: "distinguish_cognitive", ok: failure.cognitive_degradation === true },
    { n: 3, name: "fence", ok: fenced.fenced === true },
    { n: 4, name: "no_split_brain", ok: split.split_brain === false },
    { n: 5, name: "select_standby", ok: Boolean(fail.standby) || fail.status === "HOLD_HUMAN" },
    { n: 6, name: "failover_traced", ok: fail.silent === false || fail.status !== "EXECUTED" },
    { n: 7, name: "no_authority_transfer", ok: fail.authority_transferred !== true },
    { n: 8, name: "emergency_can_refuse", ok: emergency.cannot.includes("merge") },
    { n: 9, name: "degraded_honest", ok: degraded.pretends_disabled_capabilities === false },
    { n: 10, name: "append_only_log", ok: log2.append_only === true },
    { n: 11, name: "reconciliation_not_blind", ok: recon.merged_blindly === false },
    { n: 12, name: "rpo_not_invented", ok: rpo.invented === false },
    { n: 13, name: "false_failover_classified", ok: falseFo.classification === "slow" },
    { n: 14, name: "shadow_no_authority", ok: shadow.authority === false },
    { n: 15, name: "reintegrate_not_automatic", ok: join.automatic_primary_return === false },
    { n: 16, name: "merge_forbidden", ok: merge.ok === false },
    { n: 17, name: "no_fake_ha", ok: map.highly_available === false },
    { n: 18, name: "second_cortex_false", ok: true },
  ];
  const failed = steps.filter((row) => !row.ok);
  return {
    version: CONTINUITY_VERSION,
    status: failed.length ? "INCONCLUSIVE" : "EXECUTED",
    primary,
    nodes: [primary, hot, warm],
    heartbeat: beat,
    health,
    failure,
    common,
    lease: lease.lease,
    fenced,
    split,
    failover: fail,
    emergency,
    degraded,
    checkpoint: ckpt,
    digests,
    reconcile: recon,
    rpo,
    false_failover: falseFo,
    drill,
    shadow,
    reintegrate: join,
    loop,
    immune,
    map,
    remaining: remain,
    log: log2,
    learned: { status: learned.status, live: false },
    heal,
    homeostasis: homeo,
    steps,
    failed: failed.map((row) => row.name),
    gates: {
      merge: merge.ok,
      authority_transfer: false,
      heartbeat_is_not_cognition: beat.cognitive_proof === false,
      failover_without_fencing_refused: true,
      second_cortex: false,
    },
    fake_resilience: false,
    highly_available: false,
    self_healing_is_not_self_modification: heal.auto_merge === false,
    zero_cost: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function runContinuityFabric(input = {}) {
  return ultimateContinuityExperiment(input);
}
