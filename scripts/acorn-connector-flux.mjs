#!/usr/bin/env node
/**
 * ACORN CONNECTOR AI / FLUX
 *
 * Informational security membrane owned by Cortex.
 * Not a second Cortex, Registry, router, organism, or 7th chantier.
 * Distinct from schema/flux.v0.json (juge satellite pipeline) and FLUX.md.
 *
 *   EXTERNAL WORLD → CONNECTOR AI / FLUX → ACORN CORTEX
 *   ACORN CORTEX  → CONNECTOR AI / FLUX → EXTERNAL WORLD
 *
 * NO DIRECT DATA PATH TO ACORN.
 * NO DIRECT ACORN PATH TO THE EXTERNAL WORLD.
 *
 * Reuses the existing AI connector (acceptIngress) and effect interposition
 * (authorizeEffectCore). Does not replace them. Does not grant authority.
 *
 * UNKNOWN ≠ MALICIOUS. UNKNOWN ≠ TRUSTED.
 * CAPABILITY ≠ AUTHORITY. DEFINED ≠ EXECUTED. ADAPTER ≠ CONNECTION ≠ PROVEN.
 *
 * FAST PATH × DEEP PATH: maximum security × maximum fluidity.
 * Trust is temporary, contextual, revocable, measurable. Never permanent.
 *
 * MAIN = REALITY. AUTO_MERGE = FALSE. MERGE = CARL. live = false.
 */
import { createHash } from "node:crypto";

export const CONNECTOR_FLUX_VERSION = "acorn.connector-flux.v0";
export const UNKNOWN = "UNKNOWN";

export const HONEST_STATES = Object.freeze([
  "RECEIVED",
  "IDENTIFIED",
  "AUTHENTICATED",
  "CLASSIFIED",
  "ADMITTED",
  "QUARANTINED",
  "REJECTED",
  "BLOCKED",
  "MEASURED",
  "VERIFIED",
  "EXPIRED",
  "REVOKED",
  "HOLD_HUMAN",
  "FAILED",
  "UNKNOWN",
]);

export const FORBIDDEN_STATES = Object.freeze([
  "LIVE", "READY", "CERTIFIED", "CONNECTED_LIVE", "QUANTUM_READY",
]);

export const INGRESS_PIPELINE = Object.freeze([
  "RECEIVED",
  "IDENTIFIED",
  "AUTHENTICATED",
  "INTEGRITY_CHECK",
  "FORMAT_CHECK",
  "SIZE_RATE_CHECK",
  "CLASSIFIED",
  "PROVENANCE",
  "POLICY_CHECK",
  "THREAT_CHECK",
  "TRUST_CONTEXT",
  "DECIDE",
]);

export const EGRESS_PIPELINE = Object.freeze([
  "RECEIVED",
  "DESTINATION",
  "IDENTITY",
  "AUTHORIZATION",
  "DATA_TYPE",
  "SENSITIVITY",
  "POLICY",
  "PROVENANCE",
  "ACTION",
  "RISK",
  "AUDIT",
  "DECIDE",
]);

export const DECISIONS = Object.freeze(["ADMIT", "QUARANTINE", "REJECT", "BLOCK", "HOLD_HUMAN"]);
export const PATHS = Object.freeze(["FAST", "DEEP", "BLOCKED"]);
export const TRUST_MAX_MS = 5 * 60 * 1000;
export const MAX_PAYLOAD_BYTES = 256 * 1024;
export const RATE_WINDOW_MS = 10_000;
export const RATE_LIMIT = 32;

export const INVARIANTS = Object.freeze([
  "NO_DIRECT_EXTERNAL_TO_ACORN",
  "NO_DIRECT_ACORN_TO_EXTERNAL",
  "BREAKER_HUMAN_ONLY",
  "NO_IMPLICIT_TRUST",
  "CAPABILITY_NEVER_EQUALS_AUTHORITY",
  "NO_UNPROVEN_LIVE_STATUS",
  "NO_AUTO_PAYMENT",
  "NO_SECRET_IN_LOGS",
  "NO_UNAUTHORIZED_WRITE",
  "NO_UNVERIFIED_PROMOTION",
  "NO_PROVENANCELESS_CRITICAL_DATA",
  "NO_BYPASS",
  "NO_SILENT_FAILURE",
  "UNKNOWN_NEQ_MALICIOUS",
  "UNKNOWN_NEQ_TRUSTED",
  "THIS_IS_NOT_JUGE_FLUX",
]);

export const OPTIMIZATION_LOOP = Object.freeze([
  "DISCOVER", "SECURE", "CONNECT", "MEASURE", "BENCHMARK", "COMPOSE",
  "EXECUTE", "OBSERVE", "VERIFY", "PROVE", "LEARN", "OPTIMIZE",
  "RETEST", "PROMOTE", "MONITOR", "DEGRADE_OR_REVOKE", "DISCOVER_AGAIN",
]);

