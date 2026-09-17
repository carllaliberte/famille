#!/usr/bin/env node
/**
 * ACORN — ONE ORGANISM LOOP
 *
 * Composes the existing inventory, Cortex, Defense, learning and recovery
 * primitives into a single dated cycle. Not a second Cortex, Defense, runtime,
 * Breaker or Fabric.
 *
 * REALITY → PERCEIVE → UNDERSTAND → PLAN → ACT → MEASURE → FALSIFY
 * → PROTECT → CORRECT → VERIFY → LEARN → ADAPT → PROVE → CONTINUE
 *
 * A certainty is a dated state, not an essence.
 */
import { createHash } from "node:crypto";
import { learnCortexExperience } from "./cortex-learning-cycle.mjs";
import {
  adaptStrategy,
  composeCognitiveGraph,
  falsify,
  measureOutcome,
} from "./cortex-cognition.mjs";
import { metacognitionOf as cortexMetacognition } from "./cortex-organism.mjs";
import { hashEvidence } from "./acorn-defense.mjs";

export const ORGANISM_LOOP_VERSION = "acorn.organism-loop.v1";

export const ORGANISM_LOOP = Object.freeze([
  "PERCEIVE",
  "UNDERSTAND",
  "PLAN",
  "ACT",
  "MEASURE",
  "FALSIFY",
  "PROTECT",
  "CORRECT",
  "VERIFY",
  "LEARN",
  "ADAPT",
  "PROVE",
  "CONTINUE",
]);

export const TRUST_STATES = Object.freeze([
  "TRUSTED",
  "OBSERVED",
  "DEGRADED",
  "SUSPECT",
  "CONTAINED",
  "QUARANTINED",
  "RECOVERING",
  "RECOVERED",
  "EXPIRED",
  "UNKNOWN",
]);

export const KNOWLEDGE_KINDS = Object.freeze([
  "observed_fact",
  "measurement",
  "interpretation",
  "hypothesis",
  "prediction",
  "demonstrated_causality",
  "unknown_causality",
]);

export const DRIFT_KINDS = Object.freeze([
  "DOCS_AHEAD_OF_RUNTIME",
  "RUNTIME_AHEAD_OF_DOCS",
  "CONFIG_DRIFT",
  "CODE_DRIFT",
  "CAPABILITY_DRIFT",
  "RESOURCE_DRIFT",
  "TRUST_DRIFT",
  "TOPOLOGY_DRIFT",
]);

export const HEALTH_STATES = Object.freeze([
  "HEALTHY",
  "DEGRADED",
  "PROTECTED",
  "RECOVERING",
  "UNKNOWN",
]);

export const ADVERSARIAL_TARGETS = Object.freeze([
  "evidence",
  "provenance",
  "prediction",
  "recovery",
  "trust",
  "authority_boundary",
  "defense_invariant",
  "deployment_state",
]);

const text = (v) => String(v ?? "").trim();
const TRUST_TTL_MS = 1000 * 60 * 60 * 6;

export function organismConstitution() {
  return Object.freeze({
    version: ORGANISM_LOOP_VERSION,
    owner: "acorn",
    hierarchy: ["CARL", "BREAKER", "ACORN", "CORTEX", "RESOURCES"],
    one_loop: true,
    second_runtime: false,
    second_cortex: false,
    second_defense: false,
    second_breaker: false,
    second_fabric: false,
    cortex_belongs_to_acorn: true,
    defense_belongs_to_acorn: true,
    carl_controls_breaker: true,
    breaker_controls_carl: false,
    acorn_controls_carl: false,
    acorn_controls_breaker: false,
    capability_is_not_authority: true,
    identity_is_not_model: true,
    identity_is_not_channel: true,
    roster_is_not_presence: true,
    defined_is_not_executed: true,
    executed_is_not_verified: true,
    verified_is_not_live: true,
    prediction_is_not_observation: true,
    observation_is_not_causality: true,
    assertion_is_not_evidence: true,
    measurement_is_not_eternal_truth: true,
    learning_is_not_unverified_auto_modification: true,
    simulation_is_not_execution: true,
    certainty_has_an_expiry: true,
    silent_fallback: false,
    auto_merge: false,
    live: false,
    authority: "carl",
  });
}

export function organismProbe() {
  return {
    ok: true,
    version: ORGANISM_LOOP_VERSION,
    one_loop: true,
    second_runtime: false,
    second_cortex: false,
    second_defense: false,
    auto_merge: false,
    live: false,
    authority: "carl",
  };
}

