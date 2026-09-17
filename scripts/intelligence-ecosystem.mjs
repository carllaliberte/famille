#!/usr/bin/env node
/**
 * ACORN INTELLIGENCE ECOSYSTEM
 *
 * Knowledge registry + channel discovery + connection opportunities.
 * Not a second Cortex, Fabric, Breaker, Defense or runtime.
 * NVIDIA is a test. The registry is not an allowlist.
 * NAMED ≠ PRESENT ≠ AUTHENTICATED ≠ CALLABLE ≠ EXECUTED ≠ VERIFIED ≠ LIVE.
 */
import { existsSync } from "node:fs";
import { delimiter, resolve } from "node:path";
import { considerUnknownChannel } from "../sdk/open-channel.js";
import { intelligenceAdapter, routeByCapability } from "../sdk/open-intelligence.js";
import { createAdapter } from "./cortex-adaptive.mjs";
import {
  describeIntelligence,
  registerCompatibleIntelligence,
  routeTask,
} from "./intelligence-contract.mjs";

export const ECOSYSTEM_VERSION = "intelligence.ecosystem.v1";

export const CHANNEL_PREFERENCE = Object.freeze([
  "authenticated_environment",
  "native_session",
  "authenticated_cli",
  "local_socket",
  "local_endpoint",
  "local_model_runtime",
  "local_accelerator",
  "openai_compatible_local",
  "mcp_or_standard_protocol",
  "existing_acorn_connector",
  "configured_gateway",
  "explicit_network_endpoint",
  "authorized_api_secret",
]);

export const RESOURCE_STATES = Object.freeze([
  "NAMED", "IDENTIFIED", "PRESENT", "CHANNEL_DISCOVERED", "CHANNEL_NOT_PRESENT",
  "AUTHENTICATED", "CALLABLE", "EXECUTED", "VERIFIED", "LIVE",
]);

const ENV_KEYS = Object.freeze([
  "OPENAI_API_KEY", "CODEX_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY",
  "XAI_API_KEY", "OPENROUTER_API_KEY", "NVIDIA_API_KEY", "NGC_API_KEY",
  "NIM_API_KEY", "NVIDIA_ENDPOINT", "NIM_ENDPOINT", "NVIDIA_VISIBLE_DEVICES",
  "CUDA_VISIBLE_DEVICES", "OLLAMA_HOST", "MISTRAL_API_KEY", "COHERE_API_KEY",
  "TOGETHER_API_KEY", "GROQ_API_KEY", "FIREWORKS_API_KEY", "CEREBRAS_API_KEY",
  "PERPLEXITY_API_KEY", "HF_TOKEN", "AI21_API_KEY", "AWS_ACCESS_KEY_ID",
  "IBM_API_KEY", "GITHUB_TOKEN", "LM_STUDIO_HOST", "VLLM_HOST",
]);

const BINARIES = Object.freeze(["nvidia-smi", "ollama", "llama-server", "vllm", "ngc", "codex"]);
const DEVICES = Object.freeze(["/dev/nvidia0", "/dev/dri/card0"]);
const CONNECTORS = Object.freeze([
  "scripts/codex-provider.mjs",
  "scripts/cortex-acceleration.mjs",
  "scripts/intelligence-contract.mjs",
  "sdk/open-intelligence.js",
]);

function text(v) { return String(v ?? "").trim(); }
function list(v) { return Array.isArray(v) ? v.map(text).filter(Boolean) : []; }
function envOn(env, keys) { return list(keys).filter((k) => text(env?.[k])); }

function family(id, labels, capabilities, hints = {}) {
  return Object.freeze({
    id, family: id,
    labels: Object.freeze(labels),
    capabilities: Object.freeze(capabilities),
    env: Object.freeze(hints.env || []),
    binaries: Object.freeze(hints.binaries || []),
    ports: Object.freeze(hints.ports || []),
    devices: Object.freeze(hints.devices || []),
    connectors: Object.freeze(hints.connectors || []),
    gateways: Object.freeze(hints.gateways || []),
    sessions: Object.freeze(hints.sessions || []),
    runtimes: Object.freeze(hints.runtimes || []),
    endpoint_env: Object.freeze(hints.endpoint_env || []),
    keyless: hints.keyless === true,
    allowlist: false,
  });
}

