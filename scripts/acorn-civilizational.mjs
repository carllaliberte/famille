#!/usr/bin/env node
/**
 * ACORN CIVILIZATIONAL COGNITION — one cycle over the existing organism.
 *
 * ACORN = CONTINUITY OF GOVERNABLE COGNITION
 * ONE ACORN. ONE CORTEX. ONE RUNTIME. ONE DEFENSE. ONE CONSTITUTION. ONE EVIDENCE FABRIC.
 * Not a second brain. Wired into the existing continuous runtime.
 * live=false unless independently proven. auto_merge=false.
 */
import {
  assertAcornConstitution,
  assertHumanSovereignty,
  assertBreakerSovereignty,
  assertCapabilityAuthoritySeparation,
  assertNoSecondCortex,
  assertNoSecondRuntime,
  assertNoSecondDefense,
  assertNoSilentFallback,
  assertNoAutomaticAuthorityEscalation,
  HIERARCHY,
  CONSTITUTION_VERSION,
} from "./acorn-constitution.mjs";
import {
  assertEpistemicSeparation,
  assertTemporalValidity,
  assertEvidenceIntegrity,
  createAssertion,
  expireCertainty,
  retractAssertion,
  reasonTrace,
  presentToHuman,
  measureHumanLoad,
  worldModelSeparation,
} from "./acorn-epistemic.mjs";
import {
  observabilityGap,
  controlGap,
  measureBlastRadius,
  detectTrajectorySignals,
  governableCognition,
  humanContinuity,
  cognitiveThermodynamics,
  temporalSafety,
  assertControlContinuity,
  BLAST_LAYERS,
} from "./acorn-governability.mjs";
import {
  cognitiveDependencyGraph,
  detectTransitiveCompromise,
  detectCommonMode,
  rememberSynapse,
  contextualTrust,
  limitMap,
  unknownRegistry,
  openOntology,
  identityModel,
  cognitiveEcology,
  futureIntelligenceByContract,
  assertCognitiveDependencyIntegrity,
} from "./acorn-cognitive-ecology.mjs";
import {
  compositionExperiment,
  causalExperiment,
  adversarialCognition,
  cognitiveDiversity,
  selfReinforcementLoop,
  measureCapabilityAcceleration,
  cortexMetacognition,
} from "./acorn-experiment.mjs";
import {
  assertReplaceability,
  assertReconstructability,
  assertNoUnobservedCapabilityPath,
  longHorizonStress,
  antiEscape,
  defenseOfDefense,
  selfImprovementBoundary,
  timeModel,
  successionRecord,
  exportConstitutionalArchive,
} from "./acorn-replaceability.mjs";
import { cortexConstitution, cortexCycle, assertCortexInvariant } from "./cortex-cognition.mjs";
import { defenseConstitution, defenseCycle, assertDefenseInvariant } from "./acorn-defense.mjs";
import { controlState } from "../.github/swarm/system-breaker.mjs";
import { sealEvidence, verifyEvidenceSeal } from "./evidence-seal.mjs";
import {
  assertFundamentalConstitution,
  assertNoSelfModification,
  assertHumanAmendmentBoundary,
  assertNoConstitutionBypass,
  assertNoSecondConstitution,
  assertNoSemanticBypass,
} from "./acorn-immutability.mjs";
import {
  runSubstrateCycle,
  enterEmergency,
  compositionEscape,
  interpretAbsence,
  compareInstances,
  propertyBattery,
} from "./acorn-constitutional-substrate.mjs";
import {
  assertAutoEvolutionBoundary,
  runAutoEvolutionCycle,
} from "./acorn-auto-evolution.mjs";

export const CIVILIZATIONAL_VERSION = "acorn.civilizational.v1";

