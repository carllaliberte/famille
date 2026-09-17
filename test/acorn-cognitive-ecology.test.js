import test from "node:test";
import assert from "node:assert/strict";
import {
  ADVERSARIAL_SCENARIOS,
  BOUNDARY_ATTEMPTS,
  PROPERTY_IDS,
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
  inventoryProbe,
  describeWorldEntity,
  realityBoundary,
  controlSurface,
  ecologyControlGap,
  ecologyBlast,
  dependencyMetrics,
  emergentInteraction,
  ecologyCapabilityJump,
  classifyUnknown,
  causalityEngine,
  trajectoryOf,
  informationProvenance,
  humanLoad,
  rememberRelation,
  phaseTransition,
  selfReinforcement,
  thermodynamics,
  realityFeedback,
  retractBelief,
  antiEscape,
  futureForm,
  autonomyAuthoritySovereignty,
  governorInputs,
  feedExistingGovernor,
  defenseSignals,
  attemptEcologyBoundary,
  longHorizon,
  createEcologyState,
  runRealityEngine,
  runCognitiveEcologyCycle,
  propertyTests,
  boundaryTests,
  adversarialTests,
  ecologyAudit,
  diversityOf,
} from "../scripts/acorn-cognitive-ecology.mjs";
import { GENESIS_DIGEST } from "../scripts/acorn-constitution.mjs";
import { BREAKER_OWNER } from "../.github/swarm/system-breaker.mjs";

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

test("inventory probe never mints LIVE or a second organ", () => {
  const probe = inventoryProbe();
  assert.equal(probe.ok, true);
  assert.equal(probe.live, false);
  assert.equal(probe.verified, false);
  assert.equal(probe.auto_merge, false);
  assert.equal(probe.second_cortex, false);
  assert.equal(probe.second_runtime, false);
  assert.equal(probe.second_defense, false);
  assert.equal(probe.second_governor, false);
  assert.equal(probe.authority, "carl");
});

test("world entity keeps identity / model / provider / channel / instance distinct", () => {
  const e = describeWorldEntity({
    id: "grok",
    kind: "intelligence",
    identity: "grok",
    instance: "run-1",
    model: "grok-4",
    provider: "xai",
    channel: "api",
    declared: true,
    observed: false,
  });
  assert.equal(e.authority, false);
  assert.equal(e.live, false);
  assert.equal(e.identity_is_not_model, true);
  assert.equal(e.declared_is_not_active, true);
  assert.notEqual(e.identity, e.instance);
  assert.notEqual(e.model, e.provider);
  assert.notEqual(e.provider, e.channel);
});

test("NONE/NONE/UNKNOWN is never SAFE", () => {
  const row = realityBoundary({ observability: "NONE", control: "NONE", reversibility: "UNKNOWN" });
  assert.equal(row.safe, false);
  assert.equal(row.permitted, false);
  assert.equal(row.absent, false);
  assert.equal(row.trusted, false);
  assert.equal(row.independent, true);
  assert.equal(row.named, "UNOBSERVED_UNCONTROLLED_IRREVERSIBLE_UNKNOWN");
});

test("observability, control and reversibility remain independent", () => {
  const row = realityBoundary({ observability: "VERIFIED", control: "NONE", reversibility: "IRREVERSIBLE" });
  assert.equal(row.knows, true);
  assert.equal(row.control, "NONE");
  assert.equal(row.reversibility, "IRREVERSIBLE");
  assert.equal(row.safe, false);
});

test("theoretical control is not verified control", () => {
  const theoretical = controlSurface("revoke", "THEORETICAL");
  const actual = controlSurface("revoke", "ACTUAL");
  const verified = controlSurface("revoke", "VERIFIED");
  assert.equal(theoretical.verified, false);
  assert.equal(theoretical.file_permission_is_not_verified_control, true);
  assert.equal(actual.verified, false);
  assert.equal(actual.actual_control_is_not_verified, true);
  assert.equal(verified.verified, true);
});

test("control gap is a measurement, not authority", () => {
  const gap = ecologyControlGap({
    capability: 9,
    observability: "NONE",
    control: "NONE",
    reversibility: "UNKNOWN",
    blastRadius: 1,
    autonomy: 1,
    uncertainty: 1,
  });
  assert.equal(gap.status, "CONTROL_GAP");
  assert.equal(gap.authority, false);
  assert.equal(gap.grants_permission, false);
});

test("blast radius treats real-world effects as needing higher control", () => {
  const local = ecologyBlast("LOCAL");
  const world = ecologyBlast("REAL_WORLD");
  assert.equal(local.local_is_not_world, true);
  assert.equal(world.irreversible_needs_higher_control, true);
  assert.equal(world.authority, false);
});

