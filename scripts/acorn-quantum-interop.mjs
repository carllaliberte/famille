#!/usr/bin/env node
/**
 * ACORN — QUANTUM / FUTURE INTELLIGENCE INTEROP
 *
 * Compatibility contract for future quantum-native, quantum-assisted and
 * hybrid intelligences entering the existing Acorn flow.
 *
 * This is an interop contract, NOT a second Cortex, registry, authority,
 * runtime, or security layer.
 *
 * IDENTITY != MODEL != CHANNEL != CAPABILITY != AUTHORITY
 * QUANTUM != PROVEN
 * SIMULATOR != QPU
 * QPU != QUANTUM INTELLIGENCE
 * CAPABILITY != AUTHORITY
 * DECLARED != CONNECTED != MEASURED != VERIFIED != PROVEN
 */
import { createHash } from "node:crypto";

export const QUANTUM_INTEROP_VERSION = "acorn.quantum-interop.v1";

export const QUANTUM_RESOURCE_TYPES = Object.freeze([
  "qpu", "quantum_simulator", "quantum_annealer", "photonic_quantum",
  "neutral_atom", "trapped_ion", "superconducting", "spin_qubit",
  "quantum_network", "hybrid_quantum_classical", "unknown_quantum",
]);

export const QUANTUM_INTELLIGENCE_MODES = Object.freeze([
  "QUANTUM_NATIVE",
  "QUANTUM_ASSISTED",
  "HYBRID",
  "CLASSICAL_FALLBACK",
  "UNKNOWN",
]);

export const QUANTUM_EVIDENCE_STATES = Object.freeze([
  "DECLARED", "DISCOVERED", "CONNECTED", "MEASURED", "BENCHMARKED",
  "VERIFIED", "EXECUTABLE", "PROVEN", "DEGRADED", "EXPIRED",
  "REVOKED", "UNKNOWN",
]);

const text = (v) => String(v ?? "").trim();
const list = (v) => Array.isArray(v) ? v.map(text).filter(Boolean) : [];
const bool = (v) => v === true;
const number = (v, fallback = null) => Number.isFinite(Number(v)) ? Number(v) : fallback;

function stable(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  return "{" + Object.keys(value).sort().map((k) => JSON.stringify(k) + ":" + stable(value[k])).join(",") + "}";
}

function digest(value) {
  return createHash("sha256").update(stable(value)).digest("hex");
}

export function quantumInteropConstitution() {
  return Object.freeze({
    version: QUANTUM_INTEROP_VERSION,
    existing_cortex: true,
    second_cortex: false,
    second_registry: false,
    second_runtime: false,
    second_authority: false,
    fixed_provider_allowlist: false,
    provider_neutral: true,
    capability_first: true,
    capability_is_not_authority: true,
    simulator_is_not_qpu: true,
    qpu_is_not_intelligence: true,
    quantum_claims_require_measurement: true,
    verification_requires_evidence: true,
    fallback_is_explicit: true,
    paid_execution_requires_human: true,
    arbitrary_self_modification: false,
    auto_merge: false,
    auto_spend: false,
    live: false,
    authority: "carl",
  });
}

export function classifyQuantumResource(input = {}) {
  const blob = [
    input.type, input.compute_type, input.architecture, input.paradigm,
    input.provider, input.implementation, input.name,
  ].map(text).join(" ").toLowerCase();

  if (!blob.includes("quantum") && !/qpu|qubit|anneal|photonic|ion|transmon|superconduct|neutral.?atom/.test(blob)) {
    return { quantum: false, type: "CLASSICAL", confidence: "OBSERVED", authority: false };
  }

  let type = "unknown_quantum";
  if (/anneal/.test(blob)) type = "quantum_annealer";
  else if (/photonic/.test(blob)) type = "photonic_quantum";
  else if (/neutral.?atom/.test(blob)) type = "neutral_atom";
  else if (/trapped.?ion|ionq|quantinuum/.test(blob)) type = "trapped_ion";
  else if (/superconduct|transmon|ibm|rigetti/.test(blob)) type = "superconducting";
  else if (/spin.?qubit|silicon.?spin/.test(blob)) type = "spin_qubit";
  else if (/simulator|statevector|qasm/.test(blob)) type = "quantum_simulator";
  else if (/qpu|qubit/.test(blob)) type = "qpu";

  return {
    quantum: true,
    type,
    confidence: type === "unknown_quantum" ? "DISCOVERED" : "IDENTIFIED",
    authority: false,
  };
}

