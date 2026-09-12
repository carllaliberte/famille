import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createSignal,
  missingFieldStaysMissing,
  transmit,
  attachProvenance,
  route,
  createSynapse,
  setSynapsePresence,
  declareFutureIntelligence,
  keepDisagreement,
  counterAnalysis,
  asEvidence,
  asMeasure,
  remember,
  learn,
  feedback,
  reevaluate,
  unknownDimension,
  consciousnessClaim,
  absenceOfMeasureNotAbsenceOfPhenomenon,
  systemContinuesWithout,
  declaredIsNotConnected,
  consensusIsNotTruth,
  provenancePreserved,
  detectBreak,
  resilient,
  noSecondSystem,
  openLoop,
  forbidCentralBrain,
  runLoop,
} from "../sdk/nerve.js";
import { consensusToTruth, mayJudge } from "../sdk/open-intelligence.js";

test("A — création d'un signal", () => {
  const s = createSignal({ id: "s1", source: "a", type: "CLAIM" });
  assert.equal(s.id, "s1");
  assert.equal(s.type, "CLAIM");
});

test("B — transmission", () => {
  const t = transmit(createSignal({ id: "s1" }), "b");
  assert.equal(t.dest, "b");
  assert.equal(t.status, "transmitted");
});

test("C — provenance", () => {
  const s = attachProvenance(createSignal({ id: "s1", source: "a" }), {
    actor: "grok",
    ts: "2026-09-12T00:00:00Z",
    context: "pr-335",
    transform: "observe",
  });
  assert.equal(s.provenance.actor, "grok");
  assert.equal(s.provenance.chain.length, 1);
});

test("D — routage sans autorité", () => {
  const r = route({ need: "counter" }, [
    { id: "x", caps: ["counter"], presence: "DECLARED" },
    { id: "y", caps: ["write"], presence: "DECLARED" },
  ]);
  assert.equal(r.length, 1);
  assert.equal(r[0].authority, false);
});

test("E — synapse", () => {
  const syn = createSynapse({ from: "a", to: "b" });
  assert.equal(syn.presence, "DECLARED");
  assert.equal(syn.invented, false);
});

test("F — états de connexion honnêtes", () => {
  const syn = createSynapse({ from: "a", to: "gemini" });
  const c = setSynapsePresence(syn, "CONNECTED", { http200: false });
  assert.equal(c.presence, "CHANNEL_NOT_PRESENT");
  const live = setSynapsePresence(syn, "LIVE_VERIFIED", { actor: "grok" });
  assert.notEqual(live.presence, "LIVE_VERIFIED");
});

test("G — intelligence future", () => {
  const n = declareFutureIntelligence("new-model-9", ["read"]);
  assert.equal(n.presence, "DECLARED");
  assert.equal(n.mesh_fork, false);
  assert.equal(n.nature, "UNKNOWN");
});

test("H — désaccord conservé", () => {
  const rows = keepDisagreement([], { text: "non", from: "expert" });
  assert.equal(rows[0].erased, false);
});

test("I — contre-analyse", () => {
  const c = counterAnalysis({ text: "oui" }, { text: "non" });
  assert.equal(c.status, "disputed");
  assert.equal(c.truth, false);
});

test("J — preuve ≠ répétition", () => {
  const e = asEvidence({ kind: "CLAIM", text: "je le répète" });
  assert.equal(e.is_evidence, false);
});

test("K — mesure distincte", () => {
  const m = asMeasure({ kind: "INTERPRETATION" });
  assert.equal(m.measured, false);
});

test("L — mémoire datée", () => {
  const mem = remember({ kind: "hypothese", ts: "2026-09-12T00:00:00Z", context: "t", text: "x" });
  assert.equal(mem.rewritten, false);
});

test("M — feedback", () => {
  const f = feedback({ act: "comment" }, { http: 503 });
  assert.equal(f.next, "REEVALUATE");
  assert.equal(f.closed, false);
});

test("N — réévaluation", () => {
  const r = reevaluate({ kind: "fait" }, { kind: "EVIDENCE" });
  assert.equal(r.still_open, true);
});

test("O — dimension inconnue", () => {
  const d = unknownDimension("d9");
  assert.equal(d.status, "UNKNOWN");
  assert.equal(d.established, false);
});

test("P — conscience = CLAIM", () => {
  const c = consciousnessClaim("Je suis consciente", "node-x");
  assert.equal(c.kind, "CLAIM");
  assert.equal(c.established, false);
  assert.equal("consciousness" in c && c.consciousness === true, false);
});

test("Q — absence de mesure ≠ absence de phénomène", () => {
  const a = absenceOfMeasureNotAbsenceOfPhenomenon();
  assert.equal(a.not_measured, true);
  assert.equal(a.phenomenon_absent, false);
});

test("R — absence d'intelligence ≠ système arrêté", () => {
  const r = systemContinuesWithout("gemini", [{ id: "grok", presence: "DECLARED" }]);
  assert.equal(r.halted, false);
});

test("S — absence de canal ≠ connexion", () => {
  assert.equal(declaredIsNotConnected({ presence: "DECLARED" }), true);
});

test("T — consensus ≠ vérité", () => {
  assert.equal(consensusIsNotTruth(), false);
  assert.equal(consensusToTruth([1, 1, 1]), false);
});

test("U — conservation de provenance", () => {
  const a = attachProvenance(createSignal({ id: "s" }), {
    actor: "a",
    ts: "2026-09-12T00:00:00Z",
    context: "t",
  });
  const b = attachProvenance(a, {
    actor: "b",
    ts: "2026-09-12T01:00:00Z",
    context: "t",
  });
  assert.equal(provenancePreserved(a, b), true);
});

test("V — détection de rupture", () => {
  const d = detectBreak([{ id: 1 }]);
  assert.equal(d.alert, true);
  assert.equal(d.verdict, false);
});

test("W — résilience", () => {
  const r = resilient([{ id: "x", presence: "CHANNEL_NOT_PRESENT" }]);
  assert.equal(r.invented, false);
  assert.equal(r.partial, true);
});

test("X — rétrocompatibilité schemas intacts", () => {
  for (const p of [
    "schema/mesh.v0.json",
    "schema/juge.v0.json",
    "schema/flux.v0.json",
    "schema/agents.json",
  ]) {
    const j = JSON.parse(readFileSync(new URL("../" + p, import.meta.url)));
    assert.ok(j);
  }
  assert.equal(mayJudge("carl"), true);
  assert.equal(mayJudge("gemini"), false);
});

test("Y — boucle bout en bout ouverte", () => {
  const out = runLoop({ id: "e2e", source: "a", dest: "b", actor: "grok", ts: "2026-09-12T00:00:00Z", context: "t" });
  assert.equal(out.closed, false);
  assert.equal(out.loop.closed, false);
  assert.equal(out.ev.is_evidence, false);
});

test("Z — ouverture ∞ sans second système", () => {
  assert.equal(noSecondSystem({ layer: "nerve.v0", mode: "COLLECTIVE_COGNITION" }), true);
  assert.equal(forbidCentralBrain({ judge_model: true }), false);
  assert.equal(openLoop("OBSERVE").finished, false);
  assert.equal(missingFieldStaysMissing(createSignal({ id: "s" }), "episteme"), true);
});

test("apprentissage n'est pas vérité générale", () => {
  const l = learn({ lesson: "503 ≠ DOWN", ts: "2026-09-12T00:00:00Z", context: "swarm" });
  assert.equal(l.general_truth, false);
  assert.equal(l.reevaluable, true);
});
