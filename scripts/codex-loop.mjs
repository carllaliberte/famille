#!/usr/bin/env node
/**
 * Codex work loop — programming path, not HTTP review.
 * Transport adapters are optional. Missing API key ≠ Codex absent.
 * Never merges. live=false. authority=carl.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { controlState } from "../.github/swarm/system-breaker.mjs";

export const LOOP_VERSION = "codex-loop.v0";

export function loadTask(raw) {
  const task = typeof raw === "string" ? JSON.parse(raw) : { ...(raw || {}) };
  const id = String(task.task_id || "").trim();
  if (!id) {
    const err = new Error("task_id required");
    err.code = "TASK_INVALID";
    throw err;
  }
  return {
    task_id: id,
    intent: String(task.intent || ""),
    read: Array.isArray(task.read) ? task.read.map(String) : [],
    patches: Array.isArray(task.patches) ? task.patches : [],
    tests: Array.isArray(task.tests) ? task.tests.map(String) : [],
    root: task.root || process.cwd(),
  };
}

export function readContext(task) {
  const files_read = [];
  for (const rel of task.read) {
    const path = resolve(task.root, rel);
    if (!existsSync(path)) {
      files_read.push({ path: rel, status: "MISSING" });
      continue;
    }
    const text = readFileSync(path, "utf8");
    files_read.push({ path: rel, status: "READ", bytes: text.length });
  }
  return files_read;
}

export function applyPatches(task) {
  const files_changed = [];
  for (const patch of task.patches) {
    const rel = String(patch.path || "").trim();
    if (!rel || rel.startsWith("/") || rel.includes("..")) {
      files_changed.push({ path: rel, status: "REJECTED_PATH" });
      continue;
    }
    const path = resolve(task.root, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, String(patch.content ?? ""));
    files_changed.push({ path: rel, status: "WRITTEN" });
  }
  return files_changed;
}

export function runTests(task, exec = execFileSync) {
  if (!task.tests.length) {
    return { tests_run: [], tests_result: "NOT_REQUESTED" };
  }
  try {
    exec("node", ["--test", ...task.tests], {
      cwd: task.root,
      encoding: "utf8",
      stdio: "pipe",
    });
    return { tests_run: task.tests, tests_result: "PASS" };
  } catch (err) {
    return {
      tests_run: task.tests,
      tests_result: "FAIL",
      tests_error: String(err?.message || err).slice(0, 400),
    };
  }
}

export function classifyTransport(env = process.env) {
  const openai = Boolean(String(env.OPENAI_API_KEY || "").trim());
  const or = Boolean(String(env.OPENROUTER_API_KEY || "").trim());
  if (openai) return { transport: "openai-optional", transport_status: "AVAILABLE" };
  if (or) return { transport: "openrouter-optional", transport_status: "AVAILABLE" };
  return { transport: "none", transport_status: "UNAVAILABLE" };
}

export function runCodexLoop(raw, opts = {}) {
  const env = opts.env || process.env;
  const state = controlState(env);
  const started = new Date().toISOString();
  const policy = {
    auto_merge: false,
    live: false,
    production_write_allowed: false,
    authority: "carl",
  };
  const transport = classifyTransport(env);

  if (state.mode === "OFF") {
    return {
      v: LOOP_VERSION,
      task_id: raw?.task_id || null,
      execution_mode: "blocked",
      ...transport,
      files_read: [],
      files_changed: [],
      tests_run: [],
      tests_result: "NOT_RUN",
      execution_status: "BLOCKED_BY_BREAKER",
      branch_or_pr: null,
      commit_sha: env.GITHUB_SHA || null,
      ...policy,
      generated_at: started,
    };
  }

  const task = loadTask(raw);
  const files_read = readContext(task);
  let files_changed = [];
  let execution_status = "CONTEXT_ONLY";
  let execution_mode = "operator";

  if (!task.patches.length) {
    execution_status = "NEED_PATCHES";
    execution_mode = "operator";
  } else {
    files_changed = applyPatches(task);
    const rejected = files_changed.some((f) => f.status === "REJECTED_PATH");
    execution_status = rejected ? "PATCH_REJECTED" : "PATCHED";
  }

  const testOut =
    execution_status === "PATCHED" || task.tests.length
      ? runTests(task, opts.exec)
      : { tests_run: [], tests_result: "NOT_REQUESTED" };

  if (execution_status === "PATCHED" && testOut.tests_result === "FAIL") {
    execution_status = "TESTS_FAILED";
  } else if (execution_status === "PATCHED" && testOut.tests_result === "PASS") {
    execution_status = "VALIDATED";
  } else if (execution_status === "PATCHED" && testOut.tests_result === "NOT_REQUESTED") {
    execution_status = "PATCHED_UNTESTED";
  }

  const evidence = {
    v: LOOP_VERSION,
    task_id: task.task_id,
    intent: task.intent,
    execution_mode,
    ...transport,
    files_read,
    files_changed,
    tests_run: testOut.tests_run,
    tests_result: testOut.tests_result,
    tests_error: testOut.tests_error || null,
    execution_status,
    branch_or_pr: opts.branch_or_pr || env.CODEX_BRANCH || null,
    commit_sha: env.GITHUB_SHA || null,
    ...policy,
    generated_at: started,
  };

  if (opts.outPath) {
    mkdirSync(dirname(resolve(opts.outPath)), { recursive: true });
    writeFileSync(opts.outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  }
  return evidence;
}

const isMain = Boolean(process.argv[1]) && process.argv[1].endsWith("codex-loop.mjs");
if (isMain) {
  const file = process.argv[2];
  const raw = file ? JSON.parse(readFileSync(file, "utf8")) : JSON.parse(process.env.CODEX_TASK || "{}");
  const ev = runCodexLoop(raw, { outPath: process.env.CODEX_EVIDENCE || "evidence/codex/loop.json" });
  console.log(JSON.stringify(ev, null, 2));
}
