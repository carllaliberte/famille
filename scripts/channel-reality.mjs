#!/usr/bin/env node
/** ACORN CHANNEL REALITY — transport truth, lifecycle and quarantine primitives. */

export const CHANNEL_STATES = Object.freeze([
  "DEFINED", "CONFIGURED", "PROBING", "EXECUTED", "OBSERVED", "MEASURED", "VERIFIED", "LIVE",
  "UNAVAILABLE", "RETIRED", "AUTH_FAILED", "FORBIDDEN", "NOT_FOUND", "RATE_LIMITED", "TIMEOUT",
  "TRANSIENT_FAILURE", "INCONCLUSIVE",
]);

export const FAILURE_KINDS = Object.freeze({
  AUTH: "AUTH_FAILED", FORBIDDEN: "FORBIDDEN", NOT_FOUND: "NOT_FOUND", RETIRED: "RETIRED",
  RATE_LIMITED: "RATE_LIMITED", TIMEOUT: "TIMEOUT", TRANSIENT: "TRANSIENT_FAILURE", UNKNOWN: "INCONCLUSIVE",
});

export const RETIRED_PROVIDERS = Object.freeze({
  "github-models": Object.freeze({
    retired: true, retiredAt: "2026-07-30",
    reason: "GitHub Models inference service retired",
    evidence: "https://github.blog/changelog/2026-07-30-github-models-is-now-retired/",
  }),
});

export const DEFAULT_LEASE_MS = 15 * 60 * 1000;
export const RETIRED_LEASE_MS = 365 * 24 * 60 * 60 * 1000;

const NEGATIVE_STATES = new Set(["AUTH_FAILED", "FORBIDDEN", "NOT_FOUND", "RETIRED"]);
const EXECUTION_STATES = new Set(["EXECUTED", "OBSERVED", "MEASURED", "VERIFIED", "LIVE"]);
const RETIREMENT_RE = /retir|deprecated|sunset|no longer available|service unavailable permanently|endpoint gone/i;

function text(value) { return String(value ?? "").trim(); }
function finite(value) { return Number.isFinite(Number(value)); }

export function providerLifecycle(provider) {
  const key = text(provider).toLowerCase();
  const fact = RETIRED_PROVIDERS[key];
  return fact?.retired ? { state: "RETIRED", provider: key, ...fact } : { state: "UNKNOWN", provider: key };
}

/** Model lifecycle is deliberately separate from provider lifecycle. */
export function modelLifecycle({ provider, model, retiredModels = {} } = {}) {
  const p = text(provider).toLowerCase();
  const m = text(model);
  const fact = retiredModels[`${p}:${m}`] || retiredModels[m];
  return fact?.retired ? { state: "RETIRED", provider: p, model: m, ...fact } : { state: "UNKNOWN", provider: p, model: m };
}

export function classifyHttp(status, body = "") {
  const code = Number(status);
  const message = text(body);
  if (code === 401) return { kind: FAILURE_KINDS.AUTH, retryable: false, reason: "authentication rejected" };
  if (code === 403) return { kind: FAILURE_KINDS.FORBIDDEN, retryable: false, reason: "authorization rejected" };
  if (code === 404) return { kind: FAILURE_KINDS.NOT_FOUND, retryable: false, reason: "endpoint or model not found" };
  if (code === 410) return { kind: FAILURE_KINDS.RETIRED, retryable: false, reason: "endpoint permanently gone" };
  if (code === 408) return { kind: FAILURE_KINDS.TIMEOUT, retryable: true, reason: "request timeout" };
  if (code === 425) return { kind: FAILURE_KINDS.TRANSIENT, retryable: true, reason: "request not yet acceptable" };
  if (code === 429) return { kind: FAILURE_KINDS.RATE_LIMITED, retryable: true, reason: "rate limit or quota boundary" };
  if (code >= 500 && code <= 599) return { kind: FAILURE_KINDS.TRANSIENT, retryable: true, reason: `server failure ${code}` };
  if (RETIREMENT_RE.test(message)) return { kind: FAILURE_KINDS.RETIRED, retryable: false, reason: "retirement/deprecation signal" };
  if (code >= 200 && code < 300) return { kind: "SUCCESS", retryable: false, reason: "successful HTTP transport" };
  return { kind: FAILURE_KINDS.UNKNOWN, retryable: false, reason: `unexpected HTTP status ${Number.isFinite(code) ? code : "unknown"}` };
}

