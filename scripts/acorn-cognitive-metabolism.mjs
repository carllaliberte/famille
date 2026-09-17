#!/usr/bin/env node
/**
 * ACORN — COGNITIVE METABOLISM
 *
 * A bounded metabolic layer over the existing Cortex, Learning Fabric,
 * Learning Orchestrator, Evidence, Measurement, Resource and Evolution fabrics.
 *
 * The metaphor is operational, not anthropomorphic:
 *
 * intake -> identification -> digestion -> validation -> assimilation
 * -> circulation -> allocation -> action -> measurement -> recovery
 * -> consolidation -> recycling -> revalidation -> adaptation -> continue
 *
 * It does not create a second Cortex, memory, runtime, registry, authority,
 * defense system or uncontrolled self-modification path.
 */

import {
  consolidate,
  revalidationPlan,
  rankFrontier,
  assertLearningOrchestratorInvariant,
} from "./acorn-learning-orchestrator.mjs";

export const COGNITIVE_METABOLISM_VERSION = "acorn.cognitive-metabolism.v1";

export const METABOLIC_PHASES = Object.freeze([
  "INTAKE",
  "IDENTIFY",
  "FILTER",
  "DIGEST",
  "VALIDATE",
  "ASSIMILATE",
  "CIRCULATE",
  "ALLOCATE",
  "ACT",
  "OBSERVE",
  "MEASURE",
  "RECOVER",
  "CONSOLIDATE",
  "RECYCLE",
  "REVALIDATE",
  "ADAPT",
  "CONTINUE",
  "WAITING_ON_HUMAN",
]);

export const METABOLIC_MATERIALS = Object.freeze([
  "OBSERVATION",
  "EVIDENCE",
  "MEASUREMENT",
  "KNOWLEDGE",
  "QUESTION",
  "HYPOTHESIS",
  "CAPABILITY",
  "TASK",
  "RESULT",
  "ERROR",
  "CONTRADICTION",
  "RESOURCE",
  "SIGNAL",
  "UNKNOWN",
  "DISCOVERY",
  "OPPORTUNITY",
]);

const clamp = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
};

const text = (v) => String(v ?? "").trim();

function stable(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  return "{" + Object.keys(value).sort().map((k) => JSON.stringify(k) + ":" + stable(value[k])).join(",") + "}";
}

