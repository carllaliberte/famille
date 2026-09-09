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