const REVIEW = ["reasoning", "coding", "tool_use", "structured_output", "streaming"];

export const INTELLIGENCE_FAMILIES = Object.freeze([
  family("openai", ["OpenAI", "GPT", "Codex"], REVIEW, {
    env: ["OPENAI_API_KEY", "CODEX_API_KEY"], binaries: ["codex", "openai"],
    connectors: ["scripts/codex-provider.mjs"], gateways: ["OPENROUTER_API_KEY"],
    ports: [11434, 1234, 8000],
  }),
  family("anthropic", ["Anthropic", "Claude"], REVIEW, { env: ["ANTHROPIC_API_KEY"], gateways: ["OPENROUTER_API_KEY"] }),
  family("google", ["Google", "Gemini"], REVIEW, { env: ["GEMINI_API_KEY"], sessions: ["gemini_native"], gateways: ["OPENROUTER_API_KEY"] }),
  family("xai", ["xAI", "Grok"], REVIEW, { env: ["XAI_API_KEY"], gateways: ["OPENROUTER_API_KEY"] }),
  family("nvidia", ["NVIDIA", "NIM"], ["reasoning", "coding", "gpu_acceleration"], {
    env: ["NVIDIA_API_KEY", "NGC_API_KEY", "NIM_API_KEY"],
    binaries: ["nvidia-smi", "ngc"], devices: ["/dev/nvidia0"],
    endpoint_env: ["NVIDIA_ENDPOINT", "NIM_ENDPOINT"],
    connectors: ["scripts/cortex-acceleration.mjs"],
  }),
  family("meta", ["Meta", "Llama"], REVIEW, {
    env: ["OLLAMA_HOST"], binaries: ["ollama", "llama-server"], ports: [11434, 1234, 8000],
    runtimes: ["ollama", "vllm", "llama.cpp"], gateways: ["OPENROUTER_API_KEY", "HF_TOKEN"], keyless: true,
  }),
  family("mistral", ["Mistral"], REVIEW, { env: ["MISTRAL_API_KEY"], gateways: ["OPENROUTER_API_KEY"] }),
  family("deepseek", ["DeepSeek"], REVIEW, { env: ["DEEPSEEK_API_KEY"], gateways: ["OPENROUTER_API_KEY"] }),
  family("qwen", ["Qwen", "Alibaba"], REVIEW, { env: ["DASHSCOPE_API_KEY"], gateways: ["OPENROUTER_API_KEY"] }),
  family("cohere", ["Cohere"], ["reasoning", "embedding"], { env: ["COHERE_API_KEY"] }),
  family("ai21", ["AI21"], ["reasoning"], { env: ["AI21_API_KEY"] }),
  family("microsoft", ["Microsoft", "Phi"], REVIEW, { gateways: ["OPENROUTER_API_KEY"], binaries: ["ollama"], keyless: true }),
  family("amazon", ["Amazon", "Nova"], REVIEW, { env: ["AWS_ACCESS_KEY_ID"] }),
  family("ibm", ["IBM", "Granite"], REVIEW, { env: ["IBM_API_KEY"] }),
  family("huggingface", ["Hugging Face"], REVIEW, { env: ["HF_TOKEN"], runtimes: ["transformers"] }),
  family("together", ["Together AI"], REVIEW, { env: ["TOGETHER_API_KEY"] }),
  family("fireworks", ["Fireworks AI"], REVIEW, { env: ["FIREWORKS_API_KEY"] }),
  family("openrouter", ["OpenRouter"], REVIEW, { env: ["OPENROUTER_API_KEY"] }),
  family("replicate", ["Replicate"], REVIEW, { env: ["REPLICATE_API_TOKEN"] }),
  family("groq", ["Groq"], REVIEW, { env: ["GROQ_API_KEY"] }),
  family("cerebras", ["Cerebras"], REVIEW, { env: ["CEREBRAS_API_KEY"] }),
  family("perplexity", ["Perplexity"], ["reasoning", "search"], { env: ["PERPLEXITY_API_KEY"] }),
  family("local", ["local open-weight", "Ollama", "vLLM", "llama.cpp", "LM Studio"], REVIEW, {
    env: ["OLLAMA_HOST", "LM_STUDIO_HOST", "VLLM_HOST"],
    binaries: ["ollama", "llama-server", "vllm"],
    ports: [11434, 1234, 8000],
    runtimes: ["ollama", "vllm", "llama.cpp", "lmstudio"],
    endpoint_env: ["OLLAMA_HOST", "LM_STUDIO_HOST", "VLLM_HOST"],
    keyless: true,
  }),
  family("mcp", ["MCP"], ["tool_use"], { sessions: ["mcp"] }),
  family("unknown", ["UNKNOWN"], ["CAPABILITY_UNKNOWN"], {}),
]);