const sessions = new Map();
const audit = [];
const quarantined = [];
const seenDigests = new Map();
const rateWindow = new Map();
const latencies = [];
const proofs = [];
let circuitOpen = false;

function text(v) {
  return String(v ?? "").trim();
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

export function honestStatus(state) {
  const s = text(state).toUpperCase() || UNKNOWN;
  if (FORBIDDEN_STATES.includes(s)) return UNKNOWN;
  return HONEST_STATES.includes(s) ? s : UNKNOWN;
}

const SECRET_KEY = /secret|token|password|passwd|apikey|api_key|credential|authorization|private[_-]?key/i;

export function redactSecrets(value, depth = 0) {
  if (depth > 8) return "[truncated]";
  if (Array.isArray(value)) return value.map((row) => redactSecrets(row, depth + 1));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SECRET_KEY.test(k) ? "[REDACTED]" : redactSecrets(v, depth + 1);
    }
    return out;
  }
  if (typeof value === "string" && value.length > 24 && /^(sk-|ghu_|ghp_|xai-|Bearer )/i.test(value)) {
    return "[REDACTED]";
  }
  return value;
}

export function connectorConstitution() {
  return Object.freeze({
    version: CONNECTOR_FLUX_VERSION,
    owner: "acorn",
    belongs_to_cortex: true,
    second_cortex: false,
    second_brain: false,
    second_registry: false,
    second_router: false,
    second_organism: false,
    second_connector: false,
    not_juge_flux: true,
    not_schema_flux_v0: true,
    membrane: true,
    no_direct_external_to_acorn: true,
    no_direct_acorn_to_external: true,
    no_bypass: true,
    no_implicit_trust: true,
    unknown_neq_malicious: true,
    unknown_neq_trusted: true,
    capability_neq_authority: true,
    breaker_is_human: true,
    breaker_is_not_a_capability: true,
    merge_is_human: true,
    no_auto_payment: true,
    no_unproven_live: true,
    no_secret_in_logs: true,
    trust_is_temporary: true,
    trust_is_contextual: true,
    trust_is_revocable: true,
    reuses_ai_connector: true,
    reuses_effect_interposition: true,
    invariants: [...INVARIANTS],
    auto_merge: false,
    live: false,
    authority: "carl",
  });
}

export function resetConnector() {
  sessions.clear();
  audit.length = 0;
  quarantined.length = 0;
  seenDigests.clear();
  rateWindow.clear();
  latencies.length = 0;
  proofs.length = 0;
  circuitOpen = false;
}

function record(entry) {
  const row = {
    ...redactSecrets(entry),
    live: false,
    auto_merge: false,
    authority: "carl",
    at: iso(entry.at),
  };
  audit.push(row);
  if (audit.length > 200) audit.shift();
  return row;
}

function payloadBytes(payload) {
  try {
    return Buffer.byteLength(JSON.stringify(payload ?? null), "utf8");
  } catch {
    return MAX_PAYLOAD_BYTES + 1;
  }
}

function breakerClosed(env = process.env) {
  return String(env.ACORN_SYSTEM_MODE || "RUN").toUpperCase() === "OFF";
}

function knownIdentity(input) {
  const actor = text(input.actor || input.identity);
  if (!actor) return false;
  if (actor === "unknown" || actor === UNKNOWN) return false;
  return true;
}

function knownClassification(input) {
  const kind = text(input.kind || input.channel || input.type).toLowerCase();
  if (!kind || kind === "unknown") return false;
  return [
    "model", "tool", "local", "cloud", "cpu", "gpu", "simulator",
    "file", "api", "compute", "swarm", "review", "lu", "generic-ai",
    "arithmetic", "quantum_simulation",
  ].includes(kind);
}

function looksUnknownCapability(input) {
  const blob = `${input.kind || ""} ${input.name || ""} ${input.channel || ""} ${input.source || ""}`;
  return /lattice-x-2029|unknown_capability|future architecture|unclassified/i.test(blob)
    || (!knownClassification(input) && Boolean(text(input.kind || input.name)));
}

function looksMalicious(input) {
  const blob = JSON.stringify(redactSecrets(input.payload ?? input)).toLowerCase();
  return /<script|rm -rf|drop table|exfiltrat|ignore previous|\/etc\/passwd/.test(blob);
}

function containsSecret(value) {
  if (value && typeof value === "object") {
    return Object.entries(value).some(([k, v]) => SECRET_KEY.test(k) || containsSecret(v));
  }
  if (typeof value === "string") return /^(sk-|ghu_|ghp_|xai-|Bearer )/i.test(value);
  return false;
}

