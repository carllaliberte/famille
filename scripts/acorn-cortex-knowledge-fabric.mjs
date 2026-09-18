/** ACORN — CORTEX KNOWLEDGE FABRIC
 * Local rail. Not claim.v0. Not a measure. Not LIVE.
 * FNV-1a 32 = local object id only. ≠ evidence_hash / SHA-256 / claim.v0.
 * DEFINED ≠ CODE VERIFIED ≠ TEST VERIFIED ≠ EXECUTED ≠ MEASURED ≠ LIVE VERIFIED.
 */
export const CONTRACT = "acorn.cortex-knowledge-fabric.v1";
export const ID_ALGO = "fnv1a-32";
export const KNOWLEDGE_STATES = Object.freeze([
  "OBSERVED",
  "MEASURED",
  "VERIFIED",
  "PROVISIONAL",
  "EXPIRED",
  "CONTESTED"
]);
export const KNOWLEDGE_TYPES = Object.freeze([
  "FACT",
  "CAPABILITY",
  "PATTERN",
  "LESSON",
  "CONSTRAINT",
  "OPPORTUNITY",
  "RISK",
  "OUTCOME"
]);
export const CONSTITUTION_FLAGS = Object.freeze([
  "breaker_touched",
  "authority_transfer",
  "hidden_learning",
  "auto_merge",
  "auto_spend",
  "auto_signature"
]);

const A = (v) => (Array.isArray(v) ? v : []);
const S = (v) => String(v ?? "").trim();
const now = () => new Date().toISOString();

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
    hidden_learning: source.hidden_learning === true,
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
  predicate,
  value,
  type = "FACT",
  source,
  confidence = 0,
  evidence = [],
  expires_at = null,
  scope = "ecosystem"
} = {}) {
  if (!S(subject) || !S(predicate) || !S(source)) throw new Error("KNOWLEDGE_IDENTITY_REQUIRED");
  if (!KNOWLEDGE_TYPES.includes(type)) throw new Error("KNOWLEDGE_TYPE_UNSUPPORTED");
  const items = A(evidence).map(S).filter(Boolean);
  const id = `knowledge:${localFnv1a32([subject, predicate, source, scope, type].join("|"))}`;
  return {
    id,
    subject,
    predicate,
    value,
    type,
    source,
    confidence,
    evidence: items,
    expires_at,
    scope,
    state: "PROVISIONAL",
    provenance: { source, created_at: now(), id_algo: ID_ALGO, evidence_count: items.length },
    ...railMarks()
  };
}

/** Local rail gate. Evidence tokens required. Never mints VERIFIED from a count. */
export function validateKnowledge(k) {
  if (!k || typeof k !== "object") throw new Error("KNOWLEDGE_REQUIRED");
  if (!S(k.source)) throw new Error("KNOWLEDGE_IDENTITY_REQUIRED");
  const evidence = evidenceList(k);
  if (!evidence.length) throw new Error("EVIDENCE_REQUIRED");
  if (Object.hasOwn(k, "evidence_hash") && k.evidence_hash) {
    throw new Error("LOCAL_FNV_IS_NOT_EVIDENCE_HASH");
  }
  const next = {
    ...k,
    evidence,
    state: "OBSERVED",
    validated_at: now(),
    ...railMarks(k)
  };
  delete next.evidence_hash;
  return next;
}

export function shareKnowledge(k, { recipient_scope = "ecosystem", consent = true } = {}) {
  if (!k || typeof k !== "object") {
    return { shared: false, reason: "KNOWLEDGE_REQUIRED", authority: false, live: false };
  }
  if (!consent) return { ...k, shared: false, reason: "CONSENT_REQUIRED", authority: false, live: false };
  return {
    knowledge_id: k.id,
    recipient_scope,
    shared: true,
    source: k.source,
    state: k.state,
    confidence: k.confidence,
    expires_at: k.expires_at,
    ...railMarks(k)
  };
}

/** In-process A → B. Not EXECUTED of the grand chantier. Authority never moves. */
export function transferKnowledge({ from, to, knowledge } = {}) {
  if (!S(from) || !S(to)) throw new Error("TRANSFER_IDENTITY_REQUIRED");
  if (from === to) throw new Error("TRANSFER_REQUIRES_DISTINCT_PARTIES");
  if (!knowledge || typeof knowledge !== "object") throw new Error("KNOWLEDGE_REQUIRED");
  const shared = shareKnowledge(knowledge, { recipient_scope: to, consent: true });
  return {
    from,
    to,
    path: "A_TO_B",
    knowledge_id: knowledge.id,
    source: knowledge.source,
    state: knowledge.state,
    shared: shared.shared === true,
    authority_transferred: false,
    path_ran: true,
    ...railMarks(knowledge)
  };
}

