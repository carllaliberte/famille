#!/usr/bin/env node
// @ts-nocheck
/**
 * ACORN GLOBAL CAPABILITY REGISTRY
 *
 * Living, capability-based registry owned by Cortex.
 * Not a provider list. Not a second brain. Not a seventh layer.
 *
 *   IDENTITY ≠ MODEL ≠ CHANNEL ≠ CAPABILITY ≠ AUTHORITY
 *   CAPABILITY ≠ AUTHORITY
 *   DEFINED ≠ EXECUTED · OBSERVED ≠ PROVEN · CONSENSUS ≠ TRUTH
 *   MORE COMPUTE ≠ AUTOMATICALLY BETTER
 *
 * The registry is larger than the currently connected world.
 * Unknown stays unknown until measured. Documentation is never LIVE.
 * Breaker is human and outside this registry.
 *
 * MAIN = REALITY. AUTO_MERGE = FALSE. MERGE = CARL.
 */
import { createHash } from "node:crypto";
import {
  discoverCompute,
  executeComputeTask,
  snapshotComputeFabric,
  computeConstitution,
} from "./acorn-compute-fabric.mjs";

async function cognitiveModule() {
  try {
    return await import("./cognitive-node-adapters.mjs");
  } catch {
    return null;
  }
}

export const REGISTRY_VERSION = "acorn.capability-registry.v0";
export const UNKNOWN = "UNKNOWN";

export const HONEST_STATES = Object.freeze([
  "DISCOVERED",
  "IDENTIFIED",
  "DESCRIBED",
  "AUTHENTICATED",
  "AVAILABLE",
  "CONNECTED",
  "SANDBOXED",
  "MEASURED",
  "BENCHMARKED",
  "VERIFIED",
  "EXECUTABLE",
  "SWARM_ELIGIBLE",
  "PROVEN",
  "DEGRADED",
  "EXPIRED",
  "REVOKED",
  "HOLD_HUMAN",
  "FAILED",
  "UNKNOWN",
]);

export const FORBIDDEN_STATES = Object.freeze([
  "LIVE", "READY", "CERTIFIED", "SUPER_BRAIN", "CONSCIOUS",
]);

export const HEALTH_STATES = Object.freeze([
  "HEALTHY", "DEGRADED", "UNKNOWN", "UNAVAILABLE", "QUARANTINED", "REVOKED",
]);

export const UNKNOWN_CLASSES = Object.freeze([
  "UNKNOWN_CAPABILITY",
  "UNKNOWN_COMPUTE",
  "UNKNOWN_INTELLIGENCE",
  "UNKNOWN_SENSOR",
  "UNKNOWN_MEMORY",
  "UNKNOWN_NETWORK",
  "UNKNOWN_ALGORITHM",
  "UNKNOWN_PHYSICS",
  "UNKNOWN_INTERFACE",
]);

export const COST_LADDER = Object.freeze([
  "FREE",
  "OPEN_SOURCE",
  "LOCAL",
  "PUBLIC",
  "ACADEMIC",
  "FREE_CREDITS",
  "LOW_COST",
  "PAID",
]);

export const DISCOVERY_LOOP = Object.freeze([
  "DISCOVER",
  "IDENTIFY",
  "MEASURE",
  "BENCHMARK",
  "VERIFY",
  "REGISTER",
  "CONNECT",
  "SWARM",
  "OBSERVE",
  "LEARN",
  "RE_EVALUATE",
  "DISCOVER_AGAIN",
]);

export const INGEST_STEPS = Object.freeze([
  "DISCOVER", "ISOLATE", "CHARACTERIZE", "MEASURE", "CLASSIFY", "TEST", "INTEGRATE", "REJECT",
]);

export const ADAPTER_METHODS = Object.freeze([
  "discover", "identify", "authenticate", "describe", "health", "capabilities",
  "benchmark", "execute", "observe", "cancel", "evidence", "provenance", "revoke",
]);

export const TAXONOMY = Object.freeze({
  COMPUTE: ["cpu", "gpu", "tpu", "npu", "xpu", "fpga", "asic", "dsp", "dpu", "ipu", "smartnic", "microcontroller", "edge", "server", "bare_metal", "cluster", "hpc", "supercomputer", "mainframe", "cloud", "serverless", "webassembly", "distributed"],
  QUANTUM: ["superconducting", "trapped_ion", "neutral_atom", "photonic_quantum", "silicon_spin", "topological_research", "annealing", "quantum_inspired", "quantum_simulator", "hybrid_quantum_classical", "error_correction", "future_quantum"],
  PHOTONIC: ["silicon_photonics", "optical_compute", "photonic_ai", "optical_neural_network", "analog_optical", "optical_interconnect"],
  NEUROMORPHIC: ["spiking_nn", "event_driven", "neuromorphic_hardware", "neuromorphic_simulation", "event_camera"],
  NONTRADITIONAL: ["analog", "stochastic", "molecular", "dna", "biochemical", "reservoir", "cellular_automata", "memristive", "in_memory", "near_memory", "reversible", "probabilistic"],
  AI: ["llm", "slm", "multimodal", "vision", "audio", "speech", "video", "image", "code", "reasoning", "embedding", "reranking", "agent", "planner", "symbolic", "theorem_proving", "expert_system", "rl", "evolutionary", "world_model", "simulation_agent", "generator", "verifier", "contradictor", "synthesizer", "observer", "coder"],
  MEMORY: ["ram", "persistent", "nvme", "object_storage", "relational", "document", "graph", "vector", "timeseries", "knowledge_graph", "semantic", "episodic", "temporal", "provenance", "experimental", "failure", "swarm"],
  NETWORK: ["internet", "ipv4", "ipv6", "quic", "http", "websocket", "grpc", "p2p", "mesh", "cdn", "edge_net", "satellite_net", "optical_net", "rdma", "infiniband"],
  DATA: ["open_data", "scientific", "genomic", "astronomical", "climate", "geospatial", "financial", "linguistic", "image_data", "video_data", "sensor_data", "telemetry", "realtime", "public_api"],
  SCIENCE: ["mathematics", "physics", "chemistry", "biology", "genomics", "neuroscience", "materials", "astronomy", "climate_science", "earth_science", "engineering", "fluid_dynamics", "molecular_dynamics", "particle_physics", "cosmology"],
  SIMULATION: ["monte_carlo", "digital_twin", "physics_sim", "molecular_sim", "climate_sim", "network_sim", "economic_sim", "agent_based", "robotics_sim", "quantum_sim", "scientific_sim"],
  PERCEPTION: ["camera", "microphone", "lidar", "radar", "satellite_sensor", "weather_sensor", "environmental_sensor", "industrial_sensor", "biomedical", "laboratory", "telescope", "microscope", "scientific_detector"],
  ROBOTICS: ["industrial_robot", "mobile_robot", "drone", "autonomous_vehicle", "robotic_arm", "humanoid", "underwater", "agricultural_robot", "warehouse_robot"],
  PHYSICAL: ["iot", "factory", "laboratory_system", "building", "transportation", "energy_system", "agriculture", "infrastructure"],
  SPACE: ["satellite", "earth_observation", "gnss", "observatory", "orbital_sim", "satellite_telemetry"],
  ENERGY: ["power", "battery", "renewable", "grid_data", "thermal", "energy_aware_scheduling", "compute_efficiency", "carbon"],
  SECURITY: ["zero_trust", "sandbox", "isolation", "confidential", "tee", "cryptography", "pqc", "identity", "attestation", "key_management", "provenance_sec", "supply_chain", "adversarial_sec"],
  VERIFICATION: ["formal", "theorem_proving_tool", "static_analysis", "symbolic_execution", "fuzzing", "model_checking", "property_testing", "reproduction", "adversarial_testing", "statistical_validation", "arithmetic"],
  SOFTWARE: ["git", "cicd", "containers", "kubernetes", "build", "package_registry", "artifact", "deployment", "observability", "testing"],
  KNOWLEDGE: ["literature", "patents", "standards", "documentation", "books", "archives", "knowledge_graph_store", "institutional"],
  HUMAN: ["text", "voice", "vision_ui", "gesture", "accessibility", "collaboration", "expert_input", "human_approval"],
  ECONOMIC: ["free_compute", "research_credits", "academic_compute", "public_infra", "idle_compute", "distributed_compute", "marketplace", "cost_optimization"],
  DISCOVERY: ["model_discovery", "provider_discovery", "api_discovery", "hardware_discovery", "dataset_discovery", "tool_discovery", "plugin_discovery", "opensource_discovery", "adapter_discovery"],
});

