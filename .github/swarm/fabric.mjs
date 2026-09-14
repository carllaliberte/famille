/**
 * Cognitive fabric v0 — work object, not a second mesh.
 * Uses workforce.route / assign. Roster stays schema/agents.json.
 * DEFINED ≠ EXECUTED. LIVE is never minted here. Carl decides.
 */
import { OWNER_ACTOR } from "./flux.mjs";
import { assign, pool, route } from "./workforce.mjs";

export const FABRIC_VERSION = "fabric.v0";
export const HUMAN = OWNER_ACTOR;

export const STATES = Object.freeze([
  "PROPOSED",
  "READY",
  "WORKING",
  "REVIEWING",
  "BLOCKED",
  "DECISION",
  "DONE",
  "REJECTED",
]);

export const TRANSITIONS = Object.freeze({
  PROPOSED: Object.freeze(["READY", "BLOCKED", "REJECTED"]),
  READY: Object.freeze(["WORKING", "BLOCKED", "REJECTED"]),
  WORKING: Object.freeze(["REVIEWING", "BLOCKED", "READY"]),
  REVIEWING: Object.freeze(["DECISION", "WORKING", "BLOCKED"]),
  BLOCKED: Object.freeze(["READY", "WORKING", "REJECTED"]),
  DECISION: Object.freeze([]),
  DONE: Object.freeze([]),
  REJECTED: Object.freeze([]),
});

const PROGRESS = new Set(["READY", "WORKING", "REVIEWING", "DECISION"]);

function fail(code, error) {
  return { ok: false, code, error };
}

function iso(value) {
  const s = String(value || "");
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function freezeDeep(value) {
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) freezeDeep(v);
    Object.freeze(value);
  }
  return value;
}

function clone(work) {
  return structuredClone(work);
}

