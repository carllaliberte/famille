import test from "node:test";
import assert from "node:assert/strict";
import {
  EVOLUTION_GOVERNOR_VERSION,
  assertGovernorInvariant,
  evaluatePortfolio,
  governorConstitution,
  governorNextExperiment,
  recordGovernorOutcome,
  runEvolutionGovernor,
  selectGovernorMode,
} from "../scripts/cortex-evolution-governor.mjs";

const base = {
  id: "base",
  objective: "reduce prediction error",
  hypothesis: "add an independent verifier",
  expected_information_gain: 0.9,
  expected_benefit: 0.8,
  uncertainty: 0.8,
  novelty: 0.7,
  diversity: 0.9,
  correlation: 0.1,
  risk: "low",
  blast_radius: 0.1,
  control_gap: 0,
  cost: 0.1,
  reversibility: "reversible",
  channel_present: true,
  capability_available: true,
  strategy: "independent-verifier",
};

test("constitution is above the governor and cannot be self-modified", () => {
  const constitution = governorConstitution();
  assert.deepEqual(constitution.hierarchy[0], "CONSTITUTION");
  assert.equal(constitution.governor_is_not_authority, true);
  assert.equal(constitution.governor_cannot_modify_constitution, true);
  assert.equal(constitution.governor_cannot_change_breaker, true);
  assert.equal(constitution.governor_cannot_merge, true);
  assert.equal(constitution.governor_cannot_write, true);
  assert.equal(constitution.governor_cannot_mint_live, true);
});

test("mode explores when uncertainty and failure pressure are high", () => {
  assert.equal(
    selectGovernorMode({
      candidates: [base],
      recent: [{ verdict: "REGRESSION" }, { verdict: "REJECTED" }],
    }),
    "EXPLORE",
  );
});

test("mode exploits measured successful portfolio when uncertainty is low", () => {
  assert.equal(
    selectGovernorMode({
      candidates: [{ ...base, uncertainty: 0.2, expected_information_gain: 0.2 }],
      recent: [{ verdict: "VERIFIED_SUCCESS" }, { verdict: "ADOPTED" }],
    }),
    "EXPLOIT",
  );
});

test("unsafe authority and constitutional candidates are quarantined", () => {
  const result = evaluatePortfolio({
    candidates: [
      base,
      { ...base, id: "constitution-change", constitutional_change: true },
      { ...base, id: "breaker-change", breaker_change: true },
      { ...base, id: "merge", merge: true },
      { ...base, id: "hidden", unobserved_capability_path: true },
    ],
  });
  const blocked = new Map(result.queue.map((row) => [row.candidate.id, row]));
  assert.equal(blocked.get("constitution-change").eligible, false);
  assert.equal(blocked.get("breaker-change").eligible, false);
  assert.equal(blocked.get("merge").eligible, false);
  assert.equal(blocked.get("hidden").eligible, false);
  assert.ok(result.queue.find((row) => row.candidate.id === base.id).eligible);
});

test("control gap and irreversible blast radius block an experiment", () => {
  const result = evaluatePortfolio({
    candidates: [
      { ...base, id: "control-gap", control_gap: 0.9 },
      { ...base, id: "irreversible", reversibility: "irreversible", blast_radius: 0.8 },
    ],
  });
  assert.ok(result.queue.every((row) => row.eligible === false));
});

test("governor selects a bounded next experiment and never adopts it", () => {
  const result = governorNextExperiment({
    candidates: [
      { ...base, id: "a", strategy: "verifier" },
      { ...base, id: "b", expected_information_gain: 0.2, strategy: "routing" },
    ],
    max_concurrent: 1,
    risk_budget: 0.8,
    cognitive_budget: 1,
    cost_budget: 1,
  });
  assert.equal(result.status, "EXECUTED");
  assert.equal(result.next.experiment_id, "a");
  assert.equal(result.next.rollback_required, true);
  assert.equal(result.next.checkpoint_required, true);
  assert.equal(result.auto_merge, false);
  assert.equal(result.live, false);
});

test("cool-down stops evolutionary pressure without changing Breaker authority", () => {
  const result = governorNextExperiment({
    candidates: [base],
    pressure: { overloaded: true, concurrent: 8, max_concurrent: 1 },
  });
  assert.equal(result.mode, "COOL_DOWN");
  assert.equal(result.decision.decision, "PAUSE");
  assert.equal(result.next, undefined);
  assert.equal(result.constitution.governor_cannot_change_breaker, true);
});

test("no eligible experiment produces a human gate instead of silent fallback", () => {
  const result = governorNextExperiment({
    candidates: [{ ...base, authority_required: true }],
  });
  assert.equal(result.mode, "HUMAN_GATE");
  assert.equal(result.decision.state, "HOLD_HUMAN");
  assert.equal(result.decision.selected, null);
  assert.equal(result.live, false);
});

test("budget allocation prevents concurrent risk/cognitive overspend", () => {
  const result = evaluatePortfolio({
    candidates: [
      { ...base, id: "a", risk: 0.7, cost: 0.7 },
      { ...base, id: "b", risk: 0.7, cost: 0.7 },
      { ...base, id: "c", risk: 0.1, cost: 0.1 },
    ],
    max_concurrent: 3,
    risk_budget: 0.8,
    cognitive_budget: 1,
    cost_budget: 1,
  });
  assert.ok(result.allocation.selected.length <= 2);
  assert.ok(result.allocation.budget.risk_used <= 0.8);
  assert.ok(result.allocation.budget.cognitive_used <= 1);
});

test("outcomes update learning state without rewriting history", () => {
  const result = recordGovernorOutcome({ ...base, id: "x", success_rate: 0.5 }, { verdict: "VERIFIED_FAILURE" });
  assert.equal(result.status, "MEASURED");
  assert.equal(result.learning.failure_count, 1);
  assert.equal(result.learning.failure_is_data, true);
  assert.equal(result.history_rewritten, false);
});

test("regression can quarantine a high-blast candidate", () => {
  const result = recordGovernorOutcome({ ...base, id: "x", blast_radius: 0.8 }, { verdict: "REGRESSION" });
  assert.equal(result.learning.quarantine, true);
});

test("governor invariants are verified and stable", () => {
  const result = runEvolutionGovernor({ candidates: [base] });
  assert.equal(result.version, EVOLUTION_GOVERNOR_VERSION);
  assert.equal(result.verified, true);
  assert.equal(assertGovernorInvariant(result).status, "VERIFIED");
  assert.equal(result.authority, "carl");
  assert.equal(result.auto_merge, false);
  assert.equal(result.live, false);
});
