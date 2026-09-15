import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { loadTask, runCodexLoop } from "../scripts/codex-loop.mjs";

describe("codex work loop", () => {
  it("rejects a task without task_id", () => {
    assert.throws(() => loadTask({}), /task_id/);
  });

  it("does not treat missing API key as Codex absent", () => {
    const root = mkdtempSync(join(tmpdir(), "codex-loop-"));
    writeFileSync(join(root, "note.txt"), "hello\n");
    const ev = runCodexLoop(
      { task_id: "t-read", intent: "read only", read: ["note.txt"], root },
      { env: { ACORN_SYSTEM_MODE: "RUN" } },
    );
    assert.equal(ev.transport, "none");
    assert.equal(ev.transport_status, "UNAVAILABLE");
    assert.equal(ev.execution_status, "NEED_PATCHES");
    assert.equal(ev.files_read[0].status, "READ");
    assert.equal(ev.auto_merge, false);
    assert.equal(ev.live, false);
    assert.equal(ev.authority, "carl");
  });

  it("blocks when breaker is OFF", () => {
    const ev = runCodexLoop(
      { task_id: "t-off", patches: [{ path: "x.js", content: "1" }] },
      { env: { ACORN_SYSTEM_MODE: "OFF" } },
    );
    assert.equal(ev.execution_status, "BLOCKED_BY_BREAKER");
    assert.equal(ev.files_changed.length, 0);
  });

  it("applies a patch, runs tests, never merges", () => {
    const root = mkdtempSync(join(tmpdir(), "codex-loop-"));
    writeFileSync(join(root, "src.txt"), "old\n");
    const ev = runCodexLoop(
      {
        task_id: "t-patch",
        intent: "replace src",
        read: ["src.txt"],
        patches: [{ path: "src.txt", content: "new\n" }],
        tests: ["test/codex-loop.test.js"],
        root,
      },
      {
        env: { ACORN_SYSTEM_MODE: "RUN" },
        exec: () => "ok",
        branch_or_pr: "feat/codex-work-loop",
      },
    );
    assert.equal(readFileSync(join(root, "src.txt"), "utf8"), "new\n");
    assert.equal(ev.execution_status, "VALIDATED");
    assert.equal(ev.tests_result, "PASS");
    assert.equal(ev.auto_merge, false);
    assert.equal(ev.branch_or_pr, "feat/codex-work-loop");
  });

  it("rejects path escape", () => {
    const root = mkdtempSync(join(tmpdir(), "codex-loop-"));
    const ev = runCodexLoop(
      {
        task_id: "t-esc",
        patches: [{ path: "../outside.txt", content: "no" }],
        root,
      },
      { env: { ACORN_SYSTEM_MODE: "RUN" } },
    );
    assert.equal(ev.execution_status, "PATCH_REJECTED");
  });
});
