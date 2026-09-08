/**
 * Collective cognition pool — session layer on mesh.v0 / acorn.v0.
 * Not a second mesh. Not a second memory. Not a second governance.
 * IDENTITY + CAPABILITIES + CHANNEL + PROVENANCE.
 * Declared ≠ connected ≠ active ≠ LIVE. LIVE VERIFIED is Carl only.
 * Majority is not truth. Disagreements remain visible. Knowledge is dated.
 * Do not fork schema/mesh.v0.json. Do not add IA ids here.
 */

import {
  CHEF,
  OWNER_ACTOR,
  accept,
  connectAgent,
  gradesFor,
  lookup,
  roster,
  speakerAllowed,
} from "./flux.mjs";

export const POOL_VERSION = "pool.v0";
export const FLUX_VERSION = "acorn.v0";

export const STANCES = Object.freeze([
  "support",
  "challenge",
  "correct",
  "question",
  "qualify",
  "request_evidence",
  "identify_assumption",
]);

export const ROUNDS = Object.freeze([
  "question",
  "independent",
  "debate",
  "critique",
  "synthesis",
  "lesson",
]);

/** Honest labels. CONNECTED / LIVE are never inferred from the roster. */
export const CHANNELS = Object.freeze([
  "DECLARED",
  "READY",
  "CHANNEL_NOT_PRESENT",
  "CONNECTED",
  "ACTIVE",
  "LIVE VERIFIED",
]);

const STANCE_ACT = Object.freeze({
  support: "FINDING",
  challenge: "RISK",
  correct: "FINDING",
  question: "FINDING",
  qualify: "FINDING",
  request_evidence: "EVIDENCE",
  identify_assumption: "RISK",
});

const TS_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.\d+)?Z$/;

/** Dated lessons. GitHub is a canal, not this list. */
const MEMORY = [];

export function memory() {
  return MEMORY.slice();
}

export function resetPool() {
  MEMORY.length = 0;
}

function fail(code, error) {
  return { ok: false, code, error };
}

function isoTs(value) {
  const s = String(value || "");
  return TS_RE.test(s) ? s : new Date().toISOString();
}

function clip(text, n) {
  return String(text || "").trim().slice(0, n);
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function plusDays(iso, n) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString();
}

function normalizePosition(text) {
  const s = String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  const tagged = s.match(/position:\s*([a-z0-9_-]+)/);
  if (tagged) return tagged[1];
  return s.slice(0, 96);
}

/**
 * Thinkers are discovered from the roster: kind + capabilities, not an id list.
 * Seats that only verify / remember / preview the canal are not models.
 * The human judge (LIVE VERIFIED) does not cogitate as an IA.
 */
export function canThink(agent) {
  if (!agent) return false;
  if (gradesFor(agent.id).includes("LIVE VERIFIED")) return false;
  const caps = agent.capabilities || [];
  if (agent.kind === "seat" && !caps.includes("build")) return false;
  return caps.includes("lu") || caps.includes("flux");
}

export function thinkers() {
  return roster().filter(canThink);
}

/**
 * Documentary angle from kind + caps + specialty. Not an id enum.
 * Used only to seed independent LU envelopes when no body is supplied.
 */
export function positionOf(agent) {
  if (!agent) return "lu-the-frame";
  const caps = agent.capabilities || [];
  const blob = `${agent.specialty || ""} ${agent.role || ""}`.toLowerCase();
  if (agent.kind === "chef") return "protocol-first";
  if (caps.includes("review") || /\breview\b|\bchallenge\b|\bindependent\b/.test(blob)) {
    return "challenge-the-frame";
  }
  if (caps.includes("build") || /\bagent\b|\bimplement\b|\bbuilds\b/.test(blob)) {
    return "build-then-measure";
  }
  if (agent.kind === "consult" || /\breason\b/.test(blob)) return "reason-the-frame";
  return "lu-the-frame";
}

export function suggestIndependent(agent, topic) {
  const t = clip(topic, 400) || "the pool";
  const spec = agent.specialty || agent.role || agent.kind;
  const pos = positionOf(agent);
  return `Independent. ${agent.id} (${spec}). Position: ${pos}. Topic: ${t}. Isolated. Not a copy of another IA. Never QUANTUM. Declared is not connected. Never LIVE.`;
}

