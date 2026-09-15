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