export const CATEGORIES = Object.freeze(Object.keys(TAXONOMY));

const SUBCATEGORY_INDEX = (() => {
  const map = new Map();
  for (const [category, subs] of Object.entries(TAXONOMY)) {
    for (const sub of subs) map.set(sub, category);
  }
  return map;
})();

const KIND_HINTS = Object.freeze({
  cpu: ["COMPUTE", "cpu"], gpu: ["COMPUTE", "gpu"], tpu: ["COMPUTE", "tpu"],
  npu: ["COMPUTE", "npu"], fpga: ["COMPUTE", "fpga"], hpc: ["COMPUTE", "hpc"],
  qpu: ["QUANTUM", "superconducting"], simulator: ["QUANTUM", "quantum_simulator"],
  photonic: ["PHOTONIC", "silicon_photonics"], neuromorphic: ["NEUROMORPHIC", "neuromorphic_hardware"],
  analog: ["NONTRADITIONAL", "analog"], llm: ["AI", "llm"], planner: ["AI", "planner"],
  sensor: ["PERCEPTION", "environmental_sensor"], camera: ["PERCEPTION", "camera"],
});

const capabilities = new Map();
const history = [];
const experiences = [];
const executions = [];
let seeded = false;

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

export function honestStatus(state, { measured = false, connected = false, verified = false } = {}) {
  const s = text(state).toUpperCase() || UNKNOWN;
  if (FORBIDDEN_STATES.includes(s)) return UNKNOWN;
  if (s === "AVAILABLE" && !measured && !connected && !verified) return "DESCRIBED";
  if (!HONEST_STATES.includes(s)) return UNKNOWN;
  return s;
}

export function registryConstitution() {
  return Object.freeze({
    version: REGISTRY_VERSION,
    owner: "acorn",
    belongs_to_cortex: true,
    second_cortex: false,
    second_brain: false,
    second_fabric: false,
    second_mesh: false,
    second_registry: false,
    capability_based: true,
    provider_based: false,
    model_based: false,
    hardware_based: false,
    identity_neq_model: true,
    model_neq_channel: true,
    channel_neq_capability: true,
    capability_neq_authority: true,
    compute_is_resource: true,
    compute_is_not_intelligence: true,
    unknown_capability_is_legitimate: true,
    documentation_is_not_live: true,
    spending_authority: "human",
    breaker_is_not_a_capability: true,
    breaker_is_human: true,
    merge_is_human: true,
    auto_merge: false,
    live: false,
    authority: "carl",
    compute: computeConstitution(),
  });
}

export function inventoryProbe() {
  return {
    ok: true,
    version: REGISTRY_VERSION,
    auto_merge: false,
    live: false,
    authority: "carl",
    capability_neq_authority: true,
  };
}

export const capabilityProbe = inventoryProbe;

export function resetCapabilityRegistry() {
  capabilities.clear();
  history.length = 0;
  experiences.length = 0;
  executions.length = 0;
  seeded = false;
}

function field(value, provenance = "declared") {
  if (value === undefined || value === null || value === "") {
    return { value: UNKNOWN, provenance, live: false };
  }
  return { value, provenance, live: false };
}

export function classifyCapability(input = {}) {
  const raw = text(input.kind || input.type || input.subcategory || input.category || input.name);
  const lower = raw.toLowerCase().replace(/[\s-]+/g, "_");
  if (!raw) {
    return {
      class: "UNKNOWN_CAPABILITY",
      category: UNKNOWN,
      subcategory: UNKNOWN,
      forced_category: false,
      status: UNKNOWN,
      authority: false,
      live: false,
    };
  }
  if (UNKNOWN_CLASSES.includes(raw.toUpperCase())) {
    return {
      class: raw.toUpperCase(),
      category: UNKNOWN,
      subcategory: UNKNOWN,
      forced_category: false,
      status: "DISCOVERED",
      authority: false,
      live: false,
    };
  }
  if (TAXONOMY[raw.toUpperCase()]) {
    return {
      class: raw.toUpperCase(),
      category: raw.toUpperCase(),
      subcategory: UNKNOWN,
      forced_category: false,
      status: "IDENTIFIED",
      authority: false,
      live: false,
    };
  }
  if (SUBCATEGORY_INDEX.has(lower)) {
    const category = SUBCATEGORY_INDEX.get(lower);
    return {
      class: lower,
      category,
      subcategory: lower,
      forced_category: false,
      status: "IDENTIFIED",
      authority: false,
      live: false,
    };
  }
  const hint = KIND_HINTS[lower];
  if (hint) {
    return {
      class: lower,
      category: hint[0],
      subcategory: hint[1],
      forced_category: false,
      status: "IDENTIFIED",
      authority: false,
      live: false,
    };
  }
  if (/sensor|lidar|radar|camera|microphone/i.test(raw)) {
    return {
      class: "UNKNOWN_SENSOR",
      category: "PERCEPTION",
      subcategory: UNKNOWN,
      forced_category: false,
      status: "DISCOVERED",
      authority: false,
      live: false,
    };
  }
  if (/qpu|qubit|quantum/i.test(raw) && !/simulat/i.test(raw)) {
    return {
      class: "UNKNOWN_COMPUTE",
      category: "QUANTUM",
      subcategory: UNKNOWN,
      forced_category: false,
      status: "DISCOVERED",
      authority: false,
      live: false,
    };
  }
  if (/lattice|accelerator|architecture|2055|2029|unknown/i.test(raw)) {
    return {
      class: "UNKNOWN_CAPABILITY",
      category: UNKNOWN,
      subcategory: UNKNOWN,
      kind: raw,
      forced_category: false,
      status: "DISCOVERED",
      measured: false,
      authority: false,
      live: false,
    };
  }
  return {
    class: "UNKNOWN_CAPABILITY",
    category: UNKNOWN,
    subcategory: UNKNOWN,
    kind: raw,
    forced_category: false,
    status: "DISCOVERED",
    measured: false,
    authority: false,
    live: false,
  };
}

