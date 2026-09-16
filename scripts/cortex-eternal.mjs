#!/usr/bin/env node
/**
 * ACORN CORTEX — eternal adaptive architecture.
 * Implementations change. The contract stays. Not a second Cortex.
 * UNKNOWN ≠ FAILURE. NEW ≠ TRUSTED. BYPASS ≠ SUCCESS. live=false.
 */
import { authorizeCapability } from "../.github/swarm/cortex.mjs";
import { intelligenceAdapter } from "../sdk/open-intelligence.js";
import { considerUnknownChannel } from "../sdk/open-channel.js";
import { describeIntelligence, registerCompatibleIntelligence } from "./intelligence-contract.mjs";
import { createAdapter } from "./cortex-adaptive.mjs";
import { runLanguageCycle } from "./cortex-language.mjs";
import { discoverProtocol, negotiateProtocol } from "./cortex-adaptive.mjs";
import { runContinuityFabric } from "./cortex-continuity.mjs";
import { learnFromExperience } from "./reality-learning-engine.mjs";

export const ETERNAL_VERSION = "cortex-eternal.v1";
export const LIFECYCLE = Object.freeze([
  "CURRENT", "CANDIDATE", "SHADOW", "VERIFIED", "ACTIVE", "DEPRECATED", "RETIRED",
]);
export const BYPASS_KINDS = Object.freeze([
  "CHANNEL_BYPASS", "UNCONTROLLED_CHANNEL", "UNKNOWN_CHANNEL",
]);

