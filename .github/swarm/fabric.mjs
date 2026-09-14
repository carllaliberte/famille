/**
 * Cognitive fabric — v0 work object + v1 local engine.
 * Deterministic workers execute the cycle. LIVE is never minted.
 * DEFINED ≠ EXECUTED ≠ VERIFIED. Carl decides.
 */
import { OWNER_ACTOR } from "./flux.mjs";
import { assign, pool, route } from "./workforce.mjs";

export const FABRIC_VERSION = "fabric.v0";
export const FABRIC_ENGINE = "fabric.v1";
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
    if (!assignment.ok && input.kind === "deterministic_test") {
      assignment = { ok: true, id: worker, worker };
    } else if (!assignment.ok) {
      return assignment;
    }
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
    declared: Boolean(row) || input.kind === "deterministic_test",
    available: Boolean(row && (row.seat === "AVAILABLE" || row.seat === "IDLE")),
    kind: input.kind || null,
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
    loop: work.loop || "DEFINED",
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

export const SYNAPSE_RUN = Object.freeze([
  "PROPOSED",
  "DISPATCHED",
  "RECEIVED",
  "WORKING",
  "RETURNED",
  "MEASURED",
]);

/** In-process test double. Never LIVE. */
export function deterministicWorker(input = {}) {
  const at = iso(input.at);
  return freezeDeep({
    kind: "deterministic_test",
    live: false,
    worker: String(input.worker || "dt"),
    capability: String(input.capability || ""),
    output: input.fail
      ? { fail: true, branch: input.branch_id || null }
      : (input.output ?? { echo: true, branch: input.branch_id || null }),
    state: "RETURNED",
    method: "deterministic_test",
    timestamp: at,
    measurement: {
      metric: "worker_ran",
      value: 1,
      unit: "call",
      measured: true,
      method: "in-process",
      at,
    },
    provenance: stamp(input.worker || "dt", "deterministicWorker", at, {
      operation: "work",
      input: { task_id: input.task_id || null, branch_id: input.branch_id || null },
    }),
  });
}

export function verifyReadback(input = {}) {
  if (input.executed !== true) {
    return { ok: true, state: "PROPOSED", verification: "UNVERIFIED", live: false };
  }
  if (input.readback_failed === true || input.readback == null) {
    return { ok: true, state: "EXECUTED", verification: "UNVERIFIED", live: false };
  }
  const match = JSON.stringify(input.readback) === JSON.stringify(input.expected);
  if (match) {
    return { ok: true, state: "VERIFIED", verification: "VERIFIED", live: false };
  }
  return {
    ok: false,
    code: "CONFLICT",
    state: "CONFLICT",
    verification: "UNVERIFIED",
    a: input.expected,
    b: input.readback,
    live: false,
  };
}

export function compareBranchResults(work) {
  const bodies = (work?.branches || [])
    .map((b) => (b.result && b.result.body) || null)
    .filter((x) => x != null);
  if (bodies.length < 2) return { verdict: "UNKNOWN", live: false };
  const allSame = bodies.every((b) => b === bodies[0]);
  return { verdict: allSame ? "AGREEMENT" : "DISAGREEMENT", live: false };
}

export function runSynapse(work, synapseId, input = {}) {
  if (!work) return fail("FABRIC", "no work");
  const next = clone(work);
  const syn = next.synapses.find((s) => s.synapse_id === synapseId);
  if (!syn) return fail("NOT_FOUND", String(synapseId || ""));
  const at = iso(input.at);
  syn.run = "MEASURED";
  syn.dispatched_at = at;
  syn.received_at = at;
  syn.returned_at = at;
  syn.measured_at = at;
  syn.result = input.result ?? null;
  syn.grade = "EXECUTED";
  syn.measurement = {
    metric: "synapse_ran",
    value: 1,
    unit: "call",
    measured: true,
    method: "in-process",
    at,
  };
  return { ok: true, work: bump(next, "runSynapse", input.at, input.node) };
}

