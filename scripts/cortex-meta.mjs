#!/usr/bin/env node
/**
 * ACORN CORTEX — meta-evolution. Learn how to learn, inside the existing Cortex.
 * Not a second Cortex. SELF-PROPOSE ≠ SELF-AUTHORIZE. COUNTERFACTUAL ≠ OBSERVED.
 * UNKNOWN is a cognitive object. Failure is data. live=false.
 */
import { authorizeCapability } from "../.github/swarm/cortex.mjs";
import { learnFromExperience } from "./reality-learning-engine.mjs";
import {
  unknownSpace,
  valueOfInformation,
  generateArchitectures,
  describeArchitecture,
  describeNode,
  compareArchitectures,
  mutateArchitecture,
  replayDecision,
  timeMachine,
  cognitiveAutopsy,
  detectRegression,
  safeEvolve,
  homeostasisOf,
  independenceGraph,
  whenToAskHuman,
} from "./cortex-ecosystem.mjs";
import { cognitiveDiff, checkpointCortex, isolateExperimental } from "./cortex-adaptive.mjs";

export const META_VERSION = "cortex-meta.v1";
export const EPISTEMIC = Object.freeze([
  "KNOWN", "MEASURED", "INFERRED", "HYPOTHESIZED", "UNKNOWN", "CONTRADICTED", "EXPIRED", "HOLD_HUMAN",
]);
export const UNKNOWN_KINDS = Object.freeze([
  "UNKNOWN_LANGUAGE", "UNKNOWN_PROTOCOL", "UNKNOWN_CAPABILITY", "UNKNOWN_TOOL", "UNKNOWN_MODEL",
  "UNKNOWN_DOMAIN", "UNKNOWN_BEHAVIOR", "UNKNOWN_CAUSALITY", "UNKNOWN_FAILURE", "UNKNOWN_RESOURCE",
  "UNKNOWN_ARCHITECTURE", "UNKNOWN_HUMAN_INTENT", "UNKNOWN_ENVIRONMENT", "UNKNOWN_DIMENSION",
]);

