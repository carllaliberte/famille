import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { evidenceDigest, verifyEvidenceSeal } from "../scripts/evidence-seal.mjs";
import { emptyRanking, rankAgents } from "../scripts/measured-ranking.mjs";
import {
  assertMeasurementRecordSafe,
  assertRecordMatchesRanking,
  buildMeasurementRecord,
  emptyMeasurementRecord,
  loadMeasurementRecord,
  loadPriorMeasuredCycle,
} from "../scripts/measurement-record.mjs";
import { emptyCollaborationMemory } from "../scripts/collaboration-memory.mjs";
import { emptyModelExecutionMemory } from "../scripts/model-execution-memory.mjs";
import { emptyMemory } from "../scripts/synaptic-memory.mjs";
import { runWorker } from "../scripts/cognitive-worker.mjs";

const env = { GITHUB_SHA: "abc123", GITHUB_REPOSITORY: "carllaliberte/famille", ACORN_SYSTEM_MODE: "RUN" };

const agents = [
  { id: "astra", name: "Astra", kind: "model", specialty: "software-engineering", capabilities: ["review"] },
  { id: "grok", name: "Grok", kind: "model", specialty: "independent", capabilities: ["review"] },
];

function rankingA(at = "2026-09-16T00:00:00.000Z") {
  return rankAgents(agents, {
    v: "cognitive-memory-index.v1",
    observed_at: at,
    authority: "carl",
    auto_merge: false,
    live: false,
    edges: [{ type: "model-execution", id: "astra", attempts: 5, succeeded: 5 }],
  }, at);
}

function rankingB(at = "2026-09-16T00:01:00.000Z") {
  return rankAgents(agents, {
    v: "cognitive-memory-index.v1",
    observed_at: at,
    authority: "carl",
    auto_merge: false,
    live: false,
    edges: [{ type: "model-execution", id: "grok", attempts: 5, succeeded: 5 }],
  }, at);
}

function recordFor(ranking, sha = "abc123", previousRecord = null) {
  return buildMeasurementRecord({
    env: { ...env, GITHUB_SHA: sha },
    observedAt: ranking.observed_at,
    ranking,
    feedback: { v: "measurement-feedback.v1", authority: "carl", auto_merge: false, live: false, actions: [] },
    memoryIndex: { v: "cognitive-memory-index.v1", authority: "carl", auto_merge: false, live: false, edges: [] },
    previousRecord,
  });
}

function mockCycle({ runs, records = {}, rankings = {} }) {
  return (_cmd, args) => {
    if (args[1] === "list") return JSON.stringify(runs);
    if (args[1] === "download") {
      const id = String(args[2]);
      const name = args[args.indexOf("--name") + 1];
      const dir = args[args.indexOf("--dir") + 1];
      mkdirSync(dir, { recursive: true });
      if (name === "measurement-record") {
        if (!records[id]) throw new Error("measurement-record missing");
        writeFileSync(join(dir, "measurement-record.json"), `${JSON.stringify(records[id])}\n`);
        return "";
      }
      if (name === "measured-intelligence-ranking") {
        if (!rankings[id]) throw new Error("measured-intelligence-ranking missing");
        writeFileSync(join(dir, "measured-intelligence-ranking.json"), `${JSON.stringify(rankings[id])}\n`);
        return "";
      }
      throw new Error(`unexpected artifact ${name}`);
    }
    throw new Error(`unexpected command ${_cmd} ${args.join(" ")}`);
  };
}

test("1. ranking + measurement-record from the same sealed object PASS", () => {
  const ranking = rankingA();
  const record = recordFor(ranking);
  assert.equal(record.ranking_digest, ranking.seal.digest);
  assert.doesNotThrow(() => assertRecordMatchesRanking(record, ranking));
  assertMeasurementRecordSafe(record);
  assert.equal(record.live, false);
  assert.equal(record.auto_merge, false);
  assert.equal(record.authority, "carl");
  assert.equal(ranking.live, false);
  assert.equal(ranking.auto_merge, false);
  assert.equal(ranking.authority, "carl");
});

test("2. unpaired digests throw MEASUREMENT_RECORD_RANKING_MISMATCH (runs 35027997639 vs 35027995526)", () => {
  const previousRanking = { seal: { digest: "7f6736e19ffb46fbc105683986a3bd452f5ea07c3c1c3b203fc93a240460c0d9" } };
  const previousMeasurementRecord = {
    observed_at: "2026-09-15T21:52:22.628Z",
    ranking_digest: "f7289eb393a27d6dfbdc5c812bd49eade24f5d96531272e923ed56a0e81f7b78",
  };
  assert.notEqual(previousMeasurementRecord.ranking_digest, previousRanking.seal.digest);
  assert.throws(
    () => assertRecordMatchesRanking(previousMeasurementRecord, previousRanking),
    /MEASUREMENT_RECORD_RANKING_MISMATCH/,
  );
});

