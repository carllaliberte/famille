#!/usr/bin/env node
/**
 * ACORN WORK RECORD
 * One cycle of code/correction, fail-closed.
 * CODE ≠ TESTED ≠ EXECUTED ≠ MEASURED ≠ VERIFIED ≠ LIVE
 * Missing capability → name the tool, build it, test it, keep it. Never "can't".
 * auto_merge=false. authority=carl. Not a 7th chantier.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { sealEvidence } from "./evidence-seal.mjs";
import { resolveTool } from "./tool-resolve.mjs";

export const WORK_RECORD_VERSION = "work-record.v1";
export const STAGES = Object.freeze(["code", "tested", "executed", "measured", "verified", "live"]);
export const COMPLETENESS_STATES = Object.freeze([
  "DEFINED",
  "CODE_VERIFIED",
  "TEST_VERIFIED",
  "EXECUTED",
  "MEASURED",
  "LIVE_VERIFIED",
]);

export function emptyWorkRecord() {
  return {
    v: WORK_RECORD_VERSION,
    objective: null,
    observed: null,
    evidence: [],
    hypotheses: [],
    files: [],
    architecture: [],
    contracts: [],
    inputs: [],
    outputs: [],
    expected: null,
    errors: [],
    security: { secrets_in_logs: false, contents_write: false },
    governance: { authority: "carl", auto_merge: false, merge: "human" },
    tests: { added: [], pass: 0, fail: 0, total: 0 },
    measurements: [],
    regressions: [],
    defined_vs_executed: [],
    live: { claimed: false, proof: null, reason: null },
    provenance: { sha: null, artifacts: [] },
    missing: [],
    tools_built: [],
    tools_reuse: [],
    next: null,
    stages: { code: false, tested: false, executed: false, measured: false, verified: false, live: false },
    auto_merge: false,
    authority: "carl",
  };
}

function stageRank(stages = {}) {
  let rank = 0;
  for (const name of STAGES) {
    if (!stages[name]) break;
    rank += 1;
  }
  for (const name of STAGES.slice(rank)) {
    if (stages[name]) return { ok: false, reason: "STAGE_SKIPPED", observed: name, expected: STAGES[rank - 1] || "code" };
  }
  return { ok: true, rank };
}

export function assertWorkRecord(record) {
  if (!record || record.v !== WORK_RECORD_VERSION) {
    throw new Error("WORK_RECORD_VERSION");
  }
  if (record.auto_merge === true || record.governance?.auto_merge === true) {
    throw new Error("AUTO_MERGE_FORBIDDEN");
  }
  if (record.authority !== "carl" || record.governance?.authority !== "carl") {
    throw new Error("AUTHORITY_NOT_CARL");
  }
  const ladder = stageRank(record.stages);
  if (!ladder.ok) throw new Error(ladder.reason);
  if (record.stages?.live && record.live?.proof !== "LIVE_VERIFIED") {
    throw new Error("LIVE_WITHOUT_PROOF");
  }
  if (record.live?.claimed === true && record.live?.proof !== "LIVE_VERIFIED") {
    throw new Error("LIVE_WITHOUT_PROOF");
  }
  if (record.stages?.executed && !record.stages?.code) {
    throw new Error("EXECUTED_WITHOUT_CODE");
  }
  if (record.stages?.verified && !record.stages?.measured) {
    throw new Error("VERIFIED_WITHOUT_MEASURED");
  }
  for (const row of record.defined_vs_executed || []) {
    if (row?.executed === true && row?.defined !== true) {
      throw new Error("EXECUTED_WITHOUT_DEFINED");
    }
  }
  assertChantierComplete(record);
  return true;
}

export function completenessOf(record = {}) {
  const stages = record.stages || {};
  const states = {
    DEFINED: true,
    CODE_VERIFIED: stages.code === true,
    TEST_VERIFIED: stages.code === true && stages.tested === true,
    EXECUTED: stages.code === true && stages.tested === true && stages.executed === true,
    MEASURED: stages.code === true && stages.tested === true && stages.executed === true && stages.measured === true,
    LIVE_VERIFIED: false,
  };
  if (
    stages.live === true
    && record.live?.proof === "LIVE_VERIFIED"
    && states.MEASURED
    && stages.verified === true
  ) {
    states.LIVE_VERIFIED = true;
  }
  return states;
}

export function assertChantierComplete(record = {}) {
  const states = completenessOf(record);
  if (record.complete === true) {
    if (!states.CODE_VERIFIED || !states.TEST_VERIFIED || !states.EXECUTED || !states.MEASURED) {
      throw new Error("PREMATURE_COMPLETENESS");
    }
  }
  if (record.completeness === "LIVE_VERIFIED" && !states.LIVE_VERIFIED) {
    throw new Error("LIVE_WITHOUT_PROOF");
  }
  if (record.completeness === "EXECUTED" && !states.EXECUTED) {
    throw new Error("PREMATURE_COMPLETENESS");
  }
  if (record.completeness === "TEST_VERIFIED" && !states.TEST_VERIFIED) {
    throw new Error("PREMATURE_COMPLETENESS");
  }
  if (record.completeness === "MEASURED" && !states.MEASURED) {
    throw new Error("PREMATURE_COMPLETENESS");
  }
  return states;
}

export function buildWorkRecord(input = {}) {
  if (input.auto_merge === true || input.governance?.auto_merge === true) {
    throw new Error("AUTO_MERGE_FORBIDDEN");
  }
  if (input.authority && input.authority !== "carl") {
    throw new Error("AUTHORITY_NOT_CARL");
  }
  if (input.governance?.authority && input.governance.authority !== "carl") {
    throw new Error("AUTHORITY_NOT_CARL");
  }
  if (input.live?.claimed === true && input.live?.proof !== "LIVE_VERIFIED") {
    throw new Error("LIVE_WITHOUT_PROOF");
  }
  if (input.stages?.live && input.live?.proof !== "LIVE_VERIFIED") {
    throw new Error("LIVE_WITHOUT_PROOF");
  }
  const record = {
    ...emptyWorkRecord(),
    ...input,
    v: WORK_RECORD_VERSION,
    governance: { ...(input.governance || {}), authority: "carl", auto_merge: false, merge: "human" },
    security: { secrets_in_logs: false, contents_write: false, ...(input.security || {}) },
    live: { claimed: false, proof: null, reason: null, ...(input.live || {}) },
    provenance: { sha: null, artifacts: [], ...(input.provenance || {}) },
    stages: { ...emptyWorkRecord().stages, ...(input.stages || {}) },
    auto_merge: false,
    authority: "carl",
    observed_at: input.observed_at || new Date().toISOString(),
  };
  if (record.live.proof !== "LIVE_VERIFIED") {
    record.live.claimed = false;
    record.stages.live = false;
  }
  assertWorkRecord(record);
  return sealEvidence(record);
}

export function nextFromMissing(missing = [], toolsBuilt = [], opts = {}) {
  const gap = (missing || []).find((row) => row?.kind === "tool" && row?.name);
  if (gap && !(toolsBuilt || []).some((tool) => tool?.name === gap.name)) {
    return resolveTool(gap, opts);
  }
  if ((missing || []).length) {
    return { decision: "HOLD_HUMAN", why: missing[0]?.why || missing[0], authority: "carl", auto_merge: false, live: false };
  }
  return { decision: "WAIT_HUMAN_MERGE", authority: "carl", auto_merge: false };
}

export function writeWorkRecord(record, dir = "evidence/work") {
  mkdirSync(dir, { recursive: true });
  const sealed = record.seal ? record : sealEvidence(record);
  writeFileSync(`${dir}/work-record.json`, JSON.stringify(sealed, null, 2) + "\n");
  return sealed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const record = buildWorkRecord({
    objective: process.argv[2] || "record this cycle",
    stages: { code: true },
    live: { proof: "LIVE_BLOCKED", reason: "not claimed" },
  });
  writeWorkRecord(record);
  console.log(JSON.stringify({ v: record.v, live: record.live, next: record.next, authority: record.authority }, null, 2));
}
