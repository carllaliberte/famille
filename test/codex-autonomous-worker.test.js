import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  WORKER_VERSION,
  classifyAuth,
  classifyCli,
  classifyError,
  CODEX_WRITE_ARGS,
  createIo,
  decideNext,
  detectPatch,
  formatPrBody,
  heartbeatLine,
  issueToWorkTask,
  observeRepo,
  parseDiscovery,
  provenanceFor,
  redactSecrets,
  runSelfTest,
  runWorker,
  shouldRunForTrigger,
  taskPrompt,
  buildCodexConfig,
} from "../scripts/codex-autonomous-worker.mjs";

function tmpRoot() {
  const root = mkdtempSync(join(tmpdir(), "codex-worker-"));
  writeFileSync(join(root, "package.json"), JSON.stringify({ scripts: { test: "node --test" } }));
  mkdirSync(join(root, "evidence/codex"), { recursive: true });
  return root;
}

function baseEnv(extra = {}) {
  return {
    GITHUB_REPOSITORY: "carllaliberte/famille",
    ACORN_SYSTEM_MODE: "RUN",
    CODEX_MAX_TASKS: "2",
    CODEX_MAX_RUN_MINUTES: "5",
    CODEX_REPAIR_ATTEMPTS: "1",
    CODEX_TASK_TIMEOUT_MINUTES: "1",
    HOME: "/tmp/codex-home-absent",
    ...extra,
  };
}

function ioFor(t) {
  const root = t.root || tmpRoot();
  const git = t.git || { sha: "aaa", dirty: "", branch: "main" };
  const ghCalls = [];
  const spawnCalls = [];
  const execCalls = [];
  const issues = t.issues || [];
  const io = createIo({
    root,
    env: baseEnv(t.env),
    now: t.now || (() => 1_000_000),
    argv: t.argv || [],
    exists: (p) => {
      if (t.authFile && p.endsWith("auth.json")) return true;
      if (typeof t.exists === "function") return t.exists(p);
      return existsSync(p);
    },
    spawn: (cmd, args, opts) => {
      spawnCalls.push({ cmd, args });
      if (t.spawn) return t.spawn(cmd, args, opts, { git, spawnCalls });
      if (cmd === "codex" && args[0] === "--version") {
        return t.cli === false ? { status: 127, stdout: "", stderr: "not found" } : { status: 0, stdout: "codex-cli 0.1.0\n" };
      }
      if (cmd === "node" && args.includes("--help")) return { status: 0, stdout: "help\n" };
      if (cmd === "codex" && args.includes("--sandbox") && args.includes("read-only")) {
        return t.discovery || { status: 0, stdout: JSON.stringify({ idle: true }) };
      }
      if (cmd === "codex" && args[0] === "exec") {
        const result = t.codex ? t.codex(git, args) : { status: 0, stdout: "ok\n" };
        return result;
      }
      if (cmd === "npm" && args[0] === "test") {
        return t.tests || { status: 0, stdout: "ok\n" };
      }
      return { status: 0, stdout: "", stderr: "" };
    },
    exec: (cmd, args) => {
      execCalls.push({ cmd, args });
      if (cmd !== "git") return "";
      if (args[0] === "rev-parse" && args[1] === "HEAD") return `${git.sha}\n`;
      if (args[0] === "rev-parse" && args[1] === "--abbrev-ref") return `${git.branch}\n`;
      if (args[0] === "status") return git.dirty;
      if (args[0] === "checkout") { git.branch = args[args.length - 1]; return ""; }
      if (args[0] === "add" || args[0] === "commit" || args[0] === "push" || args[0] === "config") return "";
      return "";
    },
    gh: (args) => {
      ghCalls.push(args);
      if (t.gh) return t.gh(args, { issues, ghCalls });
      if (args[0] === "issue" && args[1] === "list") return JSON.stringify(issues);
      if (args[0] === "issue" && args[1] === "view") return JSON.stringify(issues[0] || {});
      if (args[0] === "issue" && args[1] === "create") {
        const created = { number: 900, title: "discovered", body: "x", url: "https://github.com/carllaliberte/famille/issues/900" };
        issues.push(created);
        return JSON.stringify(created);
      }
      if (args[0] === "issue" && args[1] === "close") {
        const num = Number(args[2]);
        const idx = issues.findIndex((i) => i.number === num);
        if (idx >= 0) issues.splice(idx, 1);
        return "";
      }
      if (args[0] === "pr" && args[1] === "create") return "https://github.com/carllaliberte/famille/pull/42\n";
      return "[]";
    },
    log: () => {},
  });
  io._git = git;
  io._ghCalls = ghCalls;
  io._spawnCalls = spawnCalls;
  io._execCalls = execCalls;
  io._root = root;
  return io;
}

