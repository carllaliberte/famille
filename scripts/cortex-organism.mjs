#!/usr/bin/env node
/**
 * ACORN CORTEX ORGANISM — Cortex-owned runtime, not a second Cortex.
 *
 * Collective cognitive state: knowledge fabric, uncertainty, prediction,
 * causality, metabolism, immune scan, genome, memory consolidation.
 * CAPABILITY ≠ AUTHORITY. SELF-EVOLUTION ≠ SELF-AUTHORIZATION.
 * LIVE is never minted here.
 */
import { diagnoseWorkerEvidence, selfHealDecision } from "./self-heal.mjs";
import { laneInventory } from "./inference-lanes.mjs";
import { intelligenceAdapter } from "../sdk/open-intelligence.js";
import { runEcosystemCycle } from "./cortex-ecosystem.mjs";
import { runLanguageCycle } from "./cortex-language.mjs";
import {
  authorizeCapability,
  runEvolutionLoop,
} from "../.github/swarm/cortex.mjs";

export const ORGANISM_VERSION = "cortex-organism.v1";
export const ORGANISM_LOOP = Object.freeze([
  "PERCEIVE", "INGEST", "UNDERSTAND", "HYPOTHESIZE", "COMPOSE",
  "EXPERIMENT", "EXECUTE", "OBSERVE", "MEASURE", "FALSIFY",
  "DECIDE", "CONSOLIDATE", "ADAPT", "REUSE",
]);
export const UNCERTAINTY_STATES = Object.freeze([
  "KNOWN", "UNKNOWN", "UNCERTAIN", "CONFLICTING", "UNVERIFIED",
  "EXPIRED", "SUPERSEDED", "INSUFFICIENT_EVIDENCE",
]);

function text(value) {
  return String(value ?? "").trim();
}

function iso(value) {
  const s = text(value);
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
}

