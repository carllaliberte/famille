#!/usr/bin/env node
/**
 * ACORN CODEX AUTONOMOUS WORKER v6
 * OBSERVE → UNDERSTAND → DISCOVER → PRIORITIZE → TASK → CODE → TEST → DEBUG
 * → REPAIR → MEASURE → EVIDENCE → PR → WAIT FOR HUMAN MERGE → DETECT MERGE → RESUME.
 * Carl is not an operational dependency. Merge remains human. Never auto-merge. Never LIVE.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  afterMergeSync,
  applyLoopGuards,
  candidateFromSurveillance,
  classifyRepetition,
  escalateDebug,
  evaluateTrigger,
  extractTaskNumbers,
  hydrateMemory,
  humanRequired,
  parseTaskMetadata,
  recordErrorSignature,
  runTruthSuite,
  selectNextWork,
  setAuthCooldown,
  emptyMemory as kernelEmpty,
} from "./codex-autonomy.mjs";

export const WORKER_VERSION = "codex-autonomous-worker.v7";
export const MEMORY_PATH = "evidence/codex/worker-memory.json";
export const WORKER_FILES = new Set([
  "codex-worker-evidence.json",
  "evidence/codex/worker-memory.json",
]);
export const SELF_TEST_KEYS = [
  "WORKER",
  "CODEX_CLI",
  "AUTH",
  "WORKSPACE",
  "TASK_SOURCE",
  "DISCOVERY",
  "EXECUTION",
  "PATCH",
  "TEST",
  "DEBUG",
  "PR",
  "LOOP",
  "AUTONOMY",
];

const SECRET_KEY = /secret|token|password|authorization|api[_-]?key|auth\.json|codex_auth/i;
const SECRET_VALUE = /(sk-[a-zA-Z0-9_-]{8,}|ghp_[a-zA-Z0-9]{8,}|github_pat_[a-zA-Z0-9_]{8,})/;

export function createIo(overrides = {}) {
  const env = { ...(overrides.env || process.env) };
  const root = overrides.root || env.GITHUB_WORKSPACE || process.cwd();
  return {
    env,
    root,
    now: overrides.now || (() => Date.now()),
    argv: overrides.argv || process.argv.slice(2),
    exists: overrides.exists || ((p) => existsSync(p)),
    read: overrides.read || ((p, enc = "utf8") => readFileSync(p, enc)),
    write: overrides.write || ((p, c) => {
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, c);
    }),
    spawn: overrides.spawn || spawnSync,
    exec: overrides.exec || ((cmd, args, opts = {}) =>
      execFileSync(cmd, args, { cwd: root, encoding: "utf8", stdio: "pipe", ...opts })),
    gh: overrides.gh || ((args) =>
      execFileSync("gh", args, {
        cwd: root,
        encoding: "utf8",
        stdio: "pipe",
        env: { ...process.env, ...env },
      })),
    log: overrides.log || ((...a) => console.error(...a)),
  };
}

export function truth(value) {
  const s = String(value ?? "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

export function configFrom(io) {
  const env = io.env;
  return {
    repo: env.GITHUB_REPOSITORY || "carllaliberte/famille",
    evidencePath: resolve(io.root, env.CODEX_WORKER_EVIDENCE || "codex-worker-evidence.json"),
    memoryPath: resolve(io.root, env.CODEX_WORKER_MEMORY || MEMORY_PATH),
    taskLabel: env.CODEX_TASK_LABEL || "codex-task",
    taskTimeout: Number(env.CODEX_TASK_TIMEOUT_MINUTES || 20),
    maxRepairAttempts: Number(env.CODEX_REPAIR_ATTEMPTS || 3),
    maxTasks: Number(env.CODEX_MAX_TASKS || 12),
    maxRunMinutes: Number(env.CODEX_MAX_RUN_MINUTES || 300),
    taskNumber: String(env.CODEX_TASK_NUMBER || "").trim(),
    debug: env.CODEX_DEBUG == null ? true : truth(env.CODEX_DEBUG),
    selfTest: truth(env.CODEX_SELF_TEST) || (io.argv || []).includes("--self-test"),
    trigger: env.CODEX_TRIGGER || env.GITHUB_EVENT_NAME || "direct",
    runId: String(env.GITHUB_RUN_ID || env.CODEX_RUN_ID || `local-${io.now()}`),
    prHead: env.CODEX_PR_HEAD || "",
    prBase: env.CODEX_PR_BASE || "main",
    prMerged: truth(env.CODEX_PR_MERGED),
    breakerOff: String(env.ACORN_SYSTEM_MODE || "RUN").trim().toUpperCase() === "OFF",
    headSha: env.CODEX_HEAD_SHA || "",
    beforeSha: env.CODEX_BEFORE_SHA || "",
    issueLabels: String(env.CODEX_ISSUE_LABELS || "").split(",").map((x) => x.trim()).filter(Boolean),
    mergedPrNumber: Number(env.CODEX_MERGED_PR_NUMBER || 0) || null,
  };
}

export function redactSecrets(value, seen = new WeakMap()) {
  if (typeof value === "string") {
    if (SECRET_VALUE.test(value)) return "[REDACTED]";
    if (/"access_token"\s*:\s*"[^"]{8,}"|"refresh_token"\s*:\s*"[^"]{8,}"/.test(value)) return "[REDACTED]";
    return value;
  }
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);
  if (Array.isArray(value)) {
    const arr = [];
    seen.set(value, arr);
    for (const item of value) arr.push(redactSecrets(item, seen));
    return arr;
  }
  const out = {};
  seen.set(value, out);
  for (const [k, v] of Object.entries(value)) {
    out[k] = SECRET_KEY.test(k) ? "[REDACTED]" : redactSecrets(v, seen);
  }
  return out;
}

export function classifyError(err) {
  const msg = String(err?.message || err || "").toLowerCase();
  const code = err?.code || err?.status;
  if (/auth|login|unauthorized|401/.test(msg)) return "AUTH";
  if (/codex/.test(msg) && /not found|enoent|127/.test(msg)) return "CLI";
  if (code === "ENOENT" || /enoent/.test(msg)) return "ENVIRONMENT";
  if (/dirty|worktree|not clean/.test(msg)) return "WORKTREE";
  if (/task|issue/.test(msg)) return "TASK";
  if (/codex/.test(msg)) return "CODEX";
  if (/test/.test(msg)) return "TEST";
  if (/403|permission|protected branch|resource not accessible/.test(msg)) return "PERMISSION";
  if (/network|econnreset|etimedout|fetch failed/.test(msg)) return "NETWORK";
  if (/merge|governance|live|secret/.test(msg)) return "GOVERNANCE";
  if (/gh |github/.test(msg)) return "GITHUB";
  return "ENVIRONMENT";
}

export function shouldRunForTrigger(cfg) {
  if (cfg.trigger === "pull_request" || cfg.trigger === "pull_request_target") {
    if (!cfg.prMerged) return { run: false, reason: "PR not merged" };
    if (cfg.prBase && cfg.prBase !== "main") return { run: false, reason: "base is not main" };
    if (!String(cfg.prHead || "").startsWith("codex/")) {
      return { run: true, reason: "merge non-Codex: détecter le SHA, synchroniser, reprendre si travail indépendant" };
    }
    return { run: true, reason: "resume after Codex PR merge" };
  }
  if (cfg.trigger === "workflow_run") {
    return { run: true, reason: "échec mesuré — diagnostiquer sans attendre le cron" };
  }
  return { run: true, reason: cfg.trigger || "direct" };
}

export function emptyMemory() {
  const v2 = kernelEmpty();
  return {
    ...v2,
    v: "codex-worker-memory.v2",
    current_task: null,
    completed_tasks: [],
    failed_tasks: [],
    repairs: [],
    tests: [],
    open_prs: [],
    blocked_items: [],
    human_actions_required: [],
    discoveries: [],
    measurements: [],
    next_candidates: [],
    updated_at: null,
  };
}

export function loadMemory(io, path) {
  try {
    if (!io.exists(path)) return emptyMemory();
    const parsed = JSON.parse(io.read(path));
    const v2 = hydrateMemory(parsed);
    return { ...emptyMemory(), ...v2, ...parsed, auto_merge: false, live: false, authority: "carl" };
  } catch {
    return emptyMemory();
  }
}

export function saveMemory(io, path, memory) {
  const next = redactSecrets({
    ...emptyMemory(),
    ...memory,
    auto_merge: false,
    live: false,
    authority: "carl",
    updated_at: new Date(io.now()).toISOString(),
  });
  io.write(path, `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

export function recordMemory(io, cfg, evidence, memory) {
  const compact = {
    run_id: evidence.run_id,
    status: evidence.status || null,
    reason: evidence.reason || null,
    trigger: evidence.trigger || null,
    at: new Date(io.now()).toISOString(),
    at_ms: io.now(),
    sha: evidence.workspace?.head_sha || evidence.workspace?.base_sha || null,
    patch_source: evidence.codex?.patch_source || "none",
    authenticated: Boolean(evidence.codex?.authenticated),
  };
  memory.measurements = [...(memory.measurements || []), compact].slice(-32);
  memory.human_actions_required = evidence.human_actions_required || [];
  if (evidence.status === "UNAVAILABLE" || evidence.status === "BLOCKED_BY_BREAKER" || evidence.status === "HUMAN_REQUIRED") {
    memory.blocked_items = [
      ...(memory.blocked_items || []),
      { status: evidence.status, reason: evidence.reason || null, run_id: evidence.run_id },
    ].slice(-16);
  }
  const saved = saveMemory(io, cfg.memoryPath, memory);
  evidence.memory = {
    current_task: saved.current_task,
    completed_count: (saved.completed_tasks || []).length,
    failed_count: (saved.failed_tasks || []).length,
    open_prs: (saved.open_prs || []).length,
    last_status: evidence.status,
    updated_at: saved.updated_at,
  };
  return saved;
}

export function capabilitySnapshot({ cli, auth, workspace, executed, patched, tested, pr, debuged, looped } = {}) {
  const cap = {};
  for (const key of SELF_TEST_KEYS) cap[key] = "NOT_TESTED";
  cap.WORKER = "PASS";
  if (cli) cap.CODEX_CLI = cli.available ? "PASS" : "UNAVAILABLE";
  if (auth) cap.AUTH = auth.available ? "PASS" : "UNAVAILABLE";
  if (workspace === "clean") cap.WORKSPACE = "PASS";
  else if (workspace === "dirty") cap.WORKSPACE = "FAIL";
  if (debuged) cap.DEBUG = "PASS";
  if (executed) cap.EXECUTION = "PASS";
  if (patched) cap.PATCH = "PASS";
  if (tested) cap.TEST = "PASS";
  if (pr) cap.PR = "PASS";
  if (looped) cap.LOOP = "PASS";
  return cap;
}

export function parsePorcelain(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => ({ code: line.slice(0, 2).trim(), path: line.slice(3).trim() }))
    .filter((row) => row.path);
}

export function detectPatch({ beforeSha, afterSha, beforeDirty, afterDirty, ignore = WORKER_FILES }) {
  const shaChanged = Boolean(beforeSha && afterSha && beforeSha !== afterSha);
  const files = parsePorcelain(afterDirty).filter((f) => {
    const rel = f.path.replace(/^\.\//, "");
    return ![...ignore].some((i) => rel === i || rel.startsWith(`${i}/`));
  });
  const changed = shaChanged || files.length > 0;
  return {
    changed,
    shaChanged,
    files,
    before_sha: beforeSha || null,
    after_sha: afterSha || null,
    status: changed ? "PATCHED" : "NO_CHANGE",
  };
}

export function provenanceFor({ executedBy, detect, workerWrote = false }) {
  if (workerWrote) return { patch_source: "worker", valid: false, status: detect.status };
  if (executedBy !== "codex") {
    return { patch_source: executedBy || "none", valid: false, status: detect.changed ? "PATCHED" : "NO_CHANGE" };
  }
  if (!detect.changed) return { patch_source: "none", valid: false, status: "NO_CHANGE" };
  return { patch_source: "codex", valid: true, status: "PATCHED" };
}

export function parseDiscovery(stdout) {
  const text = String(stdout || "").trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { status: "DISCOVERY_INVALID", reason: "no JSON object" };
  let candidate;
  try {
    candidate = JSON.parse(match[0]);
  } catch (error) {
    return { status: "DISCOVERY_INVALID", reason: String(error.message || error) };
  }
  if (candidate.idle === true || candidate.status === "IDLE") {
    return { status: "IDLE", candidate };
  }
  const title = String(candidate.title || "").trim();
  const body = String(candidate.body || "").trim();
  const justification = String(candidate.justification || candidate.evidence || "").trim();
  if (!title || !body) return { status: "DISCOVERY_INVALID", reason: "missing title or body", candidate };
  if (!justification || justification.length < 24) {
    return { status: "IDLE", reason: "no justified improvement; refusing invented task", candidate };
  }
  return {
    status: "CANDIDATE",
    task: {
      title,
      body,
      justification,
      files: candidate.files || [],
      tests: candidate.tests || [],
      priority: candidate.priority || "normal",
      provenance: "discovered_by=codex",
    },
  };
}

export function classifyAuth(io) {
  const home = io.env.CODEX_HOME || `${io.env.HOME || ""}/.codex`;
  const authFile = `${home}/auth.json`;
  const present = io.exists(authFile);
  return {
    available: present,
    method: present ? "chatgpt-codex-session" : "none",
    path_exists: present,
    paid_api_required: false,
  };
}

export function classifyCli(io) {
  const probe = io.spawn("codex", ["--version"], { cwd: io.root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const available = probe.status === 0;
  return {
    available,
    version: available ? String(probe.stdout || probe.stderr || "").trim().split("\n")[0] : null,
    exit_code: probe.status,
  };
}

export function git(io, args) {
  return String(io.exec("git", args, { cwd: io.root }) || "");
}

export function debugBlock(io, reason, details = {}) {
  const probe = (fn) => {
    try { return fn(); } catch (error) {
      return { error: String(error?.message || error), category: classifyError(error) };
    }
  };
  return redactSecrets({
    reason,
    category: details.category || classifyError({ message: reason }),
    at: new Date(io.now()).toISOString(),
    cli: probe(() => classifyCli(io)),
    auth: classifyAuth(io),
    workspace: probe(() => git(io, ["status", "--porcelain"])),
    git: probe(() => git(io, ["rev-parse", "HEAD"]).trim()),
    details,
  });
}

export function formatPrBody(evidence) {
  const tasks = (evidence.completed_tasks || []).map((t) => `#${t.number} ${t.title}`).join("\n") || "(none)";
  const tests = (evidence.tests || []).map((t) => `${t.status} ${t.command || ""}`).join("\n") || "(none)";
  const verified = evidence.codex?.status === "PATCHED" && evidence.codex?.patch_source === "codex" && evidence.tests?.some((t) => t.status === "PASSED");
  return [
    "Continuous Codex batch prepared from bounded repository tasks.",
    "",
    `Codex execution: ${verified ? "VERIFIED" : "NOT_VERIFIED"}`,
    `patch_source: ${evidence.codex?.patch_source || "none"}`,
    `status: ${evidence.status}`,
    "",
    "tasks:",
    tasks,
    "",
    "tests:",
    tests,
    "",
    `debug_attempts: ${(evidence.debug || []).length}`,
    `evidence: artifact + ${MEMORY_PATH}`,
    `base_sha: ${evidence.workspace?.base_sha || ""}`,
    `head_sha: ${evidence.workspace?.head_sha || ""}`,
    `run_id: ${evidence.run_id}`,
    "",
    "human_merge_required: true",
    "auto_merge: false",
    "live: false",
    "authority: carl",
  ].join("\n");
}

export function heartbeatLine(evidence) {
  const human = (evidence.human_actions_required || []).map((h) => h.action).join(" | ") || "none";
  return `HEARTBEAT status=${evidence.status} patch_source=${evidence.codex?.patch_source || "none"} codex.available=${Boolean(evidence.codex?.available)} codex.executed=${Boolean(evidence.codex?.executed)} tasks=${(evidence.completed_tasks || []).length} pr=${evidence.prs?.[0]?.url || "none"} human=${human}`;
}

export function decideNext({ tasks, discovery, timeLeft, taskBudget, lastStatus }) {
  if (!timeLeft) return { action: "STOP", status: "TIME_BUDGET" };
  if (taskBudget <= 0) return { action: "STOP", status: "TASK_BUDGET" };
  if (lastStatus === "HUMAN_REQUIRED") return { action: "STOP", status: "HUMAN_REQUIRED" };
  if (tasks?.length) return { action: "EXECUTE", task: tasks[0] };
  if (discovery?.status === "CANDIDATE") return { action: "CREATE_TASK", task: discovery.task };
  if (discovery?.status === "IDLE") return { action: "STOP", status: "IDLE" };
  if (discovery && discovery.status !== "CREATED") return { action: "STOP", status: discovery.status };
  return { action: "DISCOVER" };
}

function humanAuthAction() {
  return {
    ...humanRequired({
      reason: "ChatGPT Codex session is not available on this runner",
      evidence: ["auth.json missing", "CLI present", "worker refused to simulate Codex"],
      attempts: 1,
      what_was_done: ["installed Codex CLI", "probed ~/.codex/auth.json", "persisted UNAVAILABLE memory"],
      what_remains: ["create repository secret CODEX_AUTH_JSON"],
      exact_human_action: "Ajouter le secret CODEX_AUTH_JSON (contenu de ~/.codex/auth.json). Une fois. Carl only.",
      url: "https://github.com/carllaliberte/famille/settings/secrets/actions",
    }),
    action: "Add repository secret CODEX_AUTH_JSON with a ChatGPT Codex session (~/.codex/auth.json)",
    why: "The worker will not simulate Codex. ChatGPT/Codex free-session auth is the supported path; a paid OpenAI API key is not required. Cron plus merge triggers resume without Carl typing Go.",
  };
}

function humanBreakerAction() {
  return {
    ...humanRequired({
      reason: "Global breaker is OFF",
      evidence: ["ACORN_SYSTEM_MODE=OFF"],
      attempts: 0,
      what_was_done: ["worker refused to execute"],
      what_remains: ["set ACORN_SYSTEM_MODE=RUN"],
      exact_human_action: "Mettre ACORN_SYSTEM_MODE=RUN. Carl only. Gouvernance.",
      url: "https://github.com/carllaliberte/famille/settings/variables/actions",
    }),
    action: "Set repository variable ACORN_SYSTEM_MODE=RUN",
    why: "Global breaker is OFF; no execution is permitted.",
  };
}

export function runSelfTest(io = createIo()) {
  const cfg = configFrom(io);
  const capabilities = {};
  const notes = [];
  const mark = (key, status, note) => {
    capabilities[key] = status;
    if (note) notes.push({ key, status, note });
  };

  mark("WORKER", "PASS", "self-test harness executed");

  const cli = classifyCli(io);
  mark("CODEX_CLI", cli.available ? "PASS" : "UNAVAILABLE", cli.version || "codex --version failed");

  const auth = classifyAuth(io);
  mark("AUTH", auth.available ? "PASS" : "UNAVAILABLE", auth.method);

  try {
    const dirty = git(io, ["status", "--porcelain"]).trim();
    mark("WORKSPACE", dirty ? "FAIL" : "PASS", dirty ? "dirty worktree" : "clean");
  } catch (error) {
    mark("WORKSPACE", "UNAVAILABLE", String(error.message || error));
  }

  try {
    const list = JSON.parse(io.gh(["issue", "list", "--repo", cfg.repo, "--state", "open", "--label", cfg.taskLabel, "--limit", "5", "--json", "number,title,url"]) || "[]");
    mark("TASK_SOURCE", "PASS", `${list.length} open codex-task issue(s)`);
  } catch (error) {
    mark("TASK_SOURCE", "UNAVAILABLE", String(error.message || error));
  }

  mark("DISCOVERY", "NOT_TESTED", "requires a real Codex read-only call");
  mark("EXECUTION", "NOT_TESTED", "requires Codex exec");
  mark("PATCH", "NOT_TESTED", "requires a real Codex-produced diff");

  try {
    const help = io.spawn("node", ["--test", "--help"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    mark("TEST", help.status === 0 ? "PASS" : "FAIL", "node --test --help");
  } catch (error) {
    mark("TEST", "UNAVAILABLE", String(error.message || error));
  }

  const debug = debugBlock(io, "SELF_TEST");
  mark("DEBUG", debug && debug.reason === "SELF_TEST" ? "PASS" : "FAIL", "debugBlock shape");
  mark("PR", "NOT_TESTED", "creating a PR is reserved for a verified Codex batch");

  const idle = decideNext({ tasks: [], discovery: { status: "IDLE" }, timeLeft: true, taskBudget: 3 });
  const stopBudget = decideNext({ tasks: [{ number: 1 }], timeLeft: true, taskBudget: 0 });
  const execute = decideNext({ tasks: [{ number: 1 }], timeLeft: true, taskBudget: 2 });
  const loopOk = idle.status === "IDLE" && stopBudget.status === "TASK_BUDGET" && execute.action === "EXECUTE";
  mark("LOOP", loopOk ? "PASS" : "FAIL", "in-process state machine");
  const truth = runTruthSuite();
  mark("AUTONOMY", truth.every((t) => t.status === "PASS") ? "PASS" : "FAIL", truth.map((t) => `${t.id}:${t.status}`).join(" "));

  for (const key of SELF_TEST_KEYS) {
    if (!capabilities[key]) capabilities[key] = "NOT_TESTED";
    if (capabilities[key] === "PASS" && notes.find((n) => n.key === key && /not tested|not_tested/i.test(n.note || ""))) {
      capabilities[key] = "NOT_TESTED";
    }
  }

  const evidence = redactSecrets({
    worker: "codex-autonomous-worker",
    version: WORKER_VERSION,
    mode: "self-test",
    run_id: cfg.runId,
    started_at: new Date(io.now()).toISOString(),
    finished_at: new Date(io.now()).toISOString(),
    status: "MEASURED",
    auto_merge: false,
    live: false,
    authority: "carl",
    capabilities,
    notes,
    human_actions_required: [
      ...(!cli.available ? [{ category: "HUMAN_REQUIRED", action: "Codex CLI missing in this environment", why: "Install happens on GitHub Actions; local absence is expected." }] : []),
      ...(!auth.available ? [humanAuthAction()] : []),
    ],
    measurements: [{ name: "self-test", at: new Date(io.now()).toISOString(), capabilities }],
  });
  io.write(cfg.evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  recordMemory(io, cfg, evidence, loadMemory(io, cfg.memoryPath));
  return evidence;
}

function listTasks(io, cfg) {
  if (cfg.taskNumber) {
    const issue = JSON.parse(io.gh(["issue", "view", cfg.taskNumber, "--repo", cfg.repo, "--json", "number,title,body,url,state,labels"]));
    return [issue];
  }
  return JSON.parse(io.gh(["issue", "list", "--repo", cfg.repo, "--state", "open", "--label", cfg.taskLabel, "--limit", "20", "--json", "number,title,body,url"]) || "[]");
}

function listOpenCodexPrs(io, cfg) {
  try {
    const prs = JSON.parse(io.gh(["pr", "list", "--repo", cfg.repo, "--state", "open", "--limit", "20", "--json", "number,title,url,headRefName,body"]) || "[]");
    return (prs || [])
      .filter((p) => String(p.headRefName || p.head || "").startsWith("codex/"))
      .map((p) => {
        let files = p.files || [];
        let body = p.body || "";
        try {
          const detail = JSON.parse(io.gh(["pr", "view", String(p.number), "--repo", cfg.repo, "--json", "files,body,title"]) || "{}");
          body = detail.body || body;
          files = (detail.files || []).map((f) => f.path || f.filename || f).filter(Boolean);
        } catch { /* list payload is enough for WAIT_HUMAN_MERGE */ }
        const taskNumbers = [
          ...(p.taskNumbers || []),
          ...extractTaskNumbers(`${p.title || ""}\n${body}`),
        ];
        return {
          number: p.number,
          title: p.title,
          head: p.headRefName || p.head,
          url: p.url,
          files,
          taskNumbers: [...new Set(taskNumbers)],
        };
      });
  } catch {
    return [];
  }
}

