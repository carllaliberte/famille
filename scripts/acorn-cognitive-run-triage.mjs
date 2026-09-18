#!/usr/bin/env node
/**
 * ACORN COGNITIVE RUN TRIAGE
 *
 * Turns raw automation outcomes into Acorn operational states and performs
 * bounded retry/recovery for transient failures.
 *
 * CAPABILITY != AUTHORITY.
 */

import { spawnSync } from "node:child_process";

export const COGNITIVE_RUN_TRIAGE_VERSION = "acorn.cognitive-run-triage.v2";

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
  if (HUMAN.has(String(reason).toUpperCase()) || [...HUMAN].some((x) => haystack.includes(x)) || haystack.includes("WAITING_HUMAN") || /\bHOLD\b/.test(haystack)) {
    return RUN_CLASSES.WAITING_HUMAN;
  }
  if (Number(exitCode) === 0) return RUN_CLASSES.SUCCESS;
  if ([...RETRYABLE].some((x) => haystack.includes(x))) return RUN_CLASSES.TRANSIENT_FAILURE;
  if (/EXPECTED(?:_[A-Z0-9_]+)?|SKIPPED|NO_RESOURCE|NOT_PRESENT|NOT_IMPLEMENTED|GPU_RUNTIME_NOT_PRESENT/.test(haystack)) {
    return RUN_CLASSES.EXPECTED_FAILURE;
  }
  return RUN_CLASSES.REAL_REGRESSION;
}

export function workflowExitCode(result) { return result.notify ? 1 : 0; }\n\nexport function notificationDecision(classification, { recovered = false } = {}) {
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

export function runBoundedVerification({
  command,
  args = [],
  cwd = process.cwd(),
  env = process.env,
  maxRetries = 2,
  timeoutMs = 90_000,
} = {}) {
  if (!command) throw new Error("VERIFICATION_COMMAND_REQUIRED");
  const attempts = [];
  const limit = Math.max(0, Math.min(3, Number(maxRetries) || 0));

  for (let attempt = 0; attempt <= limit; attempt += 1) {
    const started = Date.now();
    const result = spawnSync(command, args, {
      cwd,
      env: { ...env, CI: "true" },
      encoding: "utf8",
      timeout: Math.max(5_000, Number(timeoutMs) || 90_000),
      maxBuffer: 4 * 1024 * 1024,
    });
    const stdout = String(result.stdout ?? "");
    const stderr = String(result.stderr ?? "");
    const exitCode = result.status === null ? 1 : Number(result.status);
    const triage = triageRun({
      exitCode,
      stderr: [result.error?.code || "", stderr].join(" "),
      reason: result.error?.code || "",
    });
    attempts.push({
      attempt: attempt + 1,
      exit_code: exitCode,
      signal: result.signal || null,
      duration_ms: Date.now() - started,
      classification: triage.classification,
      stdout_tail: stdout.slice(-4000),
      stderr_tail: stderr.slice(-4000),
    });

    if (exitCode === 0) {
      return {
        ...triageRun({ exitCode: 0 }),
        classification: attempt > 0 ? RUN_CLASSES.RECOVERED : RUN_CLASSES.SUCCESS,
        notify: false,
        action: "record",
        attempts,
        recovered: attempt > 0,
      };
    }
    if (triage.classification !== RUN_CLASSES.TRANSIENT_FAILURE) {
      return { ...triage, attempts, recovered: false };
    }
  }

  const last = attempts.at(-1);
  return {
    ...triageRun({
      exitCode: last?.exit_code ?? 1,
      stderr: last?.stderr_tail ?? "",
      reason: "RETRY_EXHAUSTED",
    }),
    attempts,
    recovered: false,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = triageRun({
    exitCode: Number(process.env.ACORN_RUN_EXIT_CODE || 0),
    reason: process.env.ACORN_RUN_REASON || "",
    stderr: process.env.ACORN_RUN_STDERR || "",
  });
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = workflowExitCode(result);
}
