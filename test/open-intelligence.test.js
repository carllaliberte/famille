import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  MODE,
  PRESENCE,
  RECORD_KIND,
  absenceOfMeasurement,
  addDimension,
  autoPromote,
  consensusToTruth,
  countPresence,
  declareIntelligence,
  mayJudge,
  recordConsciousnessClaim,
  recordObservation,
  representDimension,
} from "../sdk/open-intelligence.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

describe("open intelligences — protocol ready, not LIVE", () => {
  it("A — a future intelligence can be declared without editing the central protocol", () => {
    const roster = JSON.parse(read("schema/agents.json"));
    const mesh = read("schema/mesh.v0.json");
    const cog = read("schema/cognition.v0.json");
    const next = declareIntelligence(roster, {
      id: "nouvelle-ia",
      name: "Future",
      capabilities: ["lu"],
    });
    assert.ok(next.agents.some((a) => a.id === "nouvelle-ia"));
    assert.equal(read("schema/mesh.v0.json"), mesh);
    assert.equal(JSON.parse(cog).properties.mode.const, MODE);
    assert.match(read("schema/mesh.v0.json"), /\^\[a-z\]/);
  });

  it("B — no intelligence is auto-judge, truth, or oracle", () => {
    const roster = JSON.parse(read("schema/agents.json"));
    for (const a of roster.agents) {
      if (a.id !== "carl") assert.equal(mayJudge(a.id), false);
    }
    assert.equal(mayJudge("carl"), true);
    assert.throws(() =>
      declareIntelligence(roster, { id: "oracle-bot", role: "oracle_ai" }),
    );
    const cog = read("schema/cognition.v0.json");
    assert.match(read("COGNITION.md"), /judge_model/);
    assert.doesNotMatch(cog, /"truth"/);
  });

  it("C — a consciousness claim is not recorded as proof of consciousness", () => {
    const rec = recordConsciousnessClaim({
      from: "astra",
      text: "Je suis consciente",
      ts: "2026-09-12T16:00:00Z",
      context: "test",
    });
    assert.equal(rec.kind, "CLAIM");
    assert.equal(rec.established, false);
    assert.equal(rec.candidate, true);
    assert.equal(rec.consciousness, undefined);
    assert.ok(RECORD_KIND.includes("CLAIM"));
    assert.match(read("COGNITION.md"), /Ne jamais écrire `consciousness = true`/);
    assert.doesNotMatch(read("sdk/open-intelligence.js"), /consciousness:\s*true/);
  });

  it("D — absence of measurement is not evidence of absence", () => {
    const rec = absenceOfMeasurement();
    assert.equal(rec.absence_of_evidence, true);
    assert.equal(rec.evidence_of_absence, false);
    assert.equal(rec.established, false);
    assert.equal(rec.kind, "UNKNOWN");
  });

  it("E — an unknown dimension can be UNKNOWN / UNRESOLVED without breaking the system", () => {
    const d = representDimension("phi-unknown");
    assert.equal(d.status, "UNKNOWN");
    assert.equal(d.unresolved, true);
    const store = addDimension({ dimensions: [], evidence: [{ id: "e1", text: "old" }] }, d);
    assert.equal(store.dimensions.length, 1);
    assert.equal(store.evidence[0].text, "old");
  });

  it("F — adding a dimension does not reinterpret prior evidence", () => {
    const prior = { id: "e1", text: "old proof", episteme: "OBSERVED" };
    const store = addDimension(
      { dimensions: [{ id: "d1", status: "MEASURED" }], evidence: [prior] },
      representDimension("consciousness", { defined: false }),
    );
    assert.deepEqual(store.evidence[0], prior);
    assert.notEqual(store.evidence[0], prior);
    assert.equal(store.dimensions.some((d) => d.id === "consciousness"), true);
  });

  it("G — an observation keeps provenance", () => {
    const rec = recordObservation({
      from: "gemini",
      text: "seen",
      ts: "2026-09-12T16:00:00Z",
      context: "pr-test",
      measurement: null,
      relation: "e1",
      disagreements: ["deepseek"],
    });
    assert.equal(rec.from, "gemini");
    assert.equal(rec.ts, "2026-09-12T16:00:00Z");
    assert.equal(rec.context, "pr-test");
    assert.throws(() => recordObservation({ from: "gemini", text: "x" }));
  });

  it("H — DECLARED, CONNECTED, ACTIVE, LIVE VERIFIED stay distinct", () => {
    assert.ok(PRESENCE.includes("DECLARED"));
    assert.ok(PRESENCE.includes("CONNECTED"));
    assert.ok(PRESENCE.includes("ACTIVE"));
    assert.ok(PRESENCE.includes("LIVE VERIFIED"));
    assert.equal(new Set(PRESENCE).size, PRESENCE.length);
    assert.equal(autoPromote("DECLARED", "CONNECTED"), false);
    assert.equal(autoPromote("CONNECTED", "ACTIVE"), false);
    assert.equal(autoPromote("ACTIVE", "LIVE VERIFIED"), false);
    const counts = countPresence([{ presence: "DECLARED" }, { presence: "DECLARED" }]);
    assert.equal(counts.CONNECTED, 0);
    assert.equal(counts.ACTIVE, 0);
    assert.equal(counts["LIVE VERIFIED"], 0);
    assert.equal(counts.DECLARED, 2);
  });

  it("I — consensus does not turn a hypothesis into truth", () => {
    assert.equal(consensusToTruth(["astra", "codex", "llama"]), false);
    const schema = JSON.parse(read("schema/cognition.v0.json"));
    assert.ok(!schema.properties.status.enum.includes("truth"));
  });

  it("J — existing cognition schema and docs still name the unique mode", () => {
    const schema = JSON.parse(read("schema/cognition.v0.json"));
    assert.equal(schema.properties.mode.const, "COLLECTIVE_COGNITION");
    assert.match(read("COGNITION.md"), /COLLECTIVE_COGNITION/);
    assert.match(read("AGENTS.md"), /COLLECTIVE_COGNITION/);
    assert.match(read("MODELES.md"), /intelligence présente ou future/);
    assert.equal(schema.required.includes("mode"), true);
    assert.ok(schema.properties.dimension);
    assert.ok(schema.properties.provenance);
  });
});
