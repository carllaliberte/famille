import test from "node:test";
import assert from "node:assert/strict";
import {
  ADVERSARIAL_ROLES,
  authorityGraph,
  capabilityGraph,
  cognitiveContract,
  composeCognitiveGraph,
  debugFailure,
  decayMemory,
  describeNode,
  describeSynapse,
  discoverUnknownIntelligence,
  explainDecision,
  homeostasisOf,
  plasticSynapse,
  rememberCategorized,
  replayDecision,
  resilientReroute,
  runEcosystemCycle,
  searchArchitectures,
  unknownSpace,
  valueOfInformation,
  whenToAskHuman,
} from "../scripts/cortex-ecosystem.mjs";
import { runOrganismCycle } from "../scripts/cortex-organism.mjs";
import { runCortexRuntime } from "../scripts/cortex-runtime.mjs";

test("human is a cognitive node; merge stays HOLD_HUMAN", () => {
  const human = describeNode({ id: "carl", kind: "human", capabilities: ["judgment", "authority"] });
  assert.equal(human.authority, true);
  assert.equal(human.merge, false);
  assert.equal(human.live, false);
  const ask = whenToAskHuman({ merge: true });
  assert.equal(ask.status, "HOLD_HUMAN");
  assert.match(ask.why, /authority/);
  assert.equal(whenToAskHuman({ risk: "low" }).ask, false);
});

test("capability graph is not the authority graph", () => {
  const nodes = [
    describeNode({ id: "worker", kind: "executor", capabilities: ["review"], presence: "ACTIVE" }),
    describeNode({ id: "carl", kind: "human", capabilities: ["judgment"] }),
  ];
  const caps = capabilityGraph(nodes);
  const auth = authorityGraph(nodes);
  assert.equal(caps.kind, "CAPABILITY");
  assert.equal(auth.kind, "AUTHORITY");
  assert.equal(auth.nodes.find((row) => row.identity === "worker").authority, false);
  assert.equal(auth.nodes.find((row) => row.identity === "carl").merge, "HOLD_HUMAN");
  assert.equal(auth.capability_is_not_authority, true);
});

test("synapse plasticity measures; PROPOSED is not ADOPTED", () => {
  const syn = describeSynapse({ source: "worker", target: "ci", purpose: "execute" });
  assert.equal(syn.status, "PROPOSED");
  const held = plasticSynapse({ synapse: syn.synapse, outcome: { measured: false } });
  assert.equal(held.proposed_is_not_adopted, true);
  const up = plasticSynapse({ synapse: syn.synapse, outcome: { measured: true, success: true } });
  assert.equal(up.action, "strengthen");
  assert.equal(up.synapse.grade, "PROPOSED");
  const down = plasticSynapse({ synapse: syn.synapse, outcome: { measured: true, success: false } });
  assert.equal(down.action, "weaken");
  const expired = plasticSynapse({
    synapse: { ...syn.synapse, valid_until: "2020-01-01T00:00:00.000Z" },
    outcome: { measured: true, success: true },
    now: "2026-09-16T22:00:00.000Z",
  });
  assert.equal(expired.status, "EXPIRED");
});

test("unknown space is not failure; curiosity does not invent LIVE", () => {
  const space = unknownSpace([{ what: null }, { what: "x" }, { what: "y", evidence: {}, verified: true }]);
  assert.equal(space.unknown_is_not_failure, true);
  assert.ok(space.regions.some((row) => row.region === "UNKNOWN"));
  const curiosity = valueOfInformation({ unknown: { region: "UNKNOWN" }, cost: 0, expected_reduction: 1 });
  assert.equal(curiosity.live, false);
  assert.equal(valueOfInformation({ unknown: { region: "UNTESTABLE" } }).hold_human, true);
});

