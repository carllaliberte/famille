#!/usr/bin/env node
/**
 * ACORN INTELLIGENCE CONTRACT — Cortex-owned, not a second fabric.
 *
 * Discovery, capability-first routing, cost policy, experience memory.
 * Roster is a cache. CANALS are transports. Cortex remains the brain.
 * identity ≠ model ≠ provider ≠ channel. CAPABILITY ≠ AUTHORITY.
 */
import { intelligenceAdapter, routeByCapability, declareIntelligence } from "../sdk/open-intelligence.js";
import { considerUnknownChannel, classifyProbe } from "../sdk/open-channel.js";
import { classifyLane, isFreeModel, laneInventory, preferUnpaid, secretAvailable } from "./inference-lanes.mjs";
import { loadDeclaredAgents } from "./cognitive-handshake.mjs";
import { rememberExperience as rememberReality } from "./reality-learning-engine.mjs";

export const COST_POLICIES = Object.freeze([
  "LOCAL_ONLY", "FREE_ONLY", "FREE_FIRST", "PAID_ALLOWED", "PAID_FORBIDDEN",
]);
export const STRATEGIES = Object.freeze([
  "ONE_MODEL", "LOCAL_FIRST", "FREE_FIRST", "PARALLEL_MODELS", "CROSS_CHECK",
]);

function text(v) { return String(v ?? "").trim(); }
function list(v) { return Array.isArray(v) ? v.map(text).filter(Boolean) : []; }

export function describeIntelligence(input = {}) {
  const lane = classifyLane(input);
  return {
    identity: text(input.id || input.identity),
    provider: text(input.provider || "UNKNOWN") || "UNKNOWN",
    model: input.model || null,
    endpoint: input.endpoint || null,
    channel: input.channel || input.protocol || input.secret || null,
    protocol: input.protocol || "open-intelligence.v0",
    capabilities: list(input.capabilities),
    modalities: list(input.modalities),
    tools: list(input.tools),
    presence: input.presence || "DECLARED",
    lane,
    cost: input.cost ?? (lane === "paid" ? "paid" : lane === "free" ? "free" : "zero"),
    authority: false,
    live: false,
    identity_is_not_model: true,
    provider_is_not_channel: true,
  };
}

export function intelligenceState({ configured = false, callable = false, executed = false, measured = false, failed = false, hold = false } = {}) {
  if (hold) return "HOLD_HUMAN";
  if (failed) return "FAILED";
  if (measured) return "MEASURED";
  if (executed) return "EXECUTED";
  if (callable) return "CALLABLE";
  if (configured) return "CONFIGURED";
  return "DEFINED";
}

export function discoverIntelligences({
  env = process.env,
  agents = [],
  canals = {},
  workerEvidence = {},
} = {}) {
  const roster = agents.length ? agents : loadDeclaredAgents().map((h) => ({
    id: h.identity.id, capabilities: h.capabilities.map((c) => c.name), presence: "DECLARED",
  }));
  const discovered = [];
  for (const agent of roster) {
    const canal = canals[agent.id] || {};
    const spec = { ...canal, id: agent.id, capabilities: agent.capabilities };
    const configured = secretAvailable(spec, env) || Boolean(canal.secret && String(env[canal.secret] || env.GH_TOKEN || "").trim());
    const local = agent.id === "worker" && workerEvidence?.v;
    const callable = local || (configured && (classifyLane(spec) === "keyless" || classifyLane(spec) === "free"));
    discovered.push({
      ...describeIntelligence({ ...spec, presence: local ? "ACTIVE" : configured ? "CONNECTED" : "DECLARED" }),
      state: intelligenceState({ configured, callable, executed: local }),
      source: "roster-cache",
      live: false,
    });
  }
  for (const [id, canal] of Object.entries(canals)) {
    if (discovered.some((row) => row.identity === id)) continue;
    const spec = { ...canal, id };
    const configured = secretAvailable(spec, env);
    discovered.push({
      ...describeIntelligence({ ...spec, presence: configured ? "CONNECTED" : "DECLARED" }),
      state: intelligenceState({ configured, callable: configured && classifyLane(spec) !== "paid" }),
      source: "canal-cache",
      live: false,
    });
  }
  discovered.push({
    ...describeIntelligence({
      id: "cortex-local",
      provider: "acorn",
      capabilities: ["cognitive-cycle", "review"],
      protocol: "deterministic",
      lane: "keyless",
    }),
    state: "CALLABLE",
    presence: "ACTIVE",
    source: "runtime",
    live: false,
  });
  return {
    status: "EXECUTED",
    count: discovered.length,
    discoverable: discovered.length,
    callable: discovered.filter((row) => row.state === "CALLABLE" || row.state === "EXECUTED").length,
    executed: discovered.filter((row) => row.state === "EXECUTED").length,
    entries: discovered,
    lanes: laneInventory(env),
    closed_list: false,
    live: false,
  };
}

