/**
 * Cognitive fabric v2 — collaborative extension of the v1 engine.
 * Multiple branches execute the same task, exchange measured context,
 * compare returns, preserve disagreement, and synthesize without minting LIVE.
 * V1 remains the work engine; this module adds collaboration semantics.
 */
import {
  addBranch,
  addMeasurement,
  addObjection,
  addSynapse,
  compareBranchResults,
  createTask,
  deterministicWorker,
  discoverCapabilities,
  runSynapse,
  setBranchResult,
  synthesize,
  transition,
  transferContext,
  verifyReadback,
} from "./fabric.mjs";

export const COLLABORATIVE_VERSION = "fabric.v2";
export const COLLABORATIVE_STATES = Object.freeze([
  "PROPOSED",
  "DISPATCHED",
  "RECEIVED",
  "WORKING",
  "RETURNED",
  "MEASURED",
]);

const iso = (value) => {
  const s = String(value || "");
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
};

const clone = (value) => structuredClone(value);

function stamp(node, source, at, extra = {}) {
  return {
    node: String(node || "system"),
    source,
    at: iso(at),
    method: COLLABORATIVE_VERSION,
    ...extra,
  };
}

function fail(code, error) {
  return { ok: false, code, error, live: false, auto_merge: false };
}

function appendSynapse(work, input) {
  const r = addSynapse(work, input);
  if (!r.ok) return r;
  const syn = r.work.synapses[r.work.synapses.length - 1];
  return { ...r, synapse_id: syn.synapse_id };
}

/** Execute one branch and record the complete collaboration lifecycle. */
export function executeBranch(work, branchId, spec = {}) {
  if (!work) return fail("FABRIC", "no work");
  const branch = work.branches.find((b) => b.branch_id === branchId);
  if (!branch) return fail("NOT_FOUND", branchId);
  const at = iso(spec.at);
  let next = clone(work);
  const worker = String(spec.worker || branch.worker);
  const output = spec.output ?? { branch: branchId, worker };

  const stages = ["PROPOSED", "DISPATCHED", "RECEIVED", "WORKING"];
  const lifecycle = stages.map((state) => ({
    state,
    branch_id: branchId,
    worker,
    at,
    live: false,
    provenance: stamp(worker, "executeBranch", at, { state }),
  }));

  const result = deterministicWorker({
    worker,
    capability: branch.capability,
    task_id: next.task_id,
    branch_id: branchId,
    output,
    fail: spec.fail === true,
    at,
  });
  if (result.live) return fail("LIVE_NOT_CARL", "deterministic worker cannot be LIVE");

  const set = setBranchResult(next, branchId, {
    summary: JSON.stringify(result.output),
    body: JSON.stringify(result.output),
    node: worker,
    at,
  });
  if (!set.ok) return set;
  next = set.work;

  const measure = addMeasurement(next, {
    metric: "collaborative_worker_ran",
    value: 1,
    unit: "call",
    method: "deterministic_test",
    measured: true,
    node: worker,
    at,
  });
  next = measure.work;

  const syn = appendSynapse(next, {
    from: "fabric-v2",
    to: worker,
    act: "WORK",
    context: { branch_id: branchId, lifecycle },
    at,
    node: "fabric-v2",
  });
  if (!syn.ok) return syn;
  next = syn.work;
  next = runSynapse(next, syn.synapse_id, {
    result: result.output,
    at,
    node: "fabric-v2",
  }).work;

  const expected = spec.fail
    ? { fail: true, branch: branchId }
    : output;
  const readback = verifyReadback({
    executed: true,
    expected,
    readback: result.output,
  });
  if (readback.state === "CONFLICT") {
    const objection = addObjection(next, {
      node: "fabric-v2",
      reason: "READBACK_CONFLICT",
      severity: "NOTE",
      at,
    });
    next = objection.work;
  }

  const final = clone(next);
  const finalBranch = final.branches.find((b) => b.branch_id === branchId);
  finalBranch.collaboration = {
    lifecycle: [...lifecycle, {
      state: "RETURNED",
      branch_id: branchId,
      worker,
      at,
      live: false,
      provenance: stamp(worker, "executeBranch", at, { state: "RETURNED" }),
    }, {
      state: "MEASURED",
      branch_id: branchId,
      worker,
      at,
      live: false,
      provenance: stamp("fabric-v2", "measureBranch", at, { state: "MEASURED" }),
    }],
    verification: readback.verification,
    executed: true,
    live: false,
  };
  final.live = false;
  final.auto_merge = false;
  return { ok: true, work: final, readback };
}

/** Transfer a completed branch result as explicit, provenance-bearing context. */
export function transferCollaborativeContext(work, fromId, toId, input = {}) {
  const at = iso(input.at);
  const result = transferContext(work, fromId, toId, {
    ...input,
    at,
    require: input.require ?? true,
    node: "fabric-v2",
  });
  if (!result.ok) return result;
  const next = clone(result.work);
  const syn = next.synapses[next.synapses.length - 1];
  if (syn) {
    syn.lifecycle = [
      { state: "PROPOSED", at, live: false },
      { state: "DISPATCHED", at, live: false },
      { state: "RECEIVED", at, live: false },
      { state: "MEASURED", at, live: false },
    ];
    syn.grade = "EXECUTED";
    syn.run = "MEASURED";
    syn.provenance = stamp("fabric-v2", "transferCollaborativeContext", at, {
      from: fromId,
      to: toId,
      insufficient: result.insufficient,
    });
  }
  next.live = false;
  next.auto_merge = false;
  return { ok: true, work: next, insufficient: result.insufficient };
}

