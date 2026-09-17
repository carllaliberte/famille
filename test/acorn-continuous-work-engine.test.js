import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalWorkFromRuntime,
  rankWork,
  runContinuousWorkEngine,
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
  assert.equal(rows.length, 3);
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