function isCarl(actor) {
  const n = String(actor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
  return n === "carllaliberte" || n === "carl" || n === HUMAN;
}

function stamp(node, source, at, extra = {}) {
  return {
    node: String(node || "system"),
    source: String(source || ""),
    at: iso(at),
    method: FABRIC_VERSION,
    ...extra,
  };
}

function openBlocking(work) {
  return (work.objections || []).filter(
    (o) => o.severity === "BLOCKING" && o.status === "open",
  );
}

export function readyOf(work) {
  const blockers = [];
  if (!String(work?.objective || "").trim()) blockers.push("objective absent");
  for (const cap of work?.required_capabilities || []) {
    const covered = (work.branches || []).some(
      (b) => String(b.capability || "") === String(cap),
    );
    if (!covered) blockers.push(`capability:${cap}`);
  }
  if (openBlocking(work).length) blockers.push("objection blocking");
  return {
    ready: blockers.length === 0,
    blockers,
    live: false,
    executed: false,
  };
}

function bump(next, source, at, node) {
  next.version = Number(next.version || 1) + 1;
  next.provenance = stamp(node || next.provenance?.node, source, at, {
    prior: next.provenance || null,
  });
  next.live = false;
  next.auto_merge = false;
  next.executed = false;
  return freezeDeep(next);
}

export function createTask(input = {}) {
  const at = iso(input.at);
  const work = {
    v: FABRIC_VERSION,
    task_id: String(input.task_id || newId("task")),
    version: 1,
    objective: String(input.objective || "").trim(),
    constraints: [...(input.constraints || [])].map(String),
    required_capabilities: [...(input.required_capabilities || [])].map(String),
    evidence_requirements: [...(input.evidence_requirements || [])].map(String),
    provenance: stamp(input.node || "system", "createTask", at),
    state: "PROPOSED",
    branches: [],
    synapses: [],
    observations: [],
    evidence: [],
    objections: [],
    measurements: [],
    claims: [],
    conflicts: [],
    synthesis: null,
    decision: null,
    next: null,
    live: false,
    auto_merge: false,
    executed: false,
  };
  return { ok: true, work: freezeDeep(work) };
}

export function transition(work, to, input = {}) {
  if (!work || !STATES.includes(work.state)) return fail("FABRIC", "no work");
  const dest = String(to || "");
  if (!(TRANSITIONS[work.state] || []).includes(dest)) {
    return fail("TRANSITION", `${work.state} → ${dest}`);
  }
  if (openBlocking(work).length && PROGRESS.has(dest)) {
    return fail("OBJECTION", "blocking objection open");
  }
  if (dest === "READY" && !readyOf(work).ready) {
    return fail("NOT_READY", readyOf(work).blockers.join(","));
  }
  if (dest === "DECISION") {
    if (!work.synthesis) return fail("NO_SYNTHESIS", "decision needs synthesis");
  }
  const next = clone(work);
  next.state = dest;
  if (dest === "DECISION") {
    next.decision = {
      status: "PENDING_HUMAN",
      authority: "carl",
      human_required: true,
      options: [...(input.options || [])].map(String),
      recommendation: String(input.recommendation || ""),
      provenance: stamp(input.node || "system", "transition:DECISION", input.at),
    };
  }
  if (dest === "BLOCKED") {
    next.decision = next.decision;
  }
  return { ok: true, work: bump(next, `transition:${dest}`, input.at, input.node) };
}

export function addBranch(work, input = {}) {
  if (!work) return fail("FABRIC", "no work");
  if (work.state === "DONE" || work.state === "REJECTED" || work.state === "DECISION") {
    return fail("TERMINAL", work.state);
  }
  const worker = String(input.worker || "").trim();
  const p = pool();
  const row = p.rows.find((r) => r.id === worker);
  let assignment = null;
  if (worker) {
    assignment = assign(worker, work.task_id);
  } else {
    const routed = route({
      task: work.task_id,
      producer: input.from,
      need: input.capability,
    });
    if (!routed.ok) return routed;
    assignment = routed;
  }
  const id = String(input.branch_id || newId("br"));
  const branch = {
    branch_id: id,
    worker: worker || assignment.worker || assignment.id,
    capability: String(input.capability || ""),
    objective: String(input.objective || work.objective),
    dependencies: [...(input.dependencies || [])].map(String),
    state: "PROPOSED",
    context: input.context && typeof input.context === "object" ? { ...input.context } : {},
    result: null,
    declared: Boolean(row),
    available: Boolean(row && (row.seat === "AVAILABLE" || row.seat === "IDLE")),
    live: false,
    provenance: stamp(input.node || worker || "system", "addBranch", input.at),
  };
  const next = clone(work);
  next.branches = [...next.branches, branch];
  if (assignment && assignment.synapse) {
    next.synapses = [
      ...next.synapses,
      {
        synapse_id: newId("syn"),
        from: assignment.synapse.from,
        to: assignment.synapse.to,
        act: assignment.synapse.act,
        context: { branch_id: id },
        grade: "PROPOSED",
        created_at: iso(input.at),
      },
    ];
  }
  return { ok: true, work: bump(next, "addBranch", input.at, input.node), branch_id: id };
}

export function addSynapse(work, input = {}) {
  if (!work) return fail("FABRIC", "no work");
  const syn = {
    synapse_id: String(input.synapse_id || newId("syn")),
    from: String(input.from || ""),
    to: String(input.to || ""),
    act: String(input.act || "ROUTE"),
    context: input.context && typeof input.context === "object" ? { ...input.context } : {},
    grade: String(input.grade || "PROPOSED"),
    created_at: iso(input.at),
  };
  if (/LIVE/i.test(syn.grade)) return fail("LIVE_NOT_CARL", "synapse is not a network proof");
  if (syn.grade === "EXECUTED" || syn.grade === "VERIFIED") {
    return fail("NOT_EXECUTED", "create is PROPOSED only");
  }
  const next = clone(work);
  next.synapses = [...next.synapses, syn];
  return { ok: true, work: bump(next, "addSynapse", input.at, input.node) };
}

export function addObservation(work, input = {}) {
  if (!work) return fail("FABRIC", "no work");
  const row = {
    observation_id: String(input.observation_id || newId("obs")),
    node: String(input.node || ""),
    summary: String(input.summary || ""),
    state: String(input.state || "PROPOSED"),
    provenance: stamp(input.node || "system", "addObservation", input.at),
    at: iso(input.at),
  };
  const next = clone(work);
  next.observations = [...next.observations, row];
  return { ok: true, work: bump(next, "addObservation", input.at, input.node) };
}

export function addEvidence(work, input = {}) {
  if (!work) return fail("FABRIC", "no work");
  const measured = input.measured === true;
  const row = {
    evidence_id: String(input.evidence_id || newId("ev")),
    source: String(input.source || ""),
    claim: String(input.claim || ""),
    strength: String(input.strength || "unscored"),
    measured,
    at: iso(input.at),
    provenance: stamp(input.node || input.source || "system", "addEvidence", input.at),
  };
  const next = clone(work);
  next.evidence = [...next.evidence, row];
  return { ok: true, work: bump(next, "addEvidence", input.at, input.node) };
}

export function addObjection(work, input = {}) {
  if (!work) return fail("FABRIC", "no work");
  const row = {
    objection_id: String(input.objection_id || newId("obj")),
    node: String(input.node || ""),
    reason: String(input.reason || ""),
    severity: String(input.severity || "NOTE") === "BLOCKING" ? "BLOCKING" : String(input.severity || "NOTE"),
    status: String(input.status || "open"),
    at: iso(input.at),
    provenance: stamp(input.node || "system", "addObjection", input.at),
  };
  const next = clone(work);
  next.objections = [...next.objections, row];
  if (row.severity === "BLOCKING" && row.status === "open") next.state = "BLOCKED";
  return { ok: true, work: bump(next, "addObjection", input.at, input.node) };
}

export function resolveObjection(work, objectionId, input = {}) {
  if (!work) return fail("FABRIC", "no work");
  const next = clone(work);
  const row = next.objections.find((o) => o.objection_id === objectionId);
  if (!row) return fail("NOT_FOUND", String(objectionId || ""));
  row.status = "resolved";
  row.resolved_at = iso(input.at);
  row.resolved_by = String(input.node || "");
  return { ok: true, work: bump(next, "resolveObjection", input.at, input.node) };
}

export function addMeasurement(work, input = {}) {
  if (!work) return fail("FABRIC", "no work");
  const measured = input.measured === true;
  const row = {
    measurement_id: String(input.measurement_id || newId("ms")),
    metric: String(input.metric || ""),
    value: measured ? input.value : null,
    unit: String(input.unit || ""),
    method: String(input.method || ""),
    measured,
    at: iso(input.at),
    provenance: stamp(input.node || "system", "addMeasurement", input.at),
  };
  const next = clone(work);
  next.measurements = [...next.measurements, row];
  return { ok: true, work: bump(next, "addMeasurement", input.at, input.node) };
}

export function setBranchResult(work, branchId, input = {}) {
  if (!work) return fail("FABRIC", "no work");
  const next = clone(work);
  const br = next.branches.find((b) => b.branch_id === branchId);
  if (!br) return fail("NOT_FOUND", String(branchId || ""));
  br.result = {
    summary: String(input.summary || ""),
    body: String(input.body || ""),
    provenance: stamp(input.node || br.worker, "setBranchResult", input.at),
  };
  br.state = "DONE";
  br.context = { ...br.context };
  return { ok: true, work: bump(next, "setBranchResult", input.at, input.node) };
}

export function synthesize(work, input = {}) {
  if (!work) return fail("FABRIC", "no work");
  const unresolved = openBlocking(work).concat(
    (work.objections || []).filter((o) => o.status === "open" && o.severity !== "BLOCKING"),
  );
  const supporting = (work.evidence || []).filter((e) => e.measured === true);
  const row = {
    summary: String(input.summary || "").trim() ||
      (work.branches || [])
        .filter((b) => b.result)
        .map((b) => b.result.summary)
        .filter(Boolean)
        .join(" · "),
    supporting_evidence: supporting.map((e) => e.evidence_id),
    unresolved_objections: unresolved.map((o) => o.objection_id),
    confidence: String(input.confidence || "unscored"),
    provenance: stamp(input.node || "system", "synthesize", input.at),
    at: iso(input.at),
    live: false,
  };
  const next = clone(work);
  next.synthesis = row;
  return { ok: true, work: bump(next, "synthesize", input.at, input.node) };
}

export function humanDecide(work, input = {}) {
  if (!work) return fail("FABRIC", "no work");
  if (work.state !== "DECISION") return fail("TRANSITION", `${work.state} → DECIDED`);
  if (!work.synthesis) return fail("NO_SYNTHESIS", "decision needs synthesis");
  if (!isCarl(input.actor)) return fail("HUMAN", "Carl only");
  const outcome = String(input.outcome || "").toUpperCase();
  if (outcome !== "DONE" && outcome !== "REJECTED") {
    return fail("OUTCOME", "DONE or REJECTED");
  }
  const next = clone(work);
  next.state = outcome;
  next.decision = {
    ...(next.decision || {}),
    status: "DECIDED",
    authority: "carl",
    human_required: true,
    outcome,
    at: iso(input.at),
    provenance: stamp("carl", "humanDecide", input.at),
  };
  if (outcome === "DONE" && input.next_objective) {
    next.next = {
      objective: String(input.next_objective),
      from_task: next.task_id,
      state: "PROPOSED",
    };
  }
  return { ok: true, work: bump(next, "humanDecide", input.at, "carl") };
}

export function openNext(work, input = {}) {
  if (!work || work.state !== "DONE" || !work.next) {
    return fail("NO_NEXT", "next only after DONE");
  }
  return createTask({
    objective: work.next.objective,
    node: input.node || "system",
    at: input.at,
    required_capabilities: work.required_capabilities,
  });
}

export const SYNAPSE_GRADES = Object.freeze([
  "PROPOSED",
  "OBSERVED",
  "EXECUTED",
  "VERIFIED",
]);

/** Roster seat is declared. Never LIVE. Never inferred from a key. */
export function discoverCapabilities(work, rosterPool = pool()) {
  const need = [...(work?.required_capabilities || [])].map(String);
  const candidates = (rosterPool.rows || []).map((r) => {
    const caps = (r.capabilities || []).map(String);
    const spec = String(r.specialty || "");
    const complementarity = need.filter(
      (c) => caps.includes(c) || spec.toLowerCase().includes(c.toLowerCase()),
    );
    return {
      identity: r.id,
      capabilities: caps,
      limits: { merge: false, live: false },
      specialties: spec,
      trust: r.access || "limited",
      context: { seat: r.seat, roster_status: r.roster_status },
      availability: r.seat,
      complementarity,
      declared: true,
      available: r.seat === "AVAILABLE" || r.seat === "IDLE",
      live: false,
      verified: false,
      provenance: { source: "workforce.pool", measured: false },
    };
  });
  const matched = candidates.filter((c) => c.complementarity.length);
  const missing = need.filter(
    (c) => !matched.some((m) => m.complementarity.includes(c)),
  );
  return {
    ok: true,
    need,
    missing,
    candidates: matched,
    live: false,
    executed: false,
  };
}

export function transferContext(work, fromId, toId, input = {}) {
  if (!work) return fail("FABRIC", "no work");
  const from = (work.branches || []).find((b) => b.branch_id === fromId);
  const to = (work.branches || []).find((b) => b.branch_id === toId);
  if (!from || !to) return fail("NOT_FOUND", "branch");
  const packet = {
    origin: from.worker,
    task: work.task_id,
    branch: from.branch_id,
    inputs: { ...(from.context || {}) },
    observations: (work.observations || []).filter((o) => o.node === from.worker),
    evidence: [...(work.evidence || [])],
    objections: [...(work.objections || [])],
    constraints: [...(work.constraints || [])],
    timestamp: iso(input.at),
    version: work.version,
    provenance: stamp(from.worker, "transferContext", input.at),
  };
  const insufficient = !from.result && packet.observations.length === 0;
  if (insufficient && input.require === true) {
    return { ok: false, code: "INSUFFICIENT", error: "context incomplete", packet };
  }
  const next = clone(work);
  const dest = next.branches.find((b) => b.branch_id === toId);
  dest.context = { ...dest.context, transfer: packet, insufficient };
  next.synapses = [
    ...next.synapses,
    {
      synapse_id: newId("syn"),
      from: from.worker,
      to: to.worker,
      act: "TRANSFER",
      context: { from: fromId, to: toId, insufficient },
      grade: "PROPOSED",
      created_at: iso(input.at),
    },
  ];
  return {
    ok: true,
    work: bump(next, "transferContext", input.at, input.node),
    insufficient,
  };
}

export function markSynapse(work, synapseId, grade, input = {}) {
  if (!work) return fail("FABRIC", "no work");
  if (!SYNAPSE_GRADES.includes(grade)) return fail("GRADE", String(grade || ""));
  if (grade === "EXECUTED" && input.executed !== true) {
    return fail("NOT_EXECUTED", "route is not a collaboration");
  }
  if (grade === "VERIFIED" && !isCarl(input.actor) && input.measured !== true) {
    return fail("NOT_VERIFIED", "VERIFIED needs measure or Carl");
  }
  const next = clone(work);
  const syn = next.synapses.find((s) => s.synapse_id === synapseId);
  if (!syn) return fail("NOT_FOUND", String(synapseId || ""));
  syn.grade = grade;
  syn.marked_at = iso(input.at);
  return { ok: true, work: bump(next, "markSynapse", input.at, input.node) };
}

export function counters(work) {
  if (!work) {
    return { tasks_created: 0, live: false, loop: "DEFINED" };
  }
  const syn = work.synapses || [];
  return {
    tasks_created: 1,
    tasks_routed: syn.filter((s) => s.act === "ROUTE").length,
    branches_created: (work.branches || []).length,
    branches_parallel: (work.branches || []).length > 1 ? 1 : 0,
    synapses_proposed: syn.filter((s) => s.grade === "PROPOSED").length,
    synapses_executed: syn.filter((s) => s.grade === "EXECUTED").length,
    synapses_verified: syn.filter((s) => s.grade === "VERIFIED").length,
    context_transfers: syn.filter((s) => s.act === "TRANSFER").length,
    observations: (work.observations || []).length,
    evidence: (work.evidence || []).length,
    objections: (work.objections || []).length,
    measurements: (work.measurements || []).length,
    syntheses: work.synthesis ? 1 : 0,
    human_decisions: work.decision && work.decision.status === "DECIDED" ? 1 : 0,
    blocked: work.state === "BLOCKED" ? 1 : 0,
    failed: 0,
    live: false,
    loop: "DEFINED",
  };
}

export function cannotMerge() {
  return {
    ok: false,
    code: "HUMAN",
    error: "AI cannot merge",
    auto_merge: false,
    live: false,
  };
}

export function cycleDefined() {
  return {
    steps: Object.freeze([
      "observe",
      "understand",
      "discover",
      "compose",
      "delegate",
      "work",
      "transfer",
      "measure",
      "verify",
      "object",
      "correct",
      "synthesize",
      "human_decision",
      "next",
    ]),
    loop: "DEFINED",
    executed: false,
    continuous: false,
    live: false,
  };
}

export const INFO_STATES = Object.freeze([
  "OBSERVED",
  "MEASURED",
  "EXECUTED",
  "VERIFIED",
  "INFERRED",
  "PROPOSED",
  "UNKNOWN",
  "INSUFFICIENT",
  "CONFLICT",
]);

const CLAIM_KEYS = Object.freeze(["what", "source", "actor", "method"]);

const BARE_WORDS = Object.freeze([
  "connected",
  "available",
  "live",
  "executed",
  "verified",
  "certified",
  "written",
  "merged",
]);

export function makeClaim(input = {}) {
  const missing = CLAIM_KEYS.filter((k) => !String(input[k] || "").trim());
  let state = String(input.state || "PROPOSED").toUpperCase().replace(/ /g, "_");
  if (state === "LIVE" || state === "LIVE_VERIFIED") {
    return fail("LIVE_NOT_CARL", "LIVE is never minted here");
  }
  if (!INFO_STATES.includes(state)) state = "UNKNOWN";
  if (state === "VERIFIED" && input.readback !== true) {
    return fail("NOT_VERIFIED", "VERIFIED needs independent readback");
  }
  if (state === "EXECUTED" && input.executed !== true) {
    return fail("NOT_EXECUTED", "EXECUTED needs measured execution");
  }
  if (missing.length && (state === "VERIFIED" || state === "EXECUTED")) {
    state = "INSUFFICIENT";
  }
  return {
    ok: true,
    claim: freezeDeep({
      what: String(input.what || ""),
      state,
      source: String(input.source || ""),
      actor: String(input.actor || ""),
      when: iso(input.when),
      method: String(input.method || ""),
      evidence: input.evidence ?? null,
      measure: input.measure ?? null,
      confidence: missing.length ? "low" : String(input.confidence || "unscored"),
      objections: [...(input.objections || [])],
      missing,
      live: false,
    }),
  };
}

export function addClaim(work, input = {}) {
  const made = makeClaim(input);
  if (!made.ok) return made;
  if (!work) return fail("FABRIC", "no work");
  const next = clone(work);
  next.claims = [...(next.claims || []), made.claim];
  return { ok: true, work: bump(next, "addClaim", input.when, input.actor) };
}

/** ACTION → READBACK → COMPARE. Internal ok is not proof. */
export function verifyOp(input = {}) {
  const executed = input.executed === true;
  const readback = input.readback;
  const expected = input.expected;
  const readbackFailed = input.readback_failed === true;
  if (!executed) {
    return { ok: true, state: "PROPOSED", verification: "UNVERIFIED", live: false };
  }
  if (readbackFailed || readback == null) {
    return { ok: true, state: "EXECUTED", verification: "UNVERIFIED", live: false };
  }
  const match = JSON.stringify(readback) === JSON.stringify(expected);
  if (match) {
    return { ok: true, state: "VERIFIED", verification: "VERIFIED", live: false };
  }
  return {
    ok: false,
    code: "CONFLICT",
    state: "CONFLICT",
    verification: "UNVERIFIED",
    a: expected,
    b: readback,
    live: false,
  };
}

export function recordConflict(work, a, b, input = {}) {
  if (!work) return fail("FABRIC", "no work");
  const row = {
    conflict_id: newId("cf"),
    a,
    b,
    provenance_a: a && a.provenance ? a.provenance : null,
    provenance_b: b && b.provenance ? b.provenance : null,
    at: iso(input.at),
    method: String(input.method || "compare"),
    action: "OBJECT",
    live: false,
  };
  const next = clone(work);
  next.conflicts = [...(next.conflicts || []), row];
  next.objections = [
    ...next.objections,
    {
      objection_id: newId("obj"),
      node: String(input.node || "system"),
      reason: "CONFLICT",
      severity: "BLOCKING",
      status: "open",
      at: iso(input.at),
      conflict_id: row.conflict_id,
      provenance: stamp(input.node || "system", "recordConflict", input.at),
    },
  ];
  next.state = "BLOCKED";
  return { ok: true, work: bump(next, "recordConflict", input.at, input.node), conflict: row };
}

export function correctConflict(work, conflictId, input = {}) {
  if (!work) return fail("FABRIC", "no work");
  const cf = (work.conflicts || []).find((c) => c.conflict_id === conflictId);
  if (!cf) return fail("NOT_FOUND", String(conflictId || ""));
  const obj = (work.objections || []).find((o) => o.conflict_id === conflictId);
  const next = clone(work);
  if (obj) {
    const hit = next.objections.find((o) => o.objection_id === obj.objection_id);
    hit.status = "resolved";
    hit.resolved_at = iso(input.at);
  }
  next.measurements = [
    ...next.measurements,
    {
      measurement_id: newId("ms"),
      metric: "conflict_resolved",
      value: input.value ?? null,
      unit: "state",
      method: String(input.method || "recheck"),
      measured: input.measured === true,
      at: iso(input.at),
      provenance: stamp(input.node || "system", "correctConflict", input.at),
    },
  ];
  if (input.measured === true && next.state === "BLOCKED") next.state = "READY";
  return { ok: true, work: bump(next, "correctConflict", input.at, input.node) };
}

export function githubCapability(obs = {}) {
  return freezeDeep({
    connector_available: obs.connector_available === true,
    authenticated: obs.authenticated === true,
    readable: obs.readable === true,
    writable: obs.writable === true,
    write_attempted: obs.write_attempted === true,
    write_succeeded: obs.write_succeeded === true,
    write_readback_verified: obs.write_readback_verified === true,
    http: obs.http === undefined ? null : obs.http,
    live: false,
    ok: false,
  });
}

export function compareResults(a, b) {
  if (a == null || b == null || a.value === undefined || b.value === undefined) {
    return { verdict: "UNKNOWN", live: false };
  }
  if (JSON.stringify(a.value) === JSON.stringify(b.value)) {
    return {
      verdict: "AGREEMENT",
      provenance: { a: a.provenance || null, b: b.provenance || null },
      live: false,
    };
  }
  const ka = a.value && typeof a.value === "object" ? Object.keys(a.value) : [];
  const kb = b.value && typeof b.value === "object" ? Object.keys(b.value) : [];
  const share = ka.filter((k) => kb.includes(k));
  if (share.length && share.length < Math.max(ka.length, kb.length)) {
    const same = share.filter((k) => JSON.stringify(a.value[k]) === JSON.stringify(b.value[k]));
    if (same.length && same.length < share.length) {
      return {
        verdict: "PARTIAL_AGREEMENT",
        share: same,
        provenance: { a: a.provenance || null, b: b.provenance || null },
        live: false,
      };
    }
  }
  return {
    verdict: "DISAGREEMENT",
    provenance: { a: a.provenance || null, b: b.provenance || null },
    live: false,
  };
}

export function reliabilityScore(claim = {}) {
  const parts = {
    execution: claim.state === "EXECUTED" || claim.state === "VERIFIED" ? 1 : 0,
    readback: claim.state === "VERIFIED" ? 1 : 0,
    provenance: claim.actor && claim.source && claim.method ? 1 : 0,
    independent_verification: claim.state === "VERIFIED" ? 1 : 0,
    consistency: claim.state === "CONFLICT" ? 0 : 1,
    objections: Array.isArray(claim.objections) && claim.objections.length ? 0 : 1,
  };
  const total = Object.values(parts).reduce((s, n) => s + n, 0);
  return { parts, total, max: 6, magic: false, live: false };
}

export function assertOperational(word, proof) {
  const w = String(word || "").toLowerCase();
  if (!BARE_WORDS.includes(w)) {
    return { ok: true, state: "UNKNOWN", word: w, live: false };
  }
  if (!proof || proof.measured !== true) {
    return { ok: false, code: "INSUFFICIENT", state: "UNKNOWN", word: w, live: false };
  }
  if (w === "live" || w === "certified") {
    return fail("LIVE_NOT_CARL", "LIVE/certified not minted from proof flag");
  }
  if (w === "merged") {
    return fail("HUMAN", "merge is Carl only");
  }
  return { ok: true, state: "MEASURED", word: w, live: false };
}

export function realityTrace(steps = []) {
  const rows = (steps || []).map((s) => ({
    step: String(s.step || ""),
    state: String(s.state || "PROPOSED"),
    provenance: stamp(s.actor || "system", s.step || "trace", s.at),
    evidence: s.evidence ?? null,
    live: false,
  }));
  const order = ["request", "observe", "action", "readback", "measure", "verify"];
  const names = rows.map((r) => r.step);
  const complete = order.every((x) => names.includes(x));
  const verified = rows.some((r) => r.step === "verify" && r.state === "VERIFIED");
  return {
    ok: true,
    rows,
    complete,
    verification: verified ? "VERIFIED" : complete ? "PARTIAL" : "UNVERIFIED",
    executed: rows.some((r) => r.step === "action" && r.state === "EXECUTED"),
    live: false,
  };
}