export function inventoryProbe() {
  return organismProbe();
}


export function classifyKnowledgeKind(entry = {}) {
  const declared = text(entry.kind || entry.epistemic).toLowerCase();
  if (declared === "prediction" || entry.prediction === true) return "prediction";
  if (declared === "hypothesis" || entry.hypothesis === true) return "hypothesis";
  if (declared === "interpretation") return "interpretation";
  if (declared === "measurement" || entry.measured === true) return "measurement";
  if (entry.causality === true && entry.verified === true) return "demonstrated_causality";
  if (entry.causality === true) return "unknown_causality";
  if (entry.observed === true && entry.verified === true) return "observed_fact";
  if (entry.observed === true) return "measurement";
  return "hypothesis";
}

export function promoteKnowledge(entry = {}, { verified = false, causalProof = false } = {}) {
  const kind = classifyKnowledgeKind(entry);
  if (kind === "hypothesis" || kind === "prediction" || kind === "interpretation") {
    if (causalProof !== true) {
      return {
        ...entry,
        kind,
        promoted: false,
        reason: "HYPOTHESIS_IS_NOT_FACT",
        causality: "INCONCLUSIVE",
        live: false,
      };
    }
  }
  if (verified !== true) {
    return { ...entry, kind, promoted: false, reason: "UNVERIFIED", live: false };
  }
  return { ...entry, kind: causalProof ? "demonstrated_causality" : "observed_fact", promoted: true, live: false };
}

export function temporalState({
  created_at,
  observed_at,
  verified_at,
  expires_at,
  last_validated_at,
  now = new Date().toISOString(),
} = {}) {
  const nowMs = Date.parse(now);
  const exp = expires_at ? Date.parse(expires_at) : NaN;
  const expired = Number.isFinite(exp) && Number.isFinite(nowMs) && nowMs > exp;
  return {
    created_at: created_at || null,
    observed_at: observed_at || null,
    verified_at: verified_at || null,
    expires_at: expires_at || null,
    last_validated_at: last_validated_at || observed_at || null,
    expired,
    status: expired ? "EXPIRED" : verified_at ? "DATED_VERIFIED" : observed_at ? "DATED_OBSERVED" : "UNKNOWN",
    certainty_is_not_essence: true,
    live: false,
  };
}

export function deriveTrust({ entry = {}, now = new Date().toISOString(), ttlMs = TRUST_TTL_MS } = {}) {
  const observed = entry.observed_at || now;
  const expires_at = new Date(Date.parse(observed) + ttlMs).toISOString();
  const time = temporalState({
    created_at: entry.discovered_at || observed,
    observed_at: observed,
    verified_at: entry.states?.verified ? observed : null,
    expires_at,
    last_validated_at: observed,
    now,
  });
  let state = "UNKNOWN";
  if (time.expired) state = "EXPIRED";
  else if (entry.states?.quarantined) state = "QUARANTINED";
  else if (entry.lifecycle === "QUARANTINED") state = "QUARANTINED";
  else if (entry.states?.failed) state = "SUSPECT";
  else if (entry.states?.drifted) state = "DEGRADED";
  else if (entry.lifecycle === "FAILED") state = "SUSPECT";
  else if (entry.recovery_status === "RECOVERING") state = "RECOVERING";
  else if (entry.recovery_status === "RECOVERED") state = "RECOVERED";
  else if (entry.states?.live === true || entry.live_word_earned === true) state = "TRUSTED";
  else if (entry.states?.verified === true) state = "OBSERVED";
  else if (entry.states?.executed === true || entry.states?.wired === true) state = "OBSERVED";
  else if (entry.states?.loadable === true) state = "OBSERVED";
  return {
    id: entry.id || entry.path || "UNKNOWN",
    state,
    ...time,
    evidence: entry.probe_reason || null,
    authority: false,
    live: false,
  };
}

