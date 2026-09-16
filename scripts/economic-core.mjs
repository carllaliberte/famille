/**
 * ACORN ECONOMIC NETWORK CORE
 * Identity -> admission -> usage -> ledger -> pricing -> billing boundary.
 * Documentary by default. No fingerprinting, hidden tracking, automatic charging,
 * payment-secret handling, or authority escalation.
 */
import { lookup } from "../.github/swarm/flux.mjs";

export const ECONOMIC_VERSION = "economic-network.v1";
export const ACTOR_STATES = Object.freeze([
  "DECLARED",
  "CONNECTED",
  "AUTHENTICATED",
  "AUTHORIZED",
  "SUSPENDED",
  "REVOKED",
  "UNKNOWN",
]);
export const COMMERCIAL_STATES = Object.freeze([
  "FREE",
  "TRIAL",
  "PAYABLE",
  "PAID",
  "EXEMPT",
  "DISPUTED",
]);
export const BILLING_BOUNDARIES = Object.freeze([
  "NONE",
  "HUMAN_REVIEW",
  "BILLING_SYSTEM",
]);

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const SAFE_ID = /^[a-z][a-z0-9-]{1,80}$/;

function now(value) {
  const s = String(value || "");
  return ISO.test(s) ? s : new Date().toISOString();
}