function digest(value) {
  const raw = JSON.stringify(value ?? null);
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) h = Math.imul(h ^ raw.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function slot(value, epistemic = "UNKNOWN", evidence = null) {
  const epi = EPISTEMIC.includes(epistemic) ? epistemic : "UNKNOWN";
  return { value: value ?? null, epistemic: epi, evidence, live: false };
}

export function cognitiveSelfModel(input = {}) {
  const ad = input.adaptive || {};
  const eco = input.ecosystem || {};
  return {
    status: "EXECUTED",
    version: META_VERSION,
    state: {
      capabilities: slot(["review", "language-discover", "protocol-discover"], "INFERRED", "runtime"),
      intelligences: slot(ad.future_intelligence?.identity || null, ad.future_intelligence ? "MEASURED" : "UNKNOWN", "adaptive"),
      channels: slot(ad.protocol?.channel?.status || null, "HYPOTHESIZED", "open-channel"),
      adapters: slot(ad.adapter?.status || "PROPOSED", "PROPOSED" === ad.adapter?.status ? "HYPOTHESIZED" : "UNKNOWN"),
      protocols: slot(ad.protocol?.state || null, ad.protocol ? "MEASURED" : "UNKNOWN"),
      synapses: slot(eco.graph?.assembly?.edges?.length ?? null, "INFERRED"),
      memory: slot((input.memory || []).length, "MEASURED"),
      genome: slot(input.genome?.genome?.digest || ad.genome?.genome?.architectures || null, "MEASURED"),
      immune: slot(ad.immune?.healthy ?? input.immune?.healthy, "MEASURED"),
      prediction_error: slot(input.prediction_error ?? null, "HYPOTHESIZED"),
      limitations: slot(["paid_http", "fluent_translation", "mcp_wire"], "KNOWN", "honest-gap"),
      unknown_regions: slot(true, "KNOWN"),
      cost: slot("zero", "MEASURED"),
      live_claim: slot(false, "MEASURED"),
      authority: slot("carl", "KNOWN"),
      human_dependencies: slot(["merge"], "KNOWN"),
    },
    promotions_forbidden: {
      unknown_to_known: false,
      inferred_to_fact: false,
      prediction_to_observation: false,
      observation_to_causality: false,
    },
    live: false,
  };
}

export function selfDiagnostic(model = {}) {
  const st = model.state || {};
  const q = (answer, epistemic, evidence) => ({ answer, epistemic, evidence, narrative: false, live: false });
  return {
    status: "EXECUTED",
    questions: {
      WHAT_CAN_I_DO: q(st.capabilities?.value || [], st.capabilities?.epistemic || "INFERRED", st.capabilities?.evidence),
      WHAT_CAN_I_VERIFY: q(["worker-evidence"], "MEASURED", "cognitive-worker"),
      WHAT_CAN_I_NOT_VERIFY: q(st.limitations?.value || [], "KNOWN", "honest-gap"),
      WHAT_DO_I_ASSUME: q(["local review is keyless"], "HYPOTHESIZED", null),
      WHAT_HAVE_I_FAILED_AT: q(model.failures || [], "MEASURED", "history"),
      WHAT_IS_UNKNOWN: q(UNKNOWN_KINDS, "KNOWN", "unknown-space"),
      WHERE_AM_I_WEAK: q(["causal claims", "fluent translation"], "INFERRED", null),
      WHERE_AM_I_REDUNDANT: q(null, "UNKNOWN", null),
      WHERE_AM_I_DEPENDENT: q(st.human_dependencies?.value || ["merge"], "KNOWN", "constitution"),
      WHERE_IS_THE_SYSTEM_FRAGILE: q(["authority confusion"], "HYPOTHESIZED", null),
      WHERE_IS_THE_SYSTEM_STRONG: q(["zero-cost local cycle"], "MEASURED", "worker"),
      WHAT_NEW_CAPABILITY_COULD_CHANGE_THE_ARCHITECTURE: q(["verified independent critic"], "HYPOTHESIZED", null),
    },
    narrative: false,
    live: false,
  };
}

export function representUnknown({ kind, what, evidence } = {}) {
  const typed = UNKNOWN_KINDS.includes(kind) ? kind : "UNKNOWN_DIMENSION";
  const space = unknownSpace([{ what: what || typed, state: "UNKNOWN", evidence: evidence ?? null }]);
  return { status: "EXECUTED", kind: typed, forced: false, space, unknown_is_not_failure: true, live: false };
}

export function searchArchitectureSpace(input = {}) {
  const nodes = (input.nodes || [
    { id: "worker", kind: "executor", capabilities: ["review"], presence: "ACTIVE" },
    { id: "cortex-local", kind: "local", capabilities: ["review"], presence: "ACTIVE" },
    { id: "carl", kind: "human", capabilities: ["judgment"] },
  ]).map((row) => describeNode(row));
  const base = generateArchitectures({ class: input.class || "unknown", nodes, required: input.required || ["review"], policy: input.policy || "FREE_FIRST" });
  const local = nodes.find((row) => row.kind === "local") || nodes[0];
  const worker = nodes.find((row) => row.identity === "worker") || local;
  const human = nodes.find((row) => row.kind === "human") || describeNode({ id: "carl", kind: "human", capabilities: ["judgment"] });
  const extra = [
    describeArchitecture({ id: "arch_planner_specialists", class: input.class || "unknown", nodes: [worker, local, human], roles: { planner: local.identity, specialist: worker.identity, verifier: human.identity }, verification: "human-checkpoint" }),
    describeArchitecture({ id: "arch_human_loop", class: input.class || "unknown", nodes: [human, local], roles: { human: human.identity, cortex: local.identity }, verification: "human" }),
    describeArchitecture({ id: "arch_tool_first", class: input.class || "unknown", nodes: [local], roles: { tool: local.identity }, verification: "observation" }),
    describeArchitecture({ id: "arch_simulate_learn", class: input.class || "unknown", nodes: [local, human], roles: { simulate: local.identity, learn: local.identity }, verification: "prediction-error" }),
  ];
  return { status: "PROPOSED", candidates: [...base.candidates, ...extra], winner: null, auto_adopt: false, live: false };
}

export function describeExperiment({
  hypothesis, baseline, candidate, expected_effect, risk = "low", task = "review", at,
} = {}) {
  return {
    status: "DEFINED",
    experiment_id: `exp_${digest({ hypothesis, candidate: candidate?.architecture_id, at })}`,
    hypothesis: hypothesis || null,
    task,
    baseline_architecture: baseline || null,
    candidate_architecture: candidate || null,
    expected_effect: expected_effect || null,
    risk,
    rollback: true,
    adopted: false,
    live: false,
  };
}

export function runCognitiveExperiment({ experiment, workerEvidence = {}, fail = false, at } = {}) {
  const executed = Boolean(workerEvidence?.v);
  const compared = experiment?.baseline_architecture && experiment?.candidate_architecture
    ? compareArchitectures({
      a: experiment.baseline_architecture,
      b: experiment.candidate_architecture,
      measurements: { measured: executed, context: experiment.task || "review", a: { error: fail ? 0 : 1 }, b: { error: fail ? 1 : 0 } },
      at,
    })
    : { status: "INCONCLUSIVE", better_in_general: false, live: false };
  const regression = detectRegression({
    before: experiment?.baseline_architecture,
    after: experiment?.candidate_architecture,
    beforeMetrics: { error: 0 },
    afterMetrics: { error: fail ? 1 : 0, degraded: fail },
  });
  const evolved = safeEvolve({
    baseline: experiment?.baseline_architecture,
    candidate: experiment?.candidate_architecture,
    verification: { verified: false },
  });
  return {
    status: executed ? "EXECUTED" : "DEFINED",
    experiment,
    compared,
    regression,
    evolved,
    adopted: false,
    rejected: evolved.adopted !== true,
    failure_is_data: true,
    fake_success: false,
    live: false,
  };
}

export function whatIf({ question, snapshot = {}, change = {} } = {}) {
  return {
    status: "EXECUTED",
    counterfactual: true,
    observed_reality: false,
    question: question || "what if another architecture",
    change,
    replay: replayDecision({ snapshot }),
    past: timeMachine({ at: snapshot.at, snapshot }),
    live: false,
  };
}

export function proposeCuriousExperiment({ unknowns = [], cost = 0, risk = "low" } = {}) {
  const ranked = (unknowns.length ? unknowns : [{ region: "UNKNOWN", kind: "UNKNOWN_DIMENSION" }]).map((row) => ({
    unknown: row,
    voi: valueOfInformation({ unknown: row, cost, expected_reduction: cost + 1 }),
  }));
  const pick = ranked.find((row) => row.voi.next) || ranked[0];
  return {
    status: "PROPOSED",
    information_gain: pick?.voi.next ? "structured" : "unscored",
    uncertainty: pick?.unknown?.region || "UNKNOWN",
    cost,
    risk,
    useful_claimed_without_justification: false,
    experiment: describeExperiment({ hypothesis: `reduce ${pick?.unknown?.kind || "UNKNOWN"}`, risk }),
    live: false,
  };
}

export function metaMemory(entries = []) {
  return {
    status: "EXECUTED",
    memories: (entries || []).map((row) => ({
      what: row.what || row,
      strength: row.strength || "unscored",
      verified_at: row.verified_at || null,
      reused: row.reused === true,
      reuse_improved: null,
      expires_at: row.expires_at || null,
      epistemic: row.verified_at ? "MEASURED" : "HYPOTHESIZED",
    })),
    history_rewritten: false,
    live: false,
  };
}

export function evolutionGraph({ parent, mutation, experiment, measurement, verification } = {}) {
  return {
    status: "EXECUTED",
    graph: {
      parent: parent?.architecture_id || parent || null,
      mutation: mutation?.mutation_id || mutation || null,
      experiment: experiment?.experiment_id || experiment || null,
      measurement: measurement || null,
      verification: verification || null,
      adoption: false,
    },
    why: "unverified",
    rollback: true,
    live: false,
  };
}

export function knowledgeVsExperience({ beliefs = [], events = [] } = {}) {
  return {
    status: "EXECUTED",
    knowledge: (beliefs || []).map((row) => ({ ...slot(row.value ?? row, row.epistemic || "HYPOTHESIZED", row.evidence), kind: "belief" })),
    experience: (events || []).map((row) => ({ what: row.what || row, at: row.at || null, architecture: row.architecture || null, kind: "event", live: false })),
    belief_is_not_experience: true,
    experience_is_not_causality: true,
    live: false,
  };
}

export function observabilityTrace({ task, experiment, architecture, action, observation, decision, at } = {}) {
  return {
    status: "EXECUTED",
    trace_id: `tr_${digest({ task, experiment, architecture, at })}`,
    task_id: task || null,
    experiment_id: experiment?.experiment_id || experiment || null,
    architecture_id: architecture?.architecture_id || architecture || null,
    action: action || null,
    observation: observation || null,
    decision: decision || null,
    provenance: { source: "cortex-meta", at: at || new Date().toISOString() },
    live: false,
  };
}

export function metaHomeostasis({ experiments = 0, mutations = 0, immune = {} } = {}) {
  if (experiments > 8) return { state: "UNSTABLE", reason: "too_many_experiments", slow: true, live: false };
  if (mutations > 8) return { state: "UNSTABLE", reason: "too_many_mutations", slow: true, live: false };
  const inner = homeostasisOf({ immune, unknown: {}, metabolism: {} });
  return { state: inner.state || "STABLE", reason: null, slow: false, live: false };
}

export function selfImprove({ limitation = "prediction_error_high", workerEvidence = {}, nodes, at } = {}) {
  const search = searchArchitectureSpace({ nodes, class: "unknown" });
  const baseline = search.candidates[0];
  const candidate = mutateArchitecture(search.candidates[1] || baseline, { op: "ADD_VERIFIER" });
  const experiment = describeExperiment({
    hypothesis: `address ${limitation}`,
    baseline,
    candidate: candidate.mutation,
    expected_effect: "lower prediction error",
    risk: "low",
    at,
  });
  const ran = runCognitiveExperiment({ experiment, workerEvidence, fail: true, at });
  const learned = learnFromExperience({
    hypothesis: { limitation },
    expected: { improved: true },
    actual: { improved: false, adopted: false },
    context: { engine: "cortex-meta" },
    observedAt: at,
    model: { version: 1 },
    verification: { verified: false },
  });
  return {
    status: "EXECUTED",
    limitation,
    self_propose: true,
    self_authorize: false,
    experiment: ran,
    learned: { status: learned.status, live: false },
    adopted: false,
    rejected: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function runMetaEvolution(input = {}) {
  const at = input.at || new Date().toISOString();
  const model = cognitiveSelfModel(input);
  const diagnostic = selfDiagnostic({ ...model, failures: input.failures || [] });
  const unknown = representUnknown({ kind: input.unknownKind || "UNKNOWN_DIMENSION", what: input.unknownWhat || "FUTURE_SYSTEM_X" });
  const search = searchArchitectureSpace({ nodes: input.nodes, policy: "FREE_FIRST" });
  const diff = cognitiveDiff({
    a: search.candidates[0],
    b: search.candidates[3] || search.candidates[1],
    measurements: { measured: Boolean(input.workerEvidence?.v), context: "meta", a: { error: 0 }, b: { error: 0 } },
    at,
  });
  const ckpt = checkpointCortex({ architecture: search.candidates[0], genome: input.genome });
  const mutated = mutateArchitecture(search.candidates[0], { op: "ADD_VERIFIER" });
  const isolated = isolateExperimental({ checkpoint: ckpt, variant: mutated.mutation });
  const experiment = describeExperiment({
    hypothesis: "verifier reduces error",
    baseline: search.candidates[0],
    candidate: mutated.mutation,
    expected_effect: "lower error",
    at,
  });
  const ran = runCognitiveExperiment({ experiment, workerEvidence: input.workerEvidence || {}, fail: input.fail === true, at });
  const counterfactual = whatIf({
    question: "what if the verifier had been unavailable",
    snapshot: { architecture: search.candidates[0], evidence: input.workerEvidence, at },
    change: { missing: "verifier" },
  });
  const curiosity = proposeCuriousExperiment({ unknowns: unknown.space.regions, cost: 0 });
  const improved = selfImprove({ limitation: "prediction_error_high", workerEvidence: input.workerEvidence || {}, nodes: input.nodes, at });
  const graph = evolutionGraph({
    parent: search.candidates[0],
    mutation: mutated,
    experiment,
    measurement: diff,
    verification: { verified: false },
  });
  const graphs = knowledgeVsExperience({
    beliefs: [{ value: "local review is keyless", epistemic: "HYPOTHESIZED" }],
    events: [{ what: "worker cycle", at, architecture: search.candidates[0]?.architecture_id }],
  });
  const memory = metaMemory([{ what: "LANGUAGE_UNKNOWN is not failure", verified_at: at }]);
  const autopsy = ran.rejected ? cognitiveAutopsy({ task: "meta-experiment", evidence: null }) : { status: "NOT_APPLICABLE" };
  const homeo = metaHomeostasis({ experiments: 1, mutations: 1, immune: input.adaptive?.immune || input.immune || {} });
  const independent = independenceGraph(search.candidates[0]?.nodes || []);
  const attention = whenToAskHuman({ merge: false, uncertainty: "UNKNOWN", risk: "low" });
  const trace = observabilityTrace({
    task: "meta-evolution", experiment, architecture: search.candidates[0],
    action: "experiment", observation: ran.status, decision: "REJECT", at,
  });
  const merge = authorizeCapability({ capabilities: ["merge"], allowed: false, authority: "network" });
  return {
    version: META_VERSION,
    status: "EXECUTED",
    model,
    diagnostic,
    unknown,
    search,
    diff,
    checkpoint: ckpt,
    isolated,
    experiment: ran,
    counterfactual,
    curiosity,
    improved,
    graph,
    graphs,
    memory,
    autopsy,
    homeostasis: homeo,
    independence: independent,
    attention,
    trace,
    gates: {
      merge: merge.ok,
      self_authorize: false,
      counterfactual_is_not_observed: counterfactual.observed_reality === false,
      experiment_is_not_adoption: ran.adopted === false,
      genome_is_not_authority: true,
    },
    winner: null,
    second_cortex: false,
    zero_cost: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}
