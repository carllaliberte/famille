import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  map,
  perceive,
  resource,
  classifyAnomaly,
  evolve,
  healthState,
  humanDecide,
  integrate,
  ORGANS,
} from "../sdk/organism.js";
import { mayJudge, consensusToTruth } from "../sdk/open-intelligence.js";
import { forbidCentralBrain, noSecondSystem, createSynapse, setSynapsePresence } from "../sdk/nerve.js";

test("A — cœur intact (invariants docs)", () => {
  const c = readFileSync(new URL("../COGNITION.md", import.meta.url), "utf8");
  assert.match(c, /COLLECTIVE_COGNITION/);
  assert.match(c, /Carl/);
});

test("B — collective cognition intacte", () => {
  assert.equal(map().mode, "COLLECTIVE_COGNITION");
});

test("C — aucune hiérarchie cognitive", () => {
  assert.equal(mayJudge("gemini"), false);
  assert.equal(mayJudge("carl"), true);
});

test("D — intelligence future", () => {
  assert.equal(integrate().future.presence, "DECLARED");
});

test("E — déclaré ≠ réel", () => {
  const s = setSynapsePresence(createSynapse({ from: "a", to: "b" }), "CONNECTED", { http200: false });
  assert.equal(s.presence, "CHANNEL_NOT_PRESENT");
});

test("F G H — signal synapse routage", () => {
  const i = integrate();
  assert.ok(i.sig.id);
  assert.equal(i.syn.invented, false);
  assert.equal(i.routes[0].authority, false);
});

test("I AD — provenance", () => {
  assert.ok(integrate().sig.provenance.chain.length >= 1);
});

test("J — observation ≠ interprétation", () => {
  const p = perceive({ text: "x", episteme: "OBSERVED" });
  assert.equal(p.interpreted, false);
  assert.equal(p.reliable, false);
});

test("K L — mesure ≠ preuve auto ; preuve pas auto", () => {
  const i = integrate();
  assert.equal(i.m.measured, false);
  assert.equal(i.ev.is_evidence, false);
});

test("M N — contradiction / consensus", () => {
  assert.equal(integrate().counter.truth, false);
  assert.equal(consensusToTruth([1, 1, 1]), false);
});

test("O AI — conscience claim", () => {
  const i = integrate();
  assert.notEqual(i.ev.kind, "EVIDENCE");
  assert.equal(map().conscious, false);
});

test("P — absence ≠ preuve d'absence", () => {
  assert.equal(resource({ measured: false }).invented, false);
});

test("Q R — dimension ouverte", () => {
  assert.ok(ORGANS.includes("perception"));
});

test("S T — mémoire / feedback", () => {
  const i = integrate();
  assert.equal(i.mem.rewritten, false);
  assert.equal(i.fb.closed, false);
});

test("U V W X — défaillance / canal / dégradé", () => {
  const a = classifyAnomaly({ kind: "node_down" });
  assert.equal(a.verdict, false);
  assert.equal(a.erase, false);
  assert.equal(integrate().syn.presence, "CHANNEL_NOT_PRESENT");
});

test("Y — rollback conceptuel", () => {
  const e = evolve({ from: "a", to: "b", ts: "2026-09-12T00:00:00Z", context: "t", actor: "carl" });
  assert.equal(e.automatically_better, false);
  assert.equal(e.reversible, true);
});

test("Z AA AB — schemas / pas second mesh / pas juge", () => {
  for (const p of ["schema/mesh.v0.json", "schema/juge.v0.json", "schema/flux.v0.json", "schema/nerve.v0.json"]) {
    JSON.parse(readFileSync(new URL("../" + p, import.meta.url)));
  }
  assert.equal(noSecondSystem({ layer: "nerve.v0", mode: "COLLECTIVE_COGNITION" }), true);
  assert.equal(forbidCentralBrain({ judge_model: 1 }), false);
});

test("AC — gouvernance humaine", () => {
  assert.equal(humanDecide({}, "grok").decided, false);
  assert.equal(humanDecide({}, "carl").decided, true);
});

test("AE AF AG AH AJ — boucle ouverte", () => {
  const i = integrate();
  assert.equal(i.closed, false);
  assert.equal(i.loop.finished, false);
  assert.equal(i.mesh2, false);
  assert.equal(i.judge, false);
  assert.equal(healthState({ latency: "UNKNOWN" }).single_score, null);
});

test("intégration bout en bout", () => {
  const i = integrate({ text: "ext", from: "user" });
  assert.ok(i.seen && i.sig && i.syn && i.decision && i.fb && i.re);
  assert.equal(i.consensus_truth, false);
});