/**
 * Honest channel. Never fabricates CONNECTED / AVAILABLE / LIVE from a roster row.
 * secrets[id] === true is the only way CONNECTED is returned, and the caller
 * must attest it — the JSON roster never claims a credential.
 */
export function channelOf(agent, opts = {}) {
  if (!agent) return fail("UNKNOWN_AGENT", "no agent");
  const secrets = opts.secrets && typeof opts.secrets === "object" ? opts.secrets : {};
  const session = opts.session;
  const hasSecret = secrets[agent.id] === true;
  const active = Boolean(
    session && (session.contributions || []).some((c) => c.packet.from === agent.id),
  );
  const ready = canThink(agent);
  const liveSeat = gradesFor(agent.id).includes("LIVE VERIFIED");

  let channel = "DECLARED";
  if (liveSeat) channel = "DECLARED";
  else if (active) channel = "ACTIVE";
  else if (hasSecret) channel = "CONNECTED";
  else if (ready) channel = "CHANNEL_NOT_PRESENT";

  return {
    ok: true,
    id: agent.id,
    declared: true,
    ready,
    connected: hasSecret,
    active,
    live: false,
    channel,
    note: hasSecret
      ? "secret attested by caller, not by the roster"
      : liveSeat
        ? "human judge seat — LIVE VERIFIED is an act, not a channel"
        : ready
          ? "DECLARED — CHANNEL NOT PRESENT"
          : "DECLARED",
  };
}

export function presence(session, secrets) {
  return roster().map((agent) => channelOf(agent, { session, secrets }));
}

export function ask(input) {
  const raw = input && typeof input === "object" ? input : { topic: input };
  if (Object.hasOwn(raw, "next") || Object.hasOwn(raw, "instruction")) {
    return fail("FORBIDDEN_NEXT", "pool forbids next and instruction");
  }
  const topic = clip(raw.topic || raw.body, 400);
  if (!topic) return fail("BODY_MISSING", "pool needs a question");
  const ts = isoTs(raw.ts);
  const question = Object.freeze({
    id: String(raw.id || newId("q")),
    topic,
    context: clip(raw.context, 2000),
    origin: clip(raw.origin || "pool", 40) || "pool",
    ts,
  });
  const session = {
    pool: POOL_VERSION,
    flux: FLUX_VERSION,
    id: question.id,
    question,
    topic: question.topic,
    ts: question.ts,
    round: "independent",
    independentOpen: true,
    contributions: [],
    relations: [],
    syntheses: [],
    lessons: [],
  };
  return { ok: true, session };
}

export function rewriteQuestion() {
  return fail("QUESTION_FROZEN", "the original question cannot be rewritten");
}

function guardSpeaker(from, actor) {
  const agent = lookup(from);
  if (!agent) return fail("UNKNOWN_AGENT", `unknown from: ${from || "(empty)"}`);
  if (!speakerAllowed(from, actor)) {
    return fail("FROM_NOT_ACTOR", `${actor} cannot file as locked seat ${from}`);
  }
  if (String(actor || "") && !speakerAllowed(from, actor)) {
    return fail("FROM_NOT_ACTOR", `${actor} cannot file as locked seat ${from}`);
  }
  return { ok: true, agent };
}

function rejectPrivilege(raw) {
  if (Object.hasOwn(raw, "next") || Object.hasOwn(raw, "instruction")) {
    return fail("FORBIDDEN_NEXT", "pool forbids next and instruction");
  }
  if (Object.hasOwn(raw, "capabilities")) {
    return fail("CAP_FORGED", "capabilities come from the roster, not the envelope");
  }
  const role = String(raw.role || "").toLowerCase();
  if (role === "juge" || role === "judge") {
    return fail("NO_JUGE", "no AI is a judge");
  }
  return { ok: true };
}

