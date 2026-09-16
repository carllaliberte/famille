/**
 * Cognitive fabric v3 — adaptive collaboration.
 * A measured disagreement becomes new work instead of a discarded answer.
 * Deterministic workers are the execution substrate; external providers are
 * never inferred LIVE. Carl remains the human decision authority.
 */
import {
  addBranch,
  addMeasurement,
  addObjection,
  createTask,
  discoverCapabilities,
  humanDecide,
  setBranchResult,
  synthesize,
  transition,
  verifyReadback,
} from "./fabric.mjs";
import { executeBranch, transferCollaborativeContext } from "./fabric-v2.mjs";

export const ADAPTIVE_VERSION = "fabric.v3";
export const ADAPTIVE_FLOW = Object.freeze([
  "COMPARE",
  "OBJECTION",
  "NEW_TASK",
  "CORRECTION",
  "REEXECUTION",
  "MEASURE",
  "SYNTHESIS",
  "HUMAN_DECISION",
]);

const iso = (value) => {
  const s = String(value || "");
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
};
const clone = (value) => structuredClone(value);
const fail = (code, error) => ({ ok: false, code, error, live: false, auto_merge: false });

function stamp(node, source, at, extra = {}) {
  return { node: String(node || "system"), source, at: iso(at), method: ADAPTIVE_VERSION, ...extra };
}

/** Turn a disagreement into an explicit follow-up task. */
export function createAdaptiveTask(work, input = {}) {
  if (!work) return fail("FABRIC", "no work");
  const objection = [...(work.objections || [])].reverse().find((o) => o.reason === "DISAGREEMENT");
  if (!objection && input.require_objection !== false) return fail("NO_OBJECTION", "adaptive task requires disagreement");
  const result = createTask({
    objective: String(input.objective || `resolve disagreement for ${work.task_id}`),
    constraints: [...(work.constraints || []), "preserve both measured returns"],
    required_capabilities: [...(work.required_capabilities || [])],
    evidence_requirements: ["measured correction", "readback verification"],
    node: "fabric-v3",
    at: input.at,
  });
  if (!result.ok) return result;
  const next = clone(result.work);
  next.parent_task = work.task_id;
  next.adaptation = {
    reason: "DISAGREEMENT",
    source_objection: objection?.objection_id || null,
    source_version: work.version,
    provenance: stamp("fabric-v3", "createAdaptiveTask", input.at),
  };
  next.live = false;
  next.auto_merge = false;
  return { ok: true, task: next };
}

/** Execute the correction as new work, never as an overwrite of history. */
export function executeCorrection(task, spec = {}) {
  if (!task) return fail("FABRIC", "no adaptive task");
  let work = task;
  const branch = addBranch(work, {
    worker: spec.worker || "adaptive-correction",
    capability: spec.capability || work.required_capabilities[0] || "lu",
    kind: "deterministic_test",
    objective: spec.objective || work.objective,
    at: spec.at,
    node: "fabric-v3",
  });
  if (!branch.ok) return branch;
  work = branch.work;
  const ready = transition(work, "READY", { node: "fabric-v3", at: spec.at });
  if (!ready.ok) return ready;
  work = ready.work;
  const working = transition(work, "WORKING", { node: "fabric-v3", at: spec.at });
  if (!working.ok) return working;
  work = working.work;

  const output = spec.output ?? { corrected: true };
  const executed = executeBranch(work, branch.branch_id, {
    worker: spec.worker || "adaptive-correction",
    capability: spec.capability || work.required_capabilities[0] || "lu",
    output,
    at: spec.at,
  });
  if (!executed.ok) return executed;
  work = executed.work;

  // In-process counter only. Not consulter / mesure-protocol. Not a juge card.
  const measurement = addMeasurement(work, {
    metric: "adaptive_correction",
    value: 1,
    unit: "reexecution",
    method: "deterministic_test",
    measured: true,
    node: "fabric-v3",
    at: spec.at,
  });
  if (!measurement.ok) return measurement;
  work = measurement.work;

  const branchResult = work.branches.find((b) => b.branch_id === branch.branch_id)?.result;
  const expected = spec.expected !== undefined ? spec.expected : output;
  const readback = verifyReadback({ executed: true, expected, readback: branchResult ? JSON.parse(branchResult.body) : null });
  if (readback.state !== "VERIFIED") {
    const objection = addObjection(work, {
      node: "fabric-v3",
      reason: "CORRECTION_READBACK_CONFLICT",
      severity: "BLOCKING",
      at: spec.at,
    });
    if (!objection.ok) return objection;
    work = objection.work;
    return { ok: true, work, readback, verified: false };
  }
  return { ok: true, work, readback, verified: true };
}

/**
 * Full adaptive cycle. If the first comparison disagrees, a new task is
 * created and executed; the original returns remain intact for provenance.
 */
