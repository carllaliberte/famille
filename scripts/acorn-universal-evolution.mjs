#!/usr/bin/env node
/**
 * ACORN — UNIVERSAL EVOLUTION / FLUIDITY CONDUCTOR
 *
 * One orchestration contract over existing Acorn fabrics.
 * This is NOT a second Cortex, runtime, registry, defense layer or authority.
 *
 * PRINCIPLE:
 *   observe -> classify -> diagnose -> alternatives -> plan -> apply -> test
 *   -> measure -> verify -> retain/reject/quarantine -> checkpoint -> continue
 *
 * CAPABILITY != AUTHORITY
 * UNKNOWN != TRUSTED
 * DECLARED != EXECUTED != MEASURED != VERIFIED != LIVE
 * CARL remains human authority; auto-merge is always disabled.
 */
import { inventoryConstitution, coverageMetrics } from "./acorn-capability-inventory.mjs";
import { cortexConstitution, routeByCapability } from "./cortex-cognition.mjs";

export const UNIVERSAL_EVOLUTION_VERSION = "acorn.universal-evolution.v1";

export const EVOLUTION_STATES = Object.freeze([
  "OBSERVE",
  "CLASSIFY",
  "DIAGNOSE",
  "ALTERNATIVES",
  "PLAN",
  "APPLY",
  "TEST",
  "MEASURE",
  "VERIFY",
  "RETAIN",
  "REJECT",
  "QUARANTINE",
  "CHECKPOINT",
  "CONTINUE",
  "WAITING_ON_HUMAN",
]);

const text = (v) => String(v ?? "").trim();
const list = (v) => Array.isArray(v) ? v.map(text).filter(Boolean) : [];
const finite = (v, fallback = null) => Number.isFinite(Number(v)) ? Number(v) : fallback;

function stable(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  return "{" + Object.keys(value).sort().map((key) => JSON.stringify(key) + ":" + stable(value[key])).join(",") + "}";
}

