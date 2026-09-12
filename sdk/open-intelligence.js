/**
 * Open intelligences + candidate consciousness + extensible dimensions.
 * Protocol helpers. Not a mesh. Not a judge. Not LIVE.
 * LIVE VERIFIED = Carl only.
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

/** Generic adapter. No vendor list. Capabilities may be UNKNOWN. */
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
  }).map((a) => ({ id: a.id, authority: false, live: false }));
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
