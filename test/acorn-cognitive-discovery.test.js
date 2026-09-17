import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CAPABILITY_LIFECYCLE,
  GRAPH_OPS,
  admitUnknownIntelligence,
  analyzeIndependence,
  architectureProvenance,
  challengeCognitiveArchitecture,
  classifyEmergence,
  cognitiveBudget,
  cognitiveDiscoveryCycle,
  cognitiveTrust,
  compareCognitiveArchitectures,
  compareCognitiveGenomes,
  compareMutations,
  describeCognitiveGenome,
  describeCognitiveSynapse,
  describeSelfKnowledge,
  detectCommonMode,
  discoverCognitiveArchitectures,
  discoverCognitiveBlindSpots,
  discoverCognitivePattern,
  discoverEmergentCapabilities,
  emergenceAuthority,
  evolveCognitiveSynapse,
  experienceCognitiveSynapse,
  expireCognitiveKnowledge,
  expireEmergentCapability,
  falsifyCognitiveArchitecture,
  findCognitivePaths,
  groupEmergentFunctions,
  measureBaselines,
  measureSynergy,
  mutateCognitiveGraph,
  prioritizeExperiments,
  proposeCognitiveCuriosity,
  proposeCognitiveMutation,
  qualifyCapability,
  recomposeCognitiveArchitecture,
  recoverFromLoss,
  rememberCognitiveExperience,
  rememberCognitiveFailure,
  rememberCognitiveStrategy,
  reproduceEmergence,
  runExperimentLab,
  safeEvolutionLoop,
  selectCognitiveStrategy,
  synapticFitness,
  watchEvolution,
} from "../scripts/cognitive-discovery.mjs";
import { describeArchitecture } from "../scripts/cortex-ecosystem.mjs";

function src(file) {
  return readFileSync(new URL(`../scripts/${file}`, import.meta.url), "utf8");
}

test("declared capability is not measured and invents no metrics", () => {
  const q = qualifyCapability({
    resource: { id: "claude", capabilities: ["reasoning"] },
    capability: "reasoning",
  });
  assert.equal(q.state, "DECLARED");
  assert.equal(q.declared, true);
  assert.equal(q.measured, false);
  assert.equal(q.verified, false);
  assert.equal(q.declared_is_not_measured, true);
  assert.equal(q.metrics, null);
  assert.equal(q.invented_metrics, false);
  assert.equal(q.live, false);
  assert.ok(CAPABILITY_LIFECYCLE.includes("DECLARED"));
});

test("capability lifecycle does not auto-promote DECLARED to MEASURED or VERIFIED", () => {
  const probed = qualifyCapability({
    resource: { id: "local", capabilities: ["coding"] },
    capability: "coding",
    probe: { attempted: true },
  });
  assert.equal(probed.state, "PROBED");
  assert.equal(probed.measured, false);
  const measured = qualifyCapability({
    resource: { id: "local", capabilities: ["coding"] },
    capability: "coding",
    measurement: { status: "MEASURED", value: 12 },
    evidence: { executed: true },
  });
  assert.equal(measured.state, "MEASURED");
  assert.equal(measured.verified, false);
  const verified = qualifyCapability({
    resource: { id: "local", capabilities: ["coding"] },
    capability: "coding",
    measurement: { status: "MEASURED", value: 12 },
    evidence: { executed: true, verified: true },
  });
  assert.equal(verified.state, "VERIFIED");
  assert.equal(verified.live, false);
});

test("paths are not ranked without evidence", () => {
  const found = findCognitivePaths({
    task: { objective: "review", required_capabilities: ["review"] },
    resources: [
      { id: "a", capabilities: ["review"] },
      { id: "b", capabilities: ["review"] },
      { id: "c", capabilities: ["review"] },
    ],
  });
  assert.equal(found.ranked, false);
  assert.equal(found.selected, null);
  assert.equal(found.better_without_evidence, false);
  assert.equal(found.better_in_general, false);
  assert.ok(found.paths.length >= 3);
  assert.equal(found.paths[0].description, "A → result");
  assert.equal(found.paths[2].includes_falsification, true);
  assert.equal(found.live, false);
});

test("paths may be compared only with measurements and still not claimed better in general", () => {
  const found = findCognitivePaths({
    task: { objective: "review", required_capabilities: ["review"] },
    resources: [
      { id: "a", capabilities: ["review"] },
      { id: "b", capabilities: ["review"] },
      { id: "c", capabilities: ["review"] },
    ],
    measurements: { measured: true, a: { error: 0.8 }, b: { error: 0.2 } },
    executed: true,
  });
  assert.equal(found.ranked, true);
  assert.equal(found.comparison.better_in_general, false);
  assert.equal(found.status, "MEASURED");
});

