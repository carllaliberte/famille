/**
 * ACORN CORTEX — v0 cognitive-network core.
 *
 * Cortex is not a model, judge, oracle, or second mesh.
 * It is the deterministic layer that maps capabilities, composes
 * context-specific collaborations, records execution, measures deltas,
 * and learns collaboration patterns without granting authority.
 *
 * DEFINED != DISCOVERED != AUTHORIZED != CALLED != EXECUTED != MEASURED != VERIFIED.
 * LIVE is never minted here. Carl remains the human decision/merge authority.
 */

export const CORTEX_VERSION = "cortex.v0";
export const CORTEX_STATES = Object.freeze([
  "OBSERVE",
  "MAP",
  "HYPOTHESIZE",
  "COMPOSE",
  "AUTHORIZE",
  "EXPERIMENT",
  "EXECUTE",
  "MEASURE",
  "VERIFY",
  "ADOPT",
  "REJECT",
  "REMEMBER",
  "RECONFIGURE",
  "LEARN",
  "HOLD_HUMAN",
  "DONE",
]);

export const PRESENCE_STATES = Object.freeze([
  "DECLARED",
  "CONNECTED",
  "ACTIVE",
  "UNAVAILABLE",
  "BLOCKED",
  "ERROR",
]);

const FORBIDDEN_AUTHORITY = new Set(["merge", "secret", "policy", "human_decision", "live_proof"]);

function text(value) {
  return String(value ?? "").trim();
}

