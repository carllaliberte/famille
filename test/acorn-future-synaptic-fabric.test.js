import test from "node:test";
import assert from "node:assert/strict";
import {
  FUTURE_SYNAPTIC_FABRIC_VERSION,
  createSynapse,
  recordSynapticOutcome,
  synapticScore,
  rankSynapses,
  measureSynapticHealth,
  plasticityProposal,
  applyPlasticity,
  discoverCandidateSynapses,
  optimizeTopology,
  resilienceAnalysis,
  synapticMemory,
  runFutureSynapticFabricCycle,
  assertFutureSynapticInvariant,
} from "../scripts/acorn-future-synaptic-fabric.mjs";

test("creates contextual synapses with zero authority", () => {
  const s = createSynapse({ from: "a", to: "b", context: "planning", capability: "planning" });
  assert.equal(s.state, "PROPOSED");
  assert.equal(s.authority_granted, false);
  assert.equal(s.live, false);
  assert.match(s.id, /^syn-/);
});

test("measured outcomes make useful synapses stronger", () => {
  let s = createSynapse({ from: "a", to: "b", trust: .2, weight: .2 });
  s = recordSynapticOutcome(s, { success: true, information_gain: .9, observability: 1, control: 1, reversibility: 1 });
  s = recordSynapticOutcome(s, { success: true, information_gain: .9, observability: 1, control: 1, reversibility: 1 });
  assert.equal(s.successes, 2);
  assert.ok(s.trust > .2);
  assert.equal(s.state, "ACTIVE");
  assert.equal(s.authority_granted, false);
});

test("ranking is contextual rather than global", () => {
  const planning = createSynapse({ from: "a", to: "planner", context: "planning", capability: "planning", weight: .8, trust: .8 });
  const coding = createSynapse({ from: "b", to: "coder", context: "coding", capability: "coding", weight: .8, trust: .8 });
  const ranked = rankSynapses([planning, coding], { capability: "planning" });
  assert.equal(ranked[0].id, planning.id);
  assert.ok(synapticScore(planning, { capability: "planning" }) >= synapticScore(coding, { capability: "planning" }));
});

test("plasticity weakens and isolates without granting authority", () => {
  const s = createSynapse({ from: "a", to: "b", weight: .8, trust: .8 });
  const proposal = plasticityProposal(s, "WEAKEN", "measured degradation");
  const next = applyPlasticity(s, proposal);
  assert.equal(next.weight, .7);
  assert.equal(next.authority_granted, false);
  assert.equal(next.live, false);
});

test("high control gap blocks strengthening and converts it to isolation", () => {
  const s = createSynapse({ from: "a", to: "b", weight: .2, trust: .2, observability: 0, control: 0, reversibility: 0 });
  const proposal = plasticityProposal(s, "STRENGTHEN", "new capability");
  assert.equal(proposal.action, "ISOLATE");
  assert.equal(proposal.grants_authority, false);
});

test("candidate discovery finds new connections without changing authority", () => {
  const candidates = discoverCandidateSynapses({
    nodes: [{ id: "a" }, { id: "b" }, { id: "c" }],
    existing: [createSynapse({ from: "a", to: "b", context: "planning" })],
    contexts: ["planning"],
  });
  assert.ok(candidates.length > 0);
  assert.ok(candidates.every((s) => s.state === "PROPOSED" && s.authority_granted === false));
});

test("topology optimization and resilience expose concentration instead of hiding it", () => {
  const synapses = [
    createSynapse({ from: "a", to: "b", weight: .9, trust: .9, informationGain: .9 }),
    createSynapse({ from: "b", to: "c", weight: .8, trust: .8, informationGain: .8 }),
    createSynapse({ from: "c", to: "d", weight: .7, trust: .7, informationGain: .7 }),
  ];
  const topology = optimizeTopology({ nodes: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }], synapses, context: {}, maxEdges: 2 });
  const resilience = resilienceAnalysis({ nodes: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }], synapses: topology.synapses });
  assert.equal(topology.selected.length, 2);
  assert.ok(Array.isArray(resilience.isolated));
  assert.equal(resilience.live, false);
});

test("memory preserves measured synaptic history", () => {
  let s = createSynapse({ from: "a", to: "b" });
  s = recordSynapticOutcome(s, { success: true, information_gain: .5 });
  const memory = synapticMemory([s]);
  assert.equal(memory.length, 1);
  assert.equal(memory[0].attempts, 1);
  assert.equal(memory[0].successes, 1);
  assert.equal(memory[0].authority_granted, false);
});

test("full future synaptic cycle is verified and constitutional", () => {
  const nodes = [{ id: "cortex" }, { id: "memory" }, { id: "strategy" }, { id: "experiment" }];
  const synapses = [
    createSynapse({ from: "cortex", to: "strategy", context: "planning", capability: "planning" }),
    createSynapse({ from: "strategy", to: "experiment", context: "planning", capability: "experiment" }),
  ];
  const result = runFutureSynapticFabricCycle({
    nodes, synapses,
    outcomes: synapses.map((s) => ({ synapse_id: s.id, success: true, information_gain: .8, observability: 1, control: 1, reversibility: 1 })),
    context: { capability: "planning", max_edges: 4 }, candidateContexts: ["planning", "learning"],
  });
  assert.equal(result.version, FUTURE_SYNAPTIC_FABRIC_VERSION);
  assert.ok(["VERIFIED", "DEGRADED"].includes(result.status));
  assert.equal(result.authority_granted, false);
  assert.equal(result.breaker_bypass, false);
  assert.equal(result.auto_merge, false);
  assert.equal(result.live, false);
  assert.equal(assertFutureSynapticInvariant(result).status, "VERIFIED");
});
