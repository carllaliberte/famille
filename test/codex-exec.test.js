import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { codexAvailable, executeCodex } from "../scripts/codex-exec.mjs";

describe("local Codex execution adapter", () => {
  it("reports unavailable when the Codex CLI is absent", () => {
    const result = executeCodex(
      { task_id: "t-unavailable", intent: "noop", root: "." },
      { spawn: () => ({ status: 127 }) },
    );
    assert.equal(result.patch_source, "unavailable");
    assert.equal(result.execution_status, "UNAVAILABLE");
  });

  it("recognizes a working Codex CLI without requiring an API key", () => {
    assert.equal(codexAvailable(() => ({ status: 0 })), true);
  });

  it("records files changed by the Codex execution", () => {
    let calls = 0;
    const spawn = (command, args) => {
      if (args[0] === "--version") return { status: 0 };
      return { status: 0, stdout: "done\n", stderr: "" };
    };
    const exec = (_command, args) => {
      calls += 1;
      if (args[0] === "diff") return calls === 1 ? "before.js\n" : "before.js\nafter.js\n";
      return "";
    };
    const result = executeCodex(
      { task_id: "t-codex", intent: "make a small test change", root: "/repo" },
      { spawn, exec },
    );
    assert.equal(result.patch_source, "codex");
    assert.equal(result.execution_status, "PATCHED");
    assert.deepEqual(result.files_changed, [
      { path: "after.js", status: "MODIFIED_BY_CODEX" },
    ]);
  });
});