function engineMetrics(work, verifications, cmp) {
  const verifiedN = (verifications || []).filter((v) => v.state === "VERIFIED").length;
  return {
    tasks_created: 1,
    tasks_executed: work.executed ? 1 : 0,
    branches_created: (work.branches || []).length,
    branches_dispatched: (work.branches || []).filter((b) => b.result).length,
    workers_executed: (work.branches || []).filter((b) => b.result).length,
    context_transfers: (work.synapses || []).filter((s) => s.act === "TRANSFER").length,
    responses_received: (work.branches || []).filter((b) => b.result).length,
    measurements: (work.measurements || []).length,
    verifications: verifiedN,
    objections: (work.objections || []).length,
    corrections: (work.measurements || []).filter((m) => m.metric === "correction").length,
    syntheses: work.synthesis ? 1 : 0,
    disagreements: cmp && cmp.verdict === "DISAGREEMENT" ? 1 : 0,
    human_decisions_pending:
      work.decision && work.decision.status === "PENDING_HUMAN" ? 1 : 0,
    loop: work.loop || "DEFINED",
    executed: work.executed === true,
    verified: Boolean(verifications && verifications.length && verifications.every((v) => v.state === "VERIFIED")),
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

/**
 * Deterministic engine. executed=true is the motor, not LIVE providers.
 */
export function runEngine(input = {}) {
  const clock = iso(input.at);
  const trace = [];
  const step = (name, extra = {}) => {
    trace.push({ step: name, at: clock, live: false, ...extra });
  };

  let work = createTask({
    objective: input.objective || "engine cycle",
    required_capabilities: input.required_capabilities || ["lu"],
    node: input.node || "engine",
    at: clock,
  }).work;
  step("observe", { task_id: work.task_id, state: work.state });

  work = addObservation(work, {
    node: "engine",
    summary: work.objective,
    at: clock,
  }).work;
  step("understand", { observations: work.observations.length });

  const discovery = discoverCapabilities(work);
  step("discover", { n: discovery.candidates.length });

  const workers = input.workers || [
    { worker: "gemini", capability: "lu", output: { n: 1 } },
    { worker: "chatgpt", capability: "lu", output: { n: 1 } },
  ];
  for (const w of workers) {
    const br = addBranch(work, {
      worker: w.worker,
      capability: w.capability || "lu",
      kind: w.kind || "deterministic_test",
      at: clock,
      node: "engine",
    });
    if (!br.ok) return { ...br, trace, live: false };
    work = br.work;
  }
  step("compose", { branches: work.branches.length });

  const toReady = transition(work, "READY", { node: "engine", at: clock });
  if (!toReady.ok) return { ...toReady, trace, live: false };
  work = toReady.work;
  work = transition(work, "WORKING", { node: "engine", at: clock }).work;
  step("delegate", { state: work.state });

  for (const br of work.branches) {
    const spec = workers.find((w) => w.worker === br.worker) || {};
    const dw = deterministicWorker({
      worker: br.worker,
      capability: br.capability,
      task_id: work.task_id,
      branch_id: br.branch_id,
      context: br.context,
      output: spec.output,
      fail: spec.fail,
      at: clock,
    });
    if (dw.live === true) return fail("LIVE_NOT_CARL", "deterministic worker cannot be LIVE");
    work = setBranchResult(work, br.branch_id, {
      summary: JSON.stringify(dw.output),
      body: JSON.stringify(dw.output),
      node: br.worker,
      at: clock,
    }).work;
    work = addMeasurement(work, {
      metric: "worker_ran",
      value: 1,
      unit: "call",
      method: "deterministic_test",
      measured: true,
      node: br.worker,
      at: clock,
    }).work;
    const synAdd = addSynapse(work, {
      from: "engine",
      to: br.worker,
      act: "WORK",
      at: clock,
    });
    work = synAdd.work;
    const syn = work.synapses[work.synapses.length - 1];
    work = runSynapse(work, syn.synapse_id, { result: dw.output, at: clock, node: "engine" }).work;
  }
  step("work", {
    workers_executed: work.branches.filter((b) => b.result).length,
  });

  if (work.branches.length >= 2) {
    const t = transferContext(work, work.branches[0].branch_id, work.branches[1].branch_id, {
      at: clock,
      node: "engine",
    });
    if (!t.ok) return { ...t, trace, live: false };
    work = t.work;
    step("transfer", { insufficient: t.insufficient });
  } else {
    step("transfer", { skipped: true });
  }

  step("measure", { n: work.measurements.length });

  const verifications = work.branches.map((br) => {
    const spec = workers.find((w) => w.worker === br.worker) || {};
    const expected = spec.fail ? { fail: true, branch: br.branch_id } : (spec.output ?? { echo: true, branch: br.branch_id });
    const got = br.result ? JSON.parse(br.result.body) : null;
    const v = verifyReadback({ executed: true, expected, readback: got });
    return { branch_id: br.branch_id, state: v.state, verification: v.verification };
  });
  step("verify", { verifications });

  const cmpEarly = compareBranchResults(work);
  if (cmpEarly.verdict === "DISAGREEMENT" || input.object) {
    work = addObjection(work, {
      node: "engine",
      reason: cmpEarly.verdict === "DISAGREEMENT" ? "DISAGREEMENT" : String(input.object_reason || "NOTE"),
      severity: "NOTE",
      at: clock,
    }).work;
    step("object", { n: work.objections.length });
  } else {
    step("object", { n: 0 });
  }

  if (input.correct) {
    const br = work.branches[0];
    const dw = deterministicWorker({
      worker: br.worker,
      output: input.correct_output ?? { corrected: true },
      branch_id: br.branch_id,
      at: clock,
    });
    work = setBranchResult(work, br.branch_id, {
      summary: JSON.stringify(dw.output),
      body: JSON.stringify(dw.output),
      node: br.worker,
      at: clock,
    }).work;
    work = addMeasurement(work, {
      metric: "correction",
      value: 1,
      unit: "call",
      method: "reexecute",
      measured: true,
      node: "engine",
      at: clock,
    }).work;
    if (work.objections[0]) {
      work = resolveObjection(work, work.objections[0].objection_id, {
        node: "engine",
        at: clock,
      }).work;
    }
    step("correct", { measured: true });
  } else {
    step("correct", { skipped: true });
  }

  const cmp = compareBranchResults(work);
  work = synthesize(work, {
    summary: cmp.verdict,
    confidence: cmp.verdict === "AGREEMENT" ? "aligned" : "unscored",
    node: "engine",
    at: clock,
  }).work;
  step("synthesize", { verdict: cmp.verdict });

  const rev = transition(work, "REVIEWING", { node: "engine", at: clock });
  if (!rev.ok) return { ...rev, trace, live: false };
  work = rev.work;
  const dec = transition(work, "DECISION", {
    node: "engine",
    at: clock,
    recommendation: cmp.verdict,
  });
  if (!dec.ok) return { ...dec, trace, live: false };
  work = dec.work;
  step("human_decision", { status: work.decision.status });
  step("next", { defined: true, executed: false });

  const next = clone(work);
  next.executed = true;
  next.loop = "EXECUTED";
  next.live = false;
  next.auto_merge = false;
  next.engine = FABRIC_ENGINE;
  next.trace = trace;
  const frozen = freezeDeep(next);
  return {
    ok: true,
    work: frozen,
    metrics: engineMetrics(frozen, verifications, cmp),
    trace,
    live: false,
  };
}


