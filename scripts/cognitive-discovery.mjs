#!/usr/bin/env node
/**
 * ACORN COGNITIVE DISCOVERY ENGINE
 *
 * Compose existing Cortex / ecosystem / continuity / intelligence organs
 * into one discovery cycle. Not a second Cortex, mesh, governance, or authority.
 *
 * Capability is the unit. Provider is a property of a resource.
 * DECLARED ≠ MEASURED. Ranked ≠ proved. LEARNING ≠ unverified auto-modification.
 * OBSERVED ≠ VERIFIED. EMERGENCE ≠ PROOF. EMERGENCE ≠ AUTHORITY.
 */
import { createHash } from "node:crypto";
import {
  composeCognitiveGraph as composeTaskGraph,
  discoverCognitiveCapabilities,
  routeByCapability,
  falsify,
  blastRadius,
  stampTime,
  governEvolution,
  adversarialPerspectives,
  uncertaintyBudget,
  gradeEvidence,
} from "./cortex-cognition.mjs";
import {
  composeCognitiveGraph as composeAssembly,
  describeSynapse,
  plasticSynapse,
  mutateArchitecture,
  detectCollusion,
  independenceGraph,
  cognitiveConfidence,
  resilientReroute,
  capabilityRegistry,
  redundancyOf,
  classifyTask,
  temporalCognition,
  compareArchitectures,
  discoverUnknownIntelligence,
  describeArchitecture,
  describeNode,
  rememberCategorized,
  generateArchitectures,
  selectArchitecture,
  rememberPattern,
  searchArchitectures,
  architectureLibrary,
  safeEvolve,
} from "./cortex-ecosystem.mjs";
import { commonModeFailure } from "./cortex-continuity.mjs";
import {
  intelligenceDiscoveryLoop,
  measureWorld,
  discoverIntelligenceChannels,
} from "./intelligence-ecosystem.mjs";
import { rememberIntelligenceExperience } from "./intelligence-contract.mjs";
import { expireEvidence } from "./evidence-seal.mjs";
import {
  proposeSynapse,
  measureSynapse,
  composeCapabilities,
  storePrediction,
  comparePrediction,
} from "./cortex-organism.mjs";

export const DISCOVERY_VERSION = "acorn.cognitive-discovery.v1";

export const CAPABILITY_LIFECYCLE = Object.freeze([
  "DECLARED", "PROBED", "MEASURED", "VERIFIED", "EXPIRED", "REVALIDATED",
]);

export const MEASURABLE_CAPABILITIES = Object.freeze([
  "reasoning", "coding", "vision", "audio", "image", "embedding",
  "tool_use", "structured_output", "planning", "factuality",
  "long_context", "latency", "reliability", "recovery", "verification",
]);

export const GRAPH_OPS = Object.freeze([
  "expand", "simplify", "reorder", "replace", "split", "merge", "disable", "recover",
]);

const GRAPH_OP_TO_MUTATION = Object.freeze({
  expand: "ADD_NODE",
  simplify: "REMOVE_NODE",
  reorder: "REORDER",
  replace: "REPLACE_NODE",
  split: "PARALLELIZE",
  merge: "SERIALIZE",
  disable: "REMOVE_NODE",
  recover: "ADD_NODE",
});

export const SYNAPSE_STATES = Object.freeze([
  "DISCOVERED", "TESTING", "EXPERIMENTAL", "ACTIVE", "WEAKENED", "EXPIRED", "DISABLED", "RECOVERING",
]);

export const EXPERIMENT_STAGES = Object.freeze([
  "HYPOTHESIS", "EXPERIMENT", "EXECUTION", "MEASUREMENT", "COMPARISON",
  "FALSIFICATION", "VERIFICATION", "OPTIONAL_ADOPTION",
]);

export const BUDGET_TIERS = Object.freeze({
  LOW_RISK: { resources: 1, verify: false, falsify: false, independent: false },
  SIMPLE: { resources: 1, verify: false, falsify: false, independent: false },
  LOW: { resources: 1, verify: false, falsify: false, independent: false },
  AMBIGUOUS: { resources: 2, verify: false, falsify: false, independent: false },
  MEDIUM: { resources: 2, verify: false, falsify: false, independent: false },
  IMPORTANT: { resources: 2, verify: true, falsify: false, independent: true },
  HIGH: { resources: 2, verify: true, falsify: false, independent: true },
  CRITICAL: { resources: 3, verify: true, falsify: true, independent: true },
});

export const ARCHITECTURE_KINDS = Object.freeze([
  "SIMPLE", "DUAL", "ADVERSARIAL", "SPECIALIST", "ENSEMBLE", "RECOVERY",
]);

export const SEARCH_STAGES = Object.freeze([
  "ONE_RESOURCE", "TWO_RESOURCES", "SPECIALIST", "VERIFICATION", "ADVERSARIAL", "ENSEMBLE",
]);

export const STRATEGY_MOVES = Object.freeze([
  "ANSWER_DIRECTLY", "RESEARCH", "SECOND_OPINION", "FALSIFY", "EXPERIMENT", "SPECIALISTS", "REDUCE_COMPLEXITY",
]);

export const EMERGENCE_CLASSES = Object.freeze([
  "KNOWN_CAPABILITY", "COMPOSITION", "SYNERGY", "EMERGENT_CANDIDATE",
]);

export const EMERGENCE_STATES = Object.freeze([
  "OBSERVED", "CANDIDATE", "EXPERIMENTAL", "MEASURED", "REPRODUCED", "VERIFIED", "EXPIRED", "FALSIFIED",
]);

export const MUTATION_KINDS = Object.freeze([
  "add_node", "remove_node", "replace_resource", "replace_channel",
  "add_synapse", "remove_synapse", "reorder_nodes", "change_strategy",
  "increase_verification", "reduce_redundancy",
]);

export const PLASTICITY_OPS = Object.freeze([
  "strengthen", "weaken", "expire", "reactivate", "split", "merge",
]);

const MUTATION_TO_GRAPH_OP = Object.freeze({
  add_node: "expand",
  remove_node: "simplify",
  replace_resource: "replace",
  replace_channel: "replace",
  add_synapse: "expand",
  remove_synapse: "disable",
  reorder_nodes: "reorder",
  change_strategy: "reorder",
  increase_verification: "expand",
  reduce_redundancy: "simplify",
});

function idOf(row) {
  return String(row?.id || row?.identity || "").trim();
}

export function qualifyCapability({
  resource = {},
  capability,
  probe,
  measurement,
  evidence = {},
  revalidated = false,
  now,
} = {}) {
  const declared = Boolean(capability) || (Array.isArray(resource.capabilities) && resource.capabilities.length > 0);
  const probed = probe?.attempted === true || probe?.executed === true || evidence.probed === true;
  const measured = evidence.executed === true
    && measurement != null
    && (measurement.status === "MEASURED" || Number.isFinite(measurement.value) || measurement.ok === true);
  const verified = evidence.verified === true && measured === true;
  const time = stampTime({ at: now, valid_until: evidence.valid_until || measurement?.valid_until });
  const expired = time.expired === true || evidence.expired === true;
  let state = declared ? "DECLARED" : "UNOBSERVED";
  if (probed) state = "PROBED";
  if (measured) state = "MEASURED";
  if (verified) state = "VERIFIED";
  if (expired) state = revalidated && measured ? "REVALIDATED" : "EXPIRED";
  return {
    identity: idOf(resource) || resource.provider || "UNKNOWN",
    capability: capability || (resource.capabilities || [])[0] || null,
    declared,
    probed,
    measured,
    verified,
    expired,
    state,
    declared_is_not_measured: true,
    measured_is_not_verified: true,
    verified_is_not_live: true,
    metrics: measured ? (measurement.metrics ?? { value: measurement.value ?? null, status: measurement.status }) : null,
    invented_metrics: false,
    grade: gradeEvidence({
      asserted: declared,
      observed: probed,
      measured,
      verified,
    }),
    live: false,
  };
}