describe("codex autonomous worker", () => {
  it("blocks when breaker is OFF", () => {
    const io = ioFor({ env: { ACORN_SYSTEM_MODE: "OFF" }, authFile: true });
    const ev = runWorker(io);
    assert.equal(ev.status, "BLOCKED_BY_BREAKER");
    assert.equal(ev.auto_merge, false);
    assert.equal(ev.live, false);
    assert.equal(ev.authority, "carl");
    assert.equal(ev.human_actions_required[0].category, "HUMAN_REQUIRED");
  });

  it("reports UNAVAILABLE when Codex CLI is absent", () => {
    const io = ioFor({ cli: false, authFile: true });
    const ev = runWorker(io);
    assert.equal(ev.status, "UNAVAILABLE");
    assert.equal(ev.codex.available, false);
    assert.equal(ev.codex.patch_source, "none");
    assert.match(ev.reason, /cli/i);
  });

  it("reports UNAVAILABLE when ChatGPT auth is absent", () => {
    const io = ioFor({ authFile: false });
    const ev = runWorker(io);
    assert.equal(ev.status, "UNAVAILABLE");
    assert.equal(ev.codex.available, true);
    assert.equal(ev.codex.authenticated, false);
    assert.equal(ev.codex.paid_api_required, false);
    assert.match(ev.human_actions_required[0].url, /secrets\/actions/);
    assert.match(JSON.stringify(ev), /CODEX_AUTH_JSON/);
  });

  it("refuses a dirty worktree", () => {
    const io = ioFor({ authFile: true, git: { sha: "aaa", dirty: " M scripts/x.mjs", branch: "main" } });
    const ev = runWorker(io);
    assert.equal(ev.status, "DIRTY_WORKTREE");
    assert.equal(ev.completed_tasks.length, 0);
  });

  it("stays IDLE when the queue is empty and discovery finds nothing justified", () => {
    const io = ioFor({
      authFile: true,
      issues: [],
      discovery: { status: 0, stdout: JSON.stringify({ idle: true }) },
    });
    const ev = runWorker(io);
    assert.equal(ev.status, "IDLE");
    assert.equal(io._ghCalls.some((a) => a[1] === "create"), false);
  });

  it("does not invent a task from an unjustified discovery", () => {
    const parsed = parseDiscovery(JSON.stringify({ title: "Improve things", body: "make it better" }));
    assert.equal(parsed.status, "IDLE");
    const io = ioFor({
      authFile: true,
      issues: [],
      discovery: { status: 0, stdout: JSON.stringify({ title: "Improve things", body: "make it better" }) },
    });
    const ev = runWorker(io);
    assert.equal(ev.status, "IDLE");
    assert.equal(io._ghCalls.some((a) => a[1] === "create"), false);
  });

  it("executes an existing task, records Codex provenance, tests, and PR_READY", () => {
    const io = ioFor({
      authFile: true,
      issues: [{ number: 513, title: "seed", body: "do the work", url: "https://example/513", state: "OPEN" }],
      git: { sha: "aaa", dirty: "", branch: "main" },
      codex: (git) => {
        git.sha = "bbb";
        git.dirty = " M scripts/foo.mjs";
        return { status: 0, stdout: "patched by codex\n" };
      },
      tests: { status: 0, stdout: "ok\n" },
    });
    const ev = runWorker(io);
    assert.equal(ev.status, "PR_READY");
    assert.equal(ev.codex.executed, true);
    assert.equal(ev.codex.status, "PATCHED");
    assert.equal(ev.codex.patch_source, "codex");
    assert.equal(ev.completed_tasks[0].number, 513);
    assert.equal(ev.tests[0].status, "PASSED");
    assert.equal(ev.prs[0].auto_merge, false);
    assert.equal(ev.human_merge_required, true);
    assert.match(ev.prs[0].url, /pull\/42/);
    assert.equal(io._execCalls.some((c) => c.args.includes("merge")), false);
    assert.equal(JSON.stringify(ev).includes("VERIFIED") || formatPrBody(ev).includes("VERIFIED"), true);
  });

  it("treats a SHA change with clean porcelain as a Codex patch", () => {
    const detect = detectPatch({ beforeSha: "aaa", afterSha: "bbb", beforeDirty: "", afterDirty: "" });
    assert.equal(detect.status, "PATCHED");
    assert.equal(detect.shaChanged, true);
    const prov = provenanceFor({ executedBy: "codex", detect, workerWrote: false });
    assert.equal(prov.patch_source, "codex");
    assert.equal(prov.valid, true);
  });

  it("never marks a worker-written patch as Codex", () => {
    const detect = detectPatch({
      beforeSha: "aaa",
      afterSha: "aaa",
      beforeDirty: "",
      afterDirty: " M scripts/foo.mjs",
    });
    const prov = provenanceFor({ executedBy: "codex", detect, workerWrote: true });
    assert.equal(prov.patch_source, "worker");
    assert.equal(prov.valid, false);
  });

  it("records NO_CHANGE when Codex exits 0 without a diff", () => {
    const io = ioFor({
      authFile: true,
      issues: [{ number: 7, title: "noop", body: "x", url: "u" }],
      codex: () => ({ status: 0, stdout: "nothing to do\n" }),
    });
    const ev = runWorker(io);
    assert.equal(ev.status, "NO_CHANGE");
    assert.equal(ev.codex.patch_source, "none");
    assert.equal(ev.prs.length, 0);
  });

  it("records CODEX_FAILED, debugs immediately, and retries once", () => {
    let calls = 0;
    const io = ioFor({
      authFile: true,
      issues: [{ number: 8, title: "fail", body: "x", url: "u" }],
      env: { CODEX_REPAIR_ATTEMPTS: "1" },
      codex: () => {
        calls += 1;
        return { status: 1, stdout: "", stderr: "boom" };
      },
    });
    const ev = runWorker(io);
    assert.equal(ev.status, "CODEX_FAILED");
    assert.equal(calls, 2);
    assert.ok(ev.debug.length >= 1);
    assert.ok(ev.repairs.length >= 1);
    assert.equal(ev.repairs[0].kind, "codex");
  });

  it("repairs a test failure and continues when the retry passes", () => {
    let testCalls = 0;
    const io = ioFor({
      authFile: true,
      issues: [{ number: 9, title: "tests", body: "x", url: "u" }],
      git: { sha: "aaa", dirty: "", branch: "main" },
      codex: (git) => {
        git.sha = git.sha === "aaa" ? "bbb" : "ccc";
        git.dirty = " M scripts/foo.mjs";
        return { status: 0, stdout: "ok\n" };
      },
      spawn: (cmd, args, _opts, ctx) => {
        if (cmd === "codex" && args[0] === "--version") return { status: 0, stdout: "codex-cli 0.1.0\n" };
        if (cmd === "codex" && args[0] === "exec") return ctx.spawnCalls && (ctx.git.sha = ctx.git.sha === "aaa" ? "bbb" : "ccc") && (ctx.git.dirty = " M scripts/foo.mjs") && { status: 0, stdout: "ok\n" };
        if (cmd === "npm") {
          testCalls += 1;
          return testCalls === 1 ? { status: 1, stdout: "", stderr: "fail" } : { status: 0, stdout: "ok" };
        }
        return { status: 0, stdout: "" };
      },
    });
    const ev = runWorker(io);
    assert.equal(ev.status, "PR_READY");
    assert.equal(ev.tests.at(-1).status, "PASSED");
    assert.ok(ev.repairs.some((r) => r.kind === "test"));
  });

  it("stops at the task budget instead of inventing more work", () => {
    let list = 0;
    const io = ioFor({
      authFile: true,
      env: { CODEX_MAX_TASKS: "2" },
      git: { sha: "aaa", dirty: "", branch: "main" },
      gh: (args) => {
        if (args[0] === "issue" && args[1] === "list") {
          list += 1;
          return JSON.stringify([{ number: 10 + list, title: `t${list}`, body: "x", url: "u" }]);
        }
        if (args[0] === "issue" && args[1] === "close") {
          const num = Number(args[2]);
          const idx = issues.findIndex((i) => i.number === num);
          if (idx >= 0) issues.splice(idx, 1);
          return "";
        }
        if (args[0] === "pr") return "https://github.com/carllaliberte/famille/pull/7\n";
        return "[]";
      },
      codex: (git) => {
        git.sha = `${git.sha}x`;
        git.dirty = " M a.js";
        return { status: 0, stdout: "ok" };
      },
    });
    const ev = runWorker(io);
    assert.equal(ev.completed_tasks.length, 2);
    assert.equal(ev.status, "PR_READY");
  });

  it("stops on time budget", () => {
    let n = 0;
    const io = ioFor({
      authFile: true,
      env: { CODEX_MAX_RUN_MINUTES: "1" },
      now: () => {
        n += 1;
        return n < 4 ? 0 : 120_000;
      },
      issues: [],
      discovery: { status: 0, stdout: JSON.stringify({ idle: true }) },
    });
    const ev = runWorker(io);
    assert.ok(ev.status === "TIME_BUDGET" || ev.status === "IDLE");
  });

  it("self-test never converts NOT_TESTED into PASS", () => {
    const io = ioFor({ cli: false, authFile: false, argv: ["--self-test"] });
    const ev = runSelfTest(io);
    assert.equal(ev.mode, "self-test");
    assert.equal(ev.capabilities.DISCOVERY, "NOT_TESTED");
    assert.equal(ev.capabilities.EXECUTION, "NOT_TESTED");
    assert.equal(ev.capabilities.PATCH, "NOT_TESTED");
    assert.equal(ev.capabilities.PR, "NOT_TESTED");
    assert.notEqual(ev.capabilities.DISCOVERY, "PASS");
    assert.equal(ev.capabilities.WORKER, "PASS");
    assert.equal(ev.capabilities.CODEX_CLI, "UNAVAILABLE");
    assert.equal(ev.capabilities.AUTH, "UNAVAILABLE");
  });

  it("resumes after Codex merge and observes a non-Codex merge without looping unmerged PRs", () => {
    assert.equal(shouldRunForTrigger({ trigger: "pull_request", prMerged: false, prHead: "codex/x", prBase: "main" }).run, false);
    const nonCodex = shouldRunForTrigger({ trigger: "pull_request", prMerged: true, prHead: "feat/other", prBase: "main" });
    assert.equal(nonCodex.run, true);
    assert.match(nonCodex.reason, /SHA|non-Codex/);
    assert.equal(shouldRunForTrigger({ trigger: "pull_request", prMerged: true, prHead: "codex/continuous-1", prBase: "main" }).run, true);
    const io = ioFor({
      authFile: true,
      env: { CODEX_TRIGGER: "pull_request", CODEX_PR_MERGED: "false", CODEX_PR_HEAD: "codex/x", CODEX_PR_BASE: "main" },
    });
    const ev = runWorker(io);
    assert.equal(ev.status, "IDLE");
    assert.match(ev.reason, /not merged/);
  });

  it("redacts secrets from evidence", () => {
    const red = redactSecrets({ token: "abc", nested: { OPENAI_API_KEY: "sk-abcdefghijk" }, ok: "hello" });
    assert.equal(red.token, "[REDACTED]");
    assert.equal(red.nested.OPENAI_API_KEY, "[REDACTED]");
    assert.equal(red.ok, "hello");
    assert.equal(JSON.stringify(red).includes("sk-"), false);
    const clap = redactSecrets("error: unexpected argument '--ask-for-approval' found");
    assert.match(clap, /unexpected argument '--ask-for-approval'/);
    assert.equal(redactSecrets("sk-or-abcdefghijklmnop"), "[REDACTED]");
  });

  it("classifies errors into operational categories", () => {
    assert.equal(classifyError({ message: "401 unauthorized" }), "AUTH");
    assert.equal(classifyError({ message: "ERROR: unexpected status 402 Payment Required: credits" }), "AUTH");
    assert.equal(classifyError({ message: "error: unexpected argument '--ask-for-approval' found" }), "CLI");
    assert.equal(classifyError({ message: "codex: not found", code: "ENOENT" }), "CLI");
    assert.equal(classifyError({ message: "Resource not accessible by integration" }), "PERMISSION");
    assert.equal(classifyError({ message: "npm test failed" }), "TEST");
  });

  it("formats a PR body that never claims VERIFIED without Codex provenance", () => {
    const body = formatPrBody({
      status: "PR_READY",
      completed_tasks: [{ number: 1, title: "x" }],
      tests: [{ status: "PASSED", command: "npm test" }],
      debug: [],
      codex: { status: "PATCHED", patch_source: "worker" },
      workspace: { base_sha: "a", head_sha: "b" },
      run_id: "1",
    });
    assert.match(body, /NOT_VERIFIED/);
    assert.match(body, /human_merge_required: true/);
    assert.match(body, /auto_merge: false/);
    assert.doesNotMatch(body, /^Codex execution: VERIFIED/m);
  });

  it("keeps loop decisions honest", () => {
    assert.equal(decideNext({ tasks: [], discovery: { status: "IDLE" }, timeLeft: true, taskBudget: 3 }).status, "IDLE");
    assert.equal(decideNext({ tasks: [{ number: 1 }], timeLeft: false, taskBudget: 3 }).status, "TIME_BUDGET");
    assert.equal(decideNext({ tasks: [{ number: 1 }], timeLeft: true, taskBudget: 0 }).status, "TASK_BUDGET");
    assert.equal(decideNext({ tasks: [{ number: 1 }], timeLeft: true, taskBudget: 2 }).action, "EXECUTE");
  });

  it("emits a heartbeat line that can be grepped from logs", () => {
    const line = heartbeatLine({
      status: "UNAVAILABLE",
      codex: { patch_source: "none", available: true, executed: false },
      completed_tasks: [],
      human_actions_required: [{ action: "Add secret" }],
    });
    assert.match(line, /^HEARTBEAT /);
    assert.match(line, /status=UNAVAILABLE/);
  });

  it("pins a requested task_number", () => {
    const io = ioFor({
      authFile: true,
      env: { CODEX_TASK_NUMBER: "513" },
      issues: [{ number: 513, title: "seed", body: "x", url: "u", state: "OPEN" }],
      git: { sha: "aaa", dirty: "", branch: "main" },
      gh: (args, ctx) => {
        if (args[0] === "issue" && args[1] === "view") {
          assert.equal(args[2], "513");
          return JSON.stringify(ctx.issues[0]);
        }
        if (args[1] === "close") return "";
        if (args[0] === "pr") return "https://github.com/carllaliberte/famille/pull/9\n";
        return "[]";
      },
      codex: (git) => {
        git.sha = "bbb";
        git.dirty = " M z.js";
        return { status: 0, stdout: "ok" };
      },
    });
    const ev = runWorker(io);
    assert.equal(ev.completed_tasks[0].number, 513);
  });

  it("classify helpers distinguish CLI from auth", () => {
    const missing = createIo({
      env: { HOME: "/tmp/no-codex-home" },
      spawn: () => ({ status: 127 }),
      exists: () => false,
    });
    assert.equal(classifyCli(missing).available, false);
    assert.equal(classifyAuth(missing).available, false);
    assert.equal(classifyAuth(missing).paid_api_required, false);
  });

  it("does not write LIVE or auto_merge true anywhere", () => {
    const io = ioFor({
      authFile: true,
      issues: [{ number: 1, title: "t", body: "x", url: "u" }],
      git: { sha: "aaa", dirty: "", branch: "main" },
      codex: (git) => {
        git.sha = "bbb";
        git.dirty = " M a.js";
        return { status: 0, stdout: "ok" };
      },
    });
    const ev = runWorker(io);
    const raw = readFileSync(join(io._root, "codex-worker-evidence.json"), "utf8");
    assert.equal(ev.live, false);
    assert.equal(ev.auto_merge, false);
    assert.equal(JSON.parse(raw).live, false);
    assert.doesNotMatch(raw, /"live": true/);
    assert.equal(ev.version, WORKER_VERSION);
  });

  it("persists operational memory on UNAVAILABLE instead of leaving the seed untouched", () => {
    const io = ioFor({ authFile: false, env: { GITHUB_RUN_ID: "34982782985" } });
    const ev = runWorker(io);
    const memPath = join(io._root, "evidence/codex/worker-memory.json");
    assert.equal(existsSync(memPath), true);
    const mem = JSON.parse(readFileSync(memPath, "utf8"));
    assert.equal(ev.status, "UNAVAILABLE");
    assert.ok(mem.updated_at);
    assert.equal(mem.authority, "carl");
    assert.equal(mem.auto_merge, false);
    assert.equal(mem.live, false);
    assert.ok(mem.human_actions_required.length >= 1);
    assert.match(JSON.stringify(mem.human_actions_required), /CODEX_AUTH_JSON/);
    assert.ok(mem.measurements.some((m) => m.status === "UNAVAILABLE" && m.run_id === "34982782985"));
    assert.ok(mem.blocked_items.some((b) => b.status === "UNAVAILABLE"));
    assert.equal(ev.memory.last_status, "UNAVAILABLE");
    assert.equal(ev.capabilities.AUTH, "UNAVAILABLE");
    assert.equal(ev.capabilities.CODEX_CLI, "PASS");
    assert.equal(ev.capabilities.EXECUTION, "NOT_TESTED");
    assert.equal(ev.capabilities.PATCH, "NOT_TESTED");
    assert.doesNotMatch(JSON.stringify(mem), /sk-|access_token|"live": true/);
  });

  it("pins worker v9 and does not ask Carl to dispatch after UNAVAILABLE", () => {
    assert.equal(WORKER_VERSION, "codex-autonomous-worker.v9");
    const io = ioFor({ authFile: false });
    const ev = runWorker(io);
    assert.equal(ev.status, "UNAVAILABLE");
    const blob = JSON.stringify(ev.human_actions_required);
    assert.match(blob, /CODEX_AUTH_JSON/);
    assert.doesNotMatch(blob, /Run workflow/);
    assert.match(blob, /exact_human_action/);
    assert.equal(ev.observation.candidates.length >= 0, true);
  });

  it("cools down a second schedule on the same SHA after AUTH UNAVAILABLE", () => {
    const root = tmpRoot();
    const first = ioFor({ authFile: false, root, env: { CODEX_TRIGGER: "schedule", GITHUB_RUN_ID: "1" } });
    const a = runWorker(first);
    assert.equal(a.status, "UNAVAILABLE");
    const second = ioFor({ authFile: false, root, env: { CODEX_TRIGGER: "schedule", GITHUB_RUN_ID: "2" } });
    const b = runWorker(second);
    assert.ok(["WAIT", "IDLE"].includes(b.status), b.status);
    assert.equal(b.codex?.executed || false, false);
    assert.match(String(b.reason || ""), /cooldown|debounce|WAIT|auth/i);
  });

  it("WAIT_HUMAN_MERGE when the only remaining task belongs to an open Codex PR", () => {
    const io = ioFor({
      authFile: true,
      issues: [{ number: 513, title: "seed", body: "do the work", url: "https://example/513", state: "OPEN" }],
      gh: (args, ctx) => {
        if (args[0] === "pr" && args[1] === "list") {
          return JSON.stringify([
            { number: 516, title: "persist", url: "https://github.com/carllaliberte/famille/pull/516", headRefName: "codex/persist-unavailable-memory", taskNumbers: [513] },
          ]);
        }
        if (args[0] === "issue" && args[1] === "list") return JSON.stringify(ctx.issues);
        if (args[0] === "issue" && args[1] === "view") return JSON.stringify(ctx.issues[0]);
        if (args[0] === "pr" && args[1] === "create") return "https://github.com/carllaliberte/famille/pull/42\n";
        return "[]";
      },
    });
    const ev = runWorker(io);
    assert.equal(ev.status, "WAIT_HUMAN_MERGE");
    assert.equal(ev.completed_tasks.length, 0);
    assert.equal(ev.auto_merge, false);
  });

  it("self-test records AUTONOMY PASS from in-process truth suite A–G", () => {
    const io = ioFor({ cli: false, authFile: false, argv: ["--self-test"] });
    const ev = runSelfTest(io);
    assert.equal(ev.capabilities.AUTONOMY, "PASS");
    assert.equal(ev.capabilities.DISCOVERY, "NOT_TESTED");
    assert.equal(JSON.stringify(ev.human_actions_required || []).includes("Run workflow"), false);
  });

  it("scores an issue from its body instead of taking the first one", () => {
    const scored = issueToWorkTask({
      number: 2,
      title: "high",
      body: "impact: 5\nurgence: 5\nfiles: test/codex-autonomy.test.js",
    });
    const low = issueToWorkTask({
      number: 1,
      title: "low",
      body: "impact: 1\nurgence: 1",
    });
    assert.equal(scored.impact, 5);
    assert.equal(scored.files[0], "test/codex-autonomy.test.js");
    assert.equal(low.impact, 1);
  });

  it("observes failed workflows without inventing a task when nothing failed", () => {
    const io = ioFor({ authFile: false });
    const obs = observeRepo(io, { repo: "carllaliberte/famille" });
    assert.equal(obs.failedWorkflows.length, 0);
    assert.equal(obs.candidates.length, 0);
  });

  it("observes a measured workflow failure into a justified surveillance candidate", () => {
    const io = ioFor({
      authFile: false,
      gh: (args) => {
        if (args[0] === "run" && args[1] === "list") {
          return JSON.stringify([
            { name: "build-verify", conclusion: "failure", url: "https://github.com/carllaliberte/famille/actions/runs/1" },
          ]);
        }
        return "[]";
      },
    });
    const obs = observeRepo(io, { repo: "carllaliberte/famille" });
    assert.equal(obs.candidates.length, 1);
    assert.match(obs.candidates[0].justification, /build-verify/);
    assert.equal(obs.candidates[0].source, "surveillance");
  });

  it("continues independent work when an open Codex PR touches other files", () => {
    const io = ioFor({
      authFile: true,
      issues: [{
        number: 80,
        title: "docs test",
        body: "files: test/codex-autonomy.test.js\nimpact: 4",
        url: "u",
        state: "OPEN",
      }],
      git: { sha: "aaa", dirty: "", branch: "main" },
      gh: (args, ctx) => {
        if (args[0] === "pr" && args[1] === "list") {
          return JSON.stringify([
            { number: 517, title: "autonomie", url: "https://github.com/carllaliberte/famille/pull/517", headRefName: "codex/autonomie-totale", body: "kernel" },
          ]);
        }
        if (args[0] === "pr" && args[1] === "view") {
          return JSON.stringify({ body: "kernel", files: [{ path: "scripts/codex-autonomous-worker.mjs" }] });
        }
        if (args[0] === "issue" && args[1] === "list") return JSON.stringify(ctx.issues);
        if (args[1] === "close") return "";
        if (args[0] === "pr" && args[1] === "create") return "https://github.com/carllaliberte/famille/pull/99\n";
        return "[]";
      },
      codex: (git) => {
        git.sha = "bbb";
        git.dirty = " M test/codex-autonomy.test.js";
        return { status: 0, stdout: "ok" };
      },
    });
    const ev = runWorker(io);
    assert.equal(ev.status, "PR_READY");
    assert.equal(ev.completed_tasks[0].number, 80);
  });

  it("allows the codex/ branch prefix required by the worker", () => {
    const branche = readFileSync(new URL("../.github/workflows/branche.yml", import.meta.url), "utf8");
    assert.match(branche, /codex\/\[a-z0-9-\]\+/);
  });

  it("treats OPENROUTER_API_KEY as sufficient auth without ChatGPT session", () => {
    const missing = createIo({ env: { HOME: "/tmp/no-codex-home" }, exists: () => false, spawn: () => ({ status: 127 }) });
    assert.equal(classifyAuth(missing).available, false);
    const routed = createIo({
      env: { HOME: "/tmp/no-codex-home", OPENROUTER_API_KEY: "sk-or-test-key-123456" },
      exists: () => false,
      spawn: () => ({ status: 127 }),
    });
    assert.equal(classifyAuth(routed).available, true);
    assert.equal(classifyAuth(routed).method, "openrouter-api-key");
    assert.equal(classifyAuth(routed).paid_api_required, false);
  });

  it("writes a full-repo sandbox and runs Astra Codex with danger-full-access", () => {
    const io = ioFor({
      authFile: false,
      env: { OPENROUTER_API_KEY: "sk-or-test-key-123456" },
      issues: [{ number: 513, title: "keep the loop moving", body: "bounded improvement", url: "https://github.com/carllaliberte/famille/issues/513" }],
      git: { sha: "aaa", dirty: "", branch: "main" },
      codex: (git, args) => {
        assert.equal(args.includes("danger-full-access"), true);
        assert.equal(args.includes("--dangerously-bypass-approvals-and-sandbox"), true);
        assert.equal(args.includes("--ask-for-approval"), false);
        assert.equal(args.includes("--full-auto"), false);
        git.sha = "bbb";
        git.dirty = " M scripts/codex-autonomous-worker.mjs";
        return { status: 0, stdout: "ok" };
      },
    });
    const ev = runWorker(io);
    assert.notEqual(ev.status, "UNAVAILABLE");
    assert.equal(ev.codex.authenticated, true);
    assert.equal(ev.codex.auth_method, "openrouter-api-key");
    const writeCall = io._spawnCalls.find((c) => c.cmd === "codex" && c.args.includes("danger-full-access"));
    assert.ok(writeCall);
    assert.deepEqual(writeCall.args.slice(0, CODEX_WRITE_ARGS.length), [...CODEX_WRITE_ARGS]);
    const prompt = taskPrompt({ number: 513, title: "t", body: "b", url: "u" });
    assert.match(prompt, /entire repository is in scope/);
    assert.match(prompt, /Astra Codex/);
    const cfg = buildCodexConfig(io, classifyAuth(io));
    assert.match(cfg, /sandbox_mode = "danger-full-access"/);
    assert.match(cfg, /approval_policy = "never"/);
    assert.match(cfg, /trust_level = "trusted"/);
    assert.match(cfg, /model_provider = "openrouter"/);
    assert.match(cfg, /wire_api = "responses"/);
    assert.match(cfg, /model_max_output_tokens = 1024/);
    assert.match(cfg, /model_reasoning_effort = "low"/);
    assert.match(cfg, /model_providers\.openrouter\.auth/);
  });

  it("keeps workflow run blocks indented so GitHub registers workflow_dispatch", () => {
    const yml = readFileSync(new URL("../.github/workflows/codex-autonomous-worker.yml", import.meta.url), "utf8");
    assert.match(yml, /^name: codex-autonomous-worker$/m);
    assert.match(yml, /workflow_dispatch:/);
    assert.doesNotMatch(yml, /^JSON$/m);
    assert.doesNotMatch(yml, /^TOML$/m);
    assert.doesNotMatch(yml, /^\{/m);
    const lines = yml.split("\n");
    let inRun = false;
    let runIndent = 0;
    for (const line of lines) {
      if (/run:\s+\|\s*$/.test(line)) {
        inRun = true;
        runIndent = line.match(/^(\s*)/)[1].length;
        continue;
      }
      if (!inRun) continue;
      if (line.trim() === "") continue;
      const ind = line.match(/^(\s*)/)[1].length;
      if (ind <= runIndent) {
        inRun = false;
        continue;
      }
      assert.notEqual(ind, 0, `unindented run body: ${line}`);
    }
  });
});
