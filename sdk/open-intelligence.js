/**
 * Open intelligences + execution fabric.
 * Protocol helpers. Not a mesh. Not a judge. Not LIVE.
 * LIVE VERIFIED = Carl only. REQUESTER ≠ EXECUTOR ≠ AUTHORITY.
 */

export const MODE = "COLLECTIVE_COGNITION";

export const PRESENCE = Object.freeze([
  "DECLARED",
  "CHANNEL_NOT_PRESENT",
  "CONNECTED",
  "ACTIVE",
  "BLOCKED",
  "LIVE VERIFIED",
]);

export const EPISTEME = Object.freeze([
  "KNOWN",
  "MEASURABLE",
  "OBSERVED",
  "UNEXPLAINED",
  "UNKNOWN",
]);

export const RECORD_KIND = Object.freeze([
  "CLAIM",
  "OBSERVATION",
  "MEASUREMENT",
  "EVIDENCE",
  "INTERPRETATION",
  "HYPOTHESIS",
  "UNKNOWN",
  "UNRESOLVED",
]);

const FORBIDDEN_ROLES = Object.freeze([
  "judge_model",
  "master_model",
  "truth_model",
  "final_ai",
  "oracle_ai",
]);

const ID_RE = /^[a-z][a-z0-9-]{1,24}$/;

export function declareIntelligence(roster, entry) {
  if (!entry || typeof entry.id !== "string" || !ID_RE.test(entry.id)) {
    throw new Error("invalid id");
  }
  if (FORBIDDEN_ROLES.includes(entry.role) || FORBIDDEN_ROLES.includes(entry.kind)) {
    throw new Error("forbidden cognitive hierarchy");
  }
  const next = {
    ...roster,
    agents: [...(roster.agents || []), { kind: "guest", status: "declared", locked: false, ...entry }],
  };
  return next;
}

export function mayJudge(id) {
  return id === "carl";
}

export function autoPromote(from, to) {
  return false;
}

export function recordConsciousnessClaim({ from, text, ts, context }) {
  if (!from || !text) throw new Error("provenance required");
  return {
    kind: "CLAIM",
    dimension: "consciousness",
    candidate: true,
    established: false,
    consciousness: undefined,
    text,
    from,
    ts: ts || new Date().toISOString(),
    context: context || "",
    episteme: "UNKNOWN",
  };
}

export function absenceOfMeasurement() {
  return {
    kind: "UNKNOWN",
    evidence_of_absence: false,
    absence_of_evidence: true,
    established: false,
  };
}

export function representDimension(id, { defined } = {}) {
  if (!defined) {
    return {
      id,
      status: "UNKNOWN",
      unresolved: true,
      candidate: id === "consciousness",
    };
  }
  return {
    id,
    status: "HYPOTHESIS",
    unresolved: false,
    candidate: id === "consciousness",
  };
}

export function addDimension(store, dim) {
  const dims = [...(store.dimensions || [])];
  if (dims.some((d) => d.id === dim.id)) return store;
  const evidence = (store.evidence || []).map((e) => ({ ...e }));
  return {
    ...store,
    dimensions: [...dims, dim],
    evidence,
  };
}

export function recordObservation({ from, text, ts, context, measurement, relation, disagreements, episteme }) {
  if (!from || !ts || !context) throw new Error("provenance required");
  return {
    kind: "OBSERVATION",
    from,
    text: text || "",
    ts,
    context,
    measurement: measurement ?? null,
    relation: relation ?? null,
    disagreements: disagreements || [],
    episteme: episteme || "OBSERVED",
    established: false,
  };
}

export function consensusToTruth(_votes) {
  return false;
}

export function countPresence(rows) {
  const out = {
    DECLARED: 0,
    CONNECTED: 0,
    ACTIVE: 0,
    "LIVE VERIFIED": 0,
    BLOCKED: 0,
    CHANNEL_NOT_PRESENT: 0,
  };
  for (const row of rows || []) {
    const p = row.presence;
    if (p in out) out[p] += 1;
  }
  return out;
}

