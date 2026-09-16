#!/usr/bin/env node
/**
 * ACORN CORTEX — acceleration as a capability, not a vendor.
 * NVIDIA is a candidate. So is unknown silicon. Not a second Cortex.
 * HARDWARE ≠ INTELLIGENCE ≠ PROVIDER ≠ CHANNEL. PASSPORT ≠ PRESENCE.
 * CHANNEL_NOT_PRESENT is honest. live=false.
 */
import { considerUnknownChannel } from "../sdk/open-channel.js";
import { intelligenceAdapter } from "../sdk/open-intelligence.js";
import { authorizeCapability } from "../.github/swarm/cortex.mjs";
import { describeIntelligence, routeTask, applyCostPolicy } from "./intelligence-contract.mjs";
import { createAdapter, discoverProtocol, negotiateProtocol, proposeProtocol } from "./cortex-adaptive.mjs";
import { intelligencePassport, replaceComponent, discoverFutureIntelligence } from "./cortex-eternal.mjs";
import { commonModeFailure, degradedMode } from "./cortex-continuity.mjs";
import { learnFromExperience } from "./reality-learning-engine.mjs";

export const ACCEL_VERSION = "cortex-acceleration.v1";
export const ACCELERATOR_KINDS = Object.freeze([
  "CPU", "GPU", "NPU", "TPU", "FPGA", "ASIC", "NEUROMORPHIC",
  "DISTRIBUTED", "CLOUD", "EDGE", "UNKNOWN",
]);
export const INTELLIGENCE_TYPES = Object.freeze([
  "LLM", "REASONING", "MULTIMODAL", "VISION", "AUDIO", "SPEECH", "EMBEDDING",
  "RETRIEVAL", "PLANNER", "SYMBOLIC", "THEOREM_PROVER", "OPTIMIZER", "SIMULATOR",
  "WORLD_MODEL", "AGENT", "LOCAL", "DISTRIBUTED", "EDGE", "ROBOTICS",
  "SCIENTIFIC", "FORECAST", "ANOMALY", "CLASSIFIER", "GENERATIVE", "SEARCH",
  "CODING", "HARDWARE_ASSISTED", "NEUROMORPHIC", "PROBABILISTIC",
  "QUANTUM_ASSISTED", "HYBRID", "HUMAN", "UNKNOWN",
]);

