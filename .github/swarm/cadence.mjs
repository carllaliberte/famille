/**
 * Cadence for bots. Parallel across repos. Sequential on one repo.
 * 1 open PR per repo. Carl merges. Never auto-merge.
 */
export const CADENCE_VERSION = "cadence.v0";

export const REPOS = Object.freeze([
  "famille",
  "unforge-check",
  "acorn-juge",
  "unforge-press",
  "horizon-protocol",
  "mesure-protocol",
  "unforge-retract",
  "ancrage-protocol",
]);

export const CADENCE_STATES = Object.freeze([
  "BACKLOG",
  "READY",
  "IN_PROGRESS",
  "BLOCKED",
  "REVIEW",
  "MERGE_READY",
  "DONE",
  "FAILED",
  "HOLD",
]);

function fail(code, error) {
  return { ok: false, code, error };
}

function filesOf(x) {
  return Array.isArray(x && x.files) ? x.files.map(String) : [];
}

export function overlap(a, b) {
  const sa = new Set((a || []).map(String));
  return (b || []).some((f) => sa.has(String(f)));
}

/** Different repos: parallel. Same repo: one PR. */
export function canParallel(a, b) {
  if (!a || !b) return false;
  if (a.repo !== b.repo) return true;
  return false;
}

export function classify(task = {}, openPrs = []) {
  const repo = String(task.repo || "");
  if (!repo) return fail("CADENCE", "repo required");
  const prs = (openPrs || []).filter((p) => p && p.repo === repo);
  if (task.hold) return { ok: true, state: "HOLD", repo, auto_merge: false };
  if (prs.length > 1) {
    return { ok: true, state: "HOLD", repo, reason: "two heads", auto_merge: false };
  }
  const pr = prs[0];
  if (pr) {
    if (task.head && pr.head === task.head) {
      return { ok: true, state: "IN_PROGRESS", repo, pr: pr.number, auto_merge: false };
    }
    return {
      ok: true,
      state: "BLOCKED",
      repo,
      pr: pr.number,
      reason: "1 PR per repo",
      auto_merge: false,
    };
  }
  return { ok: true, state: "READY", repo, auto_merge: false };
}

export function board({ tasks = [], openPrs = [] } = {}) {
  const rows = tasks.map((t) => ({ task: t.id || t.repo, ...classify(t, openPrs) }));
  const ready = rows.filter((r) => r.state === "READY");
  const blocked = rows.filter((r) => r.state === "BLOCKED" || r.state === "HOLD");
  return {
    ok: true,
    v: CADENCE_VERSION,
    rows,
    ready: ready.map((r) => r.task),
    blocked: blocked.map((r) => r.task),
    auto_merge: false,
    live: false,
  };
}

export function nextReady(input) {
  const b = board(input);
  const first = b.ready[0] || null;
  return { ok: true, next: first, auto_merge: false };
}

/** After Carl merges, drop that PR and recompute. Automation resumes. He is not the planner. */
export function afterMerge({ mergedRepo, mergedNumber, tasks, openPrs } = {}) {
  const rest = (openPrs || []).filter(
    (p) => !(p.repo === mergedRepo && Number(p.number) === Number(mergedNumber)),
  );
  const b = board({ tasks: tasks && tasks.length ? tasks : REPOS.map((repo) => ({ id: repo, repo })), openPrs: rest });
  return {
    ok: true,
    merged: { repo: mergedRepo, number: mergedNumber },
    ready: b.ready,
    blocked: b.blocked,
    next: b.ready[0] || null,
    auto_merge: false,
    live: false,
  };
}

/** Carl only sees this. Tests must be real. No invented PASS. */
export function carlGate({ pr, tests, review } = {}) {
  const testsOk = tests === true || tests === "success";
  const reviewOk = review === true || review === "LU";
  if (!pr) return { ok: true, need_carl: false, action: "NONE", auto_merge: false };
  if (!testsOk) {
    return { ok: true, need_carl: false, action: "WAIT_TESTS", auto_merge: false };
  }
  return {
    ok: true,
    need_carl: true,
    action: "MERGE",
    pr,
    tests: "success",
    review: reviewOk ? "LU" : "none",
    auto_merge: false,
    live: false,
  };
}

export function formatGate(gate, next) {
  const lines = [
    "cadence.v0 — Carl gate",
    `action: ${gate.action}`,
    `auto_merge: false`,
    next ? `next READY: ${next}` : "next READY: (none)",
    "Carl merges. Bots resume.",
  ];
  return lines.join("\n");
}

/**
 * Cursor reads this. Never merge. READY → one act. Else RAS.
 * An open head is Carl's queue, not a missing agent.
 */
export function cursorGate({ repo = "famille", openPrs = [], head } = {}) {
  const c = classify({ repo, head }, openPrs);
  if (!c.ok) return c;
  if (c.state === "READY") {
    return {
      ok: true,
      actor: "cursor",
      action: "ONE",
      state: "READY",
      repo,
      auto_merge: false,
      live: false,
    };
  }
  return {
    ok: true,
    actor: "cursor",
    action: "RAS",
    state: c.state,
    repo,
    pr: c.pr,
    reason: c.reason || c.state,
    auto_merge: false,
    live: false,
  };
}
