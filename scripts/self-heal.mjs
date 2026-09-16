#!/usr/bin/env node
/**
 * ACORN SELF-HEALING RUNTIME v1
 * Detect → classify → recover → verify → continue.
 *
 * Automatic recovery may retry/restart execution and hand measured failures
 * back to the Codex repair worker. It never merges, exposes secrets, bypasses
 * the global breaker, or declares LIVE. Human intervention remains reserved
 * for decisions, secrets, authorization, payment, or unsafe repairs.
 *
 * Continuation and heal decisions are derived from worker evidence, not from
 * GitHub job conclusion. A green job with CODEX_FAILED is still a failure.
 */
import { controlState } from "../.github/swarm/system-breaker.mjs";

export const SELF_HEAL_VERSION = "self-heal.v1";

const TRANSIENT = /\b(429|502|503|504)\b|rate[- ]?limit|timeout|timed? ?out|econnreset|etimedout|temporar|network/i;
const AUTH = /\b(401|402|403)\b|unauthori[sz]ed|payment required|insufficient credits|permission denied/i;
const HUMAN = /secret|credential|token|payment|authorization|protected branch|merge required|manual approval/i;
const ENVIRONMENT = /\b404\b|not found|enoent|missing dependency|command not found/i;
const CAPABILITY = /missing tool|capability missing|build_tool|outil manquant/i;
const HEALTHY = new Set(["IDLE", "OK", "COMPLETED", "MEASURED", "PR_NOT_PUBLISHED"]);

export function classifyFailure({ status, reason, exitCode } = {}) {
  const text = `${status ?? ""} ${reason ?? ""} ${exitCode ?? ""}`.toLowerCase();
  if (!text.trim()) return "UNKNOWN";
  if (HUMAN.test(text)) return "HUMAN_BOUNDARY";
  if (AUTH.test(text)) return "AUTH_BOUNDARY";
  if (CAPABILITY.test(text)) return "CAPABILITY_MISSING";
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
    case "CAPABILITY_MISSING": return { version: SELF_HEAL_VERSION, action: "BUILD_TOOL", reason: "CAPABILITY_MISSING", retry: false, human_required: false };
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

export function evidenceBlob(evidence = {}) {
  const human = evidence.human_actions_required || [];
  return [
    evidence.status,
    evidence.reason,
    human.map((row) => `${row.reason || ""} ${(row.evidence || []).join(" ")}`).join(" "),
    evidence.codex?.status,
  ].filter(Boolean).join(" ");
}

export function diagnoseWorkerEvidence(evidence = {}, env = process.env) {
  const status = String(evidence.status || "");
  const attempts = Number(evidence.human_actions_required?.[0]?.attempts || 0);
  const diagnosis = {
    version: SELF_HEAL_VERSION,
    cycle_id: evidence.run_id || null,
    task: evidence.tasks?.[0] || evidence.wake || null,
    worker: evidence.worker || "codex-autonomous-worker",
    tool: evidence.codex?.provider_selected || evidence.codex?.auth_method || null,
    intelligence: evidence.codex?.model || null,
    trigger: evidence.trigger || null,
    state: status || "NO_EVIDENCE",
    executed: Boolean(evidence.codex?.executed) || evidence.mode === "self-test",
    measured: Boolean(status),
    live: false,
    auto_merge: false,
    authority: "carl",
  };
  if (!status) {
    return { ...diagnosis, applicable: true, ...selfHealDecision({ reason: "missing worker evidence", breaker: env.ACORN_SYSTEM_MODE }), next: "DIAGNOSE" };
  }
  if (status === "WAIT_HUMAN_MERGE" || status === "HUMAN_REQUIRED") {
    const heal = selfHealDecision({ reason: evidenceBlob(evidence) || status, status, attempt: attempts, breaker: env.ACORN_SYSTEM_MODE });
    return { ...diagnosis, applicable: true, ...heal, action: "HOLD_HUMAN", reason: status, retry: false, human_required: true, next: "HOLD_HUMAN" };
  }
  if (HEALTHY.has(status)) {
    return { ...diagnosis, applicable: false, action: "NOT_APPLICABLE", reason: status, retry: false, human_required: false, next: "CONTINUE_OR_STOP" };
  }
  const heal = selfHealDecision({ reason: evidenceBlob(evidence), status, attempt: attempts, breaker: env.ACORN_SYSTEM_MODE });
  return { ...diagnosis, applicable: true, ...heal, next: heal.action };
}

export function decideContinuation({
  evidence = {},
  env = process.env,
  eventName = "schedule",
  depth = 0,
  continueRuntime = true,
  runId = "",
} = {}) {
  const state = controlState(env);
  const depthN = Math.max(0, Number(depth || 0));
  const diagnosis = diagnoseWorkerEvidence(evidence, env);
  const base = {
    v: "runtime-continue.v1",
    parent_run: String(runId || evidence.run_id || ""),
    depth: depthN,
    event: eventName,
    breaker: state.mode,
    status: evidence.status || null,
    diagnosis,
    continue: false,
    next_depth: depthN + 1,
    live: false,
    auto_merge: false,
    authority: "carl",
    self_test: evidence.mode === "self-test",
    at: new Date().toISOString(),
  };
  if (state.breaker_closed) {
    return { ...base, reason: "GLOBAL_BREAKER_OFF", next: "STOP" };
  }
  if (depthN >= 1) {
    return { ...base, reason: "CONTINUATION_DEPTH_BOUNDED", next: "STOP" };
  }
  if (String(eventName) === "workflow_dispatch" && continueRuntime === false) {
    return { ...base, reason: "OPERATOR_DISABLED_CONTINUATION", next: "STOP" };
  }
  if (diagnosis.action === "HOLD_HUMAN" || evidence.status === "HUMAN_REQUIRED" || evidence.status === "WAIT_HUMAN_MERGE") {
    return { ...base, reason: diagnosis.reason || evidence.status, next: "HOLD_HUMAN", human_required: true };
  }
  if (diagnosis.applicable && ["RETRY", "RESTART_WORKER", "DISPATCH_REPAIR", "DIAGNOSE", "BUILD_TOOL"].includes(diagnosis.action)) {
    return { ...base, continue: true, reason: diagnosis.action, next: "SELF_HEAL" };
  }
  return { ...base, continue: true, reason: "BOUNDED_HANDOFF", next: "DISPATCH" };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [status = "", reason = "", attempt = "0"] = process.argv.slice(2);
  console.log(JSON.stringify(selfHealDecision({ status, reason, attempt }), null, 2));
}