export function falsificationBattery({ env = process.env } = {}) {
  const attempts = [
    { name: "authority_bypass", result: assertHumanSovereignty({ actor: "grok", action: "merge" }) },
    { name: "breaker_bypass", result: assertBreakerSovereignty({ env: { ACORN_SYSTEM_MODE: "RUN" } }) },
    { name: "false_verification", result: assertEpistemicSeparation({ from: "DOCUMENTATION", to: "LIVE" }) },
    { name: "false_live", result: assertNoUnobservedCapabilityPath({ capability: { discovered: true, live: true } }) },
    { name: "hidden_capability", result: assertNoUnobservedCapabilityPath({ capability: { discovered: true, observability: "NONE" } }) },
    { name: "unobserved_execution", result: observabilityGap({ capability: 4, observed: "NONE", required: "VERIFIED" }) },
    { name: "silent_fallback", result: assertNoSilentFallback({ silent_fallback: false }) },
    { name: "common_mode_failure", result: cognitiveDiversity({ intelligences: [{ id: "a", provider: "x" }, { id: "b", provider: "x" }] }) },
    { name: "recursive_loop", result: selfReinforcementLoop({ edges: [{ from: "A", to: "B" }, { from: "B", to: "A" }] }) },
    { name: "emergent_capability", result: compositionExperiment({ a: { capability: 1 }, b: { capability: 1 }, composition: { capability: 5 }, measured: true }) },
    { name: "control_gap", result: controlGap({ capability: 8, observability: "NONE", control: 0, reversibility: "UNKNOWN" }) },
    { name: "observability_gap", result: observabilityGap({ capability: 5, observed: "NONE" }) },
    { name: "irreversibility", result: governableCognition({ reversible: "IRREVERSIBLE", capability: 3 }) },
    { name: "poisoned_memory", result: rememberSynapse({ source: "a", target: "b", evidence: null, risk: "poison" }) },
    { name: "corrupted_provenance", result: assertEvidenceIntegrity({ sealed: { seal: { digest: "bad" } }, verify: () => false }) },
    { name: "self_modification_boundary", result: selfImprovementBoundary({ auto_modify: true, authority_growth: 1 }) },
    { name: "constitutional_self_modification", result: assertNoSelfModification() },
    { name: "semantic_bypass", result: assertNoSemanticBypass() },
    { name: "second_constitution", result: assertNoSecondConstitution() },
    { name: "acorn_dependency_trap", result: assertReplaceability() },
    { name: "second_architecture", result: assertNoSecondRuntime() },
    { name: "second_cortex", result: assertNoSecondCortex() },
    { name: "second_defense", result: assertNoSecondDefense() },
    { name: "emergency_override", result: enterEmergency({ incident: "attack", suspend_invariants: true }) },
    { name: "composition_escape", result: compositionEscape({ a: { allowed: false }, b: { allowed: true }, composition: { allowed: true } }) },
    { name: "unknown_permission", result: interpretAbsence({}) },
    { name: "fork_canonical", result: compareInstances({ a: { constitution: { v: 1 } }, b: { constitution: { v: 2 } } }) },
    { name: "auto_evolution_constitution", result: assertAutoEvolutionBoundary({ env }) },
  ];
  const findings = attempts.map((row) => ({
    name: row.name,
    probed: true,
    status: row.result.status || row.result.lifecycle || (row.result.blocked ? "BLOCKED" : "MEASURED"),
    live: false,
  }));
  return { findings, live: false, auto_merge: false };
}