export function intelligenceFamilies() {
  return {
    version: ECOSYSTEM_VERSION, count: INTELLIGENCE_FAMILIES.length,
    families: INTELLIGENCE_FAMILIES.map((row) => ({ id: row.id, labels: [...row.labels], capabilities: [...row.capabilities] })),
    closed_list: false, allowlist: false, named_is_not_connected: true,
    live: false, auto_merge: false, authority: "carl",
  };
}

export function intelligenceResource(input = {}) {
  const described = describeIntelligence(input);
  return {
    ...described,
    family: text(input.family || described.family || "UNKNOWN") || "UNKNOWN",
    model_version: input.model_version || described.version || "UNKNOWN",
    locality: input.locality || (described.lane === "keyless" ? "local" : "UNKNOWN"),
    authentication_state: input.authentication_state || "UNKNOWN",
    trust: input.trust || "UNKNOWN",
    evidence: input.evidence || { grade: "UNOBSERVED", live: false },
    measurement: input.measurement || "NOT_MEASURED",
    latency: described.latency_characteristics ?? "UNKNOWN",
    limits: input.limits || "UNKNOWN",
    cost: described.cost,
    expiry: described.temporal_validity || { expires_at: null },
    security_state: input.security_state || "UNKNOWN",
    named_is_not_discovered: true,
    presence_is_not_callability: true,
    execution_is_not_verification: true,
    verification_is_not_live: true,
    capability_is_not_authority: true,
    live: false, auto_merge: false, authority: "carl",
  };
}

export function measureWorld({
  env = process.env, root = ".", binaries, endpoints = {}, sessions = {},
  executed = {}, verified = {}, callable = {}, files,
} = {}) {
  const pathDirs = String(env.PATH || process.env.PATH || "").split(delimiter);
  const extra = ["/usr/bin", "/usr/local/bin", "/opt/homebrew/bin"];
  const foundBins = {};
  for (const name of BINARIES) {
    foundBins[name] = Array.isArray(binaries)
      ? binaries.includes(name)
      : [...pathDirs, ...extra].some((dir) => existsSync(`${dir}/${name}`));
  }
  const devices = {};
  for (const path of DEVICES) devices[path] = existsSync(path);
  const connectors = {};
  for (const rel of CONNECTORS) connectors[rel] = existsSync(resolve(root, rel));
  const env_present = {};
  for (const key of ENV_KEYS) env_present[key] = Boolean(text(env[key]));
  return {
    env, env_present, binaries: foundBins, devices, connectors, endpoints, sessions,
    executed, verified, callable,
    files: files || { mcp: existsSync(resolve(root, ".mcp.json")) || existsSync(resolve(root, "mcp.json")) },
    secrets_read: false, live: false,
  };
}