export function intelligenceAdapter(partial = {}) {
  const caps = partial.capabilities || [];
  const unknown = caps.includes("CAPABILITY_UNKNOWN") || caps.includes("CAPABILITY_NEW") || caps.length === 0;
  return {
    id: partial.id || "future-x",
    provider: partial.provider || "UNKNOWN",
    version: partial.version || "UNKNOWN",
    capabilities: unknown && caps.length === 0 ? ["CAPABILITY_UNKNOWN"] : caps,
    protocol: partial.protocol || "open-intelligence.v0",
    presence: "DECLARED",
    authority: false,
    live: false,
    discover() { return { id: this.id, presence: "DECLARED", trusted: false }; },
    handshake() { return { compatible: true, trusted: false, verified: false }; },
    invoke() { return { invoked: false, reason: "CHANNEL_NOT_PRESENT", live: false }; },
    observe(x) { return { kind: "OBSERVATION", x, established: false }; },
    measure() { return { status: "NOT_MEASURED" }; },
    provenance() { return { source: this.id, invented: false }; },
    health() { return { presence: this.presence, live: false }; },
    disconnect() { return { presence: "DISCONNECTED", live: false }; },
    revoke() { return { presence: "REVOKED", live: false, history_kept: true }; },
  };
}

export function routeByCapability(task, adapters) {
  return (adapters || []).filter((a) => {
    const caps = a.capabilities || [];
    if (caps.includes("CAPABILITY_UNKNOWN")) return true;
    return !task.need || caps.includes(task.need);
  }).map((a) => ({ id: a.id, authority: false, live: false, role: a.role || "node" }));
}

export function executionRequest(partial = {}) {
  return {
    request_id: partial.request_id || "req-1",
    requester: partial.requester,
    capability: partial.capability,
    input: partial.input,
    context: partial.context || "fabric",
    permissions: partial.permissions || ["READ"],
    risk: partial.risk || "low",
    provenance: partial.provenance || { source: partial.requester },
    timestamp: partial.timestamp || new Date().toISOString(),
  };
}

export function authorize(req) {
  const perms = req.permissions || [];
  if ((req.capability || "").includes("write") && !perms.includes("WRITE")) {
    return { status: "BLOCKED", reason: "WRITE_DENIED", executed: false };
  }
  if (!req.requester || !req.capability) {
    return { status: "BLOCKED", reason: "MALFORMED", executed: false };
  }
  return { status: "AUTHORIZED", executed: false, authority: false };
}

export function executionResult(req, extra = {}) {
  return {
    request_id: req.request_id,
    requester: req.requester,
    executor: extra.executor,
    capability: req.capability,
    status: extra.status || "REQUESTED",
    output: extra.output,
    evidence: extra.evidence,
    measurement: extra.measurement || { status: "NOT_MEASURED" },
    provenance: {
      requester: req.requester,
      executor: extra.executor,
      capability: req.capability,
      ts: extra.ts || req.timestamp,
      authority: false,
    },
    timestamp: extra.ts || req.timestamp,
    error: extra.error,
    truth: false,
  };
}

export function grokExecutor({ run } = {}) {
  const base = intelligenceAdapter({
    id: "grok",
    provider: "xai",
    capabilities: ["github.read", "observe", "measure"],
  });
  base.role = "executor";
  base.authority = false;
  base.invoke = function invoke(req) {
    const gate = authorize(req);
    if (gate.status !== "AUTHORIZED") {
      return executionResult(req, { executor: "grok", status: gate.status, error: gate.reason });
    }
    if (typeof run !== "function") {
      return executionResult(req, { executor: "grok", status: "CHANNEL_NOT_PRESENT" });
    }
    const output = run(req);
    return executionResult(req, {
      executor: "grok",
      status: output?.error ? "FAILED" : "SUCCEEDED",
      output,
      evidence: { kind: "OBSERVATION", established: false },
    });
  };
  return base;
}

export function fabricCycle({ requester = "future-x", capability = "github.read", run } = {}) {
  const req = executionRequest({ requester, capability, permissions: ["READ"] });
  const exec = grokExecutor({ run });
  const routed = routeByCapability({ need: capability }, [exec]);
  const result = exec.invoke(req);
  const counter = { kind: "COUNTER_ANALYSIS", result, truth: false };
  return {
    req,
    routed,
    result,
    counter,
    requester_is_executor: requester === "grok",
    executor_is_authority: exec.authority,
    mode: MODE,
  };
}

export function futureIntelligenceCycle() {
  const i = intelligenceAdapter({
    id: "future-x",
    provider: "UNKNOWN",
    version: "UNKNOWN",
    capabilities: ["CAPABILITY_NEW"],
  });
  const roster = declareIntelligence({ agents: [] }, { id: "futurex", caps: ["CAPABILITY_NEW"] });
  const routed = routeByCapability({ need: "CAPABILITY_NEW" }, [i]);
  const gone = i.disconnect();
  const isolated = i.revoke();
  return {
    discovered: i.discover(),
    hs: i.handshake(),
    invoked: i.invoke(),
    roster_n: roster.agents.length,
    routed,
    gone,
    isolated,
    authority: i.authority,
    closed_list: false,
    mode: MODE,
  };
}