function nonNegative(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function fail(code, error, extra = {}) {
  return { ok: false, code, error, ...extra };
}

/**
 * Connection events contain only identity supplied by the authenticated channel.
 * No IP/device fingerprint is required or invented here.
 */
export function observeConnection(input = {}) {
  const actor = String(input.actor || input.identity || "").toLowerCase().trim();
  if (!actor) return fail("IDENTITY_MISSING", "connection has no supplied identity");
  if (!SAFE_ID.test(actor)) return fail("IDENTITY_INVALID", "connection identity is not a safe id");

  const roster = lookup(actor);
  const authenticated = input.authenticated === true;
  const authorized = input.authorized === true;
  const state = !roster ? "UNKNOWN" : authorized ? "AUTHORIZED" : authenticated ? "AUTHENTICATED" : "CONNECTED";

  return {
    ok: true,
    event: {
      version: ECONOMIC_VERSION,
      event: "CONNECTION_OBSERVED",
      actor,
      known_identity: Boolean(roster),
      identity: roster
        ? { name: roster.name, kind: roster.kind, role: roster.role, capabilities: [...(roster.capabilities || [])] }
        : null,
      channel: String(input.channel || "unknown").slice(0, 120),
      state,
      authenticated,
      authorized,
      at: now(input.at),
      provenance: {
        source: String(input.source || "runtime").slice(0, 120),
        method: "authenticated-channel-identity",
      },
      privacy: {
        hidden_tracking: false,
        fingerprinting: false,
        identity_inference: false,
      },
    },
  };
}

/** Unknown or unauthenticated actors never enter the payable ledger. */
export function admissionDecision(connection) {
  if (!connection?.ok || !connection.event) return fail("CONNECTION_INVALID", "valid connection event required");
  const e = connection.event;
  if (!e.known_identity) return { ok: true, decision: "QUARANTINE", actor: e.actor, human_alert: false, reason: "UNKNOWN_IDENTITY" };
  if (!e.authenticated) return { ok: true, decision: "AUTH_REQUIRED", actor: e.actor, human_alert: false, reason: "NOT_AUTHENTICATED" };
  if (!e.authorized) return { ok: true, decision: "DENY", actor: e.actor, human_alert: false, reason: "NOT_AUTHORIZED" };
  return { ok: true, decision: "ADMIT", actor: e.actor, human_alert: false, reason: "AUTHORIZED" };
}

/** Normalize one execution after independent verification. */
export function meterExecution(input = {}) {
  const actor = String(input.actor || "").toLowerCase().trim();
  const roster = lookup(actor);
  if (!roster) return fail("UNKNOWN_IDENTITY", "verified usage requires a known roster identity");
  if (input.executed !== true) return fail("NOT_EXECUTED", "metering requires executed=true");
  if (input.verified !== true) return fail("NOT_VERIFIED", "metering requires verified=true");

  const executionId = String(input.execution_id || "").trim();
  if (!executionId) return fail("EXECUTION_ID_MISSING", "metering requires execution_id");

  return {
    ok: true,
    event: {
      version: ECONOMIC_VERSION,
      event: "USAGE_METERED",
      actor,
      execution_id: executionId.slice(0, 200),
      capability: String(input.capability || "unknown").slice(0, 100),
      channel: String(input.channel || "runtime").slice(0, 100),
      at: now(input.at),
      units: {
        executions: Math.max(1, nonNegative(input.executions || 1)),
        work_units: nonNegative(input.work_units || 1),
        duration_ms: nonNegative(input.duration_ms),
      },
      verified: true,
      provenance: {
        source: String(input.source || "verified-runtime-evidence").slice(0, 120),
        execution_id: executionId.slice(0, 200),
      },
    },
  };
}

/** De-duplicate execution ids so retries do not silently create duplicate usage. */
export function dedupeUsage(events = []) {
  const seen = new Set();
  const out = [];
  for (const row of Array.isArray(events) ? events : []) {
    const e = row?.event || row;
    if (!e || e.event !== "USAGE_METERED") continue;
    const id = String(e.execution_id || "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(row?.event ? row : { ok: true, event: e });
  }
  return out;
}

/** Build an auditable account ledger from measured events only. */
export function buildEconomicLedger({ connections = [], usage = [], accounts = {} } = {}) {
  const connectionRows = (Array.isArray(connections) ? connections : [])
    .filter((r) => r?.ok === true && r.event?.event === "CONNECTION_OBSERVED");
  const usageRows = dedupeUsage(usage);
  const byActor = new Map();

  for (const row of connectionRows) {
    const e = row.event;
    if (!byActor.has(e.actor)) {
      byActor.set(e.actor, {
        actor: e.actor,
        identity: e.identity,
        actor_state: e.state,
        first_connection: e.at,
        last_connection: e.at,
        connections: 0,
        executions: 0,
        work_units: 0,
        duration_ms: 0,
        commercial_state: accounts[e.actor]?.commercial_state || "FREE",
      });
    }
    const a = byActor.get(e.actor);
    a.connections += 1;
    a.first_connection = a.first_connection < e.at ? a.first_connection : e.at;
    a.last_connection = a.last_connection > e.at ? a.last_connection : e.at;
    a.actor_state = e.state;
  }

  for (const row of usageRows) {
    const e = row.event;
    if (!byActor.has(e.actor)) {
      const roster = lookup(e.actor);
      byActor.set(e.actor, {
        actor: e.actor,
        identity: roster ? { name: roster.name, kind: roster.kind, role: roster.role } : null,
        actor_state: "AUTHORIZED",
        first_connection: e.at,
        last_connection: e.at,
        connections: 0,
        executions: 0,
        work_units: 0,
        duration_ms: 0,
        commercial_state: accounts[e.actor]?.commercial_state || "FREE",
      });
    }
    const a = byActor.get(e.actor);
    a.executions += nonNegative(e.units?.executions);
    a.work_units += nonNegative(e.units?.work_units);
    a.duration_ms += nonNegative(e.units?.duration_ms);
  }

  return [...byActor.values()]
    .map((a) => ({ ...a, measured_usage: a.executions > 0 || a.work_units > 0 }))
    .sort((a, b) => a.actor.localeCompare(b.actor));
}

/**
 * Pricing is a versioned rule input, never an implicit amount.
 * Amounts are calculated only when a rule is explicitly defined and enabled.
 */
export function priceAccount(account, pricing = {}) {
  if (!account?.actor) return fail("ACCOUNT_MISSING", "account required");
  if (!account.measured_usage) return { ok: true, actor: account.actor, state: "NO_USAGE", amount: 0, currency: pricing.currency || null };
  if (account.commercial_state === "EXEMPT") return { ok: true, actor: account.actor, state: "EXEMPT", amount: 0, currency: pricing.currency || null };
  if (account.commercial_state === "FREE" || account.commercial_state === "TRIAL") {
    return { ok: true, actor: account.actor, state: account.commercial_state, amount: 0, currency: pricing.currency || null };
  }
  if (pricing.enabled !== true) {
    return { ok: true, actor: account.actor, state: "PRICING_NOT_ENABLED", amount: null, currency: pricing.currency || null, charge_generated: false };
  }
  const perExecution = nonNegative(pricing.per_execution);
  const perWorkUnit = nonNegative(pricing.per_work_unit);
  const perMinute = nonNegative(pricing.per_minute);
  const amount = account.executions * perExecution + account.work_units * perWorkUnit + (account.duration_ms / 60000) * perMinute;
  return {
    ok: true,
    actor: account.actor,
    state: amount > 0 ? "PRICE_COMPUTED" : "ZERO_PRICE",
    amount: Number(amount.toFixed(6)),
    currency: pricing.currency || null,
    pricing_version: String(pricing.version || "unknown"),
    charge_generated: false,
  };
}

/** Billing boundary: prepares an invoice candidate, never a payment. */
export function prepareBillingCandidate(account, priced) {
  if (!account?.actor || !priced?.ok) return fail("BILLING_INPUT_INVALID", "account and price required");
  const payable = account.commercial_state === "PAYABLE";
  const amountKnown = typeof priced.amount === "number" && priced.amount > 0;
  return {
    ok: true,
    actor: account.actor,
    eligible: payable && amountKnown,
    boundary: payable && amountKnown ? "HUMAN_REVIEW" : "NONE",
    invoice_candidate: payable && amountKnown ? {
      actor: account.actor,
      usage: {
        executions: account.executions,
        work_units: account.work_units,
        duration_ms: account.duration_ms,
      },
      amount: priced.amount,
      currency: priced.currency,
      pricing_version: priced.pricing_version,
    } : null,
    charged: false,
    payment_attempted: false,
  };
}

/** Only exceptional conditions interrupt Carl; routine connections remain silent. */
export function escalation(event = {}) {
  const security = ["UNKNOWN_IDENTITY", "NOT_AUTHORIZED", "AUTH_ANOMALY", "INTEGRITY_FAILURE"].includes(String(event.reason || event.code || ""));
  const human = ["MERGE", "SECRET", "PAYMENT", "AUTHORIZATION", "PRICING_DECISION"].includes(String(event.boundary || event.action || ""));
  return {
    notify_carl: security || human,
    severity: security ? "CRITICAL" : human ? "HUMAN_REQUIRED" : "SILENT",
    automatic: security ? "BLOCK_OR_QUARANTINE" : human ? "HOLD_HUMAN" : "CONTINUE",
  };
}

export function economicSnapshot({ connections = [], usage = [], accounts = {}, pricing = {} } = {}) {
  const ledger = buildEconomicLedger({ connections, usage, accounts });
  const priced = ledger.map((a) => priceAccount(a, pricing));
  const billing = ledger.map((a, i) => prepareBillingCandidate(a, priced[i]));
  return {
    version: ECONOMIC_VERSION,
    observed_at: new Date().toISOString(),
    actors: ledger,
    pricing: { enabled: pricing.enabled === true, version: pricing.version || null, currency: pricing.currency || null },
    billing,
    totals: {
      actors: ledger.length,
      connected: ledger.filter((a) => a.connections > 0).length,
      measured_users: ledger.filter((a) => a.measured_usage).length,
      payable: ledger.filter((a) => a.commercial_state === "PAYABLE" && a.measured_usage).length,
      charge_candidates: billing.filter((b) => b.eligible).length,
    },
    truth: {
      identity_from_authenticated_channel_only: true,
      usage_requires_execution_and_verification: true,
      duplicate_execution_ids_removed: true,
      pricing_explicit: true,
      automatic_charge: false,
      payment_attempted: false,
      hidden_tracking: false,
      human_authority: "carl",
      auto_merge: false,
      live: false,
    },
  };
}
