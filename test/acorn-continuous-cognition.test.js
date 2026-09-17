import test from "node:test";
import assert from "node:assert/strict";
import {
  CONTINUOUS_COGNITION_VERSION,
  COGNITIVE_PHASES,
  createCognitiveTask,
  runContinuousCognitionCycle,
  assertContinuousCognitionInvariant,
  retainLearning,
} from "../scripts/acorn-continuous-cognition.mjs";

test("continuous cognition is one Cortex inside Acorn", () => {
  const result = runContinuousCognitionCycle({
    task: { id: "t1", objective: "measure", required_capabilities: ["reasoning"] },
    resources: [{ id: "r1", provider: "future-provider", capabilities: ["reasoning"], presence: "CONNECTED" }],
    expected: 10,
    observed: 12,
    evidence: { executed: true, verified: true },
  });
  assert.equal(result.version, CONTINUOUS_COGNITION_VERSION);
  assert.deepEqual(result.phases.map((phase) => phase.phase), COGNITIVE_PHASES);
  assert.equal(result.cortex.constitution.one_cortex, true);
  assert.equal(result.cortex.constitution.cortex_belongs_to_acorn, true);
  assert.equal(result.authority_granted, false);
  assert.equal(result.breaker_bypass, false);
  assert.equal(result.auto_merge, false);
  assert.equal(result.live, false);
  assert.equal(assertContinuousCognitionInvariant(result).status, "VERIFIED");
});

test("prediction stays distinct from observation and produces a bounded learning signal", () => {
  const result = runContinuousCognitionCycle({
    task: { id: "t2", required_capabilities: ["reasoning"] },
    resources: [{ id: "r1", capabilities: ["reasoning"] }],
    expected: 10,
    observed: 7,
    evidence: { executed: true, verified: true },
  });
  assert.equal(result.phases.find((phase) => phase.phase === "PREDICT").prediction_present, true);
  assert.equal(result.phases.find((phase) => phase.phase === "OBSERVE").observed_present, true);
  assert.equal(result.learning.status, "RETAINED");
  assert.equal(result.learning.authority_changed, false);
  assert.equal(result.cortex.learning_signal.bounded, true);
});

test("falsification forces replanning rather than false verification", () => {
  const result = runContinuousCognitionCycle({
    task: { id: "t3", required_capabilities: ["reasoning"] },
    resources: [{ id: "r1", capabilities: ["reasoning"] }],
    expected: 10,
    observed: 2,
    contradiction: true,
    evidence: { executed: true, verified: true },
  });
  assert.equal(result.status, "EXECUTED");
  assert.equal(result.cortex.falsification.refuted, true);
  assert.equal(result.learning.status, "NOT_RETAINED");
  assert.equal(result.cortex.adaptation.action, "REPLAN");
});

test("unverified evidence cannot enter retained learning", () => {
  const result = retainLearning({
    task: { id: "t4" },
    cycle: { graph: { nodes: [] } },
    measurement: { status: "MEASURED" },
    verified: false,
  });
  assert.equal(result.status, "NOT_RETAINED");
  assert.equal(result.authority_changed, false);
});

test("task identity is mandatory", () => {
  assert.throws(() => createCognitiveTask({}), /COGNITIVE_TASK_ID_REQUIRED/);
});

test("continuity token chains cycles without granting authority", () => {
  const first = runContinuousCognitionCycle({
    task: { id: "chain", required_capabilities: [] },
    cycle: 1,
    evidence: { executed: true, verified: true },
  });
  const second = runContinuousCognitionCycle({
    task: { id: "chain", required_capabilities: [] },
    cycle: 2,
    previous: first,
    evidence: { executed: true, verified: true },
  });
  assert.notEqual(first.continuity_token, second.continuity_token);
  assert.equal(second.next_cycle, 3);
  assert.equal(second.authority_granted, false);
});
