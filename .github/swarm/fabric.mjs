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