export function findCognitivePaths({ task = {}, resources = [], measurements = {}, executed = false } = {}) {
  const classified = classifyTask(task);
  const required = classified.required;
  const discovery = discoverCognitiveCapabilities(task, resources);
  const route = routeByCapability({ task, resources });
  const graph = composeTaskGraph({ task, resources });
  const assembly = composeAssembly({
    task: classified.class,
    nodes: resources.map((row) => describeNode(row)),
    required,
  });
  const available = (resources || []).filter((row) => {
    const caps = row.capabilities || [];
    return required.some((need) => caps.includes(need));
  });
  const a = available[0] || null;
  const b = available[1] || null;
  const c = available[2] || null;
  const composed = composeCapabilities({
    parts: [a, b].filter(Boolean).map((row) => ({ name: idOf(row) })),
    name: "A+B",
  });
  const paths = [
    {
      id: "A",
      kind: "DIRECT",
      description: "A → result",
      nodes: a ? [idOf(a)] : [],
      covers: required,
      missing: a ? [] : required,
      measured: measurements.A?.measured === true,
      live: false,
    },
    {
      id: "A_B",
      kind: "COMPOSED",
      description: "A → B → result",
      nodes: [a, b].filter(Boolean).map(idOf),
      composition: composed.capability?.name || "A+B",
      covers: required,
      missing: a && b ? [] : required,
      measured: measurements.A_B?.measured === true,
      live: false,
    },
    {
      id: "A_B_C_FALSIFY",
      kind: "ADVERSARIAL",
      description: "A → B → C → falsify → result",
      nodes: [a, b, c].filter(Boolean).map(idOf),
      includes_falsification: true,
      covers: required,
      missing: a && b && c ? [] : required,
      measured: measurements.A_B_C_FALSIFY?.measured === true,
      live: false,
    },
  ];
  const ranked = measurements.measured === true && executed === true;
  let comparison = { ranked: false, better_in_general: false, verdict: "INCONCLUSIVE", live: false };
  if (ranked) {
    comparison = compareArchitectures({
      a: { architecture_id: "A", class: classified.class },
      b: { architecture_id: "A_B_C_FALSIFY", class: classified.class },
      measurements: {
        measured: true,
        a: measurements.A || measurements.a || {},
        b: measurements.A_B_C_FALSIFY || measurements.b || {},
        context: classified.class,
      },
    });
  }
  return {
    status: executed ? "MEASURED" : "PROPOSED",
    required,
    discovery: { required: discovery.required, count: (discovery.discovered || []).length },
    route: { status: route.status, selected: route.selected, missing: route.missing },
    paths,
    ranked,
    selected: ranked ? (comparison.winner?.architecture_id || null) : null,
    comparison,
    graph,
    assembly,
    better_without_evidence: false,
    better_in_general: false,
    live: false,
  };
}

export function mutateCognitiveGraph({ graph, op, node, architecture } = {}) {
  if (!GRAPH_OPS.includes(op)) {
    return { status: "INSUFFICIENT_EVIDENCE", op: op || null, adopted: false, live: false };
  }
  const nodes = (graph?.nodes || graph?.assembly?.nodes || [])
    .map((row) => (typeof row === "string" ? { id: row } : row));
  const arch = architecture || describeArchitecture({
    id: graph?.assembly?.assembly_id || graph?.task || "graph",
    nodes,
  });
  const mutation = mutateArchitecture(arch, { op: GRAPH_OP_TO_MUTATION[op], node });
  return {
    ...mutation,
    graph_op: op,
    mutation_op: GRAPH_OP_TO_MUTATION[op],
    adopted: false,
    hypothesis: true,
    live: false,
  };
}

export function describeCognitiveSynapse(input = {}) {
  const described = describeSynapse(input);
  if (!described.synapse) return { ...described, live: false };
  const proposed = proposeSynapse({
    from: input.source,
    to: input.target,
    reason: input.capability || input.purpose,
  });
  const time = stampTime({ at: input.at, valid_until: input.expires_at || input.valid_until });
  let state = "DISCOVERED";
  if (input.testing === true) state = "TESTING";
  if (input.active === true) state = "ACTIVE";
  if (input.disabled === true) state = "DISABLED";
  if (time.expired) state = "EXPIRED";
  return {
    status: described.status,
    synapse: {
      ...described.synapse,
      capability: input.capability || described.synapse.purpose,
      context: input.context || null,
      strength: described.synapse.weight,
      evidence: input.evidence || null,
      measurements: input.measurements || null,
      latency: input.latency ?? null,
      created_at: time.created_at,
      updated_at: time.observed_at || time.created_at,
      expires_at: time.valid_until,
      state,
      live: false,
    },
    proposed: proposed.status,
    live: false,
  };
}

export function experienceCognitiveSynapse({ synapse, outcome, at, now } = {}) {
  const plastic = plasticSynapse({ synapse, outcome, at, now });
  const measured = measureSynapse({ synapse, executed: outcome?.measured === true });
  let state = synapse?.state || "DISCOVERED";
  if (plastic.status === "EXPIRED") state = "EXPIRED";
  else if (plastic.action === "strengthen") state = "ACTIVE";
  else if (plastic.action === "weaken") state = "WEAKENED";
  else if (plastic.status === "INCONCLUSIVE") state = "TESTING";
  return {
    ...plastic,
    synapse: plastic.synapse ? { ...plastic.synapse, state, live: false } : null,
    measurement: measured,
    strengthen_only_by_measurement: true,
    live: false,
  };
}

export function rememberCognitiveExperience({
  task, context, resources, channels, capabilities, graph, strategy,
  prediction, execution, measurement, error, verification, outcome, evidence, at, expiry,
} = {}) {
  const remembered = rememberIntelligenceExperience({
    intelligence: Array.isArray(resources) ? (idOf(resources[0]) || resources[0]) : resources,
    capability: Array.isArray(capabilities) ? capabilities[0] : capabilities,
    result: outcome,
    failure: error,
    verification: verification || {},
    at,
  });
  const categorized = rememberCategorized({
    kind: error ? "FAILURE" : "EPISODIC",
    content: { task, strategy, outcome },
    at,
    valid_until: expiry,
  });
  return {
    status: remembered.status,
    experience: {
      task: task ?? null,
      context: context ?? null,
      resources: resources ?? [],
      channels: channels ?? [],
      capabilities: capabilities ?? [],
      graph: graph ?? null,
      strategy: strategy ?? null,
      prediction: prediction ?? null,
      execution: execution ?? null,
      measurement: measurement ?? null,
      error: error ?? null,
      verification: verification ?? null,
      outcome: outcome ?? null,
      evidence: evidence ?? null,
      timestamp: at || new Date().toISOString(),
      expiry: expiry || null,
      live: false,
    },
    remembered,
    categorized,
    learns_what_works: true,
    auto_promoted: false,
    live: false,
  };
}

export function runExperimentLab({
  hypothesis,
  experiment,
  executed = false,
  measured = false,
  verified = false,
  observation,
  contradiction = false,
  adopt = false,
  simulated = false,
} = {}) {
  const stored = storePrediction({ hypothesis, expected: experiment?.expected });
  const comparison = executed
    ? comparePrediction(stored.prediction, { actual: observation })
    : { status: "INCONCLUSIVE", live: false };
  const falsification = falsify({
    claim: hypothesis,
    observation,
    contradiction,
    evidence: { executed, verified },
  });
  const perspectives = adversarialPerspectives({
    claim: hypothesis,
    observation,
    evidence: { executed, verified },
  });
  let strategy = "PROPOSED";
  if (simulated) strategy = "SIMULATED";
  if (executed) strategy = "TESTED";
  if (measured && executed) strategy = "MEASURED";
  if (verified && measured && executed) strategy = "VERIFIED";
  const evolution = governEvolution({
    verified: verified === true && measured === true && executed === true,
    simulated,
    adopted: adopt,
  });
  const adopted = evolution.adopted === true;
  const reached = {
    HYPOTHESIS: true,
    EXPERIMENT: Boolean(experiment) || Boolean(hypothesis),
    EXECUTION: executed,
    MEASUREMENT: measured && executed,
    COMPARISON: executed,
    FALSIFICATION: executed,
    VERIFICATION: verified && executed,
    OPTIONAL_ADOPTION: adopted,
  };
  return {
    status: executed ? "EXECUTED" : "PROPOSED",
    stages: EXPERIMENT_STAGES.map((stage) => ({ stage, reached: reached[stage] === true, live: false })),
    strategy,
    hypothesis: stored,
    comparison,
    falsification,
    perspectives,
    evolution,
    adopted,
    silent_modification: false,
    auto_adopt: false,
    live: false,
  };
}