test("same provider is common-mode, not independence", () => {
  const risk = detectCommonMode([
    { id: "gpt-a", provider: "openai", host: "api", runtime: "cloud" },
    { id: "gpt-b", provider: "openai", host: "api", runtime: "cloud" },
    { id: "gpt-c", provider: "openai", host: "api", runtime: "cloud" },
  ]);
  assert.equal(risk.PROVIDER_CORRELATION, true);
  assert.equal(risk.COMMON_MODE_RISK, true);
  assert.equal(risk.three_sentinels_are_not_three_sources, true);
  assert.equal(risk.consensus_is_not_independence, true);
  assert.equal(risk.live, false);
});

test("unknown intelligence is admitted without rewriting Cortex", () => {
  const unknown = admitUnknownIntelligence({
    id: "tomorrowx",
    provider: "UNKNOWN",
    env: {},
  });
  assert.equal(unknown.cortex_modified, false);
  assert.equal(unknown.provider, "UNKNOWN");
  assert.equal(unknown.model, "UNKNOWN");
  assert.equal(unknown.live, false);
});

test("experiment is never auto-adopted even when adoption is requested without proof", () => {
  const rejected = runExperimentLab({
    hypothesis: "A is better than B",
    experiment: { expected: "ok" },
    executed: true,
    measured: true,
    verified: false,
    adopt: true,
  });
  assert.equal(rejected.adopted, false);
  assert.equal(rejected.auto_adopt, false);
  assert.equal(rejected.silent_modification, false);
  assert.equal(rejected.evolution.status, "REJECTED");
  const proposed = runExperimentLab({ hypothesis: "hold" });
  assert.equal(proposed.strategy, "PROPOSED");
  assert.equal(proposed.adopted, false);
});

test("low risk uses one resource; ambiguous two; critical adds falsification", () => {
  const low = cognitiveBudget({ risk: "LOW_RISK" });
  assert.equal(low.resources, 1);
  assert.equal(low.falsify, false);
  assert.equal(low.uses_entire_network, false);
  const amb = cognitiveBudget({ risk: "AMBIGUOUS" });
  assert.equal(amb.resources, 2);
  const important = cognitiveBudget({ risk: "IMPORTANT" });
  assert.equal(important.verify, true);
  assert.equal(important.independent, true);
  const crit = cognitiveBudget({ risk: "CRITICAL" });
  assert.equal(crit.falsify, true);
  assert.ok(crit.resources >= 3);
});

test("trust is multidimensional and is not a score", () => {
  const trust = cognitiveTrust({
    capability: "excellent",
    evidence: "unscored",
    identity: "claude",
  });
  assert.equal(trust.single_number, null);
  assert.equal(trust.score, null);
  assert.equal(trust.dimensions.CAPABILITY, "excellent");
  assert.equal(trust.dimensions.EVIDENCE, "unscored");
  assert.equal(trust.excellent_in_one_is_not_verified_in_another, true);
  assert.equal(trust.live, false);
});

test("expired evidence is not thereby false", () => {
  const expired = expireCognitiveKnowledge({
    kind: "capability",
    issued_at: "2020-01-01T00:00:00.000Z",
    now: "2026-09-17T00:00:00.000Z",
    ttl_ms: 1000,
  });
  assert.equal(expired.life.status, "EXPIRED");
  assert.equal(expired.expired, true);
  assert.equal(expired.expired_is_not_false, true);
  assert.equal(expired.life.was_false, false);
  assert.equal(expired.sufficient_for_current_state, false);
});

test("lost intelligence is substituted with a traced alternative, never a silent fallback", () => {
  const recovered = recoverFromLoss({
    lost: "xai",
    nodes: [
      { id: "xai", identity: "xai", capabilities: ["review"], presence: "CONNECTED" },
      { id: "cortex-local", identity: "cortex-local", kind: "local", capabilities: ["review"], presence: "ACTIVE" },
    ],
    required: ["review"],
  });
  assert.equal(recovered.status, "CONTINUED");
  assert.equal(recovered.silent_fallback, false);
  assert.equal(recovered.substitution_traced, true);
  assert.equal(recovered.alternative.includes("xai"), false);
  assert.equal(recovered.live, false);
});