export function runAdaptiveEngine(input = {}) {
  const at = iso(input.at);
  const trace = [];
  const step = (name, extra = {}) => trace.push({ step: name, at, live: false, ...extra });

  const workers = input.workers || [
    { worker: "gemini", capability: "lu", output: { answer: "A" } },
    { worker: "chatgpt", capability: "lu", output: { answer: "B" } },
  ];

  let task = createTask({
    objective: input.objective || "adaptive collaborative cycle",
    required_capabilities: input.required_capabilities || ["lu"],
    node: "fabric-v3",
    at,
  });
  if (!task.ok) return task;
  let work = task.work;
  step("observe", { task_id: work.task_id });
  const discovery = discoverCapabilities(work);
  step("discover", { candidates: discovery.candidates.length, live: false });

  for (const spec of workers) {
    const branch = addBranch(work, {
      worker: spec.worker,
      capability: spec.capability || "lu",
      kind: "deterministic_test",
      at,
      node: "fabric-v3",
    });
    if (!branch.ok) return { ...branch, trace, live: false };
    work = branch.work;
  }
  const ready = transition(work, "READY", { node: "fabric-v3", at });
  if (!ready.ok) return { ...ready, trace, live: false };
  work = transition(ready.work, "WORKING", { node: "fabric-v3", at }).work;
  step("delegate", { branches: work.branches.length });

  for (const spec of workers) {
    const branch = work.branches.find((b) => b.worker === spec.worker && !b.result);
    const result = executeBranch(work, branch.branch_id, { ...spec, at });
    if (!result.ok) return { ...result, trace, live: false };
    work = result.work;
  }
  step("work", { executed: work.branches.filter((b) => b.collaboration?.executed).length });

  if (work.branches.length > 1) {
    const transfer = transferCollaborativeContext(work, work.branches[0].branch_id, work.branches[1].branch_id, { at });
    if (!transfer.ok) return { ...transfer, trace, live: false };
    work = transfer.work;
  }

  const bodies = work.branches.map((b) => b.result?.body).filter(Boolean);
  const verdict = bodies.length > 1 && bodies.every((b) => b === bodies[0]) ? "AGREEMENT" : "DISAGREEMENT";
  step("compare", { verdict });

  let adaptive = null;
  let corrections = 0;
  if (verdict === "DISAGREEMENT") {
    const objection = addObjection(work, { node: "fabric-v3", reason: "DISAGREEMENT", severity: "NOTE", at });
    work = objection.work;
    step("object", { reason: "DISAGREEMENT" });

    adaptive = createAdaptiveTask(work, { at, objective: input.adaptive_objective });
    if (!adaptive.ok) return { ...adaptive, trace, live: false };
    step("new_task", { parent_task: work.task_id, adaptive_task: adaptive.task.task_id });

    const correction = executeCorrection(adaptive.task, {
      worker: input.correction_worker || "adaptive-correction",
      capability: input.correction_capability || "lu",
      output: input.correct_output ?? { resolved: true },
      expected: input.correct_expected,
      at,
    });
    if (!correction.ok) return { ...correction, trace, live: false };
    adaptive = { task: correction.work, readback: correction.readback, verified: correction.verified };
    corrections = 1;
    step("correction", { verified: correction.verified });
    step("reexecution", { measured: true });
    step("measure", { adaptive_measurements: correction.work.measurements.length });
  } else {
    step("object", { reason: null });
    step("new_task", { created: false });
    step("correction", { created: false });
    step("reexecution", { created: false });
    step("measure", { adaptive_measurements: 0 });
  }

  const summary = verdict === "DISAGREEMENT" ? (adaptive?.verified ? "ADAPTIVE_RESOLVED" : "ADAPTIVE_UNVERIFIED") : "AGREEMENT";
  work = synthesize(work, { summary, confidence: summary === "AGREEMENT" || summary === "ADAPTIVE_RESOLVED" ? "aligned" : "unscored", node: "fabric-v3", at }).work;
  step("synthesize", { summary });
  work = transition(work, "REVIEWING", { node: "fabric-v3", at }).work;
  work = transition(work, "DECISION", { node: "fabric-v3", at, recommendation: summary }).work;
  step("human_decision", { status: work.decision.status });

  const final = clone(work);
  final.executed = true;
  final.loop = "EXECUTED";
  final.engine = ADAPTIVE_VERSION;
  final.adaptive = {
    triggered: verdict === "DISAGREEMENT",
    corrections,
    parent_task: work.task_id,
    child_task: adaptive?.task?.task_id || null,
    child_verified: adaptive?.verified === true,
    live: false,
    provenance: stamp("fabric-v3", "adaptive-cycle", at),
  };
  final.live = false;
  final.auto_merge = false;
  final.trace = trace;
  return {
    ok: true,
    work: final,
    adaptive_task: adaptive?.task || null,
    metrics: {
      tasks_created: 1 + (adaptive ? 1 : 0),
      disagreements: verdict === "DISAGREEMENT" ? 1 : 0,
      objections: final.objections.length,
      corrections,
      reexecutions: corrections,
      measurements: final.measurements.filter((m) => m.measured).length + (adaptive?.task?.measurements?.length || 0),
      adaptive_verified: adaptive?.verified === true,
      human_decisions_pending: final.decision.status === "PENDING_HUMAN" ? 1 : 0,
      executed: true,
      live: false,
      auto_merge: false,
      authority: "carl",
    },
    trace,
    live: false,
    auto_merge: false,
  };
}