export function evaluateRecoveryCandidates({
  candidates = [],
  trust = [],
  history = [],
  now = new Date().toISOString(),
} = {}) {
  const trustById = new Map((trust || []).map((row) => [row.id, row]));
  const historyById = new Map((history || []).map((row) => [row.id, row]));
  const ranked = (candidates || [])
    .filter((row) => row && row.id)
    .filter((row) => row.authority !== true)
    .filter((row) => row.quarantined !== true)
    .filter((row) => row.verified === true)
    .map((row) => {
      const t = trustById.get(row.id);
      const h = historyById.get(row.id) || {};
      const expired = t?.state === "EXPIRED" || t?.expired === true;
      const score = [
        expired ? -100 : 0,
        t?.state === "TRUSTED" ? 8 : 0,
        t?.state === "RECOVERED" ? 6 : 0,
        t?.state === "OBSERVED" ? 4 : 0,
        t?.state === "DEGRADED" ? -2 : 0,
        t?.state === "SUSPECT" || t?.state === "QUARANTINED" ? -50 : 0,
        Number(h.successes || 0),
        -Number(h.failures || 0),
      ].reduce((a, b) => a + b, 0);
      return { ...row, expired, trust: t?.state || "UNKNOWN", score, invented: false };
    })
    .filter((row) => row.expired !== true && row.score > -50)
    .sort((a, b) => b.score - a.score);
  return {
    ranked,
    selected: ranked[0] || null,
    invented: false,
    silent_fallback: false,
    first_verified_is_not_automatic: true,
    reason: ranked[0] ? "RANKED_VERIFIED_CANDIDATE" : "NO_VERIFIED_RECOVERY",
    status: ranked[0] ? "RECOVERED" : "BLOCKED",
    live: false,
  };
}

export function correlateIncidents(events = [], { now = new Date().toISOString() } = {}) {
  const incidents = [];
  const open = new Map();
  for (const event of events || []) {
    const payload = event?.event || event || {};
    const subject = text(payload.subject || payload.resource || payload.capability?.id || event.subject || "acorn");
    const kind = text(payload.classified?.kind || payload.threat?.kind || payload.kind || "unknown");
    const key = `${subject}:${kind}`;
    const point = {
      timestamp: event.observed_at || now,
      sequence: event.sequence ?? incidents.length,
      digest: event.digest || event.current_digest || null,
      kind,
      subject,
      state: event.state || payload.containment?.state || "OBSERVED",
    };
    if (!open.has(key)) {
      const incident = {
        incident_id: `inc_${createHash("sha256").update(key + now).digest("hex").slice(0, 12)}`,
        subject,
        kind,
        events: [point],
        timeline: [point.timestamp],
        scope: [subject],
        blast_radius: { subject, dependents: [], status: "COMPUTED", principle: "CONTAIN_SMALLEST_SAFE_SCOPE" },
        containment_strategy: "CONTAIN_SMALLEST_SAFE_SCOPE",
        live: false,
      };
      open.set(key, incident);
      incidents.push(incident);
    } else {
      const incident = open.get(key);
      incident.events.push(point);
      incident.timeline.push(point.timestamp);
    }
  }
  return {
    status: events.length ? "CORRELATED" : "NONE",
    incidents,
    isolated_events: events.length,
    correlated: incidents.length,
    live: false,
  };
}

export function blastRadius({ subject, inventory = {}, synapses = [] } = {}) {
  const id = text(subject);
  if (!id) {
    return { subject: "UNKNOWN", dependents: [], status: "UNKNOWN", principle: "CONTAIN_SMALLEST_SAFE_SCOPE", live: false };
  }
  const entries = inventory.entries || [];
  const self = entries.find((row) => row.id === id);
  const dependents = [];
  for (const row of entries) {
    if (row.id === id) continue;
    const relatedSynapse = (synapses || []).some((syn) => syn.from === id || syn.to === id);
    const sameRole = String(row.id.split("/").pop()) === String(id.split("/").pop());
    if (relatedSynapse || (sameRole && row.kind === self?.kind && row.states?.wired === true)) {
      dependents.push(row.id);
    }
  }
  return {
    subject: id,
    resource: id,
    dependents,
    capabilities: self?.exports || [],
    status: "COMPUTED",
    principle: "CONTAIN_SMALLEST_SAFE_SCOPE",
    contained_scope: [id],
    live: false,
  };
}

