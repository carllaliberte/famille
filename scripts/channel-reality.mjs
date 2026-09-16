#!/usr/bin/env node
/**
 * ACORN CHANNEL REALITY — provider/channel truth layer.
 *
 * Configuration is not availability. Credentials are not execution.
 * A channel earns EXECUTED/OBSERVED/MEASURED only from real transport evidence.
 * Provider retirement, endpoint disappearance, auth failure and model retirement
 * are durable negative evidence with a bounded revalidation lease.
 */

export const CHANNEL_STATES = Object.freeze([
  "DEFINED",
  "CONFIGURED",
  "PROBING",
  "EXECUTED",
  "OBSERVED",
  "MEASURED",
  "VERIFIED",
  "LIVE",
  "UNAVAILABLE",
  "RETIRED",
  "AUTH_FAILED",
  "FORBIDDEN",
  "NOT_FOUND",
  "RATE_LIMITED",
  "TRANSIENT_FAILURE",
  "INCONCLUSIVE",
]);

export const FAILURE_KINDS = Object.freeze({
  AUTH: "AUTH_FAILED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RETIRED: "RETIRED",
  RATE_LIMITED: "RATE_LIMITED",
  TRANSIENT: "TRANSIENT_FAILURE",
  UNKNOWN: "INCONCLUSIVE",
});

// Verified provider lifecycle facts. These are not inferred from HTTP status alone.
// They prevent Acorn from repeatedly attempting a service that has been officially retired.
export const RETIRED_PROVIDERS = Object.freeze({
  "github-models": Object.freeze({
    retired: true,
    retiredAt: "2026-07-30",
    reason: "GitHub Models inference service retired",
    evidence: "https://github.blog/changelog/2026-07-30-github-models-is-now-retired/",
  }),
});

export const DEFAULT_LEASE_MS = 15 * 60 * 1000;
export const RETIRED_LEASE_MS = 365 * 24 * 60 * 60 * 1000;

function text(value) {
  return String(value ?? "").trim();
}

export function providerLifecycle(provider) {
  const key = text(provider).toLowerCase();
  const fact = RETIRED_PROVIDERS[key];
  return fact?.retired ? { state: "RETIRED", ...fact } : { state: "UNKNOWN", provider: key };
}

export function classifyHttp(status, body = "") {
  const code = Number(status);
  const message = text(body).toLowerCase();
  if (code === 401) return { kind: FAILURE_KINDS.AUTH, retryable: false, reason: "authentication rejected" };
  if (code === 403) return { kind: FAILURE_KINDS.FORBIDDEN, retryable: false, reason: "authorization rejected" };
  if (code === 404) return { kind: FAILURE_KINDS.NOT_FOUND, retryable: false, reason: "endpoint or model not found" };
  if (code === 410) return { kind: FAILURE_KINDS.RETIRED, retryable: false, reason: "endpoint permanently gone" };
  if (code === 408 || code === 425 || code === 429) return { kind: FAILURE_KINDS.RATE_LIMITED, retryable: true, reason: "temporary capacity/rate boundary" };
  if (code >= 500 && code <= 599) return { kind: FAILURE_KINDS.TRANSIENT, retryable: true, reason: "provider/server failure" };
  if (/retir|deprecated|sunset|no longer available|gone/.test(message)) {
    return { kind: FAILURE_KINDS.RETIRED, retryable: false, reason: "provider/model retirement signal" };
  }
  return { kind: FAILURE_KINDS.UNKNOWN, retryable: false, reason: `unexpected HTTP status ${code}` };
}

export function classifyTransport({ provider, status, body = "", error = "" } = {}) {
  const lifecycle = providerLifecycle(provider);
  if (lifecycle.state === "RETIRED") return { ...lifecycle, retryable: false };
  if (status !== undefined && status !== null) return classifyHttp(status, body);
  if (error) return { kind: FAILURE_KINDS.TRANSIENT, retryable: true, reason: text(error).slice(0, 240) };
  return { kind: FAILURE_KINDS.UNKNOWN, retryable: false, reason: "no transport evidence" };
}

export function evidenceState({ provider, status, responseText = "", startedAt, finishedAt } = {}) {
  const lifecycle = providerLifecycle(provider);
  const body = text(responseText);
  const durationMs = Number.isFinite(Number(startedAt)) && Number.isFinite(Number(finishedAt))
    ? Math.max(0, Number(finishedAt) - Number(startedAt))
    : null;
  if (lifecycle.state === "RETIRED") {
    return {
      state: "RETIRED",
      provider: text(provider),
      reason: lifecycle.reason,
      evidence: lifecycle.evidence,
      live: false,
    };
  }
  const code = Number(status);
  if (code >= 200 && code < 300 && body) {
    return {
      state: "OBSERVED",
      provider: text(provider),
      httpStatus: code,
      responseObserved: true,
      responseBytes: Buffer.byteLength(body),
      durationMs,
      live: false,
    };
  }
  const failure = classifyTransport({ provider, status, body });
  return {
    state: failure.kind,
    provider: text(provider),
    httpStatus: Number.isFinite(code) ? code : null,
    reason: failure.reason,
    retryable: failure.retryable,
    responseObserved: false,
    live: false,
  };
}

export function channelEligibility({ provider, credentialPresent = false, evidence, now = Date.now(), leaseMs = DEFAULT_LEASE_MS } = {}) {
  const lifecycle = providerLifecycle(provider);
  if (lifecycle.state === "RETIRED") return { eligible: false, state: "RETIRED", reason: lifecycle.reason };
  if (!credentialPresent && !evidence) return { eligible: false, state: "DEFINED", reason: "credential/channel not configured" };
  if (!evidence) return { eligible: false, state: "CONFIGURED", reason: "real probe required before execution eligibility" };
  if (["AUTH_FAILED", "FORBIDDEN", "NOT_FOUND", "RETIRED"].includes(evidence.state)) {
    return { eligible: false, state: evidence.state, reason: evidence.reason || "negative transport evidence" };
  }
  if (evidence.state === "OBSERVED" && evidence.finishedAt) {
    const age = Math.max(0, now - Number(evidence.finishedAt));
    if (age <= leaseMs) return { eligible: true, state: "EXECUTED", reason: "recent real transport evidence" };
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
  const startedAt = Number.isFinite(Number(input.startedAt)) ? Number(input.startedAt) : now;
  const finishedAt = Number.isFinite(Number(input.finishedAt)) ? Number(input.finishedAt) : now;
  const evidence = evidenceState({ ...input, startedAt, finishedAt });
  return Object.freeze({
    version: "channel-reality.v1",
    timestamp: new Date(finishedAt).toISOString(),
    startedAt,
    finishedAt,
    provider: text(input.provider),
    channel: text(input.channel || input.id),
    model: text(input.model),
    endpoint: text(input.endpoint),
    credential: redactSecret(input.credential),
    ...evidence,
  });
}

export function assertNoFakeExecution(record = {}) {
  const state = text(record.state);
  if (["EXECUTED", "OBSERVED", "MEASURED", "VERIFIED", "LIVE"].includes(state)) {
    if (!record.responseObserved || !record.timestamp || !record.provider) {
      throw new Error(`FAKE_EXECUTION_BLOCKED:${state}`);
    }
  }
  return true;
}