function digest(value) {
  let hash = 2166136261;
  for (const char of stable(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function universalEvolutionConstitution() {
  return Object.freeze({
    version: UNIVERSAL_EVOLUTION_VERSION,
    one_conductor: true,
    second_cortex: false,
    second_runtime: false,
    second_registry: false,
    second_defense: false,
    second_authority: false,
    capability_is_not_authority: true,
    unknown_is_not_trusted: true,
    unknown_is_not_malicious: true,
    declaration_is_not_execution: true,
    execution_is_not_measurement: true,
    measurement_is_not_verification: true,
    verification_is_not_live: true,
    live_requires_evidence: true,
    failed_work_does_not_stop_unrelated_work: true,
    arbitrary_self_modification: false,
    auto_merge: false,
    authority: "carl",
    breaker_bypass: false,
    live: false,
  });
}

export function classifyObservation(observation = {}) {
  const status = text(observation.status).toUpperCase();
  const category = text(observation.category).toUpperCase();
  const knownCategories = new Set([
    "CODE", "TEST", "DEPENDENCY", "MODEL", "PROVIDER", "CONNECTOR",
    "ROUTING", "CONFIGURATION", "MEMORY", "KNOWLEDGE", "RESOURCE",
    "PERFORMANCE", "SECURITY", "EVIDENCE", "ARCHITECTURE", "UNKNOWN",
  ]);
  const failure = observation.failed === true || [
    "FAILED", "ERROR", "REGRESSION", "DRIFT", "BLOCKED", "UNAVAILABLE",
  ].includes(status);
  return {
    category: knownCategories.has(category) ? category : "UNKNOWN",
    failure,
    severity: text(observation.severity).toUpperCase() || (failure ? "MEDIUM" : "LOW"),
    status: status || "OBSERVED",
    unknown: category === "UNKNOWN" || observation.unknown === true,
    evidence_present: observation.evidence != null,
    provenance_present: observation.provenance != null,
  };
}

export function diagnoseObservation(observation = {}, classification = classifyObservation(observation)) {
  const causes = [];
  const alternatives = [];
  if (classification.failure) {
    if (observation.channel_present === false) {
      causes.push("CHANNEL_NOT_PRESENT");
      alternatives.push("DISCOVER_ALTERNATE_CHANNEL");
    }
    if (observation.capability_available === false) {
      causes.push("CAPABILITY_NOT_AVAILABLE");
      alternatives.push("ROUTE_TO_VERIFIED_CAPABILITY");
    }
    if (observation.environment_failure === true) {
      causes.push("ENVIRONMENT_FAILURE");
      alternatives.push("ISOLATE_ENVIRONMENT_AND_CONTINUE_INDEPENDENT_WORK");
    }
    if (observation.contract_drift === true) {
      causes.push("CONTRACT_DRIFT");
      alternatives.push("REVALIDATE_CONTRACT");
    }
    if (observation.regression === true) {
      causes.push("REGRESSION");
      alternatives.push("REPAIR_FROM_LAST_VERIFIED_CHECKPOINT");
    }
    if (!causes.length) {
      causes.push(classification.unknown ? "UNKNOWN_FAILURE_MODE" : "UNCLASSIFIED_FAILURE");
      alternatives.push("MEASURE_BEFORE_MODIFICATION");
    }
  } else if (classification.unknown) {
    causes.push("UNKNOWN_STATE");
    alternatives.push("DISCOVER_AND_MEASURE");
  } else {
    causes.push("NO_FAILURE_OBSERVED");
    alternatives.push("OPTIMIZE_ONLY_WHEN_MEASUREMENT_SUPPORTS_IT");
  }
  return {
    causes: [...new Set(causes)],
    alternatives: [...new Set(alternatives)],
    confidence: causes[0] === "UNKNOWN_FAILURE_MODE" || causes[0] === "UNKNOWN_STATE" ? "UNKNOWN" : "PROVISIONAL",
  };
}

export function planRepair(observation = {}, diagnosis = diagnoseObservation(observation), input = {}) {
  const action = text(input.action) || diagnosis.alternatives[0] || "MEASURE_BEFORE_MODIFICATION";
  const requiresHuman = input.requires_human === true ||
    ["MERGE", "SECRET", "GOVERNANCE", "BREAKER", "HUMAN_DECISION"].includes(text(input.authority).toUpperCase());
  return {
    plan_id: "repair_" + digest({ observation, diagnosis, action }),
    action,
    alternatives: diagnosis.alternatives,
    reversible: input.reversible !== false,
    bounded: input.bounded !== false,
    requires_human: requiresHuman,
    status: requiresHuman ? "WAITING_ON_HUMAN" : "PLANNED",
    authority: "carl",
    authority_granted: false,
    auto_merge: false,
    live: false,
  };
}

export function verifyEvolution({ observation = {}, execution = {}, tests = {}, measurement = {}, evidence = {} } = {}) {
  const testPass = tests.passed === true || (Number.isFinite(Number(tests.total)) && Number(tests.failed) === 0);
  const measured = measurement.measured === true || Number.isFinite(Number(measurement.value));
  const evidenceVerified = evidence.verified === true;
  const executed = execution.executed === true;
  const failed = observation.failed === true || execution.failed === true || tests.failed > 0;
  const verified = executed && testPass && measured && evidenceVerified && !failed;
  return {
    executed,
    tests_pass: testPass,
    measured,
    evidence_verified: evidenceVerified,
    verified,
    status: verified ? "VERIFIED" : failed ? "REJECT" : "INCONCLUSIVE",
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function checkpoint({ state = "CHECKPOINT", previous = null, result = null, at = null } = {}) {
  const record = {
    version: UNIVERSAL_EVOLUTION_VERSION,
    state: EVOLUTION_STATES.includes(state) ? state : "CHECKPOINT",
    previous,
    result,
    at: at || new Date().toISOString(),
    authority: "carl",
    auto_merge: false,
    live: false,
  };
  return Object.freeze({ ...record, digest: digest(record) });
}

export function selectNextWork({ observations = [], blocked = [], completed = [], independent = [] } = {}) {
  const blockedSet = new Set(list(blocked));
  const completedSet = new Set(list(completed));
  const candidates = [...observations, ...independent]
    .map((row) => typeof row === "string" ? { id: row } : row)
    .filter((row) => row?.id)
    .filter((row) => !blockedSet.has(row.id) && !completedSet.has(row.id))
    .map((row) => ({
      ...row,
      priority: finite(row.information_gain, 0) * 0.4 +
        finite(row.capability_gain, 0) * 0.35 +
        finite(row.risk_reduction, 0) * 0.2 -
        finite(row.cost, 0) * 0.05,
    }))
    .sort((a, b) => b.priority - a.priority || String(a.id).localeCompare(String(b.id)));
  return candidates;
}

export function buildUniversalEvolutionCycle(input = {}) {
  const observation = input.observation || {};
  const classification = classifyObservation(observation);
  const diagnosis = diagnoseObservation(observation, classification);
  const plan = planRepair(observation, diagnosis, input.plan || {});
  const verification = verifyEvolution(input);
  const next = selectNextWork(input.work || {});
  const blocked = plan.status === "WAITING_ON_HUMAN";
  const state = blocked ? "WAITING_ON_HUMAN"
    : verification.verified ? "CHECKPOINT"
    : verification.status === "REJECT" ? "REJECT"
    : "CONTINUE";
  const result = {
    version: UNIVERSAL_EVOLUTION_VERSION,
    state,
    phases: [...EVOLUTION_STATES],
    observation: classification,
    diagnosis,
    plan,
    verification,
    next_work: next,
    constitutional: universalEvolutionConstitution(),
    reused: {
      inventory: inventoryConstitution(),
      cortex: cortexConstitution(),
    },
    authority: "carl",
    authority_granted: false,
    breaker_bypass: false,
    auto_merge: false,
    live: false,
  };
  return Object.freeze({ ...result, checkpoint: checkpoint({ state, result: { status: verification.status } }) });
}

export function adaptiveRoute({ task = {}, resources = [] } = {}) {
  const route = routeByCapability({ task, resources });
  return {
    ...route,
    adaptive: true,
    fixed_provider_allowlist: false,
    unknown_resources_allowed: true,
    capability_first: true,
    authority: "carl",
    authority_granted: false,
    live: false,
  };
}

export function summarizeHealth({ inventory = [], previous = [] } = {}) {
  const metrics = coverageMetrics(inventory);
  const previousById = new Map((Array.isArray(previous) ? previous : []).map((row) => [row.id, row]));
  const drift = (Array.isArray(inventory) ? inventory : []).filter((row) => {
    const before = previousById.get(row.id);
    return before && before.lifecycle && before.lifecycle !== row.lifecycle;
  }).length;
  return {
    version: UNIVERSAL_EVOLUTION_VERSION,
    metrics,
    drift_count: drift,
    unknown_count: metrics.unknown_count,
    failed_count: metrics.failed_count,
    attention_required: drift > 0 || metrics.failed_count > 0,
    authority: "carl",
    auto_merge: false,
    live: false,
  };
}

export function assertUniversalEvolutionInvariant(result = {}) {
  const c = universalEvolutionConstitution();
  const violations = [];
  for (const [key, expected] of Object.entries(c)) {
    if (key === "version") continue;
    if (result[key] !== undefined && result[key] !== expected) violations.push(key);
    if (result.constitutional?.[key] !== undefined && result.constitutional[key] !== expected) violations.push("constitutional." + key);
  }
  if (violations.length) throw new Error("UNIVERSAL_EVOLUTION_INVARIANT_FAILED:" + violations.join(","));
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = buildUniversalEvolutionCycle({
    observation: { status: "REGRESSION", category: "CODE", failed: true, regression: true },
    execution: { executed: true },
    tests: { passed: true },
    measurement: { measured: true, value: 1 },
    evidence: { verified: true },
  });
  assertUniversalEvolutionInvariant(result);
  console.log(JSON.stringify(result, null, 2));
}