test("synapse strengthens only by measured experience and can expire", () => {
  const described = describeCognitiveSynapse({ source: "a", target: "b", capability: "review" });
  assert.equal(described.synapse.state, "DISCOVERED");
  const unmeasured = experienceCognitiveSynapse({
    synapse: described.synapse,
    outcome: { measured: false },
  });
  assert.equal(unmeasured.status, "INCONCLUSIVE");
  assert.equal(unmeasured.strengthen_only_by_measurement, true);
  const strengthened = experienceCognitiveSynapse({
    synapse: described.synapse,
    outcome: { measured: true, success: true },
  });
  assert.equal(strengthened.action, "strengthen");
  assert.equal(strengthened.synapse.state, "ACTIVE");
  assert.equal(strengthened.synapse.live, false);
  const expired = describeCognitiveSynapse({
    source: "a",
    target: "b",
    expires_at: "2020-01-01T00:00:00.000Z",
    at: "2026-09-17T00:00:00.000Z",
  });
  assert.equal(expired.synapse.state, "EXPIRED");
});

test("graph mutation is proposed, not adopted", () => {
  assert.ok(GRAPH_OPS.includes("expand"));
  const mutated = mutateCognitiveGraph({
    architecture: describeArchitecture({ id: "arch_x", nodes: [{ id: "a", capabilities: ["review"] }] }),
    op: "expand",
  });
  assert.equal(mutated.adopted, false);
  assert.equal(mutated.status, "PROPOSED");
  assert.equal(mutated.graph_op, "expand");
  const unknownOp = mutateCognitiveGraph({ op: "invent" });
  assert.equal(unknownOp.status, "INSUFFICIENT_EVIDENCE");
  assert.equal(unknownOp.adopted, false);
});

test("cognitive memory stores experience, not an auto-promoted fact", () => {
  const memory = rememberCognitiveExperience({
    task: "review",
    resources: ["local"],
    capabilities: ["review"],
    strategy: ["A"],
    outcome: "CYCLE",
  });
  assert.equal(memory.auto_promoted, false);
  assert.equal(memory.learns_what_works, true);
  assert.equal(memory.experience.live, false);
});

test("cognitiveDiscoveryCycle composes organs without a second Cortex", () => {
  const cycle = cognitiveDiscoveryCycle({
    task: { objective: "review", required_capabilities: ["review"], risk: "LOW_RISK" },
    resources: [
      { id: "local", capabilities: ["review"], presence: "ACTIVE", kind: "local", provider: "local" },
    ],
    env: {},
    intelligence: {
      counts: { named: 1, identified: 1, present: 1, channel_discovered: 0, authenticated: 0, callable: 0, executed: 0, verified: 0, live: 0 },
      discoveries: [],
      nvidia: { state: "CHANNEL_NOT_PRESENT", missing: ["hardware"] },
      unknown: { state: "IDENTIFIED" },
    },
  });
  assert.equal(cycle.second_cortex, false);
  assert.equal(cycle.second_mesh, false);
  assert.equal(cycle.second_governance, false);
  assert.equal(cycle.capability_is_not_authority, true);
  assert.equal(cycle.live, false);
  assert.equal(cycle.auto_merge, false);
  assert.equal(cycle.authority, "carl");
  assert.equal(cycle.experiment.adopted, false);
  assert.equal(cycle.trust.single_number, null);
  assert.equal(cycle.paths.ranked, false);
  assert.equal(cycle.budget.resources, 1);
  assert.equal(cycle.unknown.cortex_modified, false);
  assert.equal(cycle.metrics.invented, false);
  assert.equal(cycle.intelligence.nvidia.state, "CHANNEL_NOT_PRESENT");
  assert.equal(cycle.architectures.brute_force, false);
  assert.equal(cycle.architectures.adopted, false);
  assert.ok(cycle.architectures.candidates.some((row) => row.kind === "SIMPLE"));
  assert.equal(cycle.architectures.candidates.some((row) => row.kind === "ENSEMBLE"), false);
  assert.equal(cycle.strategy.move, "ANSWER_DIRECTLY");
  assert.equal(cycle.pattern.status, "INCONCLUSIVE");
  assert.equal(cycle.comparison.better_in_general, false);
  assert.equal(cycle.emergence.classified.class, "KNOWN_CAPABILITY");
  assert.equal(cycle.emergence.classified.emergent, false);
  assert.equal(cycle.emergence.candidates.length, 0);
  assert.equal(cycle.evolution.adopted, false);
  assert.equal(cycle.genome.digest.length, 16);
});

