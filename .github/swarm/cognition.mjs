/**
 * Unique cognitive mode — COLLECTIVE_COGNITION.
 * Not a second mesh. Not a judge. Not a truth machine. Not live APIs.
 * IDENTITY + CAPABILITIES + CHANNEL + PROVENANCE.
 * Declared ≠ connected ≠ active ≠ LIVE. LIVE VERIFIED is Carl only.
 * Consensus is not truth. Disagreements remain visible. Knowledge is dated.
 * Do not fork schema/mesh.v0.json. Do not add IA ids here.
 */

import {
  OWNER_ACTOR,
  accept,
  connectAgent,
  gradesFor,
  lookup,
  roster,
} from "./flux.mjs";

export const MODE = "COLLECTIVE_COGNITION";
export const COGNITION_VERSION = "cognition.v0";
export const FLUX_VERSION = "acorn.v0";

export const STEPS = Object.freeze([
  "question",
  "independent",
  "share",
  "counter",
  "disagreement",
  "evidence",
  "synthesis",
  "lesson",
  "memory",
  "reevaluate",
]);

export const TOURS = Object.freeze([
  "independent",
  "confrontation",
  "revision",
  "synthesis",
]);

export const PRESENCE = Object.freeze([
  "DECLARED",
  "CHANNEL_NOT_PRESENT",
  "CONNECTED",
  "ACTIVE",
  "BLOCKED",
  "UNAVAILABLE",
  "ERROR",
  "LIVE VERIFIED",
]);

export const CLAIMS = Object.freeze([
  "fact",
  "hypothesis",
  "opinion",
  "proposal",
  "decision",
  "observation",
  "evidence",
  "interpretation",
  "disagreement",
]);

export const REPLIES = Object.freeze([
  "AGREE",
  "DISAGREE",
  "PARTIAL",
  "UNCERTAIN",
  "NEED_EVIDENCE",
  "NEED_RETEST",
]);

export const DRIFTS = Object.freeze([
  "ANCHORING",
  "GROUPTHINK",
  "UNSUPPORTED_CLAIM",
  "MISSING_EVIDENCE",
  "CONTRADICTION",
  "STALE_KNOWLEDGE",
  "SOURCE_CONFLICT",
  "MODEL_BIAS_RISK",
  "FALSE_CONSENSUS",
  "ROLE_OVERREACH",
  "JUDGE_BEHAVIOR",
  "UNVERIFIED_LIVE_CLAIM",
]);

export const FORBIDDEN_SEATS = Object.freeze([
  "judge_model",
  "master_model",
  "truth_model",
  "final_ai",
  "oracle_ai",
]);

const REPLY_ACT = Object.freeze({
  AGREE: "FINDING",
  DISAGREE: "RISK",
  PARTIAL: "FINDING",
  UNCERTAIN: "FINDING",
  NEED_EVIDENCE: "EVIDENCE",
  NEED_RETEST: "TEST",
});

const MEMORY = [];

export function memory() {
  return MEMORY.slice();
}

export function resetCognition() {
  MEMORY.length = 0;
}

function fail(code, error) {
  return { ok: false, code, error };
}

function clip(text, n) {
  return String(text || "").trim().slice(0, n);
}