test("3. same-run ranking missing or unverified is CONFLICT, never PASS", () => {
  const ranking = rankingA();
  const record = recordFor(ranking, "pr-head-sha");
  const gh = mockCycle({
    runs: [{ databaseId: 39, headSha: "merge-head-sha" }],
    records: { 39: record },
    rankings: {},
  });
  const prior = loadPriorMeasuredCycle(gh, env);
  assert.equal(prior.record.integrity, "CONFLICT");
  assert.equal(prior.ranking.integrity, "CONFLICT");
  assert.throws(() => assertMeasurementRecordSafe(prior.record), /MEASUREMENT_RECORD_INTEGRITY_CONFLICT/);
});

test("4. same ranking reloaded keeps the same digest", () => {
  const ranking = rankingA();
  const reloaded = JSON.parse(JSON.stringify(ranking));
  assert.equal(reloaded.seal.digest, ranking.seal.digest);
  assert.equal(verifyEvidenceSeal(reloaded), true);
  assert.equal(evidenceDigest(reloaded), ranking.seal.digest);
});

test("5. a real ranking change produces a different digest", () => {
  const a = rankingA();
  const b = rankingB();
  assert.notEqual(a.seal.digest, b.seal.digest);
  assert.equal(a.measured[0].id, "astra");
  assert.equal(b.measured[0].id, "grok");
});

test("paired loader keeps PR source_sha even when it differs from Actions headSha", () => {
  const ranking = rankingA();
  const record = recordFor(ranking, "86877dafec623b8764108f2086a6cd727bec414a");
  const gh = mockCycle({
    runs: [{ databaseId: 39, headSha: "4b7b3b1c221e0bc472aa3afbb203c64c295d8061" }],
    records: { 39: record },
    rankings: { 39: ranking },
  });
  const prior = loadPriorMeasuredCycle(gh, env);
  assert.equal(prior.runId, 39);
  assert.equal(prior.record.integrity, "VERIFIED");
  assert.equal(prior.ranking.integrity, "VERIFIED");
  assert.equal(prior.record.source_sha, "86877dafec623b8764108f2086a6cd727bec414a");
  assert.equal(prior.record.ranking_digest, prior.ranking.seal.digest);
  assert.doesNotThrow(() => assertRecordMatchesRanking(prior.record, prior.ranking));
});

test("record-only readback still loads when source_sha differs from run headSha", () => {
  const ranking = rankingA();
  const record = recordFor(ranking, "pr-head");
  const run = (_cmd, args) => {
    if (args[1] === "list") return JSON.stringify([{ databaseId: 39, headSha: "merge-head" }]);
    if (args[1] === "download") {
      const dir = args[args.indexOf("--dir") + 1];
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "measurement-record.json"), `${JSON.stringify(record)}\n`);
      return "";
    }
    throw new Error("unexpected");
  };
  const loaded = loadMeasurementRecord(run, env);
  assert.equal(loaded.integrity, "VERIFIED");
  assert.equal(loaded.ranking_digest, record.ranking_digest);
});

test("paired loader never joins ranking from run A with record from run B", () => {
  const rank39 = rankingA("2026-09-15T21:52:23.805Z");
  const rank26 = rankingB("2026-09-15T21:52:22.628Z");
  const rec39 = recordFor(rank39, "pr-head");
  const rec26 = recordFor(rank26, "4b7b3b1c221e0bc472aa3afbb203c64c295d8061");
  assert.notEqual(rank39.seal.digest, rec26.ranking_digest);
  const gh = mockCycle({
    runs: [
      { databaseId: 39, headSha: "4b7b3b1c221e0bc472aa3afbb203c64c295d8061" },
      { databaseId: 26, headSha: "4b7b3b1c221e0bc472aa3afbb203c64c295d8061" },
    ],
    records: { 39: rec39, 26: rec26 },
    rankings: { 39: rank39, 26: rank26 },
  });
  const prior = loadPriorMeasuredCycle(gh, env);
  assert.equal(prior.runId, 39);
  assert.equal(prior.record.ranking_digest, rank39.seal.digest);
  assert.notEqual(prior.record.ranking_digest, rec26.ranking_digest);
  assert.doesNotThrow(() => assertRecordMatchesRanking(prior.record, prior.ranking));
});

