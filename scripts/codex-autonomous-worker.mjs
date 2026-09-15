#!/usr/bin/env node
/**
 * ACORN CODEX AUTONOMOUS WORKER
 * One task per cycle: observe -> claim -> Codex -> test -> debug/retry -> evidence -> PR.
 * Never merges. Never claims LIVE. Human authority remains Carl.
 * ChatGPT-authenticated Codex is preferred; API keys are not required by this worker.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const repo = process.env.GITHUB_REPOSITORY || "carllaliberte/famille";
const root = process.env.GITHUB_WORKSPACE || process.cwd();
const evidencePath = process.env.CODEX_WORKER_EVIDENCE || "codex-worker-evidence.json";
const taskLabel = process.env.CODEX_TASK_LABEL || "codex-task";
const maxMinutes = Number(process.env.CODEX_TASK_TIMEOUT_MINUTES || 20);
const maxRepairAttempts = Number(process.env.CODEX_REPAIR_ATTEMPTS || 1);

function sh(command, args, options = {}) {
  return execFileSync(command, args, { cwd: root, encoding: "utf8", stdio: "pipe", ...options });
}
function safeGh(args) { return sh("gh", args, { env: process.env }); }
function writeEvidence(evidence) { writeFileSync(evidencePath, JSON.stringify(evidence, null, 2)); return evidence; }
function breaker() { return process.env.ACORN_SYSTEM_MODE !== "OFF"; }
function codexAvailable() { return spawnSync("codex", ["--version"], { cwd: root, encoding: "utf8" }).status === 0; }
function authenticated() {
  if (process.env.CODEX_AUTH_JSON) return true;
  const home = process.env.CODEX_HOME || `${process.env.HOME || ""}/.codex`;
  return existsSync(`${home}/auth.json`);
}
function cleanWorkspace() { return sh("git", ["status", "--porcelain"]).trim() === ""; }
function taskList() {
  return JSON.parse(safeGh(["issue", "list", "--repo", repo, "--state", "open", "--label", taskLabel, "--limit", "1", "--json", "number,title,body,url"]));
}
function taskPrompt(task, correction = "") {
  return `You are the Acorn coding worker. Work ONLY on this one GitHub task.\n\nTask #${task.number}: ${task.title}\nURL: ${task.url}\n\nTASK BODY:\n${task.body || "(no body)"}\n\nRules:\n- Read the repository before changing anything.\n- Preserve existing architecture and vocabulary.\n- Make the smallest coherent production-quality change that fulfills the task.\n- Run focused tests for every changed area.\n- Do not merge, do not change branch protection, do not modify secrets, and do not claim LIVE.\n- Human authority is Carl; the worker may prepare a PR only.\n- If the task is unsafe, ambiguous, or requires a human secret, stop without source changes and explain why.\n- When finished, leave the working tree containing only the intended implementation and tests.\n${correction ? `\nIMMEDIATE DEBUG/REPAIR:\n${correction}\n` : ""}`;
}
function runCodex(task, correction = "") {
  const before = sh("git", ["rev-parse", "HEAD"]).trim();
  const result = spawnSync("codex", ["exec", "--full-auto", taskPrompt(task, correction)], {
    cwd: root, encoding: "utf8", timeout: maxMinutes * 60 * 1000, env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const after = sh("git", ["rev-parse", "HEAD"]).trim();
  const diff = sh("git", ["status", "--porcelain"]).trim();
  return { before_sha: before, after_sha: after, exit_code: result.status,
    timed_out: result.error?.code === "ETIMEDOUT", stdout_tail: String(result.stdout || "").slice(-12000),
    stderr_tail: String(result.stderr || "").slice(-12000), changed: Boolean(diff),
    status: result.status === 0 ? (diff ? "PATCHED" : "NO_CHANGE") : "CODEX_FAILED" };
}
function debugBlock(reason, details = {}) {
  const diagnostics = { reason, at: new Date().toISOString(), cli: null, auth: authenticated(), workspace: null, task_count: null, git: null, details };
  const probe = (fn) => { try { return fn(); } catch (error) { return { error: String(error?.message || error) }; } };
  diagnostics.cli = probe(() => spawnSync("codex", ["--version"], { cwd: root, encoding: "utf8" }).stdout?.trim() || "unavailable");
  diagnostics.workspace = probe(() => sh("git", ["status", "--short"]));
  diagnostics.git = probe(() => sh("git", ["rev-parse", "HEAD"]).trim());
  diagnostics.task_count = probe(() => taskList().length);
  return diagnostics;
}
function testChanges() {
  const pkg = `${root}/package.json`;
  if (!existsSync(pkg)) return { status: "NOT_RUN", command: null };
  let scripts = {};
  try { scripts = JSON.parse(readFileSync(pkg, "utf8")).scripts || {}; } catch { return { status: "NOT_RUN", command: null }; }
  const command = scripts.test ? ["npm", ["test", "--", "--runInBand"]] : ["node", ["--test"]];
  const r = spawnSync(command[0], command[1], { cwd: root, encoding: "utf8", timeout: maxMinutes * 60 * 1000, stdio: ["ignore", "pipe", "pipe"] });
  return { status: r.status === 0 ? "PASSED" : "FAILED", command: command.join(" "), stdout_tail: String(r.stdout || "").slice(-10000), stderr_tail: String(r.stderr || "").slice(-10000) };
}
function publishPr(task) {
  const branch = `codex/task-${task.number}-${Date.now()}`;
  sh("git", ["checkout", "-b", branch]); sh("git", ["add", "-A"]);
  sh("git", ["commit", "-m", `codex: implement task #${task.number}`]);
  sh("git", ["push", "--set-upstream", "origin", branch]);
  const pr = safeGh(["pr", "create", "--repo", repo, "--base", "main", "--head", branch, "--title", `codex: ${task.title}`, "--body", `Automated Codex work for #${task.number}.\n\nCodex execution completed in the continuous worker.\nTests are recorded in the worker evidence.\n\nauto_merge=false\nlive=false\nauthority=carl\nHuman merge required.`]).trim();
  return { branch, pr };
}
export function runWorker() {
  const evidence = { v: "codex-autonomous-worker.v2", observed_at: new Date().toISOString(), repo, task_label: taskLabel, auto_merge: false, live: false, authority: "carl", execution_mode: "codex" };
  if (!breaker()) { evidence.status = "BLOCKED_BY_BREAKER"; evidence.debug = debugBlock(evidence.status); return writeEvidence(evidence); }
  if (!codexAvailable()) { evidence.status = "UNAVAILABLE"; evidence.reason = "codex CLI absent"; evidence.debug = debugBlock(evidence.status); return writeEvidence(evidence); }
  if (!authenticated()) { evidence.status = "UNAVAILABLE"; evidence.reason = "Codex CLI present but ChatGPT authentication is not available to this runner"; evidence.debug = debugBlock(evidence.status); return writeEvidence(evidence); }
  if (!cleanWorkspace()) { evidence.status = "DIRTY_WORKTREE"; evidence.debug = debugBlock(evidence.status); return writeEvidence(evidence); }
  const tasks = taskList();
  if (!tasks.length) { evidence.status = "IDLE"; evidence.reason = `no open issues labeled ${taskLabel}`; return writeEvidence(evidence); }
  const task = tasks[0]; evidence.task = { number: task.number, title: task.title, url: task.url };
  let run = runCodex(task); evidence.codex = [run];
  for (let attempt = 0; run.status === "CODEX_FAILED" && attempt < maxRepairAttempts; attempt++) {
    const debug = debugBlock(run.status, { attempt: attempt + 1, exit_code: run.exit_code, stderr_tail: run.stderr_tail });
    evidence.debug = [...(evidence.debug || []), debug];
    run = runCodex(task, `The previous Codex execution failed. Debug evidence: ${JSON.stringify(debug)}. Fix the root cause now, then rerun focused validation.`);
    evidence.codex.push(run);
  }
  if (run.status !== "PATCHED") { evidence.status = run.status; if (!evidence.debug) evidence.debug = [debugBlock(run.status)]; return writeEvidence(evidence); }
  let tests = testChanges(); evidence.tests = [tests];
  for (let attempt = 0; tests.status === "FAILED" && attempt < maxRepairAttempts; attempt++) {
    const debug = debugBlock("TEST_FAILED", { attempt: attempt + 1, test: tests });
    evidence.debug = [...(evidence.debug || []), debug];
    run = runCodex(task, `Tests failed after the previous implementation. Debug evidence: ${JSON.stringify(debug)}. Inspect the failure, repair the implementation, and rerun focused tests.`);
    evidence.codex.push(run);
    if (run.status !== "PATCHED") { evidence.status = run.status; return writeEvidence(evidence); }
    tests = testChanges(); evidence.tests.push(tests);
  }
  if (tests.status !== "PASSED") { evidence.status = "TEST_FAILED"; if (!evidence.debug) evidence.debug = [debugBlock(evidence.status, { test: tests })]; return writeEvidence(evidence); }
  evidence.pr = publishPr(task); evidence.status = "PR_READY"; return writeEvidence(evidence);
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(runWorker(), null, 2));
