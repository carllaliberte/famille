#!/usr/bin/env node
/**
 * ACORN SELF-HEALING RUNTIME v1
 * Detect → classify → recover → verify → continue.
 *
 * Automatic recovery may retry/restart execution and hand measured failures
 * back to the Codex repair worker. It never merges, exposes secrets, bypasses
 * the global breaker, or declares LIVE. Human intervention remains reserved
 * for decisions, secrets, authorization, payment, or unsafe repairs.
 */
export const SELF_HEAL_VERSION = "self-heal.v1";

const TRANSIENT = /\b(429|502|503|504)\b|rate[- ]?limit|timeout|timed? ?out|econnreset|etimedout|temporar|network/i;
const AUTH = /\b(401|402|403)\b|unauthori[sz]ed|payment required|insufficient credits|permission denied/i;
const HUMAN = /secret|credential|token|payment|authorization|protected branch|merge required|manual approval/i;
const ENVIRONMENT = /\b404\b|not found|enoent|missing dependency|command not found/i;

export function classifyFailure({ status, reason, exitCode } = {}) {
  const text = `${status ?? ""} ${reason ?? ""} ${exitCode ?? ""}`.toLowerCase();
  if (!text.trim()) return "UNKNOWN";
  if (HUMAN.test(text)) return "HUMAN_BOUNDARY";
  if (AUTH.test(text)) return "AUTH_BOUNDARY";
  if (TRANSIENT.test(text)) return "TRANSIENT";
  if (ENVIRONMENT.test(text)) return "ENVIRONMENT";
  if (/test|assert|syntax|exception|failure|bug|error/.test(text)) return "CODE_OR_TEST";
  return "UNKNOWN";
}

export function recoveryPlan({ failureClass, attempt = 0, maxAttempts = 3, breaker = "RUN" } = {}) {
  const mode = String(breaker || "RUN").toUpperCase();
  if (mode === "OFF") return { version: SELF_HEAL_VERSION, action: "STOP", reason: "GLOBAL_BREAKER_OFF", retry: false, human_required: false };
  if (failureClass === "HUMAN_BOUNDARY" || failureClass === "AUTH_BOUNDARY") {
    return { version: SELF_HEAL_VERSION, action: "HOLD_HUMAN", reason: failureClass, retry: false, human_required: true };
  }
  if (attempt >= maxAttempts) return { version: SELF_HEAL_VERSION, action: "ESCALATE", reason: "REPAIR_ATTEMPTS_EXHAUSTED", retry: false, human_required: false };
  switch (failureClass) {
    case "TRANSIENT": return { version: SELF_HEAL_VERSION, action: "RETRY", reason: "TRANSIENT_FAILURE", retry: true, human_required: false };
    case "ENVIRONMENT": return { version: SELF_HEAL_VERSION, action: "RESTART_WORKER", reason: "ENVIRONMENT_FAILURE", retry: true, human_required: false };
    case "CODE_OR_TEST": return { version: SELF_HEAL_VERSION, action: "DISPATCH_REPAIR", reason: "MEASURED_CODE_OR_TEST_FAILURE", retry: true, human_required: false };
    default: return { version: SELF_HEAL_VERSION, action: "DIAGNOSE", reason: "UNCLASSIFIED_FAILURE", retry: true, human_required: false };
  }
}

export function selfHealDecision(input = {}) {
  const failureClass = input.failureClass || classifyFailure(input);
  return {
    version: SELF_HEAL_VERSION,
    failure_class: failureClass,
    ...recoveryPlan({ failureClass, attempt: Number(input.attempt || 0), maxAttempts: Number(input.maxAttempts || 3), breaker: input.breaker || "RUN" }),
    auto_merge: false,
    production_write_allowed: false,
    live: false,
    human_authority: "carl",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [status = "", reason = "", attempt = "0"] = process.argv.slice(2);
  console.log(JSON.stringify(selfHealDecision({ status, reason, attempt }), null, 2));
}