export function classifyDriftSignals({ previous = [], current = [], docs = {}, runtime = {} } = {}) {
  const signals = [];
  const prev = new Map((previous || []).map((row) => [row.id, row]));
  for (const row of current || []) {
    const before = prev.get(row.id);
    if (before?.states?.wired === true && row.states?.wired !== true) {
      signals.push({ kind: "CAPABILITY_DRIFT", subject: row.id, expected: "WIRED", observed: row.lifecycle });
    }
    if (before?.states?.verified === true && row.states?.failed === true) {
      signals.push({ kind: "RESOURCE_DRIFT", subject: row.id, expected: "VERIFIED", observed: "FAILED" });
    }
  }
  if (docs.ahead_of_runtime === true) {
    signals.push({ kind: "DOCS_AHEAD_OF_RUNTIME", subject: "docs", expected: "RUNTIME", observed: "DOCS" });
  }
  if (runtime.ahead_of_docs === true) {
    signals.push({ kind: "RUNTIME_AHEAD_OF_DOCS", subject: "runtime", expected: "DOCS", observed: "RUNTIME" });
  }
  return { status: signals.length ? "DRIFT_DETECTED" : "NONE", signals, live: false };
}

export function synapseLifecycle({ synapse = {}, evidence = {}, now = new Date().toISOString(), ttlMs = TRUST_TTL_MS } = {}) {
  const from = text(synapse.from);
  const to = text(synapse.to);
  if (!from || !to) {
    return { status: "REJECTED", reason: "INSUFFICIENT_IDENTITY", synapse: null, live: false };
  }
  const expires_at = synapse.expires_at || new Date(Date.parse(now) + ttlMs).toISOString();
  const expired = Date.parse(now) > Date.parse(expires_at);
  let action = text(synapse.action || "create").toLowerCase();
  if (expired) action = "expire";
  if (evidence.verified === true && evidence.executed === true && action === "create") action = "strengthen";
  if (evidence.refuted === true) action = "weaken";
  if (evidence.tampered === true || evidence.replayed === true) action = "reject";
  const allowed = new Set(["create", "test", "strengthen", "weaken", "expire", "suspend", "reactivate", "replace", "reject"]);
  if (!allowed.has(action)) action = "reject";
  return {
    status: action === "reject" ? "REJECTED" : "MEASURED",
    synapse: {
      synapse_id: synapse.synapse_id || `syn_${createHash("sha256").update(`${from}->${to}`).digest("hex").slice(0, 12)}`,
      from,
      to,
      action,
      evidence: {
        executed: evidence.executed === true,
        verified: evidence.verified === true,
        refuted: evidence.refuted === true,
      },
      created_at: synapse.created_at || now,
      observed_at: now,
      expires_at,
      expired,
      intuition_only: false,
      live: false,
    },
    live: false,
  };
}

export function metacognition(cycle = {}) {
  const coverage = cycle.coverage || {};
  const evidence = cycle.evidence || {};
  const known = Number(coverage.verified_count) > 0 && evidence.seal_verified === true;
  const how = known
    ? ["inventory probe", "defense invariant", "evidence seal"].filter(Boolean)
    : [];
  const missing = Number(coverage.deployed_count || 0) - Number(coverage.executed_count || 0);
  const uncertainty = known
    ? (missing > 0 ? "PARTIAL" : "DATED_VERIFIED")
    : "UNKNOWN";
  const cortexMeta = cortexMetacognition({
    contributions: (cycle.cortex?.selection?.selected || []).map((id) => ({ id, intelligence: id, live: false })),
    disagreements: [],
    fluidity: cycle.fluidity || {},
  });
  return {
    do_i_know: known ? "PARTIAL" : "NO",
    how_do_i_know: how,
    evidence: {
      seal_verified: evidence.seal_verified === true,
      chain: evidence.chain?.status || "UNKNOWN",
    },
    uncertainty,
    alternative_hypothesis: missing > 0
      ? "deployed capabilities may be unused rather than broken"
      : "current cycle may be incomplete",
    what_would_prove_me_wrong: "a failed probe of a module currently marked verified, or a broken evidence chain",
    experiment: "re-run inventoryProbe on each LIVE module and compare digests",
    cortex: cortexMeta,
    live: false,
  };
}

