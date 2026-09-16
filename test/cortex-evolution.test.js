import test from "node:test";
import assert from "node:assert/strict";
import {
  EVOLUTION_STATES,
  composeCandidate,
  createExperiment,
  decideEvolution,
  executeExperiment,
  falsify,
  hypothesize,
  measureExperiment,
  observeCortex,
  reconfigureTopology,
  rememberExperience,
  rollbackTopology,
  runEvolutionLoop,
} from "../.github/swarm/cortex.mjs";
import { runCortexRuntime } from "../scripts/cortex-runtime.mjs";
import { intelligenceAdapter } from "../sdk/open-intelligence.js";

const flowing = { state: "FLOWING", mode: "PARALLEL_PREP", property: { silent_stop: false, hint_consumed: true } };
const stalled = { state: "STALLED", property: { silent_stop: true, hint_consumed: false } };
const friction = { state: "FRICTION", property: { silent_stop: false, hint_consumed: false } };

function discoveryFixture() {
  return {
    missing: ["build"],
    covered: ["review"],
    discovered: [
      { intelligence: { id: "reviewer", capabilities: ["review"], presence: "CONNECTED" }, callable: true, covered: ["review"] },
      { intelligence: { id: "builder", capabilities: ["build"], presence: "DECLARED" }, callable: false, covered: ["build"] },
    ],
  };
}

test("evolution states stay explicit and ordered", () => {
  assert.deepEqual(EVOLUTION_STATES, [
    "DEFINED", "PROPOSED", "EXECUTED", "MEASURED", "VERIFIED",
    "REJECTED", "INCONCLUSIVE", "REGRESSION", "HOLD_HUMAN", "ADOPTED",
  ]);
});

test("observe uses runtime evidence, not documentation", () => {
  const observation = observeCortex({
    workerEvidence: { verified: true, dispatch_failed: 0 },
    fluidity: flowing,
    discovery: discoveryFixture(),
    composition: { ok: true, capabilities: ["review"], synapse: { synapse_id: "syn_1" } },
    memory: [{ memory_id: "mem_1" }],
  });
  assert.equal(observation.status, "EXECUTED");
  assert.deepEqual(observation.capabilities.missing, ["build"]);
  assert.equal(observation.fluidity.hint_consumed, true);
  assert.equal(observation.live, false);
});

test("hypothesis is PROPOSED and never a capability", () => {
  const observation = observeCortex({ fluidity: stalled, discovery: discoveryFixture(), composition: { ok: false, missing: ["build"] } });
  const hyp = hypothesize(observation);
  assert.equal(hyp.status, "PROPOSED");
  assert.equal(hyp.hypothesis.is_capability, false);
  assert.equal(hyp.hypothesis.kind, "reduce_stall");
});

test("composition stays DEFINED and inactive until adopted", () => {
  const hyp = hypothesize({}, { kind: "compose_synapse", statement: "compose review+build" });
  const composed = composeCandidate(hyp.hypothesis, observeCortex({ discovery: discoveryFixture(), composition: { ok: false } }));
  assert.equal(composed.status, "DEFINED");
  assert.equal(composed.active, false);
  assert.equal(composed.composition.required_authority, "carl");
  assert.equal(composed.composition.live, false);
});

test("experiment is PROPOSED then EXECUTED only with a real path", () => {
  const hyp = hypothesize({}, { statement: "try independent verifier" });
  const composed = composeCandidate(hyp.hypothesis, {});
  const exp = createExperiment(composed.composition, hyp.hypothesis);
  assert.equal(exp.status, "PROPOSED");
  const executed = executeExperiment(exp.experiment, { channelPresent: true, capabilityAvailable: true, used_capabilities: ["review"] });
  assert.equal(executed.status, "EXECUTED");
  assert.equal(executed.executed, true);
});

test("channel absent, capability absent, authority and failure stay explicit", () => {
  const exp = { experiment_id: "e1", inputs: [] };
  assert.equal(executeExperiment(exp, { channelPresent: false }).status, "CHANNEL_NOT_PRESENT");
  assert.equal(executeExperiment(exp, { capabilityAvailable: false }).status, "CAPABILITY_NOT_AVAILABLE");
  assert.equal(executeExperiment(exp, { authority: "merge" }).status, "HOLD_HUMAN");
  assert.equal(executeExperiment(exp, { fail: true }).status, "EXECUTION_FAILED");
});

test("measurement includes fluidity and does not invent missing metrics", () => {
  const measured = measureExperiment(
    { experiment_id: "e1" },
    { status: "EXECUTED", executed: true },
    flowing,
    friction,
  );
  assert.equal(measured.status, "MEASURED");
  assert.equal(measured.fluidity.comparable, true);
  assert.equal(measured.fluidity.worsened, true);
  assert.equal(measured.hint_consumed, false);
});

test("falsification: success, failure, regression, inconclusive, hold", () => {
  const ok = measureExperiment({ experiment_id: "e" }, { status: "EXECUTED", executed: true }, flowing, flowing);
  assert.equal(falsify({}, ok).verdict, "VERIFIED_SUCCESS");
  const fail = measureExperiment({ experiment_id: "e" }, { status: "EXECUTION_FAILED", executed: false, errors: ["x"] }, flowing, flowing);
  assert.equal(falsify({}, fail).verdict, "VERIFIED_FAILURE");
  const worse = measureExperiment({ experiment_id: "e" }, { status: "EXECUTED", executed: true }, flowing, stalled);
  assert.equal(falsify({}, worse, { treat_fluidity_regression: true }).verdict, "REGRESSION");
  assert.equal(falsify({}, worse).verdict, "INCONCLUSIVE");
  assert.equal(falsify({}, ok, { contradiction: true }).verdict, "INCONCLUSIVE");
  assert.equal(falsify({}, ok, { hold: true }).verdict, "HOLD_HUMAN");
});

