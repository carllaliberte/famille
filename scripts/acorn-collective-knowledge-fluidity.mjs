/** ACORN — COLLECTIVE KNOWLEDGE & FLUIDITY FABRIC
 * Local rail. Not claim.v0. Not a measure. Not LIVE.
 * FNV-1a 32 = local object id only. ≠ evidence_hash / SHA-256 / claim.v0.
 * DEFINED ≠ CODE VERIFIED ≠ TEST VERIFIED ≠ EXECUTED ≠ MEASURED ≠ LIVE VERIFIED.
 */
export const CONTRACT = "acorn.collective-knowledge-fluidity.v1";
export const ID_ALGO = "fnv1a-32";
export const KNOWLEDGE_STATES = Object.freeze([
  "PROPOSED",
  "OBSERVED",
  "MEASURED",
  "VERIFIED",
  "EXPIRED",
  "REVOKED"
]);
export const CONSTITUTION_FLAGS = Object.freeze([
  "breaker_touched",
  "authority_transfer",
  "auto_merge",
  "auto_spend",
  "auto_signature"
]);

const A = (v) => (Array.isArray(v) ? v : []);
const S = (v) => String(v ?? "").trim();

/** Local FNV-1a 32. Not SHA-256. Not claim.v0 evidence_hash. */
function localFnv1a32(s) {
  let h = 2166136261;
  for (const c of S(s)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function constitutionFlags(source = {}) {
  return {
    breaker_touched: source.breaker_touched === true,
    authority_transfer: source.authority_transfer === true,
    auto_merge: source.auto_merge === true,
    auto_spend: source.auto_spend === true,
    auto_signature: source.auto_signature === true
  };
}

function railMarks(source = {}) {
  return {
    id_algo: ID_ALGO,
    claim_v0: false,
    live: false,
    executed: false,
    measured: false,
    authority: false,
    ...constitutionFlags(source)
  };
}

function evidenceList(knowledge) {
  return A(knowledge?.evidence).map(S).filter(Boolean);
}

export function createKnowledge({
  subject,
  claim,
  evidence = [],
  source = "UNKNOWN",
  scope = "LOCAL",
  confidence = 0.5,
  expires_at = null
} = {}) {
  if (!S(subject) || !S(claim)) throw new Error("KNOWLEDGE_CONTENT_REQUIRED");
  const items = A(evidence).map(S).filter(Boolean);
  return {
    id: `knowledge:${localFnv1a32(subject + "|" + claim + "|" + scope)}`,
    subject,
    claim,
    evidence: items,
    source,
    scope,
    confidence,
    state: "PROPOSED",
    expires_at,
    provenance: { source, scope, evidence_count: items.length, id_algo: ID_ALGO },
    ...railMarks()
  };
}

export function addEvidence(knowledge, { evidence, source, measurement = null } = {}) {
  if (!knowledge || typeof knowledge !== "object") throw new Error("KNOWLEDGE_REQUIRED");
  const nextEvidence = [...evidenceList(knowledge), S(evidence)].filter(Boolean);
  const next = {
    ...knowledge,
    evidence: nextEvidence,
    source: source || knowledge.source,
    provenance: {
      ...(knowledge.provenance || {}),
      source: source || knowledge.source,
      evidence_count: nextEvidence.length,
      id_algo: ID_ALGO
    },
    state: nextEvidence.length ? "OBSERVED" : "PROPOSED",
    ...railMarks(knowledge)
  };
  if (measurement !== null) next.measurement = measurement;
  return next;
}

/** Local rail gate. Evidence tokens required. Does not mint claim.v0 evidence_hash. */
export function verifyKnowledge(knowledge, { verifier = "LOCAL_RAIL", confidence = 0.8, scope } = {}) {
  if (!knowledge || typeof knowledge !== "object") throw new Error("KNOWLEDGE_REQUIRED");
  const evidence = evidenceList(knowledge);
  if (!evidence.length) throw new Error("EVIDENCE_REQUIRED");
  if (Object.hasOwn(knowledge, "evidence_hash") && knowledge.evidence_hash) {
    throw new Error("LOCAL_FNV_IS_NOT_EVIDENCE_HASH");
  }
  const next = {
    ...knowledge,
    evidence,
    confidence,
    scope: scope || knowledge.scope,
    state: "VERIFIED",
    verified_by: verifier,
    verified_at: new Date().toISOString(),
    ...railMarks(knowledge)
  };
  delete next.evidence_hash;
  return next;
}

export function shareKnowledge(knowledge, { from = "UNKNOWN", to = [], purpose = "REUSE" } = {}) {
  if (!knowledge || typeof knowledge !== "object") {
    return { state: "BLOCKED", reason: "KNOWLEDGE_REQUIRED", live: false };
  }
  if (knowledge.state !== "VERIFIED" && knowledge.state !== "MEASURED") {
    return { state: "BLOCKED", reason: "KNOWLEDGE_NOT_TRUSTED", knowledge_id: knowledge.id, live: false };
  }
  return {
    knowledge_id: knowledge.id,
    from,
    to: A(to),
    purpose,
    transfer: "PROVENANCE_PRESERVED",
    state: "PROPOSED",
    ...railMarks(knowledge)
  };
}

export function mergeKnowledge({ items = [], subject } = {}) {
  const relevant = A(items).filter(
    (x) => x.subject === subject && ["OBSERVED", "MEASURED", "VERIFIED"].includes(x.state)
  );
  const evidence = [...new Set(relevant.flatMap((x) => evidenceList(x)))];
  const confidence = relevant.length ? Math.max(...relevant.map((x) => Number(x.confidence) || 0)) : 0;
  const conflicts = [...new Set(relevant.map((x) => x.claim))];
  return {
    subject,
    claims: conflicts,
    evidence,
    confidence,
    state: relevant.length ? "OBSERVED" : "PROPOSED",
    conflict: conflicts.length > 1,
    provenance: relevant.map((x) => x.id),
    ...railMarks()
  };
}

export function routeForKnowledge({ knowledge, participants = [], constraints = {} } = {}) {
  if (!knowledge || !knowledge.id) throw new Error("KNOWLEDGE_REQUIRED");
  return A(participants)
    .map((p) => ({
      participant: p.id || p.identity,
      capability: p.capability || "knowledge",
      knowledge_id: knowledge.id,
      fit: knowledge.scope === p.scope ? 1 : 0.5,
      constraints,
      state: "PROPOSED",
      ...railMarks()
    }))
    .sort((a, b) => b.fit - a.fit);
}

export function learnGlobally({ local_results = [], global_memory = [] } = {}) {
  const all = [...A(global_memory), ...A(local_results)];
  const verified = all.filter((x) => x.state === "VERIFIED" && evidenceList(x).length);
  const reusable = [...new Map(verified.map((x) => [x.id, x])).values()];
  return {
    reusable_count: reusable.length,
    knowledge_ids: reusable.map((x) => x.id),
    deduplicated: true,
    provenance_preserved: true,
    state: "LEARNED",
    ...railMarks()
  };
}

export function assertCollectiveKnowledgeConstitution(snapshot) {
  if (snapshot == null || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error("CONSTITUTION_SNAPSHOT_REQUIRED");
  }
  for (const key of CONSTITUTION_FLAGS) {
    if (!Object.hasOwn(snapshot, key)) throw new Error("CONSTITUTION_SNAPSHOT_REQUIRED");
  }
  if (snapshot.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
  if (snapshot.authority_transfer) throw new Error("KNOWLEDGE_CANNOT_GRANT_AUTHORITY");
  if (snapshot.auto_merge) throw new Error("AUTO_MERGE_FORBIDDEN");
  if (snapshot.auto_spend) throw new Error("AUTO_SPEND_FORBIDDEN");
  if (snapshot.auto_signature) throw new Error("AUTO_SIGNATURE_FORBIDDEN");
  if (snapshot.undated_verification) throw new Error("VERIFICATION_REQUIRES_TEMPORAL_CONTEXT");
  if (snapshot.unproven_global_claim) throw new Error("GLOBAL_CLAIM_REQUIRES_EVIDENCE");
  if (snapshot.live === true) throw new Error("LIVE_VERIFIED_IS_CARL_ONLY");
  if (snapshot.claim_v0 === true) throw new Error("LOCAL_RAIL_IS_NOT_CLAIM_V0");
  return true;
}
