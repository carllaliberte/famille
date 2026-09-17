#!/usr/bin/env node
/**
 * ACORN COGNITIVE DISCOVERY ENGINE
 *
 * Compose existing Cortex / ecosystem / continuity / intelligence organs
 * into one discovery cycle. Not a second Cortex, mesh, governance, or authority.
 *
 * Capability is the unit. Provider is a property of a resource.
 * DECLARED ≠ MEASURED. Ranked ≠ proved. LEARNING ≠ unverified auto-modification.
 */
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
  "DISCOVERED", "TESTING", "ACTIVE", "WEAKENED", "EXPIRED", "DISABLED", "RECOVERING",
]);

export const EXPERIMENT_STAGES = Object.freeze([
  "HYPOTHESIS", "EXPERIMENT", "EXECUTION", "MEASUREMENT", "COMPARISON",
  "FALSIFICATION", "VERIFICATION", "OPTIONAL_ADOPTION",
]);

export const BUDGET_TIERS = Object.freeze({
  LOW_RISK: { resources: 1, verify: false, falsify: false, independent: false },
  SIMPLE: { resources: 1, verify: false, falsify: false, independent: false },
  AMBIGUOUS: { resources: 2, verify: false, falsify: false, independent: false },
  IMPORTANT: { resources: 2, verify: true, falsify: false, independent: true },
  CRITICAL: { resources: 3, verify: true, falsify: true, independent: true },
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
    uncertainty: key === "AMBIGUOUS" ? "UNCERTAIN" : uncertainty,
    consequence: key === "CRITICAL" ? "high" : consequence,
  });
  const budget = uncertaintyBudget({
    known: key === "LOW_RISK" || key === "SIMPLE" ? ["task"] : [],
    unknown: key === "AMBIGUOUS" || key === "CRITICAL" ? ["UNKNOWN"] : [],
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
    ? recoverFromLoss({ lost, nodes: discoveredResources, required: classified.required, graph: paths.graph })
    : { status: "NOT_REQUIRED", silent_fallback: false, live: false };
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
    synapses,
    common_mode,
    trust,
    unknown,
    experiment,
    recovery,
    memory,
    expiry,
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
