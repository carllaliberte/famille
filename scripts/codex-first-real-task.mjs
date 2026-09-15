#!/usr/bin/env node
/**
 * Controlled first-real-task harness for Codex.
 *
 * This runner is intentionally local: it requires the Codex CLI session, starts
 * from a clean workspace, lets Codex edit the workspace, runs the focused test,
 * and writes evidence. It never pushes or merges.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { runCodexLoop } from "./codex-loop.mjs";

const root = process.cwd();
const taskPath = resolve(root, "tasks/codex/first-real-task.json");
const evidencePath = resolve(root, "evidence/codex/first-real-task.json");
const task = JSON.parse(readFileSync(taskPath, "utf8"));

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: "pipe" });
}

const before = git(["status", "--porcelain"]);
if (before.trim()) {
  throw new Error("WORKSPACE_NOT_CLEAN");
}

const evidence = runCodexLoop(task, {
  env: { ...process.env, CODEX_EXECUTE: "true" },
  codexOptions: { root },
});

if (evidence.patch_source === "codex") {
  try {
    execFileSync("node", ["--test", "test/codex-exec.test.js"], {
      cwd: root,
      encoding: "utf8",
      stdio: "pipe",
    });
    evidence.tests_run = ["node --test test/codex-exec.test.js"];
    evidence.tests_result = "PASS";
    evidence.execution_status = evidence.execution_status === "PATCHED" ? "VALIDATED" : evidence.execution_status;
  } catch (err) {
    evidence.tests_run = ["node --test test/codex-exec.test.js"];
    evidence.tests_result = "FAIL";
    evidence.tests_error = String(err?.message || err).slice(0, 800);
    evidence.execution_status = "TESTS_FAILED";
  }
}

evidence.task_id = task.task_id;
evidence.execution_mode = evidence.execution_mode || "codex";
evidence.branch_or_pr = process.env.CODEX_BRANCH || null;
evidence.commit_sha = process.env.GITHUB_SHA || null;
evidence.auto_merge = false;
evidence.live = false;
evidence.authority = "carl";
evidence.generated_at = new Date().toISOString();

mkdirSync(resolve(evidencePath, ".."), { recursive: true });
writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));

if (evidence.execution_status === "UNAVAILABLE") process.exitCode = 3;
if (evidence.execution_status === "CODEX_FAILED") process.exitCode = 4;
if (evidence.execution_status === "TESTS_FAILED") process.exitCode = 5;
