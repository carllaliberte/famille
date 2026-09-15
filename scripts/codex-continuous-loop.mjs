#!/usr/bin/env node
/**
 * Codex continuous work-loop controller.
 * One bounded task at a time: observe -> execute -> test -> evidence -> PR.
 * Never merges and never invents Codex provenance.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { runCodexLoop } from "./codex-loop.mjs";

export const CONTINUOUS_VERSION = "codex-continuous-loop.v0";

function git(args, root) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: "pipe" });
}

export function runContinuousTask(task, opts = {}) {
  const root = resolve(task.root || process.cwd());
  const status = opts.gitStatus ? opts.gitStatus(root) : git(["status", "--porcelain"], root);
  if (status.trim()) {
    return { v: CONTINUOUS_VERSION, execution_status: "WORKSPACE_NOT_CLEAN", task_id: task.task_id, patch_source: "none" };
  }
  const evidence = runCodexLoop(task, {
    ...opts,
    env: { ...process.env, ...(opts.env || {}), CODEX_EXECUTE: "true" },
    codexOptions: { ...(opts.codexOptions || {}), root },
  });
  return {
    ...evidence,
    v: CONTINUOUS_VERSION,
    auto_merge: false,
    live: false,
    authority: "carl",
    next_action:
      evidence.patch_source === "codex" && evidence.tests_result === "PASS"
        ? "OPEN_PR_FOR_CARL"
        : evidence.execution_status === "UNAVAILABLE"
          ? "WAIT_FOR_CODEX"
          : evidence.execution_status === "TESTS_FAILED"
            ? "RETRY_WITH_CODEX"
            : "HUMAN_REVIEW",
  };
}

export function writeEvidence(evidence, root = process.cwd()) {
  const path = resolve(root, "evidence/codex/continuous-loop.json");
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, `${JSON.stringify(evidence, null, 2)}\n`);
  return path;
}

if (process.argv[1]?.endsWith("codex-continuous-loop.mjs")) {
  const raw = process.env.CODEX_TASK;
  if (!raw) {
    console.error("CODEX_TASK required");
    process.exitCode = 2;
  } else {
    const evidence = runContinuousTask(JSON.parse(raw));
    writeEvidence(evidence);
    console.log(JSON.stringify(evidence, null, 2));
  }
}