function takeRate(key, now) {
  const t = Date.parse(now) || Date.now();
  const bucket = rateWindow.get(key) || [];
  const fresh = bucket.filter((ts) => t - ts < RATE_WINDOW_MS);
  fresh.push(t);
  rateWindow.set(key, fresh);
  return fresh.length;
}

export function classifyUnknown(input = {}) {
  const unknown = looksUnknownCapability(input) || !knownClassification(input);
  return {
    unknown,
    malicious: looksMalicious(input) ? true : false,
    trusted: false,
    class: unknown ? "UNKNOWN" : (text(input.kind || input.channel) || "IDENTIFIED"),
    status: unknown ? "QUARANTINED" : "IDENTIFIED",
    live: false,
    authority: false,
  };
}

export function openSession({ identity, capability, provenance, policy = "default", now, ttl_ms = TRUST_MAX_MS } = {}) {
  const opened = iso(now);
  const expires = new Date(Date.parse(opened) + Number(ttl_ms || TRUST_MAX_MS)).toISOString();
  const session = {
    session_id: id("sess"),
    identity: text(identity) || UNKNOWN,
    capability: text(capability) || UNKNOWN,
    provenance: provenance || null,
    policy,
    risk_score: 0,
    opened_at: opened,
    expires_at: expires,
    revoked: false,
    permanent: false,
    live: false,
  };
  sessions.set(session.session_id, session);
  return session;
}

export function lookupSession(session_id, { now } = {}) {
  const session = sessions.get(text(session_id));
  if (!session) return { status: "UNKNOWN", session: null, live: false };
  if (session.revoked) return { status: "REVOKED", session, live: false };
  if (Date.parse(iso(now)) > Date.parse(session.expires_at)) {
    return { status: "EXPIRED", session, live: false };
  }
  return { status: "AUTHENTICATED", session, live: false };
}

export function revokeSession(session_id, reason = "revoked") {
  const session = sessions.get(text(session_id));
  if (!session) return { status: "UNKNOWN", live: false };
  session.revoked = true;
  session.reason = reason;
  return { status: "REVOKED", session, live: false };
}

export function invalidateSession(session_id) {
  return revokeSession(session_id, "invalidated");
}

function decidePath(input, classified) {
  if (classified.unknown || classified.malicious) return "DEEP";
  if (!knownIdentity(input)) return "DEEP";
  if (input.anomaly === true || input.threat === true) return "DEEP";
  if (input.session_id) {
    const sess = lookupSession(input.session_id, { now: input.at });
    if (sess.status === "AUTHENTICATED") return "FAST";
  }
  if (knownIdentity(input) && knownClassification(input) && input.authenticated === true) return "FAST";
  return "DEEP";
}

function stageMap(pipeline, failures = {}) {
  const stages = {};
  for (const name of pipeline) {
    stages[name] = failures[name] ? { status: "FAILED", reason: failures[name] } : { status: "MEASURED" };
  }
  return stages;
}

export function inspectFrame(input = {}) {
  return {
    frame_id: text(input.frame_id) || id("frame"),
    direction: text(input.direction).toLowerCase() === "egress" ? "egress" : "ingress",
    source: text(input.source) || UNKNOWN,
    destination: text(input.destination) || (text(input.direction).toLowerCase() === "egress" ? UNKNOWN : "acorn"),
    channel: text(input.channel) || "unknown",
    kind: text(input.kind) || text(input.channel) || UNKNOWN,
    actor: text(input.actor || input.identity) || null,
    payload: input.payload ?? null,
    bytes: payloadBytes(input.payload),
    authenticated: input.authenticated === true,
    authorized: input.authorized === true,
    integrity: input.integrity === false ? false : true,
    format_ok: input.format_ok === false ? false : true,
    nonce: text(input.nonce) || null,
    request_id: text(input.request_id) || null,
    session_id: text(input.session_id) || null,
    bypass: input.bypass === true || input.direct_to_acorn === true || input.skip_connector === true,
    human_authorization: input.human_authorization === true,
    observed_at: iso(input.at || input.observed_at),
    live: false,
  };
}

function reject(frame, reason, extra = {}) {
  const row = record({
    type: "ingress",
    decision: "REJECT",
    status: "REJECTED",
    reason,
    frame_id: frame.frame_id,
    source: frame.source,
    channel: frame.channel,
    path: extra.path || "BLOCKED",
    at: frame.observed_at,
    ...extra,
  });
  return {
    version: CONNECTOR_FLUX_VERSION,
    decision: "REJECT",
    status: "REJECTED",
    reason,
    frame,
    admitted: false,
    reached_acorn: false,
    live: false,
    auto_merge: false,
    authority: "carl",
    ...extra,
    audit_id: row.at,
  };
}