function list(value) {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function iso(value) {
  const s = text(value);
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function clone(value) {
  return structuredClone(value);
}

function unique(values) {
  return [...new Set(values)];
}

function capabilitySet(agent) {
  return new Set(list(agent?.capabilities));
}

function contextWords(task) {
  return new Set(
    `${text(task?.objective)} ${list(task?.context).join(" ")} ${list(task?.specialties).join(" ")}`
      .toLowerCase()
      .split(/[^a-z0-9_-]+/)
      .filter((word) => word.length > 2),
  );
}

function specialtyFit(agent, words) {
  const specialty = text(agent?.specialty || agent?.role).toLowerCase();
  if (!specialty) return 0;
  return specialty
    .split(/[^a-z0-9_-]+/)
    .filter(Boolean)
    .reduce((score, word) => score + (words.has(word) ? 1 : 0), 0);
}

export function normalizeIntelligence(input = {}) {
  return Object.freeze({
    id: text(input.id),
    name: text(input.name || input.id),
    kind: text(input.kind || "unknown"),
    role: text(input.role),
    specialty: text(input.specialty || input.role),
    capabilities: unique(list(input.capabilities)),
    presence: PRESENCE_STATES.includes(text(input.presence)) ? text(input.presence) : "DECLARED",
    trust: text(input.trust || "unscored"),
    provenance: input.provenance && typeof input.provenance === "object" ? clone(input.provenance) : null,
  });
}

export function discoverCapabilities(task = {}, intelligences = []) {
  const required = unique(list(task.required_capabilities));
  const words = contextWords(task);
  const rows = intelligences
    .map(normalizeIntelligence)
    .filter((agent) => agent.id)
    .map((agent) => {
      const caps = capabilitySet(agent);
      const covered = required.filter((cap) => caps.has(cap));
      return {
        intelligence: agent,
        covered,
        missing: required.filter((cap) => !caps.has(cap)),
        context_fit: specialtyFit(agent, words),
        callable: agent.presence === "CONNECTED" || agent.presence === "ACTIVE",
        measurable: true,
      };
    })
    .sort((a, b) => {
      if (b.covered.length !== a.covered.length) return b.covered.length - a.covered.length;
      return b.context_fit - a.context_fit;
    });

  return {
    ok: true,
    required,
    discovered: rows,
    covered: unique(rows.flatMap((row) => row.covered)),
    missing: required.filter((cap) => !rows.some((row) => row.covered.includes(cap))),
    provenance: { method: CORTEX_VERSION, operation: "discoverCapabilities", at: iso(task.at) },
  };
}

export function composeSynapse(task = {}, discovered = {}) {
  const required = unique(list(task.required_capabilities));
  const rows = Array.isArray(discovered.discovered) ? discovered.discovered : [];
  const selected = [];
  const covered = new Set();

  // Context-specific composition: choose the smallest set that covers the task.
  for (const row of rows) {
    if (!row.callable) continue;
    const adds = row.covered.filter((cap) => !covered.has(cap));
    if (!adds.length) continue;
    selected.push(row);
    for (const cap of adds) covered.add(cap);
    if (required.every((cap) => covered.has(cap))) break;
  }

  const verifier = rows.find(
    (row) => row.callable && row.intelligence.capabilities.includes("review") && !selected.some((s) => s.intelligence.id === row.intelligence.id),
  );
  if (verifier) selected.push(verifier);

  const missing = required.filter((cap) => !covered.has(cap));
  return {
    ok: missing.length === 0,
    state: missing.length ? "HOLD_HUMAN" : "AUTHORIZE",
    selected: selected.map((row) => row.intelligence.id),
    capabilities: unique(selected.flatMap((row) => row.covered)),
    missing,
    independent_verifier: verifier?.intelligence.id || null,
    synapse: {
      synapse_id: id("syn"),
      task: text(task.objective),
      nodes: selected.map((row) => row.intelligence.id),
      context: {
        required_capabilities: required,
        specialties: list(task.specialties),
      },
      grade: "PROPOSED",
      live: false,
      provenance: { method: CORTEX_VERSION, operation: "composeSynapse", at: iso(task.at) },
    },
  };
}

export function authorizeCapability(input = {}) {
  const requested = list(input.capabilities);
  const denied = requested.filter((cap) => FORBIDDEN_AUTHORITY.has(cap));
  const authority = text(input.authority || "network");
  const allowed = input.allowed === true && denied.length === 0 && authority !== "untrusted";
  return {
    ok: allowed,
    state: allowed ? "AUTHORIZED" : "HOLD_HUMAN",
    denied,
    reason: denied.length ? `forbidden authority: ${denied.join(",")}` : allowed ? "least-privilege authorization" : "explicit authorization required",
    live: false,
    provenance: { method: CORTEX_VERSION, operation: "authorizeCapability", at: iso(input.at) },
  };
}

export function createCortexSession(input = {}) {
  const task = {
    objective: text(input.objective),
    required_capabilities: unique(list(input.required_capabilities)),
    context: list(input.context),
    specialties: list(input.specialties),
    at: iso(input.at),
  };
  return {
    ok: Boolean(task.objective),
    session: {
      session_id: id("ctx"),
      version: CORTEX_VERSION,
      state: "OBSERVE",
      task,
      stages: [],
      selected: [],
      executions: [],
      measurements: [],
      verifications: [],
      lessons: [],
      live: false,
      auto_merge: false,
      provenance: { method: CORTEX_VERSION, operation: "createCortexSession", at: task.at },
    },
  };
}

export function recordStage(session, state, input = {}) {
  if (!session || !CORTEX_STATES.includes(state)) return { ok: false, code: "BAD_STATE" };
  const next = clone(session);
  next.state = state;
  next.stages.push({
    state,
    status: text(input.status || "observed"),
    summary: text(input.summary),
    at: iso(input.at),
    provenance: input.provenance || { method: CORTEX_VERSION },
  });
  next.live = false;
  next.auto_merge = false;
  return { ok: true, session: next };
}

export function recordExecution(session, input = {}) {
  if (!session) return { ok: false, code: "NO_SESSION" };
  const next = clone(session);
  const row = {
    execution_id: id("exec"),
    node: text(input.node),
    capability: text(input.capability),
    status: text(input.status || "EXECUTED"),
    result: input.result ?? null,
    duration_ms: Number.isFinite(Number(input.duration_ms)) ? Number(input.duration_ms) : null,
    at: iso(input.at),
    provenance: input.provenance || { method: CORTEX_VERSION },
  };
  next.executions.push(row);
  next.state = "MEASURE";
  next.live = false;
  return { ok: true, session: next, execution: row };
}

export function measureCollaboration(input = {}) {
  const baseline = Number(input.baseline);
  const collaborative = Number(input.collaborative);
  const direction = text(input.direction || "higher_is_better");
  const valid = Number.isFinite(baseline) && Number.isFinite(collaborative);
  let delta = null;
  if (valid) delta = collaborative - baseline;
  const improved = valid
    ? direction === "lower_is_better"
      ? collaborative < baseline
      : collaborative > baseline
    : null;
  return {
    ok: valid,
    metric: text(input.metric),
    baseline: valid ? baseline : null,
    collaborative: valid ? collaborative : null,
    delta,
    improved,
    method: text(input.method || "paired measurement"),
    at: iso(input.at),
    provenance: input.provenance || { method: CORTEX_VERSION },
  };
}

export function learnCollaboration(input = {}) {
  const measurement = input.measurement || {};
  const evidence = input.verified === true && measurement.ok === true;
  return {
    ok: evidence,
    lesson: evidence
      ? {
          kind: "collaboration_pattern",
          task: text(input.task),
          nodes: unique(list(input.nodes)),
          metric: text(measurement.metric),
          delta: measurement.delta,
          context: list(input.context),
          reusable: true,
        }
      : null,
    reason: evidence ? "verified measurement" : "learning requires verified measurement",
    at: iso(input.at),
    provenance: input.provenance || { method: CORTEX_VERSION },
  };
}

export function capabilityGain(input = {}) {
  const before = new Set(list(input.before));
  const after = new Set(list(input.after));
  const gained = [...after].filter((cap) => !before.has(cap));
  return {
    gained,
    count: gained.length,
    demonstrated: input.verified === true && gained.length > 0,
    provenance: input.provenance || { method: CORTEX_VERSION },
  };
}

export const EVOLUTION_VERSION = "cortex-evolution.v1";
export const EVOLUTION_STATES = Object.freeze([
  "DEFINED",
  "PROPOSED",
  "EXECUTED",
  "MEASURED",
  "VERIFIED",
  "REJECTED",
  "INCONCLUSIVE",
  "REGRESSION",
  "HOLD_HUMAN",
  "ADOPTED",
]);

export function observeCortex({
  workerEvidence = {},
  fluidity = {},
  discovery = {},
  composition = {},
  memory = [],
  topology = null,
  at = new Date().toISOString(),
} = {}) {
  const discovered = Array.isArray(discovery.discovered) ? discovery.discovered : [];
  const callable = discovered.filter((row) => row.callable);
  const unused = discovered.filter((row) => row.intelligence?.presence === "DECLARED" && !row.callable);
  const fluidityState = text(fluidity.state);
  return {
    ok: true,
    status: "EXECUTED",
    version: EVOLUTION_VERSION,
    observed_at: iso(at),
    capabilities: {
      declared: unique(discovered.flatMap((row) => list(row.intelligence?.capabilities))),
      executable: unique(callable.flatMap((row) => list(row.covered))),
      verified: workerEvidence.verified === true ? unique(list(composition.capabilities)) : [],
      missing: list(discovery.missing),
      unused: unique(unused.flatMap((row) => list(row.intelligence?.capabilities))),
      failed: Number(workerEvidence.dispatch_failed || 0) > 0 ? list(discovery.covered) : [],
    },
    intelligences: discovered.map((row) => ({
      id: row.intelligence?.id,
      presence: row.intelligence?.presence,
      callable: row.callable === true,
      live: false,
    })),
    synapses: {
      active: composition.ok ? [composition.synapse].filter(Boolean) : [],
      candidates: composition.ok ? [] : [{ reason: "missing callable capability", missing: list(composition.missing) }],
    },
    fluidity: {
      state: fluidityState || null,
      mode: fluidity.mode || null,
      silent_stop: fluidity.property?.silent_stop === true,
      hint_consumed: fluidity.property?.hint_consumed === true,
      friction: fluidityState === "FRICTION",
      stalled: fluidityState === "STALLED",
      hold_human: fluidityState === "HOLD_HUMAN",
    },
    memory_count: (memory || []).length,
    topology_version: topology?.version || 0,
    live: false,
    auto_merge: false,
    authority: "carl",
    provenance: { method: CORTEX_VERSION, operation: "observeCortex", at: iso(at) },
  };
}

function defaultHypothesisKind(observation = {}) {
  if (observation.fluidity?.stalled) return "reduce_stall";
  if (observation.fluidity?.friction) return "consume_hint";
  if ((observation.capabilities?.missing || []).length) return "missing_capability";
  if ((observation.synapses?.candidates || []).length) return "compose_synapse";
  if ((observation.capabilities?.unused || []).length) return "retire_unused";
  return "routing";
}

export function hypothesize(observation = {}, input = {}) {
  const kind = text(input.kind) || defaultHypothesisKind(observation);
  const statement = text(input.statement) || `proposed evolution: ${kind}`;
  return {
    ok: true,
    status: "PROPOSED",
    hypothesis: {
      hypothesis_id: text(input.hypothesis_id) || id("hyp"),
      version: Number(input.version || 1),
      kind,
      statement,
      is_capability: false,
      based_on: {
        missing: observation.capabilities?.missing || [],
        fluidity: observation.fluidity?.state || null,
        hint_consumed: observation.fluidity?.hint_consumed === true,
      },
      live: false,
      provenance: { method: CORTEX_VERSION, operation: "hypothesize", at: iso(input.at) },
    },
  };
}

export function composeCandidate(hypothesis = {}, observation = {}, input = {}) {
  const capabilities = unique(list(input.capabilities).concat(observation.capabilities?.executable || []));
  const intelligences = unique(list(input.intelligences).concat(
    (observation.intelligences || []).filter((row) => row.callable).map((row) => row.id),
  ));
  return {
    ok: true,
    status: "DEFINED",
    active: false,
    composition: {
      composition_id: id("cmp"),
      hypothesis_id: hypothesis.hypothesis_id,
      inputs: list(input.inputs),
      capabilities,
      intelligences,
      synapses: observation.synapses?.active || [],
      dependencies: list(input.dependencies),
      expected: {
        outcome: text(input.expected_outcome || hypothesis.statement),
        cost: text(input.expected_cost || "unknown"),
        risk: text(input.expected_risk || "bounded"),
        fluidity_effect: text(input.expected_fluidity || "reduce_friction"),
      },
      required_authority: "carl",
      evidence_requirements: unique(["execution", "measurement", "falsification"].concat(list(input.evidence_requirements))),
      live: false,
      provenance: { method: CORTEX_VERSION, operation: "composeCandidate", at: iso(input.at) },
    },
  };
}

export function createExperiment(composition = {}, hypothesis = {}, input = {}) {
  return {
    ok: true,
    status: "PROPOSED",
    experiment: {
      experiment_id: id("exp"),
      objective: text(input.objective || hypothesis.statement),
      hypothesis_id: hypothesis.hypothesis_id,
      composition_id: composition.composition_id,
      version: Number(input.version || 1),
      context: list(input.context),
      inputs: list(composition.inputs),
      expected_result: composition.expected?.outcome || null,
      execution_path: list(input.execution_path).concat(["routing", "conductor", "worker"]),
      measurements: [],
      errors: [],
      evidence: [],
      verdict: null,
      live: false,
      auto_merge: false,
      authority: "carl",
      provenance: { method: CORTEX_VERSION, operation: "createExperiment", at: iso(input.at) },
    },
  };
}

export function executeExperiment(experiment = {}, runtime = {}) {
  const base = {
    experiment_id: experiment.experiment_id,
    executed: false,
    live: false,
    auto_merge: false,
    authority: "carl",
    provenance: { method: CORTEX_VERSION, operation: "executeExperiment", at: iso(runtime.at) },
  };
  if (runtime.channelPresent === false) {
    return { ...base, status: "CHANNEL_NOT_PRESENT", diagnostic: "CHANNEL_NOT_PRESENT" };
  }
  if (runtime.capabilityAvailable === false) {
    return { ...base, status: "CAPABILITY_NOT_AVAILABLE", diagnostic: "CAPABILITY_NOT_AVAILABLE" };
  }
  if (runtime.authorityRequired === true || runtime.authority === "merge" || runtime.authority === "secret") {
    return { ...base, status: "HOLD_HUMAN", diagnostic: "HOLD_HUMAN" };
  }
  if (runtime.fail === true) {
    return { ...base, status: "EXECUTION_FAILED", diagnostic: "EXECUTION_FAILED", errors: list(runtime.errors).concat("execution failed") };
  }
  return {
    ...base,
    status: "EXECUTED",
    executed: true,
    used_capabilities: unique(list(runtime.used_capabilities).concat(list(experiment.inputs))),
    contributions: Array.isArray(runtime.contributions) ? runtime.contributions : [],
    result: runtime.result ?? { path: experiment.execution_path },
  };
}

export function measureExperiment(experiment = {}, execution = {}, fluidityBefore = {}, fluidityAfter = {}, input = {}) {
  const success = execution.status === "EXECUTED" && execution.executed === true;
  const before = text(fluidityBefore.state);
  const after = text(fluidityAfter.state);
  const comparable = Boolean(before && after);
  const worsened = comparable && ((before === "FLOWING" && after === "STALLED") || (before === "FLOWING" && after === "FRICTION"));
  const improved = comparable && ((before === "STALLED" && after === "FLOWING") || (before === "FRICTION" && after === "FLOWING"));
  return {
    ok: true,
    status: "MEASURED",
    experiment_id: experiment.experiment_id,
    execution_success: success,
    retries: Number(input.retries || 0),
    stalls: fluidityAfter.property?.silent_stop === true || after === "STALLED",
    friction: after === "FRICTION" || fluidityAfter.property?.hint_consumed === false,
    hint_consumed: fluidityAfter.property?.hint_consumed === true,
    continuation: text(input.continuation),
    failures: list(execution.errors),
    confidence: success ? (worsened ? "low" : "measured") : "low",
    evidence_quality: success ? "runtime" : "insufficient",
    fluidity: {
      before: before || null,
      after: after || null,
      comparable,
      improved: comparable ? improved : null,
      worsened: comparable ? worsened : null,
    },
    live: false,
    provenance: { method: CORTEX_VERSION, operation: "measureExperiment", at: iso(input.at) },
  };
}

export function falsify(experiment = {}, measurement = {}, input = {}) {
  if (input.hold === true || measurement.status === "HOLD_HUMAN") {
    return { ok: true, verdict: "HOLD_HUMAN", reason: "human authority required", live: false };
  }
  if (input.regression === true || (measurement.fluidity?.worsened === true && input.treat_fluidity_regression === true)) {
    return { ok: true, verdict: "REGRESSION", reason: "measured regression", live: false };
  }
  if (measurement.execution_success !== true) {
    return { ok: true, verdict: "VERIFIED_FAILURE", reason: "execution did not succeed", live: false };
  }
  if (measurement.fluidity?.worsened === true) {
    return { ok: true, verdict: "INCONCLUSIVE", reason: "result ok but fluidity worsened", live: false };
  }
  if (input.contradiction === true || input.hidden_dependency === true) {
    return { ok: true, verdict: "INCONCLUSIVE", reason: input.contradiction ? "contradiction" : "hidden dependency", live: false };
  }
  return { ok: true, verdict: "VERIFIED_SUCCESS", reason: "executed, measured, not falsified", live: false };
}

export function decideEvolution(verification = {}, experiment = {}, input = {}) {
  const base = {
    experiment_id: experiment.experiment_id,
    live: false,
    auto_merge: false,
    authority: "carl",
    merge: false,
    provenance: { method: CORTEX_VERSION, operation: "decideEvolution", at: iso(input.at) },
  };
  if (verification.verdict === "HOLD_HUMAN") {
    return { ...base, decision: "HOLD_HUMAN", status: "HOLD_HUMAN" };
  }
  if (verification.verdict === "VERIFIED_SUCCESS") {
    return {
      ...base,
      decision: "ADOPT",
      status: "ADOPTED",
      version: Number(input.version || experiment.version || 1) + 1,
      replaces: Number(experiment.version || 1),
      why: verification.reason,
      rollback: { previous_version: Number(experiment.version || 1), reversible: true },
    };
  }
  return { ...base, decision: "REJECT", status: "REJECTED", why: verification.reason };
}

export function rememberExperience({
  observation = {},
  hypothesis = {},
  experiment = {},
  execution = {},
  measurement = {},
  verification = {},
  decision = {},
  at = new Date().toISOString(),
} = {}) {
  const rejected = decision.decision === "REJECT";
  return {
    ok: true,
    status: "EXECUTED",
    entry: {
      memory_id: id("mem"),
      hypothesis: hypothesis.hypothesis_id || hypothesis,
      experiment: experiment.experiment_id || experiment,
      result: decision.decision || verification.verdict,
      proof: verification,
      error: execution.errors || measurement.failures || [],
      context: {
        fluidity: measurement.fluidity || observation.fluidity || null,
        capabilities: observation.capabilities || null,
      },
      at: iso(at),
      version: experiment.version || 1,
      confidence: measurement.confidence || "low",
      constraint: rejected,
      statement: rejected
        ? `rejected in context: ${text(hypothesis.statement || hypothesis.kind)}`
        : text(hypothesis.statement),
      live: false,
      provenance: { method: CORTEX_VERSION, operation: "rememberExperience", at: iso(at) },
    },
  };
}

export function reconfigureTopology(decision = {}, topology = { version: 0, paths: [], synapses: [] }, change = {}) {
  if (decision.decision !== "ADOPT") {
    return { ok: false, status: decision.status || "REJECTED", topology, live: false };
  }
  const previous = clone(topology);
  const next = {
    version: Number(topology.version || 0) + 1,
    previous_version: Number(topology.version || 0),
    paths: unique(list(topology.paths).concat(list(change.paths))),
    synapses: unique((topology.synapses || []).concat(change.synapse || []).filter(Boolean)),
    disabled: list(change.disabled),
    reversible: true,
    live: false,
    auto_merge: false,
    authority: "carl",
    why: decision.why,
    provenance: { method: CORTEX_VERSION, operation: "reconfigureTopology", at: iso(change.at) },
  };
  return { ok: true, status: "ADOPTED", topology: next, previous, live: false };
}

export function rollbackTopology(current = {}, previous = null) {
  if (!previous) return { ok: false, status: "INCONCLUSIVE", reason: "no previous topology", live: false };
  return {
    ok: true,
    status: "EXECUTED",
    topology: { ...clone(previous), rolled_back_from: current.version, reversible: true, live: false },
    live: false,
  };
}

export function runEvolutionLoop(input = {}) {
  const observation = observeCortex(input);
  const hyp = hypothesize(observation, input.hypothesis || {});
  const composed = composeCandidate(hyp.hypothesis, observation, input.compose || {});
  const exp = createExperiment(composed.composition, hyp.hypothesis, input.experiment || {});
  const execution = executeExperiment(exp.experiment, input.runtime || {});
  const measurement = measureExperiment(
    exp.experiment,
    execution,
    input.fluidity || {},
    input.fluidityAfter || input.fluidity || {},
    input.measure || {},
  );
  const verification = falsify(exp.experiment, measurement, input.falsify || {});
  const decision = decideEvolution(verification, exp.experiment, input.decide || {});
  const memory = rememberExperience({
    observation,
    hypothesis: hyp.hypothesis,
    experiment: exp.experiment,
    execution,
    measurement,
    verification,
    decision,
    at: input.at,
  });
  const reconfiguration = reconfigureTopology(decision, input.topology || { version: 0, paths: [], synapses: [] }, input.change || {});
  return {
    version: EVOLUTION_VERSION,
    observation,
    hypothesis: hyp,
    composition: composed,
    experiment: exp,
    execution,
    measurement,
    verification,
    decision,
    memory,
    reconfiguration,
    live: false,
    auto_merge: false,
    authority: "carl",
    operational: false,
  };
}