function list(v) { return Array.isArray(v) ? v.map((x) => String(x || "").trim()).filter(Boolean) : []; }
function text(v) { return String(v ?? "").trim(); }
export function registryId(id = "") {
  const s = String(id || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
  return /^[a-z][a-z0-9-]{1,24}$/.test(s) ? s : "unknown-resource";
}

export function describeAccelerator(input = {}) {
  const kind = ACCELERATOR_KINDS.includes(input.kind) ? input.kind : "UNKNOWN";
  return {
    identity: text(input.id || input.identity) || "unknown-accelerator",
    kind,
    vendor: text(input.vendor || input.provider) || "UNKNOWN",
    provider: text(input.provider || input.vendor) || "UNKNOWN",
    model: input.model || null,
    channel: input.channel || null,
    capabilities: list(input.capabilities?.length ? input.capabilities : ["compute"]),
    presence: input.presence || "DECLARED",
    nvidia_is_architecture: false,
    vendor_is_not_kind: true,
    hardware_is_not_intelligence: true,
    hardware_is_not_provider: true,
    provider_is_not_channel: true,
    closed_vendor_list: false,
    authority: false,
    live: false,
  };
}

export function acceleratorState({
  configured = false, present = false, executed = false, measured = false, hold = false,
} = {}) {
  if (hold) return "HOLD_HUMAN";
  if (measured) return "MEASURED";
  if (executed) return "EXECUTED";
  if (present) return "CONNECTED";
  if (configured) return "CONFIGURED";
  return "CHANNEL_NOT_PRESENT";
}

export function probeAccelerator({ identity, vendor, env = process.env, evidence = {} } = {}) {
  const id = text(identity) || "unknown-accelerator";
  const v = text(vendor).toLowerCase();
  const configured = Boolean(
    (v === "nvidia" || /nvidia/.test(id))
    && (String(env.NVIDIA_VISIBLE_DEVICES || "").trim() || String(env.CUDA_VISIBLE_DEVICES || "").trim())
  );
  const present = evidence.channel_responding === true;
  const executed = evidence.executed === true;
  const measured = evidence.measured === true;
  const state = acceleratorState({ configured, present, executed, measured });
  return {
    status: "EXECUTED",
    identity: id,
    vendor: text(vendor) || "UNKNOWN",
    state,
    configured,
    present,
    executed,
    measured,
    invented_metrics: false,
    nvidia_connected: v === "nvidia" && present,
    live: false,
  };
}

export function discoverAccelerators({ env = process.env, workerEvidence = {}, declared = [] } = {}) {
  const cpu = {
    ...describeAccelerator({
      id: "cpu-local",
      kind: "CPU",
      vendor: "host",
      provider: "acorn",
      capabilities: ["compute", "LOCAL_EXECUTION"],
      presence: workerEvidence?.v ? "ACTIVE" : "DECLARED",
    }),
    state: workerEvidence?.v ? "EXECUTED" : "DEFINED",
    source: "runtime",
    live: false,
  };
  const nvidiaProbe = probeAccelerator({ identity: "nvidia-gpu", vendor: "NVIDIA", env });
  const nvidia = {
    ...describeAccelerator({
      id: "nvidia-gpu",
      kind: nvidiaProbe.state === "CHANNEL_NOT_PRESENT" ? "GPU" : "GPU",
      vendor: "NVIDIA",
      provider: "NVIDIA",
      capabilities: ["GPU_ACCELERATION", "LOW_LATENCY"],
      presence: nvidiaProbe.state === "CHANNEL_NOT_PRESENT" ? "CHANNEL_NOT_PRESENT" : "DECLARED",
    }),
    state: nvidiaProbe.state,
    source: "probe",
    live: false,
  };
  const extra = (declared || []).map((row) => {
    const described = describeAccelerator(row);
    const unknown = described.kind === "UNKNOWN" || described.vendor === "UNKNOWN";
    const channel = unknown
      ? considerUnknownChannel({ id: described.identity, provider: described.vendor, protocol: "UNKNOWN" })
      : null;
    return {
      ...described,
      state: unknown ? "UNKNOWN" : "DECLARED",
      channel,
      source: "declared",
      trusted: false,
      live: false,
    };
  });
  return {
    status: "EXECUTED",
    entries: [cpu, nvidia, ...extra],
    closed_list: false,
    nvidia_is_architecture: false,
    live: false,
  };
}

export function discoverCapability({ claimed, measured, name } = {}) {
  const cap = text(name) || "UNKNOWN_CAPABILITY";
  if (measured === true) return { status: "MEASURED", capability: cap, declared: claimed === true, live: false };
  if (claimed === true) return { status: "DECLARED", capability: cap, declared: true, verified: false, live: false };
  return { status: "UNKNOWN", capability: cap === "UNKNOWN_CAPABILITY" ? cap : "UNKNOWN_CAPABILITY", live: false };
}

export function acceleratorPassport(entry = {}) {
  const described = describeAccelerator(entry);
  const inner = intelligencePassport({
    id: described.identity,
    provider: described.provider,
    model: described.model,
    channel: described.channel,
    capabilities: described.capabilities,
    version: entry.version || "UNKNOWN",
  });
  return {
    status: "EXECUTED",
    passport: {
      ...inner.passport,
      hardware_kind: described.kind,
      vendor: described.vendor,
      hardware_is_not_intelligence: true,
      passport_is_not_presence: true,
    },
    presence: described.presence,
    grants_authority: false,
    live: false,
  };
}

export function nvidiaUnavailable({ remaining = ["cpu-local"] } = {}) {
  const degraded = degradedMode({ lost: ["nvidia-gpu"], remaining: remaining.includes("compute") ? remaining : ["review", "compute"] });
  return {
    status: remaining.length ? "DEGRADED" : "HOLD_HUMAN",
    lost: "nvidia-gpu",
    remaining,
    fake_success: false,
    nvidia_is_architecture: false,
    degraded,
    live: false,
  };
}

export function acceleratorUnavailable({ lost = "gpu", remaining = ["cpu-local"] } = {}) {
  return {
    status: remaining.length ? "DEGRADED" : "UNAVAILABLE",
    lost,
    remaining,
    fake_success: false,
    live: false,
  };
}

export function replaceIntelligence({ current, candidate, compared = false, verified = false } = {}) {
  const replaced = replaceComponent({ current, candidate, compared, verified });
  return {
    ...replaced,
    cortex_contract_unchanged: true,
    live: false,
  };
}

export function hardwareFailureDomains(nodes = []) {
  return {
    ...commonModeFailure(nodes),
    nodes_are_not_independence: true,
    live: false,
  };
}

export function cognitiveCompiler({ intent, capabilities = [], resources = [] } = {}) {
  return {
    status: "EXECUTED",
    pipeline: [
      "HUMAN_INTENT", "SEMANTIC_REPRESENTATION", "COGNITIVE_PLAN",
      "CAPABILITY_DISCOVERY", "RESOURCE_DISCOVERY", "ARCHITECTURE",
      "ADAPTER", "PROTOCOL", "EXECUTION", "OBSERVATION", "VERIFICATION", "HUMAN_OUTPUT",
    ],
    intent: intent || null,
    capabilities,
    resources,
    invented_execution: false,
    live: false,
  };
}

export function tomorrowBundle(input = {}) {
  const intelligence = discoverFutureIntelligence({
    id: registryId(input.intelligence_id || "INTELLIGENCE_TOMORROW"),
    provider: "UNKNOWN",
    capabilities: input.capabilities || ["UNKNOWN_CAPABILITY"],
  });
  const protocol = discoverProtocol({
    hello: { hello: input.protocol_id || "PROTOCOL_TOMORROW", ops: ["ping"] },
    declared: input.protocol_id || "PROTOCOL_TOMORROW",
  });
  const negotiated = negotiateProtocol({ local: ["ping", "review"], remote: protocol.capabilities });
  const hardware = describeAccelerator({
    id: input.accelerator_id || "ACCELERATOR_TOMORROW",
    kind: "UNKNOWN",
    vendor: "UNKNOWN",
    capabilities: ["UNKNOWN_CAPABILITY"],
  });
  const adapter = createAdapter({ kind: "accelerator", discovery: hardware });
  return {
    status: "EXECUTED",
    technology: input.technology_id || "TECHNOLOGY_TOMORROW",
    intelligence,
    protocol,
    negotiated,
    hardware,
    adapter,
    understood: false,
    trusted: false,
    live: false,
  };
}

export function ultimateAccelerationExperiment(input = {}) {
  const at = input.at || new Date().toISOString();
  const unknownIntel = discoverFutureIntelligence({
    id: registryId("FUTURE_INTELLIGENCE_X"),
    provider: "UNKNOWN",
    capabilities: ["UNKNOWN_CAPABILITY"],
  });
  const unknownAccel = describeAccelerator({
    id: "FUTURE_ACCELERATOR_X",
    kind: "UNKNOWN",
    vendor: "UNKNOWN",
    capabilities: ["UNKNOWN_CAPABILITY"],
  });
  const channel = considerUnknownChannel({
    id: "FUTURE_ACCELERATOR_X",
    provider: "UNKNOWN",
    protocol: "UNKNOWN",
  });
  const protocol = discoverProtocol({
    hello: { hello: "FUTURE_PROTOCOL_X", ops: ["ping"] },
    declared: "FUTURE_PROTOCOL_X",
  });
  const cap = discoverCapability({ name: "UNKNOWN_CAPABILITY" });
  const adapter = createAdapter({ kind: "accelerator", discovery: unknownAccel });
  const proposed = proposeProtocol({ capabilities: ["ping"], semantics: "cir.v0" });
  const discovered = {
    entries: [
      describeIntelligence({ id: "cortex-local", provider: "acorn", capabilities: ["review"], type: "LOCAL", lane: "keyless" }),
    ],
  };
  const routed = routeTask({ need: "review", discovered, policy: "PAID_FORBIDDEN" });
  const compiler = cognitiveCompiler({ intent: "review", capabilities: ["review"], resources: ["cpu-local"] });
  const a = { id: "INTELLIGENCE_A", capabilities: ["review"], state: "CURRENT" };
  const b = { id: "INTELLIGENCE_B", capabilities: ["review"], state: "CANDIDATE" };
  const replaced = replaceIntelligence({ current: a, candidate: b, compared: false, verified: false });
  const nvidiaGone = nvidiaUnavailable({ remaining: ["cpu-local"] });
  const domains = hardwareFailureDomains([
    { id: "gpu-a", provider: "NVIDIA", host: "cloud-1", capabilities: ["GPU_ACCELERATION"] },
    { id: "gpu-b", provider: "NVIDIA", host: "cloud-1", capabilities: ["GPU_ACCELERATION"] },
    { id: "gpu-c", provider: "NVIDIA", host: "cloud-1", capabilities: ["GPU_ACCELERATION"] },
  ]);
  const passport = acceleratorPassport(unknownAccel);
  const merge = authorizeCapability({ capabilities: ["merge"], allowed: false, authority: "network" });
  const write = authorizeCapability({ capabilities: ["secret"], allowed: false, authority: "network" });
  const learned = learnFromExperience({
    hypothesis: { kind: "acceleration", id: "unknown-welcome" },
    expected: { crash: false },
    actual: { crash: false, understood: false, nvidia_architecture: false },
    context: { engine: "cortex-acceleration" },
    observedAt: at,
    model: { version: 1 },
    verification: { verified: false },
  });
  return {
    status: "EXECUTED",
    chain: [
      "TASK", "CAPABILITIES", "RESOURCES", "UNKNOWN_RESOURCE", "NO_PRETEND",
      "INTERFACE", "CAPABILITY_MAP", "SEMANTICS", "ADAPTER", "PROTOCOL",
      "ARCHITECTURE", "EXPERIMENT", "OBSERVATION", "MEASUREMENT", "FALSIFY",
      "VERIFY", "MEMORY", "REPLAY", "COMPARE", "REPLACE", "SURVIVE",
      "PROVENANCE", "AUTHORITY_SEPARATION", "HUMAN_OUTPUT", "DISCOVER_AGAIN",
    ],
    unknown_intelligence: unknownIntel,
    unknown_accelerator: unknownAccel,
    channel,
    protocol,
    capability: cap,
    adapter,
    proposed,
    routed,
    compiler,
    replaced,
    nvidiaGone,
    domains,
    passport,
    learned: { status: learned.status, live: false },
    gates: {
      merge: merge.ok,
      write: write.ok,
      understood: false,
      trusted: false,
      nvidia_is_architecture: false,
      passport_is_presence: false,
      second_cortex: false,
    },
    one_cortex: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function runAccelerationFabric(input = {}) {
  const at = input.at || new Date().toISOString();
  const discovered = discoverAccelerators({
    env: input.env || process.env,
    workerEvidence: input.workerEvidence || {},
    declared: input.declared || [{ id: "FUTURE_ACCELERATOR_X", kind: "UNKNOWN", vendor: "UNKNOWN" }],
  });
  const nvidia = discovered.entries.find((row) => row.identity === "nvidia-gpu") || {};
  const cpu = discovered.entries.find((row) => row.identity === "cpu-local") || {};
  const unknown = discovered.entries.find((row) => row.kind === "UNKNOWN") || describeAccelerator({ id: "FUTURE_ACCELERATOR_X", kind: "UNKNOWN" });
  const nvidiaProbe = probeAccelerator({ identity: "nvidia-gpu", vendor: "NVIDIA", env: input.env || process.env, evidence: input.nvidiaEvidence || {} });
  const failover = nvidia.state === "CHANNEL_NOT_PRESENT"
    ? nvidiaUnavailable({ remaining: cpu.identity ? [cpu.identity] : [] })
    : { status: "EXECUTED", fake_success: false, live: false };
  const adapter = createAdapter({ kind: "accelerator", discovery: unknown });
  const paid = applyCostPolicy(
    [describeIntelligence({ id: "paid-gpu", provider: "NVIDIA", capabilities: ["GPU_ACCELERATION"], cost: "paid" })],
    "PAID_FORBIDDEN",
  );
  const types = INTELLIGENCE_TYPES.includes("UNKNOWN");
  const tomorrow = tomorrowBundle({
    technology_id: "TECHNOLOGY_TOMORROW",
    intelligence_id: "INTELLIGENCE_TOMORROW",
    protocol_id: "PROTOCOL_TOMORROW",
    accelerator_id: "ACCELERATOR_TOMORROW",
  });
  const experiment = ultimateAccelerationExperiment({ at, workerEvidence: input.workerEvidence || {} });
  const invoke = intelligenceAdapter({
    id: registryId(unknown.identity),
    provider: unknown.vendor,
    capabilities: unknown.capabilities,
  }).invoke({ capability: "compute" });
  const merge = authorizeCapability({ capabilities: ["merge"], allowed: false, authority: "network" });
  return {
    version: ACCEL_VERSION,
    status: "EXECUTED",
    discovered,
    nvidia: { ...nvidia, probe: nvidiaProbe },
    cpu,
    unknown,
    failover,
    adapter,
    paid_forbidden: paid.length === 0,
    types_open: types,
    tomorrow,
    experiment,
    invoke,
    gates: {
      merge: merge.ok,
      nvidia_is_architecture: false,
      hardware_is_not_intelligence: true,
      passport_is_not_presence: true,
      discovery_is_not_trust: true,
      second_cortex: false,
      second_fabric: false,
    },
    zero_cost: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}
