import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AUTH_COOLDOWN_MS,
  CODEX_NODE,
  KERNEL_VERSION,
  LOOP_STEPS,
  applyLoopGuards,
  afterMergeSync,
  candidateFromMaintenance,
  candidateFromSurveillance,
  classifyRepetition,
  classifyWorkAgainstPr,
  emptyMemory,
  errorSignature,
  escalateDebug,
  evaluateTrigger,
  fabricNode,
  hydrateMemory,
  humanRequired,
  isOperativeCodexPr,
  loopPosition,
  parseTaskMetadata,
  prioritize,
  provenanceRecord,
  recordErrorSignature,
  runTruthSuite,
  scoreTask,
  selectNextWork,
  setAuthCooldown,
  shouldStopCleanly,
  simulateAbsence,
  skippedForSha,
  sovereigntyIntact
} from "../scripts/codex-autonomy.mjs";
const task = (partial) => ({
  source: "issue",
  ...partial
});
describe("acorn autonomy kernel", () => {
  it("pins kernel version and the 15-step loop", () => {
    assert.equal(KERNEL_VERSION, "acorn-autonomy.v1");
    assert.equal(LOOP_STEPS.length, 15);
    assert.equal(LOOP_STEPS[0], "OBSERVE");
    assert.equal(LOOP_STEPS.at(-1), "RESUME");
    assert.equal(LOOP_STEPS[12], "WAIT_FOR_HUMAN_MERGE");
  });
  it("parseTaskMetadata reads explainable factors from an issue body, never invents them", () => {
    const meta = parseTaskMetadata("impact: 5\nurgence: 4\nfiles: scripts/foo.mjs test/foo.test.js\ndependsOnPr: #12\nsee #513");
    assert.equal(meta.impact, 5);
    assert.equal(meta.urgency, 4);
    assert.deepEqual(meta.files, ["scripts/foo.mjs", "test/foo.test.js"]);
    assert.equal(meta.dependsOnPr, 12);
    assert.ok(meta.mentionedIssues.includes(513));
    const empty = parseTaskMetadata("Continue making the repo better.");
    assert.equal(empty.impact, undefined);
    assert.equal(empty.files.length, 0);
  });

  it("scores tasks with an explainable justification, not first-come", () => {
    const low = scoreTask(task({ id: "a", title: "low", impact: 1, urgency: 1, measureValue: 1, effort: 5, risk: 5, blockers: 3 }));
    const high = scoreTask(task({ id: "b", title: "high", impact: 5, urgency: 5, measureValue: 5, effort: 1, risk: 0, blockers: 0, architecturalCoherence: 5 }));
    assert.ok(high.score > low.score);
    assert.match(high.justification, /impact 5\/5/);
    assert.match(high.justification, /total /);
    const ranked = prioritize([
      task({ id: "a", title: "zzz-low", impact: 1, urgency: 1 }),
      task({ id: "b", title: "aaa-high", impact: 5, urgency: 5, measureValue: 5 })
    ]);
    assert.equal(ranked[0].task.id, "b");
  });
  it("does not freeze the worker on an open Codex PR when independent work exists", () => {
    const prs = [
      { number: 7, title: "codex batch", head: "codex/continuous-1", files: ["scripts/foo.mjs"], taskNumbers: [1] }
    ];
    const independent = task({
      id: "ind",
      title: "test elsewhere",
      files: ["test/bar.test.js"],
      kind: "maintenance"
    });
    const conflict = task({
      id: "c",
      title: "same files",
      files: ["scripts/foo.mjs"]
    });
    assert.equal(classifyWorkAgainstPr(independent, prs), "INDEPENDENT");
    assert.equal(classifyWorkAgainstPr(conflict, prs), "CONFLICT");
    const next = selectNextWork({
      tasks: [conflict, independent],
      openPrs: prs,
      timeLeft: true,
      taskBudget: 2
    });
    assert.equal(next.action, "EXECUTE");
    assert.equal(next.task?.id, "ind");
  });
  it("WAIT_HUMAN_MERGE when remaining work depends on the open PR", () => {
    const next = selectNextWork({
      tasks: [task({ id: "d", title: "needs merge", needsMerge: true, number: 9 })],
      openPrs: [{ number: 9, title: "x", head: "codex/x" }],
      timeLeft: true,
      taskBudget: 2
    });
    assert.equal(next.action, "WAIT_HUMAN_MERGE");
    assert.equal(next.status, "WAIT_HUMAN_MERGE");
  });
  it("never treats workflow_dispatch as required for normal operation", () => {
    const d = evaluateTrigger({
      event: "schedule",
      now: 1,
      currentSha: "s",
      memory: emptyMemory(),
      authAvailable: true,
      breakerOff: false
    });
    assert.equal(d.run, true);
    assert.doesNotMatch(d.reason, /dispatch|manuel requis/i);
  });
  it("resumes after a Codex merge and also observes a non-Codex merge SHA", () => {
    const mem = emptyMemory();
    const codex = evaluateTrigger({
      event: "pull_request",
      now: 1,
      currentSha: "bbb",
      pr: { merged: true, head: "codex/autonomie-totale", base: "main" },
      memory: mem,
      authAvailable: true,
      breakerOff: false
    });
    assert.equal(codex.run, true);
    assert.equal(codex.step, "DETECT_MERGE");
    const other = evaluateTrigger({
      event: "pull_request",
      now: 1,
      currentSha: "ccc",
      pr: { merged: true, head: "feat/docs", base: "main" },
      memory: mem,
      authAvailable: true,
      breakerOff: false
    });
    assert.equal(other.run, true);
    assert.match(other.reason, /SHA/);
    const unmerged = evaluateTrigger({
      event: "pull_request",
      now: 1,
      currentSha: "s",
      pr: { merged: false, head: "codex/x", base: "main" },
      memory: mem,
      authAvailable: true,
      breakerOff: false
    });
    assert.equal(unmerged.run, false);
  });
  it("is idempotent on the same main SHA", () => {
    const memory = emptyMemory();
    memory.last_main_sha = "same";
    const d = evaluateTrigger({
      event: "push",
      now: 2,
      currentSha: "same",
      memory,
      authAvailable: true,
      breakerOff: false
    });
    assert.equal(d.run, false);
    assert.match(d.reason, /idempotent/i);
  });
  it("cools down AUTH UNAVAILABLE on the same SHA instead of looping GitHub", () => {
    const memory = emptyMemory();
    setAuthCooldown(memory, "sha1", 1e3, AUTH_COOLDOWN_MS);
    const d = evaluateTrigger({
      event: "schedule",
      now: 1e3 + 6e4,
      currentSha: "sha1",
      memory,
      authAvailable: false,
      breakerOff: false
    });
    assert.equal(d.run, false);
    assert.equal(d.status, "WAIT");
    assert.match(d.reason, /cooldown/i);
  });
  it("debounce skips a second run on the same SHA inside 10 minutes", () => {
    const memory = emptyMemory();
    memory.measurements.push({
      status: "UNAVAILABLE",
      reason: "auth",
      at: 1e3,
      sha: "s"
    });
    const g = applyLoopGuards({ memory, sha: "s", now: 1e3 + 3e4 });
    assert.equal(g.skip, true);
    assert.match(g.reason, /debounce/);
  });
  it("escalates debug 1\u21925 and stops only at 5", () => {
    const l1 = escalateDebug({ attempt: 1, category: "CODEX" });
    const l4 = escalateDebug({ attempt: 4, category: "TEST", previousLevel: 3 });
    const l5 = escalateDebug({ attempt: 5, category: "CODEX", previousLevel: 4 });
    const gov = escalateDebug({ attempt: 1, category: "GOVERNANCE" });
    assert.equal(l1.level, 1);
    assert.equal(l1.stop, void 0);
    assert.equal(l4.level, 4);
    assert.equal(l5.level, 5);
    assert.equal(l5.stop, "HUMAN_REQUIRED");
    assert.equal(gov.level, 5);
    assert.equal(gov.stop, "ARCHITECTURAL_BLOCK");
  });
  it("HUMAN_REQUIRED records exact remaining human action", () => {
    const h = humanRequired({
      reason: "merge sovereignty",
      evidence: ["pr url"],
      attempts: 1,
      what_was_done: ["opened PR", "tests green"],
      what_remains: ["squash merge"],
      exact_human_action: "Fusionner la PR \u2014 Carl only",
      url: "https://github.com/carllaliberte/famille/pull/516"
    });
    assert.equal(h.category, "HUMAN_REQUIRED");
    assert.equal(h.exact_human_action.includes("Carl"), true);
    assert.ok(h.what_was_done.length >= 1);
    assert.ok(h.what_remains.length >= 1);
  });
  it("afterMergeSync updates SHA, drops the PR, unblocks tasks", () => {
    const memory = emptyMemory();
    memory.last_main_sha = "old";
    memory.prs = [{ number: 10, title: "x", head: "codex/x" }];
    memory.skipped_tasks = [513];
    memory.tasks = [task({ id: "t", title: "next", dependsOnPr: 10, needsMerge: true })];
    const sync = afterMergeSync({
      memory,
      previousSha: "old",
      newSha: "new",
      mergedPr: 10,
      now: 99
    });
    assert.equal(sync.changed, true);
    assert.equal(sync.memory.last_main_sha, "new");
    assert.equal(sync.memory.prs.length, 0);
    assert.equal(sync.memory.tasks[0].needsMerge, false);
    assert.equal((sync.memory.skipped_tasks || []).length, 0);
    assert.ok(sync.actions.some((a) => /reprendre/.test(a)));
  });
  it("does not honor skipped_tasks recorded against another SHA", () => {
    const memory = emptyMemory();
    memory.skipped_tasks = [513];
    memory.error_signatures = [{ signature: "ENVIRONMENT::404", sha: "old", count: 3 }];
    assert.deepEqual(skippedForSha(memory, "new"), []);
    assert.deepEqual(skippedForSha(memory, "old"), [513]);
    memory.skipped_tasks = [{ number: 513, sha: "new" }];
    assert.deepEqual(skippedForSha(memory, "new"), [513]);
    assert.deepEqual(skippedForSha(memory, "old"), []);
  });
  it("treats grok-build PRs as non-operative so Codex is not WAIT_HUMAN_MERGE'd", () => {
    assert.equal(isOperativeCodexPr({
      head: "codex/openrouter-live-free",
      body: "patch_source: grok-build\nstatus: PR_READY",
      taskNumbers: [513],
    }), false);
    assert.equal(isOperativeCodexPr({
      head: "codex/continuous-1",
      body: "patch_source: codex",
    }), true);
    assert.equal(classifyWorkAgainstPr(
      { number: 513, title: "seed", kind: "code" },
      [{ head: "codex/openrouter-live-free", body: "patch_source: grok-build", taskNumbers: [513] }]
    ), "INDEPENDENT");
  });
  it("debounce reads at_ms when at is an ISO string", () => {
    const memory = emptyMemory();
    memory.measurements.push({
      status: "CODEX_FAILED",
      at: "2026-09-15T17:21:49.000Z",
      at_ms: 1e3,
      sha: "s",
    });
    const g = applyLoopGuards({ memory, sha: "s", now: 1e3 + 3e4 });
    assert.equal(g.skip, true);
    assert.match(g.reason, /debounce/);
  });
  it("stops cleanly rather than looping forever", () => {
    assert.equal(shouldStopCleanly({
      queueLength: 0,
      justifiedWork: false,
      limitReached: false,
      repeatedError: false,
      danger: false,
      humanGovernance: false
    }).status, "IDLE");
    assert.equal(shouldStopCleanly({
      queueLength: 1,
      justifiedWork: true,
      limitReached: false,
      repeatedError: true,
      danger: false,
      humanGovernance: false
    }).status, "HUMAN_REQUIRED");
    assert.equal(shouldStopCleanly({
      queueLength: 1,
      justifiedWork: true,
      limitReached: false,
      repeatedError: false,
      danger: true,
      humanGovernance: false
    }).status, "ARCHITECTURAL_BLOCK");
  });
  it("refuses to attribute non-Codex work to Codex", () => {
    assert.throws(
      () => provenanceRecord({
        who: "codex",
        what: "edit",
        when: "now",
        why: "x",
        source: "grok-build",
        base_sha: "a",
        result_sha: "b",
        tests: [],
        repair_attempts: 0
      })
    );
    const ok = provenanceRecord({
      who: "automation",
      what: "kernel",
      when: "now",
      why: "autonomy",
      source: "autonomy-kernel",
      base_sha: "a",
      result_sha: "a",
      tests: ["autonomy.test"],
      repair_attempts: 0
    });
    assert.equal(ok.auto_merge, false);
    assert.equal(ok.live, false);
    assert.equal(ok.authority, "carl");
  });
  it("hydrates v1 memory without claiming LIVE", () => {
    const mem = hydrateMemory({
      v: "codex-worker-memory.v1",
      live: true,
      auto_merge: true,
      authority: "bot",
      completed_tasks: [{ id: "1", title: "t", source: "issue" }]
    });
    assert.equal(mem.v, "codex-worker-memory.v2");
    assert.equal(mem.live, false);
    assert.equal(mem.auto_merge, false);
    assert.equal(mem.authority, "carl");
    assert.equal(mem.completed.length, 1);
  });
  it("treats Codex as the first fabric node, without simulating others", () => {
    assert.equal(CODEX_NODE.id, "codex");
    assert.equal(CODEX_NODE.trust, "measured");
    assert.ok(CODEX_NODE.limits.includes("never merge"));
    const ghost = fabricNode({ id: "astra" });
    assert.equal(ghost.availability, "unknown");
    assert.deepEqual(ghost.capability, []);
  });
  it("maintenance and surveillance refuse unjustified inventions", () => {
    assert.equal(candidateFromMaintenance({ missingTests: ["x"] }).length, 1);
    assert.equal(candidateFromMaintenance({ missingTests: [""] }).length, 0);
    assert.equal(
      candidateFromSurveillance({ failedWorkflows: [{ name: "ci", conclusion: "success", url: "u" }] }).length,
      0
    );
    assert.equal(
      candidateFromSurveillance({
        failedWorkflows: [{ name: "ci", conclusion: "failure", url: "https://example/1" }]
      }).length,
      1
    );
  });
  it("identical error signatures collapse across punctuation/sha noise", () => {
    const a = errorSignature({ category: "CODEX", message: "fail abcdef123 patch" });
    const b = errorSignature({ category: "CODEX", message: "FAIL ABC99999 patch" });
    assert.equal(a.split("::")[0], b.split("::")[0]);
  });
  it("run lock blocks overlapping cycles", () => {
    const memory = emptyMemory();
    memory.locks.run = "34982782985";
    const g = applyLoopGuards({ memory, sha: "x", now: 9 });
    assert.equal(g.skip, true);
    assert.match(g.reason, /run lock/);
  });
  it("simulateAbsence never asks Carl to type Go", () => {
    const sim = simulateAbsence({
      hours: [0, 1, 24, 168, 720],
      sha: "deadbeef",
      authAvailable: false
    });
    assert.equal(sim.askedCarlToTypeGo, false);
    assert.equal(sim.merged, false);
    assert.equal(sim.ticks.length, 5);
  });
  it("truth suite A\u2013G all PASS in-process", () => {
    const results = runTruthSuite();
    assert.equal(results.length, 7);
    const failed = results.filter((r) => r.status !== "PASS");
    assert.deepEqual(
      failed,
      [],
      failed.map((f) => `${f.id} ${f.evidence.filter((e) => e.startsWith("fail")).join(" | ")}`).join("\n")
    );
  });
  it("loop position is honest: auth missing stays on OBSERVE, PR stays on WAIT", () => {
    assert.equal(loopPosition({ authAvailable: false, openCodexPr: false }).current, "OBSERVE");
    assert.equal(loopPosition({ authAvailable: true, openCodexPr: true }).current, "WAIT_FOR_HUMAN_MERGE");
  });
  it("sovereignty cannot be flipped by a memory payload", () => {
    const mem = emptyMemory();
    assert.equal(sovereigntyIntact(mem), true);
    assert.equal(sovereigntyIntact({ auto_merge: true, live: false, authority: "carl" }), false);
  });
  it("issues without the task label do not start a cycle", () => {
    const d = evaluateTrigger({
      event: "issues",
      now: 1,
      currentSha: "s",
      issueLabels: ["bug"],
      memory: emptyMemory(),
      authAvailable: true,
      breakerOff: false
    });
    assert.equal(d.run, false);
  });
  it("breaker OFF is HUMAN_REQUIRED, never a silent skip that looks like autonomy", () => {
    const d = evaluateTrigger({
      event: "schedule",
      now: 1,
      currentSha: "s",
      memory: emptyMemory(),
      authAvailable: true,
      breakerOff: true
    });
    assert.equal(d.run, false);
    assert.equal(d.status, "HUMAN_REQUIRED");
  });
  it("selectNextWork respects budgets before inventing work", () => {
    assert.equal(
      selectNextWork({
        tasks: [task({ id: "1", title: "t" })],
        openPrs: [],
        timeLeft: false,
        taskBudget: 3
      }).status,
      "TIME_BUDGET"
    );
    assert.equal(
      selectNextWork({
        tasks: [task({ id: "1", title: "t" })],
        openPrs: [],
        timeLeft: true,
        taskBudget: 0
      }).status,
      "TASK_BUDGET"
    );
  });
  it("repeated CODEX error \xD73 becomes HUMAN_REQUIRED; governance \xD73 architectural", () => {
    const memory = emptyMemory();
    for (let i = 0; i < 3; i++) {
      recordErrorSignature(memory, { category: "CODEX", message: "boom", sha: "z", now: i });
    }
    assert.equal(
      classifyRepetition({ memory, category: "CODEX", message: "boom", sha: "z" }).status,
      "HUMAN_REQUIRED"
    );
  });
});
