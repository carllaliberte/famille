#!/usr/bin/env node
/**
 * ACORN CODEX AUTONOMOUS WORKER
 * Continuous bounded loop: observe -> task -> Codex -> test -> debug -> next task.
 * One final PR contains the whole clean batch. Never merges, never claims LIVE.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const repo = process.env.GITHUB_REPOSITORY || "carllaliberte/famille";
const root = process.env.GITHUB_WORKSPACE || process.cwd();
const evidencePath = process.env.CODEX_WORKER_EVIDENCE || "codex-worker-evidence.json";
const taskLabel = process.env.CODEX_TASK_LABEL || "codex-task";
const taskTimeout = Number(process.env.CODEX_TASK_TIMEOUT_MINUTES || 20);
const maxRepairAttempts = Number(process.env.CODEX_REPAIR_ATTEMPTS || 1);
const maxTasks = Number(process.env.CODEX_MAX_TASKS || 12);
const maxRunMinutes = Number(process.env.CODEX_MAX_RUN_MINUTES || 300);
const startedAt = Date.now();

function sh(command, args, options = {}) {
  return execFileSync(command, args, { cwd: root, encoding: "utf8", stdio: "pipe", ...options });
}
function safeGh(args) { return sh("gh", args, { env: process.env }); }
function writeEvidence(evidence) { writeFileSync(evidencePath, JSON.stringify(evidence, null, 2)); return evidence; }
function breaker() { return process.env.ACORN_SYSTEM_MODE !== "OFF"; }
function authenticated() {
  if (process.env.CODEX_AUTH_JSON) return true;
  const home = process.env.CODEX_HOME || `${process.env.HOME || ""}/.codex`;
  return existsSync(`${home}/auth.json`);
}
function codexAvailable() { return spawnSync("codex", ["--version"], { cwd: root, encoding: "utf8" }).status === 0; }
function cleanWorkspace() { return sh("git", ["status", "--porcelain"]).trim() === ""; }
function timeLeft() { return (Date.now() - startedAt) < maxRunMinutes * 60 * 1000; }
function taskList() {
  return JSON.parse(safeGh(["issue", "list", "--repo", repo, "--state", "open", "--label", taskLabel, "--limit", "1", "--json", "number,title,body,url"]));
}
function closeTask(task) {
  safeGh(["issue", "close", String(task.number), "--repo", repo, "--reason", "completed"]);
}
function taskPrompt(task, correction = "") {
  return `You are the Acorn coding worker. Work ONLY on this one GitHub task.\n\nTask #${task.number}: ${task.title}\nURL: ${task.url}\n\nTASK BODY:\n${task.body || "(no body)"}\n\nRules:\n- Read the repository before changing anything.\n- Preserve existing architecture and vocabulary.\n- Make the smallest coherent production-quality change justified by evidence.\n- Run focused tests for every changed area.\n- Do not merge, change branch protection, modify secrets, or claim LIVE.\n- Human authority is Carl; this worker prepares one final PR for Carl.\n- If unsafe, ambiguous, or requiring a human secret, stop without source changes.\n- Leave only intended implementation and tests in the workspace.\n${correction ? `\nIMMEDIATE DEBUG/REPAIR:\n${correction}\n` : ""}`;
}
function runCodex(task, correction = "") {
  const before = sh("git", ["rev-parse", "HEAD"]).trim();
  const result = spawnSync("codex", ["exec", "--full-auto", taskPrompt(task, correction)], {
    cwd: root, encoding: "utf8", timeout: taskTimeout * 60 * 1000, env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const after = sh("git", ["rev-parse", "HEAD"]).trim();
  const diff = sh("git", ["status", "--porcelain"]).trim();
  return { before_sha: before, after_sha: after, exit_code: result.status,
    timed_out: result.error?.code === "ETIMEDOUT", stdout_tail: String(result.stdout || "").slice(-12000),
    stderr_tail: String(result.stderr || "").slice(-12000), changed: Boolean(diff),
    status: result.status === 0 ? (diff ? "PATCHED" : "NO_CHANGE") : "CODEX_FAILED" };
}
function discoverTask() {
  const prompt = `Inspect this Acorn repository read-only. Identify exactly ONE concrete, bounded, production-quality coding improvement that is justified by current repository evidence. Do not edit files, do not run destructive commands, and do not create issues. Return ONLY valid JSON with keys title and body. The body must state the evidence, exact intended outcome, constraints, and focused validation. Prefer fixing an existing gap over inventing new architecture.`;
  const r = spawnSync("codex", ["exec", "--ephemeral", "--sandbox", "read-only", "--ask-for-approval", "never", prompt], {
    cwd: root, encoding: "utf8", timeout: Math.min(taskTimeout, 10) * 60 * 1000, env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (r.status !== 0) return { status: "DISCOVERY_FAILED", stderr_tail: String(r.stderr || "").slice(-6000) };
  const text = String(r.stdout || "").trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { status: "DISCOVERY_INVALID", stdout_tail: text.slice(-6000) };
  try {
    const candidate = JSON.parse(match[0]);
    if (!candidate.title || !candidate.body) return { status: "DISCOVERY_INVALID", candidate };
    const issue = JSON.parse(safeGh(["issue", "create", "--repo", repo, "--title", String(candidate.title), "--body", String(candidate.body), "--label", taskLabel, "--json", "number,title,body,url"]));
    return { status: "CREATED", task: issue };
  } catch (error) {
    return { status: "DISCOVERY_INVALID", error: String(error?.message || error) };
  }
}
function debugBlock(reason, details = {}) {
  const probe = (fn) => { try { return fn(); } catch (error) { return { error: String(error?.message || error) }; } };
  return { reason, at: new Date().toISOString(), cli: probe(() => spawnSync("codex", ["--version"], { cwd: root, encoding: "utf8" }).stdout?.trim() || "unavailable"), auth: authenticated(), workspace: probe(() => sh("git", ["status", "--short"])), task_count: probe(() => taskList().length), git: probe(() => sh("git", ["rev-parse", "HEAD"]).trim()), details };
}
function testChanges() {
  const pkg = `${root}/package.json`;
  if (!existsSync(pkg)) return { status: "NOT_RUN", command: null };
  let scripts = {};
  try { scripts = JSON.parse(readFileSync(pkg, "utf8")).scripts || {}; } catch { return { status: "NOT_RUN", command: null }; }
  const command = scripts.test ? ["npm", ["test", "--", "--runInBand"]] : ["node", ["--test"]];
  const r = spawnSync(command[0], command[1], { cwd: root, encoding: "utf8", timeout: taskTimeout * 60 * 1000, stdio: ["ignore", "pipe", "pipe"] });
  return { status: r.status === 0 ? "PASSED" : "FAILED", command: command.join(" "), stdout_tail: String(r.stdout || "").slice(-10000), stderr_tail: String(r.stderr || "").slice(-10000) };
}
function publishPr(evidence) {
  const branch = `codex/continuous-${Date.now()}`;
  sh("git", ["checkout", "-b", branch]);
  sh("git", ["add", "-A"]);
  sh("git", ["commit", "-m", `codex: continuous Acorn work (${evidence.completed_tasks.length} tasks)`]);
  sh("git", ["push", "--set-upstream", "origin", branch]);
  const title = `codex: continuous Acorn work (${evidence.completed_tasks.length} tasks)`;
  const body = `Continuous Codex batch prepared from bounded repository tasks.\n\nCompleted tasks: ${evidence.completed_tasks.map((t) => `#${t.number}`).join(", ")}\n\nauto_merge=false\nlive=false\nauthority=carl\nHuman merge required.`;
  const pr = safeGh(["pr", "create", "--repo", repo, "--base", "main", "--head", branch, "--title", title, "--body", body]).trim();
  return { branch, pr };
}
export function runWorker() {
  const evidence = { v: "codex-autonomous-worker.v3", observed_at: new Date().toISOString(), repo, task_label: taskLabel, auto_merge: false, live: false, authority: "carl", execution_mode: "codex", max_tasks: maxTasks, max_run_minutes: maxRunMinutes, completed_tasks: [], cycles: [] };
  if (!breaker()) { evidence.status = "BLOCKED_BY_BREAKER"; evidence.debug = debugBlock(evidence.status); return writeEvidence(evidence); }
  if (!codexAvailable()) { evidence.status = "UNAVAILABLE"; evidence.reason = "codex CLI absent"; evidence.debug = debugBlock(evidence.status); return writeEvidence(evidence); }
  if (!authenticated()) { evidence.status = "UNAVAILABLE"; evidence.reason = "Codex CLI present but ChatGPT authentication is not available to this runner"; evidence.debug = debugBlock(evidence.status); return writeEvidence(evidence); }
  if (!cleanWorkspace()) { evidence.status = "DIRTY_WORKTREE"; evidence.debug = debugBlock(evidence.status); return writeEvidence(evidence); }

  while (evidence.completed_tasks.length < maxTasks && timeLeft()) {
    let tasks = taskList();
    if (!tasks.length) {
      const discovery = discoverTask();
      evidence.discovery = [...(evidence.discovery || []), discovery];
      if (discovery.status !== "CREATED") { evidence.status = discovery.status; break; }
      tasks = [discovery.task];
    }
    const task = tasks[0];
    const cycle = { task: { number: task.number, title: task.title, url: task.url }, codex: [], tests: [] };
    let run = runCodex(task); cycle.codex.push(run);
    for (let attempt = 0; run.status === "CODEX_FAILED" && attempt < maxRepairAttempts; attempt++) {
      const debug = debugBlock(run.status, { attempt: attempt + 1, exit_code: run.exit_code, stderr_tail: run.stderr_tail });
      cycle.debug = [...(cycle.debug || []), debug];
      run = runCodex(task, `Previous execution failed. Debug evidence: ${JSON.stringify(debug)}. Debug immediately, repair the root cause, and rerun focused validation.`);
      cycle.codex.push(run);
    }
    if (run.status !== "PATCHED") { evidence.status = run.status; evidence.cycles.push(cycle); break; }
    let tests = testChanges(); cycle.tests.push(tests);
    for (let attempt = 0; tests.status === "FAILED" && attempt < maxRepairAttempts; attempt++) {
      const debug = debugBlock("TEST_FAILED", { attempt: attempt + 1, test: tests });
      cycle.debug = [...(cycle.debug || []), debug];
      run = runCodex(task, `Tests failed. Debug evidence: ${JSON.stringify(debug)}. Repair immediately and rerun focused tests.`);
      cycle.codex.push(run);
      if (run.status !== "PATCHED") { evidence.status = run.status; break; }
      tests = testChanges(); cycle.tests.push(tests);
    }
    evidence.cycles.push(cycle);
    if (tests.status !== "PASSED") { evidence.status = "TEST_FAILED"; break; }
    closeTask(task);
    evidence.completed_tasks.push({ number: task.number, title: task.title, url: task.url });
  }

  if (evidence.completed_tasks.length && cleanWorkspace() === false) {
    evidence.pr = publishPr(evidence);
    evidence.status = "PR_READY";
  } else if (!evidence.status) {
    evidence.status = evidence.completed_tasks.length ? "PR_NOT_PUBLISHED" : "IDLE";
  }
  return writeEvidence(evidence);
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(runWorker(), null, 2));
