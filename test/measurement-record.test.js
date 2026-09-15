import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertMeasurementRecordSafe,
  assertRecordMatchesRanking,
  buildMeasurementRecord,
  emptyMeasurementRecord,
  loadMeasurementRecord,
  measurementRecordSummary,
  verifyMeasurementRecord,
} from "../scripts/measurement-record.mjs";

const env = { GITHUB_SHA: "abc123", GITHUB_REPOSITORY: "carllaliberte/famille" };

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
  assert.equal(record.integrity, "SEALED");
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
  assert.throws(() => assertRecordMatchesRanking(record, {}), /MEASUREMENT_RECORD_RANKING_MISSING/);
  assert.doesNotThrow(() => assertRecordMatchesRanking(emptyMeasurementRecord(), ranking));
});

test("measurement records form a dated integrity chain", () => {
  const first = sample().record;
  const second = buildMeasurementRecord({
    env: { ...env, GITHUB_SHA: "def456" },
    observedAt: "2026-09-15T01:10:00.000Z",
    ranking: sample().ranking,
    feedback: sample().feedback,
    memoryIndex: sample().memoryIndex,
    previousRecord: first,
  });
  assert.equal(second.previous_record_digest, first.seal.digest);
  assert.equal(verifyMeasurementRecord(second), true);
});

test("artifact readback verifies the previous dated state", () => {
  const { record } = sample();
  const dir = join(process.cwd(), ".measurement-record-readback");
  mkdirSync(dir, { recursive: true });
  const run = (command, args) => {
    if (args[1] === "list") return JSON.stringify([{ databaseId: 123, headSha: "abc123" }]);
    if (args[1] === "download") {
      writeFileSync(join(dir, "measurement-record.json"), `${JSON.stringify(record)}\n`);
      return "";
    }
    throw new Error(`unexpected command: ${command} ${args.join(" ")}`);
  };
  const loaded = loadMeasurementRecord(run, env);
  assert.equal(loaded.integrity, "VERIFIED");
  assert.equal(loaded.ranking_digest, record.ranking_digest);
});

test("readback skips successful runs that have no measurement artifact", () => {
  const { record } = sample();
  const dir = join(process.cwd(), ".measurement-record-readback");
  mkdirSync(dir, { recursive: true });
  const run = (command, args) => {
    if (args[1] === "list") return JSON.stringify([{ databaseId: 999, headSha: "no-artifact" }, { databaseId: 123, headSha: "abc123" }]);
    if (args[1] === "download") {
      if (String(args[2]) === "999") throw new Error("artifact missing");
      writeFileSync(join(dir, "measurement-record.json"), `${JSON.stringify(record)}\n`);
      return "";
    }
    throw new Error(`unexpected command: ${command} ${args.join(" ")}`);
  };
  const loaded = loadMeasurementRecord(run, env);
  assert.equal(loaded.integrity, "VERIFIED");
});

test("artifact readback rejects a broken predecessor link", () => {
  const first = sample().record;
  const second = buildMeasurementRecord({
    env: { ...env, GITHUB_SHA: "def456" },
    observedAt: "2026-09-15T01:10:00.000Z",
    ranking: sample().ranking,
    feedback: sample().feedback,
    memoryIndex: sample().memoryIndex,
    previousRecord: first,
  });
  const dir = join(process.cwd(), ".measurement-record-readback");
  mkdirSync(dir, { recursive: true });
  const run = (command, args) => {
    if (args[1] === "list") return JSON.stringify([{ databaseId: 200, headSha: "def456" }, { databaseId: 100, headSha: "abc123" }]);
    if (args[1] === "download") {
      const id = String(args[2]);
      writeFileSync(join(dir, "measurement-record.json"), `${JSON.stringify(id === "200" ? second : { ...first, seal: { ...first.seal, digest: "tampered" } })}\n`);
      return "";
    }
    throw new Error(`unexpected command: ${command} ${args.join(" ")}`);
  };
  const loaded = loadMeasurementRecord(run, env);
  assert.equal(loaded.integrity, "CONFLICT");
});

test("summary never mints verification or LIVE", () => {
  const { record } = sample();
  const summary = measurementRecordSummary(record);
  assert.equal(summary.verified, false);
  assert.equal(summary.live, false);
  assert.equal(summary.auto_merge, false);
});

test("accepted and verified dispatches are counted as executed, not as absent", () => {
  const record = buildMeasurementRecord({
    env,
    observedAt: "2026-09-15T00:20:00.000Z",
    dispatches: [{ state: "VERIFIED" }, { state: "ACCEPTED" }, { state: "DISPATCH_FAILED" }],
  });
  assert.equal(record.dispatch_count, 2);
  assert.equal(record.dispatch_failed, 1);
  assert.equal(record.verified, true);
  assert.equal(record.integrity, "SEALED");
});
