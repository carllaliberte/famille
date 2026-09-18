/** ACORN LIVE — truthful runtime states.
 * HTTP availability is not LIVE proof. Evidence is dated and must be independently measured.
 */
import { evidenceIsCurrent, proofGate } from "../scripts/acorn-evidence-registry.mjs";

export const RUNTIME_STATES = Object.freeze([
  "CODE_PRESENT",
  "LOCAL_RUNNING",
  "READY",
  "EXTERNALLY_REACHABLE",
  "LIVE_MEASURED",
  "VERIFIED"
]);

const SELF_SOURCES = new Set([
  "acorn-live",
  "acorn-live-worker",
  "local",
  "self",
  "code",
  "process",
  "test",
  "unit-test",
  "http-route",
  "function-presence"
]);

const FORBIDDEN_FROM_LOCAL_FACTS = new Set([
  "LIVE",
  "LIVE_MEASURED",
  "VERIFIED",
  "LIVE_VERIFIED",
  "EXECUTED"
]);

export function isSelfSource(source) {
  return SELF_SOURCES.has(String(source || "").trim().toLowerCase());
}

export function localFactsCannotProve(claim) {
  return FORBIDDEN_FROM_LOCAL_FACTS.has(String(claim || "").trim().toUpperCase());
}

function independentCurrent(evidence = [], at = Date.now()) {
  return (evidence || []).filter((row) => {
    if (!evidenceIsCurrent(row, at)) return false;
    if (isSelfSource(row.source || row.origin)) return false;
    return true;
  });
}

export function assessRuntimeStatus({
  processBound = false,
  dbHealthy = false,
  evidence = [],
  at = Date.now()
} = {}) {
  const currentIndependent = independentCurrent(evidence, at);
  const has = (claim) => currentIndependent.some((row) => {
    const c = String(row.claim || "").toUpperCase();
    return c === claim || c === claim.replace("_", "-");
  });
  let status = "CODE_PRESENT";
  if (processBound) status = "LOCAL_RUNNING";
  if (processBound && dbHealthy) status = "READY";
  if (status === "READY" && has("EXTERNALLY_REACHABLE")) status = "EXTERNALLY_REACHABLE";
  if (status === "EXTERNALLY_REACHABLE" && has("LIVE_MEASURED")) status = "LIVE_MEASURED";
  if (status === "LIVE_MEASURED" && currentIndependent.some((row) => {
    const c = String(row.claim || "").toUpperCase();
    const source = String(row.source || "").toLowerCase();
    return (c === "VERIFIED" || c === "LIVE_VERIFIED") && source === "carl";
  })) status = "VERIFIED";
  return {
    status,
    live: status === "LIVE_MEASURED" || status === "VERIFIED",
    verified: status === "VERIFIED",
    independent_evidence: currentIndependent.length,
    proof: "measured_only",
    external_deployment_evidence: has("LIVE_MEASURED") || has("EXTERNALLY_REACHABLE") ? "OBSERVED" : "NOT_OBSERVED",
    measured_at: new Date(at).toISOString()
  };
}

export function proofFromEvidence(evidence = [], required = 1) {
  const gate = proofGate({ evidence, required });
  return {
    ready: gate.ready,
    current_count: gate.current_count,
    required: gate.required,
    live: false,
    verified: false,
    measured_at: gate.measured_at
  };
}