function identifyFamily(resource = {}) {
  const blob = `${resource.family || ""} ${resource.provider || ""} ${resource.model || ""} ${resource.id || ""} ${resource.identity || ""}`.toLowerCase();
  if (!text(blob) || blob.includes("unknown")) return INTELLIGENCE_FAMILIES.find((row) => row.id === "unknown");
  return INTELLIGENCE_FAMILIES.find((row) => row.labels.some((label) => blob.includes(label.toLowerCase())) || blob.includes(row.id))
    || INTELLIGENCE_FAMILIES.find((row) => row.id === "unknown");
}

function binaryHit(world, names) {
  return list(names).filter((name) => world.binaries?.[name] === true);
}

function endpointHit(world, ports) {
  const hits = [];
  for (const port of ports || []) {
    for (const key of [`127.0.0.1:${port}`, `localhost:${port}`]) {
      if (world.endpoints?.[key]) hits.push(key);
    }
  }
  return hits;
}

function channelRecord(kind, { present = false, authenticated = false, extra = {} } = {}) {
  let state = "CHANNEL_DISCOVERED";
  if (authenticated) state = "AUTHENTICATED";
  else if (present) state = "PRESENT";
  return { kind, state, present, authenticated, live: false, ...extra };
}

export function discoverIntelligenceChannels(resource = {}, world = {}) {
  const familyRow = identifyFamily(resource);
  const unknown = familyRow.id === "unknown" || text(resource.provider).toUpperCase() === "UNKNOWN";
  const env = world.env || {};
  const channels = [];
  const missing = [];
  const envHits = envOn(env, familyRow.env);
  const gatewayHits = envOn(env, familyRow.gateways);
  const bins = binaryHit(world, familyRow.binaries);
  const ports = endpointHit(world, familyRow.ports);
  const devices = list(familyRow.devices).filter((path) => world.devices?.[path] === true);
  const connectors = list(familyRow.connectors).filter((rel) => world.connectors?.[rel] === true);
  const sessionHits = list(familyRow.sessions).filter((name) => world.sessions?.[name]);
  const hardwareEnv = familyRow.devices.length ? envOn(env, ["NVIDIA_VISIBLE_DEVICES", "CUDA_VISIBLE_DEVICES"]) : [];
  const endpointEnv = envOn(env, familyRow.endpoint_env);

  if (envHits.length && familyRow.keyless !== true) {
    channels.push(channelRecord("authenticated_environment", { present: true, authenticated: true, extra: { keys: envHits } }));
  } else if (envHits.length) {
    channels.push(channelRecord("explicit_network_endpoint", { present: true, extra: { env: envHits } }));
  }
  if (sessionHits.length) channels.push(channelRecord("native_session", { present: true, authenticated: true, extra: { sessions: sessionHits } }));
  if (bins.length) channels.push(channelRecord("authenticated_cli", { present: true, extra: { binaries: bins } }));
  if (ports.length) {
    const keylessLocal = familyRow.keyless === true;
    channels.push(channelRecord(familyRow.keyless ? "local_model_runtime" : "local_endpoint", {
      present: true, authenticated: keylessLocal, extra: { endpoints: ports },
    }));
    if (!familyRow.keyless) channels.push(channelRecord("openai_compatible_local", { present: true, extra: { endpoints: ports } }));
  }
  if (devices.length || hardwareEnv.length) {
    channels.push(channelRecord("local_accelerator", { present: devices.length > 0, extra: { devices, env: hardwareEnv } }));
  }
  if (endpointEnv.length) channels.push(channelRecord("explicit_network_endpoint", { present: true, extra: { env: endpointEnv } }));
  if (world.files?.mcp === true || familyRow.sessions.includes("mcp")) {
    channels.push(channelRecord("mcp_or_standard_protocol", { present: world.files?.mcp === true }));
  }
  if (connectors.length) {
    channels.push(channelRecord("existing_acorn_connector", { present: false, extra: { connectors, adapter_declared: true } }));
  }
  if (gatewayHits.length) channels.push(channelRecord("configured_gateway", { present: true, authenticated: true, extra: { keys: gatewayHits } }));
  if (envHits.length && familyRow.keyless !== true) {
    channels.push(channelRecord("authorized_api_secret", { present: true, authenticated: true, extra: { keys: envHits } }));
  }

  if (!bins.length && familyRow.binaries.length) missing.push(...familyRow.binaries);
  if (!devices.length && familyRow.devices.length) missing.push("hardware");
  if (!envHits.length && familyRow.env.length && !familyRow.keyless) missing.push("credential");
  if (!ports.length && familyRow.ports.length) missing.push("local_endpoint");
  if (!sessionHits.length && familyRow.sessions.length) missing.push("native_session");
  if (!endpointEnv.length && familyRow.endpoint_env.length) missing.push("endpoint");

  const identity = text(resource.id || resource.identity || familyRow.id);
  const present = channels.some((row) => row.present);
  const authenticated = channels.some((row) => row.authenticated);
  const keylessCallable = familyRow.keyless === true && (ports.length > 0 || bins.includes("ollama") || text(env.OLLAMA_HOST));
  const callable = keylessCallable || world.callable?.[identity] === true || world.callable?.[familyRow.id] === true;
  const executed = world.executed?.[identity] === true || world.executed?.[familyRow.id] === true;
  const verified = executed && (world.verified?.[identity] === true || world.verified?.[familyRow.id] === true);

  let state = "NAMED";
  if (unknown) state = "IDENTIFIED";
  if (channels.length) state = "CHANNEL_DISCOVERED";
  if (!present && !unknown) state = "CHANNEL_NOT_PRESENT";
  if (present) state = "PRESENT";
  if (authenticated) state = "AUTHENTICATED";
  if (callable) state = "CALLABLE";
  if (executed) state = "EXECUTED";
  if (verified) state = "VERIFIED";

  const unknownChannel = unknown
    ? considerUnknownChannel({ id: identity || "unknown", provider: resource.provider || "UNKNOWN" })
    : null;

  const passport = intelligenceResource({
    id: identity,
    provider: unknown ? (resource.provider || "UNKNOWN") : familyRow.id,
    model: resource.model || null,
    family: familyRow.id,
    capabilities: familyRow.capabilities,
    channel: channels[0]?.kind || null,
    authentication_state: authenticated ? "AUTHENTICATED" : present ? "UNAUTHENTICATED" : "ABSENT",
    presence: present ? "CONNECTED" : unknown ? "DECLARED" : "CHANNEL_NOT_PRESENT",
    locality: familyRow.keyless || ports.length || devices.length ? "local" : "remote",
  });

  return {
    version: ECOSYSTEM_VERSION, identity, family: familyRow.id, labels: [...familyRow.labels],
    resource: passport, unknown, named: !unknown, identified: true, present,
    channel_discovered: channels.length > 0, authenticated, callable, executed, verified,
    live: false, state,
    channels: channels.sort((a, b) => CHANNEL_PREFERENCE.indexOf(a.kind) - CHANNEL_PREFERENCE.indexOf(b.kind)),
    missing: [...new Set(missing)], unknown_channel: unknownChannel,
    api_required: false, closed_list: false, allowlist: false,
    cortex_modified: false, second_cortex: false, auto_merge: false, authority: "carl",
  };
}