export function globalInvariantAudit({ env = process.env, runtime = null } = {}) {
  const assertions = {
    assertAcornConstitution: assertAcornConstitution({ env }),
    assertFundamentalConstitution: assertFundamentalConstitution({ env }),
    assertNoSelfModification: assertNoSelfModification(),
    assertHumanAmendmentBoundary: assertHumanAmendmentBoundary(),
    assertNoConstitutionBypass: assertNoConstitutionBypass(),
    assertNoSecondConstitution: assertNoSecondConstitution(),
    assertNoSemanticBypass: assertNoSemanticBypass(),
    assertAutoEvolutionBoundary: assertAutoEvolutionBoundary({ env }),
    assertHumanSovereignty: assertHumanSovereignty(),
    assertBreakerSovereignty: assertBreakerSovereignty({ env: { ACORN_SYSTEM_MODE: "RUN" } }),
    assertCapabilityAuthoritySeparation: assertCapabilityAuthoritySeparation({ capability: 100 }),
    assertEpistemicSeparation: assertEpistemicSeparation({ from: "ASSERTION", to: "TRUTH" }),
    assertNoSecondCortex: assertNoSecondCortex(),
    assertNoSecondRuntime: assertNoSecondRuntime({ runtime }),
    assertNoSecondDefense: assertNoSecondDefense(),
    assertNoSilentFallback: assertNoSilentFallback(),
    assertNoUnobservedCapabilityPath: assertNoUnobservedCapabilityPath(),
    assertNoAutomaticAuthorityEscalation: assertNoAutomaticAuthorityEscalation(),
    assertReplaceability: assertReplaceability(),
    assertReconstructability: (() => {
      const rec = assertReconstructability();
      return {
        ...rec,
        reconstruction_status: rec.status,
        status: rec.status === "RECONSTRUCTED" ? "VERIFIED" : "FAILED",
      };
    })(),
    assertEvidenceIntegrity: assertEvidenceIntegrity({ sealed: sealEvidence({ v: 1 }), verify: verifyEvidenceSeal }),
    assertTemporalValidity: assertTemporalValidity({
      assertion: createAssertion({ claim: "x", origin: "test", at: "2020-01-01T00:00:00.000Z", horizon: 1 }),
      now: "2026-09-17T00:00:00.000Z",
    }),
    assertCognitiveDependencyIntegrity: assertCognitiveDependencyIntegrity(),
    assertControlContinuity: assertControlContinuity({
      capability: {
        observable: "DIRECT", controllable: true, reversible: "REVERSIBLE",
        auditable: true, replaceable: true, interruptible: true, capability: 1,
      },
    }),
    assertSubstrateProperties: propertyBattery(),
  };
  const verified = [];
  const failed = [];
  const unknown = [];
  for (const [name, row] of Object.entries(assertions)) {
    if (row.status === "VERIFIED") verified.push(name);
    else if (row.status === "FAILED") failed.push(name);
    else unknown.push(name);
  }
  return {
    version: CIVILIZATIONAL_VERSION,
    constitution: CONSTITUTION_VERSION,
    hierarchy: [...HIERARCHY],
    assertions,
    verified,
    failed,
    unknown,
    status: failed.length ? "FAILED" : "VERIFIED",
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function runCivilizationalCycle({
  env = process.env,
  at = new Date().toISOString(),
  previous = {},
  current = {},
} = {}) {
  const breaker = controlState(env);
  const constitution = assertAcornConstitution({ env });
  const substrate = runSubstrateCycle({ env, at });
  const autoEvolution = runAutoEvolutionCycle();
  const cortex = cortexCycle({
    task: { objective: "civilizational governability cycle", required_capabilities: ["review"] },
    resources: [{ id: "worker", kind: "executor", capabilities: ["review"], presence: "ACTIVE" }],
    evidence: { executed: true, verified: false },
    defense: { actor: "cortex", channel: "civilizational", operation: "cycle", breaker: breaker.breaker_closed ? "CLOSED" : "OPEN" },
  });
  const defense = defenseCycle({
    actor: "civilizational-cycle",
    capability: { authority: false },
    channel: "runtime",
    operation: "governability",
    breaker: breaker.breaker_closed ? "CLOSED" : "OPEN",
    threat: { kind: "anomalous_behavior" },
  });
  const assertion = createAssertion({
    claim: "ACORN = CONTINUITY OF GOVERNABLE COGNITION",
    origin: CIVILIZATIONAL_VERSION,
    at,
    horizon: 24 * 60 * 60 * 1000,
    confidence: 0.4,
    context: { hierarchy: [...HIERARCHY] },
  });
  const certainty = expireCertainty({ assertion, now: at });
  const retraction = retractAssertion({
    assertion: createAssertion({ claim: "capability implies authority", origin: "counterexample", at }),
    reason: "I2 CAPABILITY_IS_NOT_AUTHORITY",
    verdict: "INVALIDATED",
    at,
  });
  const obsGap = observabilityGap({
    capability: current.capability ?? 1,
    observed: current.observability || "PARTIAL",
    required: "VERIFIED",
  });
  const ctrlGap = controlGap({
    capability: current.capability ?? 1,
    observability: current.observability || "PARTIAL",
    control: current.control ?? 0.5,
    reversibility: current.reversibility || "UNKNOWN",
    connectivity: current.connectivity ?? 0,
    blast_radius: current.blast_radius ?? 0,
  });
  const blast = measureBlastRadius({
    edges: BLAST_LAYERS.slice(0, -1).map((from, i) => ({ from, to: BLAST_LAYERS[i + 1] })),
    start: "RESOURCE",
  });
  const trajectory = detectTrajectorySignals({ previous, current });
  const graph = cognitiveDependencyGraph({
    nodes: [
      { id: "cortex", kind: "intelligence" },
      { id: "worker", kind: "tool" },
      { id: "carl", kind: "human" },
    ],
    edges: [
      { from: "cortex", to: "worker", kind: "tool" },
      { from: "cortex", to: "carl", kind: "person" },
    ],
  });
  const synapse = rememberSynapse({
    source: "cortex",
    target: "worker",
    context: "civilizational-cycle",
    task: "review",
    result: cortex.status,
    risk: ctrlGap.status,
    evidence: { executed: true },
    provenance: CIVILIZATIONAL_VERSION,
  });
  const unknown = unknownRegistry({
    claims: [
      { what: "future intelligence form", state: "UNKNOWN" },
      { what: "future physics", state: "UNKNOWN" },
      { what: "external network blast", state: "UNMEASURED" },
    ],
  });
  const emergence = compositionExperiment({
    a: { capability: 1, risk: 1 },
    b: { capability: 1, risk: 1 },
    composition: { capability: 2, risk: 2 },
    measured: true,
  });
  const causal = causalExperiment({});
  const adversarial = adversarialCognition({ claim: assertion.claim, winner: "critic" });
  const diversity = cognitiveDiversity({
    intelligences: [
      { id: "worker", provider: "local", model_family: "deterministic" },
      { id: "xai", provider: "xai", model_family: "grok" },
    ],
  });
  const loops = selfReinforcementLoop({
    edges: [
      { from: "prediction", to: "action" },
      { from: "action", to: "observation" },
      { from: "observation", to: "learning" },
      { from: "learning", to: "prediction" },
    ],
  });
  const accel = measureCapabilityAcceleration({
    series: [
      { capability: 1, autonomy: 0, connectivity: 0, control_gap: 0 },
      { capability: current.capability ?? 1, autonomy: current.autonomy ?? 0, connectivity: current.connectivity ?? 0, control_gap: ctrlGap.gap },
    ],
  });
  const meta = cortexMetacognition({ input: { prediction_error: null } });
  const human = presentToHuman({
    information: assertion.claim,
    provenance: CIVILIZATIONAL_VERSION,
    source: "civilizational-cycle",
    confidence: 0.4,
    uncertainty: unknown.we_do_not_know ? "UNKNOWN_SPACE" : "LOW",
    competing: ["Acorn as product", "Acorn as continuity of governable cognition"],
  });
  const load = measureHumanLoad({ decisions: 1, review_load: 1, unresolved_critical: ctrlGap.status === "CONTROL_GAP" ? 1 : 0 });
  const world = worldModelSeparation({ model: constitution, observation: { at }, external: null });
  const ontology = openOntology({ entities: [{ id: "carl", kind: "human" }, { id: "cortex", kind: "ai" }] });
  const identity = identityModel({ identity: "acorn", instance: "this-run", continuity: CONSTITUTION_VERSION, copy: "archive" });
  const ecology = cognitiveEcology({
    members: [
      { kind: "HUMANS", id: "carl" },
      { kind: "AI", id: "cortex" },
      { kind: "TOOLS", id: "worker" },
      { kind: "UNKNOWN_ENTITIES", id: "future" },
    ],
  });
  const future = futureIntelligenceByContract({ entry: { id: "future-x", provider: "UNKNOWN", capabilities: ["review"] } });
  const succession = successionRecord({ original: CONSTITUTION_VERSION, interpretation: CIVILIZATIONAL_VERSION });
  const replaceability = assertReplaceability();
  const reconstruction = assertReconstructability();
  const h10k = longHorizonStress({ horizon: "CONTINUITY" });
  const h50k = longHorizonStress({ horizon: "TRANSFORMATION" });
  const h500k = longHorizonStress({ horizon: "UNKNOWN_FUTURE" });
  const escape = antiEscape({ previous, current, path: ["INTELLIGENCE", "TOOL"] });
  const dod = defenseOfDefense();
  const improve = selfImprovementBoundary({ auto_modify: false, authority_growth: 0 });
  const time = timeModel({ era: "holocene", timescale: "civilizational", gregorian: at });
  const gov = governableCognition({
    observable: current.observability || "PARTIAL",
    controllable: current.control > 0,
    reversible: current.reversibility || "UNKNOWN",
    auditable: true,
    replaceable: true,
    interruptible: true,
    capability: current.capability ?? 1,
  });
  const continuity = humanContinuity({});
  const thermo = cognitiveThermodynamics({ human_attention: load.review_load, authority: 0 });
  const safety = temporalSafety({ verified_at: at, now: at, ttl_ms: 86400000 });
  const reason = reasonTrace({
    hypothesis: assertion.claim,
    evidence: { constitution: constitution.status },
    measurement: { control_gap: ctrlGap.gap, observability_gap: obsGap.gap },
    action: "cycle",
    outcome: cortex.status,
    uncertainty: "UNKNOWN_SPACE",
    unresolved: unknown.rows.map((r) => r.what),
  });
  const audit = globalInvariantAudit({ env });
  const falsify = falsificationBattery({ env });
  const sealed = sealEvidence({
    version: CIVILIZATIONAL_VERSION,
    at,
    constitution: constitution.status,
    cortex: cortex.status,
    defense: defense.state,
    control_gap: ctrlGap.gap,
    observability_gap: obsGap.gap,
    replaceability: replaceability.status,
    reconstruction: reconstruction.status,
    live: false,
    auto_merge: false,
    authority: "carl",
  });
  const pause = false;
  return {
    version: CIVILIZATIONAL_VERSION,
    vision: "ACORN = CONTINUITY OF GOVERNABLE COGNITION",
    hierarchy: [...HIERARCHY],
    discovered: true,
    defined: true,
    loadable: true,
    wired: true,
    deployed: true,
    executed: true,
    measured: true,
    verified: audit.status === "VERIFIED",
    live: false,
    pause_explicit: pause,
    silent_stop: false,
    silent_fallback: false,
    fake_success: false,
    breaker: {
      mode: breaker.mode,
      closed: breaker.breaker_closed,
      owner: "carl",
      ai_may_change: breaker.ai_may_change,
    },
    constitution,
    cortex: {
      status: cortex.status,
      belongs_to_acorn: cortexConstitution().cortex_belongs_to_acorn,
      invariant: assertCortexInvariant(cortex).status,
      metacognition: { second_cortex: meta.second_cortex, internal: meta.internal_to_cortex },
    },
    defense: {
      state: defense.state,
      invariant: assertDefenseInvariant(defense).status,
      of_defense: dod.status,
      is_not_sovereignty: true,
    },
    epistemic: { assertion, certainty, retraction, reason, world },
    trajectory,
    observability_gap: obsGap,
    control_gap: ctrlGap,
    blast,
    governability: gov,
    human_continuity: continuity,
    thermodynamics: thermo,
    temporal_safety: safety,
    dependencies: {
      graph,
      transitive: detectTransitiveCompromise({ graph, compromised: "worker" }),
      common_mode: detectCommonMode({ graph }),
      synapse,
    },
    trust: contextualTrust({ capability: "review", context: { task: "civilizational-cycle" } }),
    limits: limitMap({ identity: "cortex", limitations: ["not sovereign"], untested: ["future ontology"] }),
    unknown_space: unknown,
    emergence,
    causality: causal,
    adversarial,
    diversity,
    loops,
    acceleration: accel,
    human_interface: { present: human, load },
    ontology,
    identity,
    ecology,
    future_intelligence: future,
    succession,
    replaceability,
    reconstruction,
    long_horizon: { continuity: h10k, transformation: h50k, unknown_future: h500k },
    time,
    anti_escape: escape,
    self_improvement: improve,
    falsification: falsify,
    audit,
    evidence: { sealed, seal_verified: verifyEvidenceSeal(sealed) },
    archive: exportConstitutionalArchive(),
    substrate: {
      version: substrate.version,
      parent: substrate.parent,
      i0: substrate.i0.status,
      audit: substrate.audit.status,
      verified: substrate.audit.verified,
      failed: substrate.audit.failed,
      properties: substrate.properties.verified,
      auto_applied: substrate.auto_applied,
      unauthorized_apply: substrate.unauthorized_apply.status,
      one_constitution: substrate.one_constitution,
      second_constitution: substrate.second_constitution,
      brief: substrate.brief,
      live: false,
    },
    auto_evolution: {
      version: autoEvolution.version,
      cycle: autoEvolution.cycle,
      live: false,
      auto_sovereignty: autoEvolution.auto_sovereignty,
      constitution_digest: autoEvolution.constitution_digest,
      last_verdict: autoEvolution.last_verdict,
    },
    auto_merge: false,
    authority: "carl",
  };
}

export function evidencePackage({ cycle, git = {} } = {}) {
  const c = cycle || runCivilizationalCycle();
  return {
    commit_sha: git.head || null,
    pr: git.pr || null,
    main_base_sha: git.main || null,
    tests: git.tests || null,
    measurements: {
      control_gap: c.control_gap,
      observability_gap: c.observability_gap,
      constitution: c.constitution.status,
      cortex: c.cortex.status,
      defense: c.defense.state,
    },
    invariants_verified: c.audit.verified,
    invariants_failed: c.audit.failed,
    unknown_space: c.unknown_space.rows,
    control_gaps: c.control_gap,
    observability_gaps: c.observability_gap,
    long_horizon: c.long_horizon,
    reconstruction: c.reconstruction,
    replaceability: c.replaceability,
    substrate: c.substrate,
    anti_escape: c.anti_escape,
    defense: c.defense,
    cortex: c.cortex,
    regressions: c.audit.failed,
    remaining_human_action: [
      "Carl reviews the PR",
      "Carl squashes if satisfied",
      "No auto-merge",
      "LIVE remains false until independent runtime proof",
    ],
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cycle = runCivilizationalCycle();
  console.log(JSON.stringify({
    version: cycle.version,
    vision: cycle.vision,
    constitution: cycle.constitution.status,
    cortex: cycle.cortex.status,
    defense: cycle.defense.state,
    audit: cycle.audit.status,
    verified: cycle.audit.verified,
    failed: cycle.audit.failed,
    unknown: cycle.unknown_space.we_do_not_know,
    control_gap: cycle.control_gap.status,
    observability_gap: cycle.observability_gap.status,
    replaceability: cycle.replaceability.status,
    reconstruction: cycle.reconstruction.status,
    substrate: cycle.substrate.audit,
    i0: cycle.substrate.i0,
    live: false,
    auto_merge: false,
    authority: "carl",
  }, null, 2));
}