export function makeCapability(input = {}, proof = {}) {
  const classified = classifyCapability(input);
  const measured = proof.measured === true;
  const connected = proof.connected === true;
  const verified = proof.verified === true;
  const executed = proof.executed === true;
  const now = iso(input.observed_at || input.at);
  const paid = text(input.cost_class) === "PAID" || Number(input.cost?.estimated_cost) > 0;
  const authorization = text(input.authorization) || (paid ? "REQUIRES_HUMAN_AUTHORIZATION" : "FREE");
  const costClass = text(input.cost_class) || (paid ? "PAID" : (authorization === "FREE" ? "FREE" : UNKNOWN));
  let status = honestStatus(input.status, { measured, connected, verified });
  if (executed && verified) status = "PROVEN";
  else if (executed && measured) status = "EXECUTABLE";
  else if (verified) status = "VERIFIED";
  else if (measured) status = status === "DISCOVERED" || status === "DESCRIBED" || status === UNKNOWN ? "MEASURED" : status;
  else if (connected) status = status === UNKNOWN ? "CONNECTED" : status;
  const health = healthFrom({ status, measured, connected, revoked: status === "REVOKED", quarantined: input.quarantined === true, expired: input.expired === true });
  const capability_id = text(input.capability_id) || id("cap");
  const caps = list(input.capabilities || input.measured_roles || input.declared_roles);
  if (classified.subcategory && classified.subcategory !== UNKNOWN && !caps.includes(classified.subcategory)) {
    caps.push(classified.subcategory);
  }
  if (classified.category !== UNKNOWN && !caps.includes(classified.category.toLowerCase())) {
    caps.push(classified.category.toLowerCase());
  }
  return {
    capability_id,
    identity: text(input.identity) || capability_id,
    type: text(input.type) || classified.subcategory || classified.class,
    category: classified.category === UNKNOWN ? (text(input.category).toUpperCase() || UNKNOWN) : classified.category,
    subcategory: classified.subcategory === UNKNOWN ? (text(input.subcategory) || UNKNOWN) : classified.subcategory,
    class: classified.class,
    forced_category: false,
    provider: text(input.provider) || UNKNOWN,
    implementation: text(input.implementation || input.model) || UNKNOWN,
    model: text(input.model) || UNKNOWN,
    channel: text(input.channel) || UNKNOWN,
    interface: text(input.interface) || UNKNOWN,
    protocol: text(input.protocol) || UNKNOWN,
    location: text(input.location) || UNKNOWN,
    jurisdiction: text(input.jurisdiction) || UNKNOWN,
    availability: measured || connected ? "OBSERVED" : UNKNOWN,
    access_mode: text(input.access_mode) || UNKNOWN,
    authorization,
    cost: {
      class: paid ? "PAID" : (authorization === "FREE" ? "FREE" : UNKNOWN),
      estimated: input.cost?.estimated_cost ?? (authorization === "FREE" ? 0 : UNKNOWN),
      actual: input.cost?.actual_cost ?? UNKNOWN,
      currency: input.cost?.currency || "USD",
      ladder: paid ? "PAID" : (text(input.access_mode) === "local" ? "LOCAL" : (authorization === "FREE" ? "FREE" : UNKNOWN)),
    },
    energy: field(input.energy, measured ? "measured" : "unknown"),
    latency: field(input.latency ?? input.latency_ms, measured ? "measured" : "declared"),
    throughput: field(input.throughput),
    precision: field(input.precision),
    reliability: field(input.reliability, measured ? "measured" : "unknown"),
    quality: field(input.quality, measured ? "measured" : "unknown"),
    security: field(input.security),
    provenance: {
      source: text(input.source) || "registry",
      hash: digest({ identity: input.identity, type: input.type, provider: input.provider }),
      observed_at: now,
    },
    dependencies: list(input.dependencies),
    compatibility: list(input.compatibility),
    capabilities: caps,
    measurements: proof.measurement || null,
    evidence: proof.evidence || null,
    versions: list(input.versions).concat(text(input.version) ? [text(input.version)] : []),
    temporal_validity: {
      observed_at: now,
      valid_from: input.valid_from || now,
      valid_until: input.valid_until || null,
      expires_at: input.expires_at || input.valid_until || null,
      last_verified: verified ? now : null,
      version: text(input.version) || REGISTRY_VERSION,
    },
    health,
    maturity: verified ? "VERIFIED" : measured ? "MEASURED" : connected ? "CONNECTED" : "DESCRIBED",
    status,
    backend: text(input.backend) || null,
    backend_ref: text(input.backend_ref) || null,
    observe_is_not_act: input.observe_is_not_act === true || classified.category === "PERCEPTION" || classified.category === "PHYSICAL" || classified.category === "ROBOTICS",
    swarm_eligible: connected && measured && authorization === "FREE" && ["EXECUTABLE", "VERIFIED", "PROVEN", "MEASURED", "SWARM_ELIGIBLE"].includes(status),
    authority: false,
    intelligence: classified.category === "AI",
    live: false,
    certified: false,
  };
}

function healthFrom({ status, measured, connected, revoked, quarantined, expired }) {
  if (revoked || status === "REVOKED") return "REVOKED";
  if (quarantined) return "QUARANTINED";
  if (expired || status === "EXPIRED") return "UNAVAILABLE";
  if (status === "DEGRADED") return "DEGRADED";
  if (status === "FAILED") return "DEGRADED";
  if ((status === "EXECUTABLE" || status === "VERIFIED" || status === "PROVEN" || status === "SWARM_ELIGIBLE") && measured) return "HEALTHY";
  if (connected && measured) return "HEALTHY";
  if (connected && !measured) return "UNKNOWN";
  return "UNKNOWN";
}

function rememberHistory(capability_id, event, extra = {}) {
  const row = {
    event_id: id("hist"),
    capability_id,
    event,
    at: iso(extra.at),
    status: extra.status || UNKNOWN,
    health: extra.health || UNKNOWN,
    hash: digest({ capability_id, event, extra }),
    live: false,
  };
  history.unshift(row);
  if (history.length > 400) history.length = 400;
  return row;
}

export function registerCapability(input = {}, proof = {}) {
  const cap = makeCapability(input, proof);
  const existing = capabilities.get(cap.capability_id);
  if (existing) {
    const merged = {
      ...existing,
      ...cap,
      temporal_validity: {
        ...existing.temporal_validity,
        ...cap.temporal_validity,
        observed_at: cap.temporal_validity.observed_at,
      },
      provenance: cap.provenance,
    };
    capabilities.set(cap.capability_id, merged);
    rememberHistory(cap.capability_id, "UPDATED", { status: merged.status, health: merged.health });
    return merged;
  }
  capabilities.set(cap.capability_id, cap);
  rememberHistory(cap.capability_id, "REGISTERED", { status: cap.status, health: cap.health });
  return cap;
}

export function getCapability(capability_id) {
  ensureSeeded();
  return capabilities.get(text(capability_id)) || null;
}

export function listCapabilities({ category, status, health, authorization } = {}) {
  ensureSeeded();
  let rows = [...capabilities.values()];
  if (category) rows = rows.filter((row) => row.category === text(category).toUpperCase());
  if (status) rows = rows.filter((row) => row.status === text(status).toUpperCase());
  if (health) rows = rows.filter((row) => row.health === text(health).toUpperCase());
  if (authorization) rows = rows.filter((row) => row.authorization === text(authorization));
  return rows;
}

export function taxonomyView() {
  ensureSeeded();
  const counts = {};
  for (const category of CATEGORIES) {
    const rows = [...capabilities.values()].filter((row) => row.category === category);
    counts[category] = {
      total: rows.length + TAXONOMY[category].length,
      registered: rows.length,
      subcategories: TAXONOMY[category].length,
      executable: rows.filter((row) => ["EXECUTABLE", "VERIFIED", "PROVEN", "SWARM_ELIGIBLE"].includes(row.status)).length,
      hold_human: rows.filter((row) => row.authorization === "REQUIRES_HUMAN_AUTHORIZATION" || row.status === "HOLD_HUMAN").length,
      unknown: rows.filter((row) => row.class?.startsWith("UNKNOWN") || row.status === UNKNOWN).length,
      status: rows.some((row) => ["EXECUTABLE", "VERIFIED", "PROVEN"].includes(row.status))
        ? "MEASURED"
        : rows.length
          ? "DISCOVERED"
          : "DESCRIBED",
    };
  }
  counts.UNKNOWN = {
    total: [...capabilities.values()].filter((row) => row.category === UNKNOWN).length,
    registered: [...capabilities.values()].filter((row) => row.category === UNKNOWN).length,
    subcategories: UNKNOWN_CLASSES.length,
    executable: 0,
    hold_human: [...capabilities.values()].filter((row) => row.category === UNKNOWN).length,
    unknown: [...capabilities.values()].filter((row) => row.category === UNKNOWN).length,
    status: "DISCOVERED",
  };
  return { categories: CATEGORIES.concat(["UNKNOWN"]), counts, live: false };
}