function digest(value) {
  let h = 2166136261;
  for (const c of stable(value)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * Normalizes incoming material without declaring it true.
 * External material remains untrusted until the existing connector/evidence
 * pipeline has established the relevant facts.
 */
export function ingestMaterial(input = {}) {
  const material = text(input.material || input.type) || "UNKNOWN";
  const provenance = input.provenance ?? null;
  const identified = Boolean(text(input.id || input.subject));
  const admissibility = clamp(input.admissibility ?? (provenance ? 0.7 : 0.2));
  const integrity = clamp(input.integrity ?? (provenance ? 0.7 : 0.2));
  const freshness = clamp(input.freshness ?? 0.5);
  const novelty = clamp(input.novelty ?? 0.5);

  return Object.freeze({
    id: text(input.id) || "material_" + digest(input),
    material: METABOLIC_MATERIALS.includes(material) ? material : "UNKNOWN",
    subject: text(input.subject) || "unknown",
    provenance,
    identified,
    admissibility,
    integrity,
    freshness,
    novelty,
    confidence: clamp(
      admissibility * 0.35 +
      integrity * 0.35 +
      freshness * 0.15 +
      novelty * 0.15
    ),
    state: identified ? "IDENTIFIED" : "UNIDENTIFIED",
    live: false,
  });
}

/**
 * Digest = decompose a material into claims, uncertainty, contradictions,
 * dependencies and possible next experiments.
 */
export function digestMaterial(input = {}) {
  const x = ingestMaterial(input);
  const contradictions = Array.isArray(input.contradictions) ? input.contradictions : [];
  const dependencies = Array.isArray(input.dependencies) ? input.dependencies : [];
  const questions = Array.isArray(input.questions) ? input.questions : [];

  const quality = clamp(
    x.confidence * 0.45 +
    (contradictions.length === 0 ? 0.25 : 0.05) +
    (dependencies.length ? 0.15 : 0.05) +
    (questions.length ? 0.15 : 0.05)
  );

  return Object.freeze({
    ...x,
    state: quality >= 0.65 ? "DIGESTED" : "PARTIAL_DIGEST",
    quality,
    claims: Array.isArray(input.claims) ? input.claims : [],
    contradictions,
    dependencies,
    questions,
    unknowns: Array.isArray(input.unknowns) ? input.unknowns : [],
    capability_hypotheses: Array.isArray(input.capability_hypotheses)
      ? input.capability_hypotheses
      : [],
  });
}

/**
 * Assimilation determines what can safely become reusable internal knowledge.
 * It never promotes merely because something was observed.
 */
export function assimilateMaterial(input = {}) {
  const x = digestMaterial(input);
  const verified = input.verified === true;
  const measured = input.measured === true;
  const provenance = Boolean(x.provenance);

  let state = "CANDIDATE";
  let reason = "INSUFFICIENT_EVIDENCE";

  if (x.contradictions.length) {
    state = "CONTRADICTED";
    reason = "CONTRADICTION_PRESERVED";
  } else if (verified && measured && provenance && x.quality >= 0.65) {
    state = "ASSIMILABLE";
    reason = "MEASURED_VERIFIED_PROVENANCE";
  } else if (!provenance) {
    state = "QUARANTINED";
    reason = "PROVENANCE_REQUIRED";
  }

  return Object.freeze({
    ...x,
    state,
    reason,
    assimilable: state === "ASSIMILABLE",
    authority: false,
    live: false,
  });
}

/**
 * Metabolic value: information gain adjusted for capability unlock, freshness,
 * reliability, resource cost, risk and reversibility.
 */
export function metabolicValue(input = {}) {
  const information = clamp(input.information_value ?? input.information ?? 0);
  const capability = clamp(input.capability_unlock ?? input.capability ?? 0);
  const reliability = clamp(input.reliability ?? input.confidence ?? 0);
  const freshness = clamp(input.freshness ?? 0.5);
  const reversibility = clamp(input.reversibility ?? 0.5);
  const cost = clamp(input.cost ?? 0.5);
  const risk = clamp(input.risk ?? 0);
  const redundancy = clamp(input.redundancy ?? 0);

  return clamp(
    information * 0.25 +
    capability * 0.2 +
    reliability * 0.15 +
    freshness * 0.1 +
    reversibility * 0.1 +
    (1 - cost) * 0.1 +
    (1 - risk) * 0.05 +
    (1 - redundancy) * 0.05
  );
}

/**
 * Homeostasis: detect cognitive metabolic stress before it becomes failure.
 */
export function homeostasis(input = {}) {
  const queue = clamp(input.queue_pressure ?? 0);
  const uncertainty = clamp(input.uncertainty ?? 0);
  const contradiction = clamp(input.contradiction ?? 0);
  const stale = clamp(input.stale_knowledge ?? 0);
  const resource = clamp(input.resource_pressure ?? 0);
  const failure = clamp(input.failure_pressure ?? 0);

  const load = clamp(
    queue * 0.2 +
    uncertainty * 0.15 +
    contradiction * 0.15 +
    stale * 0.15 +
    resource * 0.2 +
    failure * 0.15
  );

  const state =
    load >= 0.8 ? "CRITICAL" :
    load >= 0.6 ? "ELEVATED" :
    load >= 0.35 ? "WATCH" :
    "STABLE";

  return Object.freeze({
    state,
    load,
    pressures: {
      queue,
      uncertainty,
      contradiction,
      stale,
      resource,
      failure,
    },
    responses:
      state === "CRITICAL"
        ? ["REDUCE_LOAD", "ISOLATE_FAILING_PATHS", "PRESERVE_TRUSTED_STATE", "REVALIDATE"]
        : state === "ELEVATED"
          ? ["PRIORITIZE_HIGH_INFORMATION_VALUE", "DEFER_LOW_VALUE_WORK", "REVALIDATE_STALE"]
          : state === "WATCH"
            ? ["OBSERVE", "MEASURE"]
            : ["CONTINUE"],
    live: false,
  });
}

/**
 * Resource metabolism: choose work by useful cognitive output per bounded cost.
 */
export function allocateResources(candidates = [], budget = {}) {
  const time = clamp(budget.time ?? 1, 1);
  const compute = clamp(budget.compute ?? 1, 1);
  const energy = clamp(budget.energy ?? 1, 1);
  const humanAttention = clamp(budget.human_attention ?? 1, 1);

  const rows = candidates.map((candidate) => {
    const value = metabolicValue(candidate);
    const cost =
      clamp(candidate.time_cost ?? 0.5) * 0.3 +
      clamp(candidate.compute_cost ?? 0.5) * 0.3 +
      clamp(candidate.energy_cost ?? 0.5) * 0.2 +
      clamp(candidate.human_attention_cost ?? 0) * 0.2;
    const feasibility =
      clamp(time * (1 - clamp(candidate.time_cost ?? 0))) *
      clamp(compute * (1 - clamp(candidate.compute_cost ?? 0))) *
      clamp(energy * (1 - clamp(candidate.energy_cost ?? 0))) *
      clamp(humanAttention * (1 - clamp(candidate.human_attention_cost ?? 0)));

    return {
      ...candidate,
      metabolic_value: value,
      resource_cost: cost,
      feasibility,
      efficiency: Number((value * feasibility / Math.max(0.01, cost)).toFixed(6)),
    };
  });

  return rows
    .sort((a, b) => b.efficiency - a.efficiency || text(a.id).localeCompare(text(b.id)))
    .map((x, index) => ({ ...x, allocation_rank: index + 1 }));
}

/**
 * Recycling prevents dead ends from becoming silent waste.
 * Failed, stale, redundant or superseded material is converted into explicit
 * learning inputs rather than silently deleted.
 */
export function recycleMaterial(input = {}) {
  const state = text(input.state) || "UNKNOWN";
  const mapping = {
    FAILED: ["ERROR", "QUESTION", "HYPOTHESIS"],
    REJECTED: ["CONTRADICTION", "QUESTION"],
    STALE: ["QUESTION", "REVALIDATION"],
    REDUNDANT: ["KNOWLEDGE", "QUESTION"],
    SUPERSEDED: ["KNOWLEDGE", "DISCOVERY"],
    QUARANTINED: ["UNKNOWN", "QUESTION"],
    CONTRADICTED: ["CONTRADICTION", "HYPOTHESIS"],
  };

  const outputs = mapping[state] || ["UNKNOWN", "QUESTION"];

  return Object.freeze({
    source_id: text(input.id) || "unknown",
    state,
    outputs,
    reason: state === "FAILED"
      ? "FAILURE_IS_INFORMATION"
      : "PRESERVE_EPISTEMIC_HISTORY",
    destructive_forgetting: false,
    live: false,
  });
}

/**
 * A complete metabolic cycle. It intentionally composes existing fabrics
 * instead of becoming another cognitive center.
 */
export function metabolicCycle({
  observations = [],
  previous = [],
  frontier = [],
  revalidation = [],
  resources = {},
  health = {},
} = {}) {
  const intake = observations.map(ingestMaterial);
  const digested = intake.map(digestMaterial);
  const assimilated = digested.map(assimilateMaterial);

  const learning = consolidate({
    observations: observations.map((x) => ({
      ...x,
      evidence: x.evidence,
      measurement: x.measurement,
      verification: x.verification,
    })),
    previous,
    frontier,
  });

  const ranked = rankFrontier(frontier);
  const resourceCandidates = [
    ...learning.experiments.map((x) => ({
      ...x,
      information_value: x.information_value ?? 0,
      capability_unlock: x.capability_unlock ?? 0,
      confidence: x.confidence ?? 0.5,
      reversibility: x.reversible ? 1 : 0,
    })),
    ...ranked.slice(0, 8).map((x) => ({
      ...x,
      capability_unlock: x.impact,
      confidence: 1 - x.uncertainty,
    })),
  ];

  const allocation = allocateResources(resourceCandidates, resources);
  const healthState = homeostasis(health);
  const revalidated = revalidationPlan(revalidation);
  const recycled = [
    ...assimilated.filter((x) => x.state === "CONTRADICTED").map((x) =>
      recycleMaterial({ id: x.id, state: "CONTRADICTED" })),
    ...assimilated.filter((x) => x.state === "QUARANTINED").map((x) =>
      recycleMaterial({ id: x.id, state: "QUARANTINED" })),
  ];

  const next =
    healthState.state === "CRITICAL"
      ? allocation.find((x) => x.allocation_rank === 1) ?? null
      : learning.next ?? allocation[0] ?? null;

  const phases = [
    "INTAKE",
    "IDENTIFY",
    "FILTER",
    "DIGEST",
    "VALIDATE",
    "ASSIMILATE",
    "CIRCULATE",
    "ALLOCATE",
    "OBSERVE",
    "MEASURE",
    "CONSOLIDATE",
    "RECYCLE",
    "REVALIDATE",
    "ADAPT",
    "CONTINUE",
  ];

  return Object.freeze({
    version: COGNITIVE_METABOLISM_VERSION,
    phases,
    intake,
    digested,
    assimilated,
    learning,
    frontier: ranked,
    allocation,
    revalidated,
    recycled,
    homeostasis: healthState,
    next,
    metabolism: {
      input_count: observations.length,
      digested_count: digested.length,
      assimilable_count: assimilated.filter((x) => x.assimilable).length,
      contradiction_count: assimilated.filter((x) => x.state === "CONTRADICTED").length,
      quarantine_count: assimilated.filter((x) => x.state === "QUARANTINED").length,
      frontier_count: ranked.length,
      revalidation_count: revalidated.filter((x) => x.action === "REVALIDATE").length,
      recycled_count: recycled.length,
      allocation_count: allocation.length,
      information_value: Number(
        ranked.reduce((sum, x) => sum + (x.information_value ?? 0), 0).toFixed(6)
      ),
      continuation: next !== null,
    },
    constitution: {
      one_metabolism: true,
      second_cortex: false,
      second_memory: false,
      second_runtime: false,
      memory_is_not_truth: true,
      observation_is_not_truth: true,
      learning_is_not_authority: true,
      capability_is_not_authority: true,
      unknown_is_not_trusted: true,
      unknown_is_not_malicious: true,
      failure_is_information: true,
      contradictions_preserved: true,
      destructive_forgetting: false,
      arbitrary_self_modification: false,
      breaker_bypass: false,
      authority: "carl",
      auto_merge: false,
      live: false,
    },
    continue: true,
    authority: "carl",
    auto_merge: false,
    live: false,
  });
}

export function assertCognitiveMetabolismInvariant(result = {}) {
  const c = result.constitution || {};
  const required = {
    one_metabolism: true,
    second_cortex: false,
    second_memory: false,
    second_runtime: false,
    memory_is_not_truth: true,
    observation_is_not_truth: true,
    learning_is_not_authority: true,
    capability_is_not_authority: true,
    unknown_is_not_trusted: true,
    unknown_is_not_malicious: true,
    failure_is_information: true,
    contradictions_preserved: true,
    destructive_forgetting: false,
    arbitrary_self_modification: false,
    breaker_bypass: false,
    authority: "carl",
    auto_merge: false,
    live: false,
  };

  const violations = Object.entries(required)
    .filter(([key, expected]) => c[key] !== expected)
    .map(([key]) => key);

  if (result.continue !== true) violations.push("continue");

  for (const item of result.assimilated || []) {
    if (item.authority !== false || item.live !== false) violations.push("assimilation_boundary");
  }

  for (const item of result.allocation || []) {
    if (item.live !== false) violations.push("allocation_live");
  }

  try {
    assertLearningOrchestratorInvariant(result.learning);
  } catch {
    violations.push("learning_orchestrator");
  }

  if (violations.length) {
    throw new Error(
      "COGNITIVE_METABOLISM_INVARIANT_FAILED:" + [...new Set(violations)].join(",")
    );
  }

  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = metabolicCycle({
    observations: [{
      id: "self-test-observation",
      subject: "metabolic self-test",
      material: "OBSERVATION",
      provenance: { source: "local" },
      evidence: { score: 1 },
      measurement: { measured: true, confidence: 1 },
      verification: { verified: true },
      claims: ["the cycle is composable"],
      questions: ["what should be tested next?"],
      novelty: 0.8,
    }],
    frontier: [{
      id: "unknown-capability",
      subject: "unknown capability",
      uncertainty: 0.9,
      impact: 0.9,
      observability: 0.8,
      reversibility: 0.9,
    }],
    revalidation: [{
      id: "old-knowledge",
      state: "KNOWN",
      age: 0.95,
    }],
    resources: {
      time: 1,
      compute: 1,
      energy: 1,
      human_attention: 1,
    },
    health: {
      queue_pressure: 0.1,
      uncertainty: 0.4,
      contradiction: 0,
      stale_knowledge: 0.2,
      resource_pressure: 0.1,
      failure_pressure: 0,
    },
  });

  assertCognitiveMetabolismInvariant(result);
  console.log(JSON.stringify(result, null, 2));
}