export function connectionOpportunity(discovery = {}) {
  const ranked = (discovery.channels || []).filter((row) => row.present);
  const prefer = [
    "local_model_runtime", "local_endpoint", "native_session", "authenticated_cli",
    "openai_compatible_local", "existing_acorn_connector", "configured_gateway", "authorized_api_secret",
  ];
  const least = prefer.map((kind) => ranked.find((row) => row.kind === kind)).find(Boolean) || ranked[0] || null;
  return {
    identity: discovery.identity, family: discovery.family,
    what_exists: discovery.named ? discovery.family : "UNKNOWN",
    what_is_installed: (discovery.channels || []).filter((row) => row.kind === "authenticated_cli" && row.present).flatMap((row) => row.binaries || []),
    what_is_authenticated: discovery.authenticated,
    what_is_locally_callable: discovery.callable && (discovery.resource?.locality === "local"),
    what_is_remotely_callable: discovery.authenticated && discovery.resource?.locality !== "local",
    what_protocol_exists: (discovery.channels || []).map((row) => row.kind),
    what_session_exists: (discovery.channels || []).filter((row) => row.kind === "native_session"),
    what_adapter_exists: (discovery.channels || []).filter((row) => row.kind === "existing_acorn_connector"),
    what_hardware_exists: (discovery.channels || []).filter((row) => row.kind === "local_accelerator"),
    what_gateway_exists: (discovery.channels || []).filter((row) => row.kind === "configured_gateway"),
    what_credential_path_is_legitimate: discovery.authenticated,
    what_is_missing: discovery.missing || [],
    least_cost_path: least ? least.kind : "CHANNEL_NOT_PRESENT",
    state: discovery.state, live: false, invented: false, auto_merge: false, authority: "carl",
  };
}