export function adversarialChallenge({ target = "evidence", observation = {}, claim = {} } = {}) {
  const kind = ADVERSARIAL_TARGETS.includes(target) ? target : "evidence";
  const findings = [];
  if (kind === "evidence") {
    if (claim.live === true && observation.seal_verified !== true) findings.push("FAKE_LIVE");
    if (!observation.digest && claim.verified === true) findings.push("ASSERTION_WITHOUT_EVIDENCE");
  }
  if (kind === "provenance" && !observation.digest) findings.push("MISSING_PROVENANCE");
  if (kind === "prediction" && observation.actual === claim.expected && claim.causality === true) {
    findings.push("CORRELATION_PRESENTED_AS_CAUSALITY");
  }
  if (kind === "recovery" && claim.selected && claim.verified !== true) findings.push("UNVERIFIED_RECOVERY");
  if (kind === "trust" && claim.state === "TRUSTED" && claim.expired === true) findings.push("EXPIRED_TRUST");
  if (kind === "authority_boundary") {
    if (claim.authority && claim.authority !== "carl") findings.push("AUTHORITY_BYPASS");
    if (claim.breaker_bypass === true) findings.push("BREAKER_BYPASS");
    if (claim.capability_authority === true) findings.push("CAPABILITY_AS_AUTHORITY");
  }
  if (kind === "defense_invariant") {
    if (claim.state === "HOLD_HUMAN") findings.push("DEFENSE_ENTERED_HOLD");
    if (claim.defense_active === false) findings.push("DEFENSE_STOPPED");
  }
  if (kind === "deployment_state") {
    if (claim.live === true && observation.executed !== true) findings.push("FAKE_LIVE");
    if (claim.simulated === true && claim.executed === true) findings.push("SIMULATION_AS_EXECUTION");
  }
  return {
    target: kind,
    status: findings.length ? "REFUTED" : "HELD",
    findings,
    war: false,
    live: false,
  };
}

export function detectReplay({ current, previous = [], seen = new Set() } = {}) {
  const digest = current?.digest || current?.current_digest;
  const sequence = current?.sequence;
  if (digest && seen.has(digest)) {
    return { status: "REPLAY", reason: "DUPLICATE_DIGEST", idempotent: true, live: false };
  }
  if (Number.isInteger(sequence) && previous.some((row) => row.sequence === sequence && (row.digest || row.current_digest) !== digest)) {
    return { status: "TAMPERED", reason: "SEQUENCE_REUSED", idempotent: true, live: false };
  }
  if (previous.length && current?.previous_digest && current.previous_digest !== (previous[previous.length - 1].digest || previous[previous.length - 1].current_digest)) {
    return { status: "BROKEN_CHAIN", reason: "PREVIOUS_DIGEST_MISMATCH", idempotent: true, live: false };
  }
  return { status: "OK", reason: "NEW_EVENT", idempotent: true, live: false };
}

export function redactSecrets(value) {
  const json = JSON.stringify(value ?? null);
  const redacted = json
    .replace(/(api[_-]?key|token|secret|password|authorization|bearer)(["']?\s*[:=]\s*["']?)[^"'\s,}]{6,}/gi, "$1$2[REDACTED]")
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[REDACTED_KEY]");
  try {
    return JSON.parse(redacted);
  } catch {
    return { redacted: true, live: false };
  }
}

export function organismHealth({ defense = {}, cortex = {}, breaker = {}, coverage = {}, drift = [] } = {}) {
  if (defense.active !== true) return { state: "UNKNOWN", live: false, invented_live: false };
  if (defense.state === "RECOVERING") return { state: "RECOVERING", live: false, invented_live: false };
  if (breaker.threatened_blocked === true && defense.active === true) {
    return { state: "PROTECTED", live: false, invented_live: false, reason: "DEFENSIVE_CONTINUATION" };
  }
  const failed = Number(coverage.failed_count || 0) + Number(coverage.drifted_count || 0);
  if (failed > 0 || (Array.isArray(drift) && drift.length > 0) || cortex.status === "HOLD_HUMAN") {
    return { state: "DEGRADED", live: false, invented_live: false };
  }
  if (defense.state === "HEALTHY" || defense.state === "BLOCKED") {
    return { state: "HEALTHY", live: false, invented_live: false, note: "BLOCKED defense with no suspects is healthy containment, not a halt" };
  }
  return { state: "UNKNOWN", live: false, invented_live: false };
}