test("adopt only on verified success; otherwise reject or hold; never merge", () => {
  const adopt = decideEvolution({ verdict: "VERIFIED_SUCCESS", reason: "ok" }, { experiment_id: "e", version: 1 });
  assert.equal(adopt.decision, "ADOPT");
  assert.equal(adopt.merge, false);
  assert.equal(adopt.auto_merge, false);
  assert.equal(adopt.rollback.reversible, true);
  assert.equal(decideEvolution({ verdict: "VERIFIED_FAILURE" }, {}).decision, "REJECT");
  assert.equal(decideEvolution({ verdict: "HOLD_HUMAN" }, {}).decision, "HOLD_HUMAN");
});

test("rejected experiments become a memory constraint", () => {
  const remembered = rememberExperience({
    hypothesis: { hypothesis_id: "h1", statement: "compose dead path", kind: "compose_synapse" },
    experiment: { experiment_id: "e1", version: 1 },
    decision: { decision: "REJECT" },
    verification: { verdict: "VERIFIED_FAILURE" },
  });
  assert.equal(remembered.entry.constraint, true);
  assert.match(remembered.entry.statement, /rejected/);
});

test("reconfiguration is versioned, reversible, and rollback restores previous", () => {
  const decision = decideEvolution({ verdict: "VERIFIED_SUCCESS", reason: "ok" }, { version: 1 });
  const adopted = reconfigureTopology(decision, { version: 3, paths: ["a"], synapses: [] }, { paths: ["b"], synapse: "syn_new" });
  assert.equal(adopted.ok, true);
  assert.equal(adopted.topology.version, 4);
  assert.equal(adopted.topology.reversible, true);
  const rolled = rollbackTopology(adopted.topology, adopted.previous);
  assert.equal(rolled.topology.version, 3);
  assert.equal(rolled.topology.rolled_back_from, 4);
  const rejected = reconfigureTopology({ decision: "REJECT", status: "REJECTED" }, { version: 1, paths: [], synapses: [] });
  assert.equal(rejected.ok, false);
});

test("unread hint is friction; silent skip is stalled; both block improvement", () => {
  const observation = observeCortex({ fluidity: friction, discovery: { discovered: [] }, composition: { ok: true, synapse: {} } });
  assert.equal(observation.fluidity.friction, true);
  const stall = observeCortex({ fluidity: stalled, discovery: { discovered: [] }, composition: { ok: true, synapse: {} } });
  assert.equal(stall.fluidity.stalled, true);
  const hyp = hypothesize(observation);
  assert.equal(hyp.hypothesis.kind, "consume_hint");
});

test("collective provenance is kept per intelligence; adapter stays CHANNEL_NOT_PRESENT", () => {
  const adapter = intelligenceAdapter({ id: "future-z", provider: "not-in-inventory" });
  const invoked = adapter.invoke({ capability: "review" });
  assert.equal(invoked.reason, "CHANNEL_NOT_PRESENT");
  const loop = runEvolutionLoop({
    discovery: discoveryFixture(),
    composition: { ok: true, capabilities: ["review"], selected: ["reviewer"], synapse: { synapse_id: "s1" } },
    fluidity: flowing,
    workerEvidence: { verified: true },
    runtime: {
      channelPresent: true,
      capabilityAvailable: true,
      used_capabilities: ["review"],
      contributions: [
        { intelligence: "reviewer", role: "execute", live: false },
        { intelligence: "future-z", role: "propose", live: false },
      ],
    },
  });
  assert.equal(loop.execution.contributions.length, 2);
  assert.ok(loop.execution.contributions.every((row) => row.live === false));
  assert.equal(loop.hypothesis.hypothesis.is_capability, false);
  assert.equal(loop.live, false);
  assert.equal(loop.auto_merge, false);
  assert.equal(loop.operational, false);
});

test("runtime bridge runs evolution from real worker evidence without claiming LIVE", () => {
  const result = runCortexRuntime({
    workerEvidence: {
      v: "cognitive-worker.v14",
      discovered: 3,
      routed: 2,
      verified: true,
      dispatches: [{ number: 609, sha: "abc", state: "VERIFIED" }],
      truth: { ACTION_VERIFIED: true },
    },
    agents: [{ id: "reviewer", capabilities: ["review"], presence: "CONNECTED", specialty: "review" }],
    fluidity: flowing,
    at: "2026-09-16T21:00:00.000Z",
  });
  assert.equal(result.session.state, "DONE");
  assert.equal(result.evolution.observation.status, "EXECUTED");
  assert.equal(result.evolution.hypothesis.status, "PROPOSED");
  assert.equal(result.evolution.execution.status, "EXECUTED");
  assert.equal(result.evolution.measurement.status, "MEASURED");
  assert.ok(["VERIFIED_SUCCESS", "INCONCLUSIVE", "REGRESSION"].includes(result.evolution.verification.verdict));
  assert.ok(["ADOPT", "REJECT", "HOLD_HUMAN"].includes(result.evolution.decision.decision));
  assert.equal(result.live, false);
  assert.equal(result.evolution.live, false);
  assert.equal(result.evolution.decision.merge, false);
});
