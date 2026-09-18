/** ACORN — OPERATIONAL MEMORY CORTEX
 * Local rail. Not claim.v0. Not a measure. Not LIVE.
 * FNV-1a 32 = local object id only. ≠ evidence_hash / SHA-256 / claim.v0.
 * DEFINED ≠ CODE VERIFIED ≠ TEST VERIFIED ≠ EXECUTED ≠ MEASURED ≠ LIVE VERIFIED.
 */
export const CONTRACT = "acorn.operational-memory-cortex.v1";
export const ID_ALGO = "fnv1a-32";
export const MEMORY_STATES = Object.freeze([
  "RECORDED",
  "PROVISIONAL",
  "OBSERVED",
  "VERIFIED",
  "RECALLED",
  "CONSOLIDATED",
  "EXPIRED"
]);
export const CONSTITUTION_FLAGS = Object.freeze([
  "breaker_touched",
  "authority_transfer",
  "hidden_memory",
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
    hidden_memory: source.hidden_memory === true,
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

function evidenceToken(v) {
  return typeof v === "string" ? v.trim() : "";
}

function evidenceList(item) {
  return A(item?.evidence).map(evidenceToken).filter(Boolean);
}

function tokens(text) {
  return S(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

export function isExpired(item, at = Date.now()) {
  if (!item) return false;
  if (item.state === "EXPIRED") return true;
  if (item.expires_at && Date.parse(item.expires_at) <= at) return true;
  return false;
}

function provenanceOf(item, extra = {}) {
  return {
    actor: item?.actor ?? extra.actor ?? null,
    source_episode: item?.id ?? item?.source_episode ?? extra.source_episode ?? null,
    evidence_count: evidenceList(item).length,
    id_algo: ID_ALGO,
    ...extra
  };
}

export function recordEpisode({
  actor,
  goal,
  actions = [],
  observations = [],
  outcomes = [],
  cost = 0,
  duration_ms = 0,
  evidence = [],
  expires_at = null
} = {}) {
  if (!S(actor) || !S(goal)) throw new Error("EPISODE_IDENTITY_REQUIRED");
  const items = A(evidence).map(evidenceToken).filter(Boolean);
  const id = `episode:${localFnv1a32(
    [actor, goal, JSON.stringify(A(outcomes)), JSON.stringify(A(actions)), JSON.stringify(items)].join("|")
  )}`;
  return {
    id,
    actor,
    goal,
    actions: A(actions),
    observations: A(observations),
    outcomes: A(outcomes),
    cost: Number(cost) || 0,
    duration_ms: Number(duration_ms) || 0,
    evidence: items,
    expires_at,
    state: "RECORDED",
    created_at: now(),
    provenance: provenanceOf({ id, actor, evidence: items }),
    ...railMarks()
  };
}

export function extractLessons({ episode, lessons = [] } = {}) {
  if (!episode || typeof episode !== "object") throw new Error("EPISODE_REQUIRED");
  return A(lessons)
    .map(S)
    .filter(Boolean)
    .map((lesson) => ({
      lesson,
      actor: episode.actor ?? null,
      source_episode: episode.id ?? null,
      evidence: evidenceList(episode),
      expires_at: episode.expires_at ?? null,
      state: "PROVISIONAL",
      requires_validation: true,
      provenance: provenanceOf(episode, { lesson }),
      ...railMarks(episode)
    }));
}

/** Local rail gate. Evidence tokens required. Does not mint claim.v0 evidence_hash. */
export function validateLesson(lesson, { evidence = [], actor } = {}) {
  if (!lesson || typeof lesson !== "object") throw new Error("LESSON_REQUIRED");
  if (isExpired(lesson)) throw new Error("EXPIRED_CANNOT_REVALIDATE");
  const nextEvidence = [...evidenceList(lesson), ...A(evidence).map(evidenceToken)].filter(Boolean);
  if (!nextEvidence.length) throw new Error("EVIDENCE_REQUIRED");
  if (Object.hasOwn(lesson, "evidence_hash") && lesson.evidence_hash) {
    throw new Error("LOCAL_FNV_IS_NOT_EVIDENCE_HASH");
  }
  const nextActor = S(actor) || S(lesson.actor);
  if (!nextActor) throw new Error("ACTOR_REQUIRED");
  const next = {
    ...lesson,
    actor: nextActor,
    evidence: nextEvidence,
    state: "VERIFIED",
    validated_at: now(),
    validated_by: "LOCAL_RAIL",
    provenance: {
      ...provenanceOf({ ...lesson, actor: nextActor, evidence: nextEvidence }),
      validated_by: "LOCAL_RAIL"
    },
    ...railMarks(lesson)
  };
  delete next.evidence_hash;
  return next;
}

/** Token overlap on the goal. Not String.includes. Provenance is copied, not inferred. */
export function recall({ episodes = [], lessons = [], goal, actor, at = Date.now() } = {}) {
  const want = tokens(goal);
  const actorOk = (row) => !S(actor) || S(row.actor) === S(actor);
  const lessonHits = A(lessons)
    .filter((x) => x.state === "VERIFIED" && !isExpired(x, at) && actorOk(x) && evidenceList(x).length)
    .filter((x) => {
      const hay = tokens([x.lesson, x.goal].filter(Boolean).join(" "));
      return want.length && want.every((t) => hay.includes(t));
    })
    .map((x) => ({
      lesson: x.lesson,
      actor: x.actor ?? null,
      source_episode: x.source_episode ?? null,
      evidence: evidenceList(x),
      state: x.state,
      provenance: x.provenance || provenanceOf(x),
      ...railMarks(x)
    }));
  const episodeHits = A(episodes)
    .filter((x) => !isExpired(x, at) && actorOk(x))
    .filter((x) => {
      const hay = tokens(x.goal);
      return want.length && want.every((t) => hay.includes(t));
    })
    .map((x) => ({
      source_episode: x.id,
      actor: x.actor ?? null,
      goal: x.goal,
      outcomes: x.outcomes,
      state: x.state,
      provenance: x.provenance || provenanceOf(x),
      ...railMarks(x)
    }));
  return {
    goal,
    results: [...lessonHits, ...episodeHits].slice(0, 25),
    state: "RECALLED",
    match: "TOKEN",
    ...railMarks()
  };
}

export function consolidate({ episodes = [], lessons = [], at = Date.now() } = {}) {
  const verified = A(lessons).filter(
    (x) => x.state === "VERIFIED" && !isExpired(x, at) && evidenceList(x).length
  );
  return {
    contract: CONTRACT,
    episodes: A(episodes).length,
    lessons: A(lessons).length,
    verified_lessons: verified.length,
    patterns: [...new Set(verified.map((x) => x.lesson))],
    provenance: verified.map((x) => x.provenance || provenanceOf(x)),
    state: "CONSOLIDATED",
    created_at: now(),
    ...railMarks()
  };
}

export function forgetExpired(items = [], at = Date.now()) {
  return A(items).map((x) => (isExpired(x, at) ? { ...x, state: "EXPIRED" } : x));
}

export function assertOperationalMemoryConstitution(snapshot) {
  if (snapshot == null || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error("CONSTITUTION_SNAPSHOT_REQUIRED");
  }
  for (const key of CONSTITUTION_FLAGS) {
    if (!Object.hasOwn(snapshot, key)) throw new Error("CONSTITUTION_SNAPSHOT_REQUIRED");
  }
  if (snapshot.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
  if (snapshot.hidden_memory) throw new Error("MEMORY_MUST_BE_TRACEABLE");
  if (snapshot.authority_transfer) throw new Error("MEMORY_CANNOT_GRANT_AUTHORITY");
  if (snapshot.auto_merge) throw new Error("AUTO_MERGE_FORBIDDEN");
  if (snapshot.auto_spend) throw new Error("AUTO_SPEND_FORBIDDEN");
  if (snapshot.auto_signature) throw new Error("AUTO_SIGNATURE_FORBIDDEN");
  if (snapshot.live === true) throw new Error("LIVE_VERIFIED_IS_CARL_ONLY");
  if (snapshot.claim_v0 === true) throw new Error("LOCAL_RAIL_IS_NOT_CLAIM_V0");
  return true;
}