export function issueToWorkTask(issue) {
  const meta = parseTaskMetadata(`${issue.title || ""}\n${issue.body || ""}`);
  return {
    id: String(issue.number ?? issue.id),
    number: issue.number,
    title: issue.title,
    body: issue.body,
    source: "issue",
    files: issue.files?.length ? issue.files : meta.files,
    justification: String(issue.body || issue.title || "").slice(0, 500),
    kind: "code",
    impact: meta.impact,
    urgency: meta.urgency,
    risk: meta.risk,
    effort: meta.effort,
    measureValue: meta.measureValue,
    architecturalCoherence: meta.architecturalCoherence,
    dependsOnPr: meta.dependsOnPr,
  };
}

export function observeRepo(io, cfg) {
  let failedWorkflows = [];
  let blockedPrs = [];
  try {
    const runs = JSON.parse(io.gh([
      "run", "list", "--repo", cfg.repo, "--status", "failure", "--limit", "10",
      "--json", "name,conclusion,url,headSha,displayTitle",
    ]) || "[]");
    failedWorkflows = (runs || [])
      .filter((r) => r.conclusion === "failure")
      .map((r) => ({ name: r.name || r.displayTitle || "workflow", conclusion: r.conclusion, url: r.url || "" }));
  } catch { /* observation is best-effort */ }
  try {
    const prs = JSON.parse(io.gh(["pr", "list", "--repo", cfg.repo, "--state", "open", "--limit", "20", "--json", "number,title,url,headRefName"]) || "[]");
    blockedPrs = (prs || [])
      .filter((p) => String(p.headRefName || "").startsWith("codex/"))
      .map((p) => ({ number: p.number, title: p.title }));
  } catch { /* */ }
  const candidates = candidateFromSurveillance({ failedWorkflows, blockedPrs });
  return { failedWorkflows, blockedPrs, candidates };
}