function metrics(work, branches, corrections, transfers, verifications, comparison) {
  return {
    tasks_created: 1,
    tasks_executed: work.executed === true ? 1 : 0,
    branches_created: branches,
    branches_executed: work.branches.filter((b) => b.collaboration?.executed).length,
    workers_executed: work.branches.filter((b) => b.collaboration?.executed).length,
    context_transfers: transfers,
    synapses_dispatched: work.synapses.filter((s) => s.grade === "EXECUTED").length,
    responses_received: work.branches.filter((b) => b.result).length,
    measurements: work.measurements.filter((m) => m.measured).length,
    verifications,
    agreements: comparison.verdict === "AGREEMENT" ? 1 : 0,
    disagreements: comparison.verdict === "DISAGREEMENT" ? 1 : 0,
    objections: work.objections.length,
    corrections,
    syntheses: work.synthesis ? 1 : 0,
    human_decisions_pending:
      work.decision?.status === "PENDING_HUMAN" ? 1 : 0,
    collaboration: "EXECUTED",
    loop: "EXECUTED",
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

/**
 * Integrated v2 collaboration cycle.
 * Default workers are deterministic test doubles: execution is real locally,
 * provider connectivity is deliberately NOT inferred.
 */
export function runCollaborativeEngine(input = {}) {
  const at = iso(input.at);
  const trace = [];
  const step = (name, extra = {}) => trace.push({
    step: name,
    at,
    live: false,
    ...extra,
  });

  let task = createTask({
    objective: input.objective || "collaborative fabric cycle",
    required_capabilities: input.required_capabilities || ["lu"],
    node: "fabric-v2",
    at,
  });
  if (!task.ok) return task;
  let work = task.work;
  step("observe", { task_id: work.task_id });

  const discovery = discoverCapabilities(work);
  step("understand", { required: discovery.need.length });
  step("discover", { candidates: discovery.candidates.length, live: false });

  const workers = input.workers || [
    { worker: "gemini", capability: "lu", output: { answer: "A" } },
    { worker: "chatgpt", capability: "lu", output: { answer: "A" } },
  ];
  for (const spec of workers) {
    const branch = addBranch(work, {
      worker: spec.worker,
      capability: spec.capability || "lu",
      kind: "deterministic_test",
      at,
      node: "fabric-v2",
    });
    if (!branch.ok) return { ...branch, trace, live: false };
    work = branch.work;
  }
  step("compose", { branches: work.branches.length });

  const ready = transition(work, "READY", { node: "fabric-v2", at });
  if (!ready.ok) return { ...ready, trace, live: false };
  work = transition(ready.work, "WORKING", { node: "fabric-v2", at }).work;
  step("delegate", { branches: workers.length });

  for (const spec of workers) {
    const branch = work.branches.find((b) => b.worker === spec.worker && !b.result);
    const result = executeBranch(work, branch.branch_id, { ...spec, at });
    if (!result.ok) return { ...result, trace, live: false };
    work = result.work;
  }
  step("work", { workers_executed: work.branches.filter((b) => b.collaboration?.executed).length });

  let transfers = 0;
  if (work.branches.length > 1) {
    const transfer = transferCollaborativeContext(
      work,
      work.branches[0].branch_id,
      work.branches[1].branch_id,
      { at },
    );
    if (!transfer.ok) return { ...transfer, trace, live: false };
    work = transfer.work;
    transfers = 1;
  }
  step("transfer", { transfers });
  step("receive", { responses: work.branches.filter((b) => b.result).length });

  const comparison = compareBranchResults(work);
  step("compare", { verdict: comparison.verdict });
  step("measure", { measurements: work.measurements.length });

  if (comparison.verdict === "DISAGREEMENT") {
    const objection = addObjection(work, {
      node: "fabric-v2",
      reason: "DISAGREEMENT",
      severity: "NOTE",
      at,
    });
    work = objection.work;
    step("object", { reason: "DISAGREEMENT" });
  } else {
    step("object", { reason: null });
  }

  let corrections = 0;
  if (input.correct && work.branches[0]) {
    const branch = work.branches[0];
    const corrected = executeBranch(work, branch.branch_id, {
      worker: branch.worker,
      capability: branch.capability,
      output: input.correct_output ?? { corrected: true },
      at,
    });
    if (!corrected.ok) return { ...corrected, trace, live: false };
    work = corrected.work;
    work = addMeasurement(work, {
      metric: "correction",
      value: 1,
      unit: "call",
      method: "collaborative_reexecute",
      measured: true,
      node: "fabric-v2",
      at,
    }).work;
    corrections = 1;
    step("correct", { corrections });
  } else {
    step("correct", { corrections: 0 });
  }

  const finalComparison = compareBranchResults(work);
  work = synthesize(work, {
    summary: finalComparison.verdict,
    confidence: finalComparison.verdict === "AGREEMENT" ? "aligned" : "unscored",
    node: "fabric-v2",
    at,
  }).work;
  step("synthesize", { verdict: finalComparison.verdict });

  work = transition(work, "REVIEWING", { node: "fabric-v2", at }).work;
  work = transition(work, "DECISION", {
    node: "fabric-v2",
    at,
    recommendation: finalComparison.verdict,
  }).work;
  step("human_decision", { status: work.decision.status });
  step("next", { defined: true, executed: false });

  const final = clone(work);
  final.executed = true;
  final.loop = "EXECUTED";
  final.engine = COLLABORATIVE_VERSION;
  final.collaboration = "EXECUTED";
  final.live = false;
  final.auto_merge = false;
  final.trace = trace;
  const verifications = final.branches.filter((b) => b.collaboration?.verification === "VERIFIED").length;
  return {
    ok: true,
    work: final,
    metrics: metrics(final, workers.length, corrections, transfers, verifications, finalComparison),
    trace,
    live: false,
    auto_merge: false,
  };
}
