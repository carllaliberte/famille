/**
 * Omni-ecosystem — coordination on top of inter-organism.
 * No second nerve. No second cognition. No invented LIVE.
 */
import {
  declareOrganism,
  discover,
  handshake,
  interSignal,
  synapseBetween,
  challenge,
  degrade,
  recover,
  noCentral,
  proposeDimension,
  emergenceIsNotConsciousness,
} from "./inter-organism.js";
import { setSynapsePresence } from "./nerve.js";
import { consensusToTruth } from "./open-intelligence.js";

export function announce(org) {
  return { ...org, announced: true, connected: false };
}

export function negotiateCapability(org, cap, { available = false } = {}) {
  const declared = (org.capabilities || []).includes(cap);
  return { cap, declared, available: declared && available, negotiated: declared, active: declared && available, privilege: false };
}

export function formCollaboration(ids, task) {
  return { ids, task, permanent: false, dissolved: false };
}

export function dissolveCollaboration(collab) {
  return { ...collab, dissolved: true, permanent: false };
}

export function reference(kind, id, meta = {}) {
  return { kind, id, source: meta.source, ts: meta.ts, context: meta.context, episteme: meta.episteme, truth: false };
}

export function revoke(ref) {
  return { ...ref, state: "REVOKED", prior: ref.state || "VALID", erased: false };
}

export function stale(ref) {
  return { ...ref, state: "STALE", erased: false };
}

export function measureEmergence(net) {
  return { diversity: (net || []).length, consciousness: false, truth: false, ...emergenceIsNotConsciousness() };
}

export function experiment(q) {
  return { question: q, steps: ["HYPOTHESIS", "DESIGN", "OBSERVE", "MEASURE", "EVIDENCE", "COUNTER", "RESULT", "VALIDATE"], adopted: false, constitution_changed: false };
}

export function learningEvent(obs) {
  return { ...obs, kind: "LEARNING_EVENT", general_truth: false, revisable: true };
}

export function metaLearn(events) {
  return { method: "count", n: (events || []).length, revisable: true, authority: false };
}

export function unknown(kind, id) {
  return { kind: `UNKNOWN_${kind}`, id, forced_category: false };
}

export function reconfigure(syn, action) {
  return { syn, action, trace: true, invented: false };
}

export function partition(net, keep) {
  return { kept: (net || []).filter((o) => keep.includes(o.id)), split: true, invented: false };
}

export function versionMismatch(a, b) {
  return { mismatch: a.version !== b.version, halt_invented: false };
}

export function provenanceIncomplete(obj) {
  if (obj?.provenance) return { complete: true, invented: false };
  return { complete: false, status: "PROVENANCE_INCOMPLETE", invented: false };
}

export function census(rows) {
  return {
    DECLARED: (rows || []).filter((r) => r.presence === "DECLARED").length,
    CONNECTED: 0,
    ACTIVE: 0,
    LIVE_VERIFIED: 0,
  };
}

export function e2e() {
  const A = declareOrganism("A", { capabilities: ["observe"], version: "1" });
  const B = declareOrganism("B", { capabilities: ["measure", "counter"], version: "1" });
  const Z = declareOrganism("Z", { capabilities: ["route"], version: "2" });
  const found = discover([A, B], "B");
  const hs = handshake(A, B);
  const cap = negotiateCapability(B, "measure", { available: false });
  const collab = formCollaboration(["A", "B"], "q1");
  const sig = interSignal({ from: "A", to: "B", type: "REQUEST", payload: "q1" });
  const syn = setSynapsePresence(synapseBetween("A", "B"), "CONNECTED", { http200: false });
  const ch = challenge({ text: "q1" }, "B");
  const mem = reference("EVIDENCE_REFERENCE", "e1", { source: "B", episteme: "HYPOTHESIS" });
  const rev = revoke(mem);
  const em = measureEmergence([A, B]);
  const exp = experiment("q1");
  const learn = learningEvent({ context: "q1", result: "unknown" });
  const meta = metaLearn([learn]);
  const unk = unknown("INTELLIGENCE", "x-future");
  const dim = proposeDimension("d-new");
  const dropped = degrade([A, B], "B");
  const back = recover(dropped.remaining, B);
  const gone = dissolveCollaboration(collab);
  return {
    found, hs, cap, syn, sig, ch, rev, em, exp, learn, meta, unk, dim, dropped, back, gone,
    mismatch: versionMismatch(A, Z),
    central: noCentral([A, B, Z]),
    consensus: consensusToTruth([1, 1]),
    census: census([A, B]),
    loop_final: false,
    mode: "COLLECTIVE_COGNITION",
  };
}