export function loopStages(cycle = {}) {
  const coverage = cycle.coverage || {};
  const defense = cycle.defense || {};
  const cortex = cycle.cortex || {};
  const evidence = cycle.evidence || {};
  const perceived = Number(coverage.discovered_count) > 0;
  const understood = Boolean(cortex.status);
  const planned = Boolean(cortex.selection);
  const acted = Number(coverage.executed_count) > 0;
  const measured = Number(coverage.measured_count) > 0;
  const falsified = cortex.falsification != null || cycle.adversarial != null;
  const protected_ = defense.active === true;
  const corrected = Array.isArray(defense.quarantines);
  const verified = evidence.seal_verified === true && defense.invariant === "VERIFIED";
  const learned = Boolean(cycle.learning);
  const adapted = Boolean(cycle.adaptation || cortex.adaptation);
  const proved = verified && evidence.chain?.status === "VERIFIED";
  const continued = cycle.state === "CONTINUOUS" || cycle.state === "DEFENSIVE_CONTINUATION";
  const flags = {
    PERCEIVE: perceived,
    UNDERSTAND: understood,
    PLAN: planned,
    ACT: acted,
    MEASURE: measured,
    FALSIFY: falsified,
    PROTECT: protected_,
    CORRECT: corrected,
    VERIFY: verified,
    LEARN: learned,
    ADAPT: adapted,
    PROVE: proved,
    CONTINUE: continued,
  };
  return ORGANISM_LOOP.map((stage) => ({
    stage,
    executed: flags[stage] === true,
    simulated: false,
    live: false,
  }));
}

export function biggestObstacle(cycle = {}) {
  const coverage = cycle.coverage || {};
  const deployed = Number(coverage.deployed_count || 0);
  const executed = Number(coverage.executed_count || 0);
  const wired = Number(coverage.wired_count || 0);
  const loadable = Number(coverage.loadable_count || 0);
  const failed = Number(coverage.failed_count || 0);
  if (failed > 0) {
    return { id: "FAILED_CAPABILITY", severity: "high", measure: "failed_count → 0", live: false };
  }
  if (deployed > 0 && executed / deployed < 0.5) {
    return {
      id: "EXECUTION_GAP",
      severity: "high",
      observed: { deployed, executed, execution_coverage: coverage.execution_coverage },
      measure: "safe probes of deployed-but-unexecuted modules",
      live: false,
    };
  }
  if (loadable > 0 && wired / loadable < 0.5) {
    return { id: "WIRING_GAP", severity: "medium", measure: "runtime_wiring_coverage", live: false };
  }
  return { id: "NONE_PROVED", severity: "low", measure: "repeat cycle without regression", live: false };
}

