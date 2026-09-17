#!/usr/bin/env node
/**
 * ACORN CORTEX — CONTINUOUS COGNITION
 *
 * Integration spine over the existing Cortex/Acorn organs.
 * This is not a second Cortex, Runtime, Defense, Governor, Fabric, memory,
 * Constitution or Breaker. It makes the existing cognitive loop executable
 * as one bounded continuity record.
 *
 * TASK → DISCOVER → COMPOSE → PREDICT → OBSERVE → MEASURE → FALSIFY
 * → VERIFY → LEARN → ADAPT → NEXT CYCLE
 *
 * CAPABILITY ≠ AUTHORITY
 * MODEL ≠ WORLD
 * PREDICTION ≠ OBSERVATION
 * OBSERVATION ≠ CAUSALITY
 * VERIFIED ≠ LIVE
 */
import { createHash } from "node:crypto";
import {
  cortexCycle,
  learnFromVerifiedMeasurement,
  measureCapabilityGain,
  assertCortexInvariant,
} from "./cortex-cognition.mjs";
import { runCognitiveEcologyCycle } from "./acorn-cognitive-ecology.mjs";

export const CONTINUOUS_COGNITION_VERSION = "acorn.cortex.continuous-cognition.v1";
export const COGNITIVE_PHASES = Object.freeze([
  "TASK", "DISCOVER", "COMPOSE", "PREDICT", "OBSERVE", "MEASURE",
  "FALSIFY", "VERIFY", "LEARN", "ADAPT", "CONTINUE",
]);

const text = (value) => String(value ?? "").trim();
const list = (value) => Array.isArray(value) ? value.map(text).filter(Boolean) : [];

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function createCognitiveTask(input = {}) {
  const id = text(input.id || input.objective || input.name);
  if (!id) throw new Error("COGNITIVE_TASK_ID_REQUIRED");
  return {
    id,
    objective: text(input.objective || id),
    required_capabilities: list(input.required_capabilities || input.capabilities),
    context: input.context ?? null,
    authority: "carl",
  };
}

export function cognitivePhase(status, phase, detail = {}) {
  return {
    phase,
    status,
    ...detail,
  };
}

export function buildContinuityToken({ task, cycle, previous = null } = {}) {
  return digest({
    version: CONTINUOUS_COGNITION_VERSION,
    task: task?.id ?? null,
    cycle,
    previous: previous?.continuity_token ?? null,
  });
}

export function retainLearning({ task, cycle, measurement, verified }) {
  if (verified !== true) {
    return {
      status: "NOT_RETAINED",
      reason: "VERIFIED_EVIDENCE_REQUIRED",
      authority_changed: false,
      live: false,
    };
  }
  const learning = learnFromVerifiedMeasurement({
    task,
    nodes: cycle?.graph?.nodes ?? [],
    measurement,
    verified: true,
    context: task?.context ? [task.context] : [],
  });
  return {
    status: "RETAINED",
    learning,
    authority_changed: false,
    live: false,
  };
}

