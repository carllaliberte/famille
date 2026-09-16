import test from "node:test";
import assert from "node:assert/strict";
import {
  branchFutures,
  cognitiveDiff,
  describeFuture,
  describePlan,
  expireFuture,
  failureBudget,
  foresightClaim,
  propagateUncertainty,
  rememberPrediction,
  runFuturesEngine,
  simulateAction,
} from "../scripts/cortex-futures.mjs";
import { runOrganismCycle } from "../scripts/cortex-organism.mjs";

test("future state is hypothesis, not reality", () => {
  const f = describeFuture({ scenario: "failure", assumptions: [{ name: "x", uncertain: true }] });
  assert.equal(f.status, "HYPOTHESIS");
  assert.equal(f.is_reality, false);
  assert.equal(f.is_observation, false);
});

test("branching keeps multiple futures and chooses none", () => {
  const tree = branchFutures({ state: "CURRENT" });
  assert.ok(tree.branches.length >= 5);
  assert.equal(tree.chosen, null);
  assert.ok(tree.branches.some((row) => row.scenario === "unknown"));
});

test("stale future is expired and not treated as current forecast", () => {
  const expired = expireFuture({
    future_id: "f1", expires_at: "2020-01-01T00:00:00.000Z", status: "SIMULATED",
  }, { now: "2026-09-16T23:00:00.000Z" });
  assert.equal(expired.expired, true);
  assert.equal(expired.treated_as_current_forecast, false);
});

test("uncertain input does not become certain output", () => {
  const p = propagateUncertainty({ root_uncertain: true, dependents: [{ name: "B" }] });
  assert.equal(p.invented_certainty, false);
  assert.equal(p.dependents[0].uncertain, true);
});

test("plan is not execution; unauthorized action stays simulated", () => {
  const plan = describePlan({ goal: "review" });
  assert.equal(plan.executed, false);
  const sim = simulateAction({ action: "merge", authorized: false });
  assert.equal(sim.executed, false);
  assert.equal(sim.status, "HOLD_HUMAN");
});

test("failure budget is inconclusive when unmeasured; foresight is not pretended", () => {
  const b = failureBudget({});
  assert.equal(b.status, "INCONCLUSIVE");
  assert.equal(b.invented_tolerance, false);
  const claim = foresightClaim({});
  assert.equal(claim.knows_what_will_happen, false);
  assert.match(claim.formulation, /assumptions/);
});

test("prediction memory is not rewritten; cognitive diff declares no winner", () => {
  const mem = rememberPrediction({ future: { predicted_outcomes: [1] }, actual: [0] });
  assert.equal(mem.rewritten, false);
  const d = cognitiveDiff({ routing: "a" }, { routing: "b" });
  assert.equal(d.better, false);
});

test("futures engine stays one Cortex, zero-cost, no LIVE", () => {
  const run = runFuturesEngine({
    workerEvidence: { v: "cognitive-worker.v14" },
    skipWorld: true,
    skipContinuity: true,
  });
  assert.equal(run.gates.second_cortex, false);
  assert.equal(run.gates.simulation_is_reality, false);
  assert.equal(run.gates.plan_is_executed, false);
  assert.equal(run.gates.pretended_foresight, false);
  assert.equal(run.gates.merge, false);
  assert.equal(run.live, false);
  const organism = runOrganismCycle({
    workerEvidence: { v: "cognitive-worker.v14" },
    agents: [{ id: "worker", capabilities: ["review"] }],
    fluidity: { state: "FLOWING", property: { silent_stop: false } },
  });
  assert.equal(organism.live, false);
});
