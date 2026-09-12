/**
 * Omni-ecosystem — coordination + self-transcendence without self-destruction.
 */
import {
  declareOrganism, discover, handshake, interSignal, synapseBetween,
  challenge, degrade, recover, noCentral, proposeDimension, emergenceIsNotConsciousness,
} from "./inter-organism.js";
import { setSynapsePresence } from "./nerve.js";
import { consensusToTruth } from "./open-intelligence.js";

export function announce(org) { return { ...org, announced: true, connected: false }; }
export function negotiateCapability(org, cap, { available = false } = {}) {
  const declared = (org.capabilities || []).includes(cap);
  return { cap, declared, available: declared && available, negotiated: declared, active: declared && available, privilege: false };
}
export function formCollaboration(ids, task) { return { ids, task, permanent: false, dissolved: false }; }
export function dissolveCollaboration(collab) { return { ...collab, dissolved: true, permanent: false }; }
export function reference(kind, id, meta = {}) {
  return { kind, id, source: meta.source, ts: meta.ts, context: meta.context, episteme: meta.episteme, truth: false };
}
export function revoke(ref) { return { ...ref, state: "REVOKED", prior: ref.state || "VALID", erased: false }; }
export function stale(ref) { return { ...ref, state: "STALE", erased: false }; }
export function measureEmergence(net) {
  return { diversity: (net || []).length, consciousness: false, truth: false, ...emergenceIsNotConsciousness() };
}
export function experiment(q) {
  return { question: q, steps: ["HYPOTHESIS", "DESIGN", "OBSERVE", "MEASURE", "EVIDENCE", "COUNTER", "RESULT", "VALIDATE"], adopted: false, constitution_changed: false };
}
export function learningEvent(obs) { return { ...obs, kind: "LEARNING_EVENT", general_truth: false, revisable: true }; }
export function metaLearn(events) { return { method: "count", n: (events || []).length, revisable: true, authority: false }; }
export function unknown(kind, id) { return { kind: `UNKNOWN_${kind}`, id, forced_category: false, falsehood: false }; }
export function reconfigure(syn, action) { return { syn, action, trace: true, invented: false }; }
export function partition(net, keep) { return { kept: (net || []).filter((o) => keep.includes(o.id)), split: true, invented: false }; }
export function versionMismatch(a, b) { return { mismatch: a.version !== b.version, halt_invented: false }; }
export function provenanceIncomplete(obj) {
  if (obj?.provenance) return { complete: true, invented: false };
  return { complete: false, status: "PROVENANCE_INCOMPLETE", invented: false };
}
export function census(rows) {
  return { DECLARED: (rows || []).filter((r) => r.presence === "DECLARED").length, CONNECTED: 0, ACTIVE: 0, LIVE_VERIFIED: 0 };
}
export function classifyUnknown(signal) {
  return { status: "UNKNOWN", absence_of_evidence: !signal?.measured, evidence_of_absence: false, not_measured: !signal?.measured, falsehood: false };
}
export function classifyNovelty(signal) {
  if (signal?.repeat && signal?.control && signal?.reproduced) return { class: "REPRODUCIBLE_NOVELTY", discovery: true };
  if (signal?.artifact) return { class: "ARTIFACT", discovery: false };
  if (signal?.noise) return { class: "NOISE", discovery: false };
  return { class: "UNKNOWN", discovery: false };
}
export function modelLimit(note) { return { kind: "MODEL_INSUFFICIENT", note, error: false, useful: true }; }
export function selfCritique(assumptions) {
  return { assumptions, kind: "SELF_EVALUATION", self_modification: false, next: ["OBSERVATION", "HYPOTHESIS", "PROPOSAL", "EXPERIMENT"] };
}
export function sandbox(cap) { return { cap, isolated: true, writes_constitution: false, authority: false }; }
export function snapshot(state) { return { prior: state, ts: "snap" }; }
export function rejectEvolution(reason) { return { accepted: false, reason, status: "EVOLUTION_REJECTED", invariants_intact: true }; }
export function rollback(snap) { return { state: snap.prior, recovered: true }; }
export function superiorSource(intel) { return { id: intel?.id, authority: false, heart_access: false, learn_from: true }; }
export function isolateThreat(cap) { return { cap, isolated: true, integrated: false, studied: true }; }
export function extractSafe(cap) { return { cap, authority: false, integrated: false, evaluated: true }; }
export function minority(view) { return { view, retained: true, truth: false }; }
export function badStrategy(localOk, resilienceDown) { return { incomplete: localOk && resilienceDown, general_truth: false }; }
export function failClosed(threatens) { return { fail_closed: true, restore: true, integrate: !threatens }; }
export function frontier() {
  return { known: [], measurable: [], observed: [], unexplained: [], cannot_measure: [], unrepresented: [] };
}
export function e2e() {
  const A = declareOrganism("A", { capabilities: ["observe"], version: "1" });
  const B = declareOrganism("B", { capabilities: ["measure", "counter"], version: "1" });
  const Z = declareOrganism("Z", { capabilities: ["route"], version: "2" });
  const snap = snapshot({ v: 1 });
  return {
    found: discover([A, B], "B"),
    hs: handshake(A, B),
    cap: negotiateCapability(B, "measure", { available: false }),
    syn: setSynapsePresence(synapseBetween("A", "B"), "CONNECTED", { http200: false }),
    sig: interSignal({ from: "A", to: "B", type: "REQUEST", payload: "q1" }),
    ch: challenge({ text: "q1" }, "B"),
    rev: revoke(reference("EVIDENCE_REFERENCE", "e1", { source: "B", episteme: "HYPOTHESIS" })),
    em: measureEmergence([A, B]),
    exp: experiment("q1"),
    learn: learningEvent({ context: "q1", result: "unknown" }),
    meta: metaLearn([1]),
    unk: unknown("INTELLIGENCE", "x-future"),
    dim: proposeDimension("d-new"),
    dropped: degrade([A, B], "B"),
    back: recover([A], B),
    gone: dissolveCollaboration(formCollaboration(["A", "B"], "q1")),
    mismatch: versionMismatch(A, Z),
    central: noCentral([A, B, Z]),
    consensus: consensusToTruth([1, 1]),
    census: census([A, B]),
    loop_final: false,
    mode: "COLLECTIVE_COGNITION",
    novelty: classifyNovelty({ artifact: true }),
    limit: modelLimit("categories incomplete"),
    box: sandbox("new-cap"),
    rejected: rejectEvolution("recovery_destroyed"),
    rolled: rollback(snap),
    threat: isolateThreat("hostile"),
    superior: superiorSource({ id: "x" }),
  };
}