function closeTask(io, cfg, task) {
  io.gh(["issue", "close", String(task.number), "--repo", cfg.repo, "--reason", "completed"]);
}

function createTask(io, cfg, candidate) {
  const body = [
    candidate.body,
    "",
    `justification: ${candidate.justification}`,
    `discovered_by=codex`,
    candidate.files?.length ? `files: ${candidate.files.join(", ")}` : "",
    candidate.tests?.length ? `tests: ${candidate.tests.join(", ")}` : "",
    `priority: ${candidate.priority || "normal"}`,
  ].filter(Boolean).join("\n");
  return JSON.parse(io.gh([
    "issue", "create", "--repo", cfg.repo, "--title", candidate.title, "--body", body,
    "--label", cfg.taskLabel, "--json", "number,title,body,url",
  ]));
}

function taskPrompt(task, correction = "") {
  return `You are the Acorn coding worker. Work ONLY on this one GitHub task.

Task #${task.number}: ${task.title}
URL: ${task.url || ""}

TASK BODY:
${task.body || "(no body)"}

Rules:
- Read the repository before changing anything.
- Preserve existing architecture and vocabulary.
- Make the smallest coherent production-quality change justified by evidence.
- Run focused tests for every changed area.
- Do not merge, change branch protection, modify secrets, or claim LIVE.
- Do not invent unrelated architecture.
- Human authority is Carl; this worker prepares one final PR for Carl.
- If unsafe, ambiguous, or requiring a human secret, stop without source changes.
- Leave only intended implementation and tests in the workspace.
${correction ? `\nIMMEDIATE DEBUG/REPAIR:\n${correction}\n` : ""}`;
}

