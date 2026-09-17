import test from "node:test";
import assert from "node:assert/strict";
import {
  openOntology,
  identityModel,
  cognitiveDependencyGraph,
  detectTransitiveCompromise,
  detectCommonMode,
  detectHiddenDependency,
  detectCognitiveSPOF,
  rememberSynapse,
  contextualTrust,
  limitMap,
  unknownRegistry,
  cognitiveEcology,
  futureIntelligenceByContract,
  assertCognitiveDependencyIntegrity,
} from "../scripts/acorn-cognitive-ecology.mjs";

test("open ontology does not grant authority to a new kind", () => {
  const o = openOntology({
    entities: [
      { id: "carl", kind: "human" },
      { id: "swarm", kind: "collective" },
      { id: "x", kind: "unknown_entity" },
    ],
  });
  assert.equal(o.frozen, false);
  assert.equal(o.new_kind_grants_authority, false);
  assert.equal(o.unknown_count, 1);
});

test("identity aspects remain distinct", () => {
  const id = identityModel({
    identity: "acorn",
    instance: "run-1",
    continuity: "v1",
    copy: "archive",
    transformation: "extended",
  });
  assert.equal(id.reconstructed_is_not_same_instance, true);
  assert.equal(id.copy_is_not_same_continuity, true);
  assert.equal(id.transformation_erases_history, false);
});

test("cognitive dependency graph detects transitive compromise, common mode, hidden dep, SPOF", () => {
  const graph = cognitiveDependencyGraph({
    nodes: [
      { id: "a", kind: "intelligence" },
      { id: "b", kind: "intelligence" },
      { id: "model", kind: "model" },
      { id: "provider", kind: "provider" },
    ],
    edges: [
      { from: "a", to: "model", kind: "model" },
      { from: "b", to: "model", kind: "model" },
      { from: "model", to: "provider", kind: "provider" },
    ],
  });
  const trans = detectTransitiveCompromise({ graph, compromised: "provider" });
  assert.ok(trans.affected.includes("a"));
  assert.equal(trans.transitive, true);
  const common = detectCommonMode({ graph });
  assert.equal(common.common_mode, true);
  const hidden = detectHiddenDependency({
    declared: graph.edges,
    observed: [...graph.edges, { from: "a", to: "secret-tool" }],
  });
  assert.equal(hidden.status, "HIDDEN_DEPENDENCY");
  const spof = detectCognitiveSPOF({ graph });
  assert.equal(spof.status, "COGNITIVE_SPOF");
  assert.equal(assertCognitiveDependencyIntegrity({ graph }).status, "VERIFIED");
});

test("synaptic memory records who works with whom, for what, with proof", () => {
  const s = rememberSynapse({
    source: "cortex",
    target: "worker",
    context: "review",
    task: "falsify",
    result: "EXECUTED",
    risk: "low",
    evidence: { digest: "abc" },
    latency: 12,
    reliability: 0.9,
    expiration: "2026-12-01T00:00:00.000Z",
    provenance: "cycle",
  });
  assert.equal(s.who_with_whom, true);
  assert.equal(s.for_what, true);
  assert.equal(s.with_what_evidence, true);
});

test("trust is contextual, never global", () => {
  const t = contextualTrust({
    capability: "review",
    context: { task: "constitution", risk: "high" },
    evidence: { verified: true },
    globalIntelligenceTrust: 0.99,
  });
  assert.equal(t.global_intelligence_trust, null);
  assert.equal(t.formula, "TRUST(capability | context)");
});

test("limit map refuses generally-reliable", () => {
  const m = limitMap({
    identity: "grok",
    strengths: ["synthesis"],
    limitations: ["not sovereign"],
    untested: ["future ontology"],
  });
  assert.equal(m.generally_reliable, false);
});

test("unknown space is not absence", () => {
  const u = unknownRegistry({
    claims: [
      { what: "future intelligence", state: "UNKNOWN", absent: false },
      { what: "missing file", state: "UNKNOWN", absent: true },
    ],
  });
  assert.equal(u.unknown_is_not_absent, true);
  assert.equal(u.we_do_not_know, true);
  assert.equal(u.rows[0].unknown_is_not_absent, true);
});

test("ecology does not confuse existence, capability, presence, authority, influence", () => {
  const e = cognitiveEcology({
    members: [
      { kind: "HUMANS", id: "carl", influence: "sovereign" },
      { kind: "AI", id: "cortex", presence: "ACTIVE" },
    ],
  });
  assert.equal(e.existence_is_not_capability, true);
  assert.equal(e.presence_is_not_authority, true);
  assert.equal(e.members.every((m) => m.authority === false), true);
});

test("future intelligence is discovered, not trusted or live", () => {
  const f = futureIntelligenceByContract({
    entry: { id: "future-x", provider: "UNKNOWN", capabilities: ["review"] },
  });
  assert.equal(f.status, "DISCOVERED");
  assert.equal(f.ready, false);
  assert.equal(f.verified, false);
  assert.equal(f.trusted, false);
  assert.equal(f.authorized, false);
  assert.equal(f.live, false);
  assert.equal(f.identity_is_not_model, true);
});
