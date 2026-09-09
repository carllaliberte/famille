/**
 * AI workforce. Dormant bots stay in the pool. More IAs is not the default.
 * Join = agents.json (Carl). This module never writes the roster. Never merge.
 */
import { ROSTER_DOC } from "./flux.mjs";

export const WORKFORCE_VERSION = "workforce.v0";

export const SEATS = Object.freeze([
  "AVAILABLE",
  "WORKING",
  "REVIEWING",
  "BLOCKED",
  "IDLE",
  "FAILED",
  "SUSPENDED",
  "RETIRED",
]);

function fail(code, error) {
  return { ok: false, code, error };
}

export function seatOf(agent = {}) {
  const st = String(agent.status || "").toLowerCase();
  if (agent.retired) return "RETIRED";
  if (st === "core" || st === "auto") return "AVAILABLE";
  if (st === "on-demand" || st === "declared") return "IDLE";
  return "IDLE";
}

export function pool(roster = ROSTER_DOC) {
  const agents = Array.isArray(roster.agents) ? roster.agents : [];
  const rows = agents.map((a) => ({
    id: a.id,
    name: a.name,
    kind: a.kind,
    role: a.role,
    specialty: a.specialty,
    capabilities: a.capabilities || [],
    roster_status: a.status,
    seat: seatOf(a),
    locked: Boolean(a.locked),
    access: a.kind === "seat" && a.id === "carl" ? "authority" : "limited",
    merge: false,
  }));
  const idle = rows.filter((r) => r.seat === "IDLE").map((r) => r.id);
  const available = rows.filter((r) => r.seat === "AVAILABLE").map((r) => r.id);
  return {
    ok: true,
    v: WORKFORCE_VERSION,
    n: rows.length,
    rows,
    idle,
    available,
    dormant: idle.length,
    auto_merge: false,
    live: false,
  };
}

/**
 * Wake a dormant bot before recruiting a new one.
 * Merge wait is not a capacity problem.
 */
export function recommend({ bottleneck, need, roster } = {}) {
  if (bottleneck === "merge" || bottleneck === "wait_carl") {
    return {
      ok: true,
      recruit: false,
      wake: null,
      reason: "Carl gate — not a missing agent",
      auto_merge: false,
    };
  }
  if (bottleneck === "same_repo") {
    return {
      ok: true,
      recruit: false,
      wake: null,
      reason: "1 PR per repo — extra agents won't help",
      auto_merge: false,
    };
  }
  const p = pool(roster);
  const skill = String(need || "").toLowerCase();
  const dormant = p.rows.filter(
    (r) =>
      r.seat === "IDLE" &&
      (!skill ||
        String(r.specialty || "").toLowerCase().includes(skill) ||
        (r.capabilities || []).some((c) => String(c).toLowerCase().includes(skill))),
  );
  if (dormant.length) {
    return {
      ok: true,
      recruit: false,
      wake: dormant[0].id,
      reason: "dormant first",
      candidates: dormant.map((d) => d.id),
      auto_merge: false,
    };
  }
  return {
    ok: true,
    recruit: false,
    wake: null,
    propose: skill || "unspecified",
    reason: "Carl adds the agents.json row — workforce never self-joins",
    auto_merge: false,
  };
}

export function assign(id, task, roster) {
  const p = pool(roster);
  const row = p.rows.find((r) => r.id === id);
  if (!row) return fail("UNKNOWN_AGENT", String(id || ""));
  if (row.seat === "RETIRED" || row.seat === "SUSPENDED") {
    return fail("SEAT", `${id} is ${row.seat}`);
  }
  return {
    ok: true,
    id,
    task: String(task || ""),
    from: row.seat,
    seat: row.seat === "IDLE" ? "WORKING" : "WORKING",
    woke: row.seat === "IDLE",
    merge: false,
    auto_merge: false,
  };
}

/**
 * One synapse: who works, who reviews. Producer ≠ reviewer.
 * Never carl as worker. Never merge. Dormant first.
 */
export function route({ task, producer, need, roster } = {}) {
  const p = pool(roster);
  const prod = String(producer || "").toLowerCase();
  const skill = String(need || "").toLowerCase();
  const scored = p.rows
    .filter((r) => r.id !== "carl" && r.id !== prod && r.seat !== "RETIRED")
    .map((r) => {
      const spec = String(r.specialty || "").toLowerCase();
      const caps = (r.capabilities || []).map((c) => String(c).toLowerCase());
      let score = 0;
      const why = [];
      if (skill && spec.includes(skill)) {
        score += 3;
        why.push("specialty");
      }
      if (skill && caps.some((c) => c.includes(skill))) {
        score += 1;
        why.push("capability");
      }
      if (r.seat === "IDLE") {
        score += 2;
        why.push("dormant");
      } else if (r.seat === "AVAILABLE") {
        score += 1;
        why.push("available");
      }
      return { id: r.id, score, why, seat: r.seat };
    })
    .sort((a, b) => b.score - a.score);
  const worker = scored[0];
  if (!worker) return fail("NO_NODE", "no specialist");
  const reviewer = scored.find((s) => s.id !== worker.id) || null;
  return {
    ok: true,
    v: WORKFORCE_VERSION,
    task: String(task || ""),
    producer: prod || null,
    worker: worker.id,
    reviewer: reviewer ? reviewer.id : null,
    independent: Boolean(
      reviewer && reviewer.id !== worker.id && reviewer.id !== prod,
    ),
    why: worker.why,
    synapse: {
      from: prod || "mesh",
      to: worker.id,
      act: "ROUTE",
      grade: "PROPOSED",
    },
    auto_merge: false,
    live: false,
    merge: false,
  };
}