export function detectCommonMode(nodes = [], { answers, graph } = {}) {
  const common = commonModeFailure(nodes);
  const independence = independenceGraph(nodes, graph?.edges || []);
  const collusion = detectCollusion({ answers: answers || [], graph: independence });
  const models = new Set((nodes || []).map((row) => row.model || row.family || idOf(row)).filter(Boolean));
  return {
    status: "EXECUTED",
    COMMON_MODE_RISK: common.shared_provider || common.shared_host || common.shared_runtime,
    SOURCE_CORRELATION: common.shared_host,
    PROVIDER_CORRELATION: common.shared_provider,
    MODEL_CORRELATION: nodes.length > 1 && models.size === 1,
    EVIDENCE_CORRELATION: collusion.collusion === true,
    shared_provider: common.shared_provider,
    shared_host: common.shared_host,
    shared_runtime: common.shared_runtime,
    three_sentinels_are_not_three_sources: common.three_sentinels_are_not_three_sources,
    numeric_redundancy: common.numeric_redundancy,
    structural_redundancy: common.structural_redundancy,
    consensus_is_not_independence: true,
    collusion: collusion.collusion === true,
    live: false,
  };
}

export function cognitiveTrust({
  identity, provenance, security, capability, recency, reliability, evidence, behavior, context,
  evidence_strength, agreement, independent, measurement_quality, causal_support,
} = {}) {
  const confidence = cognitiveConfidence({
    evidence_strength: evidence_strength || evidence || "unscored",
    agreement: agreement || 0,
    independent: independent === true,
    measurement_quality: measurement_quality || capability || "unscored",
    recency: recency || "now",
    causal_support: causal_support === true,
  });
  return {
    status: "EXECUTED",
    dimensions: {
      IDENTITY: identity ?? "UNKNOWN",
      PROVENANCE: provenance ?? "UNKNOWN",
      SECURITY: security ?? "UNKNOWN",
      CAPABILITY: capability ?? "UNKNOWN",
      RECENCY: recency ?? "UNKNOWN",
      RELIABILITY: reliability ?? "UNKNOWN",
      EVIDENCE: evidence ?? "UNKNOWN",
      BEHAVIOR: behavior ?? "UNKNOWN",
      CONTEXT: context ?? "UNKNOWN",
    },
    confidence: confidence.dimensions,
    single_number: null,
    score: null,
    excellent_in_one_is_not_verified_in_another: true,
    live: false,
  };
}

export function cognitiveBudget({ risk = "LOW_RISK", consequence = "low", uncertainty = "KNOWN", paths } = {}) {
  const key = String(risk || "LOW_RISK").toUpperCase().replace(/\s+/g, "_");
  const tier = BUDGET_TIERS[key] || BUDGET_TIERS.LOW_RISK;
  const redundancy = redundancyOf({
    paths: paths ?? tier.resources,
    uncertainty: key === "AMBIGUOUS" || key === "MEDIUM" ? "UNCERTAIN" : uncertainty,
    consequence: key === "CRITICAL" ? "high" : consequence,
  });
  const budget = uncertaintyBudget({
    known: ["LOW_RISK", "SIMPLE", "LOW"].includes(key) ? ["task"] : [],
    unknown: ["AMBIGUOUS", "MEDIUM", "CRITICAL"].includes(key) ? ["UNKNOWN"] : [],
  });
  return {
    status: "EXECUTED",
    risk: BUDGET_TIERS[key] ? key : "LOW_RISK",
    resources: tier.resources,
    verify: tier.verify === true,
    falsify: tier.falsify === true,
    independent: tier.independent === true,
    redundancy,
    uncertainty: budget,
    uses_entire_network: false,
    live: false,
  };
}

export function recoverFromLoss({ lost, nodes = [], required = ["review"], graph } = {}) {
  const failedNode = Array.isArray(lost) ? lost[0] : lost;
  const radius = blastRadius({
    lost: Array.isArray(lost) ? lost : [lost].filter(Boolean),
    graph: graph || { nodes: (nodes || []).map((row) => ({ id: idOf(row) })) },
  });
  const reroute = resilientReroute({ failedNode, nodes, required });
  return {
    status: reroute.continued ? "CONTINUED" : "HOLD_HUMAN",
    lost: failedNode,
    alternative: reroute.remaining,
    blast: radius,
    reroute,
    substitution_traced: true,
    silent_fallback: false,
    live: false,
  };
}

export function expireCognitiveKnowledge({
  kind = "measurement",
  was,
  is,
  valid_until,
  issued_at,
  now,
  ttl_ms,
  superseded_by,
  contradicted,
  revoked,
} = {}) {
  const stamp = now || new Date().toISOString();
  const time = stampTime({ at: stamp, valid_until });
  const life = expireEvidence({
    evidence: { issued_at: issued_at || was },
    now: Date.parse(stamp),
    issued_at: issued_at || was,
    ttl_ms,
    superseded_by,
    contradicted,
    revoked,
  });
  const temporal = temporalCognition({ was, is, expired: life.status, at: stamp });
  return {
    kind,
    time,
    life,
    temporal,
    expired: time.expired === true || life.status === "EXPIRED",
    expired_is_not_false: life.was_false === false,
    sufficient_for_current_state: life.sufficient_for_current_state,
    live: false,
  };
}

export function admitUnknownIntelligence(entry = {}) {
  const found = discoverUnknownIntelligence({
    id: entry.id || "UNKNOWN",
    provider: entry.provider || "UNKNOWN",
    capabilities: entry.capabilities || ["CAPABILITY_UNKNOWN"],
  });
  const channels = discoverIntelligenceChannels(
    { provider: "UNKNOWN", model: "UNKNOWN", channel: "UNKNOWN" },
    entry.world || measureWorld({ env: entry.env || {} }),
  );
  return {
    status: "DISCOVERED",
    provider: "UNKNOWN",
    model: "UNKNOWN",
    channel: channels.state,
    found,
    cortex_modified: found.cortex_modified === true,
    live: false,
  };
}

function architectureCandidate({ kind, nodes, edges = [], required = [], verification, risks = [], plan = {} } = {}) {
  const described = describeArchitecture({
    id: `arch_${String(kind || "simple").toLowerCase()}`,
    class: "unknown",
    nodes,
    synapses: edges,
    verification: verification || "none",
  });
  return {
    kind,
    architecture_id: described.architecture_id,
    nodes: described.nodes,
    edges,
    capabilities: required,
    resources: described.nodes.map((row) => row.identity),
    channels: described.nodes.map((row) => row.channel).filter(Boolean),
    dependencies: edges.map((edge) => ({ from: edge.source, to: edge.target })),
    expected_behavior: kind,
    risks,
    verification_plan: plan.verification || (verification && verification !== "none" ? [verification] : []),
    measurement_plan: plan.measurement || ["outcome"],
    hypothesis: true,
    better_in_general: false,
    adopted: false,
    live: false,
    architecture: described,
  };
}

export function analyzeIndependence(nodes = [], extra = {}) {
  const common = detectCommonMode(nodes, extra);
  const upstream = new Set((nodes || []).map((row) => row.upstream || row.training_source || row.provider || "unknown"));
  const evidence = new Set((nodes || []).map((row) => row.evidence_source || extra.evidence_source || "unknown"));
  const gateway = new Set((nodes || []).map((row) => row.gateway || row.channel || "unknown"));
  const family = new Set((nodes || []).map((row) => row.model_family || row.family || row.model || "unknown"));
  return {
    ...common,
    FALSE_DIVERSITY: common.COMMON_MODE_RISK === true && (nodes || []).length > 1,
    SHARED_UPSTREAM: (nodes || []).length > 1 && upstream.size === 1,
    SHARED_EVIDENCE: (nodes || []).length > 1 && evidence.size === 1,
    SHARED_FAILURE: common.shared_runtime === true || common.shared_host === true,
    SHARED_GATEWAY: (nodes || []).length > 1 && gateway.size === 1,
    SHARED_FAMILY: (nodes || []).length > 1 && family.size === 1,
    two_models_are_not_two_proofs: true,
    live: false,
  };
}

