import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  declareOrganism,
  organismState,
  discover,
  handshake,
  whoCan,
  interSignal,
  challenge,
  memoryRef,
  expose,
  isolateInvalid,
  preventNetLoop,
  emergenceIsNotConsciousness,
  proposeDimension,
  degrade,
  recover,
  noCentral,
  meshScenario,
} from "../sdk/inter-organism.js";
import { mayJudge } from "../sdk/open-intelligence.js";

test("A — découverte", () => {
  const r = [declareOrganism("B")];
  const d = discover(r, "B");
  assert.equal(d.discovered, true);
  assert.equal(d.trusted, false);
});

test("B — handshake ≠ trust", () => {
  const h = handshake(declareOrganism("A"), declareOrganism("B"));
  assert.equal(h.trusted, false);
  assert.equal(h.conscious, false);
  assert.equal(h.meaning, "COMMUNICATION PROTOCOL COMPATIBLE");
});

test("C — capacité", () => {
  assert.deepEqual(
    whoCan([declareOrganism("A", { capabilities: ["measure"] }), declareOrganism("B")], "measure"),
    ["A"]
  );
});

test("D M — signal + provenance", () => {
  const s = interSignal({ from: "A", to: "B", type: "OBSERVATION", payload: 1 });
  assert.equal(s.source, "A");
  assert.ok(s.provenance.chain.length >= 1);
});

test("E Q — état sans mémoire privée", () => {
  const st = organismState(declareOrganism("A"), { cognitive: { question: "q" } });
  assert.equal("private_memory" in st, false);
  assert.equal(expose(memoryRef("m1", "PRIVATE"), "PUBLIC").denied, true);
});

test("F G — désaccord / contre-analyse", () => {
  assert.ok(challenge({ text: "x" }, "B").answers.includes("CONTRADICTED"));
});

test("H I — evidence séparée", () => {
  assert.equal(meshScenario().ev.is_evidence, false);
});

test("J — conscience reste CLAIM", () => {
  const st = organismState(declareOrganism("A"), {
    consciousness_related: { claim: "possible", epistemic_status: "HYPOTHESIS", unresolved: true },
  });
  assert.equal(st.consciousness_related.unresolved, true);
});

test("K L — UNKNOWN / dimension", () => {
  assert.equal(meshScenario().unk.episteme, "UNKNOWN");
  assert.equal(proposeDimension("d9").status, "HYPOTHESIS");
});

test("N O — déconnexion / récupération", () => {
  const net = [declareOrganism("A"), declareOrganism("E")];
  const d = degrade(net, "E");
  assert.equal(d.presence, "DEGRADED");
  assert.equal(recover(d.remaining, declareOrganism("E")).network.length, 2);
});

test("P — signal invalide isolé", () => {
  assert.equal(isolateInvalid({}).isolate, true);
  assert.equal(isolateInvalid({}).erase, false);
});

test("R — boucle réseau bloquée", () => {
  assert.equal(preventNetLoop(["A", "B"], "A").blocked, true);
});

test("S — émergence ≠ conscience", () => {
  assert.equal(emergenceIsNotConsciousness().collective_consciousness, false);
});

test("T X U V W — ouvert / pas de centre", () => {
  assert.equal(declareOrganism("future-9").authority, false);
  assert.equal(noCentral([declareOrganism("A")]), true);
  assert.equal(mayJudge("organism-A"), false);
  assert.match(readFileSync(new URL("../COGNITION.md", import.meta.url), "utf8"), /COLLECTIVE_COGNITION/);
});

test("Y — schemas", () => {
  for (const p of ["schema/mesh.v0.json", "schema/nerve.v0.json", "schema/organism.v0.json"]) {
    JSON.parse(readFileSync(new URL("../" + p, import.meta.url)));
  }
});

test("Z — bout en bout", () => {
  const m = meshScenario();
  assert.equal(m.hs.trusted, false);
  assert.equal(m.syn.presence, "CHANNEL_NOT_PRESENT");
  assert.equal(m.central, true);
  assert.equal(m.mode, "COLLECTIVE_COGNITION");
});