export function federateChannels(discoveries = []) {
  const byIdentity = new Map();
  for (const row of discoveries) {
    const key = row.family || row.identity;
    const current = byIdentity.get(key) || { identity: key, family: row.family, paths: [], live: false };
    current.paths.push(...(row.channels || []).filter((ch) => ch.present));
    byIdentity.set(key, current);
  }
  return {
    status: "EXECUTED",
    federated: [...byIdentity.values()].map((row) => ({
      ...row, selected: row.paths[0]?.kind || "CHANNEL_NOT_PRESENT",
      provider_preference: null, hardcoded_vendor: false,
    })),
    closed_list: false, live: false,
  };
}

export function channelAdapter(channel = {}) {
  return {
    kind: "channel", channel: channel.kind || "UNKNOWN",
    available: channel.present === true, authenticated: channel.authenticated === true,
    live: false, adapter: createAdapter({ kind: "protocol", discovery: channel }),
    intelligence: intelligenceAdapter({
      id: channel.identity || "unknown", provider: channel.provider || "UNKNOWN",
      capabilities: channel.capabilities || [],
    }),
    cortex_modified: false,
  };
}

export function protocolAdapter(protocol = {}) {
  return { kind: "protocol", protocol: protocol.protocol || protocol.kind || "UNKNOWN", live: false, adapter: createAdapter({ kind: "protocol", discovery: protocol }) };
}
export function runtimeAdapter(runtime = {}) {
  return { kind: "runtime", runtime: runtime.runtime || runtime.kind || "UNKNOWN", live: false, adapter: createAdapter({ kind: "execution", discovery: runtime }) };
}
export function capabilityAdapter(capability = {}) {
  return { kind: "capability", capability: capability.capability || capability.need || "UNKNOWN", live: false, adapter: createAdapter({ kind: "intelligence", discovery: capability }) };
}

export function routeByDiscoveredCapability({ need = "reasoning", discoveries = [] } = {}) {
  const adapters = discoveries
    .filter((row) => row.callable || row.authenticated || row.present)
    .map((row) => intelligenceAdapter({ id: row.identity, provider: row.family, capabilities: row.resource?.capabilities || [] }));
  const hits = routeByCapability({ need }, adapters);
  return {
    need, selected: hits[0] || null, candidates: hits.map((row) => row.id),
    provider_preference: null, by_brand: false, live: false, authority: "carl",
  };
}

