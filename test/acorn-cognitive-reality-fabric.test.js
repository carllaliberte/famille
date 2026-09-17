import test from "node:test";
import assert from "node:assert/strict";
import {
  REALITY_FABRIC_VERSION,
  OBSERVABILITY,
  CONTROL,
  REVERSIBILITY,
  createFabric,
  registerNode,
  recordEdge,
  addObservation,
  detectContradictions,
  cognitiveGraph,
  dependencyDepth,
  blastRadius,
  controlGap,
  informationGain,
  riskAdjustedInformationGain,
  snapshotFabric,
  mergeFabricSnapshots,
  nodeHealth,
  federationHealth,
  realityCycle,
  assertRealityFabricInvariant,
} from "../scripts/acorn-cognitive-reality-fabric.mjs";

test("reality fabric exposes explicit epistemic/control dimensions", () => {
  assert.equal(REALITY_FABRIC_VERSION, "acorn.cognitive-reality-fabric.v1");
  assert.deepEqual(OBSERVABILITY, ["NONE", "PARTIAL", "INDIRECT", "DIRECT", "VERIFIED"]);
  assert.deepEqual(CONTROL, ["NONE", "LIMITED", "CONDITIONAL", "DIRECT", "VERIFIED"]);
  assert.deepEqual(REVERSIBILITY, ["REVERSIBLE", "PARTIAL", "IRREVERSIBLE", "UNKNOWN"]);
});

test("fabric nodes never acquire authority from capability or presence", () => {
  const fabric = createFabric({ nodeId: "n1", shard: "r1" });
  const node = registerNode(fabric, { id: "ai-a", kind: "ai", capabilities: ["reason"] });
  assert.deepEqual(node.capabilities, ["reason"]);
  assert.equal(node.authority, false);
  assert.equal(fabric.nodes.get("ai-a").authority, false);
});

test("observations remain dated claims and contradictory evidence is preserved", () => {
  const fabric = createFabric({ nodeId: "n1" });
  addObservation(fabric, { id: "o1", subject: "ai-a", observer: "n1", capability: ["tool"], observability: "DIRECT", epistemic_state: "OBSERVED", evidence: { executed: true }, timestamp: "2026-09-17T00:00:00Z" });
  addObservation(fabric, { id: "o2", subject: "ai-a", observer: "n2", capability: ["tool"], observability: "NONE", epistemic_state: "UNKNOWN", evidence: null, timestamp: "2026-09-17T00:01:00Z" });
  const contradictions = detectContradictions([...fabric.observations.values()]);
  assert.equal(contradictions.length, 1);
  assert.deepEqual(contradictions[0].observations.sort(), ["o1", "o2"]);
});

test("dependency graph computes bounded transitive reach and blast radius", () => {
  const graph = cognitiveGraph({
    nodes: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
    edges: [
      { from: "a", to: "b", kind: "depends" },
      { from: "b", to: "c", kind: "tool" },
      { from: "c", to: "d", kind: "effect" },
    ],
  });
  const depth = dependencyDepth(graph, "a");
  assert.equal(depth.depth, 3);
  assert.deepEqual(depth.reachable, ["a", "b", "c", "d"]);
  const blast = blastRadius({ graph, start: "a" });
  assert.equal(blast.size, 4);
  assert.equal(blast.level, "SYNAPSE");
});

test("unknown observability/control and unknown reversibility produce non-zero control gap", () => {
  const gap = controlGap({ capability: 1, observability: "NONE", control: "NONE", reversibility: "UNKNOWN", blast: 1, uncertainty: 1 });
  assert.equal(gap.unknown_is_not_permitted, true);
  assert.equal(gap.status, "HIGH");
  assert.ok(gap.value > 0.7);
});

