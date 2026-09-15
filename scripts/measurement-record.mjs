#!/usr/bin/env node
/**
 * ACORN MEASUREMENT RECORD
 * A dated state linking the measured cycle evidence without becoming authority.
 * The record is integrity-checked on readback before prior measurement evidence is reused.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { evidenceDigest, sealEvidence, verifyEvidenceSeal } from "./evidence-seal.mjs";

export const MEASUREMENT_RECORD_VERSION = "measurement-record.v1";
export const MEASUREMENT_RECORD_ARTIFACT = "measurement-record";

export function emptyMeasurementRecord() {
  return {
    v: MEASUREMENT_RECORD_VERSION,
    observed_at: null,
    source_sha: null,
    authority: "carl",
    auto_merge: false,
    live: false,
    executed: false,
    verified: false,
    previous_record_digest: null,
    ranking_digest: null,
    feedback_digest: null,
    memory_index_digest: null,
    dispatch_count: 0,
    dispatch_failed: 0,
    integrity: "UNSEALED",
  };
}

export function buildMeasurementRecord({ env = process.env, observedAt = new Date().toISOString(), observation = {}, ranking = null, feedback = null, memoryIndex = null, dispatches = [], previousRecord = null } = {}) {
  const record = {
    ...emptyMeasurementRecord(),
    observed_at: observedAt,
    source_sha: env.GITHUB_SHA || null,
    executed: true,
    previous_record_digest: previousRecord?.seal?.digest || null,
    ranking_digest: ranking?.seal?.digest || evidenceDigest(ranking || {}),
    feedback_digest: feedback?.seal?.digest || evidenceDigest(feedback || {}),
    memory_index_digest: evidenceDigest(memoryIndex || {}),
    dispatch_count: dispatches.filter((item) => item?.state === "DISPATCHED").length,
    dispatch_failed: dispatches.filter((item) => item?.state === "DISPATCH_FAILED").length,
    observation: {
      observed: observation?.observed !== false,
      source: observation?.source || "cognitive-worker",
    },
  };
  return sealEvidence(record);
}

export function assertMeasurementRecordSafe(record = {}) {
  if (record?.live !== false) throw new Error("MEASUREMENT_RECORD_LIVE_FORBIDDEN");
  if (record?.auto_merge !== false) throw new Error("MEASUREMENT_RECORD_AUTO_MERGE_FORBIDDEN");
  if (record?.authority !== "carl") throw new Error("MEASUREMENT_RECORD_AUTHORITY_INVALID");
  if (record?.integrity === "CONFLICT") throw new Error("MEASUREMENT_RECORD_INTEGRITY_CONFLICT");
  return true;
}

export function verifyMeasurementRecord(record = {}) {
  return verifyEvidenceSeal(record) && record.v === MEASUREMENT_RECORD_VERSION;
}

function artifactFile(dir) {
  const candidates = [join(dir, "measurement-record.json"), join(dir, MEASUREMENT_RECORD_ARTIFACT, "measurement-record.json")];
  return candidates.find((path) => existsSync(path)) || null;
}

function readRunRecord(run, dir, runCommand) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  runCommand("gh", ["run", "download", String(run.databaseId), "--repo", run.repository, "--name", MEASUREMENT_RECORD_ARTIFACT, "--dir", dir], { encoding: "utf8", stdio: "pipe" });
  const file = artifactFile(dir);
  if (!file) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export function loadMeasurementRecord(run = execFileSync, env = process.env) {
  const fallback = emptyMeasurementRecord();
  if (!env.GITHUB_REPOSITORY) return fallback;
  const dir = join(process.cwd(), ".measurement-record-readback");
  mkdirSync(dir, { recursive: true });
  try {
    const raw = run("gh", ["run", "list", "--workflow", "cognitive-worker.yml", "--repo", env.GITHUB_REPOSITORY, "--status", "success", "--limit", "10", "--json", "databaseId,headSha"], { encoding: "utf8", stdio: "pipe" });
    const runs = JSON.parse(raw || "[]")
      .filter((item) => item?.databaseId && item?.headSha && item.headSha !== env.GITHUB_SHA)
      .map((item) => ({ ...item, repository: env.GITHUB_REPOSITORY }));
    if (!runs.length) return fallback;

    let prior = null;
    let priorRunIndex = -1;
    for (let index = 0; index < runs.length; index += 1) {
      const candidate = readRunRecord(runs[index], dir, run);
      if (!candidate) continue;
      if (!verifyMeasurementRecord(candidate)) return { ...fallback, integrity: "CONFLICT" };
      prior = candidate;
      priorRunIndex = index;
      break;
    }
    if (!prior) return fallback;

    if (prior.previous_record_digest) {
      let predecessor = null;
      for (let index = priorRunIndex + 1; index < runs.length; index += 1) {
        const candidate = readRunRecord(runs[index], dir, run);
        if (!candidate) continue;
        predecessor = candidate;
        break;
      }
      if (!predecessor || !verifyMeasurementRecord(predecessor) || predecessor.seal?.digest !== prior.previous_record_digest) {
        return { ...fallback, integrity: "CONFLICT" };
      }
    }
    return { ...prior, integrity: "VERIFIED" };
  } catch {
    return fallback;
  } finally {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
  }
}

export function assertRecordMatchesRanking(record = emptyMeasurementRecord(), ranking = {}) {
  if (!record?.observed_at || !record?.ranking_digest) return true;
  const digest = ranking?.seal?.digest || null;
  if (!digest) throw new Error("MEASUREMENT_RECORD_RANKING_MISSING");
  if (record.ranking_digest !== digest) throw new Error("MEASUREMENT_RECORD_RANKING_MISMATCH");
  return true;
}

export function measurementRecordSummary(record = {}) {
  return {
    v: record.v || MEASUREMENT_RECORD_VERSION,
    observed_at: record.observed_at || null,
    source_sha: record.source_sha || null,
    previous_record_digest: record.previous_record_digest || null,
    integrity: record.integrity || "UNKNOWN",
    executed: record.executed === true,
    verified: record.verified === true,
    dispatch_count: Number(record.dispatch_count || 0),
    dispatch_failed: Number(record.dispatch_failed || 0),
    authority: record.authority || "carl",
    auto_merge: false,
    live: false,
  };
}