test("discovery engine does not branch Cortex on NVIDIA or OpenAI names", () => {
  const discovery = src("cognitive-discovery.mjs");
  const cortex = src("cortex-cognition.mjs");
  const nvidia = /if\s*\(\s*(provider|family|vendor)\s*===\s*["']NVIDIA["']/i;
  const openai = /if\s*\(\s*(provider|family)\s*===\s*["']OpenAI["']/i;
  assert.equal(nvidia.test(discovery), false);
  assert.equal(openai.test(discovery), false);
  assert.equal(nvidia.test(cortex), false);
  assert.match(discovery, /composeCognitiveGraph as composeTaskGraph/);
  assert.match(discovery, /from "\.\/cortex-cognition\.mjs"/);
  assert.equal(/function composeCognitiveGraph/.test(discovery), false);
  assert.equal(/function falsify\s*\(/.test(discovery), false);
  assert.equal(/function plasticSynapse\s*\(/.test(discovery), false);
  assert.match(discovery, /generateArchitectures\(/);
  assert.equal(/function generateArchitectures\s*\(/.test(discovery), false);
  assert.match(discovery, /composeCapabilities\(/);
  assert.match(discovery, /safeEvolve\(/);
  assert.match(discovery, /governEvolution\(/);
  assert.equal(/function composeCapabilities\s*\(/.test(discovery), false);
  assert.equal(/function safeEvolve\s*\(/.test(discovery), false);
});

const matrix = [
  ["provider unavailable", { resources: [{ id: "openai", provider: "openai", capabilities: ["reasoning"] }], check(cycle) {
    assert.equal(cycle.qualifications[0].state, "DECLARED");
    assert.equal(cycle.qualifications[0].measured, false);
  } }],
  ["authentication missing", { resources: [{ id: "xai", provider: "xai", capabilities: ["review"], authenticated: false }], check(cycle) {
    assert.equal(cycle.live, false);
    assert.equal(cycle.paths.ranked, false);
  } }],
  ["capability mismatch", { task: { objective: "vision", required_capabilities: ["vision"] }, resources: [{ id: "text-only", capabilities: ["review"] }], check(cycle) {
    assert.ok(cycle.paths.paths[0].missing.includes("vision") || cycle.classified.required.includes("vision"));
  } }],
  ["common-mode dependency", { resources: [
    { id: "a", provider: "openai", host: "api", runtime: "cloud", capabilities: ["review"] },
    { id: "b", provider: "openai", host: "api", runtime: "cloud", capabilities: ["review"] },
  ], check(cycle) {
    assert.equal(cycle.common_mode.PROVIDER_CORRELATION, true);
  } }],
  ["resource disappearance", { lost: "a", resources: [
    { id: "a", identity: "a", capabilities: ["review"], presence: "CONNECTED" },
    { id: "cortex-local", identity: "cortex-local", kind: "local", capabilities: ["review"], presence: "ACTIVE" },
  ], check(cycle) {
    assert.equal(cycle.recovery.status, "CONTINUED");
    assert.equal(cycle.recovery.silent_fallback, false);
  } }],
];

for (const [name, spec] of matrix) {
  test(`failure case: ${name}`, () => {
    const cycle = cognitiveDiscoveryCycle({
      task: spec.task || { objective: "review", required_capabilities: ["review"] },
      resources: spec.resources,
      lost: spec.lost,
      env: {},
      intelligence: { counts: { named: spec.resources.length }, discoveries: [], nvidia: null, unknown: { state: "IDENTIFIED" } },
    });
    spec.check(cycle);
    assert.equal(cycle.second_cortex, false);
    assert.equal(cycle.live, false);
  });
}

const resourcesThree = [
  { id: "a", identity: "a", capabilities: ["review"], presence: "ACTIVE", provider: "local", kind: "local" },
  { id: "b", identity: "b", capabilities: ["review"], presence: "CONNECTED", provider: "openai", kind: "llm" },
  { id: "c", identity: "c", capabilities: ["review"], presence: "CONNECTED", provider: "anthropic", kind: "critic" },
];

test("progressive search stays small on LOW risk and does not brute-force", () => {
  const found = discoverCognitiveArchitectures({
    task: { objective: "review", required_capabilities: ["review"], risk: "LOW" },
    resources: resourcesThree,
  });
  assert.equal(found.brute_force, false);
  assert.equal(found.stopped_early, true);
  assert.equal(found.adopted, false);
  assert.ok(found.candidates.length <= 6);
  assert.ok(found.candidates.some((row) => row.kind === "SIMPLE"));
  assert.equal(found.candidates.some((row) => row.kind === "ENSEMBLE"), false);
  assert.equal(found.better_in_general, false);
  assert.equal(found.live, false);
});

test("CRITICAL search adds falsification and ensemble without claiming superiority", () => {
  const found = discoverCognitiveArchitectures({
    task: { objective: "review", required_capabilities: ["review"], risk: "CRITICAL" },
    resources: resourcesThree,
  });
  const kinds = found.candidates.map((row) => row.kind);
  assert.ok(kinds.includes("ADVERSARIAL"));
  assert.ok(kinds.includes("ENSEMBLE"));
  assert.ok(kinds.includes("RECOVERY"));
  assert.equal(found.adopted, false);
  assert.equal(found.brute_force, false);
  assert.ok(found.candidates.length <= 6);
});

test("architectures are not ranked without a metric and an experiment", () => {
  const found = discoverCognitiveArchitectures({
    task: { objective: "review", risk: "CRITICAL" },
    resources: resourcesThree,
  });
  const noMetric = compareCognitiveArchitectures({ architectures: found.candidates, measurements: { measured: true } });
  assert.equal(noMetric.status, "INCONCLUSIVE");
  assert.equal(noMetric.reason, "METRIC_REQUIRED");
  const noExperiment = compareCognitiveArchitectures({
    architectures: found.candidates,
    measurements: {},
    metric: "error",
  });
  assert.equal(noExperiment.reason, "EXPERIMENT_REQUIRED");
  assert.equal(noExperiment.better_in_general, false);
});

test("meta-cognition selects a strategy with proof and does not adopt it", () => {
  const low = selectCognitiveStrategy({ task: { risk: "LOW_RISK" } });
  assert.equal(low.move, "ANSWER_DIRECTLY");
  assert.equal(low.adopted, false);
  const crit = selectCognitiveStrategy({ task: { risk: "CRITICAL" } });
  assert.equal(crit.move, "FALSIFY");
  const reduce = selectCognitiveStrategy({ task: { risk: "CRITICAL" }, context: { overcomplex: true } });
  assert.equal(reduce.move, "REDUCE_COMPLEXITY");
});

test("two models from the same provider are false diversity, not two proofs", () => {
  const independence = analyzeIndependence([
    { id: "gpt-a", provider: "openai", host: "api", runtime: "cloud", upstream: "openai" },
    { id: "gpt-b", provider: "openai", host: "api", runtime: "cloud", upstream: "openai" },
  ]);
  assert.equal(independence.FALSE_DIVERSITY, true);
  assert.equal(independence.SHARED_UPSTREAM, true);
  assert.equal(independence.two_models_are_not_two_proofs, true);
});

test("challenge finds a single point of failure on SIMPLE and proposes an alternative", () => {
  const found = discoverCognitiveArchitectures({
    task: { objective: "review", risk: "LOW_RISK" },
    resources: [{ id: "solo", capabilities: ["review"], kind: "local" }],
  });
  const simple = found.candidates.find((row) => row.kind === "SIMPLE");
  const challenged = challengeCognitiveArchitecture({ architecture: simple });
  assert.equal(challenged.single_point_of_failure, true);
  assert.ok(challenged.findings.includes("single_point_of_failure"));
  assert.equal(challenged.adopted, false);
  assert.equal(challenged.alternative?.adopted, false);
});

test("strategy memory is historical, not a guarantee, and unmeasured patterns are not truth", () => {
  const found = discoverCognitiveArchitectures({
    task: { objective: "review", risk: "LOW_RISK" },
    resources: [{ id: "local", capabilities: ["review"], kind: "local" }],
  });
  const remembered = rememberCognitiveStrategy({
    task_class: "review",
    architecture: found.candidates[0],
    measurements: { measured: false },
  });
  assert.equal(remembered.status, "INCONCLUSIVE");
  assert.equal(remembered.strategy.historical_is_not_guarantee, true);
  const measured = rememberCognitiveStrategy({
    task_class: "review",
    architecture: found.candidates[0],
    measurements: { measured: true },
    expiry: "2020-01-01T00:00:00.000Z",
    at: "2026-09-17T00:00:00.000Z",
  });
  assert.equal(measured.strategy.expired, true);
  assert.equal(measured.strategy.historical_is_not_guarantee, true);
});

test("NEW_COGNITIVE_PATTERN requires measured, repeatable, verifiable, traceable evidence", () => {
  const incomplete = discoverCognitivePattern({ measurements: { measured: true }, repeated: true });
  assert.equal(incomplete.status, "INCONCLUSIVE");
  assert.equal(incomplete.pattern, null);
  const ok = discoverCognitivePattern({
    before: "A+B",
    after: "A→B→C",
    measurements: { measured: true },
    repeated: true,
    verified: true,
    traced: true,
  });
  assert.equal(ok.status, "DISCOVERED");
  assert.equal(ok.pattern.kind, "NEW_COGNITIVE_PATTERN");
  assert.equal(ok.adopted, false);
  assert.equal(ok.live, false);
});

test("falsified architecture is kept as negative knowledge and not adopted", () => {
  const found = discoverCognitiveArchitectures({
    task: { objective: "review", risk: "LOW_RISK" },
    resources: [{ id: "local", capabilities: ["review"], kind: "local" }],
  });
  const attack = falsifyCognitiveArchitecture({
    architecture: found.candidates[0],
    hypothesis: "SIMPLE is sufficient",
    contradiction: true,
    executed: true,
    measured: true,
  });
  assert.equal(attack.negative_knowledge, true);
  assert.equal(attack.adopted, false);
  assert.equal(attack.failure.kind, "architecture_falsified");
});

test("failure memory is temporal and does not block later revalidation", () => {
  const failure = rememberCognitiveFailure({ kind: "resource_failed", subject: "xai" });
  assert.equal(failure.do_not_repeat_blindly, true);
  assert.equal(failure.expired_is_not_permanent, true);
  assert.equal(failure.temporal, true);
  assert.equal(failure.live, false);
});

test("architecture provenance cannot claim it works in general", () => {
  const found = discoverCognitiveArchitectures({
    task: { objective: "review", risk: "LOW_RISK" },
    resources: [{ id: "local", capabilities: ["review"], kind: "local" }],
  });
  const proof = architectureProvenance({ architecture: found.candidates[0], task: "review" });
  assert.equal(proof.works_in_general, false);
  assert.equal(proof.architecture_id, found.candidates[0].architecture_id);
  assert.ok(Array.isArray(proof.limitations));
  assert.equal(proof.live, false);
});

test("recovery recomposes a node without rebuilding the system", () => {
  const recovered = recomposeCognitiveArchitecture({
    lost: "xai",
    nodes: [
      { id: "xai", identity: "xai", capabilities: ["review"], presence: "CONNECTED" },
      { id: "cortex-local", identity: "cortex-local", kind: "local", capabilities: ["review"], presence: "ACTIVE" },
    ],
    required: ["review"],
  });
  assert.equal(recovered.rebuilt_system, false);
  assert.equal(recovered.recomposed, true);
  assert.equal(recovered.silent_fallback, false);
});

test("unknown resource plus unknown strategy does not rewrite Cortex", () => {
  const unknown = admitUnknownIntelligence({ id: "tomorrowx", provider: "UNKNOWN", env: {} });
  const strategy = selectCognitiveStrategy({
    task: { risk: "AMBIGUOUS" },
    context: { unknown: true },
    independence: { FALSE_DIVERSITY: false },
    evidence: { insufficient: true },
  });
  assert.equal(unknown.cortex_modified, false);
  assert.equal(strategy.adopted, false);
  assert.equal(strategy.live, false);
});

test("single known resource is not emergence", () => {
  const classified = classifyEmergence({
    parts: [{ capability: "reasoning" }],
    catalog: ["reasoning"],
  });
  assert.equal(classified.class, "KNOWN_CAPABILITY");
  assert.equal(classified.emergent, false);
});

test("unmeasured combination is composition, not emergence", () => {
  const found = discoverEmergentCapabilities({
    resources: [{ id: "a" }, { id: "b" }],
    capabilities: ["reasoning", "memory"],
    measurements: {},
  });
  assert.equal(found.classified.class, "COMPOSITION");
  assert.equal(found.classified.reason, "UNMEASURED_COMBINATION_IS_NOT_EMERGENCE");
  assert.equal(found.candidates.length, 0);
  assert.equal(found.emergence_is_not_proof, true);
});

test("measured combination without extra property is false emergence", () => {
  const classified = classifyEmergence({
    parts: [{ capability: "reasoning" }, { capability: "memory" }],
    catalog: ["reasoning", "memory"],
    measurements: { measured: true, synergy: 0 },
    extra_property: false,
  });
  assert.equal(classified.class, "COMPOSITION");
  assert.equal(classified.reason, "NO_EXTRA_PROPERTY");
  assert.equal(classified.candidate, false);
});

test("synergy requires a complete baseline, a metric, and an extra property", () => {
  const incomplete = measureBaselines({
    parts: [{ id: "A" }, { id: "B" }],
    measurements: { A: 1 },
  });
  assert.equal(incomplete.incomplete_baseline_blocks_emergence, true);
  const noMetric = measureSynergy({ baseline: { expected: 2 }, combined: 3 });
  assert.equal(noMetric.reason, "METRIC_REQUIRED");
  const synergy = measureSynergy({
    baseline: { expected: 2 },
    combined: 4,
    metric: "accuracy",
    sample_size: 3,
    conditions: "review",
    limitations: ["small sample"],
  });
  assert.equal(synergy.status, "MEASURED");
  assert.equal(synergy.synergy, 2);
  assert.equal(synergy.universal_formula, false);
  const classified = classifyEmergence({
    parts: [{ capability: "reasoning" }, { capability: "memory" }],
    catalog: ["reasoning", "memory"],
    measurements: { measured: true, synergy: 2 },
    extra_property: true,
  });
  assert.equal(classified.class, "EMERGENT_CANDIDATE");
  assert.equal(classified.state, "CANDIDATE");
  assert.equal(classified.verified, false);
});

test("a single observation stays CANDIDATE; reproduction can falsify", () => {
  const once = reproduceEmergence({ observations: [{ measured: true, outcome: "ok" }] });
  assert.equal(once.status, "CANDIDATE");
  assert.equal(once.reproduced, false);
  const twice = reproduceEmergence({
    observations: [{ measured: true, outcome: "ok" }, { measured: true, outcome: "ok" }],
  });
  assert.equal(twice.status, "REPRODUCED");
  const clash = reproduceEmergence({
    observations: [{ measured: true, outcome: "ok" }, { measured: true, outcome: "fail" }],
  });
  assert.equal(clash.status, "FALSIFIED");
});

test("emergent candidates expire and are never eternally true", () => {
  const expiry = expireEmergentCapability({
    candidate: { created_at: "2020-01-01T00:00:00.000Z" },
    now: "2026-09-17T00:00:00.000Z",
  });
  assert.equal(expiry.revalidation_required, true);
  assert.equal(expiry.eternally_true, false);
  const model = expireEmergentCapability({ candidate: { created_at: "2026-09-17T00:00:00.000Z" }, now: "2026-09-17T00:00:00.000Z", model_changed: true });
  assert.equal(model.status, "REVALIDATION_REQUIRED");
});

test("plasticity strengthens, weakens, expires, and reactivates without auto-adoption", () => {
  const liveSynapse = describeCognitiveSynapse({
    source: "a",
    target: "b",
    capability: "review",
  }).synapse;
  const stronger = evolveCognitiveSynapse({ synapse: liveSynapse, op: "strengthen", outcome: { measured: true, success: true } });
  assert.equal(stronger.action, "strengthen");
  assert.equal(stronger.adopted, false);
  const weaker = evolveCognitiveSynapse({ synapse: liveSynapse, op: "weaken", outcome: { measured: true, success: false } });
  assert.equal(weaker.action, "weaken");
  const dated = describeCognitiveSynapse({
    source: "a",
    target: "b",
    capability: "review",
    at: "2026-01-01T00:00:00.000Z",
    valid_until: "2026-06-01T00:00:00.000Z",
  }).synapse;
  const expired = evolveCognitiveSynapse({ synapse: dated, op: "expire", now: "2026-09-17T00:00:00.000Z" });
  assert.equal(expired.status, "EXPIRED");
  const revived = evolveCognitiveSynapse({ synapse: { ...dated, state: "EXPIRED" }, op: "reactivate" });
  assert.equal(revived.action, "reactivate");
  assert.equal(revived.synapse.state, "RECOVERING");
  assert.equal(revived.adopted, false);
  const fitness = synapticFitness({ synapse: liveSynapse, success: 1, failure: 0, latency: null });
  assert.equal(fitness.score, null);
  assert.equal(fitness.magic_score, false);
});

test("mutations stay in a sandbox and the previous genome remains recoverable", () => {
  const genome = describeCognitiveGenome({
    resources: [{ id: "local" }],
    capabilities: ["review"],
    architecture: { architecture_id: "arch_simple" },
  });
  const mutation = proposeCognitiveMutation({ genome, kind: "increase_verification" });
  assert.equal(mutation.status, "PROPOSED");
  assert.equal(mutation.sandbox, true);
  assert.equal(mutation.adopted, false);
  const loop = safeEvolutionLoop({ current: genome, mutation, measurements: { executed: true, measured: true }, verified: false });
  assert.equal(loop.current_preserved, true);
  assert.equal(loop.adopted, false);
  assert.equal(loop.reversible, true);
  const adopted = safeEvolutionLoop({ current: genome, mutation, measurements: { executed: true, measured: true }, verified: true, simulated: true });
  assert.equal(adopted.adopted, false);
});

test("mutation comparison requires a metric and never claims better in general", () => {
  const noMetric = compareMutations({ a: { kind: "add_node" }, b: { kind: "add_synapse" }, measurements: { measured: true } });
  assert.equal(noMetric.reason, "METRIC_REQUIRED");
  const compared = compareMutations({
    a: { kind: "add_node" },
    b: { kind: "increase_verification" },
    measurements: { measured: true, a: 1, b: 2 },
    metric: "verification_success",
    conditions: "review",
  });
  assert.equal(compared.verdict, "B_BETTER_IN_CONTEXT");
  assert.equal(compared.better_in_general, false);
});

test("genome digest identifies exactly what changed", () => {
  const a = describeCognitiveGenome({ resources: [{ id: "a" }], capabilities: ["review"] });
  const b = describeCognitiveGenome({ resources: [{ id: "a" }, { id: "b" }], capabilities: ["review"] });
  const diff = compareCognitiveGenomes({ a, b });
  assert.equal(diff.same_digest, false);
  assert.ok(diff.changed.includes("resources"));
  assert.equal(diff.better_in_general, false);
});

test("emergent organs stay functions of the same Acorn", () => {
  const grouped = groupEmergentFunctions({
    candidates: [{ capability_id: "x", state: "VERIFIED", reproduced: true }],
  });
  assert.equal(grouped.second_cortex, false);
  assert.equal(grouped.second_runtime, false);
  assert.equal(grouped.new_authority, false);
  const none = groupEmergentFunctions({ candidates: [{ state: "CANDIDATE" }] });
  assert.equal(none.status, "INCONCLUSIVE");
});

test("emergence grants no authority and defense contains unsafe mutations", () => {
  const authority = emergenceAuthority({ candidate: { capability_id: "x" } });
  assert.equal(authority.can_modify_breaker, false);
  assert.equal(authority.can_merge, false);
  assert.equal(authority.can_bypass_defense, false);
  assert.equal(authority.can_access_secrets, false);
  const unsafe = watchEvolution({
    mutation: { adopted: true },
    grant: { actor: "acorn", authority: true, breaker: true, defense_bypass: true, secrets: true },
    integrity_changed: true,
  });
  assert.equal(unsafe.status, "CONTAINED");
  assert.ok(unsafe.findings.includes("unsafe_mutation"));
  assert.ok(unsafe.findings.includes("authority_escalation"));
  assert.ok(unsafe.findings.includes("breaker_bypass"));
  assert.ok(unsafe.findings.includes("defense_bypass"));
  assert.ok(unsafe.findings.includes("secret_access"));
  assert.equal(unsafe.defense_continues, true);
});

test("self-knowledge and blind spots stay distinct categories", () => {
  const self = describeSelfKnowledge({
    qualifications: [
      { capability: "review", declared: true, measured: false, verified: false, state: "DECLARED" },
      { capability: "code", declared: true, measured: true, verified: false, expired: true },
    ],
    failures: ["xai"],
  });
  assert.deepEqual(self.think_i_can_do, ["review"]);
  assert.deepEqual(self.can_do, ["code"]);
  assert.deepEqual(self.verified_i_can_do, []);
  assert.deepEqual(self.never_tested, ["review"]);
  assert.equal(self.categories_distinct, true);
  const blinds = discoverCognitiveBlindSpots({
    qualifications: [{ capability: "review", measured: false, expired: true }],
    resources: [{ provider: "openai", model: "gpt", channel: "api" }, { provider: "openai", model: "gpt", channel: "api" }],
    architectures: [{ kind: "SIMPLE" }],
    assumptions: [{ verified: false }],
  });
  assert.ok(blinds.findings.includes("capability_not_tested"));
  assert.ok(blinds.findings.includes("single_provider_dependency"));
  assert.ok(blinds.findings.includes("unexplored_configuration"));
});

test("curiosity and experiment priority keep components, not an opaque score", () => {
  const curiosity = proposeCognitiveCuriosity({ unknown: "unknown_capability", hypothesis: "A+B yields recovery" });
  assert.equal(curiosity.status, "PROPOSED");
  assert.equal(curiosity.adopted, false);
  const ranked = prioritizeExperiments({
    candidates: [{ id: "e1", information_gain: "high", risk: "LOW", cost: 0 }],
  });
  assert.equal(ranked.opaque_score, false);
  assert.equal(ranked.ranked[0].opaque_score, null);
  assert.equal(ranked.ranked[0].components.risk, "LOW");
});

test("unknown capability is admitted without rewriting Cortex", () => {
  const curiosity = proposeCognitiveCuriosity({ unknown: "UNKNOWN_CAPABILITY" });
  const unknown = admitUnknownIntelligence({ id: "newcap", provider: "UNKNOWN", env: {} });
  assert.equal(unknown.cortex_modified, false);
  assert.equal(curiosity.live, false);
});
