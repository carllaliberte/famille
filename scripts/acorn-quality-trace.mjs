#!/usr/bin/env node
/**
 * ACORN QUALITY TRACE
 *
 * A durable provenance mark for software engineered through Acorn.
 *
 * IMPORTANT:
 * The mark is evidence-bearing provenance, not a magical certification.
 * ACORN_QUALITY_ASSURED is true only when the declared evidence contract passes.
 *
 * Acorn: a certainty with an expiry date.
 * CODE_PRESENT != TESTED != EXECUTED != MEASURED != VERIFIED != LIVE
 */

import crypto from "node:crypto";

export const ACORN_QUALITY_TRACE_VERSION = "acorn.quality-trace.v1";
export const ACORN_MARK = "ACORN_ENGINEERED";

const REQUIRED_GATES = Object.freeze([
  "truth_contract",
  "tests",
  "security",
  "provenance",
  "human_authority",
]);

const str = (v) => String(v ?? "").trim();

export function qualityTrace({
  project_id,
  project_name,
  project_version,
  source_revision,
  generated_at = new Date().toISOString(),
  valid_until = null,
  gates = {},
  evidence = [],
  acorn_version = ACORN_QUALITY_TRACE_VERSION,
} = {}) {
  const normalizedGates = Object.fromEntries(
    REQUIRED_GATES.map((name) => [name, gates[name] === true])
  );

  const passed = REQUIRED_GATES.every((name) => normalizedGates[name] === true);
  const payload = {
    mark: ACORN_MARK,
    contract: ACORN_QUALITY_TRACE_VERSION,
    project_id: str(project_id) || null,
    project_name: str(project_name) || null,
    project_version: str(project_version) || null,
    source_revision: str(source_revision) || null,
    generated_at,
    valid_until,
    acorn_version,
    gates: normalizedGates,
    evidence: Array.isArray(evidence) ? evidence.map((e) => ({
      id: str(e?.id) || null,
      type: str(e?.type) || "UNKNOWN",
      status: str(e?.status) || "UNKNOWN",
      measured_at: e?.measured_at || null,
      valid_until: e?.valid_until || null,
    })) : [],
    quality_assured: passed,
    authority: "human",
    auto_merge: false,
  };

  const canonical = JSON.stringify(payload);
  return Object.freeze({
    ...payload,
    trace_hash: crypto.createHash("sha256").update(canonical).digest("hex"),
  });
}

export function qualityHeader(trace) {
  const t = trace || {};
  return [
    "/*",
    " * ACORN QUALITY TRACE",
    ` * mark: ${t.mark || ACORN_MARK}`,
    ` * contract: ${t.contract || ACORN_QUALITY_TRACE_VERSION}`,
    ` * project: ${t.project_name || "UNKNOWN"}`,
    ` * revision: ${t.source_revision || "UNKNOWN"}`,
    ` * measured_at: ${t.generated_at || "UNKNOWN"}`,
    ` * valid_until: ${t.valid_until || "EXPIRY_REQUIRED"}`,
    ` * quality_assured: ${t.quality_assured === true ? "true" : "false"}`,
    ` * trace_hash: ${t.trace_hash || "UNKNOWN"}`,
    " *",
    " * Evidence-bearing provenance. Not a substitute for independent verification.",
    " */",
    "",
  ].join("\n");
}

export function validateQualityTrace(trace = {}) {
  if (trace.mark !== ACORN_MARK) throw new Error("ACORN_MARK_REQUIRED");
  if (trace.contract !== ACORN_QUALITY_TRACE_VERSION) throw new Error("ACORN_CONTRACT_MISMATCH");
  if (!trace.project_id || !trace.source_revision) throw new Error("PROJECT_ID_AND_REVISION_REQUIRED");
  if (!trace.generated_at) throw new Error("MEASURED_AT_REQUIRED");
  if (!trace.valid_until) throw new Error("QUALITY_TRACE_MUST_EXPIRE");
  if (trace.quality_assured === true &&
      !REQUIRED_GATES.every((name) => trace.gates?.[name] === true)) {
    throw new Error("QUALITY_ASSURANCE_REQUIRES_ALL_GATES");
  }
  return true;
}

export function qualityBadge(trace) {
  validateQualityTrace(trace);
  return trace.quality_assured
    ? "ACORN ENGINEERED · QUALITY ASSURED · EVIDENCE DATED"
    : "ACORN ENGINEERED · EVIDENCE INCOMPLETE";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const trace = qualityTrace({
    project_id: "self-test",
    project_name: "Acorn",
    source_revision: process.env.GITHUB_SHA || "LOCAL",
    valid_until: new Date(Date.now() + 86400000).toISOString(),
    gates: Object.fromEntries(REQUIRED_GATES.map((g) => [g, true])),
  });
  console.log(JSON.stringify(trace, null, 2));
}
