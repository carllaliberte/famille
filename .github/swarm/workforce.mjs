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