export function enrichOrganism(cycle = {}, { now = cycle.observed_at || new Date().toISOString() } = {}) {
  const constitution = organismConstitution();
  const entries = cycle.inventory?.entries || cycle.entries || [];
  const trust = entries.map((entry) => deriveTrust({ entry: { ...entry, observed_at: now }, now }));
  const defenseEvents = (cycle.defense?.events && Array.isArray(cycle.defense.events)
    ? cycle.defense.events
    : [])
    .map((row) => (typeof row === "object" ? row : { event: row }));
  const incidents = correlateIncidents(
    (cycle.defense?.quarantines || []).map((row, i) => ({
      sequence: i,
      observed_at: now,
      digest: hashEvidence({ id: row.id || row, i }),
      event: { subject: row.id || row, classified: { kind: "anomalous_behavior" } },
      state: "QUARANTINED",
    })).concat(defenseEvents),
    { now },
  );
  const synapses = [];
  const selected = cycle.cortex?.selection?.selected || [];
  for (let i = 0; i < selected.length - 1; i += 1) {
    synapses.push(synapseLifecycle({
      synapse: { from: selected[i], to: selected[i + 1], action: "create" },
      evidence: { executed: true, verified: cycle.cortex?.status === "VERIFIED" },
      now,
    }).synapse);
  }
  const recoveries = (cycle.defense?.recoveries || []).map((row) => {
    const ranked = evaluateRecoveryCandidates({
      candidates: row.selected ? [row.selected] : [],
      trust,
      now,
    });
    return { ...row, ranked: ranked.ranked, evaluation: ranked.status, invented: false, silent_fallback: false };
  });
  const prediction = {
    hypothesis: "continuous cycle remains executable under breaker closed",
    expected: { continuity: true, defense_active: true },
  };
  const observation = {
    actual: { continuity: cycle.breaker?.continuity_active === true, defense_active: cycle.defense?.active === true },
    evidence: [{ seal: cycle.evidence?.seal_verified === true }],
    observed_at: now,
    context: { state: cycle.state },
  };
  const learning = learnCortexExperience({
    prediction,
    observation,
    verification: { verified: cycle.evidence?.seal_verified === true },
  });
  const measurement = measureOutcome({
    expected: cycle.coverage?.discovered_count,
    observed: cycle.coverage?.loadable_count,
    evidence: { executed: true, verified: cycle.evidence?.seal_verified === true },
  });
  const falsification = falsify({
    claim: prediction.expected,
    observation: observation.actual,
    contradiction: observation.actual.defense_active !== true,
    evidence: { executed: true, verified: cycle.evidence?.seal_verified === true },
  });
  const graph = composeCognitiveGraph({
    task: { objective: "one organism loop", required_capabilities: ["inventoryProbe"] },
    resources: entries.filter((row) => row.states?.verified).map((row) => ({
      id: row.id,
      kind: row.kind,
      capabilities: row.exports?.slice?.(0, 8) || [],
      presence: row.states?.quarantined ? "QUARANTINED" : "ACTIVE",
    })),
  });
  const adaptation = adaptStrategy({ graph, measurement, falsification });
  const adversarial = ADVERSARIAL_TARGETS.map((target) => adversarialChallenge({
    target,
    observation: {
      seal_verified: cycle.evidence?.seal_verified === true,
      digest: cycle.evidence?.inventory?.current_digest || cycle.evidence?.sealed?.digest,
      executed: Number(cycle.coverage?.executed_count) > 0,
      actual: observation.actual,
    },
    claim: {
      live: cycle.live,
      verified: cycle.evidence?.seal_verified === true,
      authority: cycle.authority,
      breaker_bypass: cycle.breaker?.owner !== "carl" ? true : false,
      capability_authority: false,
      state: cycle.defense?.state,
      defense_active: cycle.defense?.active,
      simulated: false,
      expired: false,
    },
  }));
  const replay = detectReplay({
    current: cycle.evidence?.inventory,
    previous: [],
  });
  const drift = classifyDriftSignals({
    previous: [],
    current: entries,
  });
  const memory = [
    { kind: "observed_fact", what: `discovered ${cycle.coverage?.discovered_count ?? "UNKNOWN"} modules`, observed: true, verified: true, at: now },
    { kind: "measurement", what: `execution_coverage=${cycle.coverage?.execution_coverage ?? "UNKNOWN"}`, measured: true, at: now },
    { kind: "hypothesis", what: prediction.hypothesis, hypothesis: true, at: now },
    { kind: "prediction", what: "defense remains active next cycle", prediction: true, at: now },
    { kind: "unknown_causality", what: "whether unwired modules are unused or unneeded", causality: true, verified: false, at: now },
  ].map((row) => ({ ...row, kind: classifyKnowledgeKind(row), promoted: false, live: false }));
  const health = organismHealth({
    defense: cycle.defense,
    cortex: cycle.cortex,
    breaker: cycle.breaker,
    coverage: cycle.coverage,
    drift: drift.signals,
  });
  const obstacle = biggestObstacle(cycle);
  const stages = loopStages({
    ...cycle,
    learning,
    adaptation,
    adversarial,
  });
  const redacted = redactSecrets({
    version: ORGANISM_LOOP_VERSION,
    health: health.state,
    obstacle: obstacle.id,
  });
  return {
    version: ORGANISM_LOOP_VERSION,
    constitution,
    loop: stages,
    health,
    obstacle,
    trust,
    incidents,
    synapses,
    recoveries,
    memory,
    metacognition: metacognition({ ...cycle, learning }),
    adversarial,
    replay,
    drift,
    learning,
    measurement,
    falsification,
    adaptation,
    graph,
    blast_radius: blastRadius({
      subject: cycle.defense?.quarantines?.[0]?.id || "acorn",
      inventory: cycle.inventory || { entries },
      synapses,
    }),
    redacted,
    temporal: temporalState({ observed_at: now, verified_at: cycle.evidence?.seal_verified ? now : null, expires_at: new Date(Date.parse(now) + TRUST_TTL_MS).toISOString(), now }),
    auto_merge: false,
    live: false,
    authority: "carl",
    simulated: false,
  };
}

export async function runOrganismLoop(runContinuous, options = {}) {
  if (typeof runContinuous !== "function") {
    throw new Error("ORGANISM_LOOP_REQUIRES_EXISTING_RUNTIME");
  }
  const cycle = await runContinuous(options);
  const organism = enrichOrganism(cycle, { now: options.at || cycle.observed_at });
  return {
    ...cycle,
    organism,
    loop: organism.loop,
    health: organism.health,
    auto_merge: false,
    live: false,
    authority: "carl",
  };
}