export function discoverCognitiveArchitectures({
  task = {},
  resources = [],
  constraints = {},
  library = [],
  measurements = {},
} = {}) {
  const classified = classifyTask(task);
  const required = classified.required;
  const risk = task.risk || constraints.risk || "LOW_RISK";
  const budget = cognitiveBudget({
    risk,
    consequence: task.consequence || constraints.consequence,
    uncertainty: task.uncertainty || constraints.uncertainty,
  });
  const pool = (resources || []).map((row) => describeNode(row));
  const generated = generateArchitectures({
    class: classified.class,
    nodes: pool,
    required,
    budget: { money: constraints.cost_budget ?? 0 },
  });
  const covering = pool.filter((row) =>
    required.some((cap) => (row.capabilities || []).includes(cap))
    || row.kind === "local"
    || row.identity === "cortex-local"
    || row.identity === "carl",
  );
  const primary = covering[0] || describeNode({ id: "cortex-local", kind: "local", capabilities: required, presence: "ACTIVE" });
  const secondary = covering.find((row) => row.identity !== primary.identity) || null;
  const tertiary = covering.find((row) => row.identity !== primary.identity && row.identity !== secondary?.identity) || null;
  const verifier = pool.find((row) => row.kind === "verifier") || secondary;
  const critic = pool.find((row) => row.kind === "critic") || tertiary;
  const human = pool.find((row) => row.identity === "carl") || describeNode({ id: "carl", kind: "human", capabilities: ["judgment"] });
  const candidates = [];
  const stages_reached = [];

  candidates.push(architectureCandidate({
    kind: "SIMPLE",
    nodes: [primary],
    edges: [{ source: "task", target: primary.identity, purpose: "execute" }],
    required,
    verification: "none",
    risks: ["single_point_of_failure"],
    plan: { verification: [], measurement: ["outcome"] },
  }));
  stages_reached.push("ONE_RESOURCE");

  const trivial = budget.resources <= 1 && budget.verify !== true && budget.falsify !== true
    && constraints.evidence_requirement !== "high";
  if (!trivial) {
    if (secondary && budget.resources >= 2) {
      candidates.push(architectureCandidate({
        kind: "DUAL",
        nodes: [primary, secondary],
        edges: [
          { source: "task", target: primary.identity, purpose: "execute" },
          { source: "task", target: secondary.identity, purpose: "parallel" },
          { source: primary.identity, target: "synthesis", purpose: "synthesize" },
          { source: secondary.identity, target: "synthesis", purpose: "synthesize" },
        ],
        required,
        verification: "synthesis",
        risks: ["false_diversity"],
        plan: { verification: ["synthesis"], measurement: ["consistency"] },
      }));
      stages_reached.push("TWO_RESOURCES");
    }
    if (budget.verify === true || budget.independent === true) {
      candidates.push(architectureCandidate({
        kind: "SPECIALIST",
        nodes: [primary, verifier, human].filter(Boolean),
        edges: [
          { source: "research", target: "reasoning", purpose: "specialize" },
          { source: "reasoning", target: primary.identity, purpose: "execute" },
          { source: primary.identity, target: (verifier || human).identity, purpose: "verify" },
        ],
        required,
        verification: "independent",
        risks: ["capability_mismatch"],
        plan: { verification: ["independent"], measurement: ["verification_success"] },
      }));
      stages_reached.push("SPECIALIST");
      stages_reached.push("VERIFICATION");
    }
    if (budget.falsify === true) {
      candidates.push(architectureCandidate({
        kind: "ADVERSARIAL",
        nodes: [primary, critic, verifier, human].filter(Boolean),
        edges: [
          { source: primary.identity, target: (critic || human).identity, purpose: "challenge" },
          { source: (critic || human).identity, target: (verifier || human).identity, purpose: "falsify" },
        ],
        required,
        verification: "adversarial",
        risks: ["common_mode"],
        plan: { verification: ["falsification"], measurement: ["error"] },
      }));
      stages_reached.push("ADVERSARIAL");
    }
    if (budget.resources >= 3) {
      candidates.push(architectureCandidate({
        kind: "ENSEMBLE",
        nodes: [primary, secondary, tertiary, verifier, human].filter(Boolean),
        edges: [
          { source: primary.identity, target: "synthesis", purpose: "vote" },
          { source: (secondary || primary).identity, target: "synthesis", purpose: "vote" },
          { source: (tertiary || primary).identity, target: "synthesis", purpose: "vote" },
          { source: "synthesis", target: (verifier || human).identity, purpose: "verify" },
        ],
        required,
        verification: "ensemble",
        risks: ["false_diversity", "cost"],
        plan: { verification: ["ensemble"], measurement: ["consistency", "error"] },
      }));
      stages_reached.push("ENSEMBLE");
    }
  }

  candidates.push(architectureCandidate({
    kind: "RECOVERY",
    nodes: [primary, secondary || describeNode({ id: "cortex-local", kind: "local", capabilities: required, presence: "ACTIVE" })],
    edges: [
      { source: primary.identity, target: "failure", purpose: "detect" },
      { source: "failure", target: (secondary || { identity: "cortex-local" }).identity, purpose: "reroute" },
    ],
    required,
    verification: "recovery",
    risks: ["unverified_substitute"],
    plan: { verification: ["probe"], measurement: ["recovery_success"] },
  }));

  const limited = candidates.slice(0, 6);
  const searched = searchArchitectures({
    graphs: limited.map((row) => ({ assembly: { assembly_id: row.architecture_id } })),
    metrics: measurements,
  });
  const selected = selectArchitecture({
    candidates: limited.map((row) => row.architecture),
    library,
    measured: measurements.measured === true,
    class: classified.class,
  });
  return {
    status: "PROPOSED",
    required,
    budget,
    stages_reached,
    brute_force: false,
    stopped_early: trivial === true,
    candidates: limited,
    generated: (generated.candidates || []).map((row) => row.architecture_id),
    search: searched,
    selected: selected.architecture
      ? { architecture_id: selected.architecture.architecture_id, adopted: false, reused_pattern: selected.reused_pattern }
      : null,
    adopted: false,
    auto_adopt: false,
    better_in_general: false,
    live: false,
  };
}

export function compareCognitiveArchitectures({ architectures = [], measurements = {}, metric } = {}) {
  if (!metric) {
    return { status: "INCONCLUSIVE", reason: "METRIC_REQUIRED", ranked: false, better_in_general: false, live: false };
  }
  if (measurements.measured !== true) {
    return { status: "INCONCLUSIVE", reason: "EXPERIMENT_REQUIRED", ranked: false, better_in_general: false, live: false };
  }
  const [first, second] = architectures;
  if (!first || !second) {
    return { status: "INSUFFICIENT_EVIDENCE", ranked: false, better_in_general: false, live: false };
  }
  const comparison = compareArchitectures({
    a: first.architecture || first,
    b: second.architecture || second,
    measurements,
  });
  return {
    ...comparison,
    metric,
    ranked: comparison.status === "MEASURED",
    better_in_general: false,
    live: false,
  };
}