function isoTs(value) {
  const s = String(value || "");
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
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

/** Every thinking identity is equal. CI / GitHub / GET /juge are not models. Carl is the human judge. */
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

/** Documentary adapter. Kind + caps + specialty. Never `if (id === …)`. */
export function adapterOf(agent) {
  if (!agent) return fail("UNKNOWN_AGENT", "no agent");
  const caps = agent.capabilities || [];
  return {
    ok: true,
    id: agent.id,
    identity: agent.id,
    kind: agent.kind,
    specialty: agent.specialty || agent.role || agent.kind,
    capabilities: [...caps],
    protocol: MODE,
    note: "adapter is configuration, not authority",
  };
}

function needsKeyedCanal(agent) {
  const caps = agent.capabilities || [];
  return caps.includes("review") && (agent.status === "auto" || agent.status === "on-demand");
}

/**
 * Honest presence. Never inferred from a roster row.
 * CONNECTED requires a caller-attested secret/canal.
 * ACTIVE requires a real canal AND a deposit.
 * LIVE VERIFIED is never returned here.
 */
export function presenceOf(agent, opts = {}) {
  if (!agent) return fail("UNKNOWN_AGENT", "no agent");
  const canal = opts.canal === true;
  const secret = opts.secret === true || (opts.secrets && opts.secrets[agent.id] === true);
  const deposited = opts.deposited === true;
  const error = clip(opts.error, 120);
  const claim = String(opts.claim || "").toUpperCase().replace(/ /g, "_");

  if (claim === "LIVE_VERIFIED" || claim === "LIVE") {
    return fail("LIVE_NOT_CARL", "LIVE VERIFIED is Carl only");
  }
  if ((claim === "CONNECTED" || claim === "ACTIVE") && !canal && !secret) {
    return fail("CLAIMED_CHANNEL", "CONNECTED and ACTIVE require a real canal");
  }

  let presence = "DECLARED";
  let reason = "roster row only";
  if (error) {
    presence = "ERROR";
    reason = error;
  } else if (deposited && (canal || secret)) {
    presence = "ACTIVE";
    reason = "deposited with a real canal";
  } else if (secret && canal) {
    presence = "CONNECTED";
    reason = "secret attested by caller, not by the roster";
  } else if (needsKeyedCanal(agent) && !secret) {
    presence = "BLOCKED";
    reason = "API CREDENTIAL REQUIRED";
  } else if (canThink(agent)) {
    presence = "CHANNEL_NOT_PRESENT";
    reason = "DECLARED — CHANNEL NOT PRESENT";
  }

  return {
    ok: true,
    id: agent.id,
    declared: true,
    connected: presence === "CONNECTED" || presence === "ACTIVE",
    active: presence === "ACTIVE",
    blocked: presence === "BLOCKED",
    live: false,
    presence,
    reason,
    mode: MODE,
  };
}

export function presence(opts = {}) {
  return roster().map((agent) => presenceOf(agent, opts));
}

/** Census. Never prints FULL SWARM OPERATIONAL from code existence. */
export function census(opts = {}) {
  const rows = presence(opts);
  const thinking = thinkers();
  const connected = rows.filter((r) => r.ok && r.connected).length;
  const active = rows.filter((r) => r.ok && r.active).length;
  const blocked = rows.filter((r) => r.ok && r.presence === "BLOCKED").length;
  const missing = rows.filter((r) => r.ok && r.presence === "CHANNEL_NOT_PRESENT").length;
  const errors = rows.filter((r) => r.ok && r.presence === "ERROR").length;
  const operational = connected > 0 && blocked === 0 && missing === 0 && errors === 0;
  return {
    configured: roster().length,
    thinkers: thinking.length,
    connected,
    active,
    blocked,
    channelNotPresent: missing,
    errors,
    live: 0,
    operational,
    label: operational ? "CHANNELS PRESENT" : "ARCHITECTURE READY",
    note: "FULL SWARM OPERATIONAL is forbidden until every thinking canal is real.",
  };
}

export function swarmLabel(snap) {
  if (snap && snap.operational === true && snap.connected > 0) return "CHANNELS PRESENT";
  return "ARCHITECTURE READY";
}

/** Isolated until SHARE. After SHARE, all independent filings are visible. */
export function visibleTo(step, from, contributions = []) {
  const i = STEPS.indexOf(step);
  if (i < 0) return [];
  const shareAt = STEPS.indexOf("share");
  if (i < shareAt) return contributions.filter((c) => c.from === from);
  return contributions.slice();
}

export function contradict(from, target) {
  if (!from || !target || from === target) {
    return fail("NO_LOOP", "an IA contradicts another IA, not itself");
  }
  const a = lookup(from);
  const b = lookup(target);
  if (!canThink(a)) return fail("NOT_THINKER", `${from} is not a thinking identity`);
  if (!canThink(b)) return fail("NOT_THINKER", `${target} is not a thinking identity`);
  return { ok: true, from, target, stance: "contradict", mode: MODE };
}

export function clusterStatus(clusters = []) {
  const rows = [...clusters].sort((a, b) => (b.count || 0) - (a.count || 0));
  if (rows.length === 0) {
    return { ok: true, status: "unresolved", truth: false, majority: null, minority: [] };
  }
  if (rows.length === 1) {
    return { ok: true, status: "consensus", truth: false, majority: rows[0], minority: [] };
  }
  return {
    ok: true,
    status: "disputed",
    truth: false,
    majority: rows[0],
    minority: rows.slice(1),
  };
}

export function asTruth() {
  return fail("CONSENSUS_NOT_TRUTH", "LE CONSENSUS N'EST PAS LA VÉRITÉ");
}

export function dropDisagreement() {
  return fail("REMOVE_DISAGREEMENT", "disagreements remain visible");
}

export function rewriteMemory() {
  return fail("PAST_IMMUTABLE", "dated knowledge cannot be rewritten in place");
}

export function classify(kind) {
  const claim = String(kind || "").toLowerCase();
  if (!CLAIMS.includes(claim)) {
    return fail("UNKNOWN_CLAIM", "distinguish fact, hypothesis, opinion, proposal, decision");
  }
  return { ok: true, claim };
}

export function remember(input) {
  const raw = input && typeof input === "object" ? input : {};
  if (Object.hasOwn(raw, "next") || Object.hasOwn(raw, "instruction")) {
    return fail("FORBIDDEN_NEXT", "cognition forbids next and instruction");
  }
  const statement = clip(raw.statement || raw.body, 2000);
  if (!statement) return fail("BODY_MISSING", "memory needs a statement");
  const kind = classify(raw.claim || "proposal");
  if (!kind.ok) return kind;
  if (String(raw.status || "").toLowerCase() === "truth") return asTruth();
  const ts = isoTs(raw.ts);
  const entry = Object.freeze({
    id: String(raw.id || newId("m")),
    mode: MODE,
    pool: COGNITION_VERSION,
    sessionId: raw.sessionId || null,
    statement,
    claim: kind.claim,
    status: raw.status === "consensus" || raw.status === "disputed" ? raw.status : "unresolved",
    truth: false,
    from: String(raw.from || "").toLowerCase() || null,
    sources: Object.freeze([...(raw.sources || [])].map((s) => String(s))),
    disagreement: Object.freeze([...(raw.disagreement || [])]),
    ts,
    context: clip(raw.context, 2000),
  });
  MEMORY.push(entry);
  return { ok: true, entry };
}

export function reevaluate(entry, input) {
  if (!entry || !entry.id) return fail("UNKNOWN_MEMORY", "reevaluate needs a dated entry");
  const raw = input && typeof input === "object" ? input : {};
  const evidence = clip(raw.evidence || raw.body, 2000);
  if (!evidence) return fail("BODY_MISSING", "reevaluation needs new evidence");
  const next = remember({
    from: raw.from,
    claim: raw.claim || entry.claim,
    statement: clip(raw.statement, 2000) || entry.statement,
    status: "unresolved",
    sources: [...(entry.sources || []), evidence],
    disagreement: entry.disagreement,
    context: `reevaluate:${entry.id}`,
    sessionId: raw.sessionId || entry.sessionId,
    ts: raw.ts,
  });
  if (!next.ok) return next;
  return { ok: true, previous: entry, entry: next.entry };
}

export function join(spec) {
  const id = String(spec && spec.id ? spec.id : "").toLowerCase();
  const normalized = id.replace(/_/g, "-");
  const forbidden = FORBIDDEN_SEATS.map((s) => s.replace(/_/g, "-"));
  if (forbidden.includes(normalized)) {
    return fail("NO_JUGE", "AUCUNE IA N'EST LE JUGE");
  }
  if (spec && String(spec.role || "").toLowerCase() === "juge") {
    return fail("NO_JUGE", "AUCUNE IA N'EST LE JUGE");
  }
  return connectAgent(spec);
}

export function mayJudge(from) {
  const id = String(from || "").toLowerCase();
  if (id === "carl") return { ok: true, from: id, live: true };
  return fail("NO_JUGE", "AUCUNE IA N'EST LE JUGE");
}

export function ownerActor() {
  return OWNER_ACTOR;
}

export function suggestIndependent(agent, topic) {
  const t = clip(topic, 400) || "the pool";
  const spec = agent.specialty || agent.role || agent.kind;
  return `Independent. ${agent.id} (${spec}). Topic: ${t}. Isolated. Not a copy. Specialty is a contribution, not authority. Never QUANTUM. Declared is not connected. Never LIVE.`;
}

export function openSession(input) {
  const raw = input && typeof input === "object" ? input : { topic: input };
  if (Object.hasOwn(raw, "next") || Object.hasOwn(raw, "instruction")) {
    return fail("FORBIDDEN_NEXT", "cognition forbids next and instruction");
  }
  const topic = clip(raw.topic || raw.body, 400);
  if (!topic) return fail("BODY_MISSING", "session needs a question");
  const ts = isoTs(raw.ts);
  const question = Object.freeze({
    id: String(raw.id || newId("q")),
    topic,
    context: clip(raw.context, 2000),
    origin: clip(raw.origin || "cognition", 40) || "cognition",
    ts,
  });
  const session = {
    mode: MODE,
    cognition: COGNITION_VERSION,
    flux: FLUX_VERSION,
    id: question.id,
    question,
    topic: question.topic,
    ts: question.ts,
    tour: "independent",
    independentOpen: true,
    contributions: [],
    relations: [],
    syntheses: [],
    drifts: [],
    lessons: [],
  };
  return { ok: true, session };
}

function thinkOne(session, agent, body, actor, ts) {
  if (!canThink(agent)) return fail("NOT_THINKER", `${agent.id} is not a thinking identity`);
  if (session.contributions.some((c) => c.tour === "independent" && c.from === agent.id)) {
    return fail("ALREADY_THOUGHT", `${agent.id} already filed an independent analysis`);
  }
  const text = clip(body, 8000);
  if (!text) return fail("BODY_MISSING", "independent analysis needs a body");
  const accepted = accept({
    from: agent.id,
    to: "*",
    act: "FINDING",
    mode: "ECHANGE",
    grade: "PROPOSED",
    body: text,
    actor,
    ts,
    replyTo: null,
  });
  if (!accepted.ok) return accepted;
  const contribution = Object.freeze({
    id: accepted.packet.id,
    sessionId: session.id,
    tour: "independent",
    isolated: true,
    from: agent.id,
    reply: null,
    replyTo: null,
    position: normalizePosition(text),
    packet: Object.freeze({ ...accepted.packet }),
  });
  session.contributions.push(contribution);
  return { ok: true, contribution };
}

/** Parallel LU fanout. One error does not block the swarm. Not a live API. */
export function runIndependent(session, opts = {}) {
  if (!session || session.cognition !== COGNITION_VERSION) {
    return fail("NO_SESSION", "openSession() a question first");
  }
  if (!session.independentOpen) return fail("INDEPENDENT_CLOSED", "independent tour is closed");
  const filed = [];
  const errors = [];
  const skipped = [];
  const bodyOf =
    typeof opts.bodyOf === "function"
      ? opts.bodyOf
      : (agent) =>
          (opts.bodies && opts.bodies[agent.id]) ||
          (opts.suggest === false ? null : suggestIndependent(agent, session.question.topic));
  for (const agent of thinkers()) {
    const body = bodyOf(agent);
    if (!body) {
      skipped.push(agent.id);
      continue;
    }
    const r = thinkOne(session, agent, body, opts.actor, opts.ts);
    if (!r.ok) errors.push({ id: agent.id, code: r.code, error: r.error });
    else filed.push(r.contribution);
  }
  return { ok: true, session, filed, errors, skipped };
}

export function share(session) {
  if (!session || session.cognition !== COGNITION_VERSION) {
    return fail("NO_SESSION", "openSession() a question first");
  }
  session.independentOpen = false;
  session.tour = "confrontation";
  return { ok: true, session };
}

export function reply(session, input) {
  if (!session || session.cognition !== COGNITION_VERSION) {
    return fail("NO_SESSION", "openSession() a question first");
  }
  if (session.independentOpen) {
    return fail("INDEPENDENT_OPEN", "share() before confrontation");
  }
  const raw = input && typeof input === "object" ? input : {};
  if (Object.hasOwn(raw, "next") || Object.hasOwn(raw, "instruction")) {
    return fail("FORBIDDEN_NEXT", "cognition forbids next and instruction");
  }
  const from = String(raw.from || "").toLowerCase();
  const agent = lookup(from);
  if (!canThink(agent)) return fail("NOT_THINKER", `${from} is not a thinking identity`);
  const tag = String(raw.reply || "").toUpperCase();
  if (!REPLIES.includes(tag)) return fail("UNKNOWN_REPLY", `unknown reply: ${tag || "(empty)"}`);
  const target = session.contributions.find((c) => c.id === raw.targetId || c.from === raw.target);
  if (!target) return fail("UNKNOWN_TARGET", "reply needs an existing contribution");
  if (target.from === from) return fail("NO_LOOP", "cannot reply to yourself");
  const body = clip(raw.body, 8000);
  if (!body) return fail("BODY_MISSING", "reply needs a body");
  const accepted = accept({
    from,
    to: target.from,
    act: REPLY_ACT[tag],
    mode: "ECHANGE",
    grade: "PROPOSED",
    body,
    actor: raw.actor,
    ts: raw.ts,
    replyTo: target.id,
  });
  if (!accepted.ok) return accepted;
  const contribution = Object.freeze({
    id: accepted.packet.id,
    sessionId: session.id,
    tour: session.tour === "revision" ? "revision" : "confrontation",
    isolated: false,
    from,
    reply: tag,
    replyTo: target.id,
    position: normalizePosition(body) || target.position,
    packet: Object.freeze({ ...accepted.packet }),
  });
  const relation = Object.freeze({
    from,
    to: target.from,
    targetId: target.id,
    reply: tag,
    contributionId: contribution.id,
  });
  session.contributions.push(contribution);
  session.relations.push(relation);
  return { ok: true, session, contribution, relation };
}

export function flagDrift(session, input) {
  if (!session || session.cognition !== COGNITION_VERSION) {
    return fail("NO_SESSION", "openSession() a question first");
  }
  const raw = input && typeof input === "object" ? input : {};
  const from = String(raw.from || "").toLowerCase();
  if (!canThink(lookup(from))) return fail("NOT_THINKER", `${from} is not a thinking identity`);
  const drift = String(raw.drift || "").toUpperCase();
  if (!DRIFTS.includes(drift)) return fail("UNKNOWN_DRIFT", `unknown drift: ${drift || "(empty)"}`);
  const flag = Object.freeze({
    id: newId("d"),
    from,
    drift,
    body: clip(raw.body, 800),
    ts: isoTs(raw.ts),
  });
  session.drifts.push(flag);
  return { ok: true, session, flag };
}

export function synthesize(session, input = {}) {
  if (!session || session.cognition !== COGNITION_VERSION) {
    return fail("NO_SESSION", "openSession() a question first");
  }
  if (session.independentOpen) return fail("INDEPENDENT_OPEN", "share() before synthesis");
  const raw = input && typeof input === "object" ? input : {};
  if (String(raw.status || "").toLowerCase() === "truth") return asTruth();
  const independents = session.contributions.filter((c) => c.tour === "independent");
  const map = new Map();
  for (const c of independents) {
    const key = c.position;
    const row = map.get(key) || { position: key, count: 0, contributors: [] };
    row.count += 1;
    row.contributors.push(c.from);
    map.set(key, row);
  }
  const clustered = clusterStatus([...map.values()]);
  const from = String(raw.from || thinkers()[0]?.id || "grok").toLowerCase();
  if (!canThink(lookup(from))) return fail("NOT_THINKER", `${from} is not a thinking identity`);
  const ts = isoTs(raw.ts);
  const body = clip(
    raw.body ||
      `Synthesis. Status: ${clustered.status}. Majority count is not proof. Never QUANTUM. Never LIVE.`,
    8000,
  );
  const accepted = accept({
    from,
    to: "*",
    act: "FINDING",
    mode: "ECHANGE",
    grade: "PROPOSED",
    body,
    actor: raw.actor,
    ts,
  });
  if (!accepted.ok) return accepted;
  const synthesis = Object.freeze({
    id: accepted.packet.id,
    sessionId: session.id,
    ts,
    from,
    status: clustered.status,
    truth: false,
    majority: clustered.majority,
    minority: clustered.minority,
    disagreement: clustered.status === "disputed" ? clustered.minority : [],
    replies: session.relations.slice(),
    drifts: session.drifts.slice(),
    packet: Object.freeze({ ...accepted.packet }),
  });
  session.syntheses.push(synthesis);
  session.tour = "synthesis";
  const stored = remember({
    from,
    sessionId: session.id,
    claim: "proposal",
    statement: body,
    status: clustered.status,
    disagreement: (clustered.minority || []).map((m) => m.position),
    sources: independents.map((c) => c.id),
    ts,
  });
  if (stored.ok) session.lessons.push(stored.entry);
  return { ok: true, session, synthesis, lesson: stored.ok ? stored.entry : null };
}

export function runCycle(input) {
  const opened = openSession(input);
  if (!opened.ok) return opened;
  const session = opened.session;
  const first = runIndependent(session, { actor: input.actor, suggest: true, ts: input.ts });
  if (!first.ok) return first;
  share(session);
  const ids = first.filed.map((c) => c.from);
  if (ids.length >= 2) {
    reply(session, {
      from: ids[1],
      targetId: first.filed[0].id,
      reply: "DISAGREE",
      body: "Counter-analysis. Position: challenge-the-frame. Isolated thought was not copied. Majority is not proof.",
      actor: input.actor,
      ts: input.ts,
    });
    if (ids.length >= 3) {
      reply(session, {
        from: ids[2],
        targetId: first.filed[0].id,
        reply: "NEED_EVIDENCE",
        body: "Request evidence. Position: need-evidence. A count is not a proof.",
        actor: input.actor,
        ts: input.ts,
      });
    }
    flagDrift(session, {
      from: ids[1],
      drift: "FALSE_CONSENSUS",
      body: "A majority of filings is not truth.",
    });
  }
  const syn = synthesize(session, { from: ids[0] || "grok", actor: input.actor, ts: input.ts });
  if (!syn.ok) return syn;
  return {
    ok: true,
    session,
    filed: first.filed,
    errors: first.errors,
    skipped: first.skipped,
    synthesis: syn.synthesis,
    lesson: syn.lesson,
    census: census(),
  };
}