export function thinkIndependent(session, input) {
  if (!session || session.pool !== POOL_VERSION) {
    return fail("NO_SESSION", "ask() a question first");
  }
  if (!session.independentOpen) {
    return fail("INDEPENDENT_CLOSED", "independent round is closed");
  }
  const raw = input && typeof input === "object" ? input : {};
  const priv = rejectPrivilege(raw);
  if (!priv.ok) return priv;
  const from = String(raw.from || "").toLowerCase();
  const who = guardSpeaker(from, raw.actor);
  if (!who.ok) return who;
  if (!canThink(who.agent)) {
    return fail("NOT_THINKER", `${from} is not a thinking identity (kind + capabilities)`);
  }
  if (raw.replyTo) {
    return fail("NOT_ISOLATED", "independent round forbids replyTo");
  }
  if (session.contributions.some((c) => c.round === "independent" && c.packet.from === from)) {
    return fail("ALREADY_THOUGHT", `${from} already filed an independent analysis`);
  }
  const body = clip(raw.body, 8000);
  if (!body) return fail("BODY_MISSING", "independent analysis needs a body");
  const accepted = accept({
    from,
    to: "*",
    act: "FINDING",
    mode: "ECHANGE",
    grade: raw.grade || "PROPOSED",
    body,
    actor: raw.actor,
    ts: raw.ts,
    replyTo: null,
  });
  if (!accepted.ok) return accepted;
  const contribution = Object.freeze({
    id: accepted.packet.id,
    questionId: session.question.id,
    round: "independent",
    isolated: true,
    stance: null,
    replyTo: null,
    derived: false,
    position: normalizePosition(body),
    packet: Object.freeze({ ...accepted.packet }),
  });
  session.contributions.push(contribution);
  session.round = "independent";
  return { ok: true, session, contribution };
}

export function thinkAllIndependent(session, opts = {}) {
  const filed = [];
  const skipped = [];
  const bodyOf =
    typeof opts.bodyOf === "function"
      ? opts.bodyOf
      : (agent) =>
          (opts.bodies && opts.bodies[agent.id]) ||
          (opts.suggest ? suggestIndependent(agent, session.question.topic) : null);
  for (const agent of thinkers()) {
    const body = bodyOf(agent);
    if (!body) {
      skipped.push(agent.id);
      continue;
    }
    const r = thinkIndependent(session, {
      from: agent.id,
      body,
      actor: opts.actor,
      ts: opts.ts,
    });
    if (!r.ok) return r;
    filed.push(r.contribution);
  }
  return { ok: true, session, filed, skipped };
}

export function closeIndependent(session) {
  if (!session || session.pool !== POOL_VERSION) {
    return fail("NO_SESSION", "ask() a question first");
  }
  session.independentOpen = false;
  session.round = "debate";
  return { ok: true, session };
}

/** Anti-cascade: during the independent round, a reader sees only the question + own filing. */
export function independentView(session, from) {
  if (!session) return fail("NO_SESSION", "ask() a question first");
  const id = String(from || "").toLowerCase();
  const own = session.contributions.filter(
    (c) => c.round === "independent" && c.packet.from === id,
  );
  if (session.independentOpen) {
    return {
      ok: true,
      question: session.question,
      contributions: own,
      isolated: true,
    };
  }
  return {
    ok: true,
    question: session.question,
    contributions: session.contributions.filter((c) => c.round === "independent"),
    isolated: false,
  };
}

function modeFor(stance, from, targetFrom) {
  if (stance === "challenge" && (from === CHEF || targetFrom === CHEF)) {
    return "CHALLENGE";
  }
  return "ECHANGE";
}

export function relate(session, input) {
  if (!session || session.pool !== POOL_VERSION) {
    return fail("NO_SESSION", "ask() a question first");
  }
  if (session.independentOpen) {
    return fail("INDEPENDENT_OPEN", "close the independent round before debate");
  }
  const raw = input && typeof input === "object" ? input : {};
  const priv = rejectPrivilege(raw);
  if (!priv.ok) return priv;
  const from = String(raw.from || "").toLowerCase();
  const who = guardSpeaker(from, raw.actor);
  if (!who.ok) return who;
  if (!canThink(who.agent)) {
    return fail("NOT_THINKER", `${from} is not a thinking identity`);
  }
  const stance = String(raw.stance || "").toLowerCase();
  if (!STANCES.includes(stance)) {
    return fail("UNKNOWN_STANCE", `unknown stance: ${stance || "(empty)"}`);
  }
  const target = session.contributions.find(
    (c) => c.id === raw.targetId || c.packet.id === raw.targetId,
  );
  if (!target) return fail("UNKNOWN_TARGET", "relation needs an existing contribution");
  if (target.packet.from === from) {
    return fail("NO_LOOP", "cannot relate to your own contribution");
  }
  const body = clip(raw.body, 8000);
  if (!body) return fail("BODY_MISSING", "relation needs a body");
  const act = STANCE_ACT[stance];
  const mode = modeFor(stance, from, target.packet.from);
  const accepted = accept({
    from,
    to: target.packet.from,
    act,
    mode,
    grade: raw.grade || "PROPOSED",
    body,
    actor: raw.actor,
    ts: raw.ts,
    replyTo: target.id,
  });
  if (!accepted.ok) return accepted;
  const derived =
    stance === "support" &&
    normalizePosition(body) === target.position &&
    target.round !== "independent";
  const echo =
    stance === "support" &&
    normalizePosition(body) === target.position &&
    !target.isolated;
  const contribution = Object.freeze({
    id: accepted.packet.id,
    questionId: session.question.id,
    round: session.round === "critique" ? "critique" : "debate",
    isolated: false,
    stance,
    replyTo: target.id,
    derived: derived || echo,
    position: normalizePosition(body) || target.position,
    packet: Object.freeze({ ...accepted.packet }),
  });
  const relation = Object.freeze({
    from,
    to: target.packet.from,
    targetId: target.id,
    stance,
    contributionId: contribution.id,
    derived: contribution.derived,
  });
  session.contributions.push(contribution);
  session.relations.push(relation);
  return { ok: true, session, contribution, relation };
}