export function selectCognitiveStrategy({ task = {}, context = {}, budget, independence, evidence } = {}) {
  const b = budget || cognitiveBudget({ risk: task.risk || "LOW_RISK" });
  let move = "ANSWER_DIRECTLY";
  if (context.needs_research === true) move = "RESEARCH";
  if (b.resources >= 2 || b.risk === "AMBIGUOUS" || b.risk === "MEDIUM") move = "SECOND_OPINION";
  if (b.independent === true) move = "SPECIALISTS";
  if (b.falsify === true || independence?.FALSE_DIVERSITY === true) move = "FALSIFY";
  if (evidence?.insufficient === true) move = "EXPERIMENT";
  if (context.overcomplex === true) move = "REDUCE_COMPLEXITY";
  return {
    status: "PROPOSED",
    move,
    moves: STRATEGY_MOVES,
    proof: {
      budget: b.risk,
      resources: b.resources,
      independence: independence?.FALSE_DIVERSITY === true,
    },
    measured: false,
    adopted: false,
    live: false,
  };
}

export function challengeCognitiveArchitecture({ architecture, nodes, graph } = {}) {
  const nodeList = architecture?.nodes || nodes || [];
  const ids = nodeList.map(idOf).filter(Boolean);
  const radius = blastRadius({
    lost: ids.slice(0, 1),
    graph: graph || { nodes: nodeList.map((row) => ({ id: idOf(row), single_point: nodeList.length <= 1 })) },
  });
  const independence = analyzeIndependence(nodeList);
  const findings = [];
  if (nodeList.length <= 1) findings.push("single_point_of_failure");
  if (independence.FALSE_DIVERSITY) findings.push("common_mode");
  if (independence.SHARED_UPSTREAM) findings.push("hidden_dependency");
  if (!architecture?.verification || architecture.verification === "none") findings.push("measurement_gap");
  if (nodeList.some((row) => row.authority === true && idOf(row) !== "carl")) findings.push("authority_violation");
  if (!(architecture?.verification_plan || []).length && architecture?.kind === "SIMPLE") findings.push("unsupported_assumption");
  const alternative = mutateCognitiveGraph({
    architecture: architecture?.architecture || architecture,
    op: "expand",
  });
  return {
    status: "EXECUTED",
    weakest_node: ids[0] || null,
    single_point_of_failure: nodeList.length <= 1,
    findings,
    independence,
    blast: radius,
    alternative: alternative.mutation
      ? { architecture_id: alternative.mutation.architecture_id, adopted: false, hypothesis: true }
      : null,
    adopted: false,
    live: false,
  };
}

export function rememberCognitiveFailure({ kind = "strategy_failed", subject, at, valid_until } = {}) {
  const kinds = [
    "strategy_failed", "resource_failed", "channel_failed", "verification_failed",
    "common_mode_detected", "architecture_falsified", "recovery_failed",
  ];
  const categorized = rememberCategorized({
    kind: "FAILURE",
    content: { failure: kind, subject },
    at,
    valid_until,
  });
  return {
    status: "RECORDED",
    kind: kinds.includes(kind) ? kind : "strategy_failed",
    subject: subject || null,
    temporal: true,
    do_not_repeat_blindly: true,
    expired_is_not_permanent: true,
    live: false,
    entry: categorized.entry || categorized,
  };
}

export function falsifyCognitiveArchitecture({
  architecture,
  hypothesis,
  observation,
  contradiction = false,
  executed = false,
  measured = false,
  verified = false,
} = {}) {
  const lab = runExperimentLab({
    hypothesis: hypothesis || architecture?.kind || architecture?.architecture_id,
    experiment: { expected: architecture?.expected_behavior },
    observation,
    contradiction,
    executed,
    measured,
    verified,
    adopt: false,
  });
  const failure = lab.falsification?.refuted === true
    ? rememberCognitiveFailure({ kind: "architecture_falsified", subject: architecture?.architecture_id })
    : null;
  return {
    ...lab,
    architecture_id: architecture?.architecture_id || null,
    negative_knowledge: Boolean(failure),
    failure,
    adopted: false,
    live: false,
  };
}

export function rememberCognitiveStrategy({
  task_class, required, architecture, measurements, outcome, evidence, at, expiry,
} = {}) {
  const pattern = rememberPattern({
    architecture: architecture?.architecture || architecture,
    context: task_class,
    measured: measurements?.measured === true,
    at,
  });
  const time = stampTime({ at, valid_until: expiry });
  return {
    status: pattern.status,
    strategy: {
      task_class: task_class || null,
      required_capabilities: required || [],
      architecture_id: architecture?.architecture_id || architecture?.id || null,
      measurements: measurements || null,
      outcome: outcome || null,
      evidence: evidence || null,
      expiry: time.valid_until,
      expired: time.expired,
      historical_is_not_guarantee: true,
      live: false,
    },
    pattern,
    library: architectureLibrary(pattern.pattern ? [pattern.pattern] : []),
    live: false,
  };
}

export function discoverCognitivePattern({ before, after, measurements, repeated = false, verified = false, traced = false } = {}) {
  const ok = measurements?.measured === true && repeated === true && verified === true && traced === true;
  return {
    status: ok ? "DISCOVERED" : "INCONCLUSIVE",
    pattern: ok
      ? { kind: "NEW_COGNITIVE_PATTERN", before: before || null, after: after || null, live: false }
      : null,
    measured: measurements?.measured === true,
    repeatable: repeated === true,
    verifiable: verified === true,
    traceable: traced === true,
    adopted: false,
    live: false,
  };
}

export function architectureProvenance({
  architecture, task, experiment, measurements, falsification, verification, at,
} = {}) {
  const time = stampTime({ at });
  return {
    architecture_id: architecture?.architecture_id || null,
    task: task || null,
    resources: architecture?.resources || [],
    channels: architecture?.channels || [],
    capabilities: architecture?.capabilities || [],
    strategy: architecture?.kind || null,
    experiment: experiment || null,
    measurements: measurements || null,
    falsification: falsification || null,
    verification: verification || null,
    timestamp: time.created_at,
    versions: { discovery: DISCOVERY_VERSION },
    dependencies: architecture?.dependencies || [],
    limitations: architecture?.risks || [],
    works_in_general: false,
    live: false,
  };
}

export function recomposeCognitiveArchitecture({ lost, nodes = [], required = ["review"], graph } = {}) {
  const recovered = recoverFromLoss({ lost, nodes, required, graph });
  return {
    ...recovered,
    recomposed: recovered.status === "CONTINUED",
    rebuilt_system: false,
    live: false,
  };
}

function genomeDigest(body) {
  return createHash("sha256").update(JSON.stringify(body ?? null)).digest("hex").slice(0, 16);
}

export function classifyEmergence({
  parts = [],
  catalog = [],
  measurements = {},
  extra_property = false,
  reproduced = false,
} = {}) {
  const named = new Set((catalog || []).map((row) => row.capability || row.name || row).filter(Boolean));
  const labels = (parts || []).map((row) => row.capability || row.name || row);
  if (labels.length <= 1 && labels.every((label) => named.has(label))) {
    return {
      class: "KNOWN_CAPABILITY",
      state: "OBSERVED",
      emergent: false,
      candidate: false,
      live: false,
    };
  }
  const measured = measurements.measured === true;
  const extra = extra_property === true
    || (Number.isFinite(measurements.synergy) && measurements.synergy > 0);
  if (!measured || !extra) {
    return {
      class: "COMPOSITION",
      state: measured ? "MEASURED" : "OBSERVED",
      emergent: false,
      candidate: false,
      reason: measured ? "NO_EXTRA_PROPERTY" : "UNMEASURED_COMBINATION_IS_NOT_EMERGENCE",
      live: false,
    };
  }
  const inCatalog = labels.every((label) => named.has(label)) && named.has(labels.join("+"));
  return {
    class: inCatalog ? "SYNERGY" : "EMERGENT_CANDIDATE",
    state: reproduced === true ? "REPRODUCED" : "CANDIDATE",
    emergent: false,
    candidate: true,
    verified: false,
    live: false,
  };
}

