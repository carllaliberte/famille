import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runContinuousTask } from "../scripts/codex-continuous-loop.mjs";

describe("Codex continuous work loop", () => {
  it("refuses a dirty workspace", () => {
    const result = runContinuousTask(
      { task_id: "dirty", root: "." },
      { gitStatus: () => "uncommitted.js\n" },
    );
    assert.equal(result.execution_status, "WORKSPACE_NOT_CLEAN");
    assert.equal(result.patch_source, "none");
  });

  it("keeps unavailable Codex distinct from operator execution", () => {
    const result = runContinuousTask(
      { task_id: "unavailable", root: "." },
      {
        gitStatus: () => "",
        codexExecute: () => ({ execution_mode: "codex", patch_source: "unavailable", execution_status: "UNAVAILABLE", files_changed: [] }),
      },
    );
    assert.equal(result.patch_source, "unavailable");
    assert.equal(result.next_action, "WAIT_FOR_CODEX");
    assert.equal(result.auto_merge, false);
  });
});
