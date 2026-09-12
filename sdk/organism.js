/**
 * Organism map — composes nerve + open-intelligence.
 * Metaphor only. Does not invent connections or consciousness.
 */
import {
  createSignal,
  transmit,
  attachProvenance,
  route,
  createSynapse,
  setSynapsePresence,
  keepDisagreement,
  counterAnalysis,
  asEvidence,
  asMeasure,
  remember,
  learn,
  feedback,
  reevaluate,
  openLoop,
  forbidCentralBrain,
  declareFutureIntelligence,
} from "./nerve.js";
import { mayJudge, consensusToTruth, recordConsciousnessClaim } from "./open-intelligence.js";

export const ORGANS = Object.freeze([
  "coeur",
  "cerveau",
  "nerf",
  "perception",
  "metabolisme",
  "immunite",
  "squelette",
  "specialise",
  "regeneration",
  "environnement",
  "homeostasie",
]);

export function map() {
  return {
    kind: "organism.v0",
    mode: "COLLECTIVE_COGNITION",
    nerve: "nerve.v0",
    alive: false,
    conscious: false,
    organs: ORGANS,
  };
}

export function perceive(raw) {
  return {
    kind: raw.kind || "OBSERVATION",
    episteme: raw.episteme || "OBSERVED",
    raw: raw.text,
    inferred: raw.inferred === true,
    interpreted: raw.interpreted === true,
    reliable: false,
    provenance: raw.provenance,
  };
}

export function resource(obs) {
  if (!obs || obs.measured !== true) {
    return { known: false, invented: false, kind: "NOT_MEASURED" };
  }
  return { known: true, invented: false, cost: obs.cost, unit: obs.unit };
}

export function classifyAnomaly(evt) {
  const kind = evt?.kind || "ANOMALY";
  return {
    detect: true,
    classify: kind,
    isolate: kind === "judge_behavior" || kind === "master_model",
    report: true,
    recover: false,
    verdict: false,
    erase: false,
  };
}

export function evolve({ from, to, ts, context, actor }) {
  if (!ts || !context || !actor) throw new Error("dated evolution required");
  return { from, to, ts, context, actor, automatically_better: false, reversible: true };
}

export function healthState(parts) {
  return {
    dimensions: { ...(parts || {}) },
    single_score: null,
    truth: false,
  };
}

export function humanDecide(proposal, actor) {
  return {
    proposal,
    decided: actor === "carl",
    actor,
    live: false,
  };
}

export function integrate(seed = {}) {
  const seen = perceive({ text: seed.text || "ping", episteme: "OBSERVED", provenance: { from: seed.from || "ext" } });
  let sig = createSignal({ id: seed.id || "org-1", source: seen.provenance?.from, type: "PERCEIVE", context: seed.context || "t" });
  sig = transmit(sig, seed.dest || "pool");
  sig = attachProvenance(sig, {
    actor: seed.actor || "grok",
    ts: seed.ts || "2026-09-12T00:00:00Z",
    context: seed.context || "t",
    transform: "perceive",
  });
  const syn = createSynapse({ from: sig.source, to: sig.dest });
  const syn2 = setSynapsePresence(syn, "CONNECTED", { http200: false });
  const routes = route(sig, seed.nodes || [{ id: "grok", caps: ["counter"], presence: "DECLARED" }]);
  const claim = recordConsciousnessClaim({
    from: seed.from || "node-x",
    text: "Je suis consciente",
    ts: seed.ts || "2026-09-12T00:00:00Z",
    context: seed.context || "t",
  });
  const counter = counterAnalysis(claim, { text: "CLAIM seulement" });
  const ev = asEvidence(claim);
  const m = asMeasure({ kind: "UNKNOWN" });
  const mem = remember({ kind: "observation", ts: sig.ts, context: sig.context || "t", text: seen.raw });
  const decision = humanDecide({ act: "hold" }, "carl");
  const fb = feedback(decision, seen);
  const re = reevaluate(mem, ev);
  const lesson = learn({ lesson: "degraded ok", ts: sig.ts, context: sig.context || "t" });
  return {
    seen,
    sig,
    syn: syn2,
    routes,
    counter,
    ev,
    m,
    mem,
    decision,
    fb,
    re,
    lesson,
    loop: openLoop("AGIT"),
    closed: false,
    mesh2: false,
    judge: mayJudge("gemini"),
    consensus_truth: consensusToTruth([1, 1]),
    brain_ok: forbidCentralBrain({}),
    future: declareFutureIntelligence("next-x", []),
  };
}
