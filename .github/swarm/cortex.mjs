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
  "COMPOSE",
  "AUTHORIZE",
  "EXECUTE",
  "MEASURE",
  "VERIFY",
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
