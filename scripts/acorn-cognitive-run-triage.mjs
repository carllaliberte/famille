#!/usr/bin/env node
/**
 * ACORN COGNITIVE RUN TRIAGE
 *
 * Turns raw GitHub Actions outcomes into Acorn operational states.
 * It does not disable GitHub notifications. It prevents expected,
 * transient, or recovered automation failures from becoming noisy
 * workflow failures; genuine regressions and human/security gates remain
 * visible.
 *
 * CAPABILITY != AUTHORITY.
 */

export const COGNITIVE_RUN_TRIAGE_VERSION = "acorn.cognitive-run-triage.v1";

export const RUN_CLASSES = Object.freeze({
  SUCCESS: "SUCCESS",
  EXPECTED_FAILURE: "EXPECTED_FAILURE",
  TRANSIENT_FAILURE: "TRANSIENT_FAILURE",
  RECOVERED: "RECOVERED",
  REAL_REGRESSION: "REAL_REGRESSION",
  WAITING_HUMAN: "WAITING_HUMAN",
  SECURITY: "SECURITY",
});

const RETRYABLE = new Set([
  "ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "RATE_LIMITED",
  "429", "502", "503", "504", "NETWORK_TRANSIENT",
]);

const HUMAN = new Set([
  "HUMAN_AUTHORITY_REQUIRED", "HOLD_HUMAN", "EXTERNAL_SPEND",
  "SECRET_REQUIRED", "MANUAL_APPROVAL_REQUIRED",
]);

const SECURITY = new Set([
  "SECURITY_POLICY", "INTEGRITY_FAILURE", "UNTRUSTED_EXECUTION",
  "AUTHENTICATION_FAILURE",
]);

export function classifyRun({ exitCode = 0, reason = "", stderr = "", checks = {} } = {}) {
  const haystack = [reason, stderr, ...Object.values(checks)].join(" ").toUpperCase();
  if (SECURITY.has(String(reason).toUpperCase()) || [...SECURITY].some((x) => haystack.includes(x))) {
    return RUN_CLASSES.SECURITY;
  }
  if (HUMAN.has(String(reason).toUpperCase()) || [...HUMAN].some((x) => haystack.includes(x))) {
    return RUN_CLASSES.WAITING_HUMAN;
  }
  if (Number(exitCode) === 0) return RUN_CLASSES.SUCCESS;
  if ([...RETRYABLE].some((x) => haystack.includes(x))) return RUN_CLASSES.TRANSIENT_FAILURE;
  if (/EXPECTED|SKIP(?:PED)?|NO_RESOURCE|NOT_PRESENT|NOT_IMPLEMENTED|UNAVAILABLE|HOLD/.test(haystack)) {
    return RUN_CLASSES.EXPECTED_FAILURE;
  }
  return RUN_CLASSES.REAL_REGRESSION;
}

export function notificationDecision(classification, { recovered = false } = {}) {
  if (recovered) return { notify: false, severity: "info", action: "record" };
  if ([RUN_CLASSES.SUCCESS, RUN_CLASSES.EXPECTED_FAILURE].includes(classification)) {
    return { notify: false, severity: "info", action: "record" };
  }
  if (classification === RUN_CLASSES.TRANSIENT_FAILURE) {
    return { notify: false, severity: "warning", action: "retry_then_record" };
  }
  if (classification === RUN_CLASSES.RECOVERED) {
    return { notify: false, severity: "info", action: "record" };
  }
  if (classification === RUN_CLASSES.WAITING_HUMAN) {
    return { notify: true, severity: "human", action: "escalate" };
  }
  if (classification === RUN_CLASSES.SECURITY) {
    return { notify: true, severity: "security", action: "escalate" };
  }
  return { notify: true, severity: "error", action: "escalate" };
}

export function triageRun(input = {}) {
  const classification = classifyRun(input);
  const decision = notificationDecision(classification, input);
  return {
    version: COGNITIVE_RUN_TRIAGE_VERSION,
    observed_at: new Date().toISOString(),
    classification,
    ...decision,
    raw_exit_code: Number(input.exitCode ?? 0),
    reason: String(input.reason ?? ""),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = triageRun({
    exitCode: Number(process.env.ACORN_RUN_EXIT_CODE || 0),
    reason: process.env.ACORN_RUN_REASON || "",
    stderr: process.env.ACORN_RUN_STDERR || "",
  });
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.notify && result.classification === RUN_CLASSES.REAL_REGRESSION ? 1 : 0;
}