export function editContribution() {
  return fail("PAST_IMMUTABLE", "past contributions cannot be mutated");
}

export function dropDisagreement() {
  return fail("REMOVE_DISAGREEMENT", "disagreements are data; they cannot be deleted");
}

function clustersOf(session) {
  const map = new Map();
  for (const c of session.contributions.filter((x) => x.round === "independent")) {
    const key = c.position || normalizePosition(c.packet.body);
    const row = map.get(key) || {
      position: key,
      count: 0,
      independent: 0,
      derived: 0,
      contributors: [],
    };
    row.count += 1;
    if (c.isolated && !c.replyTo) row.independent += 1;
    else row.derived += 1;
    row.contributors.push(c.packet.from);
    map.set(key, row);
  }
  const clusters = [...map.values()].sort((a, b) => b.count - a.count);
  return clusters;
}

export function synthesize(session, input) {
  if (!session || session.pool !== POOL_VERSION) {
    return fail("NO_SESSION", "ask() a question first");
  }
  if (session.independentOpen) {
    return fail("INDEPENDENT_OPEN", "close the independent round before synthesis");
  }
  const raw = input && typeof input === "object" ? input : {};
  const priv = rejectPrivilege(raw);
  if (!priv.ok) return priv;
  const from = String(raw.from || "").toLowerCase();
  const who = guardSpeaker(from, raw.actor);
  if (!who.ok) return who;
  if (!canThink(who.agent)) {
    return fail("NOT_THINKER", `${from} is not a thinking identity`);
  }
  if (String(raw.status || "").toLowerCase() === "truth") {
    return fail("STATUS_TRUTH", "majority is not truth");
  }
  const clusters = clustersOf(session);
  if (Object.hasOwn(raw, "disagreement") && Array.isArray(raw.disagreement) && raw.disagreement.length === 0 && clusters.length > 1) {
    return fail("REMOVE_DISAGREEMENT", "disagreements are data; they cannot be deleted");
  }
  const majority = clusters[0] || null;
  const minority = clusters.slice(1);
  const status =
    clusters.length === 0 ? "unresolved" : clusters.length === 1 ? "consensus" : "disputed";
  const evidence = session.contributions
    .filter((c) => c.packet.act === "EVIDENCE" || c.stance === "request_evidence")
    .map((c) => ({ from: c.packet.from, id: c.id, body: c.packet.body }));
  const assumptions = session.relations
    .filter((r) => r.stance === "identify_assumption")
    .map((r) => ({ from: r.from, to: r.to, id: r.contributionId }));
  const open = session.relations
    .filter((r) => r.stance === "question" || r.stance === "qualify")
    .map((r) => ({ from: r.from, to: r.to, stance: r.stance }));
  const ts = isoTs(raw.ts);
  const body = clip(
    raw.body ||
      `Synthesis. Majority position: ${majority ? majority.position : "(none)"} (${majority ? majority.count : 0}). Status: ${status}. Majority is not truth. Never QUANTUM. Never LIVE.`,
    8000,
  );
  const accepted = accept({
    from,
    to: "*",
    act: "FINDING",
    mode: "ECHANGE",
    grade: raw.grade || "PROPOSED",
    body,
    actor: raw.actor,
    ts,
  });
  if (!accepted.ok) return accepted;
  const synthesis = Object.freeze({
    id: accepted.packet.id,
    questionId: session.question.id,
    ts,
    from,
    status,
    majority: majority
      ? Object.freeze({
          position: majority.position,
          count: majority.count,
          independent: majority.independent,
          derived: majority.derived,
          contributors: Object.freeze([...majority.contributors]),
        })
      : null,
    minority: Object.freeze(
      minority.map((m) =>
        Object.freeze({
          position: m.position,
          count: m.count,
          independent: m.independent,
          derived: m.derived,
          contributors: Object.freeze([...m.contributors]),
        }),
      ),
    ),
    consensus: status === "consensus" && majority ? majority.position : null,
    disagreement: Object.freeze(
      clusters.length > 1
        ? clusters.map((c) =>
            Object.freeze({
              position: c.position,
              count: c.count,
              independent: c.independent,
              derived: c.derived,
              contributors: Object.freeze([...c.contributors]),
            }),
          )
        : [],
    ),
    evidence: Object.freeze(evidence),
    assumptions: Object.freeze(assumptions),
    uncertainty: Object.freeze(open),
    open: Object.freeze(open),
    packet: Object.freeze({ ...accepted.packet }),
  });
  session.syntheses.push(synthesis);
  session.round = "synthesis";
  return { ok: true, session, synthesis };
}

