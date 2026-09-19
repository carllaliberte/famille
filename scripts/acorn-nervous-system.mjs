/**
 * ACORN Nervous System
 * Transport, perception, routing, bounded action channels, feedback and recovery.
 * Contract: acorn.nervous-system.v1
 *
 * This organ connects the completed Brain to the environment without becoming
 * a second brain, authority system, or execution runtime.
 */

export const NERVOUS_SYSTEM_CONTRACT = "acorn.nervous-system.v1";

export const SIGNAL_STATES = Object.freeze([
  "RECEIVED","NORMALIZED","ROUTED","QUEUED","DELIVERED",
  "OBSERVED","ACKNOWLEDGED","DROPPED","BLOCKED","EXPIRED","FAILED"
]);

export const CHANNEL_MODES = Object.freeze([
  "PERCEPTION","FEEDBACK","ACTION","OBSERVATION"
]);

const now = () => new Date().toISOString();

export function createSignal(input = {}) {
  const source = input.source ?? "UNKNOWN";
  const type = input.type ?? "UNKNOWN";
  return {
    signal_id: input.signal_id ?? crypto.randomUUID(),
    source,
    type,
    payload: input.payload ?? null,
    occurred_at: input.occurred_at ?? now(),
    received_at: input.received_at ?? now(),
    provenance: input.provenance ?? { source, stated: true },
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    priority: Number.isFinite(input.priority) ? input.priority : 0,
    ttl_ms: Number.isFinite(input.ttl_ms) ? input.ttl_ms : 300000,
    state: "RECEIVED",
    external_effect: false,
    authority: false
  };
}

export function normalizeSignal(signal) {
  if (!signal || typeof signal !== "object") {
    return { ok: false, error: "INVALID_SIGNAL" };
  }
  if (!signal.signal_id || !signal.source || !signal.type) {
    return { ok: false, error: "SIGNAL_IDENTITY_INCOMPLETE" };
  }
  return {
    ok: true,
    signal: {
      ...signal,
      payload: signal.payload ?? null,
      evidence: Array.isArray(signal.evidence) ? signal.evidence : [],
      state: "NORMALIZED"
    }
  };
}

export function createChannel(input = {}) {
  const mode = CHANNEL_MODES.includes(input.mode) ? input.mode : "PERCEPTION";
  return {
    channel_id: input.channel_id ?? crypto.randomUUID(),
    name: input.name ?? "unnamed",
    mode,
    source: input.source ?? "UNKNOWN",
    target: input.target ?? "ACORN_BRAIN",
    capabilities: Array.isArray(input.capabilities) ? input.capabilities : [],
    governed: input.governed === true,
    breaker_required: input.breaker_required !== false,
    live: false,
    authority: false,
    external_effect: false
  };
}

export function routeSignal(signal, channels = [], context = {}) {
  const normalized = normalizeSignal(signal);
  if (!normalized.ok) return { ok: false, error: normalized.error, routes: [] };
  const required = context.capability;
  const candidates = channels.filter(channel =>
    channel.governed === true &&
    channel.mode === (context.mode ?? "PERCEPTION") &&
    (!required || channel.capabilities.includes(required))
  );
  const routes = candidates
    .map(channel => ({
      channel_id: channel.channel_id,
      signal_id: normalized.signal.signal_id,
      state: "ROUTED",
      reason: required ? "CAPABILITY_MATCH" : "GOVERNED_CHANNEL",
      external_effect: false,
      authority: false
    }))
    .sort((a,b) => a.channel_id.localeCompare(b.channel_id));
  return { ok: true, signal: normalized.signal, routes };
}

export function deliverSignal(signal, channel, context = {}) {
  if (!signal || !channel) return { ok:false, state:"FAILED", error:"MISSING_INPUT" };
  if (channel.governed !== true) {
    return { ok:false, state:"BLOCKED", error:"UNGOVERNED_CHANNEL", external_effect:false, authority:false };
  }
  if (channel.breaker_required && context.breaker_authorized !== true && channel.mode === "ACTION") {
    return { ok:false, state:"BLOCKED", error:"BREAKER_AUTHORIZATION_REQUIRED", external_effect:false, authority:false };
  }
  return {
    ok:true,
    state:"DELIVERED",
    signal_id:signal.signal_id,
    channel_id:channel.channel_id,
    external_effect:false,
    authority:false,
    live:false
  };
}

export function createFeedback(signalId, observation, input = {}) {
  return {
    feedback_id: input.feedback_id ?? crypto.randomUUID(),
    signal_id: signalId,
    observation: observation ?? null,
    observed_at: input.observed_at ?? now(),
    measured: input.measured === true,
    verified: input.verified === true,
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    state: "OBSERVED",
    authority: false,
    external_effect: false
  };
}

export function assessSignalHealth(signals = [], channels = []) {
  const received = signals.length;
  const delivered = signals.filter(s => s.state === "DELIVERED" || s.state === "OBSERVED").length;
  const failed = signals.filter(s => ["FAILED","BLOCKED","EXPIRED"].includes(s.state)).length;
  const governedChannels = channels.filter(c => c.governed === true).length;
  return {
    received,
    delivered,
    failed,
    delivery_ratio: received ? delivered / received : 0,
    governed_channels: governedChannels,
    channel_count: channels.length,
    measured: true,
    verified: false,
    live: false
  };
}

export function recoverSignal(signal, reason = "DELIVERY_FAILURE") {
  return {
    signal_id: signal?.signal_id ?? null,
    recovery: "REQUEUE",
    reason,
    state: "QUEUED",
    retryable: true,
    external_effect: false,
    authority: false
  };
}

export function assertNervousSystemConstitution(snapshot = {}) {
  const violations = [];
  if (snapshot.authority === true) violations.push("AUTHORITY_ESCALATION");
  if (snapshot.breaker_bypassed === true) violations.push("BREAKER_BYPASS");
  if (snapshot.auto_authorize === true) violations.push("AUTO_AUTHORIZATION");
  if (snapshot.auto_execute === true) violations.push("AUTO_EXECUTION");
  if (snapshot.hidden_learning === true) violations.push("HIDDEN_LEARNING");
  if (snapshot.ungoverned_channel === true) violations.push("UNGOVERNED_CHANNEL");
  if (snapshot.external_effect_without_governance === true) violations.push("UNGOVERNED_EXTERNAL_EFFECT");
  return {
    contract: NERVOUS_SYSTEM_CONTRACT,
    valid: violations.length === 0,
    violations,
    capability_authority_separation: true,
    human_authorization_required_for_consequential_action: true,
    live: false
  };
}

export function buildNervousSystemSnapshot(input = {}) {
  const signals = Array.isArray(input.signals) ? input.signals : [];
  const channels = Array.isArray(input.channels) ? input.channels : [];
  return {
    contract: NERVOUS_SYSTEM_CONTRACT,
    cycle: [
      "RECEIVE","NORMALIZE","PROVENANCE","ROUTE","DELIVER",
      "OBSERVE","FEEDBACK","MEASURE","RECOVER","REUSE"
    ],
    signal_count: signals.length,
    channel_count: channels.length,
    health: assessSignalHealth(signals, channels),
    constitution: assertNervousSystemConstitution(input),
    authority: false,
    external_effect: false,
    live: false
  };
}
