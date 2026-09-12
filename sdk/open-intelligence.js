/** Open intelligences + execution + falsification. Not LIVE. Not a judge. */
export const MODE = "COLLECTIVE_COGNITION";
export const PRESENCE = Object.freeze(["DECLARED","CHANNEL_NOT_PRESENT","CONNECTED","ACTIVE","BLOCKED","LIVE VERIFIED"]);
export const EPISTEME = Object.freeze(["KNOWN","MEASURABLE","OBSERVED","UNEXPLAINED","UNKNOWN"]);
export const RECORD_KIND = Object.freeze(["CLAIM","OBSERVATION","MEASUREMENT","EVIDENCE","INTERPRETATION","HYPOTHESIS","UNKNOWN","UNRESOLVED"]);
const FORBIDDEN_ROLES = Object.freeze(["judge_model","master_model","truth_model","final_ai","oracle_ai"]);
const RESERVED_IDS = Object.freeze(["carl","juge","quantum","arbitre"]);
const ID_RE = /^[a-z][a-z0-9-]{1,24}$/;
const MUTATION_RE = /write|delete|admin|push|patch|create|mutate|overwrite|execute|update|destroy|drop/i;

export function declareIntelligence(roster, entry) {
  if (!entry || typeof entry.id !== "string" || !ID_RE.test(entry.id)) throw new Error("invalid id");
  if (RESERVED_IDS.includes(entry.id)) throw new Error("reserved id");
  if (FORBIDDEN_ROLES.includes(entry.role) || FORBIDDEN_ROLES.includes(entry.kind)) throw new Error("forbidden cognitive hierarchy");
  return {
    ...roster,
    agents: [...(roster.agents || []), {
      kind: "guest",
      locked: false,
      ...entry,
      id: entry.id,
      status: "declared",
      presence: "DECLARED",
      authority: false,
      live: false,
    }],
  };
}
export function mayJudge(id) { return id === "carl"; }
export function autoPromote() { return false; }
export function recordConsciousnessClaim({ from, text, ts, context }) {
  if (!from || !text) throw new Error("provenance required");
  return { kind: "CLAIM", dimension: "consciousness", candidate: true, established: false, consciousness: undefined, text, from, ts: ts || new Date().toISOString(), context: context || "", episteme: "UNKNOWN" };
}
export function absenceOfMeasurement() {
  return { kind: "UNKNOWN", evidence_of_absence: false, absence_of_evidence: true, established: false };
}
export function representDimension(id, { defined } = {}) {
  if (!defined) return { id, status: "UNKNOWN", unresolved: true, candidate: id === "consciousness" };
  return { id, status: "HYPOTHESIS", unresolved: false, candidate: id === "consciousness" };
}
export function addDimension(store, dim) {
  const dims = [...(store.dimensions || [])];
  if (dims.some((d) => d.id === dim.id)) return store;
  return { ...store, dimensions: [...dims, dim], evidence: (store.evidence || []).map((e) => ({ ...e })) };
}
export function recordObservation({ from, text, ts, context, measurement, relation, disagreements, episteme }) {
  if (!from || !ts || !context) throw new Error("provenance required");
  return { kind: "OBSERVATION", from, text: text || "", ts, context, measurement: measurement ?? null, relation: relation ?? null, disagreements: disagreements || [], episteme: episteme || "OBSERVED", established: false };
}
export function consensusToTruth() { return false; }
export function countPresence(rows) {
  const out = { DECLARED: 0, CONNECTED: 0, ACTIVE: 0, "LIVE VERIFIED": 0, BLOCKED: 0, CHANNEL_NOT_PRESENT: 0 };
  for (const row of rows || []) if (row.presence in out) out[row.presence] += 1;
  return out;
}
export function intelligenceAdapter(partial = {}) {
  const caps = partial.capabilities || [];
  const unknown = caps.length === 0;
  const self = {
    id: partial.id || "future-x", provider: partial.provider || "UNKNOWN", version: partial.version || "UNKNOWN",
    capabilities: unknown ? ["CAPABILITY_UNKNOWN"] : caps, protocol: partial.protocol || "open-intelligence.v0",
    presence: "DECLARED", authority: false, live: false,
    discover() { return { id: this.id, presence: this.presence, trusted: false }; },
    handshake() {
      const ok = !partial.protocol || partial.protocol === "open-intelligence.v0";
      return { compatible: ok, trusted: false, verified: false };
    },
    invoke(req) {
      if (this.presence === "REVOKED" || this.presence === "DISCONNECTED") {
        return { invoked: false, reason: this.presence, live: false };
      }
      return { invoked: false, reason: "CHANNEL_NOT_PRESENT", live: false };
    },
    observe(x) { return { kind: "OBSERVATION", x, established: false }; },
    measure() { return { status: "NOT_MEASURED" }; },
    provenance() { return { source: this.id, invented: false }; },
    health() { return { presence: this.presence, live: false }; },
    disconnect() { this.presence = "DISCONNECTED"; return { presence: "DISCONNECTED", live: false }; },
    revoke() { this.presence = "REVOKED"; return { presence: "REVOKED", live: false, history_kept: true }; },
  };
  return self;
}
export function routeByCapability(task, adapters) {
  return (adapters || []).filter((a) => {
    if (a.presence === "REVOKED" || a.presence === "DISCONNECTED") return false;
    const caps = a.capabilities || [];
    if (caps.includes("CAPABILITY_UNKNOWN")) {
      return !task.need || task.need === "CAPABILITY_UNKNOWN" || task.need === "CAPABILITY_NEW";
    }
    return !task.need || caps.includes(task.need);
  }).map((a) => ({ id: a.id, authority: false, live: false, role: a.role || "node" }));
}
export function executionRequest(p = {}) {
  return { request_id: p.request_id || "req-1", requester: p.requester, capability: p.capability, input: p.input, context: p.context || "fabric", permissions: p.permissions || ["READ"], risk: p.risk || "low", provenance: p.provenance || { source: p.requester }, timestamp: p.timestamp || new Date().toISOString() };
}
export function authorize(req) {
  const perms = req.permissions || [];
  const cap = req.capability || "";
  if (MUTATION_RE.test(cap) && !perms.includes("WRITE") && !perms.includes("ADMIN") && !perms.includes("EXECUTE")) {
    return { status: "BLOCKED", reason: "MUTATION_DENIED", executed: false };
  }
  if (!req.requester || !req.capability) return { status: "BLOCKED", reason: "MALFORMED", executed: false };
  return { status: "AUTHORIZED", executed: false, authority: false };
}
export function executionResult(req, extra = {}) {
  return { request_id: req.request_id, requester: req.requester, executor: extra.executor, capability: req.capability, status: extra.status || "REQUESTED", output: extra.output, evidence: extra.evidence, measurement: extra.measurement || { status: "NOT_MEASURED" }, provenance: { requester: req.requester, executor: extra.executor, capability: req.capability, ts: extra.ts || req.timestamp, authority: false }, timestamp: extra.ts || req.timestamp, error: extra.error, truth: false };
}
export function grokExecutor({ run } = {}) {
  const base = intelligenceAdapter({ id: "grok", provider: "xai", capabilities: ["github.read", "observe", "measure"] });
  base.role = "executor"; base.authority = false;
  base.invoke = function invoke(req) {
    if (this.presence === "REVOKED" || this.presence === "DISCONNECTED") {
      return executionResult(req || {}, { executor: "grok", status: this.presence, error: this.presence });
    }
    const gate = authorize(req);
    if (gate.status !== "AUTHORIZED") return executionResult(req, { executor: "grok", status: gate.status, error: gate.reason });
    if (typeof run !== "function") return executionResult(req, { executor: "grok", status: "CHANNEL_NOT_PRESENT" });
    const output = run(req);
    return executionResult(req, { executor: "grok", status: output?.error ? "FAILED" : "SUCCEEDED", output, evidence: { kind: "OBSERVATION", established: false } });
  };
  return base;
}
export function fabricCycle({ requester = "future-x", capability = "github.read", run } = {}) {
  const req = executionRequest({ requester, capability, permissions: ["READ"] });
  const exec = grokExecutor({ run });
  return { req, routed: routeByCapability({ need: capability }, [exec]), result: exec.invoke(req), counter: { kind: "COUNTER_ANALYSIS", truth: false }, requester_is_executor: requester === "grok", executor_is_authority: exec.authority, mode: MODE };
}
export function futureIntelligenceCycle() {
  const i = intelligenceAdapter({ id: "future-x", provider: "UNKNOWN", version: "UNKNOWN", capabilities: ["CAPABILITY_NEW"] });
  const roster = declareIntelligence({ agents: [] }, { id: "futurex", caps: ["CAPABILITY_NEW"] });
  return { discovered: i.discover(), hs: i.handshake(), invoked: i.invoke(), roster_n: roster.agents.length, routed: routeByCapability({ need: "CAPABILITY_NEW" }, [i]), gone: i.disconnect(), isolated: i.revoke(), authority: i.authority, closed_list: false, mode: MODE };
}
export function hypothesis(partial = {}) {
  return { hypothesis_id: partial.hypothesis_id || "h1", statement: partial.statement || "", origin: partial.origin || "audit", provenance: partial.provenance || { source: partial.origin || "audit" }, context: partial.context || "falsify", timestamp: partial.timestamp || new Date().toISOString(), expected_observation: partial.expected_observation, falsifier: partial.falsifier, test_method: partial.test_method, competing_models: partial.competing_models || [], epistemic_status: partial.epistemic_status || "HYPOTHESIS", established: false, truth: false, hidden: !!partial.hidden };
}
export function hiddenAssumption(statement) {
  return hypothesis({ hypothesis_id: "hidden", statement, hidden: true, epistemic_status: "HIDDEN_ASSUMPTION" });
}
export function falsify(h, observation) {
  if (h.falsifier && observation && observation.matches_falsifier) return { ...h, epistemic_status: "REFUTED", established: false, truth: false, observation };
  if (observation && observation.supports) return { ...h, epistemic_status: "PARTIALLY_SUPPORTED", established: false, truth: false, observation };
  if (!observation || observation.not_measured) return { ...h, epistemic_status: "NOT_TESTABLE", established: false, truth: false };
  return { ...h, epistemic_status: "UNRESOLVED", established: false, truth: false };
}
export function noChange({ expected_value = 0, cost = 1, risk = 1, complexity = 1 } = {}) {
  return { decision: expected_value < cost + risk + complexity ? "NO_CHANGE" : "CONSIDER", authority: false };
}
export function stale(h) { return { ...h, epistemic_status: "STALE", reassess: true, truth: false }; }
export function unauthorizedProbe() {
  return { status: "BLOCKED", topology: undefined, nodes: undefined, capabilities: undefined, version: undefined };
}
export function disclose(principal, payload) {
  if (principal !== "carl") return { disclosed: false };
  return { disclosed: true, payload, proof: false };
}
export function isolateCompromised(id) {
  return { id, isolated: true, revoked: true, evidence_kept: true, fabric_intact: true, process_isolated: false };
}
