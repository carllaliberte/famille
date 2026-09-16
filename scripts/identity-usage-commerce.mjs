/**
 * ACORN IDENTITY / USAGE / COMMERCE
 * Measures verified use without inventing customers or charges.
 * Roster identity comes from schema/agents.json via flux.lookup.
 * Commercial state is documentary only: no automatic billing, payment, or secret handling.
 */
import { lookup } from "../.github/swarm/flux.mjs";

export const IDENTITY_USAGE_VERSION = "identity-usage-commerce.v1";
export const COMMERCIAL_STATES = Object.freeze(["FREE", "TRIAL", "PAYABLE", "PAID", "EXEMPT"]);

function fail(code, error) {
  return { ok: false, code, error };
}

function iso(value) {
  const s = String(value || "");
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
}

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Normalize one real execution into a billable-use observation.
 * A declared identity without a verified execution never becomes usage.
 */
export function recordUsage(input = {}) {
  const actor = String(input.actor || "").toLowerCase().trim();
  const agent = lookup(actor);
  if (!agent) return fail("UNKNOWN_IDENTITY", `unknown roster identity: ${actor || "(empty)"}`);
  if (input.executed !== true) return fail("NOT_EXECUTED", "usage requires executed=true");
  if (input.verified !== true) return fail("NOT_VERIFIED", "usage requires verified=true");

  const event = {
    version: IDENTITY_USAGE_VERSION,
    event: "USAGE_MEASURED",
    actor: agent.id,
    identity: {
      name: agent.name,
      kind: agent.kind,
      role: agent.role,
    },
    channel: String(input.channel || "cognitive-worker").slice(0, 80),
    capability: String(input.capability || "cognitive-work").slice(0, 80),
    execution_id: String(input.execution_id || "unknown").slice(0, 160),
    at: iso(input.at),
    units: {
      executions: number(input.executions || 1),
      work_units: number(input.work_units || 1),
      duration_ms: number(input.duration_ms),
    },
    commercial: {
      state: COMMERCIAL_STATES.includes(input.commercial_state) ? input.commercial_state : "FREE",
      pricing_defined: input.pricing_defined === true,
      charge_authorized: input.charge_authorized === true,
      charged: false,
    },
    provenance: {
      source: "identity-usage-commerce",
      method: IDENTITY_USAGE_VERSION,
      actor: agent.id,
      at: iso(input.at),
    },
  };
  return { ok: true, event };
}

/** Build a documentary account from only verified usage events. */
export function buildAccount(events = []) {
  const rows = Array.isArray(events) ? events.filter((x) => x?.ok === true && x.event?.event === "USAGE_MEASURED") : [];
  const accounts = new Map();
  for (const row of rows) {
    const e = row.event;
    const current = accounts.get(e.actor) || {
      actor: e.actor,
      identity: e.identity,
      executions: 0,
      work_units: 0,
      duration_ms: 0,
      first_seen: e.at,
      last_seen: e.at,
      commercial_state: e.commercial.state,
      charged: false,
    };
    current.executions += number(e.units?.executions);
    current.work_units += number(e.units?.work_units);
    current.duration_ms += number(e.units?.duration_ms);
    current.first_seen = current.first_seen < e.at ? current.first_seen : e.at;
    current.last_seen = current.last_seen > e.at ? current.last_seen : e.at;
    current.commercial_state = e.commercial.state;
    accounts.set(e.actor, current);
  }
  return [...accounts.values()].sort((a, b) => a.actor.localeCompare(b.actor));
}

/**
 * Decide whether an account is ready for human/commercial processing.
 * This never creates a charge. It only exposes measured eligibility.
 */
export function commercialReview(account) {
  if (!account || !account.actor) return fail("ACCOUNT_MISSING", "account required");
  const payable = account.commercial_state === "PAYABLE";
  return {
    ok: true,
    actor: account.actor,
    measured_usage: account.executions > 0 || account.work_units > 0,
    commercial_review: payable,
    billing_action: payable ? "HUMAN_OR_BILLING_SYSTEM" : "NONE",
    charged: false,
  };
}