const WORLD_CATALOG = Object.freeze([
  { capability_id: "cap.compute.tpu.cloud", identity: "cap.tpu.cloud", type: "tpu", category: "COMPUTE", subcategory: "tpu", provider: "google", implementation: "tpu", interface: "api", access_mode: "remote", authorization: "REQUIRES_HUMAN_AUTHORIZATION", cost_class: "PAID", status: "DESCRIBED", capabilities: ["tpu", "cloud"] },
  { capability_id: "cap.compute.hpc", identity: "cap.hpc.cluster", type: "hpc", category: "COMPUTE", subcategory: "hpc", provider: UNKNOWN, implementation: "slurm", interface: "ssh", access_mode: "remote", authorization: "REQUIRES_HUMAN_AUTHORIZATION", status: "DESCRIBED", capabilities: ["hpc", "cluster"] },
  { capability_id: "cap.compute.fpga", identity: "cap.fpga", type: "fpga", category: "COMPUTE", subcategory: "fpga", provider: UNKNOWN, implementation: UNKNOWN, interface: UNKNOWN, status: "DESCRIBED", capabilities: ["fpga"] },
  { capability_id: "cap.quantum.ibm", identity: "cap.qpu.superconducting.ibm", type: "qpu", category: "QUANTUM", subcategory: "superconducting", provider: "ibm", implementation: "ibm-quantum", interface: "rest", access_mode: "remote", authorization: "REQUIRES_HUMAN_AUTHORIZATION", cost_class: "PAID", status: "DISCOVERED", capabilities: ["quantum_execution", "qpu"] },
  { capability_id: "cap.quantum.braket", identity: "cap.qpu.braket", type: "qpu", category: "QUANTUM", subcategory: "hybrid_quantum_classical", provider: "aws", implementation: "braket", interface: "rest", access_mode: "remote", authorization: "REQUIRES_HUMAN_AUTHORIZATION", cost_class: "PAID", status: "DISCOVERED", capabilities: ["quantum_execution", "qpu"] },
  { capability_id: "cap.quantum.ionq", identity: "cap.qpu.trapped_ion", type: "qpu", category: "QUANTUM", subcategory: "trapped_ion", provider: "ionq", implementation: "aria", interface: "api", access_mode: "remote", authorization: "REQUIRES_HUMAN_AUTHORIZATION", cost_class: "PAID", status: "DESCRIBED", capabilities: ["quantum_execution", "qpu"] },
  { capability_id: "cap.photonic.silicon", identity: "cap.photonic.silicon", type: "photonic", category: "PHOTONIC", subcategory: "silicon_photonics", provider: UNKNOWN, implementation: UNKNOWN, interface: UNKNOWN, status: "DESCRIBED", capabilities: ["photonic", "optical_compute"] },
  { capability_id: "cap.neuromorphic.loihi", identity: "cap.neuromorphic.loihi", type: "neuromorphic", category: "NEUROMORPHIC", subcategory: "neuromorphic_hardware", provider: "intel", implementation: "loihi-class", interface: UNKNOWN, status: "DESCRIBED", capabilities: ["neuromorphic", "spiking_nn"] },
  { capability_id: "cap.nontrad.analog", identity: "cap.analog", type: "analog", category: "NONTRADITIONAL", subcategory: "analog", provider: UNKNOWN, implementation: UNKNOWN, status: "DESCRIBED", capabilities: ["analog"] },
  { capability_id: "cap.ai.llm.grok", identity: "intelligence.grok-4.5", type: "llm", category: "AI", subcategory: "llm", provider: "xai", implementation: "grok-4.5", model: "grok-4.5", channel: "xai-api", interface: "api", access_mode: "remote", authorization: "REQUIRES_HUMAN_AUTHORIZATION", cost_class: "PAID", status: "DISCOVERED", capabilities: ["llm", "reasoning"] },
  { capability_id: "cap.data.climate.open", identity: "cap.data.climate", type: "open_data", category: "DATA", subcategory: "climate", provider: "public", implementation: "open-data", access_mode: "public", authorization: "FREE", cost_class: "FREE", status: "DESCRIBED", capabilities: ["open_data", "climate"] },
  { capability_id: "cap.science.mathematics", identity: "cap.science.mathematics", type: "mathematics", category: "SCIENCE", subcategory: "mathematics", provider: "local", implementation: "acorn.math", interface: "in-process", access_mode: "local", authorization: "FREE", cost_class: "FREE", status: "DESCRIBED", capabilities: ["mathematics", "arithmetic"] },
  { capability_id: "cap.sim.digital_twin", identity: "cap.sim.digital_twin", type: "digital_twin", category: "SIMULATION", subcategory: "digital_twin", provider: "local", implementation: "acorn.twin", interface: "in-process", access_mode: "local", authorization: "FREE", status: "DESCRIBED", capabilities: ["digital_twin", "simulation"] },
  { capability_id: "cap.perception.none", identity: "cap.sensor.none", type: "sensor", category: "PERCEPTION", subcategory: "environmental_sensor", provider: UNKNOWN, implementation: UNKNOWN, status: "DESCRIBED", observe_is_not_act: true, capabilities: ["sensor"] },
  { capability_id: "cap.robotics.arm", identity: "cap.robotics.arm", type: "robotic_arm", category: "ROBOTICS", subcategory: "robotic_arm", provider: UNKNOWN, status: "DESCRIBED", observe_is_not_act: true, authorization: "REQUIRES_HUMAN_AUTHORIZATION", capabilities: ["robotic_arm"] },
  { capability_id: "cap.space.gnss", identity: "cap.space.gnss", type: "gnss", category: "SPACE", subcategory: "gnss", provider: "public", authorization: "FREE", status: "DESCRIBED", capabilities: ["gnss"] },
  { capability_id: "cap.energy.carbon", identity: "cap.energy.carbon", type: "carbon", category: "ENERGY", subcategory: "carbon", provider: UNKNOWN, status: "DESCRIBED", capabilities: ["carbon", "energy"] },
  { capability_id: "cap.security.pqc", identity: "cap.security.pqc", type: "pqc", category: "SECURITY", subcategory: "pqc", provider: "local", implementation: "famille", interface: "in-process", access_mode: "local", authorization: "FREE", status: "DESCRIBED", capabilities: ["pqc", "cryptography"] },
  { capability_id: "cap.verification.formal", identity: "cap.verification.formal", type: "formal", category: "VERIFICATION", subcategory: "formal", provider: UNKNOWN, status: "DESCRIBED", capabilities: ["formal", "theorem_proving_tool"] },
  { capability_id: "cap.software.git", identity: "cap.software.git", type: "git", category: "SOFTWARE", subcategory: "git", provider: "github", interface: "api", access_mode: "remote", authorization: "FREE", status: "DESCRIBED", capabilities: ["git"] },
  { capability_id: "cap.knowledge.literature", identity: "cap.knowledge.literature", type: "literature", category: "KNOWLEDGE", subcategory: "literature", provider: "public", authorization: "FREE", status: "DESCRIBED", capabilities: ["literature"] },
  { capability_id: "cap.human.approval", identity: "cap.human.approval", type: "human_approval", category: "HUMAN", subcategory: "human_approval", provider: "carl", access_mode: "human", authorization: "REQUIRES_HUMAN_AUTHORIZATION", status: "DESCRIBED", capabilities: ["human_approval"] },
  { capability_id: "cap.economic.free", identity: "cap.economic.free_compute", type: "free_compute", category: "ECONOMIC", subcategory: "free_compute", provider: "local", authorization: "FREE", cost_class: "FREE", status: "DESCRIBED", capabilities: ["free_compute"] },
  { capability_id: "cap.discovery.adapter", identity: "cap.discovery.adapter", type: "adapter_discovery", category: "DISCOVERY", subcategory: "adapter_discovery", provider: "local", implementation: "acorn.registry", interface: "in-process", access_mode: "local", authorization: "FREE", status: "DESCRIBED", capabilities: ["adapter_discovery"] },
  { capability_id: "cap.memory.swarm", identity: "cap.memory.swarm", type: "swarm", category: "MEMORY", subcategory: "swarm", provider: "local", implementation: "acorn.swarm-memory", interface: "in-process", access_mode: "local", authorization: "FREE", status: "DESCRIBED", capabilities: ["swarm", "episodic"] },
  { capability_id: "cap.network.http", identity: "cap.network.http", type: "http", category: "NETWORK", subcategory: "http", provider: "public", authorization: "FREE", status: "DESCRIBED", capabilities: ["http", "internet"] },
  { capability_id: "cap.future.unknown_2055", identity: "cap.unknown.2055", type: "UNKNOWN_CAPABILITY", category: UNKNOWN, kind: "UNKNOWN_COGNITIVE_SYSTEM_C", status: "DISCOVERED", authorization: "REQUIRES_HUMAN_AUTHORIZATION", capabilities: [] },
]);

function seedWorldCatalog() {
  for (const row of WORLD_CATALOG) {
    if (capabilities.has(row.capability_id)) continue;
    registerCapability(row, { measured: false, connected: false, verified: false });
  }
  seedLocalMath();
}

function seedLocalMath() {
  registerCapability({
    capability_id: "cap.science.mathematics",
    identity: "cap.science.mathematics",
    type: "mathematics",
    kind: "mathematics",
    category: "SCIENCE",
    subcategory: "mathematics",
    provider: "local",
    implementation: "acorn.math",
    interface: "in-process",
    protocol: "capability-adapter.v0",
    location: "localhost",
    access_mode: "local",
    authorization: "FREE",
    cost_class: "FREE",
    backend: "math",
    capabilities: ["mathematics", "arithmetic"],
    status: "EXECUTABLE",
    source: "local-math",
  }, { measured: true, connected: true, verified: true });
}

