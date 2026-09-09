/**
 * Claims expire. Process attestation ≠ content truth. Builder is not LU.
 * Crypto proves a signature, not the world. HOLD does not become LU.
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

export const TRANSITIONS = Object.freeze({
  UNKNOWN: ["HOLD", "REJECTED"],
  HOLD: ["LU", "REJECTED", "CONTESTED", "EXPIRED"],
  LU: ["EXPIRED", "CONTESTED", "SUPERSEDED"],
  EXPIRED: ["HOLD", "SUPERSEDED"],
  CONTESTED: ["SUPERSEDED", "HOLD"],
  REJECTED: ["SUPERSEDED"],
  SUPERSEDED: [],
});

/** What Ed25519/SHA-256 actually prove. Not independence. Not truth. */
export const CRYPTO_LIMITS = Object.freeze({
  proves: ["payload_bytes", "key_association", "hash_chain"],
  does_not_prove: ["truth", "independence", "absence_of_bias", "freshness_of_world"],
});

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

/** Missing provenance stays UNKNOWN. Never filled in. Process ≠ content. */
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
  const attestation =
    input.attestation === "contenu" || input.attestation_type === "contenu"
      ? "contenu"
      : "processus";
  const body = {
    v: CLAIM_VERSION,
    source: source || null,
    agent: agent || null,
    role,
    statement,
    method: method || null,
    evidence: input.evidence || null,
    vendor: String(input.vendor || agent || "").toLowerCase() || null,
    recorded_at: ts,
    valid_from: input.valid_from ? iso(input.valid_from) : ts,
    valid_until: until,
    until,
    provenance,
    attestation,
    state,
    live: false,
    truth: false,
    confidence: null,
  };
  return { ok: true, claim: { ...body, id: sha256(JSON.stringify(body)).slice(0, 16) } };
}

/** Expired ≠ false. It is no longer current. */
export function at(claim, now) {
  if (!claim || typeof claim !== "object") return fail("CLAIM", "missing claim");
  const t = typeof now === "number" && Number.isFinite(now) ? now : parseTs(now) || Date.now();
  const until = claim.valid_until || claim.until;
  if (until && parseTs(until) < t) {
    return {
      ok: true,
      claim: { ...claim, state: "EXPIRED", current: false, false: false, not_current: true },
    };
  }
  return { ok: true, claim: { ...claim, current: claim.state !== "UNKNOWN" } };
}

/** Reconstruct what the system held at T. Old-as-current is EXPIRED. */
export function asOf(claims, now) {
  const t = typeof now === "number" && Number.isFinite(now) ? now : parseTs(now) || Date.now();
  const list = Array.isArray(claims) ? claims : [];
  return {
    ok: true,
    at: new Date(t).toISOString(),
    claims: list
      .filter((c) => parseTs(c.recorded_at || c.ts) <= t)
      .map((c) => at(c, t).claim)
      .filter(Boolean),
  };
}

function canGo(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

export function markLu(claim, reviewer, evidenceHash) {
  const who = String(reviewer || "").toLowerCase();
  if (!claim || !claim.agent) return fail("CLAIM", "no claim");
  if (who && who === claim.agent) {
    return fail("SELF_REVIEW", "builder is not independent LU");
  }
  if (!String(evidenceHash || "").trim()) {
    return fail("LU_NO_EVIDENCE", "LU needs evidence_hash of the content actually read");
  }
  if (claim.state === "HOLD" && !who) return fail("HOLD", "HOLD does not become LU");
  if (claim.state === "EXPIRED") return fail("EXPIRED", "revalidate first");
  if (claim.state !== "UNKNOWN" && !canGo(claim.state, "LU") && claim.state !== "HOLD") {
    return fail("TRANSITION", `${claim.state} → LU`);
  }
  return {
    ok: true,
    claim: {
      ...claim,
      state: "LU",
      reviewer: who || null,
      evidence_hash: String(evidenceHash).slice(0, 64),
      attestation: "processus",
      truth: false,
    },
  };
}

export function contest(a, b) {
  if (!a || !b) return fail("CONFLICT", "two claims required");
  if (a.vendor && b.vendor && a.vendor === b.vendor && a.agent !== b.agent) {
    return fail("ECHO", "same vendor is not independent review");
  }
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
    truth: false,
  };
}