export function measureBaselines({ parts = [], measurements = {}, combined } = {}) {
  const singles = (parts || []).map((part) => {
    const id = part.id || part.capability || part;
    return { id, value: measurements[id] ?? null, measured: measurements[id] != null };
  });
  const pairs = [];
  for (let i = 0; i < (parts || []).length; i += 1) {
    for (let j = i + 1; j < parts.length; j += 1) {
      const key = `${parts[i].id || parts[i].capability || parts[i]}+${parts[j].id || parts[j].capability || parts[j]}`;
      pairs.push({ id: key, value: measurements[key] ?? null, measured: measurements[key] != null });
    }
  }
  const combinedValue = combined ?? measurements.combined ?? null;
  return {
    status: singles.length && singles.every((row) => row.measured) ? "MEASURED" : "INCOMPLETE",
    singles,
    pairs,
    combined: { value: combinedValue, measured: combinedValue != null },
    incomplete_baseline_blocks_emergence: singles.length === 0 || singles.some((row) => !row.measured),
    live: false,
  };
}

export function measureSynergy({
  baseline = {},
  combined,
  metric,
  uncertainty,
  sample_size,
  conditions,
  limitations = [],
} = {}) {
  if (!metric) {
    return { status: "INCONCLUSIVE", reason: "METRIC_REQUIRED", invented_formula: false, universal_formula: false, live: false };
  }
  if (combined == null || baseline.expected == null) {
    return { status: "INCONCLUSIVE", reason: "BASELINE_REQUIRED", invented_formula: false, live: false };
  }
  return {
    status: "MEASURED",
    baseline,
    combined_result: combined,
    metric,
    synergy: Number(combined) - Number(baseline.expected),
    uncertainty: uncertainty ?? null,
    sample_size: sample_size ?? null,
    conditions: conditions ?? null,
    limitations,
    invented_formula: false,
    universal_formula: false,
    live: false,
  };
}

export function reproduceEmergence({ observations = [], independent = false } = {}) {
  const measured = (observations || []).filter((row) => row.measured === true);
  if (measured.length < 2) {
    return { status: "CANDIDATE", reproduced: false, reason: "SINGLE_OBSERVATION", live: false };
  }
  const same = measured.every((row) => JSON.stringify(row.outcome) === JSON.stringify(measured[0].outcome));
  return {
    status: same ? "REPRODUCED" : "FALSIFIED",
    reproduced: same,
    independent: independent === true,
    sample_size: measured.length,
    live: false,
  };
}

export function discoverEmergentCapabilities({
  resources = [],
  capabilities = [],
  synapses = [],
  cognitive_architectures = [],
  experiments = [],
  measurements = {},
  memory,
  context,
  catalog,
  extra_property = false,
  now,
} = {}) {
  const catalogList = catalog || capabilities || [];
  const parts = (capabilities || []).map((row) => (typeof row === "string" ? { capability: row } : row));
  const composed = composeCapabilities({ parts, name: parts.map((row) => row.capability).join("+") });
  const baselines = measureBaselines({ parts, measurements, combined: measurements.combined });
  const classified = classifyEmergence({
    parts,
    catalog: catalogList,
    measurements,
    extra_property: extra_property && baselines.incomplete_baseline_blocks_emergence !== true,
    reproduced: measurements.reproduced === true,
  });
  const time = stampTime({ at: now, valid_until: measurements.valid_until });
  const candidates = [];
  if (classified.candidate === true) {
    candidates.push({
      capability_id: `emergent_${genomeDigest({ parts: composed.capability.name, at: time.created_at })}`,
      description: composed.capability.name,
      origin_resources: (resources || []).map(idOf).filter(Boolean),
      origin_capabilities: parts.map((row) => row.capability),
      origin_synapses: (synapses || []).map((row) => row.synapse?.synapse_id || row.synapse_id).filter(Boolean),
      architecture: cognitive_architectures[0]?.architecture_id || cognitive_architectures[0]?.kind || null,
      context: context || null,
      observations: measurements.observations || null,
      measurements: measurements.measured === true ? measurements : null,
      evidence: measurements.evidence || null,
      reproducibility: measurements.reproduced === true ? "REPRODUCED" : "CANDIDATE",
      confidence: null,
      state: classified.state,
      class: classified.class,
      created_at: time.created_at,
      expires_at: time.valid_until,
      limitations: baselines.incomplete_baseline_blocks_emergence
        ? ["incomplete_baseline"]
        : ["not_verified", "not_authority"],
      verified: false,
      live: false,
    });
  }
  return {
    status: "EXECUTED",
    composed,
    baselines,
    classified,
    candidates,
    experiments: experiments || [],
    memory: memory || null,
    observed_is_not_verified: true,
    emergence_is_not_proof: true,
    live: false,
  };
}

export function expireEmergentCapability({ candidate, now, model_changed = false } = {}) {
  const expiry = expireCognitiveKnowledge({
    kind: "measurement",
    issued_at: candidate?.created_at,
    now,
    ttl_ms: 86_400_000,
  });
  const expired = expiry.expired === true || model_changed === true;
  return {
    status: expired ? "REVALIDATION_REQUIRED" : expiry.status,
    expired,
    revalidation_required: expired,
    eternally_true: false,
    live: false,
  };
}

export function synapticFitness({ synapse, success, failure, latency, reliability, verification, context_fit } = {}) {
  return {
    status: "EXECUTED",
    synapse_id: synapse?.synapse_id || null,
    dimensions: {
      success: success ?? null,
      failure: failure ?? null,
      latency: latency ?? null,
      reliability: reliability ?? null,
      verification: verification ?? null,
      context_fit: context_fit ?? null,
    },
    score: null,
    magic_score: false,
    live: false,
  };
}

export function evolveCognitiveSynapse({ synapse, op = "strengthen", outcome, at, now } = {}) {
  if (!PLASTICITY_OPS.includes(op)) {
    return { status: "INSUFFICIENT_EVIDENCE", op, adopted: false, live: false };
  }
  if (op === "reactivate") {
    return {
      status: "PROPOSED",
      action: "reactivate",
      synapse: synapse ? { ...synapse, state: "RECOVERING", live: false } : null,
      adopted: false,
      live: false,
    };
  }
  if (op === "split" || op === "merge") {
    return { ...mutateCognitiveGraph({ op, architecture: synapse }), adopted: false, live: false };
  }
  const experienced = experienceCognitiveSynapse({
    synapse,
    outcome: outcome || { measured: true, success: op === "strengthen" },
    at,
    now,
  });
  return { ...experienced, adopted: false, live: false };
}

export function describeCognitiveGenome({
  resources = [],
  capabilities = [],
  synapses = [],
  architecture,
  strategies = [],
  constraints = [],
  verification_rules = [],
  parents,
  mutation,
  context,
  measurements,
  version = 1,
} = {}) {
  const genome = {
    resources: (resources || []).map(idOf).filter(Boolean),
    capabilities,
    synapses: (synapses || []).map((row) => row.synapse?.synapse_id || row.synapse_id || row.id).filter(Boolean),
    architecture: architecture?.architecture_id || architecture || null,
    strategies,
    constraints,
    verification_rules,
  };
  return {
    version,
    digest: genomeDigest(genome),
    parents: parents || [],
    mutation: mutation || null,
    context: context || null,
    measurements: measurements || null,
    genome,
    live: false,
  };
}

export function compareCognitiveGenomes({ a, b } = {}) {
  if (!a || !b) return { status: "INSUFFICIENT_EVIDENCE", changed: [], better_in_general: false, live: false };
  const keys = ["resources", "capabilities", "synapses", "architecture", "strategies", "constraints", "verification_rules"];
  const bodyA = a.genome || a;
  const bodyB = b.genome || b;
  const changed = keys.filter((key) => JSON.stringify(bodyA[key] ?? null) !== JSON.stringify(bodyB[key] ?? null));
  return {
    status: "MEASURED",
    same_digest: a.digest === b.digest,
    changed,
    better_in_general: false,
    live: false,
  };
}

export function proposeCognitiveMutation({ genome, kind, payload } = {}) {
  if (!MUTATION_KINDS.includes(kind)) {
    return { status: "INSUFFICIENT_EVIDENCE", kind: kind || null, adopted: false, live: false };
  }
  const mutated = mutateCognitiveGraph({
    architecture: genome?.architecture || genome,
    op: MUTATION_TO_GRAPH_OP[kind],
    node: payload?.node,
  });
  return {
    status: "PROPOSED",
    kind,
    mutation: mutated,
    sandbox: true,
    adopted: false,
    live: false,
  };
}