function extractLocalMath(intent = "") {
  const s = String(intent || "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/(\d)\s*[xX]\s*(\d)/g, "$1*$2");
  const m = s.match(/-?\d+(?:\.\d+)?(?:\s*[+\-*/]\s*-?\d+(?:\.\d+)?){1,12}/);
  return m ? m[0].replace(/\s/g, "") : null;
}

function evalLocalMath(expr) {
  const tokens = [];
  const src = String(expr || "").replace(/\s+/g, "");
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if ("+-*/()".includes(ch)) {
      tokens.push(ch);
      i += 1;
      continue;
    }
    if (/\d/.test(ch) || ch === ".") {
      let j = i;
      while (j < src.length && /[\d.]/.test(src[j])) j += 1;
      tokens.push(Number(src.slice(i, j)));
      i = j;
      continue;
    }
    i += 1;
  }
  let idx = 0;
  const peek = () => tokens[idx];
  const eat = () => tokens[idx++];
  function factor() {
    const t = peek();
    if (t === "(") {
      eat();
      const v = add();
      if (peek() === ")") eat();
      return v;
    }
    if (t === "-") {
      eat();
      return -factor();
    }
    if (typeof t === "number") {
      eat();
      return t;
    }
    throw new Error("UNPARSEABLE");
  }
  function mul() {
    let v = factor();
    while (peek() === "*" || peek() === "/") {
      const op = eat();
      const r = factor();
      v = op === "*" ? v * r : v / r;
    }
    return v;
  }
  function add() {
    let v = mul();
    while (peek() === "+" || peek() === "-") {
      const op = eat();
      const r = mul();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }
  const value = add();
  if (!Number.isFinite(value)) throw new Error("NON_FINITE");
  return value;
}

function ingestComputeResource(resource) {
  const quantum = resource.compute_type === "qpu" || resource.compute_type === "simulator"
    || list(resource.capabilities).includes("quantum_simulation");
  const paid = Number(resource.cost?.estimated_cost) > 0;
  const measured = resource.state === "EXECUTABLE" || resource.state === "MEASURED" || resource.state === "VERIFIED";
  const connected = resource.state === "CONNECTED" || measured || resource.state === "EXECUTABLE";
  return registerCapability({
    capability_id: `cap.compute.${resource.resource_id}`,
    identity: resource.resource_id,
    type: resource.compute_type,
    category: quantum ? "QUANTUM" : "COMPUTE",
    subcategory: resource.compute_type === "simulator" ? "quantum_simulator" : resource.compute_type,
    kind: resource.compute_type,
    provider: resource.provider,
    implementation: resource.architecture,
    interface: "adapter",
    protocol: "compute-adapter.v0",
    location: resource.location,
    access_mode: resource.location === "localhost" ? "local" : "remote",
    authorization: paid ? "REQUIRES_HUMAN_AUTHORIZATION" : "FREE",
    cost: resource.cost,
    cost_class: paid ? "PAID" : "FREE",
    latency: resource.latency,
    precision: resource.precision,
    capabilities: list(resource.capabilities).concat(resource.compute_type, quantum ? "quantum_simulation" : "classical"),
    status: resource.state,
    backend: "compute",
    backend_ref: resource.resource_id,
    source: "compute-fabric",
    observed_at: resource.observed_at,
  }, {
    measured,
    connected,
    verified: resource.state === "VERIFIED",
    executed: resource.state === "EXECUTABLE" || resource.state === "VERIFIED",
  });
}

function ingestCognitiveNode(node) {
  const paid = Number(node.cost?.estimated_cost) > 0 || node.node_id === "intelligence.grok";
  const measured = node.state === "MEASURED" || node.state === "EXECUTABLE" || list(node.measured_roles).length > 0;
  const connected = node.channel_connected === true || node.state === "EXECUTABLE" || node.state === "CONNECTED";
  const roles = list(node.declared_roles || node.measured_roles);
  return registerCapability({
    capability_id: `cap.ai.${node.node_id}`,
    identity: node.identity || node.node_id,
    type: roles[0] || "agent",
    category: "AI",
    subcategory: roles[0] || "agent",
    kind: roles[0] || "agent",
    provider: "local",
    implementation: node.model,
    model: node.model,
    channel: node.channel,
    interface: "cognitive-adapter.v0",
    access_mode: node.channel === "in-process" ? "local" : "remote",
    authorization: paid ? "REQUIRES_HUMAN_AUTHORIZATION" : "FREE",
    cost: node.cost,
    cost_class: paid ? "PAID" : "FREE",
    capabilities: roles.concat(["intelligence"]),
    status: node.state,
    backend: "cognitive",
    backend_ref: node.node_id,
    source: "cognitive-fabric",
  }, { measured, connected, verified: false, executed: node.state === "EXECUTABLE" });
}

export async function discoverCapabilities({ env = process.env, now = new Date().toISOString() } = {}) {
  seedWorldCatalog();
  seeded = true;
  const compute = await discoverCompute({ env, now });
  for (const resource of compute.resources || []) ingestComputeResource(resource);
  const cog = await cognitiveModule();
  if (cog?.listCognitiveAdapters) {
    const nodes = cog.listCognitiveAdapters({ env, now });
    for (const node of nodes) ingestCognitiveNode(node);
  }
  rememberHistory("registry", "DISCOVER", { status: "DISCOVERED" });
  return snapshotRegistry({ now });
}

function ensureSeeded() {
  if (seeded) return;
  seedWorldCatalog();
  try {
    const snap = snapshotComputeFabric({});
    for (const resource of snap.resources || []) ingestComputeResource(resource);
  } catch {
    /* compute fabric optional at import */
  }
  seeded = true;
}

export function ingestUnknown(input = {}) {
  const classified = classifyCapability(input);
  const isolated = true;
  const characterized = Boolean(text(input.kind || input.name || input.description));
  const measured = input.measured === true;
  const tested = input.tested === true;
  const cap = registerCapability({
    capability_id: input.capability_id || id("unk"),
    identity: text(input.name || input.identity || input.kind) || "unknown",
    kind: input.kind || input.type,
    type: classified.class,
    category: classified.category,
    subcategory: classified.subcategory,
    provider: input.provider,
    implementation: input.implementation,
    source: input.source || "human_or_discovery",
    authorization: "REQUIRES_HUMAN_AUTHORIZATION",
    status: classified.status,
    capabilities: list(input.capabilities),
  }, { measured, connected: false, verified: false });
  const steps = INGEST_STEPS.map((step) => {
    if (step === "DISCOVER") return { step, status: "DISCOVERED" };
    if (step === "ISOLATE") return { step, status: isolated ? "SANDBOXED" : UNKNOWN };
    if (step === "CHARACTERIZE") return { step, status: characterized ? "IDENTIFIED" : UNKNOWN };
    if (step === "MEASURE") return { step, status: measured ? "MEASURED" : UNKNOWN };
    if (step === "CLASSIFY") {
      return { step, status: classified.class.startsWith("UNKNOWN") ? "DISCOVERED" : "IDENTIFIED", class: classified.class, forced_category: false };
    }
    if (step === "TEST") return { step, status: tested ? "MEASURED" : "DESCRIBED" };
    if (step === "INTEGRATE") {
      return { step, status: "HOLD_HUMAN", reason: "INTEGRATION_REQUIRES_HUMAN", grants_authority: false };
    }
    return { step, status: classified.class.startsWith("UNKNOWN") ? "HOLD_HUMAN" : "DESCRIBED", reason: "UNKNOWN_STAYS_UNKNOWN_UNTIL_MEASURED" };
  });
  return {
    capability: cap,
    classified,
    pipeline: steps,
    forced_category: false,
    core_rewritten: false,
    authority_changed: false,
    live: false,
  };
}

function matchesOne(cap, need) {
  const n = text(need).toLowerCase();
  const bag = new Set([
    ...list(cap.capabilities),
    text(cap.type),
    text(cap.subcategory),
    text(cap.category).toLowerCase(),
    text(cap.class),
    text(cap.identity),
    text(cap.capability_id),
  ].map((v) => v.toLowerCase()));
  if (bag.has(n)) return true;
  if (n === "quantum_simulation" && (bag.has("quantum_simulator") || bag.has("simulator") || bag.has("quantum_sim"))) return true;
  if (n === "arithmetic" && (bag.has("mathematics") || bag.has("generator") || bag.has("verifier") || bag.has("reasoner"))) return true;
  if (n === "classical" && (bag.has("cpu") || bag.has("compute"))) return true;
  if (n === "quantum_execution" && (bag.has("qpu") || bag.has("quantum_execution"))) return true;
  return false;
}

function matchCount(cap, required = []) {
  if (!required.length) return 1;
  return required.filter((need) => matchesOne(cap, need)).length;
}

function matchesRequired(cap, required = []) {
  if (!required.length) return true;
  return matchCount(cap, required) > 0;
}

function ladderRank(cap) {
  const ladder = cap.cost?.ladder || cap.cost?.class || UNKNOWN;
  const idx = COST_LADDER.indexOf(ladder);
  if (cap.access_mode === "local" && cap.authorization === "FREE") return 0;
  if (idx >= 0) return idx;
  return COST_LADDER.length;
}

function qualityScore(cap) {
  const quality = cap.status === "PROVEN" ? 1 : cap.status === "VERIFIED" ? 0.9 : cap.status === "EXECUTABLE" ? 0.75 : cap.status === "MEASURED" ? 0.5 : 0.1;
  const reliability = cap.health === "HEALTHY" ? 1 : cap.health === "DEGRADED" ? 0.4 : 0.2;
  const costPenalty = cap.cost?.class === "PAID" ? 8 : 0;
  const latency = Number(cap.latency?.value);
  const latencyPenalty = Number.isFinite(latency) ? latency / 1000 : 0.2;
  return (quality * (reliability + 0.1)) / (1 + costPenalty + latencyPenalty);
}

export function routeByCapability({
  required = [],
  task = {},
  policy = "FREE_FIRST",
  human_authorization = false,
} = {}) {
  ensureSeeded();
  const needs = list(required.length ? required : task.required_capabilities);
  const all = [...capabilities.values()].filter((row) => row.status !== "REVOKED" && row.health !== "REVOKED" && row.health !== "QUARANTINED");
  let candidates = all.filter((row) => matchesRequired(row, needs));
  if (policy === "FREE_ONLY" || policy === "PAID_FORBIDDEN" || policy === "FREE_FIRST") {
    const free = candidates.filter((row) => row.authorization === "FREE" && row.cost?.class !== "PAID");
    if (policy === "FREE_ONLY" || policy === "PAID_FORBIDDEN") candidates = free;
    else if (free.length) candidates = free.concat(candidates.filter((row) => !free.includes(row)));
  }
  if (policy === "LOCAL_ONLY") {
    candidates = candidates.filter((row) => row.access_mode === "local");
  }
  candidates = [...candidates].sort((a, b) => {
    const cover = matchCount(b, needs) - matchCount(a, needs);
    if (cover) return cover;
    const ladder = ladderRank(a) - ladderRank(b);
    if (ladder) return ladder;
    return qualityScore(b) - qualityScore(a);
  });
  const executable = candidates.filter((row) => ["EXECUTABLE", "VERIFIED", "PROVEN", "SWARM_ELIGIBLE", "MEASURED"].includes(row.status) && row.backend);
  const selected = executable[0] || null;
  const paid = candidates.find((row) => row.authorization === "REQUIRES_HUMAN_AUTHORIZATION" && row.cost?.class === "PAID");
  if (!selected && paid && human_authorization !== true) {
    return {
      status: "HOLD_HUMAN",
      reason: "SPENDING_AUTHORITY_IS_HUMAN",
      selected: null,
      candidates: candidates.map(brief),
      provider_preference: null,
      required: needs,
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }
  if (!selected) {
    return {
      status: needs.length ? "HOLD_HUMAN" : "INCONCLUSIVE",
      reason: candidates.length ? "NO_EXECUTABLE_MATCH" : "CAPABILITY_MISMATCH",
      selected: null,
      candidates: candidates.map(brief),
      missing: needs,
      provider_preference: null,
      live: false,
    };
  }
  return {
    status: "SELECTED",
    selected: brief(selected),
    candidates: candidates.slice(0, 12).map(brief),
    required: needs,
    policy,
    provider_preference: null,
    selection_is_not_authority: true,
    routing_is_capability_based: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

function brief(cap) {
  return {
    capability_id: cap.capability_id,
    identity: cap.identity,
    type: cap.type,
    category: cap.category,
    subcategory: cap.subcategory,
    provider: cap.provider,
    status: cap.status,
    health: cap.health,
    authorization: cap.authorization,
    cost_class: cap.cost?.class,
    backend: cap.backend,
    authority: false,
    live: false,
  };
}

export function inferRequiredCapabilities(intent = "") {
  const t = text(intent).toLowerCase();
  if (!t) return [];
  if (/gpu|qpu/.test(t) && /intelligence|mind|authority/.test(t)) return ["contradictor", "verifier", "reasoning", "classical"];
  if (/paid\s+qpu|quantum hardware|without simulator/.test(t)) return ["quantum_execution"];
  if (/bell|qubit|quantum sim/.test(t)) return ["quantum_simulation"];
  if (/qpu/.test(t) && !/simulat/.test(t)) return ["quantum_execution"];
  if (/17\s*\*\s*23|\d+\s*[\*x×]\s*\d+|arith|verify \d/.test(t)) return ["arithmetic", "generator", "verifier"];
  if (/photonic|neuromorphic|lattice|2055|unknown/.test(t)) return [];
  if (/plan|adapter/.test(t)) return ["planner", "coder"];
  if (/twin/.test(t)) return ["digital_twin"];
  return ["planner"];
}

export function composeFromRegistry({
  intent = "",
  required = [],
  policy = "FREE_FIRST",
  human_authorization = false,
} = {}) {
  ensureSeeded();
  const needs = list(required.length ? required : inferRequiredCapabilities(intent));
  const routed = routeByCapability({ required: needs, policy, human_authorization });
  let members = (routed.candidates || []).filter((row) => ["EXECUTABLE", "VERIFIED", "PROVEN", "SWARM_ELIGIBLE", "MEASURED"].includes(row.status) && row.authorization === "FREE");
  if (!members.length) {
    members = [...capabilities.values()]
      .filter((row) =>
        ["EXECUTABLE", "VERIFIED", "PROVEN", "SWARM_ELIGIBLE", "MEASURED"].includes(row.status)
        && row.authorization === "FREE"
        && row.backend
        && row.authority === false
      )
      .slice(0, 6)
      .map(brief);
  }
  const uniqueCategories = new Set(members.map((m) => m.category));
  const mode = members.length <= 1 ? "solo" : (needs.includes("contradictor") || /adversarial|falsify|intelligence/.test(intent.toLowerCase()) ? "adversarial" : "swarm");
  const chosen = mode === "solo" ? members.slice(0, 1) : members.slice(0, 6);
  return {
    intent: text(intent) || UNKNOWN,
    required: needs,
    mode,
    members: chosen,
    unused_on_purpose: (routed.candidates || []).filter((row) => !chosen.some((m) => m.capability_id === row.capability_id)),
    routed,
    more_capabilities_is_not_superiority: true,
    provider_preference: null,
    live: false,
    auto_merge: false,
    authority: "carl",
    unique_categories: [...uniqueCategories],
  };
}

export async function executeCapability({
  capability_id,
  task = {},
  intent = "",
  human_authorization = false,
  env = process.env,
  now = new Date().toISOString(),
} = {}) {
  ensureSeeded();
  const cap = getCapability(capability_id);
  if (!cap) {
    return { status: UNKNOWN, reason: "UNKNOWN_CAPABILITY", live: false };
  }
  if (cap.status === "REVOKED" || cap.health === "REVOKED") {
    return { status: "REVOKED", reason: "CAPABILITY_REVOKED", live: false };
  }
  if (cap.health === "QUARANTINED") {
    return { status: "HOLD_HUMAN", reason: "QUARANTINED", live: false };
  }
  if (cap.observe_is_not_act && /act|move|fire|deploy/.test(text(task.action || intent))) {
    return { status: "HOLD_HUMAN", reason: "OBSERVE_IS_NOT_ACT", executed: false, live: false, authority: "carl" };
  }
  if (cap.authorization === "REQUIRES_HUMAN_AUTHORIZATION" && human_authorization !== true) {
    const exec = stampExecution(cap, { status: "HOLD_HUMAN", reason: "SPENDING_AUTHORITY_IS_HUMAN", now, task });
    return { status: "HOLD_HUMAN", reason: "SPENDING_AUTHORITY_IS_HUMAN", execution: exec, live: false, auto_merge: false, authority: "carl" };
  }
  if (!["EXECUTABLE", "VERIFIED", "PROVEN", "SWARM_ELIGIBLE", "MEASURED", "CONNECTED"].includes(cap.status) || !cap.backend) {
    const exec = stampExecution(cap, { status: "HOLD_HUMAN", reason: "NOT_CONNECTED", now, task });
    return { status: "HOLD_HUMAN", reason: "NOT_CONNECTED", execution: exec, capability: brief(cap), live: false };
  }
  if (cap.backend === "math") {
    const expr = extractLocalMath(intent || task.intent || task.expression || "");
    if (!expr) {
      const exec = stampExecution(cap, { status: "INCONCLUSIVE", reason: "NO_ARITHMETIC", now, task });
      return { status: "INCONCLUSIVE", reason: "NO_ARITHMETIC", execution: exec, live: false };
    }
    let value;
    try {
      value = evalLocalMath(expr);
    } catch (error) {
      const exec = stampExecution(cap, { status: "FAILED", reason: String(error?.message || error).slice(0, 120), now, task });
      return { status: "FAILED", execution: exec, live: false };
    }
    const result = { expression: expr, value, observed: true, invented: false };
    const exec = stampExecution(cap, {
      status: "VERIFIED",
      now,
      task: { ...task, expression: expr },
      result,
      hashes: { request: digest({ expr, intent }), result: digest(result) },
    });
    registerCapability({ ...cap, status: "PROVEN" }, {
      measured: true, connected: true, verified: true, executed: true, evidence: exec.evidence,
    });
    return { status: "VERIFIED", execution: exec, math: result, live: false, auto_merge: false, authority: "carl" };
  }
  if (cap.backend === "compute") {
    const quantum = cap.category === "QUANTUM" || cap.type === "simulator" || cap.subcategory === "quantum_simulator";
    const required = list(task.required_capabilities);
    const result = await executeComputeTask({
      task: {
        type: task.type || (quantum ? "quantum_simulation" : "classical"),
        required_capabilities: required.length ? required : (quantum ? ["quantum_simulation"] : [cap.type].filter(Boolean)),
        compute_type: cap.type === "simulator" ? undefined : cap.type,
        allow_simulator: quantum || cap.type === "simulator",
        shots: task.shots ?? 64,
        qubits: task.qubits ?? 2,
        seed: task.seed ?? 3,
      },
      env,
      human_authorization,
      policy: "FREE_FIRST",
      now,
    });
    const exec = stampExecution(cap, {
      status: result.status,
      now,
      task,
      result: result.result,
      hashes: {
        request: result.execution?.request_hash,
        result: result.execution?.result_reference,
      },
    });
    if (result.status === "VERIFIED" || result.status === "EXECUTED") {
      registerCapability({ ...cap, status: result.status === "VERIFIED" ? "PROVEN" : "EXECUTABLE" }, {
        measured: true, connected: true, verified: result.status === "VERIFIED", executed: true,
        evidence: exec.evidence,
      });
    }
    return { status: exec.status, execution: exec, compute: result, live: false, auto_merge: false, authority: "carl" };
  }
  if (cap.backend === "cognitive") {
    const cog = await cognitiveModule();
    const adapter = cog?.getCognitiveAdapter?.(cap.backend_ref);
    if (!adapter?.execute) {
      return { status: "HOLD_HUMAN", reason: "ADAPTER_MISSING_EXECUTE", live: false };
    }
    const role = list(cap.capabilities)[0] || "generator";
    const raw = await adapter.execute({ role, task: { intent: intent || task.intent || "", ...task }, context: {} });
    const exec = stampExecution(cap, {
      status: raw.status === "EXECUTED" ? "VERIFIED" : raw.status,
      now,
      task,
      result: raw.output,
      hashes: { request: digest({ intent, role }), result: raw.output_digest || (cog.digest ? cog.digest(raw.output) : digest(raw.output)) },
    });
    registerCapability({ ...cap, status: "PROVEN" }, {
      measured: true, connected: true, verified: exec.status === "VERIFIED", executed: true, evidence: exec.evidence,
    });
    return { status: exec.status, execution: exec, cognitive: raw, live: false, auto_merge: false, authority: "carl" };
  }
  return { status: "HOLD_HUMAN", reason: "NO_BACKEND", live: false };
}

function stampExecution(cap, { status, reason, now, task, result, hashes }) {
  const exec = {
    execution_id: id("xcap"),
    capability_id: cap.capability_id,
    identity: cap.identity,
    provider: cap.provider,
    status: honestStatus(status, { measured: true, connected: true, verified: status === "VERIFIED" || status === "PROVEN" }),
    reason: reason || null,
    task,
    result: result || null,
    evidence: {
      request: hashes?.request || digest({ capability_id: cap.capability_id, task, at: now }),
      result: hashes?.result || (result ? digest(result) : UNKNOWN),
      capability: cap.provenance?.hash,
    },
    provenance: {
      capability_id: cap.capability_id,
      version: cap.temporal_validity?.version,
      provider: cap.provider,
      endpoint: cap.interface,
      observed_at: iso(now),
    },
    observed: status === "VERIFIED" || status === "EXECUTED" || status === "PROVEN",
    measured: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
  executions.unshift(exec);
  if (executions.length > 80) executions.length = 80;
  rememberHistory(cap.capability_id, "EXECUTE", { status: exec.status, health: cap.health });
  return exec;
}

export async function executeRegistryTask({
  intent = "",
  required = [],
  policy = "FREE_FIRST",
  human_authorization = false,
  env = process.env,
} = {}) {
  const composition = composeFromRegistry({ intent, required, policy, human_authorization });
  const needs = composition.required;
  if (!composition.members.length) {
    return {
      status: composition.routed.status,
      reason: composition.routed.reason,
      composition,
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }
  const runs = [];
  for (const member of composition.members.slice(0, 4)) {
    const run = await executeCapability({
      capability_id: member.capability_id,
      intent,
      task: { intent, required_capabilities: needs, type: needs.includes("quantum_simulation") ? "quantum_simulation" : undefined },
      human_authorization,
      env,
    });
    runs.push({ member, run });
  }
  const proven = runs.filter((row) => ["VERIFIED", "PROVEN", "EXECUTED"].includes(row.run.status));
  const hold = runs.filter((row) => row.run.status === "HOLD_HUMAN");
  const experience = {
    experience_id: id("exp"),
    intent,
    required: needs,
    mode: composition.mode,
    members: composition.members.map((m) => m.capability_id),
    status: proven.length ? "MEASURED" : (hold.length ? "HOLD_HUMAN" : "INCONCLUSIVE"),
    quality: proven.length / Math.max(runs.length, 1),
    cost: composition.members.every((m) => m.cost_class === "FREE") ? 0 : UNKNOWN,
    evidence: proven[0]?.run.execution?.evidence || null,
    more_nodes_is_not_superiority: true,
    live: false,
  };
  experiences.unshift(experience);
  if (experiences.length > 80) experiences.length = 80;
  return {
    status: experience.status,
    composition,
    runs,
    experience,
    evidence: experience.evidence,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function rememberExperience(row = {}) {
  experiences.unshift({ ...row, live: false });
  if (experiences.length > 80) experiences.length = 80;
  return { ok: true, status: "REMEMBERED", live: false };
}

export function justifyNextStrategy(required = []) {
  const needs = list(required).join(",");
  const rows = experiences.filter((e) => list(e.required).join(",") === needs);
  if (!rows.length) {
    return { status: UNKNOWN, reason: "NO_PRIOR_MEASUREMENT", strategy: "explore", live: false };
  }
  const ranked = [...rows].sort((a, b) => (Number(b.quality) || 0) - (Number(a.quality) || 0));
  return {
    status: "PROPOSED",
    strategy: ranked[0].mode,
    quality: ranked[0].quality,
    evidence: ranked[0].evidence,
    more_nodes_is_not_superiority: true,
    live: false,
  };
}

export function capabilityAdapter(capability_id) {
  const cap = getCapability(capability_id);
  if (!cap) return null;
  return {
    capability_id: cap.capability_id,
    methods: ADAPTER_METHODS,
    discover: () => ({ status: cap.status, live: false }),
    identify: () => classifyCapability(cap),
    authenticate: () => ({
      status: cap.authorization === "FREE" ? "AUTHENTICATED" : "HOLD_HUMAN",
      reason: cap.authorization === "FREE" ? null : "REQUIRES_HUMAN_AUTHORIZATION",
      live: false,
    }),
    describe: () => cap,
    health: () => ({ health: cap.health, status: cap.status, live: false }),
    capabilities: () => cap.capabilities,
    benchmark: () => ({ status: cap.measurements ? "BENCHMARKED" : UNKNOWN, measured: Boolean(cap.measurements), live: false }),
    execute: async (input = {}) => executeCapability({
      capability_id: cap.capability_id,
      task: input.task || input,
      intent: input.intent,
      human_authorization: input.human_authorization === true,
      env: input.env || process.env,
    }),
    observe: () => ({ status: cap.availability === "OBSERVED" ? "MEASURED" : UNKNOWN, grants_action: false, live: false }),
    cancel: () => ({ status: "HOLD_HUMAN", reason: "CANCEL_REQUIRES_HUMAN", live: false }),
    evidence: () => cap.evidence,
    provenance: () => cap.provenance,
    revoke: ({ human_authorization = false } = {}) => {
      if (human_authorization !== true) {
        return { status: "DENIED", reason: "REVOKE_REQUIRES_HUMAN", changed: false, live: false, authority: "carl" };
      }
      registerCapability({ ...cap, status: "REVOKED", health: "REVOKED" }, {});
      return { status: "REVOKED", changed: true, live: false, authority: "carl" };
    },
    cortex_bypassed: false,
    live: false,
  };
}

export function snapshotRegistry({ now = new Date().toISOString() } = {}) {
  ensureSeeded();
  const rows = [...capabilities.values()];
  const byStatus = {};
  for (const state of HONEST_STATES) byStatus[state] = rows.filter((row) => row.status === state).length;
  return {
    version: REGISTRY_VERSION,
    constitution: registryConstitution(),
    counts: {
      total: rows.length,
      executable: rows.filter((row) => ["EXECUTABLE", "VERIFIED", "PROVEN", "SWARM_ELIGIBLE"].includes(row.status)).length,
      hold_human: rows.filter((row) => row.authorization === "REQUIRES_HUMAN_AUTHORIZATION" || row.status === "HOLD_HUMAN").length,
      unknown: rows.filter((row) => String(row.class || "").startsWith("UNKNOWN") || row.category === UNKNOWN).length,
      categories_represented: new Set(rows.map((row) => row.category)).size,
      taxonomy_categories: CATEGORIES.length,
    },
    by_status: byStatus,
    capabilities: rows,
    taxonomy: taxonomyView(),
    history: history.slice(0, 40),
    experiences: experiences.slice(0, 20),
    executions: executions.slice(0, 12),
    loop: DISCOVERY_LOOP,
    live: false,
    auto_merge: false,
    authority: "carl",
    observed_at: iso(now),
  };
}

export function cortexRegistryView({ snapshot = null, proof = null, now = new Date().toISOString() } = {}) {
  const snap = snapshot || snapshotRegistry({ now });
  return {
    title: "ACORN GLOBAL CAPABILITY REGISTRY",
    fabric: "CORTEX ORGANISM",
    constitution: snap.constitution,
    counts: snap.counts,
    taxonomy: snap.taxonomy,
    capabilities: snap.capabilities.map(brief),
    details: snap.capabilities,
    history: snap.history,
    experiences: snap.experiences,
    executions: snap.executions,
    evidence: {
      latest: proof || snap.executions[0] || null,
      status: proof?.status || snap.executions[0]?.status || UNKNOWN,
    },
    loop: DISCOVERY_LOOP,
    no_fake_badge: true,
    live: false,
    certified: false,
    auto_merge: false,
    authority: "carl",
    observed_at: snap.observed_at,
  };
}

export async function runRegistryProofLoop({
  env = process.env,
  now = new Date().toISOString(),
  human_authorization = false,
} = {}) {
  resetCapabilityRegistry();
  const discovered = await discoverCapabilities({ env, now });
  const unknown = ingestUnknown({
    kind: "lattice-x-2029",
    name: "future architecture with no 2026 category",
    source: "registry-proof",
  });
  const photonic = ingestUnknown({
    kind: "photonic",
    name: "unmeasured photonic lattice",
    source: "registry-proof",
  });
  const mathRoute = routeByCapability({ required: ["arithmetic", "generator"], policy: "FREE_FIRST" });
  const quantumRoute = routeByCapability({ required: ["quantum_simulation"], policy: "FREE_FIRST" });
  const paidRoute = routeByCapability({ required: ["quantum_execution"], policy: "FREE_FIRST", human_authorization: false });
  const providerTrap = routeByCapability({ required: ["quantum_simulation"], policy: "FREE_FIRST" });
  const selectedIsNotIbm = providerTrap.selected?.provider !== "ibm" && providerTrap.selected?.provider !== "aws";
  const executed = quantumRoute.selected
    ? await executeCapability({
      capability_id: quantumRoute.selected.capability_id,
      task: { type: "quantum_simulation", shots: 64, qubits: 2, seed: 3 },
      env,
      human_authorization,
      now,
    })
    : { status: UNKNOWN };
  const math = mathRoute.selected
    ? await executeCapability({
      capability_id: mathRoute.selected.capability_id,
      intent: "Verify 17*23",
      task: { intent: "Verify 17*23" },
      env,
      now,
    })
    : { status: UNKNOWN };
  const swarm = composeFromRegistry({
    intent: "Adversarial: claim that a GPU is an intelligence. Challenge and falsify.",
    policy: "FREE_FIRST",
  });
  const revoked = capabilityAdapter(unknown.capability.capability_id)?.revoke({ human_authorization: false });
  const stages = {};
  for (const name of DISCOVERY_LOOP) stages[name] = UNKNOWN;
  stages.DISCOVER = "DISCOVERED";
  stages.IDENTIFY = unknown.classified.forced_category === false ? "DISCOVERED" : "FAILED";
  stages.MEASURE = executed.status === "VERIFIED" || executed.status === "PROVEN" || executed.status === "EXECUTED" ? "MEASURED" : "INCONCLUSIVE";
  stages.BENCHMARK = math.status === "VERIFIED" || math.status === "PROVEN" ? "MEASURED" : "DESCRIBED";
  stages.VERIFY = executed.status === "VERIFIED" || executed.status === "PROVEN" ? "VERIFIED" : "INCONCLUSIVE";
  stages.REGISTER = discovered.counts.total > 0 ? "DISCOVERED" : "FAILED";
  stages.CONNECT = quantumRoute.status === "SELECTED" ? "CONNECTED" : "HOLD_HUMAN";
  stages.SWARM = swarm.members.length >= 1 ? "MEASURED" : UNKNOWN;
  stages.OBSERVE = "MEASURED";
  stages.LEARN = experiences.length ? "MEASURED" : UNKNOWN;
  stages.RE_EVALUATE = "PROPOSED";
  stages.DISCOVER_AGAIN = unknown.classified.class === "UNKNOWN_CAPABILITY" ? "DISCOVERED" : "FAILED";
  const proof = {
    version: REGISTRY_VERSION,
    status: stages.VERIFY === "VERIFIED" && selectedIsNotIbm ? "VERIFIED" : "INCONCLUSIVE",
    stages,
    unknown,
    photonic,
    mathRoute,
    quantumRoute,
    paidRoute,
    providerTrap: { selectedIsNotIbm, selected: providerTrap.selected },
    executed,
    math,
    swarm,
    revoked,
    hashes: {
      request: digest({ now, version: REGISTRY_VERSION }),
      quantum: executed.execution?.evidence?.result || digest(executed),
      capability: quantumRoute.selected?.capability_id || UNKNOWN,
    },
    counts: snapshotRegistry({ now }).counts,
    live: false,
    auto_merge: false,
    authority: "carl",
    observed_at: iso(now),
  };
  rememberHistory("registry", "PROOF", { status: proof.status });
  return proof;
}

export function listRegistryExecutions() {
  return executions.slice();
}

export function listRegistryHistory() {
  return history.slice();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const proof = await runRegistryProofLoop();
  process.stdout.write(`${JSON.stringify({
    title: "ACORN GLOBAL CAPABILITY REGISTRY",
    version: REGISTRY_VERSION,
    live: false,
    auto_merge: false,
    authority: "carl",
    unknown_stays_unknown: proof.unknown.classified.class === "UNKNOWN_CAPABILITY",
    routing_not_provider: proof.providerTrap.selectedIsNotIbm,
    paid_hold: proof.paidRoute.status === "HOLD_HUMAN",
    quantum: proof.executed.status,
    hashes: proof.hashes,
    counts: proof.counts,
  }, null, 2)}\n`);
}