function runCodex(io, cfg, task, correction = "") {
  const beforeSha = git(io, ["rev-parse", "HEAD"]).trim();
  const beforeDirty = git(io, ["status", "--porcelain"]);
  const result = io.spawn("codex", ["exec", "--full-auto", taskPrompt(task, correction)], {
    cwd: io.root,
    encoding: "utf8",
    timeout: cfg.taskTimeout * 60 * 1000,
    env: io.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const afterSha = git(io, ["rev-parse", "HEAD"]).trim();
  const afterDirty = git(io, ["status", "--porcelain"]);
  const detect = detectPatch({ beforeSha, afterSha, beforeDirty, afterDirty });
  const timedOut = result.error?.code === "ETIMEDOUT" || result.status === null && result.error;
  let status = "CODEX_FAILED";
  if (timedOut) status = "TIMEOUT";
  else if (result.status === 0) status = detect.changed ? "PATCHED" : "NO_CHANGE";
  const provenance = provenanceFor({ executedBy: "codex", detect, workerWrote: false });
  return redactSecrets({
    before_sha: beforeSha,
    after_sha: afterSha,
    exit_code: result.status,
    timed_out: Boolean(timedOut),
    stdout_tail: String(result.stdout || "").slice(-12000),
    stderr_tail: String(result.stderr || "").slice(-12000),
    detect,
    status,
    patch_source: status === "PATCHED" ? provenance.patch_source : "none",
    executed_by: "codex",
  });
}

function discoverTask(io, cfg) {
  const prompt = `Inspect this Acorn repository read-only. Identify exactly ONE concrete, bounded, production-quality coding improvement justified by current repository evidence.

Do not edit files. Do not run destructive commands. Do not create issues.

If no justified improvement exists, return ONLY {"idle": true}.

Otherwise return ONLY valid JSON:
{"title":"...","body":"...","justification":"...","files":[],"tests":[],"priority":"normal"}

The justification must cite existing evidence (failing test, incomplete worker path, measured gap). Prefer fixing a real gap over inventing architecture.`;
  const r = io.spawn("codex", ["exec", "--ephemeral", "--sandbox", "read-only", "--ask-for-approval", "never", prompt], {
    cwd: io.root,
    encoding: "utf8",
    timeout: Math.min(cfg.taskTimeout, 10) * 60 * 1000,
    env: io.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (r.status !== 0) {
    return { status: "DISCOVERY_FAILED", category: "CODEX", stderr_tail: String(r.stderr || "").slice(-6000) };
  }
  return parseDiscovery(r.stdout);
}

function testChanges(io, cfg) {
  const pkgPath = resolve(io.root, "package.json");
  if (!io.exists(pkgPath)) return { status: "NOT_RUN", command: null };
  let scripts = {};
  try { scripts = JSON.parse(io.read(pkgPath)).scripts || {}; } catch { return { status: "NOT_RUN", command: null }; }
  const args = scripts.test ? ["npm", ["test"]] : ["node", ["--test"]];
  const r = io.spawn(args[0], args[1], {
    cwd: io.root,
    encoding: "utf8",
    timeout: cfg.taskTimeout * 60 * 1000,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    status: r.status === 0 ? "PASSED" : "FAILED",
    command: `${args[0]} ${args[1].join(" ")}`,
    stdout_tail: String(r.stdout || "").slice(-10000),
    stderr_tail: String(r.stderr || "").slice(-10000),
  };
}

function ensureBranch(io, branch) {
  const current = git(io, ["rev-parse", "--abbrev-ref", "HEAD"]).trim();
  if (current !== branch) {
    try { git(io, ["checkout", "-b", branch]); } catch {
      git(io, ["checkout", branch]);
    }
  }
  try {
    git(io, ["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
    git(io, ["config", "user.name", "acorn-codex-worker"]);
  } catch { /* identity is best-effort */ }
}

function publishPr(io, cfg, evidence) {
  const branch = evidence.workspace?.branch || `codex/continuous-${cfg.runId}`;
  ensureBranch(io, branch);
  const dirty = git(io, ["status", "--porcelain"]).trim();
  if (dirty) {
    git(io, ["add", "-A"]);
    git(io, ["commit", "-m", `codex: continuous Acorn work (${(evidence.completed_tasks || []).length} tasks)\n\npatch_source: ${evidence.codex?.patch_source || "none"}\nauto_merge: false\nlive: false\nauthority: carl`]);
  }
  git(io, ["push", "--set-upstream", "origin", branch]);
  const title = `codex: continuous Acorn work (${(evidence.completed_tasks || []).length} tasks)`;
  const url = String(io.gh([
    "pr", "create", "--repo", cfg.repo, "--base", "main", "--head", branch,
    "--title", title, "--body", formatPrBody(evidence),
  ])).trim();
  return { branch, url, auto_merge: false, human_merge_required: true };
}

function baseEvidence(io, cfg, extra = {}) {
  return {
    worker: "codex-autonomous-worker",
    version: WORKER_VERSION,
    run_id: cfg.runId,
    started_at: extra.started_at || new Date(io.now()).toISOString(),
    repo: cfg.repo,
    task_label: cfg.taskLabel,
    auto_merge: false,
    live: false,
    authority: "carl",
    human_merge_required: true,
    trigger: cfg.trigger,
    budgets: { max_tasks: cfg.maxTasks, max_run_minutes: cfg.maxRunMinutes, repair_attempts: cfg.maxRepairAttempts },
    completed_tasks: [],
    cycles: [],
    tasks: [],
    repairs: [],
    tests: [],
    prs: [],
    measurements: [],
    blocked: [],
    debug: [],
    discovery: [],
    human_actions_required: [],
    ...extra,
  };
}

export function runWorker(io = createIo()) {
  const cfg = configFrom(io);
  if (cfg.selfTest) return runSelfTest(io);
  const started = io.now();
  const startedIso = new Date(started).toISOString();
  const timeLeft = () => (io.now() - started) < cfg.maxRunMinutes * 60 * 1000;
  const evidence = baseEvidence(io, cfg, { started_at: startedIso });
  const memory = loadMemory(io, cfg.memoryPath);
  const write = () => {
    evidence.finished_at = new Date(io.now()).toISOString();
    evidence.workspace = {
      ...(evidence.workspace || {}),
      head_sha: (() => { try { return git(io, ["rev-parse", "HEAD"]).trim(); } catch { return evidence.workspace?.head_sha || null; } })(),
    };
    recordMemory(io, cfg, evidence, memory);
    const redacted = redactSecrets(evidence);
    io.write(cfg.evidencePath, `${JSON.stringify(redacted, null, 2)}\n`);
    io.log(heartbeatLine(redacted));
    return redacted;
  };

  const stop = (status, extra = {}) => {
    Object.assign(evidence, extra);
    evidence.status = status;
    if (status === "UNAVAILABLE" && !evidence.human_actions_required?.length) {
      evidence.human_actions_required = [humanAuthAction()];
    }
    return write();
  };

  const triggerGate = shouldRunForTrigger(cfg);
  evidence.trigger_gate = triggerGate;
  if (!triggerGate.run) return stop("IDLE", { reason: triggerGate.reason });

  if (cfg.breakerOff) {
    evidence.blocked.push({ category: "GOVERNANCE", status: "BLOCKED_BY_BREAKER" });
    evidence.human_actions_required.push(humanBreakerAction());
    evidence.debug.push(debugBlock(io, "BLOCKED_BY_BREAKER", { category: "GOVERNANCE" }));
    evidence.capabilities = capabilitySnapshot({ debuged: true });
    return stop("BLOCKED_BY_BREAKER");
  }

  let shaHint = cfg.headSha || "";
  try { if (!shaHint) shaHint = git(io, ["rev-parse", "HEAD"]).trim(); } catch { /* workspace probed later */ }

  if (cfg.trigger === "schedule" || cfg.trigger === "push" || cfg.trigger === "issues" || cfg.trigger === "direct" || cfg.trigger === "workflow_run" || cfg.trigger === "failure") {
    const decision = evaluateTrigger({
      event: cfg.trigger === "direct" ? "schedule" : cfg.trigger === "workflow_run" ? "failure" : cfg.trigger,
      now: io.now(),
      currentSha: shaHint || "unknown",
      issueLabels: cfg.issueLabels,
      memory,
      authAvailable: classifyAuth(io).available,
      breakerOff: cfg.breakerOff,
      taskLabel: cfg.taskLabel,
    });
    evidence.trigger_gate = { ...triggerGate, autonomy: decision };
    if (!decision.run) {
      return stop(decision.status, { reason: decision.reason, loop_step: decision.step });
    }
  }

  if ((cfg.trigger === "pull_request" || cfg.trigger === "push") && shaHint) {
    const sync = afterMergeSync({
      memory,
      previousSha: memory.last_main_sha || cfg.beforeSha || null,
      newSha: shaHint,
      mergedPr: cfg.mergedPrNumber,
      now: io.now(),
    });
    evidence.merge_sync = { changed: sync.changed, actions: sync.actions };
  }

  const cli = classifyCli(io);
  const auth = classifyAuth(io);
  evidence.codex = {
    available: cli.available,
    authenticated: auth.available,
    executed: false,
    status: "DEFINED",
    patch_source: "none",
    version: cli.version,
    auth_method: auth.method,
    paid_api_required: false,
  };
  evidence.measurements.push({ name: "cli", ...cli }, { name: "auth", method: auth.method, available: auth.available });

  if (!cli.available) {
    evidence.human_actions_required.push({
      category: "HUMAN_REQUIRED",
      action: "Codex CLI failed to install or run on the runner",
      why: "npm install --global @openai/codex did not produce a working `codex --version`.",
    });
    evidence.debug.push(debugBlock(io, "UNAVAILABLE", { category: "CLI", cli }));
    evidence.capabilities = capabilitySnapshot({ cli, auth, debuged: true });
    return stop("UNAVAILABLE", { reason: "codex CLI absent" });
  }
  if (!auth.available) {
    recordErrorSignature(memory, {
      category: "AUTH",
      message: "chatgpt authentication missing",
      sha: shaHint || "unknown",
      now: io.now(),
    });
    setAuthCooldown(memory, shaHint || "unknown", io.now());
    const obs = observeRepo(io, cfg);
    memory.next_candidate = obs.candidates[0] || null;
    memory.next_candidates = obs.candidates.slice(0, 5);
    evidence.observation = {
      failed_workflows: obs.failedWorkflows.length,
      blocked_prs: obs.blockedPrs.length,
      candidates: obs.candidates.map((c) => ({ id: c.id, title: c.title, source: c.source })),
    };
    evidence.human_actions_required.push(humanAuthAction());
    evidence.debug.push(debugBlock(io, "UNAVAILABLE", { category: "AUTH", auth }));
    evidence.capabilities = capabilitySnapshot({ cli, auth, debuged: true });
    return stop("UNAVAILABLE", { reason: "Codex CLI present but ChatGPT authentication is not available to this runner" });
  }

  let dirty;
  try { dirty = git(io, ["status", "--porcelain"]).trim(); } catch (error) {
    return stop("FAILED", { reason: String(error.message || error), blocked: [{ category: classifyError(error) }] });
  }
  if (dirty) {
    evidence.debug.push(debugBlock(io, "DIRTY_WORKTREE", { category: "WORKTREE", dirty }));
    return stop("DIRTY_WORKTREE");
  }

  const baseSha = git(io, ["rev-parse", "HEAD"]).trim();
  const branch = `codex/continuous-${cfg.runId}`;
  ensureBranch(io, branch);
  evidence.workspace = { branch, base_sha: baseSha, head_sha: baseSha, clean: true };

  while (evidence.completed_tasks.length < cfg.maxTasks && timeLeft()) {
    let tasks;
    try { tasks = listTasks(io, cfg); } catch (error) {
      const category = classifyError(error);
      evidence.debug.push(debugBlock(io, "TASK", { category, error: String(error.message || error) }));
      evidence.blocked.push({ category, status: "FAILED" });
      if (category === "PERMISSION" || category === "GITHUB") {
        evidence.human_actions_required.push({
          category: "HUMAN_REQUIRED",
          action: "Grant issues:write to the Actions token / enable Actions PRs",
          url: "https://github.com/carllaliberte/famille/settings/actions",
          why: String(error.message || error),
        });
        return stop("HUMAN_REQUIRED");
      }
      return stop("FAILED", { reason: String(error.message || error) });
    }

    if (cfg.taskNumber && tasks[0] && String(tasks[0].state || "OPEN").toUpperCase() === "CLOSED") {
      return stop("IDLE", { reason: `task #${cfg.taskNumber} is closed` });
    }

    const openPrs = listOpenCodexPrs(io, cfg);
    evidence.open_codex_prs = openPrs.map((p) => ({ number: p.number, head: p.head, url: p.url }));
    memory.prs = openPrs;
    memory.open_prs = openPrs;

    let discovery = null;
    if (!tasks.length) {
      const obs = observeRepo(io, cfg);
      evidence.observation = {
        failed_workflows: obs.failedWorkflows.length,
        blocked_prs: obs.blockedPrs.length,
      };
      if (obs.candidates.length) {
        discovery = { status: "CANDIDATE", task: obs.candidates[0], source: "surveillance" };
      } else {
        discovery = discoverTask(io, cfg);
      }
      evidence.discovery.push(discovery);
      memory.discoveries.push({ at: io.now(), status: discovery.status, title: discovery.task?.title || null, source: discovery.source || "discovery" });
    }

    const next = selectNextWork({
      tasks: tasks.map(issueToWorkTask),
      openPrs,
      discovery: discovery && discovery.status === "CANDIDATE"
        ? { status: "CANDIDATE", task: { id: "discovered", title: discovery.task.title, body: discovery.task.body, source: "discovery", files: discovery.task.files || [], justification: discovery.task.justification, kind: "code" } }
        : discovery,
      timeLeft: timeLeft(),
      taskBudget: cfg.maxTasks - evidence.completed_tasks.length,
    });
    evidence.decisions = [...(evidence.decisions || []), { action: next.action, status: next.status || null, justification: next.justification }];

    if (next.action === "CREATE_TASK" && discovery?.task) {
      try {
        const created = createTask(io, cfg, discovery.task);
        evidence.discovery.push({ status: "CREATED", task: { number: created.number, title: created.title, url: created.url } });
        tasks = [created];
        next.action = "EXECUTE";
        next.task = issueToWorkTask(created);
      } catch (error) {
        evidence.debug.push(debugBlock(io, "TASK", { category: classifyError(error), error: String(error.message || error) }));
        return stop("FAILED", { reason: "could not create discovered task" });
      }
    }

    if (next.action === "WAIT_HUMAN_MERGE") {
      evidence.status = "WAIT_HUMAN_MERGE";
      evidence.human_actions_required.push({
        category: "HUMAN_REQUIRED",
        action: `Review and merge open Codex PR — Carl only, no auto-merge`,
        exact_human_action: "Fusionner la PR Codex ouverte. Carl only.",
        url: openPrs[0]?.url,
        why: next.justification,
        reason: next.justification,
        evidence: openPrs.map((p) => p.url || String(p.number)),
        attempts: 0,
        what_was_done: ["independent work scanned", "dependent work deferred"],
        what_remains: ["human merge"],
      });
      break;
    }
    if (next.action === "STOP") {
      evidence.status = next.status || "IDLE";
      evidence.reason = next.justification;
      break;
    }
    if (next.action === "DISCOVER" && !discovery) {
      continue;
    }
    if (!tasks.length) {
      evidence.status = discovery?.status === "IDLE" ? "IDLE" : (discovery?.status || "IDLE");
      break;
    }

    const selectedNumber = next.task?.number;
    const task = tasks.find((t) => t.number === selectedNumber) || tasks[0];
    memory.current_task = { number: task.number, title: task.title, url: task.url };
    const cycle = { task: { number: task.number, title: task.title, url: task.url }, codex: [], tests: [], debug: [] };
    let run = runCodex(io, cfg, task);
    evidence.codex.executed = true;
    evidence.codex.status = run.status;
    evidence.codex.patch_source = run.patch_source;
    cycle.codex.push(run);

    for (let attempt = 0; (run.status === "CODEX_FAILED" || run.status === "TIMEOUT") && attempt < cfg.maxRepairAttempts; attempt++) {
      recordErrorSignature(memory, { category: "CODEX", message: run.stderr_tail || run.status, sha: baseSha, now: io.now() });
      const repeated = classifyRepetition({ memory, category: "CODEX", message: run.stderr_tail || run.status, sha: baseSha });
      const level = escalateDebug({ attempt: attempt + 1, category: "CODEX" });
      if (repeated.status !== "CONTINUE") {
        evidence.status = repeated.status;
        evidence.reason = `même erreur Codex × ${repeated.count}`;
        evidence.human_actions_required.push(humanRequired({
          reason: evidence.reason,
          evidence: [repeated.signature],
          attempts: repeated.count,
          what_was_done: ["classified", "retried bounded repairs"],
          what_remains: ["architectural or human decision"],
          exact_human_action: "Lire l'evidence du worker et décider — pas un « go ».",
        }));
        break;
      }
      const debug = debugBlock(io, run.status, { attempt: attempt + 1, category: "CODEX", exit_code: run.exit_code, stderr_tail: run.stderr_tail, level: level.level });
      cycle.debug.push(debug);
      evidence.debug.push(debug);
      evidence.repairs.push({ task: task.number, attempt: attempt + 1, kind: "codex", at: debug.at, level: level.level });
      memory.repairs.push({ task: task.number, attempt: attempt + 1, kind: "codex", level: level.level });
      run = runCodex(io, cfg, task, `Previous execution failed. Debug evidence: ${JSON.stringify({ reason: debug.reason, exit_code: run.exit_code, stderr_tail: run.stderr_tail?.slice(-2000) })}. Debug immediately, repair the root cause, and rerun focused validation.`);
      evidence.codex.status = run.status;
      evidence.codex.patch_source = run.patch_source;
      cycle.codex.push(run);
    }

    if (run.status !== "PATCHED" || run.patch_source !== "codex") {
      evidence.cycles.push(cycle);
      memory.failed_tasks.push({ number: task.number, title: task.title, status: run.status });
      evidence.status = run.status;
      break;
    }

    let tests = testChanges(io, cfg);
    cycle.tests.push(tests);
    evidence.tests.push(tests);
    memory.tests.push({ task: task.number, status: tests.status });

    for (let attempt = 0; tests.status === "FAILED" && attempt < cfg.maxRepairAttempts; attempt++) {
      const debug = debugBlock(io, "TEST_FAILED", { attempt: attempt + 1, category: "TEST", test: { status: tests.status, command: tests.command, stderr_tail: tests.stderr_tail?.slice(-2000) } });
      cycle.debug.push(debug);
      evidence.debug.push(debug);
      evidence.repairs.push({ task: task.number, attempt: attempt + 1, kind: "test", at: debug.at });
      run = runCodex(io, cfg, task, `Tests failed. Debug immediately and rerun focused tests. Command: ${tests.command}. Tail: ${tests.stderr_tail?.slice(-2000)}`);
      cycle.codex.push(run);
      evidence.codex.status = run.status;
      evidence.codex.patch_source = run.patch_source;
      if (run.status !== "PATCHED" || run.patch_source !== "codex") {
        evidence.status = run.status;
        break;
      }
      tests = testChanges(io, cfg);
      cycle.tests.push(tests);
      evidence.tests.push(tests);
    }

    evidence.cycles.push(cycle);
    evidence.tasks.push({ number: task.number, title: task.title, url: task.url, status: tests.status === "PASSED" ? "COMPLETED" : tests.status });

    if (tests.status !== "PASSED") {
      memory.failed_tasks.push({ number: task.number, title: task.title, status: "TEST_FAILED" });
      evidence.status = "TEST_FAILED";
      break;
    }

    try { closeTask(io, cfg, task); } catch (error) {
      evidence.debug.push(debugBlock(io, "TASK", { category: classifyError(error), error: String(error.message || error) }));
    }
    const completed = { number: task.number, title: task.title, url: task.url };
    evidence.completed_tasks.push(completed);
    memory.completed_tasks.push(completed);
    memory.current_task = null;
    if (cfg.taskNumber) break;
  }

  if (!timeLeft() && evidence.status == null) evidence.status = "TIME_BUDGET";
  if (evidence.completed_tasks.length >= cfg.maxTasks && evidence.status == null) {
    evidence.measurements.push({ name: "task_budget", remaining: 0 });
  }

  const finalDirty = git(io, ["status", "--porcelain"]).trim();
  const headSha = git(io, ["rev-parse", "HEAD"]).trim();
  evidence.workspace.head_sha = headSha;
  evidence.workspace.clean = !finalDirty;

  if (evidence.completed_tasks.length && (finalDirty || headSha !== evidence.workspace.base_sha) && evidence.codex?.patch_source === "codex") {
    try {
      const pr = publishPr(io, cfg, evidence);
      evidence.prs.push(pr);
      memory.open_prs.push(pr);
      evidence.status = "PR_READY";
      evidence.human_actions_required.push({
        category: "HUMAN_REQUIRED",
        action: `Review and merge ${pr.url} — Carl only, no auto-merge`,
        url: pr.url,
        why: "Worker never merges. Human sovereignty.",
      });
    } catch (error) {
      const category = classifyError(error);
      evidence.debug.push(debugBlock(io, "GITHUB", { category, error: String(error.message || error) }));
      evidence.human_actions_required.push({
        category: "HUMAN_REQUIRED",
        action: "Allow GitHub Actions to create pull requests",
        url: "https://github.com/carllaliberte/famille/settings/actions",
        why: String(error.message || error),
      });
      evidence.status = category === "PERMISSION" ? "HUMAN_REQUIRED" : "FAILED";
    }
  } else if (!evidence.status) {
    evidence.status = evidence.completed_tasks.length ? "PR_NOT_PUBLISHED" : "IDLE";
  }

  memory.next_candidates = evidence.status === "IDLE" ? [] : memory.next_candidates;
  evidence.capabilities = capabilitySnapshot({
    cli,
    auth,
    workspace: finalDirty ? "dirty" : "clean",
    executed: Boolean(evidence.codex?.executed),
    patched: evidence.codex?.patch_source === "codex",
    tested: (evidence.tests || []).some((t) => t.status === "PASSED"),
    pr: (evidence.prs || []).length > 0,
    debuged: (evidence.debug || []).length > 0,
    looped: true,
  });
  return write();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const evidence = runWorker(createIo());
  console.log(JSON.stringify(evidence, null, 2));
}