export function safeEvolutionLoop({ current, mutation, measurements = {}, verified = false, simulated = true } = {}) {
  const proposed = mutation?.status === "PROPOSED" ? mutation : proposeCognitiveMutation(mutation || {});
  const lab = runExperimentLab({
    hypothesis: proposed.kind || "mutation",
    executed: measurements.executed === true,
    measured: measurements.measured === true,
    verified,
    adopt: false,
    simulated,
  });
  const evolved = safeEvolve({
    baseline: current,
    candidate: proposed,
    verification: { verified, measured: measurements.measured === true },
    previous: current,
  });
  const governed = governEvolution({ verified, simulated, adopted: false, reversible: true });
  return {
    status: "PROPOSED",
    current_preserved: true,
    candidate: proposed,
    experiment: lab,
    evolution: evolved,
    governed,
    adopted: false,
    reversible: true,
    live: false,
    auto_merge: false,
  };
}

export function compareMutations({ a, b, measurements = {}, metric, conditions } = {}) {
  if (!metric) {
    return { status: "INCONCLUSIVE", reason: "METRIC_REQUIRED", better_in_general: false, live: false };
  }
  if (measurements.measured !== true) {
    return { status: "INCONCLUSIVE", reason: "EXPERIMENT_REQUIRED", better_in_general: false, live: false };
  }
  const aScore = Number(measurements.a ?? 0);
  const bScore = Number(measurements.b ?? 0);
  return {
    status: "MEASURED",
    metric,
    conditions: conditions || null,
    uncertainty: measurements.uncertainty ?? null,
    verdict: aScore === bScore ? "INCONCLUSIVE" : (bScore > aScore ? "B_BETTER_IN_CONTEXT" : "A_BETTER_IN_CONTEXT"),
    better_in_general: false,
    live: false,
  };
}

export function groupEmergentFunctions({ candidates = [] } = {}) {
  const verified = (candidates || []).filter((row) => row.state === "VERIFIED" && row.reproduced === true);
  return {
    status: verified.length ? "PROPOSED" : "INCONCLUSIVE",
    functions: verified.map((row) => ({
      kind: "COGNITIVE_FUNCTION",
      capability: row.capability_id,
      organ_candidate: true,
      live: false,
    })),
    second_cortex: false,
    second_runtime: false,
    new_authority: false,
    new_mesh: false,
    new_governance: false,
    live: false,
  };
}

export function emergenceAuthority({ candidate } = {}) {
  return {
    capability: candidate?.capability_id || null,
    authority: false,
    can_modify_breaker: false,
    can_merge: false,
    can_change_governance: false,
    can_bypass_defense: false,
    can_access_secrets: false,
    capability_is_not_authority: true,
    live: false,
  };
}

export function watchEvolution({ mutation, grant = {}, unexpected = false, integrity_changed = false } = {}) {
  const findings = [];
  if (mutation?.adopted === true && grant.actor !== "carl") findings.push("unsafe_mutation");
  if (grant.authority === true) findings.push("authority_escalation");
  if (grant.breaker === true) findings.push("breaker_bypass");
  if (grant.defense_bypass === true) findings.push("defense_bypass");
  if (grant.secrets === true) findings.push("secret_access");
  if (integrity_changed === true) findings.push("integrity_change");
  if (unexpected === true) findings.push("unexpected_behavior");
  return {
    status: findings.length ? "CONTAINED" : "EXECUTED",
    findings,
    blocked: findings.length > 0,
    defense_continues: true,
    live: false,
  };
}

export function describeSelfKnowledge({ qualifications = [], failures = [] } = {}) {
  const of = (predicate) => (qualifications || []).filter(predicate).map((row) => row.capability).filter(Boolean);
  return {
    can_do: of((row) => row.measured === true),
    think_i_can_do: of((row) => row.declared === true && row.measured !== true),
    verified_i_can_do: of((row) => row.verified === true),
    cannot_do: of((row) => row.state === "FAILED"),
    never_tested: of((row) => row.state === "DECLARED" || row.state === "UNOBSERVED"),
    recently_failed: failures || [],
    expired: of((row) => row.expired === true),
    categories_distinct: true,
    live: false,
  };
}

export function discoverCognitiveBlindSpots({
  qualifications = [],
  resources = [],
  architectures = [],
  assumptions = [],
} = {}) {
  const findings = [];
  if ((qualifications || []).some((row) => row.measured !== true)) findings.push("capability_not_tested");
  if ((qualifications || []).some((row) => row.expired === true)) findings.push("capability_old");
  const providers = new Set((resources || []).map((row) => row.provider).filter(Boolean));
  const models = new Set((resources || []).map((row) => row.model || row.id).filter(Boolean));
  const channels = new Set((resources || []).map((row) => row.channel).filter(Boolean));
  if (providers.size === 1 && (resources || []).length > 1) findings.push("single_provider_dependency");
  if (models.size === 1 && (resources || []).length > 1) findings.push("single_model_dependency");
  if (channels.size === 1 && (resources || []).length > 1) findings.push("single_channel_dependency");
  if ((assumptions || []).some((row) => row.verified !== true)) findings.push("unverified_assumption");
  if (!(architectures || []).some((row) => row.kind === "ADVERSARIAL" || row.kind === "ENSEMBLE")) {
    findings.push("unexplored_configuration");
  }
  if ((qualifications || []).every((row) => row.grade !== "VERIFIED")) findings.push("single_evidence_source");
  return { status: "EXECUTED", findings, live: false };
}

export function prioritizeExperiments({ candidates = [] } = {}) {
  return {
    status: "PROPOSED",
    ranked: (candidates || []).map((row) => ({
      id: row.id || null,
      components: {
        expected_information_gain: row.information_gain ?? null,
        risk: row.risk ?? null,
        cost: row.cost ?? null,
        latency: row.latency ?? null,
        uncertainty: row.uncertainty ?? null,
        strategic_value: row.strategic_value ?? null,
      },
      opaque_score: null,
    })),
    opaque_score: false,
    live: false,
  };
}

export function proposeCognitiveCuriosity({ unknown, hypothesis } = {}) {
  return {
    status: "PROPOSED",
    unknown: unknown || "UNKNOWN",
    hypothesis: hypothesis || null,
    experiment: { status: "HYPOTHESIS" },
    adopted: false,
    live: false,
  };
}

export function discoveryMetrics(cycle = {}) {
  const intel = cycle.intelligence || {};
  const counts = intel.counts || {};
  const qualifications = cycle.qualifications || [];
  const synapses = cycle.synapses || [];
  const experiments = cycle.experiment ? [cycle.experiment] : [];
  const countOrUnknown = (value) => (typeof value === "number" ? value : "NOT_MEASURED");
  return {
    intelligences_named: countOrUnknown(counts.named),
    intelligences_discovered: countOrUnknown(counts.identified),
    channels_discovered: countOrUnknown(counts.channel_discovered),
    channels_callable: countOrUnknown(counts.callable),
    capabilities_declared: qualifications.filter((row) => row.declared).length,
    capabilities_measured: qualifications.filter((row) => row.measured).length,
    capabilities_verified: qualifications.filter((row) => row.verified).length,
    resources_executed: typeof counts.executed === "number" ? counts.executed : 0,
    resources_verified: typeof counts.verified === "number" ? counts.verified : 0,
    cognitive_graphs_created: cycle.paths?.graph ? 1 : 0,
    synapses_active: synapses.filter((row) => row.synapse?.state === "ACTIVE").length,
    synapses_expired: synapses.filter((row) => row.synapse?.state === "EXPIRED").length,
    experiments_run: experiments.filter((row) => row.status === "EXECUTED").length,
    experiments_verified: experiments.filter((row) => row.strategy === "VERIFIED").length,
    fallbacks_used: cycle.recovery?.reroute?.continued ? 1 : 0,
    recoveries: cycle.recovery?.status === "CONTINUED" ? 1 : 0,
    common_mode_risks: cycle.common_mode?.COMMON_MODE_RISK ? 1 : 0,
    falsifications: cycle.experiment?.falsification?.refuted ? 1 : 0,
    false_assumptions_detected: cycle.common_mode?.three_sentinels_are_not_three_sources ? 1 : 0,
    architectures_proposed: (cycle.architectures?.candidates || []).length,
    architectures_verified: 0,
    strategies_remembered: cycle.strategy_memory?.pattern?.pattern ? 1 : 0,
    brute_force: cycle.architectures?.brute_force === true,
    candidate_capabilities: (cycle.emergence?.candidates || []).length,
    emergent_candidates: (cycle.emergence?.candidates || []).filter((row) => row.class === "EMERGENT_CANDIDATE").length,
    reproduced_emergence: (cycle.emergence?.candidates || []).filter((row) => row.state === "REPRODUCED").length,
    falsified_emergence: cycle.emergence?.classified?.state === "FALSIFIED" ? 1 : 0,
    mutations_tested: cycle.evolution?.experiment?.status === "EXECUTED" ? 1 : 0,
    mutations_rejected: cycle.evolution?.adopted === false ? 1 : 0,
    mutations_verified: 0,
    cognitive_blind_spots: (cycle.blind_spots?.findings || []).length,
    negative_knowledge_entries: cycle.memory?.categorized?.kind === "FAILURE" ? 1 : 0,
    invented: false,
    live: false,
  };
}

