#!/usr/bin/env node
/**
 * ACORN CODEX AUTONOMOUS WORKER
 * One task per cycle: observe -> claim -> Codex -> test -> evidence -> PR.
 * Never merges. Never claims LIVE. Human authority remains Carl.
 * ChatGPT-authenticated Codex is preferred; API keys are not required by this worker.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const repo = process.env.GITHUB_REPOSITORY || "carllaliberte/famille";
const root = process.env.GITHUB_WORKSPACE || process.cwd();
const evidencePath = process.env.CODEX_WORKER_EVIDENCE || "codex-worker-evidence.json";
const taskLabel = process.env.CODEX_TASK_LABEL || "codex-task";
const maxMinutes = Number(process.env.CODEX_TASK_TIMEOUT_MINUTES || 20);

function sh(command, args, options = {}) {
  return execFileSync(command, args, { cwd: root, encoding: "utf8", stdio: "pipe", ...options });
}

function safeGh(args) {
  return sh("gh", args, { env: process.env });
}

function breaker() {
  return process.env.ACORN_SYSTEM_MODE !== "OFF";
}

function codexAvailable() {
  const r = spawnSync("codex", ["--version"], { cwd: root, encoding: "utf8" });
  return r.status === 0;
}

function authenticated() {
  if (process.env.CODEX_AUTH_JSON) return true;
  const home = process.env.CODEX_HOME || `${process.env.HOME || ""}/.codex`;
  return existsSync(`${home}/auth.json`);
}

function cleanWorkspace() {
  return sh("git", ["status", "--porcelain"]).trim() === "";
}

function taskList() {
  const raw = safeGh(["issue", "list", "--repo", repo, "--state", "open", "--label", taskLabel, "--limit", "1", "--json", "number,title,body,url"]);
  return JSON.parse(raw);
}

function taskPrompt(task) {
  return `You are the Acorn coding worker. Work ONLY on this one GitHub task.\n\nTask #${task.number}: ${task.title}\nURL: ${task.url}\n\nTASK BODY:\n${task.body || "(no body)"}\n\nRules:\n- Read the repository before changing anything.\n- Preserve existing architecture and vocabulary.\n- Make the smallest coherent production-quality change that fulfills the task.\n- Run focused tests for every changed area.\n- Do not merge, do not change branch protection, do not modify secrets, and do not claim LIVE.\n- Human authority is Carl; the worker may prepare a PR only.\n- If the task is unsafe, ambiguous, or requires a human secret, stop without source changes and explain why.\n- When finished, leave the working tree containing only the intended implementation and tests.\n`;
}

function runCodex(task) {
  const prompt = taskPrompt(task);
  const before = sh("git", ["rev-parse", "HEAD"]).trim();
  const result = spawnSync("codex", ["exec", "--full-auto", prompt], {
    cwd: root,
    encoding: "utf8",
    timeout: maxMinutes * 60 * 1000,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const after = sh("git", ["rev-parse", "HEAD"]).trim();
  const diff = sh("git", ["status", "--porcelain"]).trim();
  return {
    before_sha: before,
    after_sha: after,
    exit_code: result.status,
    timed_out: result.error?.code === "ETIMEDOUT",
    stdout_tail: String(result.stdout || "").slice(-12000),
    stderr_tail: String(result.stderr || "").slice(-12000),
    changed: Boolean(diff),
    status: result.status === 0 ? (diff ? "PATCHED" : "NO_CHANGE") : "CODEX_FAILED",
  };
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
  sh("git", ["checkout", "-b", branch]);
  sh("git", ["add", "-A"]);
  sh("git", ["commit", "-m", `codex: implement task #${task.number}`]);
  sh("git", ["push", "--set-upstream", "origin", branch]);
  const pr = safeGh(["pr", "create", "--repo", repo, "--base", "main", "--head", branch, "--title", `codex: ${task.title}`, "--body", `Automated Codex work for #${task.number}.\n\nCodex execution completed in the continuous worker.\nTests are recorded in the worker evidence.\n\nauto_merge=false\nlive=false\nauthority=carl\nHuman merge required.`]).trim();
  return { branch, pr };
}

export function runWorker() {
  const evidence = { v: "codex-autonomous-worker.v1", observed_at: new Date().toISOString(), repo, task_label: taskLabel, auto_merge: false, live: false, authority: "carl", execution_mode: "codex" };
  if (!breaker()) { evidence.status = "BLOCKED_BY_BREAKER"; writeFileSync(evidencePath, JSON.stringify(evidence, null, 2)); return evidence; }
  if (!codexAvailable()) { evidence.status = "UNAVAILABLE"; evidence.reason = "codex CLI absent"; writeFileSync(evidencePath, JSON.stringify(evidence, null, 2)); return evidence; }
  if (!authenticated()) { evidence.status = "UNAVAILABLE"; evidence.reason = "Codex CLI present but ChatGPT authentication is not available to this runner"; writeFileSync(evidencePath, JSON.stringify(evidence, null, 2)); return evidence; }
  if (!cleanWorkspace()) { evidence.status = "DIRTY_WORKTREE"; writeFileSync(evidencePath, JSON.stringify(evidence, null, 2)); return evidence; }
  const tasks = taskList();
  if (!tasks.length) { evidence.status = "IDLE"; evidence.reason = `no open issues labeled ${taskLabel}`; writeFileSync(evidencePath, JSON.stringify(evidence, null, 2)); return evidence; }
  const task = tasks[0];
  evidence.task = { number: task.number, title: task.title, url: task.url };
  const run = runCodex(task);
  evidence.codex = run;
  if (run.status !== "PATCHED") { evidence.status = run.status; writeFileSync(evidencePath, JSON.stringify(evidence, null, 2)); return evidence; }
  const tests = testChanges();
  evidence.tests = tests;
  if (tests.status !== "PASSED") { evidence.status = "TEST_FAILED"; writeFileSync(evidencePath, JSON.stringify(evidence, null, 2)); return evidence; }
  const published = publishPr(task);
  evidence.pr = published;
  evidence.status = "PR_READY";
  writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(runWorker(), null, 2));
