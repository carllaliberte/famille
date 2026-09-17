import test from "node:test";
import assert from "node:assert/strict";
import {
  frontierItem,
  informationValue,
  rankFrontier,
  proposeExperiment,
  consolidate,
  revalidationPlan,
  assertLearningOrchestratorInvariant,
} from "../scripts/acorn-learning-orchestrator.mjs";

test("unknown is represented explicitly", () => {
  const x = frontierItem({ subject: "future capability", uncertainty: .95, observability: 0 });
  assert.equal(x.state, "UNKNOWN");
  assert.equal(x.live, false);
});

test("information value favors measurable high-impact uncertainty", () => {
  const a = informationValue({ uncertainty: .9, impact: .9, observability: .9, reversibility: .9 });
  const b = informationValue({ uncertainty: .2, impact: .2, observability: .2, reversibility: .2 });
  assert.ok(a > b);
});

test("blocked work waits for human authority", () => {
  const x = proposeExperiment({ id: "x", subject: "protected action", state: "BLOCKED" });
  assert.equal(x.state, "WAITING_ON_HUMAN");
});

test("unobservable unknown generates observability work", () => {
  const x = proposeExperiment({ id: "x", subject: "unknown", uncertainty: .9, observability: 0 });
  assert.equal(x.state, "DISCOVER_OBSERVABILITY");
});

test("frontier ranking is deterministic", () => {
  const a = rankFrontier([{ id: "b", uncertainty: .8, impact: .8, observability: .8 },
    { id: "a", uncertainty: .8, impact: .8, observability: .8 }]);
  assert.deepEqual(a.map(x => x.id), ["a", "b"]);
});

test("stale knowledge is revalidated rather than silently treated as true", () => {
  const rows = revalidationPlan([{ id: "x", age: .95, state: "KNOWN" }]);
  assert.equal(rows[0].action, "REVALIDATE");
  assert.ok(rows[0].uncertainty_after > 0);
});

test("consolidation creates a continuous next-work decision", () => {
  const result = consolidate({
    observations: [{ subject: "x", confidence: .5 }],
    frontier: [{ id: "u", subject: "unknown", uncertainty: .9, impact: .9, observability: .8, reversibility: .9 }],
  });
  assert.equal(result.continue, true);
  assert.ok(result.next);
  assertLearningOrchestratorInvariant(result);
});