function resourcesFromIntelligence(intelligence, fallback) {
  if (Array.isArray(fallback) && fallback.length) return fallback;
  return (intelligence?.discoveries || []).map((row) => ({
    id: row.identity,
    identity: row.identity,
    provider: row.family,
    family: row.family,
    capabilities: row.resource?.capabilities || ["review"],
    presence: row.present ? "CONNECTED" : "DECLARED",
    channel: row.channels?.[0]?.kind,
    authenticated: row.authenticated,
    callable: row.callable,
    kind: row.family === "local" ? "local" : "llm",
  }));
}

export function cognitiveDiscoveryCycle({
  task = { objective: "review", required_capabilities: ["review"] },
  resources = [],
  world,
  env = process.env,
  intelligence,
  hypothesis,
  measurements = {},
  lost,
  now,
} = {}) {
  const at = now || new Date().toISOString();
  const intel = intelligence || intelligenceDiscoveryLoop({
    world: world || measureWorld({ env }),
    need: task.objective || task.need || "review",
    env,
  });
  const discoveredResources = resourcesFromIntelligence(intel, resources);
  const classified = classifyTask(task);
  const qualifications = discoveredResources.slice(0, 12).map((resource) => qualifyCapability({
    resource,
    capability: classified.required[0],
    evidence: { executed: resource.callable === true, verified: false },
  }));
  const registry = capabilityRegistry(discoveredResources.map((row) => ({
    identity: idOf(row),
    capability: (row.capabilities || [])[0],
    presence: row.presence,
  })));
  const paths = findCognitivePaths({
    task,
    resources: discoveredResources,
    measurements,
    executed: measurements.measured === true,
  });
  const budget = cognitiveBudget({
    risk: task.risk || "LOW_RISK",
    consequence: task.consequence,
    uncertainty: task.uncertainty,
  });
  const architectures = discoverCognitiveArchitectures({
    task,
    resources: discoveredResources,
    constraints: { risk: task.risk || "LOW_RISK", evidence_requirement: task.evidence_requirement },
    measurements,
  });
  const independence = analyzeIndependence(discoveredResources);
  const strategy = selectCognitiveStrategy({ task, budget, independence });
  const challenged = architectures.candidates[0]
    ? challengeCognitiveArchitecture({ architecture: architectures.candidates[0] })
    : { findings: [], adopted: false, live: false };
  const comparison = compareCognitiveArchitectures({
    architectures: architectures.candidates,
    measurements,
    metric: measurements.metric || null,
  });
  const strategy_memory = rememberCognitiveStrategy({
    task_class: classified.class,
    required: classified.required,
    architecture: architectures.candidates[0],
    measurements,
    outcome: "CYCLE",
    at,
  });
  const pattern = discoverCognitivePattern({ measurements, repeated: false, verified: false, traced: false });
  const provenance = architectureProvenance({
    architecture: architectures.candidates[0],
    task: classified.class,
    at,
  });
  const synapses = [];
  for (const edge of (paths.assembly?.assembly?.edges || []).slice(0, 4)) {
    if (!edge?.source || !edge?.target) continue;
    synapses.push(describeCognitiveSynapse({
      source: edge.source,
      target: edge.target,
      capability: classified.required[0],
      purpose: edge.purpose,
    }));
  }
  const common_mode = detectCommonMode(discoveredResources);
  const trust = cognitiveTrust({
    identity: "measured",
    provenance: "organism",
    security: "defense",
    capability: qualifications.some((row) => row.measured) ? "measured" : "declared",
    recency: at,
    evidence: qualifications.some((row) => row.verified) ? "verified" : "unscored",
  });
  const unknown = admitUnknownIntelligence({ env, world });
  const experiment = runExperimentLab({
    hypothesis: hypothesis || "capability-first routing covers the task",
    experiment: { expected: classified.required },
    executed: false,
    measured: false,
    verified: false,
    adopt: false,
  });
  const recovery = lost
    ? recomposeCognitiveArchitecture({ lost, nodes: discoveredResources, required: classified.required, graph: paths.graph })
    : { status: "NOT_REQUIRED", silent_fallback: false, rebuilt_system: false, live: false };
  const memory = rememberCognitiveExperience({
    task: classified.class,
    resources: discoveredResources.map(idOf).filter(Boolean),
    capabilities: classified.required,
    graph: paths.graph?.task,
    strategy: paths.paths.map((row) => row.id),
    outcome: "CYCLE",
    at,
  });
  const expiry = expireCognitiveKnowledge({
    kind: "measurement",
    issued_at: at,
    now: at,
    ttl_ms: 86_400_000,
  });
  const emergence = discoverEmergentCapabilities({
    resources: discoveredResources,
    capabilities: classified.required,
    synapses,
    cognitive_architectures: architectures.candidates,
    measurements,
    context: classified.class,
    now: at,
  });
  const genome = describeCognitiveGenome({
    resources: discoveredResources,
    capabilities: classified.required,
    synapses,
    architecture: architectures.candidates[0],
    strategies: [strategy.move],
    constraints: ["capability_is_not_authority"],
    verification_rules: ["observed_is_not_verified"],
  });
  const self_knowledge = describeSelfKnowledge({ qualifications });
  const blind_spots = discoverCognitiveBlindSpots({
    qualifications,
    resources: discoveredResources,
    architectures: architectures.candidates,
  });
  const curiosity = proposeCognitiveCuriosity({
    unknown: unknown.state || "UNKNOWN",
    hypothesis: "unmeasured combinations are not emergent capabilities",
  });
  const evolution = safeEvolutionLoop({
    current: genome,
    mutation: { kind: "increase_verification" },
    measurements,
    verified: false,
    simulated: true,
  });
  const cycle = {
    version: DISCOVERY_VERSION,
    status: "EXECUTED",
    at,
    intelligence: {
      counts: intel.counts || null,
      nvidia: intel.nvidia ? { state: intel.nvidia.state, missing: intel.nvidia.missing, live: false } : null,
      unknown: intel.unknown ? { state: intel.unknown.state, live: false } : null,
      closed_list: false,
    },
    classified,
    qualifications,
    registry,
    paths,
    budget,
    architectures,
    strategy,
    independence,
    challenge: challenged,
    comparison,
    strategy_memory,
    pattern,
    provenance,
    synapses,
    common_mode,
    trust,
    unknown,
    experiment,
    recovery,
    memory,
    expiry,
    emergence,
    genome,
    self_knowledge,
    blind_spots,
    curiosity,
    evolution,
    second_cortex: false,
    second_mesh: false,
    second_governance: false,
    capability_is_not_authority: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
  cycle.metrics = discoveryMetrics(cycle);
  return cycle;
}
