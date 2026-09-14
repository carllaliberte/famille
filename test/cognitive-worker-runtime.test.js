import test from "node:test";
import assert from "node:assert/strict";
import { composePlan, parseFronts, buildEvidence } from "../scripts/cognitive-worker.mjs";

test("worker deduplicates fronts by exact head SHA and stays bounded", () => {
  const fronts = parseFronts([
    "456\tabc123\ttrue\t2026-09-14T20:00:00Z",
    "455\tabc123\tfalse\t2026-09-14T20:01:00Z",
    "454\tdef456\tfalse\t2026-09-14T20:02:00Z",
  ].join("\n"), 20);
  assert.deepEqual(fronts.map((x) => x.number), [456, 454]);
});

test("worker composes all internal stages without granting authority", () => {
  const plan = composePlan([{ number: 456, sha: "abc123", draft: true, updatedAt: null }]);
  assert.equal(plan.authority, "carl");
  assert.equal(plan.auto_merge, false);
  assert.equal(plan.live, false);
  assert.deepEqual(plan.fronts[0].stages, ["review", "collaboration", "measurement", "correction"]);
});

test("worker evidence distinguishes execution from verification and live state", () => {
  const evidence = buildEvidence({ cycle_id: "test" }, composePlan([]), [
    { number: 456, sha: "abc123", state: "DISPATCHED" },
    { number: 455, sha: "def456", state: "DISPATCH_FAILED", error: "test" },
  ]);
  assert.equal(evidence.executed, true);
  assert.equal(evidence.verified, false);
  assert.equal(evidence.live, false);
  assert.equal(evidence.auto_merge, false);
  assert.equal(evidence.human_decision, "PENDING_HUMAN");
  assert.equal(evidence.dispatched, 1);
  assert.equal(evidence.dispatch_failed, 1);
});