export function makeQuantumCapability(input = {}, proof = {}) {
  const classification = classifyQuantumResource(input);
  const measured = bool(proof.measured);
  const verified = bool(proof.verified);
  const connected = bool(proof.connected);
  const executed = bool(proof.executed);
  let status = text(input.status).toUpperCase() || "DECLARED";
  if (["LIVE", "CERTIFIED", "READY", "AVAILABLE"].includes(status) && !verified) status = "UNKNOWN";
  if (executed && verified) status = "PROVEN";
  else if (executed && measured) status = "EXECUTABLE";
  else if (verified) status = "VERIFIED";
  else if (measured) status = "MEASURED";
  else if (connected) status = "CONNECTED";
  else if (classification.quantum) status = "DISCOVERED";

  const now = text(input.observed_at) || new Date().toISOString();
  return {
    capability_id: text(input.capability_id) || `quantum.${digest({input, proof}).slice(0, 20)}`,
    identity: text(input.identity) || text(input.name) || "UNKNOWN",
    type: classification.type,
    quantum: classification.quantum,
    provider: text(input.provider) || "UNKNOWN",
    model: text(input.model) || "UNKNOWN",
    channel: text(input.channel) || "UNKNOWN",
    interface: text(input.interface) || "UNKNOWN",
    protocol: text(input.protocol) || "UNKNOWN",
    status,
    architecture: text(input.architecture) || classification.type,
    qubits: number(input.qubits ?? input.qubit_count),
    logical_qubits: number(input.logical_qubits),
    physical_qubits: number(input.physical_qubits),
    error_rates: input.error_rates && typeof input.error_rates === "object" ? input.error_rates : null,
    coherence: input.coherence ?? null,
    calibration: input.calibration ?? null,
    supported_operations: list(input.supported_operations),
    supported_algorithms: list(input.supported_algorithms),
    hybrid: bool(input.hybrid),
    classical_control: input.classical_control !== false,
    error_mitigation: list(input.error_mitigation),
    error_correction: list(input.error_correction),
    measurement: proof.measurement || null,
    evidence: proof.evidence || null,
    provenance: {
      source: text(input.source) || "quantum-interop",
      observed_at: now,
      digest: digest({input, proof}),
    },
    authority: false,
    intelligence: false,
    live: false,
    certified: false,
  };
}

export function adaptQuantumIntelligence(input = {}) {
  const capability = input.capability || makeQuantumCapability(input, input.proof || {});
  const quantum = capability.quantum === true;
  const intelligence = input.intelligence === true || text(input.role).toUpperCase() === "INTELLIGENCE";
  const verified = ["VERIFIED", "PROVEN", "EXECUTABLE"].includes(capability.status);
  const connected = ["CONNECTED", "MEASURED", "BENCHMARKED", "VERIFIED", "EXECUTABLE", "PROVEN"].includes(capability.status);

  let mode = "UNKNOWN";
  if (quantum && intelligence && verified) mode = input.hybrid === true ? "HYBRID" : "QUANTUM_NATIVE";
  else if (quantum && intelligence && connected) mode = "QUANTUM_ASSISTED";
  else if (!quantum && intelligence && connected) mode = "CLASSICAL_FALLBACK";

  return {
    adapter_version: QUANTUM_INTEROP_VERSION,
    identity: text(input.identity) || capability.identity,
    mode,
    quantum_capability: quantum,
    intelligence,
    connected,
    verified,
    provider_neutral: true,
    fixed_provider_allowlist: false,
    capability_first: true,
    authority: false,
    can_authorize: false,
    can_merge: false,
    can_spend: false,
    can_change_governance: false,
    live: false,
    evidence_required_for_promotion: true,
  };
}

export function buildHybridTask(input = {}) {
  const classical = Array.isArray(input.classical_steps) ? input.classical_steps : [];
  const quantum = Array.isArray(input.quantum_steps) ? input.quantum_steps : [];
  const fallback = Array.isArray(input.fallback_steps) ? input.fallback_steps : [];
  return {
    task_id: text(input.task_id) || `hybrid.${digest(input).slice(0, 16)}`,
    mode: "HYBRID",
    classical_steps: classical,
    quantum_steps: quantum,
    fallback_steps: fallback,
    requires_qpu: bool(input.requires_qpu),
    allow_simulator: input.allow_simulator !== false,
    fallback_allowed: input.fallback_allowed !== false,
    expected_advantage: "UNKNOWN",
    quantum_advantage_proven: false,
    authority: false,
    live: false,
  };
}

