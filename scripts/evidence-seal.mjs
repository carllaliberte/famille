#!/usr/bin/env node
/**
 * ACORN EVIDENCE SEAL
 * Deterministic integrity marker for machine-produced evidence artifacts.
 * It authenticates bytes against a digest; it does not authenticate authority or truth.
 */
import { createHash } from "node:crypto";

export const EVIDENCE_SEAL_VERSION = "evidence-seal.v1";

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
  }
  return value;
}

export function canonicalEvidence(value) {
  const copy = value && typeof value === "object" && !Array.isArray(value) ? { ...value } : value;
  if (copy && typeof copy === "object" && !Array.isArray(copy)) delete copy.seal;
  return JSON.stringify(normalize(copy));
}

export function evidenceDigest(value) {
  return createHash("sha256").update(canonicalEvidence(value), "utf8").digest("hex");
}

export function sealEvidence(value) {
  return { ...value, seal: { v: EVIDENCE_SEAL_VERSION, algorithm: "sha256", digest: evidenceDigest(value) } };
}

export function verifyEvidenceSeal(value) {
  const expected = value?.seal?.digest;
  if (!expected || value?.seal?.algorithm !== "sha256" || value?.seal?.v !== EVIDENCE_SEAL_VERSION) return false;
  return expected === evidenceDigest(value);
}

export const EVIDENCE_STATES = Object.freeze([
  "VALID",
  "AGING",
  "EXPIRED",
  "SUPERSEDED",
  "CONTRADICTED",
  "REVOKED",
]);

export function expireEvidence({
  evidence = {},
  now = Date.now(),
  issued_at = null,
  ttl_ms = null,
  superseded_by = null,
  contradicted = false,
  revoked = false,
} = {}) {
  if (revoked === true) {
    return { status: "REVOKED", sufficient_for_current_state: false, was_false: false, live: false };
  }
  if (contradicted === true) {
    return { status: "CONTRADICTED", sufficient_for_current_state: false, was_false: false, live: false };
  }
  if (superseded_by) {
    return { status: "SUPERSEDED", sufficient_for_current_state: false, superseded_by, was_false: false, live: false };
  }
  const issued = issued_at || evidence.issued_at || evidence.observed_at || evidence.at;
  const ttl = Number(ttl_ms);
  if (!issued || !Number.isFinite(ttl)) {
    return { status: "UNKNOWN", sufficient_for_current_state: "UNKNOWN", was_false: false, live: false };
  }
  const age = Number(now) - Date.parse(issued);
  if (!Number.isFinite(age)) {
    return { status: "UNKNOWN", sufficient_for_current_state: "UNKNOWN", was_false: false, live: false };
  }
  if (age > ttl) {
    return { status: "EXPIRED", age_ms: age, ttl_ms: ttl, sufficient_for_current_state: false, was_false: false, live: false };
  }
  if (age > ttl * 0.7) {
    return { status: "AGING", age_ms: age, ttl_ms: ttl, sufficient_for_current_state: true, was_false: false, live: false };
  }
  return { status: "VALID", age_ms: age, ttl_ms: ttl, sufficient_for_current_state: true, was_false: false, live: false };
}