function digest(value) {
  const raw = JSON.stringify(value ?? null);
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) h = Math.imul(h ^ raw.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function presenceFromRuntime(agent = {}, { workerEvidence = {}, env = process.env } = {}) {
  if (agent.id === "worker" && workerEvidence?.v) return "ACTIVE";
  if (agent.id === "ci" && (env.GITHUB_ACTIONS === "true" || workerEvidence?.v)) return "CONNECTED";
  if (agent.id === "github" && (env.GITHUB_REPOSITORY || workerEvidence?.v)) return "CONNECTED";
  return "DECLARED";
}

export function contributeKnowledge({
  who, what, when, channel, context, evidence, state = "UNVERIFIED", kind = "observation",
} = {}) {
  if (!who || !what) {
    return { ok: false, status: "INSUFFICIENT_EVIDENCE", reason: "who/what required" };
  }
  return {
    ok: true,
    status: "PROPOSED",
    entry: {
      knowledge_id: `k_${digest({ who, what, when })}`,
      who: text(who),
      what,
      when: iso(when),
      channel: text(channel || "unknown"),
      context: context ?? null,
      evidence: evidence ?? null,
      state: UNCERTAINTY_STATES.includes(state) ? state : "UNVERIFIED",
      kind: text(kind),
      live: false,
    },
  };
}

export function detectContradiction(entries = []) {
  const claims = (entries || []).filter((row) => row?.what != null);
  const conflicts = [];
  for (let i = 0; i < claims.length; i += 1) {
    for (let j = i + 1; j < claims.length; j += 1) {
      const a = claims[i];
      const b = claims[j];
      if (a.kind === b.kind && a.what !== b.what && String(a.what) === String(!b.what || b.what === "false")) {
        conflicts.push({ a: a.knowledge_id, b: b.knowledge_id, state: "CONFLICTING" });
      } else if (a.kind === b.kind && JSON.stringify(a.what) !== JSON.stringify(b.what) && a.channel !== b.channel && a.context && a.context === b.context) {
        conflicts.push({ a: a.knowledge_id, b: b.knowledge_id, state: "CONFLICTING", preserved: true });
      }
    }
  }
  return { ok: true, conflicts, disagreement_preserved: true, consensus_is_truth: false };
}

export function synthesizeKnowledge(entries = []) {
  const contradiction = detectContradiction(entries);
  return {
    ok: true,
    status: contradiction.conflicts.length ? "CONFLICTING" : "UNVERIFIED",
    entries,
    contradictions: contradiction.conflicts,
    consensus_is_truth: false,
    live: false,
  };
}

export function uncertaintyOf(claim = {}) {
  if (!claim || claim.what == null) return { state: "UNKNOWN", required: "observation" };
  if (claim.state === "EXPIRED") return { state: "EXPIRED", required: "re-observe" };
  if (claim.state === "SUPERSEDED") return { state: "SUPERSEDED", required: "use successor" };
  if (claim.evidence == null) return { state: "INSUFFICIENT_EVIDENCE", required: "evidence" };
  if (claim.verified === true) return { state: "KNOWN", required: null };
  return { state: claim.state || "UNVERIFIED", required: "falsification" };
}

export function storePrediction({ hypothesis, expected, at = new Date().toISOString() } = {}) {
  return {
    ok: true,
    status: "DEFINED",
    prediction: {
      prediction_id: `pred_${digest({ hypothesis, expected, at })}`,
      hypothesis: hypothesis ?? null,
      expected: expected ?? null,
      stored_at: iso(at),
      rewritten: false,
      live: false,
    },
  };
}

export function comparePrediction(prediction = {}, observation = {}) {
  if (!prediction?.prediction_id) return { status: "INSUFFICIENT_EVIDENCE", error: null };
  const match = JSON.stringify(prediction.expected) === JSON.stringify(observation.actual);
  return {
    status: "MEASURED",
    match,
    causal: false,
    error: match ? 0 : 1,
    predicted: prediction.expected,
    observed: observation.actual ?? null,
    rewritten: prediction.rewritten === true,
    live: false,
  };
}

export function hypothesizeCause({ observation, cause, conditions = [], at } = {}) {
  return {
    status: "PROPOSED",
    causal: {
      cause: cause ?? null,
      observation: observation ?? null,
      conditions,
      at: iso(at),
      evidence: "correlation_only",
      live: false,
    },
  };
}

export function falsifyCause({ causal, counterexample = false, alternative = null, effect = null } = {}) {
  if (counterexample || alternative) {
    return { verdict: "INCONCLUSIVE", reason: alternative ? "alternative explanation" : "counterexample", live: false };
  }
  if (effect == null) return { verdict: "INCONCLUSIVE", reason: "no observed effect", live: false };
  return { verdict: "INCONCLUSIVE", reason: "correlation is not causation", live: false };
}

export function proposeSynapse({ from, to, reason } = {}) {
  if (!from || !to) return { status: "INSUFFICIENT_EVIDENCE", synapse: null };
  return {
    status: "PROPOSED",
    synapse: {
      synapse_id: `syn_${digest({ from, to })}`,
      from, to, reason: reason || "candidate connection",
      grade: "PROPOSED",
      live: false,
    },
  };
}

export function measureSynapse({ synapse, fluidityBefore = {}, fluidityAfter = {}, executed = false } = {}) {
  const worsened = fluidityBefore.state === "FLOWING" && (fluidityAfter.state === "FRICTION" || fluidityAfter.state === "STALLED");
  if (!executed) return { status: "DEFINED", verdict: "INCONCLUSIVE", reason: "not executed", live: false };
  if (worsened) return { status: "MEASURED", verdict: "INCONCLUSIVE", reason: "result may be correct but fluidity worsened", synapse, live: false };
  return { status: "MEASURED", verdict: "VERIFIED_SUCCESS", synapse, live: false };
}

export function composeCapabilities({ parts = [], name } = {}) {
  return {
    status: "PROPOSED",
    capability: {
      name: name || parts.map((p) => p.name || p).join("+"),
      parts,
      provenance: parts,
      active: false,
      live: false,
    },
  };
}

export function consolidateMemory(entries = [], { now = new Date().toISOString(), maxAgeMs = 1000 * 60 * 60 * 24 * 30 } = {}) {
  const t = Date.parse(now);
  const kept = [];
  const expired = [];
  const superseded = [];
  const seen = new Map();
  for (const entry of entries || []) {
    const at = Date.parse(entry.at || entry.when || now);
    if (Number.isFinite(at) && Number.isFinite(t) && t - at > maxAgeMs) {
      expired.push({ ...entry, state: "EXPIRED" });
      continue;
    }
    const key = `${entry.kind || ""}:${JSON.stringify(entry.what ?? entry.statement ?? entry.hypothesis)}`;
    if (seen.has(key)) {
      superseded.push({ ...seen.get(key), state: "SUPERSEDED" });
    }
    seen.set(key, entry);
    kept.push(entry);
  }
  return { status: "EXECUTED", kept, expired, superseded, live: false };
}

export function avoidKnownBad(memory = [], hypothesis = {}) {
  const similar = (memory || []).filter((row) => row.constraint === true && row.statement && hypothesis.statement
    && row.statement.includes(String(hypothesis.kind || "")));
  return {
    avoid: similar.length > 0,
    reason: similar.length ? "rejected in similar context; not universal truth" : null,
    context_matters: true,
  };
}

export function metabolismOf({ timing = {}, retries = 0, fluidity = {}, calls = 0 } = {}) {
  const stages = Object.values(timing).filter((row) => row && Number.isFinite(Number(row.duration_ms)));
  const duration_ms = stages.reduce((sum, row) => sum + Number(row.duration_ms), 0);
  return {
    status: duration_ms > 0 || retries || calls ? "MEASURED" : "INSUFFICIENT_EVIDENCE",
    duration_ms: duration_ms || null,
    retries: Number(retries) || 0,
    calls: Number(calls) || 0,
    steps: stages.length,
    friction: fluidity.state === "FRICTION",
    stalls: fluidity.state === "STALLED",
    cost: null,
    live: false,
  };
}

export function immuneDetect({ workerEvidence = {}, fluidity = {}, constitution = {}, knowledge = [] } = {}) {
  const findings = [];
  if (fluidity.property?.silent_stop === true) findings.push({ kind: "silent_failure", state: "STALLED" });
  if (fluidity.state === "FRICTION") findings.push({ kind: "unexpected_friction" });
  if (constitution.merge === true || constitution.auto_merge === true) findings.push({ kind: "authority_violation" });
  if (workerEvidence.verified === true && workerEvidence.dispatch_failed > 0) findings.push({ kind: "inconsistent_evidence" });
  const contradiction = detectContradiction(knowledge);
  if (contradiction.conflicts.length) findings.push({ kind: "contradictory_knowledge" });
  return { status: "EXECUTED", findings, healthy: findings.length === 0, live: false };
}

export function isolateAndRecover(finding = {}, { heal } = {}) {
  const isolated = { ...finding, isolated: true, reversible: true };
  const plan = heal || selfHealDecision({ status: finding.kind || "unknown", reason: finding.kind, attempt: 0 });
  if (plan.action === "HOLD_HUMAN") return { status: "HOLD_HUMAN", isolated, recovered: false, live: false };
  return { status: "PROPOSED", isolated, recovered: false, repair: plan, live: false };
}

export function genomeOf({
  capabilities = [], synapses = [], intelligences = [], memory = [], topology = {}, fluidity = {}, constraints = [],
} = {}) {
  const body = {
    version: Number(topology.version || 0),
    capabilities,
    synapses,
    intelligences: (intelligences || []).map((row) => ({ id: row.id, presence: row.presence, live: false })),
    memory_count: (memory || []).length,
    routing: topology.paths || [],
    constraints,
    fluidity: fluidity.state || null,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
  return { status: "MEASURED", genome: { ...body, digest: digest(body) }, live: false };
}

export function mutationCandidate(genome = {}, change = {}) {
  return {
    status: "PROPOSED",
    mutation: {
      from: genome.digest,
      change,
      live: false,
      auto_merge: false,
    },
  };
}

export function diagnoseOrganism({ workerEvidence = {}, env = process.env } = {}) {
  const diagnosis = diagnoseWorkerEvidence(workerEvidence, env);
  return {
    status: "EXECUTED",
    diagnosis,
    proposed_repair: diagnosis.applicable ? diagnosis.action : "NOT_APPLICABLE",
    executed_repair: false,
    verified_repair: false,
    live: false,
  };
}

export function simulateOrganism(model = {}, reality = {}) {
  return {
    status: "DEFINED",
    simulation: model,
    reality: reality ?? null,
    is_proof_of_reality: false,
    live: false,
  };
}

export function metacognitionOf({ contributions = [], disagreements = [], fluidity = {} } = {}) {
  return {
    status: "MEASURED",
    agreement: Math.max(0, (contributions || []).length - (disagreements || []).length),
    disagreement: (disagreements || []).length,
    contributions: (contributions || []).map((row) => ({ ...row, live: false })),
    fluidity: fluidity.state || null,
    ranking: null,
    live: false,
  };
}

export function assertConstitution(record = {}) {
  if (record.auto_merge === true || record.merge === true) throw new Error("CONSTITUTION_AUTO_MERGE");
  if (record.live === true) throw new Error("CONSTITUTION_LIVE_FORBIDDEN");
  if (record.authority && record.authority !== "carl") throw new Error("CONSTITUTION_AUTHORITY");
  if (record.self_authorization === true) throw new Error("CONSTITUTION_SELF_AUTHORIZATION");
  authorizeCapability({ capabilities: record.capabilities || [], allowed: true, authority: record.authority || "network" });
  return { ok: true, identity_is_not_capability: true, capability_is_not_authority: true, self_evolution_is_not_self_authorization: true };
}

export function runOrganismCycle(input = {}) {
  const at = input.at || new Date().toISOString();
  const agents = (input.agents || []).map((agent) => ({
    ...agent,
    presence: presenceFromRuntime(agent, input),
  }));
  const local = agents.filter((row) => row.presence === "ACTIVE" || row.presence === "CONNECTED");
  const perceive = {
    status: "EXECUTED",
    worker: Boolean(input.workerEvidence?.v),
    fluidity: input.fluidity?.state || null,
    local_intelligences: local.map((row) => row.id),
    lanes: laneInventory(input.env || process.env),
    paid_required: false,
  };
  const ingested = (input.contributions || []).map((row) => contributeKnowledge({ ...row, when: row.when || at }));
  const knowledge = ingested.filter((row) => row.ok).map((row) => row.entry);
  const fabric = synthesizeKnowledge(knowledge);
  const unknown = uncertaintyOf(input.claim || knowledge[0] || {});
  const prediction = storePrediction({
    hypothesis: input.hypothesis?.statement || "local cognitive-cycle remains executable",
    expected: { capability: "cognitive-cycle", available: local.some((row) => row.id === "worker") },
    at,
  });
  const adapter = intelligenceAdapter({ id: "future-channel", provider: input.futureProvider || "unknown" });
  const adapterInvoke = adapter.invoke({ capability: "review" });
  const evolution = input.evolution || runEvolutionLoop({
    ...input,
    discovery: input.discovery,
    composition: input.composition,
    runtime: {
      channelPresent: adapterInvoke.reason !== "CHANNEL_NOT_PRESENT" || Boolean(input.workerEvidence?.v),
      capabilityAvailable: local.length > 0 && Boolean(input.workerEvidence?.v),
      used_capabilities: local.length ? ["cognitive-cycle"] : [],
      contributions: local.map((row) => ({ intelligence: row.id, role: row.presence, live: false })),
      result: { worker: Boolean(input.workerEvidence?.v) },
      fail: !input.workerEvidence?.v,
      ...input.runtime,
    },
  });
  const observed = { actual: { capability: "cognitive-cycle", available: Boolean(input.workerEvidence?.v) } };
  const error = comparePrediction(prediction.prediction, observed);
  const causal = hypothesizeCause({ observation: observed, cause: "worker presence" });
  const causeVerdict = falsifyCause({ causal: causal.causal, effect: observed.actual });
  const synapse = proposeSynapse({ from: "worker", to: "ci", reason: "local execution fabric" });
  const synapseMeasure = measureSynapse({
    synapse: synapse.synapse,
    fluidityBefore: input.fluidity || {},
    fluidityAfter: input.fluidityAfter || input.fluidity || {},
    executed: Boolean(input.workerEvidence?.v),
  });
  const composed = composeCapabilities({ parts: ["cognitive-cycle", synapse.synapse].filter(Boolean) });
  const memory = consolidateMemory([...(input.memory || []), evolution.memory.entry], { now: at });
  const avoid = avoidKnownBad(memory.kept, evolution.hypothesis.hypothesis);
  const metabolism = metabolismOf({
    timing: input.timing || {},
    retries: input.retries || 0,
    fluidity: input.fluidity || {},
    calls: (input.workerEvidence?.dispatched) || 0,
  });
  const immune = immuneDetect({
    workerEvidence: input.workerEvidence || {},
    fluidity: input.fluidity || {},
    constitution: { auto_merge: false, merge: false },
    knowledge,
  });
  const recover = immune.findings[0] ? isolateAndRecover(immune.findings[0]) : { status: "NOT_APPLICABLE", recovered: false };
  const diagnosis = diagnoseOrganism({ workerEvidence: input.workerEvidence || {}, env: input.env || process.env });
  const twin = simulateOrganism({ expected: prediction.prediction.expected }, observed);
  const genome = genomeOf({
    capabilities: local.map((row) => row.capabilities || []).flat(),
    synapses: [synapse.synapse].filter(Boolean),
    intelligences: agents,
    memory: memory.kept,
    topology: evolution.reconfiguration.topology || input.topology || {},
    fluidity: input.fluidity || {},
    constraints: memory.kept.filter((row) => row.constraint),
  });
  const mutation = mutationCandidate(genome.genome, { synapse: synapse.synapse });
  const meta = metacognitionOf({
    contributions: evolution.execution.contributions || [],
    disagreements: fabric.contradictions,
    fluidity: input.fluidity || {},
  });
  const constitution = assertConstitution({
    auto_merge: false,
    live: false,
    authority: "carl",
    self_authorization: false,
  });
  const ecosystem = runEcosystemCycle({
    agents,
    workerEvidence: input.workerEvidence || {},
    need: "review",
    required: ["review"],
    knowledge,
    metabolism,
    immune,
    memory: memory.kept,
    topology: evolution.reconfiguration.topology || input.topology || {},
    fluidity: input.fluidity || {},
    claims: knowledge,
  });
  const language = runLanguageCycle({
    ...(input.languageInput || { text: "⊞⊸λ", declared: "FUTURE-LANG-X" }),
    at,
  });
  const record = {
    version: ORGANISM_VERSION,
    loop: ORGANISM_LOOP,
    perceive,
    ingest: ingested,
    understand: fabric,
    uncertainty: unknown,
    prediction,
    evolution,
    observe: observed,
    prediction_error: error,
    causal: { hypothesis: causal, verdict: causeVerdict },
    synapse: { proposed: synapse, measured: synapseMeasure },
    composition: composed,
    memory,
    avoid,
    metabolism,
    immune,
    recover,
    diagnosis,
    twin,
    genome,
    mutation,
    metacognition: meta,
    ecosystem,
    language,
    adapter: { reason: adapterInvoke.reason, live: false },
    constitution,
    live: false,
    auto_merge: false,
    authority: "carl",
    operational: false,
    self_authorization: false,
  };
  assertConstitution(record);
  return record;
}