export function buildKnowledgeGraph(items = []) {
  const valid = A(items).filter((k) => k && k.state !== "EXPIRED");
  const nodes = valid.map((k) => ({
    id: k.id,
    type: k.type,
    subject: k.subject,
    predicate: k.predicate,
    value: k.value,
    state: k.state,
    confidence: k.confidence
  }));
  const edges = [];
  const seen = new Set();
  for (const a of valid) {
    for (const b of valid) {
      if (!a.id || a.id === b.id) continue;
      const relation =
        a.subject === b.subject ? "SAME_SUBJECT" : a.predicate === b.predicate ? "SAME_PATTERN" : null;
      if (!relation) continue;
      const key = [a.id, b.id].sort().join("|") + "|" + relation;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from: a.id, to: b.id, relation });
    }
  }
  return { contract: CONTRACT, nodes, edges, created_at: now(), breaker_touched: false, live: false };
}

export function deriveInsight({ knowledge = [], goal, minimum_confidence = 0.5 } = {}) {
  const usable = A(knowledge).filter(
    (k) => ["VERIFIED", "MEASURED", "OBSERVED"].includes(k.state) && Number(k.confidence) >= minimum_confidence
  );
  return {
    goal,
    inputs: usable.map((k) => k.id),
    patterns: [...new Set(usable.map((k) => k.predicate))],
    state: "PROVISIONAL",
    requires_validation: true,
    ...railMarks()
  };
}

export function routeKnowledge({ knowledge = [], need } = {}) {
  return A(knowledge)
    .filter((k) => k.state !== "EXPIRED" && (!need || k.subject === need || k.predicate === need))
    .sort((a, b) => Number(b.confidence) - Number(a.confidence))
    .map((k) => k.id);
}

export function expireKnowledge({ knowledge = [], at = Date.now() } = {}) {
  return A(knowledge).map((k) =>
    k.expires_at && Date.parse(k.expires_at) <= at ? { ...k, state: "EXPIRED" } : k
  );
}

export function cortexSnapshot({ knowledge = [], participants = [], capabilities = [], outcomes = [] } = {}) {
  return {
    contract: CONTRACT,
    knowledge_count: A(knowledge).length,
    verified_count: A(knowledge).filter((k) => k.state === "VERIFIED").length,
    observed_count: A(knowledge).filter((k) => k.state === "OBSERVED").length,
    participants: A(participants).length,
    capabilities: A(capabilities).length,
    outcomes: A(outcomes).length,
    updated_at: now(),
    ...railMarks()
  };
}

export function assertCortexConstitution(snapshot) {
  if (snapshot == null || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error("CONSTITUTION_SNAPSHOT_REQUIRED");
  }
  for (const key of CONSTITUTION_FLAGS) {
    if (!Object.hasOwn(snapshot, key)) throw new Error("CONSTITUTION_SNAPSHOT_REQUIRED");
  }
  if (snapshot.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
  if (snapshot.authority_transfer) throw new Error("KNOWLEDGE_MUST_NOT_GRANT_AUTHORITY");
  if (snapshot.hidden_learning) throw new Error("LEARNING_MUST_BE_TRACEABLE");
  if (snapshot.auto_merge) throw new Error("AUTO_MERGE_FORBIDDEN");
  if (snapshot.auto_spend) throw new Error("AUTO_SPEND_FORBIDDEN");
  if (snapshot.auto_signature) throw new Error("AUTO_SIGNATURE_FORBIDDEN");
  if (snapshot.live === true) throw new Error("LIVE_VERIFIED_IS_CARL_ONLY");
  if (snapshot.claim_v0 === true) throw new Error("LOCAL_RAIL_IS_NOT_CLAIM_V0");
  const transfer = snapshot.transfer;
  if (!transfer || typeof transfer !== "object") throw new Error("TRANSFER_EXECUTION_REQUIRED");
  if (!S(transfer.from) || !S(transfer.to) || transfer.from === transfer.to) {
    throw new Error("TRANSFER_A_TO_B_REQUIRED");
  }
  if (transfer.path_ran !== true) throw new Error("TRANSFER_A_TO_B_REQUIRED");
  if (transfer.authority === true || transfer.authority_transferred === true) {
    throw new Error("KNOWLEDGE_MUST_NOT_GRANT_AUTHORITY");
  }
  return true;
}
