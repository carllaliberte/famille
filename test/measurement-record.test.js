import test from "node:test";
import assert from "node:assert/strict";
import {
  assertMeasurementRecordSafe,
  assertRecordMatchesRanking,
  buildMeasurementRecord,
  emptyMeasurementRecord,
  measurementRecordSummary,
  verifyMeasurementRecord,
} from "../scripts/measurement-record.mjs";

const env = { GITHUB_SHA: "abc123" };

function sample() {
  const ranking = { v: "measured-ranking.v2", authority: "carl", auto_merge: false, live: false, measured: [{ id: "a", rank: 1 }] };
  const feedback = { v: "measurement-feedback.v1", authority: "carl", auto_merge: false, live: false, actions: [{ id: "a", action: "PROMOTE_PRIORITY" }] };
  const memoryIndex = { v: "cognitive-memory-index.v1", authority: "carl", auto_merge: false, live: false, edges: [] };
  const record = buildMeasurementRecord({ env, observedAt: "2026-09-15T00:10:00.000Z", observation: { source: "test" }, ranking, feedback, memoryIndex, dispatches: [{ state: "DISPATCHED" }, { state: "DISPATCH_FAILED" }] });
  return { record, ranking, feedback, memoryIndex };
}

test("measurement record is dated, sealed and non-authoritative", () => {
  const { record } = sample();
  assert.equal(record.observed_at, "2026-09-15T00:10:00.000Z");
  assert.equal(record.source_sha, "abc123");
  assert.equal(record.authority, "carl");
  assert.equal(record.auto_merge, false);
  assert.equal(record.live, false);
  assert.equal(record.executed, true);
  assert.equal(record.verified, false);
  assert.equal(record.dispatch_count, 1);
  assert.equal(record.dispatch_failed, 1);
  assert.equal(verifyMeasurementRecord(record), true);
  assertMeasurementRecordSafe(record);
});

test("tampering invalidates the measurement record", () => {
  const { record } = sample();
  const tampered = { ...record, dispatch_failed: 99 };
  assert.equal(verifyMeasurementRecord(tampered), false);
});

test("ranking readback is linked by digest", () => {
  const { record, ranking } = sample();
  assert.doesNotThrow(() => assertRecordMatchesRanking(record, { seal: { digest: record.ranking_digest } }));
  assert.throws(() => assertRecordMatchesRanking(record, { seal: { digest: "different" } }), /MEASUREMENT_RECORD_RANKING_MISMATCH/);
  assert.doesNotThrow(() => assertRecordMatchesRanking(emptyMeasurementRecord(), ranking));
});

test("summary never mints verification or LIVE", () => {
  const { record } = sample();
  const summary = measurementRecordSummary(record);
  assert.equal(summary.verified, false);
  assert.equal(summary.live, false);
  assert.equal(summary.auto_merge, false);
});