export function classifyTransport({ provider, status, body = "", error = "", errorCode = "" } = {}) {
  const lifecycle = providerLifecycle(provider);
  if (lifecycle.state === "RETIRED") return { ...lifecycle, retryable: false };
  if (status !== undefined && status !== null) return classifyHttp(status, body);
  const code = text(errorCode).toUpperCase();
  if (["ETIMEDOUT", "ESOCKETTIMEDOUT", "UND_ERR_CONNECT_TIMEOUT", "ABORT_ERR"].includes(code)) {
    return { kind: FAILURE_KINDS.TIMEOUT, retryable: true, reason: code };
  }
  if (["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET", "EPIPE", "EPROTO"].includes(code)) {
    return { kind: FAILURE_KINDS.TRANSIENT, retryable: true, reason: code };
  }
  if (error) return { kind: FAILURE_KINDS.TRANSIENT, retryable: true, reason: text(error).slice(0, 240) };
  return { kind: FAILURE_KINDS.UNKNOWN, retryable: false, reason: "no transport evidence" };
}

export function evidenceState({ provider, model, status, responseText = "", startedAt, finishedAt, error = "", errorCode = "" } = {}) {
  const lifecycle = providerLifecycle(provider);
  if (lifecycle.state === "RETIRED") return { state: "RETIRED", provider: text(provider), model: text(model), reason: lifecycle.reason, evidence: lifecycle.evidence, live: false };
  const body = text(responseText);
  const durationMs = finite(startedAt) && finite(finishedAt) ? Math.max(0, Number(finishedAt) - Number(startedAt)) : null;
  if (status !== undefined && status !== null && Number(status) >= 200 && Number(status) < 300 && body) {
    return { state: "OBSERVED", provider: text(provider), model: text(model), httpStatus: Number(status), responseObserved: true, responseBytes: Buffer.byteLength(body), durationMs, live: false };
  }
  const failure = classifyTransport({ provider, status, body, error, errorCode });
  return { state: failure.kind, provider: text(provider), model: text(model), httpStatus: finite(status) ? Number(status) : null, reason: failure.reason, retryable: failure.retryable, responseObserved: false, live: false };
}

/** Credentials/configuration are never enough. Only a recent, real OBSERVED result is eligible. */
export function channelEligibility({ provider, credentialPresent = false, evidence, now = Date.now(), leaseMs = DEFAULT_LEASE_MS } = {}) {
  const lifecycle = providerLifecycle(provider);
  if (lifecycle.state === "RETIRED") return { eligible: false, state: "RETIRED", reason: lifecycle.reason };
  if (!credentialPresent && !evidence) return { eligible: false, state: "DEFINED", reason: "credential/channel not configured" };
  if (!evidence) return { eligible: false, state: "CONFIGURED", reason: "real probe required before execution eligibility" };
  if (NEGATIVE_STATES.has(evidence.state)) return { eligible: false, state: evidence.state, reason: evidence.reason || "negative transport evidence" };
  const finishedAt = Number(evidence.finishedAt);
  if (evidence.state === "OBSERVED" && finite(finishedAt) && now - finishedAt >= 0 && now - finishedAt <= leaseMs && evidence.responseObserved === true) {
    return { eligible: true, state: "EXECUTED", reason: "recent real transport evidence" };
  }
  return { eligible: false, state: "PROBING", reason: "execution lease expired or evidence is incomplete" };
}

export function redactSecret(value) {
  const v = text(value);
  if (!v) return "";
  if (v.length <= 8) return "[REDACTED]";
  return `${v.slice(0, 4)}…${v.slice(-4)}`;
}

export function makeChannelEvidence(input = {}) {
  const now = Date.now();
  const startedAt = finite(input.startedAt) ? Number(input.startedAt) : now;
  const finishedAt = finite(input.finishedAt) ? Number(input.finishedAt) : now;
  const evidence = evidenceState({ ...input, startedAt, finishedAt });
  return Object.freeze({
    version: "channel-reality.v2", timestamp: new Date(finishedAt).toISOString(), startedAt, finishedAt,
    provider: text(input.provider), channel: text(input.channel || input.id), model: text(input.model), endpoint: text(input.endpoint),
    credential: redactSecret(input.credential), ...evidence,
  });
}

export function assertNoFakeExecution(record = {}) {
  const state = text(record.state);
  if (!EXECUTION_STATES.has(state)) return true;
  if (!record.responseObserved || !record.timestamp || !record.provider || !record.channel || !record.transportEvidence) {
    throw new Error(`FAKE_EXECUTION_BLOCKED:${state}`);
  }
  return true;
}
