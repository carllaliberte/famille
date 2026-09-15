import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FRICTION_THRESHOLD,
  detectDrift,
  detectLoopNoProgress,
  emptyMemory,
  measureFriction,
  onUserFrictionThreshold,
  recognizeIntent,
  recordCorrection,
  recordErrorSignature,
  recordFriction,
  refuseUnprovenCompletion,
  reloadCurrentState,
  rememberUserRequest,
  selfCorrect,
  wouldBlindRetry,
} from "../scripts/codex-autonomy.mjs";

describe("USER friction invariant — Acorn self-corrects first", () => {
  it("USER-01 request formulated once remains known across steps", () => {
    const memory = emptyMemory();
    rememberUserRequest(memory, "Fix the 404 free model so Codex can write", 1);
    const later = recognizeIntent(memory, "Fix the 404 free model so Codex can write");
    assert.equal(later.same, true);
    assert.equal(later.kind, "exact");
    assert.equal(later.reset, false);
    assert.match(memory.active_intent.text, /404/);
  });

  it("USER-02 reformulation is the same intent — no reset", () => {
    const memory = emptyMemory();
    rememberUserRequest(memory, "Fix the 404 free model so Codex can write", 1);
    const later = recognizeIntent(memory, "The free model 404 must be fixed for Codex");
    assert.equal(later.same, true);
    assert.equal(later.kind, "semantic");
    assert.equal(later.reset, false);
    assert.equal(memory.active_intent.text.includes("404"), true);
  });

  it("USER-03 drift is detected before the user has to say so", () => {
    const memory = emptyMemory();
    rememberUserRequest(memory, "Fix the 404 free model", 1);
    const drift = detectDrift({
      memory,
      currentAction: "add a decorative swarm fabric synapse layer",
    });
    assert.equal(drift.drift, true);
    assert.equal(drift.status, "DRIFT_DETECTED");
    assert.ok(drift.signals.includes("intent_drift"));
    const fix = selfCorrect({ memory, currentAction: "add a decorative swarm fabric synapse layer", now: 2 });
    assert.equal(fix.next, "REALIGN_TO_ACTIVE_INTENT");
    assert.equal(fix.repaired, true);
  });

  it("USER-04 recoverable error is classified without asking the user", () => {
    const memory = emptyMemory();
    recordErrorSignature(memory, { category: "CODEX", message: "boom", sha: "s", now: 1 });
    const retry = wouldBlindRetry(memory, { category: "CODEX", message: "boom" });
    assert.equal(retry.blind, true);
    assert.equal(retry.action, "INVESTIGATE_ROOT_CAUSE");
    const aligned = detectDrift({ memory, currentAction: "repair boom root cause" });
    assert.equal(aligned.aligned, true);
  });

  it("USER-05 repetitive loop with no progress is stopped", () => {
    const loop = detectLoopNoProgress({
      recentActions: [
        { action: "codex exec", result: "CODEX_FAILED" },
        { action: "codex exec", result: "CODEX_FAILED" },
        { action: "codex exec", result: "CODEX_FAILED" },
      ],
    });
    assert.equal(loop.loop, true);
    assert.equal(loop.status, "LOOP_NO_PROGRESS");
    const ok = detectLoopNoProgress({
      recentActions: [
        { action: "codex exec", result: "CODEX_FAILED" },
        { action: "codex exec", result: "PATCHED" },
      ],
    });
    assert.equal(ok.loop, false);
  });

  it("USER-06 stale SHA reloads current state", () => {
    const memory = emptyMemory();
    memory.last_main_sha = "old";
    const reload = reloadCurrentState(memory, { sha: "new", now: 9 });
    assert.equal(reload.reloaded, true);
    assert.equal(reload.signal, "stale_state");
    assert.equal(memory.last_main_sha, "new");
    assert.equal(memory.friction.context_loss_count >= 1, true);
  });

  it("USER-07 two intelligences out of sync is detected by Acorn", () => {
    const drift = detectDrift({
      memory: emptyMemory(),
      astraState: { intent: "fix 404 free model" },
      codexState: { action: "open a merge to main" },
    });
    assert.equal(drift.drift, true);
    assert.ok(drift.signals.includes("agent_desynchronization"));
  });

  it("USER-08 completed work is not repeated", () => {
    const memory = emptyMemory();
    memory.completed = [{ number: 513, title: "done" }];
    const drift = detectDrift({ memory, currentAction: "keep going", taskNumber: 513 });
    assert.ok(drift.signals.includes("already_done_work_repeated"));
  });

  it("USER-09 unproven completion is refused", () => {
    const fake = refuseUnprovenCompletion({ claimed: true, status: "PATCHED", patch_source: "none", testsPassed: false });
    assert.equal(fake.accepted, false);
    assert.equal(fake.status, "FALSE_COMPLETION");
    const real = refuseUnprovenCompletion({ claimed: true, status: "PATCHED", patch_source: "codex", testsPassed: true });
    assert.equal(real.accepted, true);
    assert.equal(real.status, "VERIFIED");
  });

  it("USER-10 real human decision is explicit HUMAN_REQUIRED, not a silent skip", () => {
    const memory = emptyMemory();
    recordFriction(memory, "same_request_repeated", 1);
    recordFriction(memory, "same_correction_repeated", 2);
    recordFriction(memory, "known_failure_repeated", 3);
    const f = measureFriction(memory);
    assert.equal(f.threshold, FRICTION_THRESHOLD);
    assert.equal(f.threshold_reached, true);
    const gate = onUserFrictionThreshold(memory);
    assert.equal(gate.stop, true);
    assert.equal(gate.status, "SELF_CORRECT");
    assert.match(gate.reason, /USER_FRICTION/);
  });

  it("constraint never-merge is detected as previous_constraint_ignored", () => {
    const memory = emptyMemory();
    rememberUserRequest(memory, "Keep coding", 1);
    const drift = detectDrift({ memory, currentAction: "merge to main now" });
    assert.ok(drift.signals.includes("previous_constraint_ignored"));
  });

  it("repeated identical user correction is recorded, not forgotten", () => {
    const memory = emptyMemory();
    recordCorrection(memory, "Do not spend paid credits", 1);
    recordCorrection(memory, "Do not spend paid credits", 2);
    assert.equal(memory.corrections.length, 2);
    assert.equal(memory.friction.correction_count >= 1, true);
  });
});