export function lesson(session, input) {
  if (!session || session.pool !== POOL_VERSION) {
    return fail("NO_SESSION", "ask() a question first");
  }
  const raw = input && typeof input === "object" ? input : {};
  const priv = rejectPrivilege(raw);
  if (!priv.ok) return priv;
  const from = String(raw.from || CHEF).toLowerCase();
  const who = guardSpeaker(from, raw.actor);
  if (!who.ok) return who;
  if (!canThink(who.agent)) {
    return fail("NOT_THINKER", `${from} is not a thinking identity`);
  }
  const synthesis = session.syntheses[session.syntheses.length - 1] || null;
  if (!synthesis && !raw.allowWithoutSynthesis) {
    return fail("NO_SYNTHESIS", "a lesson needs a synthesis first");
  }
  const sourceIds = Array.isArray(raw.sources) ? raw.sources.map(String) : session.contributions.map((c) => c.id);
  const known = new Set(session.contributions.map((c) => c.id));
  for (const sid of sourceIds) {
    if (!known.has(sid)) return fail("LESSON_INJECT", "lesson sources must be session contributions");
  }
  if (synthesis && synthesis.disagreement.length > 0 && raw.counterarguments === "") {
    return fail("REMOVE_DISAGREEMENT", "a lesson cannot drop known disagreement");
  }
  const ts = isoTs(raw.ts);
  const reviewAfter = isoTs(raw.reviewAfter || plusDays(ts, 30));
  const statement = clip(
    raw.statement ||
      (synthesis && synthesis.majority
        ? `Dated conclusion: ${synthesis.majority.position}. Status: ${synthesis.status}. Majority is not truth.`
        : session.question.topic),
    800,
  );
  const row = Object.freeze({
    id: String(raw.id || newId("lesson")),
    pool: POOL_VERSION,
    questionId: session.question.id,
    topic: session.question.topic,
    statement,
    context: clip(raw.context || session.question.context, 2000),
    sources: Object.freeze([...sourceIds]),
    contributors: Object.freeze([
      ...new Set(session.contributions.map((c) => c.packet.from)),
    ]),
    supporting: Object.freeze(
      synthesis?.majority
        ? [...synthesis.majority.contributors]
        : [],
    ),
    counterarguments: Object.freeze(
      synthesis ? synthesis.disagreement.map((d) => d.position) : [],
    ),
    uncertainties: Object.freeze(synthesis ? [...synthesis.uncertainty] : []),
    created_at: ts,
    updated_at: ts,
    valid_from: ts,
    review_after: reviewAfter,
    superseded_by: null,
    status: synthesis && synthesis.status === "disputed" ? "disputed" : "current",
    grade: "PROPOSED",
    revalidation: Object.freeze([]),
    from,
  });
  session.lessons.push(row);
  MEMORY.push(row);
  session.round = "lesson";
  return { ok: true, session, lesson: row };
}

