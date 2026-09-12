/**
 * Inter-organism fabric. Communication only.
 * Reuses nerve synapses. Does not invent connections or collective consciousness.
 */
import { createSignal, attachProvenance, createSynapse, setSynapsePresence } from "./nerve.js";
import { map as organismMap, perceive } from "./organism.js";

export function declareOrganism(id, attrs = {}) {
  return {
    id,
    version: attrs.version,
    architecture: attrs.architecture || "organism.v0",
    capabilities: attrs.capabilities || [],
    limitations: attrs.limitations || [],
    presence: "DECLARED",
    trust: "UNVERIFIED",
    authority: false,
  };
}

export function organismState(org, extra = {}) {
  const out = {
    identity: org.id,
    architecture: org.architecture,
    capabilities: org.capabilities,
    connection_state: org.presence,
    ts: extra.ts || new Date().toISOString(),
    private_memory: undefined,
  };
  if (extra.cognitive) out.cognitive = extra.cognitive;
  if (extra.consciousness_related) out.consciousness_related = extra.consciousness_related;
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  return out;
}

export function discover(roster, id) {
  const hit = (roster || []).find((o) => o.id === id);
  if (!hit) return { id, presence: "UNKNOWN", trusted: false };
  return { ...hit, discovered: true, trusted: false };
}

export function handshake(a, b) {
  return {
    a: a.id,
    b: b.id,
    compatible: true,
    trusted: false,
    verified: false,
    conscious: false,
    superior: false,
    meaning: "COMMUNICATION PROTOCOL COMPATIBLE",
  };
}

export function whoCan(roster, cap) {
  return (roster || []).filter((o) => (o.capabilities || []).includes(cap)).map((o) => o.id);
}

export function interSignal({ from, to, type, payload, episteme }) {
  const s = createSignal({
    id: `io-${from}-${to}-${type || "STATE"}`,
    source: from,
    dest: to,
    type: type || "STATE",
    content: payload,
    episteme,
    context: "inter-organism",
  });
  return attachProvenance(s, {
    actor: from,
    ts: s.ts,
    context: "inter-organism",
    transform: "emit",
    source: from,
  });
}

export function synapseBetween(a, b) {
  return createSynapse({ from: a, to: b, protocol: "inter-organism.v0" });
}

export function challenge(claim, from) {
  return { claim, from, kind: "COUNTER_ANALYSIS", answers: ["SUPPORTED", "CONTRADICTED", "INSUFFICIENT_EVIDENCE", "UNKNOWN", "UNRESOLVED"] };
}

export function memoryRef(id, access = "RESTRICTED") {
  return { kind: "MEMORY_REFERENCE", id, access, full_dump: false };
}

export function expose(mem, access) {
  if (mem.access === "PRIVATE" && access !== "PRIVATE") return { denied: true };
  return { denied: false, ref: mem };
}

export function isolateInvalid(signal) {
  if (!signal || !signal.source || !signal.provenance) {
    return { isolate: true, report: true, erase: false, verdict: false };
  }
  return { isolate: false, report: false, erase: false };
}

export function preventNetLoop(path, next) {
  if ((path || []).includes(next)) return { blocked: true, kind: "NETWORK_LOOP" };
  return { blocked: false, path: [...(path || []), next] };
}

export function emergenceIsNotConsciousness() {
  return { pattern: true, collective_consciousness: false, truth: false };
}

export function proposeDimension(id) {
  return { id, status: "HYPOTHESIS", unresolved: true };
}

export function degrade(network, missingId) {
  return {
    missing: missingId,
    remaining: (network || []).filter((o) => o.id !== missingId),
    presence: "DEGRADED",
    invented: false,
  };
}

export function recover(network, org) {
  return { network: [...network, { ...org, presence: "DECLARED" }], invented: false };
}

export function noCentral(network) {
  return !(network || []).some((o) => o.central || o.master || o.authority === true);
}

export function meshScenario() {
  const A = declareOrganism("A", { capabilities: ["observe"] });
  const B = declareOrganism("B", { capabilities: ["measure", "counter"] });
  const C = declareOrganism("C", { capabilities: ["counter"] });
  const D = declareOrganism("D", { capabilities: ["observe"] });
  const E = declareOrganism("E", { capabilities: ["measure"] });
  const roster = [A, B, C, D, E];
  const d = discover(roster, "B");
  const hs = handshake(A, B);
  const caps = whoCan(roster, "counter");
  const sig = interSignal({ from: "A", to: "B", type: "REQUEST", payload: { q: "x" }, episteme: "HYPOTHESIS" });
  const ch = challenge({ text: "x" }, "C");
  const ev = { kind: "CLAIM", is_evidence: false };
  const unk = { episteme: "UNKNOWN" };
  const syn = setSynapsePresence(synapseBetween("B", "C"), "CONNECTED", { http200: false });
  const dropped = degrade(roster, "E");
  const back = recover(dropped.remaining, E);
  return {
    roster, d, hs, caps, sig, ch, ev, unk, syn, dropped, back,
    central: noCentral(roster),
    emergence: emergenceIsNotConsciousness(),
    mode: "COLLECTIVE_COGNITION",
  };
}

export { organismMap, perceive };