test("assembly is temporary; architecture search does not auto-adopt", () => {
  const graph = composeCognitiveGraph({
    task: "review",
    required: ["review"],
    nodes: [
      { id: "worker", kind: "executor", capabilities: ["review"], presence: "ACTIVE" },
      { id: "reviewer", kind: "verifier", capabilities: ["review"], presence: "CONNECTED" },
      { id: "carl", kind: "human" },
    ],
  });
  assert.equal(graph.assembly.retained, false);
  assert.equal(graph.agreement_is_not_independent_evidence, true);
  assert.ok(ADVERSARIAL_ROLES.includes("CRITIC"));
  const search = searchArchitectures({ graphs: [graph], metrics: { measured: false } });
  assert.equal(search.auto_adopt, false);
  assert.equal(search.adopted, null);
});

test("provider disappearance reroutes instead of stalling", () => {
  const reroute = resilientReroute({
    failedNode: "xai",
    required: ["review"],
    nodes: [
      { id: "xai", capabilities: ["review"], presence: "CONNECTED" },
      { id: "cortex-local", kind: "local", capabilities: ["review"], presence: "ACTIVE" },
    ],
  });
  assert.equal(reroute.continued, true);
  assert.equal(reroute.remaining.includes("xai"), false);
  assert.equal(reroute.live, false);
});

test("unknown intelligence is discovered without modifying Cortex", () => {
  const found = discoverUnknownIntelligence({ id: "tomorrowx", provider: "UNKNOWN", capabilities: ["CAPABILITY_NEW"] });
  assert.equal(found.cortex_modified, false);
  assert.equal(found.channel.status, "DISCOVERED");
  assert.equal(found.invoked.live, false);
  assert.equal(found.live, false);
});

test("replay and debugger reconstruct without minting LIVE", () => {
  const replay = replayDecision({ snapshot: { topology: { version: 1 }, evidence: { v: "cognitive-worker.v14" } } });
  assert.equal(replay.status, "EXECUTED");
  assert.equal(replay.replay.comparable, true);
  const debug = debugFailure({ task: "review", error: "stall", decision: "HOLD_HUMAN" });
  assert.equal(debug.chain.task, "review");
  assert.equal(debug.live, false);
});

test("memory categories decay; cognitive contract stays unauthorizing", () => {
  const mem = rememberCategorized({ kind: "FAILURE", content: "xai 429", valid_until: "2020-01-01T00:00:00.000Z" });
  const decayed = decayMemory([mem.entry], "2026-09-16T22:00:00.000Z");
  assert.equal(decayed.expire.length, 1);
  const contract = cognitiveContract({ task: "review", intelligence: "worker", authority: "carl" });
  assert.equal(contract.auto_merge, false);
  assert.equal(explainDecision({ selected: { identity: "worker" }, policy: "FREE_FIRST" }).opaque, false);
  assert.equal(homeostasisOf({ immune: { findings: [{ kind: "authority_violation" }] } }).state, "HOLD_HUMAN");
});

test("organism cycle carries the ecosystem without LIVE", () => {
  const result = runOrganismCycle({
    workerEvidence: { v: "cognitive-worker.v14" },
    agents: [{ id: "worker", capabilities: ["review"], presence: "DECLARED" }],
    fluidity: { state: "FLOWING", property: { silent_stop: false } },
  });
  assert.equal(result.ecosystem.live, false);
  assert.equal(result.ecosystem.capability_is_not_authority, true);
  assert.equal(result.ecosystem.unknown.unknown_is_not_failure, true);
  assert.ok(result.ecosystem.graph.assembly.roles.human === "carl");
  assert.equal(result.live, false);
});

test("runtime evidence includes ecosystem assembly", () => {
  const result = runCortexRuntime({
    workerEvidence: {
      v: "cognitive-worker.v14",
      verified: true,
      dispatches: [{ number: 631, sha: "abc", state: "VERIFIED" }],
      truth: { ACTION_VERIFIED: true },
    },
    agents: [{ id: "reviewer", capabilities: ["review"], presence: "CONNECTED", specialty: "review" }],
    fluidity: { state: "FLOWING", property: { silent_stop: false, hint_consumed: true } },
    at: "2026-09-16T22:30:00.000Z",
  });
  assert.equal(result.organism.ecosystem.status, "EXECUTED");
  assert.equal(result.organism.ecosystem.resilience.continued, true);
  assert.equal(result.live, false);
  assert.equal(result.auto_merge, false);
});
