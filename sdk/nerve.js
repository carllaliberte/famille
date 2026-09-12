/**
 * Nerve overlay — circulation only.
 * Does not replace mesh.v0 / juge.v0 / flux.v0 / agents.json.
 * Does not invent connections. LIVE VERIFIED is never set here.
 */

export const SYNAPSE_STATES = Object.freeze([
  "DECLARED",
  "CHANNEL_NOT_PRESENT",
  "CONNECTED",
  "ACTIVE",
  "BLOCKED",
  "DEGRADED",
  "DISCONNECTED",
  "LIVE_VERIFIED",
]);

export const MEMORY_KINDS = Object.freeze([
  "fait",
  "observation",
  "mesure",
  "hypothese",
  "interpretation",
  "objection",
  "decision",
  "apprentissage",
  "inconnu",
  "resolu",
  "a_reevaluer",
]);

export const LOOP = Object.freeze([
  "OBSERVE",
  "MESURE",
  "INTERPRETE",
  "CONFRONTE",
  "APPREND",
  "MEMORISE",
  "AGIT",
  "OBSERVE",
]);

const FORBIDDEN = ["judge_model", "master_model", "truth_model", "oracle_ai", "final_ai"];

export function createSignal(partial = {}) {
  const s = {
    id: partial.id || `sig-${Date.now()}`,
    source: partial.source || undefined,
    dest: partial.dest,
    ts: partial.ts || new Date().toISOString(),
    context: partial.context,
    type: partial.type || "SIGNAL",
    content: partial.content,
    episteme: partial.episteme,
    uncertainty: partial.uncertainty,
    provenance: partial.provenance,
    evidence_ref: partial.evidence_ref,
    measure_ref: partial.measure_ref,
    prior: partial.prior || [],
    contradictions: partial.contradictions || [],
    status: partial.status || "pending",
    cycle: partial.cycle || 0,
  };
  for (const k of Object.keys(s)) {
    if (s[k] === undefined) delete s[k];
  }
  return s;
}

export function missingFieldStaysMissing(signal, field) {
  return !Object.prototype.hasOwnProperty.call(signal, field) || signal[field] === undefined;
}

export function transmit(signal, dest) {
  if (!signal || !signal.id) throw new Error("signal required");
  return { ...signal, dest, status: "transmitted", prior: [...(signal.prior || []), signal.id] };
}

export function attachProvenance(signal, step) {
  if (!step || !step.actor || !step.ts || !step.context) throw new Error("provenance required");
  const chain = [...(signal.provenance?.chain || []), step];
  return {
    ...signal,
    provenance: {
      source: step.source || signal.source,
      actor: step.actor,
      ts: step.ts,
      context: step.context,
      transform: step.transform,
      version: step.version,
      input: step.input,
      output: step.output,
      episteme: step.episteme,
      chain,
    },
  };
}

export function route(signal, candidates = []) {
  return (candidates || []).filter((c) => {
    if (c.presence === "LIVE_VERIFIED" && c.id !== "carl") return false;
    if (c.presence === "CHANNEL_NOT_PRESENT") return false;
    if (c.presence === "BLOCKED" || c.presence === "DISCONNECTED") return false;
    if (signal.need === "counter" && !(c.caps || []).includes("counter")) return false;
    return true;
  }).map((c) => ({ id: c.id, reason: "capability", authority: false }));
}

export function createSynapse({ from, to, presence = "DECLARED", protocol = "mesh.v0" } = {}) {
  return {
    from,
    to,
    presence,
    protocol,
    last_observed: null,
    invented: false,
    live: false,
  };
}

export function setSynapsePresence(syn, presence, { http200 = false, actor } = {}) {
  if (!SYNAPSE_STATES.includes(presence)) throw new Error("unknown presence");
  if (presence === "CONNECTED" && !http200) {
    return { ...syn, presence: "CHANNEL_NOT_PRESENT", invented: false };
  }
  if (presence === "LIVE_VERIFIED" && actor !== "carl") {
    return { ...syn, presence: syn.presence || "DECLARED", invented: false };
  }
  if (presence === "ACTIVE" && syn.presence !== "CONNECTED" && !http200) {
    return { ...syn, presence: syn.presence || "DECLARED", invented: false };
  }
  return { ...syn, presence, invented: false };
}

export function declareFutureIntelligence(id, caps = []) {
  return {
    id,
    presence: "DECLARED",
    caps,
    nature: "UNKNOWN",
    mesh_fork: false,
    mode: "COLLECTIVE_COGNITION",
  };
}

