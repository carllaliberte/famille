import test from "node:test";
import assert from "node:assert/strict";
import {
  consensusOf,
  describeEntity,
  detectChange,
  digitalTwin,
  distinguishStates,
  impactOfFailure,
  relate,
  runWorldModel,
  slotObservation,
  stateAt,
  worldImmune,
} from "../scripts/cortex-world.mjs";
import { runOrganismCycle } from "../scripts/cortex-organism.mjs";

test("observed is not inferred and predicted is not fact", () => {
  const o = slotObservation({ kind: "OBSERVED", fact: { up: true } });
  const i = slotObservation({ kind: "INFERRED", fact: { up: true } });
  const p = slotObservation({ kind: "PREDICTED", fact: { up: true } });
  assert.equal(o.kind, "OBSERVED");
  assert.equal(i.kind, "INFERRED");
  assert.equal(p.kind, "PREDICTED");
  assert.equal(o.promoted, false);
});

test("state_at distinguishes what Acorn knew from what was true", () => {
  const e = describeEntity({ id: "service-x", type: "Service" });
  const past = stateAt({
    entity: e,
    timeline: [{ at: "2026-09-16T22:00:00.000Z", state: "UNKNOWN" }],
    at: "2026-09-16T22:00:00.000Z",
  });
  assert.equal(past.known_then, true);
  assert.equal(past.true_then, null);
});

test("dependency failure reports what breaks without inventing a replacement", () => {
  const rel = relate({ from: "worker", to: "github-actions", kind: "DEPENDS_ON" });
  const impact = impactOfFailure({ lost: "github-actions", graph: [rel.relation] });
  assert.deepEqual(impact.breaks, ["worker"]);
  assert.equal(impact.replacement, null);
});

test("digital twin is not the live system; model is not the world", () => {
  const twin = digitalTwin({});
  assert.equal(twin.is_live_system, false);
  const states = distinguishStates({ reality: { x: 1 }, observed: { x: 1 }, model: { x: 0 }, predicted: { x: 1 } });
  assert.equal(states.model_is_not_world, true);
  assert.equal(states.diverged, true);
});

test("three observations are not three independent proofs", () => {
  const c = consensusOf([
    { what: "up", kind: "observation", channel: "a", context: "s" },
    { what: "down", kind: "observation", channel: "b", context: "s" },
  ]);
  assert.equal(c.three_models_are_not_three_proofs, true);
  assert.equal(c.truth, false);
});

test("change detection asks for revalidation; immune quarantines fake presence", () => {
  const ch = detectChange({ before: { v: 1 }, after: { v: 2 } });
  assert.equal(ch.revalidate, true);
  const imm = worldImmune({ live_claim: true });
  assert.equal(imm.quarantined, true);
});

test("world model does not invent LIVE and stays one Cortex", () => {
  const world = runWorldModel({
    workerEvidence: { v: "cognitive-worker.v14" },
    skipEternal: true,
  });
  assert.equal(world.model_is_not_world, true);
  assert.equal(world.gates.inferred_is_observed, false);
  assert.equal(world.gates.twin_is_live, false);
  assert.equal(world.gates.counterfactual_is_observation, false);
  assert.equal(world.gates.merge, false);
  assert.equal(world.gates.second_cortex, false);
  assert.equal(world.live, false);
  const organism = runOrganismCycle({
    workerEvidence: { v: "cognitive-worker.v14" },
    agents: [{ id: "worker", capabilities: ["review"] }],
    fluidity: { state: "FLOWING", property: { silent_stop: false } },
  });
  assert.equal(organism.live, false);
});
