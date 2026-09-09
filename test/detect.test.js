import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { classifyTalk, copyProof, discover, evaluate, makeFinding, unknownIsNotFalse, independentAgents } from "../.github/swarm/detect.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECTION = readFileSync(join(ROOT, "REVUE-PROJECTION.md"), "utf8");

describe("detect.v0 — CFD/Navier–Stokes first case", () => {
  it("does not accept the conclusion in advance; solver ban is already covered; word-ban is too broad", () => {
    const proposed = makeFinding({
      agent: "claude",
      object: "CFD/Navier-Stokes",
      statement: "Le protocole devrait interdire Navier–Stokes / CFD comme trou architectural.",
      proposed_rule: "Interdit: Stokes, Navier-Stokes, CFD",
    });
    assert.equal(proposed.finding.state, "PROPOSED");
    assert.equal(proposed.finding.normative, false);
    const wordBan = evaluate(proposed.finding, { text: PROJECTION });
    assert.equal(wordBan.verdict, "REJECTED");
    assert.equal(wordBan.finding.normative, false);
    assert.match(wordBan.action5.minus, /do not ban the word Stokes/);

    const covered = evaluate(
      makeFinding({
        agent: "claude",
        object: "NS solver",
        statement: "Un solveur Navier–Stokes dans famille serait un trou.",
      }).finding,
      { text: PROJECTION },
    );
    assert.equal(covered.verdict, "ALREADY_COVERED");
    assert.equal(covered.recommend, "REJECT");
    assert.match(PROJECTION, /Pas de code solveur/);
    assert.match(PROJECTION, /Stokes couplé/);
    const talk = classifyTalk("PROPOSED is a quantum superposition of HOLD and CONFIRMED");
    assert.equal(talk.kind, "metaphor");
    assert.equal(talk.use, "classical");
    assert.equal(unknownIsNotFalse(null).false, false);
    assert.equal(unknownIsNotFalse(null).unknown, true);
    const copy = copyProof({ id: "abc", hash: "def" });
    assert.equal(copy.new_proof, false);
    assert.equal(copy.independent, false);
    const echo = independentAgents({ source: "X" }, { source: "X" });
    assert.equal(echo.independent, false);
    const found = discover({ auto: ["gemini", "haiku"], skip: ["haiku"], scope: "local" });
    assert.equal(found.findings[0].discovered_category, "ENV_SCOPE");
    assert.equal(found.findings[0].state, "PROPOSED");
    assert.equal(found.findings[0].normative, false);
    assert.equal(found.true, false);
    assert.equal(found.undetected, "not absent");
  });
});
