#!/usr/bin/env node
/**
 * ACORN — CONTINUOUS LEARNING FABRIC
 *
 * Converts observations from the existing Reality/Evidence fabrics into
 * bounded, provenance-aware learning candidates. This is not a second
 * memory, Cortex, runtime or authority layer.
 *
 * observe -> normalize -> compare -> score -> retain/reject/quarantine
 * -> checkpoint -> continue
 *
 * Memory is not truth. A learned item is never automatically verified or live.
 */
import { normalizeObservation, detectContradictions } from "./acorn-cognitive-reality-fabric.mjs";

export const LEARNING_FABRIC_VERSION = "acorn.learning-fabric.v1";

export const LEARNING_STATES = Object.freeze([
  "OBSERVED", "CANDIDATE", "CONTRADICTED", "MEASURED",
  "VERIFIED", "RETAINED", "REJECTED", "QUARANTINED", "STALE",
]);

const s = (v) => String(v ?? "").trim();
const n = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const clamp = (v) => Math.max(0, Math.min(1, n(v)));

function stable(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  return "{" + Object.keys(value).sort().map((k) => JSON.stringify(k) + ":" + stable(value[k])).join(",") + "}";
}

function digest(value) {
  let h = 2166136261;
  for (const c of stable(value)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function learningConstitution() {
  return Object.freeze({
    version: LEARNING_FABRIC_VERSION,
    one_learning_fabric: true,
    second_memory: false,
    second_cortex: false,
    second_runtime: false,
    memory_is_not_truth: true,
    observation_is_not_truth: true,
    candidate_is_not_verification: true,
    verification_is_not_live: true,
    provenance_required_for_retention: true,
    contradictions_are_preserved: true,
    unknown_is_not_trusted: true,
    unknown_is_not_malicious: true,
    arbitrary_self_modification: false,
    authority: "carl",
    auto_merge: false,
    live: false,
  });
}

export function normalizeLearningInput(input = {}) {
  const observation = normalizeObservation(input.observation || input);
  const provenance = input.provenance ?? observation.provenance;
  return {
    observation,
    provenance,
    evidence: input.evidence ?? observation.evidence,
    measurement: input.measurement ?? null,
    verification: input.verification ?? null,
    source_type: s(input.source_type) || "observation",
  };
}

export function learningCandidate(input = {}) {
  const item = normalizeLearningInput(input);
  const o = item.observation;
  const evidenceScore = item.evidence ? clamp(item.evidence.score ?? item.evidence.confidence ?? 0.5) : 0;
  const measurementScore = item.measurement?.measured === true ? clamp(item.measurement.confidence ?? 1) : 0;
  const verificationScore = item.verification?.verified === true ? 1 : 0;
  const provenanceScore = item.provenance ? 1 : 0;
  const confidence = clamp(
    clamp(o.confidence) * 0.35 +
    evidenceScore * 0.2 +
    measurementScore * 0.2 +
    verificationScore * 0.2 +
    provenanceScore * 0.05
  );
  const state = verificationScore === 1 && measurementScore > 0 && provenanceScore === 1
    ? "VERIFIED"
    : "CANDIDATE";
  return {
    id: "learn_" + digest({ observation: o.id, provenance: item.provenance, evidence: item.evidence }),
    subject: o.subject,
    context: o.context,
    capability: [...o.capability],
    confidence,
    state,
    epistemic_state: o.epistemic_state,
    provenance_present: provenanceScore === 1,
    evidence_present: item.evidence != null,
    measured: measurementScore > 0,
    verified: verificationScore === 1,
    expires_at: o.validity?.expires_at ?? null,
    source_observation: o.id,
    authority: false,
    live: false,
  };
}

export function compareLearningSets(before = [], after = []) {
  const b = new Map(before.map((x) => [learningCandidate(x).id, learningCandidate(x)]));
  const a = new Map(after.map((x) => [learningCandidate(x).id, learningCandidate(x)]));
  let promoted = 0;
  let regressed = 0;
  for (const [id, row] of a) {
    const old = b.get(id);
    if (!old) continue;
    if (old.state !== "VERIFIED" && row.state === "VERIFIED") promoted += 1;
    if (old.state === "VERIFIED" && row.state !== "VERIFIED") regressed += 1;
  }
  return {
    added: [...a.keys()].filter((id) => !b.has(id)).length,
    removed: [...b.keys()].filter((id) => !a.has(id)).length,
    promoted,
    regressed,
    information_delta: clamp((promoted + Math.max(0, a.size - b.size)) / Math.max(1, a.size + b.size)),
    live: false,
  };
}

export function resolveLearningState(candidate, related = []) {
  const contradictions = detectContradictions([
    candidate.observation || candidate,
    ...related,
  ]);
  if (contradictions.length) return { ...candidate, state: "CONTRADICTED", contradiction_count: contradictions.length, retained: false, live: false };
  if (candidate.verification === true || candidate.verified === true) {
    if (!candidate.provenance_present) return { ...candidate, state: "QUARANTINED", retained: false, reason: "PROVENANCE_REQUIRED", live: false };
    return { ...candidate, state: "VERIFIED", retained: true, live: false };
  }
  if (candidate.expires_at && Date.parse(candidate.expires_at) <= Date.now()) {
    return { ...candidate, state: "STALE", retained: false, reason: "EXPIRED", live: false };
  }
  return { ...candidate, state: "CANDIDATE", retained: false, live: false };
}

export function learningCheckpoint({ candidates = [], previous = null, at = null } = {}) {
  const rows = candidates.map((x) => learningCandidate(x));
  const record = {
    version: LEARNING_FABRIC_VERSION,
    at: at || new Date().toISOString(),
    count: rows.length,
    verified: rows.filter((x) => x.state === "VERIFIED").length,
    candidates: rows.filter((x) => x.state === "CANDIDATE").length,
    previous,
    authority: "carl",
    auto_merge: false,
    live: false,
  };
  return Object.freeze({ ...record, digest: digest(record) });
}

export function learningCycle({ observations = [], previous = [], related = [] } = {}) {
  const candidates = observations.map((x) => learningCandidate(x));
  const resolved = candidates.map((x) => resolveLearningState(x, related));
  const delta = compareLearningSets(previous, resolved);
  const checkpoint = learningCheckpoint({ candidates: resolved, previous: previous.length });
  return Object.freeze({
    version: LEARNING_FABRIC_VERSION,
    candidates: resolved,
    delta,
    checkpoint,
    constitution: learningConstitution(),
    continue: true,
    authority: "carl",
    auto_merge: false,
    live: false,
  });
}

export function assertLearningInvariant(result = {}) {
  const c = learningConstitution();
  const violations = [];
  for (const [key, expected] of Object.entries(c)) {
    if (key === "version") continue;
    if (result[key] !== undefined && result[key] !== expected) violations.push(key);
    if (result.constitution?.[key] !== undefined && result.constitution[key] !== expected) violations.push("constitution." + key);
  }
  for (const row of result.candidates || []) {
    if (row.authority !== false || row.live !== false) violations.push("candidate_boundary");
    if (row.state === "VERIFIED" && (!row.provenance_present || !row.measured)) violations.push("verification_boundary");
  }
  if (violations.length) throw new Error("LEARNING_FABRIC_INVARIANT_FAILED:" + [...new Set(violations)].join(","));
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = learningCycle({
    observations: [{
      subject: "self-test",
      observer: "acorn",
      epistemic_state: "MEASURED",
      confidence: 0.9,
      provenance: { source: "local" },
      evidence: { score: 1 },
      measurement: { measured: true, confidence: 1 },
      verification: { verified: true },
    }],
  });
  assertLearningInvariant(result);
  console.log(JSON.stringify(result, null, 2));
}