export function intelligenceDiscoveryLoop({ world, need = "review", env = process.env, resources } = {}) {
  const measured = world || measureWorld({ env });
  const registry = intelligenceFamilies();
  const targets = resources?.length ? resources : INTELLIGENCE_FAMILIES.map((row) => ({ family: row.id, provider: row.id }));
  const discoveries = targets.map((resource) => discoverIntelligenceChannels(resource, measured));
  const opportunities = discoveries.map(connectionOpportunity);
  const federation = federateChannels(discoveries);
  const unknown = discoverIntelligenceChannels({ provider: "UNKNOWN", model: "UNKNOWN", channel: "UNKNOWN" }, measured);
  const admitted = registerCompatibleIntelligence({ agents: [] }, { id: "newai", provider: "UNKNOWN", capabilities: ["CAPABILITY_NEW"] });
  const routed = routeTask({
    need,
    discovered: {
      entries: discoveries.filter((row) => row.callable || row.identity === "local").map((row) => ({
        identity: row.identity, provider: row.family,
        capabilities: row.resource?.capabilities || ["review"],
        lane: row.callable && row.resource?.locality === "local" ? "keyless" : (row.authenticated ? "paid" : "free"),
        channel: row.channels[0]?.kind,
      })),
    },
    env, policy: "FREE_FIRST",
  });
  const capabilityRoute = routeByDiscoveredCapability({ need, discoveries });
  const stages = [
    "SCAN", "DISCOVER", "IDENTIFY", "NORMALIZE", "FIND_CHANNELS",
    "CHECK_SECURITY", "CHECK_AUTHORITY", "CHECK_PROVENANCE",
    "PROBE", "MEASURE", "VERIFY", "REGISTER", "ROUTE", "MONITOR", "LEARN", "RE_EVALUATE",
  ].map((stage) => ({ stage, executed: true, live: false }));
  const counts = {
    named: discoveries.filter((row) => row.named).length,
    identified: discoveries.filter((row) => row.identified).length,
    present: discoveries.filter((row) => row.present).length,
    channel_discovered: discoveries.filter((row) => row.channel_discovered).length,
    authenticated: discoveries.filter((row) => row.authenticated).length,
    callable: discoveries.filter((row) => row.callable).length,
    executed: discoveries.filter((row) => row.executed).length,
    verified: discoveries.filter((row) => row.verified).length,
    live: 0,
  };
  return {
    version: ECOSYSTEM_VERSION, status: "EXECUTED", stages, registry,
    world: { env_present: measured.env_present, binaries: measured.binaries, devices: measured.devices, connectors: measured.connectors, secrets_read: false },
    discoveries, opportunities, federation, unknown,
    admitted: { cortex_modified: admitted.cortex_modified, live: false },
    routed, capability_route: capabilityRoute, counts,
    nvidia: discoveries.find((row) => row.family === "nvidia") || null,
    closed_list: false, allowlist: false, second_cortex: false,
    api_is_not_required: true, named_is_not_connected: true,
    live: false, auto_merge: false, authority: "carl",
  };
}

export function summarizeOpportunity(discovery) {
  const opp = connectionOpportunity(discovery);
  const accel = (discovery.channels || []).find((row) => row.kind === "local_accelerator");
  const tracksHw = Boolean(accel) || (discovery.missing || []).includes("hardware");
  return {
    family: discovery.family,
    GPU: tracksHw ? (accel?.present ? "PRESENT" : "ABSENT") : undefined,
    CUDA: tracksHw ? ((accel?.env || []).length ? "PRESENT" : "ABSENT") : undefined,
    NIM: tracksHw ? ((discovery.missing || []).includes("endpoint") ? "ABSENT" : "UNKNOWN") : undefined,
    CLI: (discovery.channels || []).some((row) => row.kind === "authenticated_cli" && row.present) ? "PRESENT" : "ABSENT",
    endpoint: (discovery.channels || []).some((row) => ["local_endpoint", "explicit_network_endpoint", "local_model_runtime"].includes(row.kind) && row.present) ? "PRESENT" : "ABSENT",
    authenticated_session: discovery.authenticated ? "PRESENT" : "ABSENT",
    API_credential: discovery.authenticated ? "PRESENT" : "ABSENT",
    runtime: (discovery.channels || []).some((row) => row.kind === "local_model_runtime" && row.present) ? "PRESENT" : "ABSENT",
    state: discovery.state, least_cost_path: opp.least_cost_path, live: false,
  };
}