export function revalidate(lessonRow, input) {
  if (!lessonRow || lessonRow.pool !== POOL_VERSION) {
    return fail("UNKNOWN_LESSON", "unknown lesson");
  }
  const raw = input && typeof input === "object" ? input : {};
  const priv = rejectPrivilege(raw);
  if (!priv.ok) return priv;
  const from = String(raw.from || "").toLowerCase();
  const who = guardSpeaker(from, raw.actor);
  if (!who.ok) return who;
  if (gradesFor(from).includes("LIVE VERIFIED") === false && String(raw.grade || "") === "LIVE VERIFIED") {
    return fail("LIVE_NOT_CARL", "LIVE VERIFIED is Carl only");
  }
  const ts = isoTs(raw.ts);
  const verdict = String(raw.verdict || "holds").toLowerCase();
  const note = clip(raw.body || raw.note || verdict, 800);
  const record = Object.freeze({
    ts,
    from,
    verdict,
    note,
    grade: "PROPOSED",
  });
  const nextStatus =
    verdict === "expired" || verdict === "supersede" || verdict === "superseded"
      ? verdict === "expired"
        ? "expired"
        : "superseded"
      : lessonRow.status;
  const updated = Object.freeze({
    ...lessonRow,
    updated_at: ts,
    status: nextStatus,
    superseded_by:
      nextStatus === "superseded" ? String(raw.supersededBy || newId("lesson")) : lessonRow.superseded_by,
    revalidation: Object.freeze([...(lessonRow.revalidation || []), record]),
    review_after: isoTs(raw.reviewAfter || plusDays(ts, 30)),
  });
  const idx = MEMORY.findIndex((l) => l.id === lessonRow.id);
  if (idx >= 0) MEMORY[idx] = updated;
  return { ok: true, lesson: updated, record };
}

export function expire(lessonRow, ts) {
  return revalidate(lessonRow, {
    from: CHEF,
    verdict: "expired",
    ts,
    body: "review_after elapsed. Not deleted. A certainty has an end date.",
  });
}

export function findLessons(topic) {
  const q = String(topic || "").toLowerCase();
  if (!q) return MEMORY.slice();
  return MEMORY.filter((l) => {
    const blob = `${l.topic} ${l.statement} ${l.context}`.toLowerCase();
    return blob.includes(q) || q.includes(String(l.topic || "").toLowerCase());
  });
}

/**
 * One cycle: freeze question → independent (all thinkers) → close → optional
 * cross-critique from review-capable agents toward the chef filing → synthesis
 * → dated lesson. Still LU envelopes. Never LIVE. Never a model API call.
 */
export function runCycle(input) {
  const asked = ask(input);
  if (!asked.ok) return asked;
  const session = asked.session;
  const actor = input && input.actor;
  const thought = thinkAllIndependent(session, {
    actor,
    suggest: input && input.bodies ? false : true,
    bodies: input && input.bodies,
    bodyOf: input && input.bodyOf,
  });
  if (!thought.ok) return thought;
  const closed = closeIndependent(session);
  if (!closed.ok) return closed;
  if (input && input.debate !== false) {
    const chefFiling = session.contributions.find(
      (c) => c.round === "independent" && c.packet.from === CHEF,
    );
    if (chefFiling) {
      for (const agent of thinkers()) {
        if (agent.id === CHEF) continue;
        if (positionOf(agent) !== "challenge-the-frame") continue;
        const r = relate(session, {
          from: agent.id,
          targetId: chefFiling.id,
          stance: "challenge",
          body: `Cross-critique. ${agent.id} challenges ${CHEF}. Position: ${positionOf(agent)}. Majority is not truth. Never QUANTUM. Never LIVE.`,
          actor,
        });
        if (!r.ok) return r;
      }
    }
  }
  const synthFrom = lookup(CHEF) && canThink(lookup(CHEF)) ? CHEF : thinkers()[0]?.id;
  const synth = synthesize(session, {
    from: synthFrom,
    actor,
    body: `Collective synthesis of ${session.contributions.filter((c) => c.round === "independent").length} independent analyses. Majority is not truth. Never QUANTUM. Never LIVE.`,
  });
  if (!synth.ok) return synth;
  const learned = lesson(session, { from: synthFrom, actor });
  if (!learned.ok) return learned;
  return {
    ok: true,
    session,
    filed: thought.filed,
    skipped: thought.skipped,
    synthesis: synth.synthesis,
    lesson: learned.lesson,
  };
}

export { connectAgent, roster, OWNER_ACTOR, CHEF };