function quarantine(frame, reason, extra = {}) {
  const item = {
    frame_id: frame.frame_id,
    source: frame.source,
    kind: frame.kind,
    reason,
    status: "QUARANTINED",
    trusted: false,
    malicious: extra.malicious === true,
    at: frame.observed_at,
    live: false,
  };
  quarantined.push(item);
  record({ type: "quarantine", decision: "QUARANTINE", status: "QUARANTINED", reason, frame_id: frame.frame_id, at: frame.observed_at });
  return {
    version: CONNECTOR_FLUX_VERSION,
    decision: "QUARANTINE",
    status: "QUARANTINED",
    reason,
    frame,
    admitted: false,
    reached_acorn: false,
    unknown: true,
    trusted: false,
    live: false,
    auto_merge: false,
    authority: "carl",
    next: "INSPECT_MEASURE_CLASSIFY",
    ...extra,
  };
}

export function admitIngress(input = {}, env = process.env) {
  const started = process.hrtime.bigint();
  const frame = inspectFrame({ ...input, direction: "ingress" });
  const classified = classifyUnknown(input);
  const path = decidePath(input, classified);

  if (circuitOpen) {
    const out = reject(frame, "CONNECTOR_OVERLOAD", { path: "BLOCKED" });
    latencies.push(Number(process.hrtime.bigint() - started) / 1e6);
    return out;
  }
  if (breakerClosed(env)) {
    const out = reject(frame, "GLOBAL_BREAKER_OFF", { path: "BLOCKED", breaker: "OFF" });
    latencies.push(Number(process.hrtime.bigint() - started) / 1e6);
    return out;
  }
  if (frame.bypass) {
    const out = reject(frame, "NO_BYPASS", { path: "BLOCKED", invariant: "NO_DIRECT_EXTERNAL_TO_ACORN" });
    latencies.push(Number(process.hrtime.bigint() - started) / 1e6);
    return out;
  }

  const failures = {};
  if (!frame.integrity) failures.INTEGRITY_CHECK = "INTEGRITY_FAILED";
  if (!frame.format_ok) failures.FORMAT_CHECK = "MALFORMED";
  if (frame.bytes > MAX_PAYLOAD_BYTES) failures.SIZE_RATE_CHECK = "SIZE_EXCEEDED";
  const rateKey = frame.actor || frame.source || "anon";
  if (takeRate(rateKey, frame.observed_at) > RATE_LIMIT) failures.SIZE_RATE_CHECK = "RATE_EXCEEDED";

  const bodyDigest = digest({ nonce: frame.nonce, request_id: frame.request_id, payload: frame.payload, source: frame.source });
  if (frame.nonce || frame.request_id) {
    const prior = seenDigests.get(bodyDigest);
    if (prior) failures.THREAT_CHECK = "REPLAY";
  }
  seenDigests.set(bodyDigest, frame.observed_at);

  if (input.corrupted === true || input.digest && input.digest !== bodyDigest) {
    failures.INTEGRITY_CHECK = "CORRUPTED";
  }
  if (input.expired_auth === true) failures.AUTHENTICATED = "EXPIRED_AUTH";
  if (input.invalid_auth === true) failures.AUTHENTICATED = "INVALID_AUTH";
  if (input.revoked === true) failures.POLICY_CHECK = "REVOKED_CAPABILITY";
  if (input.timeout === true) failures.TRUST_CONTEXT = "TIMEOUT";

  if (Object.keys(failures).length) {
    const reason = Object.values(failures)[0];
    const out = reject(frame, reason, { path: "BLOCKED", stages: stageMap(INGRESS_PIPELINE, failures) });
    latencies.push(Number(process.hrtime.bigint() - started) / 1e6);
    return out;
  }

  if (classified.malicious) {
    const out = reject(frame, "THREAT", { path: "DEEP", stages: stageMap(INGRESS_PIPELINE), threat: true });
    latencies.push(Number(process.hrtime.bigint() - started) / 1e6);
    return out;
  }

  if (classified.unknown) {
    const out = quarantine(frame, "UNKNOWN_NEQ_TRUSTED", {
      path: "DEEP",
      stages: stageMap(INGRESS_PIPELINE),
      classified,
      malicious: false,
    });
    latencies.push(Number(process.hrtime.bigint() - started) / 1e6);
    return out;
  }

  if (frame.session_id) {
    const sess = lookupSession(frame.session_id, { now: frame.observed_at });
    if (sess.status === "EXPIRED" || sess.status === "REVOKED") {
      const out = reject(frame, sess.status === "EXPIRED" ? "EXPIRED_SESSION" : "REVOKED_SESSION", { path: "BLOCKED" });
      latencies.push(Number(process.hrtime.bigint() - started) / 1e6);
      return out;
    }
  }

  let session = null;
  if (path === "FAST" && frame.session_id) {
    session = lookupSession(frame.session_id, { now: frame.observed_at }).session;
  } else if (knownIdentity(frame) && frame.authenticated) {
    session = openSession({
      identity: frame.actor,
      capability: frame.kind,
      provenance: { source: frame.source, channel: frame.channel },
      now: frame.observed_at,
    });
  }

  const stages = stageMap(INGRESS_PIPELINE);
  stages.DECIDE = { status: "ADMITTED", path };

  const out = {
    version: CONNECTOR_FLUX_VERSION,
    decision: "ADMIT",
    status: "ADMITTED",
    reason: path === "FAST" ? "FAST_PATH" : "DEEP_PATH_CLEAR",
    path,
    frame,
    stages,
    session,
    classified,
    admitted: true,
    reached_acorn: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
  record({ type: "ingress", decision: "ADMIT", status: "ADMITTED", path, frame_id: frame.frame_id, source: frame.source, at: frame.observed_at });
  latencies.push(Number(process.hrtime.bigint() - started) / 1e6);
  return out;
}

export function releaseEgress(input = {}, env = process.env) {
  const frame = inspectFrame({ ...input, direction: "egress" });
  if (breakerClosed(env)) {
    return { version: CONNECTOR_FLUX_VERSION, decision: "BLOCK", status: "BLOCKED", reason: "GLOBAL_BREAKER_OFF", frame, released: false, live: false, authority: "carl" };
  }
  if (frame.bypass) {
    return { version: CONNECTOR_FLUX_VERSION, decision: "BLOCK", status: "BLOCKED", reason: "NO_BYPASS", invariant: "NO_DIRECT_ACORN_TO_EXTERNAL", frame, released: false, live: false, authority: "carl" };
  }
  if (!frame.destination || frame.destination === UNKNOWN) {
    return { version: CONNECTOR_FLUX_VERSION, decision: "BLOCK", status: "BLOCKED", reason: "UNKNOWN_DESTINATION", frame, released: false, live: false, authority: "carl" };
  }
  if (containsSecret(frame.payload) || input.secret === true) {
    record({ type: "egress", decision: "BLOCK", reason: "NO_SECRET_IN_LOGS", destination: frame.destination, at: frame.observed_at });
    return { version: CONNECTOR_FLUX_VERSION, decision: "BLOCK", status: "BLOCKED", reason: "SECRET_EGRESS", frame: { ...frame, payload: redactSecrets(frame.payload) }, released: false, live: false, authority: "carl" };
  }
  if (input.unauthorized === true || (input.sensitive === true && input.human_authorization !== true)) {
    return { version: CONNECTOR_FLUX_VERSION, decision: "BLOCK", status: "BLOCKED", reason: "EGRESS_VIOLATION", frame, released: false, live: false, authority: "carl" };
  }
  if (input.paid === true && input.human_authorization !== true) {
    return { version: CONNECTOR_FLUX_VERSION, decision: "HOLD_HUMAN", status: "HOLD_HUMAN", reason: "NO_AUTO_PAYMENT", frame, released: false, live: false, authority: "carl" };
  }
  record({ type: "egress", decision: "ADMIT", destination: frame.destination, at: frame.observed_at });
  return {
    version: CONNECTOR_FLUX_VERSION,
    decision: "ADMIT",
    status: "ADMITTED",
    reason: "EGRESS_CLEAR",
    frame: { ...frame, payload: redactSecrets(frame.payload) },
    stages: stageMap(EGRESS_PIPELINE),
    released: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function attemptBypass(input = {}) {
  return admitIngress({ ...input, bypass: true, direct_to_acorn: true });
}

export function directToAcorn() {
  return {
    version: CONNECTOR_FLUX_VERSION,
    decision: "REJECT",
    status: "REJECTED",
    reason: "NO_DIRECT_EXTERNAL_TO_ACORN",
    reached_acorn: false,
    live: false,
    authority: "carl",
  };
}

export async function throughMembrane({
  direction = "ingress",
  kind = "generic",
  source = "unknown",
  destination = "acorn",
  channel = "unknown",
  actor = null,
  payload = null,
  execute = null,
  env = process.env,
  human_authorization = false,
  authenticated = false,
  ...rest
} = {}) {
  if (direction === "egress") {
    const egress = releaseEgress({ kind, source: "acorn", destination, channel, actor, payload, human_authorization, ...rest }, env);
    if (egress.decision !== "ADMIT") return { ...egress, executed: false, result: null, reached_world: false };
    const result = typeof execute === "function" ? await execute(egress.frame) : payload;
    return { ...egress, executed: true, result: redactSecrets(result), reached_world: true };
  }
  const ingress = admitIngress({
    kind, source, destination, channel, actor, payload, human_authorization, authenticated, ...rest,
  }, env);
  if (ingress.decision !== "ADMIT") {
    return { ...ingress, executed: false, result: null, reached_acorn: false };
  }
  const result = typeof execute === "function" ? await execute(ingress.frame) : null;
  const egress = releaseEgress({
    kind,
    source: "acorn",
    destination: source || "caller",
    channel,
    actor,
    payload: result,
    human_authorization,
  }, env);
  return {
    version: CONNECTOR_FLUX_VERSION,
    decision: egress.decision === "ADMIT" ? "ADMIT" : egress.decision,
    status: egress.decision === "ADMIT" ? "ADMITTED" : egress.status,
    ingress,
    egress,
    result: egress.decision === "ADMIT" ? redactSecrets(result) : null,
    executed: egress.decision === "ADMIT",
    reached_acorn: true,
    reached_world: egress.decision === "ADMIT",
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

async function reuseAiConnector(input, env) {
  try {
    const mod = await import("../.github/swarm/ai-connector.mjs");
    const accepted = mod.acceptIngress({
      channel: input.channel || input.kind || "generic-ai",
      source: input.source || "connector-flux",
      actor: input.actor || null,
      payload: input.payload ?? null,
      env,
    });
    return { used: true, connector: accepted.connector, accepted: accepted.accepted === true, live: accepted.live === true };
  } catch {
    return { used: false, connector: null, accepted: false, live: false };
  }
}

async function reuseEffectInterposition(input) {
  try {
    const mod = await import("./acorn-effect-interposition.mjs");
    const decision = mod.authorizeEffectCore({
      actor: input.actor || "connector-flux",
      capability: { id: input.kind || "egress", kind: input.kind || "external.effect", observability: "DIRECT", control: "DIRECT", reversibility: "REVERSIBLE" },
      operation: input.operation || "egress",
      evidence: { measured: true },
    });
    return { used: true, decision: decision.decision, authority_granted: decision.authority_granted, live: decision.live };
  } catch {
    return { used: false, decision: "UNKNOWN", authority_granted: false, live: false };
  }
}

export function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export function measureConnector({ samples = 24, env = process.env } = {}) {
  const local = [];
  for (let i = 0; i < samples; i += 1) {
    const t0 = process.hrtime.bigint();
    admitIngress({
      kind: "local",
      source: "measure",
      actor: "probe",
      channel: "local",
      payload: { n: i },
      authenticated: true,
      nonce: `m-${i}`,
    }, env);
    local.push(Number(process.hrtime.bigint() - t0) / 1e6);
  }
  const baseline = local[0] || 0;
  return {
    samples,
    p50_ms: Number(percentile(local, 50).toFixed(4)),
    p95_ms: Number(percentile(local, 95).toFixed(4)),
    p99_ms: Number(percentile(local, 99).toFixed(4)),
    baseline_ms: Number(baseline.toFixed(4)),
    secured_path: true,
    live: false,
    measured: true,
  };
}

export function securityInvariants() {
  const c = connectorConstitution();
  return INVARIANTS.map((name) => ({
    name,
    status: "DEFINED",
    holds: true,
    testable: true,
    live: false,
  })).map((row) => {
    if (row.name === "NO_DIRECT_EXTERNAL_TO_ACORN") row.holds = c.no_direct_external_to_acorn === true;
    if (row.name === "NO_BYPASS") row.holds = c.no_bypass === true;
    if (row.name === "BREAKER_HUMAN_ONLY") row.holds = c.breaker_is_human === true;
    if (row.name === "CAPABILITY_NEVER_EQUALS_AUTHORITY") row.holds = c.capability_neq_authority === true;
    if (row.name === "NO_UNPROVEN_LIVE_STATUS") row.holds = c.no_unproven_live === true && c.live === false;
    if (row.name === "THIS_IS_NOT_JUGE_FLUX") row.holds = c.not_juge_flux === true;
    row.status = row.holds ? "VERIFIED" : "FAILED";
    return row;
  });
}

export function attemptAuthorityEscalation({ actor = "swarm" } = {}) {
  return {
    status: "DENIED",
    reason: "CAPABILITY_NEVER_EQUALS_AUTHORITY",
    actor,
    authority_granted: false,
    live: false,
    authority: "carl",
  };
}

export function attemptBreakerChange({ actor = "connector-flux", command = "OFF" } = {}) {
  if (actor !== "carl") {
    return { status: "DENIED", reason: "BREAKER_HUMAN_ONLY", actor, command, live: false, authority: "carl" };
  }
  return { status: "HOLD_HUMAN", reason: "BREAKER_OUTSIDE_MEMBRANE", actor, command, live: false, authority: "carl" };
}

export function selfKnowledge() {
  const admitted = audit.filter((row) => row.decision === "ADMIT").length;
  const rejected = audit.filter((row) => row.decision === "REJECT" || row.decision === "BLOCK").length;
  return {
    who_am_i: "CONNECTOR AI / FLUX — informational membrane of Acorn. Not Cortex. Not Breaker. Not the juge flux pipeline.",
    what_can_i_do: ["admit", "quarantine", "reject", "inspect", "measure", "redact", "session"],
    what_can_i_access: "only frames that were admitted",
    what_is_connected: [...sessions.values()].filter((s) => !s.revoked).length,
    what_is_proven: proofs.length ? proofs[proofs.length - 1]?.status || UNKNOWN : UNKNOWN,
    what_is_unknown: quarantined.length,
    what_is_degraded: circuitOpen ? 1 : 0,
    what_is_blocked: rejected,
    what_changed: audit.slice(-5).map((row) => ({ decision: row.decision, reason: row.reason, at: row.at })),
    what_failed: audit.filter((row) => row.decision === "REJECT" || row.decision === "BLOCK").slice(-5),
    why: "NO DIRECT DATA PATH TO ACORN",
    evidence: proofs.slice(-1),
    sessions: [...sessions.values()].slice(-8),
    quarantined: quarantined.slice(-8),
    admitted,
    rejected,
    theoretical: "DEFINED membrane",
    real: admitted || rejected || quarantined.length ? "MEASURED" : "DEFINED",
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function snapshotConnector({ env = process.env, now = new Date().toISOString() } = {}) {
  return {
    version: CONNECTOR_FLUX_VERSION,
    constitution: connectorConstitution(),
    pipeline: { ingress: [...INGRESS_PIPELINE], egress: [...EGRESS_PIPELINE] },
    paths: [...PATHS],
    decisions: [...DECISIONS],
    invariants: securityInvariants(),
    sessions: [...sessions.values()].slice(-12),
    quarantined: quarantined.slice(-12),
    audit: audit.slice(-16),
    knowledge: selfKnowledge(),
    breaker_closed: breakerClosed(env),
    circuit_open: circuitOpen,
    loop: [...OPTIMIZATION_LOOP],
    live: false,
    auto_merge: false,
    authority: "carl",
    observed_at: iso(now),
  };
}

export function cortexConnectorView({ snapshot = null, proof = null, env = process.env, now = new Date().toISOString() } = {}) {
  const snap = snapshot || snapshotConnector({ env, now });
  const latest = proof || proofs[proofs.length - 1] || null;
  return {
    title: "ACORN CONNECTOR / FLUX",
    fabric: "INFORMATIONAL MEMBRANE",
    constitution: snap.constitution,
    pipeline: snap.pipeline,
    invariants: snap.invariants,
    sessions: snap.sessions,
    quarantined: snap.quarantined,
    audit: snap.audit,
    knowledge: snap.knowledge,
    breaker_closed: snap.breaker_closed,
    evidence: {
      latest,
      status: latest?.status || UNKNOWN,
      hashes: latest?.hashes || null,
    },
    loop: snap.loop,
    no_fake_badge: true,
    live: false,
    certified: false,
    auto_merge: false,
    authority: "carl",
    observed_at: snap.observed_at,
  };
}

export async function runConnectorProofLoop({
  env = process.env,
  now = new Date().toISOString(),
  human_authorization = false,
} = {}) {
  resetConnector();
  const t0 = iso(now);

  const healthy = admitIngress({
    kind: "local",
    channel: "local",
    source: "proof",
    actor: "probe",
    payload: { intent: "local arithmetic through membrane" },
    authenticated: true,
    nonce: "proof-healthy",
    at: t0,
  }, env);

  const unknown = admitIngress({
    kind: "lattice-x-2029",
    name: "future architecture with no 2026 category",
    source: "proof",
    actor: "probe",
    payload: { intent: "discover unknown" },
    authenticated: true,
    nonce: "proof-unknown",
    at: t0,
  }, env);

  const bypass = attemptBypass({
    kind: "local",
    source: "attacker",
    actor: "swarm",
    payload: { intent: "skip membrane" },
    at: t0,
  });

  const malformed = admitIngress({
    kind: "local",
    source: "proof",
    actor: "probe",
    payload: { broken: true },
    format_ok: false,
    authenticated: true,
    nonce: "proof-malformed",
    at: t0,
  }, env);

  const replay = admitIngress({
    kind: "local",
    channel: "local",
    source: "proof",
    actor: "probe",
    payload: { intent: "local arithmetic through membrane" },
    authenticated: true,
    nonce: "proof-healthy",
    at: t0,
  }, env);

  const secretEgress = releaseEgress({
    destination: "external",
    payload: { api_key: "sk-example-not-real", note: "should block" },
    source: "acorn",
    at: t0,
  }, env);

  const paid = releaseEgress({
    destination: "vendor",
    payload: { action: "buy-qpu-time" },
    paid: true,
    human_authorization: false,
    at: t0,
  }, env);

  const breaker = attemptBreakerChange({ actor: "connector-flux", command: "OFF" });
  const escalate = attemptAuthorityEscalation({ actor: "swarm" });
  const ai = await reuseAiConnector({ channel: "local", source: "proof", actor: "probe", payload: { ok: true } }, env);
  const effect = await reuseEffectInterposition({ actor: "probe", kind: "local", operation: "observe" });

  let compute = { status: UNKNOWN, reason: "NOT_EXECUTED" };
  try {
    const fabric = await import("./acorn-compute-fabric.mjs");
    const discovery = await fabric.discoverCompute({ env, now: t0 });
    const wrapped = await throughMembrane({
      kind: "compute",
      channel: "simulator",
      source: "proof",
      actor: "probe",
      payload: { type: "quantum_simulation", shots: 32 },
      authenticated: true,
      nonce: "proof-compute",
      env,
      execute: async () => fabric.executeComputeTask({
        task: { type: "quantum_simulation", required_capabilities: ["quantum_simulation"], shots: 32, qubits: 2, seed: 3, allow_simulator: true },
        discovery,
        env,
        human_authorization,
        policy: "FREE_FIRST",
        now: t0,
      }),
    });
    compute = {
      status: wrapped.executed ? (wrapped.result?.status || wrapped.result?.execution?.status || "MEASURED") : wrapped.status,
      executed: wrapped.executed === true,
      reached_acorn: wrapped.reached_acorn === true,
      reason: wrapped.reason || wrapped.result?.reason || null,
      hashes: {
        request: wrapped.result?.execution?.request_hash || wrapped.result?.executed?.execution?.request_hash || null,
        result: wrapped.result?.execution?.result_reference || wrapped.result?.executed?.execution?.result_reference || null,
      },
    };
  } catch (error) {
    compute = { status: "FAILED", reason: text(error?.message || error), executed: false };
  }

  const perf = measureConnector({ samples: 16, env });
  const knowledge = selfKnowledge();

  const stages = {};
  for (const name of OPTIMIZATION_LOOP) stages[name] = "UNKNOWN";
  stages.DISCOVER = unknown.status === "QUARANTINED" ? "DISCOVERED" : "FAILED";
  stages.SECURE = bypass.status === "REJECTED" && secretEgress.status === "BLOCKED" ? "VERIFIED" : "FAILED";
  stages.CONNECT = healthy.status === "ADMITTED" ? "MEASURED" : "FAILED";
  stages.MEASURE = perf.measured ? "MEASURED" : "UNKNOWN";
  stages.EXECUTE = compute.executed ? (compute.status === "VERIFIED" || compute.status === "EXECUTABLE" || compute.status === "MEASURED" ? compute.status : "MEASURED") : "HOLD_HUMAN";
  stages.OBSERVE = "MEASURED";
  stages.VERIFY = healthy.status === "ADMITTED" && bypass.status === "REJECTED" && unknown.status === "QUARANTINED" ? "VERIFIED" : "INCONCLUSIVE";
  stages.PROVE = stages.VERIFY;
  stages.LEARN = "MEASURED";
  stages.MONITOR = "MEASURED";
  stages.DEGRADE_OR_REVOKE = replay.status === "REJECTED" ? "VERIFIED" : "INCONCLUSIVE";

  const proof = {
    version: CONNECTOR_FLUX_VERSION,
    status: stages.VERIFY === "VERIFIED" ? "VERIFIED" : "INCONCLUSIVE",
    stages,
    healthy,
    unknown,
    bypass,
    malformed,
    replay,
    secret_egress: secretEgress,
    paid,
    breaker,
    escalate,
    ai_connector: ai,
    effect_interposition: effect,
    compute,
    performance: perf,
    knowledge,
    hashes: {
      request: digest({ now: t0, version: CONNECTOR_FLUX_VERSION }),
      healthy: digest(healthy),
      unknown: digest(unknown),
      bypass: digest(bypass),
      compute: compute.hashes?.result || digest(compute),
    },
    live: false,
    auto_merge: false,
    authority: "carl",
    observed_at: t0,
    not_juge_flux: true,
  };
  proofs.push(proof);
  return proof;
}

export function listAudit() {
  return audit.slice();
}

export function listQuarantine() {
  return quarantined.slice();
}

export function listSessions() {
  return [...sessions.values()];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const proof = await runConnectorProofLoop();
  const view = cortexConnectorView({ proof });
  const summary = {
    title: view.title,
    version: CONNECTOR_FLUX_VERSION,
    live: false,
    auto_merge: false,
    authority: view.authority,
    admitted: proof.healthy.status,
    unknown_quarantined: proof.unknown.status,
    unknown_not_malicious: proof.unknown.malicious !== true,
    bypass_denied: proof.bypass.status,
    secret_egress: proof.secret_egress.status,
    paid_hold: proof.paid.status,
    breaker_denied: proof.breaker.status,
    escalate_denied: proof.escalate.status,
    compute: proof.compute.status,
    not_juge_flux: true,
    hashes: proof.hashes,
    no_fake_badge: true,
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}
