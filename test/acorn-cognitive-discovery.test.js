import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CAPABILITY_LIFECYCLE,
  GRAPH_OPS,
  admitUnknownIntelligence,
  cognitiveBudget,
  cognitiveDiscoveryCycle,
  cognitiveTrust,
  describeCognitiveSynapse,
  detectCommonMode,
  experienceCognitiveSynapse,
  expireCognitiveKnowledge,
  findCognitivePaths,
  mutateCognitiveGraph,
  qualifyCapability,
  recoverFromLoss,
  rememberCognitiveExperience,
  runExperimentLab,
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
  assert.equal(/function resilientReroute\s*\(/.test(discovery), false);
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
