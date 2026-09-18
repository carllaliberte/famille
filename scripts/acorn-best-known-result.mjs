import crypto from "node:crypto";

export const BEST_KNOWN_RESULT_VERSION = "acorn.best-known-result.v1";

export const RESULT_STATES = Object.freeze([
  "CANDIDATE","COMPARABLE","BEST_KNOWN_IN_SCOPE","NOT_MEASURED","EXPIRED","REJECTED"
]);

export const ADAPTATION_STATES = Object.freeze([
  "OBSERVED","QUALIFIED","ADAPTABLE","PROPOSED","WAITING_HUMAN"
]);

const nowIso = () => new Date().toISOString();
const sha256 = (value) => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

function requireNonEmpty(value, name) {
  if (value === undefined || value === null || value === "") throw new Error(`${name} is required`);
}

export function createResultCandidate(input = {}) {
  requireNonEmpty(input.id, "id");
  requireNonEmpty(input.problem, "problem");
  requireNonEmpty(input.provider, "provider");
  requireNonEmpty(input.method, "method");
  requireNonEmpty(input.measured_at, "measured_at");
  const metrics = input.metrics || {};
  const evidence = Array.isArray(input.evidence) ? input.evidence : [];
  const constraints = Array.isArray(input.constraints) ? input.constraints : [];
  return {
    id: String(input.id), problem: String(input.problem), provider: String(input.provider),
    method: String(input.method), version: input.version || "unknown",
    measured_at: String(input.measured_at), valid_until: input.valid_until || null,
    metrics: { ...metrics }, evidence: evidence.map(String), constraints,
    satisfies_constraints: input.satisfies_constraints !== false,
    state: "CANDIDATE", authority: "human", auto_merge: false
  };
}

export function isFresh(candidate, at = nowIso()) {
  if (!candidate?.valid_until) return false;
  return new Date(candidate.valid_until).getTime() >= new Date(at).getTime();
}

export function comparableCandidates(candidates, { metric, direction = "max", at = nowIso(), requiredConstraints = [] } = {}) {
  requireNonEmpty(metric, "metric");
  if (!["max", "min"].includes(direction)) throw new Error("direction must be max or min");
  return (Array.isArray(candidates) ? candidates : [])
    .filter(Boolean)
    .filter((candidate) => candidate.state !== "REJECTED")
    .filter((candidate) => candidate.satisfies_constraints !== false)
    .filter((candidate) => isFresh(candidate, at))
    .filter((candidate) => candidate.metrics && Number.isFinite(Number(candidate.metrics[metric])))
    .filter((candidate) => requiredConstraints.every((constraint) => candidate.constraints.includes(constraint)))
    .map((candidate) => ({ ...candidate, metric_value: Number(candidate.metrics[metric]), state: "COMPARABLE" }))
    .sort((a, b) => direction === "max" ? b.metric_value - a.metric_value : a.metric_value - b.metric_value);
}

export function selectBestKnownResult(candidates, options = {}) {
  const compared = comparableCandidates(candidates, options);
  const at = options.at || nowIso();
  if (!compared.length) return {
    version: BEST_KNOWN_RESULT_VERSION, state: "NOT_MEASURED",
    scope: options.scope || "UNSPECIFIED", metric: options.metric || null,
    direction: options.direction || null, selected: null, alternatives: [],
    measured_at: at, valid_until: null, coverage: options.coverage || "UNKNOWN",
    authority: "human", auto_merge: false
  };
  const [selected, ...alternatives] = compared;
  const coverage = options.coverage || "KNOWN_CANDIDATE_SET";
  return {
    version: BEST_KNOWN_RESULT_VERSION, state: "BEST_KNOWN_IN_SCOPE",
    scope: options.scope || "UNSPECIFIED", metric: options.metric,
    direction: options.direction || "max",
    selected: { ...selected, state: "BEST_KNOWN_IN_SCOPE" },
    alternatives, measured_at: at, valid_until: selected.valid_until, coverage,
    coverage_is_global: coverage === "GLOBAL_MEASURED", comparison_count: compared.length,
    authority: "human", auto_merge: false
  };
}

export function buildAdaptationPlan({ current = {}, marketSignals = [], capabilitySignals = [], futureSignals = [], at = nowIso() } = {}) {
  const signals = [
    ...marketSignals.map((s) => ({ ...s, source_class: "MARKET" })),
    ...capabilitySignals.map((s) => ({ ...s, source_class: "CAPABILITY" })),
    ...futureSignals.map((s) => ({ ...s, source_class: "FUTURE" }))
  ];
  const qualified = signals.filter((signal) =>
    signal?.id && signal.observed_at && Array.isArray(signal.evidence) && signal.evidence.length > 0
  );
  const changes = qualified.map((signal) => ({
    id: signal.id, source_class: signal.source_class, observed_at: signal.observed_at,
    evidence: signal.evidence, impact: signal.impact || "UNKNOWN",
    action: signal.action || "PROPOSE", state: "ADAPTABLE"
  }));
  return {
    version: BEST_KNOWN_RESULT_VERSION, observed_at: at, current: { ...current }, changes,
    state: changes.length ? "ADAPTABLE" : "OBSERVED", authority: "human", auto_merge: false,
    human_gate_required: changes.some((change) =>
      ["DEPLOY","PUBLISH","CONTRACT","PRICE_CHANGE","MERGE"].includes(change.action)
    )
  };
}

export function registerCapabilityFromOutcome({ outcome, capability, evidence = [], valid_until, at = nowIso() } = {}) {
  requireNonEmpty(outcome?.id, "outcome.id");
  requireNonEmpty(capability?.id, "capability.id");
  requireNonEmpty(valid_until, "valid_until");
  return {
    version: BEST_KNOWN_RESULT_VERSION, capability_id: capability.id,
    capability_version: capability.version || "1", derived_from_outcome: outcome.id,
    evidence: Array.isArray(evidence) ? evidence.map(String) : [],
    observed_at: outcome.measured_at || at, valid_until, state: "COMPARABLE",
    reusable: Boolean(evidence.length && outcome.measured),
    rights: capability.rights || "UNKNOWN",
    provenance_hash: sha256({ outcome: outcome.id, capability: capability.id, evidence }),
    authority: "human", auto_merge: false
  };
}

export function bestKnownVerdict(selection) {
  if (!selection || selection.state !== "BEST_KNOWN_IN_SCOPE") return "BEST_KNOWN_RESULT_UNAVAILABLE";
  return selection.coverage_is_global
    ? "BEST_KNOWN_RESULT · GLOBAL_MEASURED_SCOPE"
    : "BEST_KNOWN_RESULT · MEASURED_SCOPE";
}

export function assertBestKnownContract(selection) {
  if (!selection || selection.version !== BEST_KNOWN_RESULT_VERSION) throw new Error("INVALID_BEST_KNOWN_CONTRACT");
  if (selection.state === "BEST_KNOWN_IN_SCOPE") {
    if (!selection.selected?.valid_until) throw new Error("NO_EXPIRY");
    if (!selection.selected?.measured_at) throw new Error("NO_MEASUREMENT_DATE");
    if (!selection.selected?.evidence?.length) throw new Error("NO_EVIDENCE");
    if (selection.authority !== "human") throw new Error("AUTHORITY_VIOLATION");
    if (selection.auto_merge !== false) throw new Error("AUTO_MERGE_FORBIDDEN");
  }
  return true;
}
