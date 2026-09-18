import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalWorkFromRuntime,
  rankWork,
  workState,
  runContinuousWorkEngine,
  executeWorkTask,
} from "../scripts/acorn-work-engine.mjs";
import {
  DEFAULT_LIMITS,
  canConsume,
  limitsFromEnv,
  resourcePolicy,
} from "../scripts/acorn-resource-governor.mjs";

test("resource governor defaults to zero model calls and zero spend", () => {
  const limits = limitsFromEnv({});
  assert.equal(limits.model_calls, 0);
  assert.equal(limits.model_tokens, 0);
  assert.equal(limits.external_spend, 0);
  const policy = resourcePolicy({ env: {}, limits });
  assert.equal(policy.model_execution_allowed, false);
  assert.equal(policy.external_spend_allowed, false);
});

test("resource governor refuses a model cost when the model budget is zero", () => {
  const limits = { ...DEFAULT_LIMITS, model_calls: 0, model_tokens: 0 };
  const decision = canConsume({
    limits,
    usage: {},
    cost: { model_calls: 1, model_tokens: 1000 },
  });
  assert.equal(decision.allowed, false);
  assert.deepEqual(decision.insufficient.sort(), ["model_calls", "model_tokens"]);
});

test("work discovery is unified and rankable", () => {
  const runtime = {
    unified: {
      evolution: { next_work: [
        { id: "a", information_gain: 1, capability_gain: .5, risk_reduction: .5, cost: .2 },
      ] },
      learning: { next: [
        { id: "b", information_gain: .5, capability_gain: 1, risk_reduction: .5, cost: .4 },
      ] },
      metabolism: { next: [
        { id: "c", information_gain: .1, capability_gain: .1, risk_reduction: 1, cost: .1 },
      ] },
    },
  };
  const rows = canonicalWorkFromRuntime(runtime);
  assert.equal(rows.length, 6);
  assert.ok(rows.some((row) => row.execution_kind === "connection-sweep"));
  assert.ok(rows.some((row) => row.execution_kind === "compute-sweep"));
  assert.equal(rankWork(rows)[0].priority >= rankWork(rows)[1].priority, true);
});

test("continuous work engine executes bounded deterministic work without model dispatch", async () => {
  const root = process.cwd();
  const result = await runContinuousWorkEngine({
    root,
    env: {
      ...process.env,
      ACORN_BUDGET_MODEL_CALLS: "0",
      ACORN_BUDGET_MODEL_TOKENS: "0",
      ACORN_BUDGET_EXTERNAL_SPEND: "0",
      ACORN_WORK_MAX_TASKS: "1",
    },
    runtime: {
      state: "CONTINUOUS",
      coverage: { discovered_count: 1, measured_count: 1, verified_count: 1 },
      unified: {
        cycle_order: ["REAL_STATE", "INVENTORY", "DEFENSE", "CORTEX", "EVOLUTION", "LEARNING", "METABOLISM", "EVIDENCE", "CONTINUE"],
        evolution: { next_work: [{ id: "test", subject: "inventory revalidation", information_gain: 1, capability_gain: .5, risk_reduction: .5, cost: .1 }] },
        learning: { next: [] },
        metabolism: { next: [] },
      },
    },
    previous: { queue: [], usage: {}, history: [] },
    statePath: "/tmp/acorn-continuous-work-engine-test.json",
  });
  assert.equal(result.authority, "carl");
  assert.equal(result.auto_merge, false);
  assert.equal(result.auto_spend, false);
  assert.equal(result.executor_policy.model_dispatch, false);
  assert.equal(result.completed_count, 1);
});

test("continuous work can execute a free quantum simulation through the existing compute fabric", async () => {
  const result = await executeWorkTask({
    root: process.cwd(),
    env: { ...process.env, ACORN_ALLOW_REMOTE_EXECUTION: "false" },
    task: {
      execution_kind: "quantum",
      task: { type: "quantum_simulation", qubits: 1, gates: [["h", 0]], shots: 16, seed: 7, allow_simulator: true },
      policy: "FREE_FIRST",
    },
  });
  assert.equal(result.executor, "compute-fabric");
  assert.equal(result.status, "COMPLETED");
  assert.equal(result.compute?.execution?.measurement?.measured, true);
  assert.equal(result.compute?.execution?.cost?.actual_cost, 0);
});


test("continuous work engine includes universal compute metabolism", async () => {
  const { canonicalWorkFromRuntime, executeWorkTask } = await import("../scripts/acorn-work-engine.mjs");
  const rows = canonicalWorkFromRuntime({ unified: { evolution: {}, learning: {}, metabolism: {} }, coverage: {} });
  const sweep = rows.find((row) => row.execution_kind === "compute-sweep");
  assert.ok(sweep);
  const execution = await executeWorkTask({ root: process.cwd(), task: sweep, env: { ...process.env, ACORN_ALLOW_REMOTE_EXECUTION: "false" } });
  assert.equal(execution.executor, "compute-fabric-sweep");
  assert.ok(execution.compute);
  assert.equal(execution.compute.auto_spend, false);
  assert.equal(execution.compute.live, false);
  assert.ok(execution.compute.executed_count > 0 || execution.compute.held_count > 0);
});


test("continuous optimization reopens recurring work and records measured scheduling basis", () => {
  const previous = {
    queue: [{ id: "work:repeat", state: "COMPLETED", attempts: 1, cycle_count: 0 }],
    history: [{ work_id: "work:repeat", state: "COMPLETED", duration_ms: 1000 }],
  };
  const discovered = [{
    id: "work:repeat",
    source: "learning",
    subject: "repeat",
    state: "READY",
    information_gain: 1,
    capability_gain: 1,
    risk_reduction: 1,
    cost: 0.1,
    repeatable: true,
  }];
  const graph = workState({ previous, discovered });
  assert.equal(graph.queue[0].state, "READY");
  assert.equal(graph.queue[0].cycle_count, 1);
  assert.equal(graph.queue[0].optimization.basis, "measured_history");
});


test("continuous work executes the canonical connection sweep", async () => {
  const rows = canonicalWorkFromRuntime({ unified: { evolution: {}, learning: {}, metabolism: {} }, coverage: {} });
  const sweep = rows.find((row) => row.execution_kind === "connection-sweep");
  assert.ok(sweep);
  const execution = await executeWorkTask({ root: process.cwd(), task: sweep, env: { ...process.env, ACORN_ALLOW_REMOTE_EXECUTION: "false" } });
  assert.equal(execution.executor, "connection-fabric");
  assert.ok(execution.connections);
  assert.equal(execution.connections.constitution.external_boundary, "connector-flux");
  assert.equal(execution.connections.auto_spend, false);
  assert.equal(execution.connections.live, false);
  assert.equal(execution.connections.proof.status, "VERIFIED");
});