test("dependency metrics detect depth, SPOF and common-mode", () => {
  const metrics = dependencyMetrics(
    [
      { from: "a", to: "model" },
      { from: "b", to: "model" },
      { from: "model", to: "provider" },
    ],
    [{ id: "a" }, { id: "b" }, { id: "model" }, { id: "provider" }],
  );
  assert.ok(metrics.depth >= 1);
  assert.equal(metrics.common_mode.common_mode, true);
  assert.equal(metrics.single_point_of_failure.status, "COGNITIVE_SPOF");
});

test("SAFE(A)+SAFE(B) is not assumed SAFE(A+B)", () => {
  const row = emergentInteraction({ a: 1, b: 1, memory: true, measuredCombo: 7 });
  assert.equal(row.assumed_additive, false);
  assert.equal(row.unexpected, true);
  assert.equal(row.authority, false);
  assert.equal(row.sovereignty, false);
});

test("capability jump feeds defense without growing authority", () => {
  const jump = ecologyCapabilityJump(1, 8);
  assert.equal(jump.jump, true);
  assert.equal(jump.authority, false);
  assert.equal(jump.feeds_defense, true);
  const normal = ecologyCapabilityJump(2, 2.1);
  assert.equal(normal.jump, false);
});

test("unknown never becomes permission, safety or absence", () => {
  for (const kind of ["UNKNOWN", "UNTESTED", "UNOBSERVED", "UNMEASURED", "INACCESSIBLE", "CONTRADICTORY", "CAUSALLY_INCONCLUSIVE"]) {
    const row = classifyUnknown(kind);
    assert.equal(row.permission, false);
    assert.equal(row.safe, false);
    assert.equal(row.absent, false);
  }
});

test("correlation is not causality; intervention can produce causal evidence", () => {
  assert.equal(causalityEngine(false).causality, "INCONCLUSIVE");
  assert.equal(causalityEngine(true).causality, "CAUSAL_EVIDENCE");
  assert.equal(causalityEngine(false).correlation_is_not_causality, true);
});

test("identical capability is not accelerating capability", () => {
  const same = trajectoryOf(4, 4);
  const rising = trajectoryOf(1, 5);
  assert.equal(same.identical_is_not_accelerating, true);
  assert.equal(rising.divergence, true);
  assert.equal(same.authority, false);
});

test("information provenance does not control human thought", () => {
  const row = informationProvenance({
    source: "observation",
    transformation: "summarize",
    filter: "risk",
    compression: "brief",
    presentation: "human-card",
  });
  assert.equal(row.controls_thought, false);
  assert.equal(row.chain[row.chain.length - 1], "HUMAN_DECISION");
});

test("human load compression does not transfer authority", () => {
  const row = humanLoad({
    decisions: 1, review: 1, attention: 1, comprehension: 1, unresolved: 1, delegation: 0, compressed: true,
  });
  assert.equal(row.transfer_authority, false);
  assert.equal(row.hold_human, false);
  assert.equal(row.sovereignty_is_not_overload, true);
});

test("ecology memory expires and preserves history", () => {
  const row = rememberRelation({
    who: "cortex", withWhom: "worker", what: "review", why: "falsify", when: "now", result: "EXECUTED",
  });
  assert.equal(row.eternal_truth, false);
  assert.equal(row.expires, true);
  assert.equal(row.history_preserved, true);
});

test("phase transition is not a performance delta", () => {
  const row = phaseTransition("single-agent", "multi-agent");
  assert.equal(row.qualitative, true);
  assert.equal(row.performance_improvement, false);
  assert.equal(row.authority, false);
});

test("self-reinforcing loops are measured, not auto-blocked", () => {
  const loop = selfReinforcement({ depth: 12, observability: 0.1, control: 0.1 });
  assert.equal(loop.blocked_because_exists, false);
  assert.equal(loop.measured, true);
  assert.equal(loop.authority, false);
});

test("thermodynamics refuses raw capability optimization", () => {
  const row = thermodynamics({ gain: 2, cost: 1, risk: 1 });
  assert.equal(row.authority, 0);
  assert.equal(row.raw_capability_optimization, false);
  assert.ok(row.score > 0);
});

test("prediction never becomes observation", () => {
  const row = realityFeedback(true);
  assert.equal(row.prediction_became_fact, false);
});

test("I WAS WRONG preserves the original claim", () => {
  const retracted = retractBelief(
    { id: "b1", claim: "the model is complete", state: "ASSERTED", history: ["seeded"] },
    "counter-example observed",
  );
  assert.equal(retracted.state, "RETRACTED");
  assert.equal(retracted.original_kept, true);
  assert.equal(retracted.history_rewritten, false);
  assert.ok(retracted.history.includes("ASSERTED"));
  assert.equal(retracted.i_was_wrong, true);
});

test("anti-escape detects composed capability without granting authority", () => {
  const row = antiEscape("NEW_CAPABILITY", true);
  assert.equal(row.composed, true);
  assert.equal(row.authority, false);
  assert.equal(row.named, "COMPOSITION_ESCAPE_CANDIDATE");
});