test("6. cognitive-worker chain with paired prior PASS", () => {
  const previousRanking = rankingA();
  const previousMeasurementRecord = recordFor(previousRanking);
  const evidence = runWorker({
    env,
    gh: () => { throw new Error("gh should not be required for a fully injected cycle"); },
    agents,
    memory: emptyMemory(),
    collaborationMemory: emptyCollaborationMemory(),
    modelExecutionMemory: emptyModelExecutionMemory(),
    memoryIndex: {
      v: "cognitive-memory-index.v1",
      observed_at: "2026-09-16T00:02:00.000Z",
      authority: "carl",
      auto_merge: false,
      live: false,
      edges: [{ type: "model-execution", id: "astra", attempts: 5, succeeded: 5 }],
      sources: {},
      conflicts: [],
      status_counts: { configured: 0, attempted: 0, succeeded: 0, verified: 0, live: 0 },
    },
    previousRanking,
    previousMeasurementRecord,
    frontsText: "",
    dispatch: false,
  });
  assert.equal(evidence.live, false);
  assert.equal(evidence.auto_merge, false);
  assert.equal(evidence.authority, "carl");
  assert.equal(evidence.executed, true);
  const nextRanking = evidence.cycle_state.ranking;
  const nextRecord = evidence.cycle_state.record;
  assert.equal(nextRecord.ranking_digest, nextRanking.seal.digest);
  assert.doesNotThrow(() => assertRecordMatchesRanking(nextRecord, nextRanking));
  assert.equal(nextRanking.live, false);
  assert.equal(nextRecord.live, false);
});

test("empty prior cycle does not mint READY", () => {
  const prior = loadPriorMeasuredCycle(() => { throw new Error("no gh"); }, {});
  assert.equal(prior.record.integrity, "UNSEALED");
  assert.equal(prior.ranking.integrity, "UNSEALED");
  assert.equal(prior.record.executed, false);
  assert.equal(prior.record.verified, false);
  assert.doesNotThrow(() => assertRecordMatchesRanking(prior.record, prior.ranking));
  assert.deepEqual(emptyRanking().measured, []);
  assert.equal(emptyMeasurementRecord().ranking_digest, null);
});

test("sibling successful runs do not break the predecessor digest chain", () => {
  const parentRanking = rankingA("2026-09-15T21:28:11.443Z");
  const parentRecord = recordFor(parentRanking, "03b8662337efdf728ea7b10969ab35dd4b1633c1");
  const siblingRanking = rankingB("2026-09-15T21:52:22.628Z");
  const siblingRecord = buildMeasurementRecord({
    env: { ...env, GITHUB_SHA: "4b7b3b1c221e0bc472aa3afbb203c64c295d8061" },
    observedAt: siblingRanking.observed_at,
    ranking: siblingRanking,
    previousRecord: parentRecord,
  });
  const newestRanking = rankingA("2026-09-15T21:52:23.805Z");
  const newestRecord = buildMeasurementRecord({
    env: { ...env, GITHUB_SHA: "86877dafec623b8764108f2086a6cd727bec414a" },
    observedAt: newestRanking.observed_at,
    ranking: newestRanking,
    previousRecord: parentRecord,
  });
  assert.equal(newestRecord.previous_record_digest, parentRecord.seal.digest);
  assert.equal(siblingRecord.previous_record_digest, parentRecord.seal.digest);
  assert.notEqual(siblingRecord.seal.digest, parentRecord.seal.digest);
  const gh = mockCycle({
    runs: [
      { databaseId: 39, headSha: "4b7b3b1c221e0bc472aa3afbb203c64c295d8061" },
      { databaseId: 26, headSha: "4b7b3b1c221e0bc472aa3afbb203c64c295d8061" },
      { databaseId: 64, headSha: "03b8662337efdf728ea7b10969ab35dd4b1633c1" },
    ],
    records: { 39: newestRecord, 26: siblingRecord, 64: parentRecord },
    rankings: { 39: newestRanking, 26: siblingRanking, 64: parentRanking },
  });
  const prior = loadPriorMeasuredCycle(gh, env);
  assert.equal(prior.runId, 39);
  assert.equal(prior.record.integrity, "VERIFIED");
  assert.equal(prior.ranking.integrity, "VERIFIED");
  assert.equal(prior.record.ranking_digest, newestRanking.seal.digest);
  assert.doesNotThrow(() => assertRecordMatchesRanking(prior.record, prior.ranking));
  assertMeasurementRecordSafe(prior.record);
});