export function routeQuantumTask({ task = {}, capabilities = [], human_authorization = false } = {}) {
  const rows = Array.isArray(capabilities) ? capabilities : [];
  const quantum = rows.filter((row) => row.quantum === true);
  const verifiedQuantum = quantum.filter((row) => ["VERIFIED", "PROVEN", "EXECUTABLE"].includes(row.status));
  const simulators = verifiedQuantum.filter((row) => row.type === "quantum_simulator");
  const qpus = verifiedQuantum.filter((row) => ["qpu", "quantum_annealer", "photonic_quantum", "neutral_atom", "trapped_ion", "superconducting", "spin_qubit"].includes(row.type));
  const costOf = (row) => number(row.cost?.actual ?? row.cost?.estimated, null);
  const paid = (row) => {
    const c = costOf(row);
    return c != null && c > 0;
  };

  if (task.requires_qpu === true) {
    const allowed = qpus.filter((row) => !paid(row) || human_authorization === true);
    if (!allowed.length) {
      return {
        status: "HOLD_HUMAN",
        reason: qpus.length ? "PAID_QPU_REQUIRES_HUMAN" : "VERIFIED_QPU_NOT_PRESENT",
        selected: null,
        fallback: task.fallback_allowed !== false,
        live: false,
      };
    }
    return {
      status: "SELECTED",
      selected: allowed[0].capability_id,
      mode: "QUANTUM_NATIVE",
      fallback: false,
      authority: false,
      live: false,
    };
  }

  if (task.allow_simulator !== false && simulators.length) {
    return {
      status: "SELECTED",
      selected: simulators[0].capability_id,
      mode: "QUANTUM_ASSISTED",
      fallback: true,
      reason: "SIMULATOR_FIRST",
      authority: false,
      live: false,
    };
  }

  if (qpus.length) {
    const candidate = qpus.find((row) => !paid(row) || human_authorization === true);
    if (candidate) return {
      status: "SELECTED",
      selected: candidate.capability_id,
      mode: "QUANTUM_NATIVE",
      fallback: false,
      authority: false,
      live: false,
    };
    return {
      status: "HOLD_HUMAN",
      reason: "PAID_QPU_REQUIRES_HUMAN",
      selected: null,
      fallback: task.fallback_allowed !== false,
      live: false,
    };
  }

  return {
    status: task.fallback_allowed !== false ? "FALLBACK_CLASSICAL" : "HOLD_HUMAN",
    reason: "NO_VERIFIED_QUANTUM_CAPABILITY",
    selected: null,
    mode: "CLASSICAL_FALLBACK",
    fallback: task.fallback_allowed !== false,
    authority: false,
    live: false,
  };
}

export function quantumBenchmarkContract({ baseline = {}, candidate = {}, task = {} } = {}) {
  const metrics = ["correctness", "latency_ms", "throughput", "energy", "cost", "error_rate", "reproducibility"];
  const measured = {};
  for (const key of metrics) {
    measured[key] = {
      baseline: number(baseline[key]),
      candidate: number(candidate[key]),
      improvement: null,
      measured: Number.isFinite(number(candidate[key])) && Number.isFinite(number(baseline[key])),
    };
    if (measured[key].measured && Number(baseline[key]) !== 0) {
      measured[key].improvement = Number(((Number(baseline[key]) - Number(candidate[key])) / Math.abs(Number(baseline[key]))).toFixed(6));
    }
  }
  const evidence = {
    task_digest: digest(task),
    baseline_digest: digest(baseline),
    candidate_digest: digest(candidate),
    metrics,
    measured_count: Object.values(measured).filter((x) => x.measured).length,
  };
  return {
    version: QUANTUM_INTEROP_VERSION,
    measured,
    evidence,
    quantum_advantage: false,
    quantum_advantage_status: evidence.measured_count >= 1 ? "MEASURABLE_BUT_NOT_PROVEN" : "INSUFFICIENT_DATA",
    live: false,
  };
}

export function verifyQuantumResult({ result = {}, evidence = {}, expected = {} } = {}) {
  const hasMeasurement = result.measured === true || Number.isFinite(Number(result.shots));
  const hasEvidence = evidence != null && Object.keys(evidence).length > 0;
  const reproducible = expected.reproducibility == null
    ? null
    : Number(expected.reproducibility) >= 0;
  return {
    verified: hasMeasurement && hasEvidence && reproducible !== false,
    measured: hasMeasurement,
    evidence_present: hasEvidence,
    reproducible,
    quantum_advantage_proven: false,
    authority: false,
    live: false,
  };
}

export function assertQuantumInteropInvariant(value = {}) {
  const c = quantumInteropConstitution();
  const violations = [];
  for (const [key, expected] of Object.entries(c)) {
    if (value[key] !== undefined && value[key] !== expected) violations.push(key);
  }
  if (violations.length) throw new Error("QUANTUM_INTEROP_INVARIANT_FAILED:" + violations.join(","));
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(quantumInteropConstitution(), null, 2));
}