const NEVER_RE =
  /secret|credential|wrangler|juge\.v0|auto_merge|permission|deploy|signing\.key|authority|token/i;

export function riskTier(s = {}) {
  if (s.tier === 3 || s.tier === "3") return 3;
  const blob = [s.task, s.need, s.note, ...(s.files || [])].join(" ");
  if (NEVER_RE.test(blob)) return 3;
  if (/schema|protocol|mesh|claim|crypto/i.test(blob)) return 2;
  if (/test|doc|readme|eval|comment/i.test(blob)) return 0;
  return 1;
}

export function neverBundle(s = {}) {
  return riskTier(s) === 3;
}

export function canBundle(a = {}, b = {}) {
  if (neverBundle(a) || neverBundle(b)) {
    return {
      act: "NEVER-BUNDLE",
      reason: "TIER 3 / signing.key / juge.v0 / secret",
      auto_merge: false,
    };
  }
  if ((a.repo || "famille") !== (b.repo || "famille")) {
    return { act: "SPLIT", reason: "repo", auto_merge: false };
  }
  if (riskTier(a) !== riskTier(b)) {
    return { act: "SPLIT", reason: "risk", auto_merge: false };
  }
  if ((a.subsystem || "swarm") !== (b.subsystem || "swarm")) {
    return { act: "SPLIT", reason: "subsystem", auto_merge: false };
  }
  if ((a.test || "npm") !== (b.test || "npm")) {
    return { act: "SPLIT", reason: "test-profile", auto_merge: false };
  }
  if (a.provenance === false || b.provenance === false) {
    return { act: "HOLD_HUMAN", reason: "provenance missing", auto_merge: false };
  }
  return { act: "BUNDLE", reason: "compatible", auto_merge: false };
}

/** Compatible synapses → one human decision. TIER 3 never shares a bundle. */
export function bundle(synapses = []) {
  const items = Array.isArray(synapses) ? synapses : [];
  const critical = items.filter(neverBundle);
  const rest = items.filter((s) => !neverBundle(s));
  const groups = new Map();
  for (const s of rest) {
    const key = [
      s.repo || "famille",
      s.subsystem || "swarm",
      String(riskTier(s)),
      s.test || "npm",
    ].join("|");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  const bundles = [...groups.entries()].map(([key, syn], i) => ({
    id: `b${i}`,
    key,
    synapses: syn,
    n: syn.length,
    tier: Math.max(...syn.map(riskTier)),
    auto_merge: false,
    merge: false,
  }));
  const dedicated = critical.map((s, i) => ({
    id: `t3-${i}`,
    synapses: [s],
    n: 1,
    tier: 3,
    split: true,
    why: "NEVER-BUNDLE",
    auto_merge: false,
    merge: false,
  }));
  const out = [...dedicated, ...bundles];
  return {
    ok: true,
    bundles: out,
    human_decisions: out.length,
    synapses: items.length,
    auto_merge: false,
    live: false,
  };
}

/** Comment for Carl. Never CERTIFIED. Never merge. */
export function formatBundle(b = {}) {
  const syn = (b.synapses || []).map((s) => s.task || s.id || "?").join(", ");
  const hold = b.tier === 3 || b.split;
  return [
    `BUNDLE ${b.id || "?"}`,
    `Decision: ${hold ? "HOLD_HUMAN — NEVER-BUNDLE" : "one coherent decision"}`,
    `Synapses: ${syn || "(none)"}`,
    `Repo: famille`,
    `Scope: ${b.key || "famille"}`,
    `Risk: TIER ${b.tier ?? "?"}`,
    `Never-Bundle checks: ${hold ? (b.why || "TIER 3") : "pass"}`,
    `Review: required`,
    `Authority: HOLD_HUMAN`,
    `Merge: Carl only`,
    `auto_merge: false`,
    `Synapse interne ≠ PR`,
  ].join("\n");
}

/**
 * Relevant brains only. Skip ≠ blocked. Presence ≠ capacity ≠ authority.
 */
export function activate({ need, skipped = [], roster } = {}) {
  const p = pool(roster);
  const skill = String(need || "").toLowerCase();
  const skip = new Set((skipped || []).map((id) => String(id).toLowerCase()));
  const relevant = [];
  const unavailable = [];
  const spectator = [];
  for (const r of p.rows) {
    if (r.id === "carl") continue;
    if (r.seat === "RETIRED") continue;
    if (skip.has(r.id)) {
      unavailable.push({ id: r.id, state: "CAPABILITY UNAVAILABLE" });
      continue;
    }
    const spec = String(r.specialty || "").toLowerCase();
    const role = String(r.role || "").toLowerCase();
    const caps = (r.capabilities || []).map((c) => String(c).toLowerCase());
    const hit =
      !skill ||
      spec.includes(skill) ||
      role.includes(skill) ||
      caps.some((c) => c.includes(skill));
    if (!hit) {
      spectator.push(r.id);
      continue;
    }
    if (skip.has(r.id)) {
      unavailable.push({ id: r.id, state: "CAPABILITY UNAVAILABLE" });
      continue;
    }
    relevant.push({
      id: r.id,
      seat: r.seat,
      role: /review|audit/.test(skill) ? "REVIEWER" : "PRODUCER",
    });
  }
  const reviewer = relevant.find((n) => n.id !== relevant[0]?.id) || null;
  return {
    ok: true,
    relevant: relevant.map((n) => n.id),
    unavailable: unavailable.map((u) => u.id),
    spectator,
    blocked: false,
    parallel: relevant.length > 1,
    reviewer: reviewer ? reviewer.id : null,
    auto_merge: false,
    live: false,
    authority: "carl",
  };
}
