import test from "node:test";
import assert from "node:assert/strict";
import {
  ACORN_MARK,
  ACORN_QUALITY_TRACE_VERSION,
  qualityTrace,
  qualityHeader,
  validateQualityTrace,
  qualityBadge,
} from "../scripts/acorn-quality-trace.mjs";

const validUntil = "2026-12-31";

test("Acorn trace is deterministic, dated and expiring", () => {
  const trace = qualityTrace({
    project_id: "p1",
    project_name: "Example",
    source_revision: "abc123",
    valid_until: validUntil,
    gates: {
      truth_contract:true,
      tests:true,
      security:true,
      provenance:true,
      human_authority:true,
    },
  });
  assert.equal(trace.mark, ACORN_MARK);
  assert.equal(trace.contract, ACORN_QUALITY_TRACE_VERSION);
  assert.equal(trace.quality_assured, true);
  assert.equal(trace.valid_until, validUntil);
  assert.match(trace.trace_hash, /^[a-f0-9]{64}$/);
  assert.equal(qualityBadge(trace), "ACORN ENGINEERED · QUALITY ASSURED · EVIDENCE DATED");
});

test("missing quality gates cannot claim assurance", () => {
  const trace = qualityTrace({
    project_id: "p2",
    project_name: "Incomplete",
    source_revision: "def456",
    valid_until: validUntil,
    gates: { truth_contract:true, tests:true },
  });
  assert.equal(trace.quality_assured, false);
  assert.equal(qualityBadge(trace), "ACORN ENGINEERED · EVIDENCE INCOMPLETE");
});

test("quality trace must expire", () => {
  assert.throws(() => validateQualityTrace({
    mark: ACORN_MARK,
    contract: ACORN_QUALITY_TRACE_VERSION,
    project_id: "p3",
    source_revision: "ghi789",
    generated_at: new Date().toISOString(),
    gates: {},
    quality_assured: false,
  }), /QUALITY_TRACE_MUST_EXPIRE/);
});

test("quality header leaves a durable trace in generated source", () => {
  const trace = qualityTrace({
    project_id: "p4",
    project_name: "Marked",
    source_revision: "jkl012",
    valid_until: validUntil,
    gates: { truth_contract:true },
  });
  const header = qualityHeader(trace);
  assert.match(header, /ACORN QUALITY TRACE/);
  assert.match(header, /mark: ACORN_ENGINEERED/);
  assert.match(header, /trace_hash:/);
});
