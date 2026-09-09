/**
 * Claims expire. Provenance is never invented. Builder is not independent LU.
 * HOLD does not become LU. A signature is not truth.
 */
import { OWNER_ACTOR } from "./flux.mjs";
import { sha256 } from "./lease.mjs";

export const CLAIM_VERSION = "claim.v0";
export const HUMAN = OWNER_ACTOR;

export const CLAIM_STATES = Object.freeze([
  "UNKNOWN",
  "HOLD",
  "LU",
  "REJECTED",
  "CONTESTED",
  "EXPIRED",
  "SUPERSEDED",
]);

function fail(code, error) {
  return { ok: false, code, error };
}

function iso(ts) {
  const s = String(ts || "");
  return /^\d{4}-\d{2}-\d{2}T.*Z$/.test(s) ? s : new Date().toISOString();
}

function parseTs(ts) {
  const t = Date.parse(String(ts || ""));
  return Number.isFinite(t) ? t : NaN;
}

/** Missing provenance stays UNKNOWN. Never filled in. */
export function makeClaim(input = {}) {
  if (input.verified === true || input.truth === true) {
    return fail("NO_ETERNAL", "verified=true is not a state — certainties expire");
  }
  const source = String(input.source || "").trim();
  const agent = String(input.agent || "").trim().toLowerCase();
  const role = String(input.role || "build").trim().toLowerCase();
  const statement = String(input.statement || "").trim().slice(0, 400);
  const method = String(input.method || "").trim();
  if (!statement) return fail("CLAIM", "statement required");
  const ts = iso(input.ts);
  const until = input.until ? iso(input.until) : null;
  const provenance = source && agent && method ? "STATED" : "UNKNOWN";
  const state = provenance === "UNKNOWN" ? "UNKNOWN" : "HOLD";
  const body = {
    v: CLAIM_VERSION,
    source: source || null,
    agent: agent || null,
    role,
    statement,
    method: method || null,
    evidence: input.evidence || null,
    ts,
    until,
    provenance,
    state,
    live: false,
    truth: false,
  };
  return { ok: true, claim: { ...body, id: sha256(JSON.stringify(body)).slice(0, 16) } };
}

/** Expired ≠ false. It is no longer current. */
export function at(claim, now) {
  if (!claim || typeof claim !== "object") return fail("CLAIM", "missing claim");
  const t = typeof now === "number" && Number.isFinite(now) ? now : parseTs(now) || Date.now();
  if (claim.until && parseTs(claim.until) < t) {
    return {
      ok: true,
      claim: { ...claim, state: "EXPIRED", current: false, false: false },
    };
  }
  return { ok: true, claim: { ...claim, current: claim.state !== "UNKNOWN" } };
}

export function markLu(claim, reviewer) {
  const who = String(reviewer || "").toLowerCase();
  if (!claim || !claim.agent) return fail("CLAIM", "no claim");
  if (who && who === claim.agent) {
    return fail("SELF_REVIEW", "builder is not independent LU");
  }
  if (claim.state === "HOLD" && !who) return fail("HOLD", "HOLD does not become LU");
  if (claim.state === "EXPIRED") return fail("EXPIRED", "revalidate first");
  return { ok: true, claim: { ...claim, state: "LU", reviewer: who || null } };
}

export function contest(a, b) {
  if (!a || !b) return fail("CONFLICT", "two claims required");
  return {
    ok: true,
    conflict: {
      v: CLAIM_VERSION,
      a,
      b,
      state: "CONTESTED",
      vote: false,
      winner: null,
      live: false,
      truth: false,
    },
  };
}

export function decide(conflict, requester) {
  if (String(requester || "").toLowerCase() !== HUMAN) {
    return fail("HUMAN_ONLY", "Carl resolves conflicts");
  }
  if (!conflict || conflict.state !== "CONTESTED") return fail("CONFLICT", "not contested");
  return {
    ok: true,
    conflict: { ...conflict, state: "SUPERSEDED", by: HUMAN },
    live: false,
  };
}
