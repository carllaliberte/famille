import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ifDaemonDown, realOf, siege } from "../scripts/siege.mjs";
import { idsForDispatch, MODELS, reviewOne } from "../.github/swarm/review.mjs";

describe("siège — REAL seulement si HTTP 2xx + corps non vide", () => {
  it("200 + texte → REAL=1", () => {
    const s = siege({ nom: "llama3.2", http: 200, text: "pong", present: true, chaud: true, ms: 139 });
    assert.equal(s.real, 1);
    assert.equal(s.http, 200);
    assert.equal(s.nom, "llama3.2");
  });

  it("400 → REAL=0", () => {
    assert.equal(realOf({ nom: "x", http: 400, text: "Model not found", error: "400" }), 0);
    assert.equal(siege({ nom: "x", http: 400, text: "oops" }).real, 0);
  });

  it("200 + corps vide → REAL=0", () => {
    assert.equal(siege({ nom: "x", http: 200, text: "   " }).real, 0);
  });

  it("secret vide / skip → REAL=0", () => {
    const s = siege({ nom: "local", skipped: true, error: "missing OLLAMA_HOST" });
    assert.equal(s.real, 0);
    assert.equal(s.skipped, true);
  });
});

describe("siège — CI sans Ollama et sans secrets", () => {
  it("idsForDispatch(env vide) n'inclut pas local", () => {
    assert.deepEqual(idsForDispatch({}), []);
  });

  it("reviewOne local sans OLLAMA_HOST skip, pas de throw", async () => {
    const one = await reviewOne(MODELS.local, "s", "u", {});
    assert.equal(one.skipped, true);
    assert.match(String(one.reason || ""), /OLLAMA_HOST/);
    assert.equal(siege({ nom: "local", skipped: true, error: one.reason }).real, 0);
  });

  it("OLLAMA_HOST non http → skipFault, REAL=0", async () => {
    const one = await reviewOne(MODELS.local, "s", "u", { OLLAMA_HOST: "ftp://x" });
    assert.ok(one.skipped || one.error);
    assert.equal(
      siege({
        nom: "local",
        skipped: Boolean(one.skipped),
        error: one.error || one.reason || "",
        http: 400,
      }).real,
      0,
    );
  });

  it("daemon DOWN = skip propre, pas fail", () => {
    const down = ifDaemonDown(false);
    assert.equal(down.skipped, true);
    assert.equal(siege({ nom: "local", skipped: true, error: down.reason }).real, 0);
    assert.equal(ifDaemonDown(true).skipped, false);
  });
});