export function keepDisagreement(records, objection) {
  return [...(records || []), { kind: "objection", ...objection, erased: false }];
}

export function counterAnalysis(claim, counter) {
  return {
    claim,
    counter,
    status: "disputed",
    truth: false,
  };
}

export function asEvidence(obj) {
  if (!obj || obj.kind !== "EVIDENCE") {
    return { ...obj, kind: obj?.kind || "CLAIM", is_evidence: false };
  }
  return { ...obj, is_evidence: true };
}

export function asMeasure(obj) {
  if (!obj || obj.kind !== "MEASUREMENT") {
    return { measured: false, kind: obj?.kind || "UNKNOWN", not_measured: true };
  }
  return { ...obj, measured: true };
}

export function remember(entry) {
  if (!entry.ts || !entry.context || !entry.kind) throw new Error("dated contextual memory required");
  if (!MEMORY_KINDS.includes(entry.kind)) throw new Error("unknown memory kind");
  return { ...entry, rewritten: false };
}

export function learn(cycle) {
  return {
    lesson: cycle.lesson,
    ts: cycle.ts,
    context: cycle.context,
    general_truth: false,
    reevaluable: true,
    kind: "apprentissage",
  };
}

export function feedback(action, observation) {
  return {
    action,
    observation,
    next: "REEVALUATE",
    closed: false,
  };
}

export function reevaluate(memory, newEvidence) {
  return {
    prior: memory,
    newEvidence,
    status: "a_reevaluer",
    still_open: true,
  };
}

export function unknownDimension(id) {
  return { id, status: "UNKNOWN", unresolved: true, established: false };
}

export function consciousnessClaim(text, from) {
  return {
    kind: "CLAIM",
    text,
    from,
    established: false,
    consciousness: undefined,
  };
}

export function absenceOfMeasureNotAbsenceOfPhenomenon() {
  return { not_measured: true, phenomenon_absent: false };
}

export function systemContinuesWithout(missingId, nodes) {
  const left = (nodes || []).filter((n) => n.id !== missingId);
  return { running: left.length >= 0, missing: missingId, halted: false };
}

export function declaredIsNotConnected(row) {
  return row.presence === "DECLARED" && row.presence !== "CONNECTED";
}

export function consensusIsNotTruth() {
  return false;
}

export function provenancePreserved(before, after) {
  const a = before?.provenance?.chain || [];
  const b = after?.provenance?.chain || [];
  return a.every((step, i) => b[i] && b[i].ts === step.ts && b[i].actor === step.actor);
}

export function detectBreak(chain) {
  if (!chain || chain.length === 0) return { kind: "rupture", alert: true, verdict: false };
  const lost = chain.some((s) => !s.provenance);
  return { kind: lost ? "perte_provenance" : null, alert: lost, verdict: false };
}

export function resilient(nodes) {
  const any = (nodes || []).some((n) => n.presence === "ACTIVE" || n.presence === "CONNECTED" || n.presence === "DECLARED");
  return { partial: true, running: any || (nodes || []).length === 0, invented: false };
}

export function noSecondSystem(obj) {
  return !obj.mesh2 && obj.mode === "COLLECTIVE_COGNITION" && obj.layer === "nerve.v0";
}

export function openLoop(state = "OBSERVE") {
  const i = LOOP.indexOf(state);
  const next = LOOP[(i >= 0 ? i + 1 : 0) % LOOP.length];
  return { state, next, closed: false, omniscient: false, perfect: false, finished: false };
}

export function forbidCentralBrain(obj) {
  return !FORBIDDEN.some((k) => k in (obj || {}));
}

export function runLoop(seed) {
  let sig = createSignal({ id: seed.id || "loop-1", source: seed.source || "node-a", type: "OBSERVE", context: seed.context || "test" });
  sig = transmit(sig, seed.dest || "node-b");
  sig = attachProvenance(sig, {
    actor: seed.actor || "grok",
    ts: seed.ts || "2026-09-12T00:00:00Z",
    context: seed.context || "test",
    transform: "observe",
    source: sig.source,
  });
  const ev = asEvidence({ kind: "CLAIM", text: "not evidence" });
  const m = asMeasure({ kind: "UNKNOWN" });
  const mem = remember({ kind: "observation", ts: sig.ts, context: sig.context || "test", text: "seen" });
  const fb = feedback({ act: "none" }, { seen: true });
  const re = reevaluate(mem, null);
  const loop = openLoop("AGIT");
  return { sig, ev, m, mem, fb, re, loop, closed: false };
}