test("information gain is measured without rewriting prior observations", () => {
  const before = [{ id: "a", subject: "x", epistemic_state: "UNKNOWN" }];
  const after = [{ id: "a", subject: "x", epistemic_state: "VERIFIED", evidence: { ok: true } }];
  const gain = informationGain({ before, after });
  assert.equal(gain.reduced_unknowns, 1);
  assert.ok(gain.value > 0);
  assert.equal(before[0].epistemic_state, "UNKNOWN");
});

test("risk-adjusted information gain penalizes risk, cost, control gap and blast radius", () => {
  const low = riskAdjustedInformationGain({ information: 1, risk: 0, cost: 0, controlGapValue: 0, blastRadiusValue: 0 });
  const high = riskAdjustedInformationGain({ information: 1, risk: 1, cost: 1, controlGapValue: 1, blastRadiusValue: 1 });
  assert.equal(low.score, 1);
  assert.ok(high.score < low.score);
});

test("snapshots merge without granting authority or writing main", () => {
  const a = createFabric({ nodeId: "a", shard: "r1" });
  const b = createFabric({ nodeId: "b", shard: "r2" });
  registerNode(a, { id: "a", kind: "observer", capabilities: ["observe"] });
  registerNode(b, { id: "b", kind: "observer", capabilities: ["observe"] });
  recordEdge(a, { from: "a", to: "b", kind: "observes" });
  addObservation(a, { id: "oa", subject: "x", observer: "a", epistemic_state: "OBSERVED", observability: "DIRECT" });
  addObservation(b, { id: "ob", subject: "x", observer: "b", epistemic_state: "UNKNOWN", observability: "NONE" });
  const merged = mergeFabricSnapshots({ local: snapshotFabric(a), remote: snapshotFabric(b) });
  assert.equal(merged.merge_is_not_authority, true);
  assert.equal(merged.remote_does_not_write_main, true);
  assert.equal(merged.observations.length, 2);
});

test("node health distinguishes stale nodes from healthy evidence producers", () => {
  assert.equal(nodeHealth({ status: "ACTIVE", lastSeenMs: 10, maxStalenessMs: 100, observationCount: 4 }).status, "ACTIVE");
  assert.equal(nodeHealth({ status: "ACTIVE", lastSeenMs: 1000, maxStalenessMs: 100, observationCount: 4 }).status, "DEGRADED");
});

test("federation health never turns missing quorum into success", () => {
  const healthy = [{ counts: { nodes: 1 }, failed: false, live: false }];
  assert.equal(federationHealth({ snapshots: healthy, quorum: 2 }).quorum_reached, false);
  assert.equal(federationHealth({ snapshots: healthy, quorum: 2 }).no_quorum_is_not_success, true);
});

test("reality cycle produces evidence, graph, gap and governor-compatible information gain", () => {
  const fabric = createFabric({ nodeId: "n1", shard: "r1" });
  registerNode(fabric, { id: "n1", kind: "observer", observability: "DIRECT", control: "LIMITED" });
  const cycle = realityCycle({
    fabric,
    observations: [{ id: "o1", subject: "ai-a", observer: "n1", epistemic_state: "MEASURED", observability: "DIRECT", capability: ["reason"] }],
    before: { observations: [] },
    risk: 0.1,
    cost: 0.1,
  });
  assert.equal(cycle.continue_defending, true);
  assert.equal(cycle.auto_merge, false);
  assert.equal(cycle.authority, "carl");
  assert.equal(cycle.live, false);
  assert.ok(cycle.snapshot.digest);
  assert.ok(cycle.risk_adjusted_information_gain);
});

test("global invariants remain explicit and fail if authority is introduced", () => {
  const fabric = createFabric({ nodeId: "n1" });
  registerNode(fabric, { id: "n1", kind: "ai", capabilities: ["execute"] });
  assert.equal(assertRealityFabricInvariant({ fabric }).ok, true);
  fabric.nodes.get("n1").authority = true;
  assert.equal(assertRealityFabricInvariant({ fabric }).ok, false);
});
