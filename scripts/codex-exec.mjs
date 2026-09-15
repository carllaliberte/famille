#!/usr/bin/env node
/**
 * Local Codex execution adapter.
 *
 * This is intentionally separate from the work-loop transport layer: Codex CLI
 * is authenticated through its own ChatGPT/Codex session, not an API key.
 * The adapter never merges and does not fabricate success when the CLI is absent.
 */
import { execFileSync, spawnSync } from "node:child_process";

export const EXEC_VERSION = "codex-exec.v0";

export function codexAvailable(spawn = spawnSync) {
  const probe = spawn("codex", ["--version"], { encoding: "utf8", stdio: "pipe" });
  return probe.status === 0;
}

export function executeCodex(task, opts = {}) {
  const spawn = opts.spawn || spawnSync;
  const exec = opts.exec || execFileSync;
  const root = task.root || process.cwd();
  const prompt = [
    `Task ID: ${task.task_id}`,
    `Intent: ${task.intent || "Implement the requested coding task."}`,
    "Read the repository context needed to solve the task.",
    "Implement the task directly in the current workspace.",
    "Run the requested tests when possible.",
    "Do not merge, push, publish, or modify production systems.",
  ].join("\n");

  if (!codexAvailable(spawn)) {
    return {
      v: EXEC_VERSION,
      execution_mode: "codex",
      patch_source: "unavailable",
      execution_status: "UNAVAILABLE",
      reason: "codex CLI unavailable",
      files_changed: [],
    };
  }

  const before = exec("git", ["diff", "--name-only"], {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe",
  }).trim().split("\n").filter(Boolean);

  const result = spawn("codex", ["exec", prompt], {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.status !== 0) {
    return {
      v: EXEC_VERSION,
      execution_mode: "codex",
      patch_source: "codex",
      execution_status: "CODEX_FAILED",
      reason: String(result.stderr || result.stdout || `exit ${result.status}`).slice(0, 800),
      files_changed: [],
    };
  }

  const after = exec("git", ["diff", "--name-only"], {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe",
  }).trim().split("\n").filter(Boolean);
  const files_changed = after.filter((file) => !before.includes(file));

  return {
    v: EXEC_VERSION,
    execution_mode: "codex",
    patch_source: "codex",
    execution_status: files_changed.length ? "PATCHED" : "NO_CHANGE",
    files_changed: files_changed.map((path) => ({ path, status: "MODIFIED_BY_CODEX" })),
  };
}

if (process.argv[1]?.endsWith("codex-exec.mjs")) {
  const raw = process.env.CODEX_TASK;
  if (!raw) {
    console.error("CODEX_TASK required");
    process.exitCode = 2;
  } else {
    const result = executeCodex(JSON.parse(raw));
    console.log(JSON.stringify(result, null, 2));
    if (result.execution_status === "UNAVAILABLE") process.exitCode = 3;
    if (result.execution_status === "CODEX_FAILED") process.exitCode = 4;
  }
}
