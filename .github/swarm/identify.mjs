/**
 * Every identified AI signs its work. An error always names the involved node.
 * Notify is mandatory; delivered is measured separately. Never LIVE.
 * Roster = schema/agents.json via flux.lookup. Not a second roster.
 */
import { lookup } from "./flux.mjs";

export const IDENTIFY_VERSION = "identify.v0";

function fail(code, error) {
  return { ok: false, code, error };
}

function iso(value) {
  const s = String(value || "");
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
}

function actorOf(raw) {
  const id = String(raw || "")
    .toLowerCase()
    .trim();
  if (!id) return null;
  return lookup(id);
}

/** Work without a roster actor is unsigned. */
export function identifyWork(input = {}) {
  const agent = actorOf(input.actor);
  if (!agent) {
    return fail("UNSIGNED", "work must name a roster id");
  }
  return {
    ok: true,
    identified: true,
    actor: agent.id,
    kind: agent.kind,
    artifact: String(input.artifact || ""),
    live: false,
    provenance: {
      actor: agent.id,
      source: "identifyWork",
      operation: "sign",
      at: iso(input.at),
      method: IDENTIFY_VERSION,
    },
  };
}

export function involvedOf(input = {}) {
  const ids = [];
  const seen = new Set();
  const push = (raw) => {
    const agent = actorOf(raw);
    if (agent && !seen.has(agent.id)) {
      seen.add(agent.id);
      ids.push(agent.id);
    }
  };
  push(input.actor);
  push(input.node);
  if (Array.isArray(input.actors)) input.actors.forEach(push);
  const prev = input.provenance;
  if (prev && typeof prev === "object") {
    push(prev.actor);
    push(prev.node);
  }
  return ids;
}

/**
 * Error → always advise the involved AI. Swallowing is a failure.
 * delivered=true only if the caller measured a real channel (comment, flux).
 */
export function reportError(input = {}) {
  const involved = involvedOf(input);
  if (!involved.length) {
    return fail("NO_INVOLVED", "error without an identified AI cannot be silent");
  }
  const delivered = input.delivered === true;
  return {
    ok: true,
    silent: false,
    notify: true,
    to: involved,
    act: "OBJECT",
    purpose: "optimization",
    error: {
      code: String(input.code || "ERROR"),
      message: String(input.message || input.error || ""),
    },
    delivered,
    state: delivered ? "EXECUTED" : "PROPOSED",
    live: false,
    auto_merge: false,
    provenance: {
      actor: involved[0],
      source: "reportError",
      operation: "notify",
      at: iso(input.at),
      method: IDENTIFY_VERSION,
    },
  };
}

export function formatAdvice(notice) {
  if (!notice || notice.ok !== true) return "";
  const to = (notice.to || []).map((id) => `@${id}`).join(" ");
  return [
    `NOTIFY ${to}`,
    `act:${notice.act} purpose:${notice.purpose}`,
    `${notice.error.code}: ${notice.error.message}`,
    `delivered:${notice.delivered} state:${notice.state}`,
    "optimize the work you signed — Carl still merges",
  ].join("\n");
}