export function runContinuousCognitionCycle(input = {}) {
  const task = createCognitiveTask(input.task ?? input);
  const resources = Array.isArray(input.resources) ? input.resources : [];
  const cycleNumber = Number.isInteger(input.cycle) && input.cycle > 0 ? input.cycle : 1;
  const previous = input.previous ?? null;
  const evidence = input.evidence ?? {};

  const phases = [];
  phases.push(cognitivePhase("EXECUTED", "TASK", { task_id: task.id }));

  const ecology = runCognitiveEcologyCycle({
    previous,
    env: input.env ?? process.env,
    at: input.at ?? `continuous-cognition-${cycleNumber}`,
  });

  phases.push(cognitivePhase("MEASURED", "DISCOVER", {
    unknown_space: ecology.unknown_space?.length ?? 0,
    ecology_version: ecology.version,
  }));

  const cortex = cortexCycle({
    task,
    resources,
    expected: input.expected,
    observed: input.observed,
    evidence,
    contradiction: input.contradiction === true,
  });

  phases.push(cognitivePhase(cortex.graph?.status ?? "DISCOVERED", "COMPOSE", {
    selected: cortex.graph?.nodes?.map((node) => node.id) ?? [],
    missing: cortex.graph?.missing ?? [],
  }));
  phases.push(cognitivePhase("MEASURED", "PREDICT", {
    prediction_present: input.expected !== undefined,
  }));
  phases.push(cognitivePhase(evidence.executed === true ? "EXECUTED" : "UNOBSERVED", "OBSERVE", {
    observed_present: input.observed !== undefined,
  }));
  phases.push(cognitivePhase(cortex.measurement?.status ?? "INCONCLUSIVE", "MEASURE", {
    error: cortex.measurement?.error ?? null,
  }));
  phases.push(cognitivePhase(cortex.falsification?.refuted ? "REJECTED" : "MEASURED", "FALSIFY", {
    refuted: cortex.falsification?.refuted === true,
  }));

  const invariant = assertCortexInvariant(cortex);
  const verified = invariant.status === "VERIFIED" && evidence.verified === true && cortex.falsification?.refuted !== true;
  phases.push(cognitivePhase(verified ? "VERIFIED" : "INCONCLUSIVE", "VERIFY", {
    invariant: invariant.status,
  }));

  const learning = retainLearning({ task, cycle: cortex, measurement: cortex.measurement, verified });
  phases.push(cognitivePhase(learning.status, "LEARN", {
    retained: learning.status === "RETAINED",
  }));

  const adaptation = cortex.adaptation ?? { status: "INCONCLUSIVE", action: "WAIT_FOR_EVIDENCE" };
  phases.push(cognitivePhase(adaptation.status, "ADAPT", {
    action: adaptation.action,
    authority_changed: false,
  }));

  const continuity_token = buildContinuityToken({ task, cycle: cycleNumber, previous });
  phases.push(cognitivePhase("READY", "CONTINUE", {
    next_cycle: cycleNumber + 1,
    continuity_token,
  }));

  const gain = measureCapabilityGain({
    before: input.capabilities_before ?? [],
    after: input.capabilities_after ?? [],
    verified,
  });

  return {
    version: CONTINUOUS_COGNITION_VERSION,
    cycle: cycleNumber,
    status: verified ? "VERIFIED" : evidence.executed === true ? "EXECUTED" : "DISCOVERED",
    phases,
    task,
    ecology: {
      version: ecology.version,
      audit: ecology.audit?.status ?? "UNKNOWN",
      control_gap: ecology.control_gap?.status ?? "UNKNOWN",
      unknown_space: ecology.unknown_space?.length ?? 0,
    },
    cortex,
    learning,
    capability_gain: gain,
    continuity_token,
    next_cycle: cycleNumber + 1,
    authority: "carl",
    authority_granted: false,
    breaker_bypass: false,
    auto_merge: false,
    live: false,
  };
}

export function assertContinuousCognitionInvariant(result = {}) {
  const phaseOrder = result.phases?.map((phase) => phase.phase) ?? [];
  const checks = [
    result.version === CONTINUOUS_COGNITION_VERSION,
    JSON.stringify(phaseOrder) === JSON.stringify(COGNITIVE_PHASES),
    result.authority === "carl",
    result.authority_granted === false,
    result.breaker_bypass === false,
    result.auto_merge === false,
    result.live === false,
    result.cortex?.constitution?.one_cortex === true,
    result.cortex?.constitution?.cortex_belongs_to_acorn === true,
    result.cortex?.constitution?.capability_is_not_authority === true,
  ];
  return {
    status: checks.every(Boolean) ? "VERIFIED" : "HOLD_HUMAN",
    violations: checks.map((ok, index) => ok ? null : index).filter((index) => index !== null),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runContinuousCognitionCycle({
    task: { id: "self-measure", required_capabilities: ["reasoning"] },
    resources: [],
    evidence: { executed: true, verified: true },
    expected: 1,
    observed: 1,
  });
  console.log(JSON.stringify({
    version: result.version,
    status: result.status,
    phases: result.phases.map((phase) => phase.phase),
    continuity_token: result.continuity_token,
    invariant: assertContinuousCognitionInvariant(result),
    live: result.live,
    auto_merge: result.auto_merge,
  }, null, 2));
}