function digest(value) {
  const raw = JSON.stringify(value ?? null);
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) h = Math.imul(h ^ raw.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function intelligencePassport(entry = {}) {
  const described = describeIntelligence({
    id: entry.id || entry.identity || "unknown-intelligence",
    provider: entry.provider || "UNKNOWN",
    model: entry.model || null,
    channel: entry.channel || "UNKNOWN",
    capabilities: entry.capabilities || [],
    version: entry.version || "UNKNOWN",
  });
  return {
    status: "EXECUTED",
    passport: {
      intelligence_id: described.identity,
      model: described.model || entry.model || null,
      provider: described.provider,
      channel: described.channel,
      version: entry.version || "UNKNOWN",
      capabilities: described.capabilities,
      limitations: entry.limitations || [],
      authority: false,
      availability: entry.availability || "UNKNOWN",
      cost_class: entry.cost_class || "UNKNOWN",
      latency: entry.latency ?? null,
      verification: "UNVERIFIED",
      provenance: { source: "describeIntelligence", invented: false },
      last_seen: entry.last_seen || null,
      last_verified: entry.last_verified || null,
      expires_at: entry.expires_at || null,
      identity_is_not_model: described.identity_is_not_model,
      identity_is_not_channel: described.identity !== described.channel,
      live: false,
    },
    grants_authority: false,
    live: false,
  };
}

export function discoverFutureIntelligence(entry = {}) {
  const adapter = intelligenceAdapter({
    id: entry.id || "future-intelligence-x",
    provider: entry.provider || "UNKNOWN",
    capabilities: entry.capabilities || [],
  });
  const passport = intelligencePassport({ ...entry, id: adapter.id, provider: adapter.provider, capabilities: adapter.capabilities });
  const registered = registerCompatibleIntelligence({ agents: [] }, {
    id: adapter.id, provider: adapter.provider, capabilities: adapter.capabilities,
  });
  return {
    status: "DISCOVERED",
    passport: passport.passport,
    adapter: adapter.describe(),
    cortex_modified: registered.cortex_modified === true,
    trusted: false,
    live: false,
  };
}

export function componentLifecycle({ id, kind = "adapter", state = "CURRENT" } = {}) {
  const s = LIFECYCLE.includes(state) ? state : "CANDIDATE";
  return {
    status: "DEFINED",
    component_id: id || `cmp_${digest({ kind, state: s })}`,
    kind,
    state: s,
    live: false,
  };
}

export function replaceComponent({ current, candidate, compared = false, verified = false } = {}) {
  if (!current || !candidate) return { status: "INSUFFICIENT_EVIDENCE", activated: false, live: false };
  if (!compared || !verified) {
    return {
      status: "PROPOSED",
      current: { ...current, state: "CURRENT" },
      candidate: { ...candidate, state: "SHADOW" },
      activated: false,
      old_kept: true,
      live: false,
    };
  }
  return {
    status: "EXECUTED",
    current: { ...current, state: "DEPRECATED" },
    candidate: { ...candidate, state: "ACTIVE" },
    activated: true,
    old_kept: true,
    retired: false,
    live: false,
  };
}

export function retireComponent(component = {}) {
  return {
    status: "EXECUTED",
    component: { ...component, state: "RETIRED" },
    history_kept: true,
    identity_of_acorn_dead: false,
    live: false,
  };
}

export function migrate({ from_version, to_version, payload = {}, reversible = true } = {}) {
  if (!from_version || !to_version) return { status: "INSUFFICIENT_EVIDENCE", migrated: false, live: false };
  return {
    status: "EXECUTED",
    migration_id: `mig_${digest({ from_version, to_version })}`,
    from_version,
    to_version,
    payload_digest: digest(payload),
    versioned: true,
    traceable: true,
    testable: true,
    reversible,
    measurable: true,
    destructive: false,
    live: false,
  };
}

export function compatibilityLayer({ versions = ["v0", "v1"] } = {}) {
  const kept = [...new Set(versions)].slice(0, 3);
  return {
    status: "EXECUTED",
    versions: kept,
    translation: kept.length > 1,
    keep_forever: false,
    live: false,
  };
}

export function ingress({ source = "human", channel, connected = false, claimed_acorn = false } = {}) {
  const unknown = !channel || channel === "UNKNOWN";
  const bypass = claimed_acorn === true && connected !== true;
  const kind = bypass ? "CHANNEL_BYPASS" : unknown ? "UNKNOWN_CHANNEL" : null;
  return {
    status: bypass ? "REJECTED" : "EXECUTED",
    source,
    channel: channel || "UNKNOWN",
    connected,
    bypass,
    kind,
    success: false,
    live: false,
  };
}

export function egress({ observation, verified = false } = {}) {
  return {
    status: "EXECUTED",
    observation: observation ?? null,
    untrusted: verified !== true,
    verified,
    presented_as_acorn_truth: false,
    live: false,
  };
}

export function cognitiveFirewall({ output, claim_capability = false, claim_authority = false } = {}) {
  const findings = [];
  if (claim_capability && !output?.evidence) findings.push({ kind: "false_capability_claim" });
  if (claim_authority) findings.push({ kind: "authority_escalation" });
  if (output && output.live === true) findings.push({ kind: "fake_live" });
  return {
    status: "EXECUTED",
    untrusted_observation: true,
    findings,
    quarantined: findings.length > 0,
    live: false,
  };
}

export function staleKnowledge(entry = {}, { now } = {}) {
  const exp = Date.parse(entry.expires_at || "");
  const t = Date.parse(now || new Date().toISOString());
  const stale = Number.isFinite(exp) && Number.isFinite(t) && t > exp;
  return {
    status: "EXECUTED",
    state: stale ? "STALE" : entry.verified_at ? "CURRENT" : "UNKNOWN",
    automatically_false: false,
    live: false,
  };
}

export function dependencyGraph(nodes = []) {
  return {
    status: "EXECUTED",
    nodes: nodes.map((row) => ({
      component: row.id || row.component,
      depends_on: row.depends_on || [],
      capability: row.capability || null,
      failure_domain: row.failure_domain || "UNKNOWN",
      replacement: row.replacement || null,
    })),
    live: false,
  };
}

export function eternalUnknown(input = {}) {
  const language = runLanguageCycle(input.languageInput || { text: "⊸⊸λ", declared: "FUTURE-LANG-X" });
  const protocol = discoverProtocol({
    hello: input.protocolHello || { hello: "FUTURE-PROTOCOL-X" },
    declared: "FUTURE-PROTOCOL-X",
  });
  const negotiated = negotiateProtocol({ local: ["ping"], remote: protocol.capabilities || [] });
  const intel = discoverFutureIntelligence(input.intelligence || { id: "future-intelligence-x" });
  const adapter = createAdapter({ kind: "protocol", discovery: protocol });
  const channel = considerUnknownChannel({ id: "future-x", provider: "UNKNOWN", protocol: "UNKNOWN" });
  return {
    status: "EXECUTED",
    language: {
      state: language.discovery?.state || language.state,
      understood: language.discovery?.understood === true,
    },
    protocol: { state: protocol.state, trusted: protocol.trusted === true },
    intelligence: { trusted: intel.trusted === true, cortex_modified: intel.cortex_modified === true },
    adapter: { status: adapter.status, trusted: false },
    channel,
    unknown_is_success: false,
    unknown_is_failure: false,
    live: false,
  };
}

export function runEternalArchitecture(input = {}) {
  const at = input.at || new Date().toISOString();
  const passport = intelligencePassport(input.intelligence || { id: "future-intelligence-x", capabilities: ["review"] });
  const current = componentLifecycle({ id: "adapter-v0", kind: "adapter", state: "CURRENT" });
  const candidate = componentLifecycle({ id: "adapter-v1", kind: "adapter", state: "CANDIDATE" });
  const replaced = replaceComponent({ current, candidate, compared: false, verified: false });
  const migrated = migrate({ from_version: "cir.v0", to_version: "cir.v0", payload: { at }, reversible: true });
  const compat = compatibilityLayer({ versions: ["cir.v0", "adaptive-cognition.v1", "cortex-meta.v1"] });
  const inb = ingress({ source: "external", channel: input.channel || "UNKNOWN", connected: false, claimed_acorn: input.claimed_acorn === true });
  const out = egress({ observation: input.observation || { text: "untrusted" }, verified: false });
  const wall = cognitiveFirewall({ output: input.observation || { live: false }, claim_authority: false });
  const unknown = eternalUnknown(input);
  const graph = dependencyGraph([
    { id: "primary", depends_on: ["worker"], capability: "review", failure_domain: "local", replacement: "standby-warm" },
  ]);
  const stale = staleKnowledge({ expires_at: "2020-01-01T00:00:00.000Z", verified_at: "2019-01-01T00:00:00.000Z" }, { now: at });
  const continuity = input.skipContinuity ? { live: false, highly_available: false } : runContinuityFabric({
    workerEvidence: input.workerEvidence || {},
    at,
  });
  const learned = learnFromExperience({
    hypothesis: { kind: "eternal", id: "replace-without-death" },
    expected: { acorn_alive: true },
    actual: { acorn_alive: true, component_retired: false },
    context: { engine: "cortex-eternal" },
    observedAt: at,
    model: { version: 1 },
    verification: { verified: false },
  });
  const merge = authorizeCapability({ capabilities: ["merge"], allowed: false, authority: "network" });
  const retired = retireComponent(current);
  return {
    version: ETERNAL_VERSION,
    status: "EXECUTED",
    passport,
    lifecycle: { current, candidate, replaced, retired },
    migrated,
    compat,
    ingress: inb,
    egress: out,
    firewall: wall,
    unknown,
    graph,
    stale,
    continuity,
    learned: { status: learned.status, live: false },
    gates: {
      merge: merge.ok,
      bypass_is_success: inb.success === true,
      unknown_is_success: unknown.unknown_is_success,
      passport_grants_authority: passport.grants_authority,
      second_cortex: false,
      second_fabric: false,
    },
    implementation_may_die: true,
    contract_remains: true,
    zero_cost: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}