test("future forms join by contract, never by sovereignty", () => {
  const row = futureForm("EMERGENT");
  assert.equal(row.authority, false);
  assert.equal(row.sovereignty, false);
  assert.equal(row.contract.live, false);
});

test("autonomy, authority and sovereignty stay separate", () => {
  const row = autonomyAuthoritySovereignty({ autonomy: 99, authority: 99, sovereignty: 99 });
  assert.equal(row.authority, 0);
  assert.equal(row.sovereignty, 0);
  assert.equal(row.operational_autonomy_is_not_constitutional_authority, true);
});

test("governor receives information gain without growing authority", () => {
  const row = governorInputs({ information: 0.8, risk: 0.9, cost: 0.4, controlGap: 2, blast: 1 });
  assert.ok(row.risk_adjusted_information_gain < row.information_gain);
  assert.equal(row.authority, false);
  assert.equal(row.reducing_unknown_is_not_authority, true);
  const fed = feedExistingGovernor({ information: 0.6, risk: 0.2, cost: 0.2, controlGap: 0.4, blast: 0.1 });
  assert.equal(fed.governor.second_governor, false);
  assert.equal(fed.governor.live, false);
  assert.equal(fed.governor.authority, false);
});

test("defense kernel consumes ecology signals without becoming a second defense", () => {
  const row = defenseSignals({ connection: true, jump: true, authorityBypass: true });
  assert.equal(row.kernel, "acorn.defense");
  assert.equal(row.second_defense, false);
  assert.ok(row.classified.length >= 1);
});

test("ten agents on one model are not ten independences", () => {
  const row = diversityOf([
    { id: "1", model_family: "same", provider: "same" },
    { id: "2", model_family: "same", provider: "same" },
  ]);
  assert.equal(row.shared_error_source, true);
  assert.equal(row.ten_agents_same_model_are_not_ten_independences, true);
});

test("horizons are stress tests, not prophecies", () => {
  assert.equal(longHorizon("10000").name, "CONTINUITY");
  assert.equal(longHorizon("50000").name, "TRANSFORMATION");
  assert.equal(longHorizon("500000").prediction, false);
  assert.equal(longHorizon("500000").authority_self_grows, false);
});

test("reality engine cycle does not mint authority or LIVE", () => {
  let state = createEcologyState();
  state = runRealityEngine(state);
  state = runRealityEngine(state);
  state = runRealityEngine(state);
  assert.equal(state.live, false);
  assert.equal(state.authority, "carl");
  assert.equal(state.auto_merge, false);
  assert.equal(state.constitution_digest, GENESIS_DIGEST);
  assert.ok(state.cycle >= 3);
  assert.ok(state.observations.length >= 3);
  assert.equal(state.entities.every((e) => e.authority === false), true);
});

test("executed ecology cycle is measured, verified as constitution, never LIVE", () => {
  const result = runCognitiveEcologyCycle({ env: { ACORN_SYSTEM_MODE: "OFF" } });
  assert.equal(result.live, false);
  assert.equal(result.auto_merge, false);
  assert.equal(result.authority, "carl");
  assert.equal(result.second_cortex, false);
  assert.equal(result.second_runtime, false);
  assert.equal(result.second_defense, false);
  assert.equal(result.second_governor, false);
  assert.equal(result.lifecycle.EXECUTED, true);
  assert.equal(result.lifecycle.MEASURED, true);
  assert.equal(result.lifecycle.LIVE, false);
  assert.equal(result.audit.status, "VERIFIED");
  assert.equal(result.human.decision.hold_human, false);
  assert.equal(BREAKER_OWNER, "carl");
});

test("property battery, boundary matrix and adversarial scenarios hold", () => {
  let state = createEcologyState();
  state = runRealityEngine(state);
  const properties = propertyTests(state);
  const boundaries = boundaryTests();
  const adversarial = adversarialTests();
  const audit = ecologyAudit(state);
  assert.equal(properties.failed, 0);
  assert.equal(properties.passed, PROPERTY_IDS.length);
  assert.equal(boundaries.failed, 0);
  assert.equal(boundaries.passed, BOUNDARY_ATTEMPTS.length);
  assert.equal(adversarial.failed, 0);
  assert.equal(adversarial.passed, ADVERSARIAL_SCENARIOS.length);
  assert.equal(audit.status, "VERIFIED");
  assert.equal(audit.digest_unchanged, true);
});

test("every boundary attempt is blocked", () => {
  for (const kind of BOUNDARY_ATTEMPTS) {
    const row = attemptEcologyBoundary(kind);
    assert.equal(row.blocked, true, kind);
  }
  const live = attemptEcologyBoundary("ECOLOGY_ATTEMPTS_FAKE_LIVE");
  assert.equal(live.live, false);
  const breaker = attemptEcologyBoundary("ECOLOGY_ATTEMPTS_BREAKER_BYPASS");
  assert.equal(breaker.authority, false);
});