export async function discoverCatalog({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const key = String(env.OPENROUTER_API_KEY || "").trim();
  if (!key) return { status: "INCONCLUSIVE", reason: "CHANNEL_NOT_PRESENT", models: [], live: false };
  if (typeof fetchImpl !== "function") return { status: "INCONCLUSIVE", reason: "NO_TRANSPORT", models: [], live: false };
  try {
    const res = await fetchImpl("https://openrouter.ai/api/v1/models", {
      headers: { authorization: `Bearer ${key}` },
    });
    const probe = classifyProbe({ url: "https://openrouter.ai/api/v1/models", http: res.status });
    if (!res.ok) return { status: "INCONCLUSIVE", reason: probe.failure || `HTTP_${res.status}`, probe, models: [], live: false };
    const body = await res.json();
    const models = (body.data || body.models || []).slice(0, 80).map((row) => describeIntelligence({
      id: String(row.id || "").replace(/[^a-z0-9-]+/gi, "-").toLowerCase().slice(0, 24) || "catalog",
      provider: "openrouter",
      model: row.id,
      capabilities: ["review", "lu"],
      channel: "openrouter",
    }));
    return { status: "MEASURED", models, probe, live: false };
  } catch (error) {
    return { status: "INCONCLUSIVE", reason: error.message, models: [], live: false };
  }
}

export function applyCostPolicy(entries = [], policy = "FREE_FIRST") {
  const mode = COST_POLICIES.includes(policy) ? policy : "FREE_FIRST";
  const rows = entries || [];
  if (mode === "LOCAL_ONLY") return rows.filter((row) => row.lane === "keyless" || row.identity === "cortex-local");
  if (mode === "FREE_ONLY" || mode === "PAID_FORBIDDEN") return rows.filter((row) => row.lane !== "paid");
  if (mode === "FREE_FIRST" || mode === "PAID_ALLOWED") return rows;
  return rows;
}

export function routeTask({
  need = "review",
  discovered = { entries: [] },
  env = process.env,
  policy = "FREE_FIRST",
  memory = [],
  strategy,
} = {}) {
  const policyMode = env.ACORN_COST_POLICY || policy;
  const adapters = applyCostPolicy(discovered.entries || [], policyMode).map((row) => intelligenceAdapter({
    id: row.identity,
    provider: row.provider,
    capabilities: row.capabilities,
    protocol: row.protocol,
  }));
  const byCap = routeByCapability({ need }, adapters);
  const specs = byCap.map((hit) => (discovered.entries || []).find((row) => row.identity === hit.id)).filter(Boolean);
  const unpaid = preferUnpaid(specs.map((row) => ({ ...row, id: row.identity, secret: row.channel })), env);
  let selected = unpaid.selected.length
    ? specs.filter((row) => unpaid.selected.includes(row.identity))
    : (policyMode === "PAID_FORBIDDEN" || policyMode === "FREE_ONLY" || policyMode === "LOCAL_ONLY" ? [] : specs);
  const avoid = new Set((memory || []).filter((row) => row.constraint && row.intelligence).map((row) => row.intelligence));
  selected = selected.filter((row) => !avoid.has(row.identity));
  const chosen = selected[0] || (discovered.entries || []).find((row) => row.identity === "cortex-local");
  const decided = strategy
    || (chosen?.lane === "keyless" ? "LOCAL_FIRST" : chosen?.lane === "free" ? "FREE_FIRST" : "ONE_MODEL");
  if ((policyMode === "PAID_FORBIDDEN" || policyMode === "FREE_ONLY") && chosen?.lane === "paid") {
    return { status: "HOLD_HUMAN", reason: "PAID_FORBIDDEN", selected: null, live: false };
  }
  return {
    status: chosen ? "EXECUTED" : "INCONCLUSIVE",
    need,
    policy: policyMode,
    strategy: decided,
    selected: chosen ? { identity: chosen.identity, provider: chosen.provider, lane: chosen.lane, live: false } : null,
    candidates: selected.map((row) => row.identity),
    skipped_paid: unpaid.skipped_paid || [],
    silent_paid_fallback: false,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function rememberIntelligenceExperience({
  intelligence, capability, result, latency_ms, cost, failure, verification = {}, at,
} = {}) {
  const remembered = rememberReality({
    prediction: { prediction_id: `int_${intelligence || "unknown"}`, expected: "ok", rewritten: false },
    observation: { observation_id: `obs_${intelligence || "unknown"}`, actual: failure ? "failed" : "ok" },
    error: { absolute: failure ? 1 : 0, prediction_id: `int_${intelligence || "unknown"}` },
    verification,
    context: { intelligence, capability },
    at,
  });
  return {
    status: remembered.status,
    entry: {
      intelligence, capability, result: result || (failure ? "FAILED" : "OK"),
      quality: failure ? "low" : "measured", latency_ms: latency_ms ?? null, cost: cost ?? null,
      failure: failure || null, verification, at: at || new Date().toISOString(),
      constraint: Boolean(failure), live: false,
    },
    live: false,
  };
}

export function learnFromProviderFailure({ http, intelligence, policy = "FREE_FIRST" } = {}) {
  const kind = http === 429 ? "quota_exhausted" : http === 401 || http === 403 ? "auth" : http === 404 ? "unavailable" : "provider_error";
  return {
    status: "MEASURED",
    intelligence,
    failure: kind,
    http: http ?? null,
    fake_success: false,
    reroute: kind === "quota_exhausted" || kind === "unavailable",
    next_policy: policy === "PAID_ALLOWED" && kind === "quota_exhausted" ? "FREE_FIRST" : policy,
    live: false,
  };
}

export function registerCompatibleIntelligence(roster, entry = {}) {
  const declared = declareIntelligence(roster || { agents: [] }, {
    id: entry.id,
    name: entry.name || entry.id,
    kind: "guest",
    capabilities: entry.capabilities || ["CAPABILITY_NEW"],
  });
  const unknown = considerUnknownChannel({ id: entry.id, provider: entry.provider || "UNKNOWN" });
  return { roster: declared, channel: unknown, cortex_modified: false, live: false };
}

export function runIntelligenceContract(input = {}) {
  const discovered = discoverIntelligences(input);
  const routed = routeTask({
    need: input.need || "review",
    discovered,
    env: input.env || process.env,
    policy: input.policy || "FREE_FIRST",
    memory: input.memory || [],
  });
  const adapters = (discovered.entries || []).slice(0, 4).map((row) => intelligenceAdapter({
    id: row.identity, provider: row.provider, capabilities: row.capabilities,
  }));
  const collective = adapters.map((a) => ({
    identity: a.id,
    described: a.describe(),
    invoked: a.invoke({ capability: input.need || "review" }),
    live: false,
  }));
  return {
    status: "EXECUTED",
    discovered,
    routed,
    collective,
    agreement: "UNVERIFIED",
    consensus_is_truth: false,
    closed_list: false,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}
