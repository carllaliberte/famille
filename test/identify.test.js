import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatAdvice,
  identifyWork,
  involvedOf,
  reportError,
} from "../.github/swarm/identify.mjs";

describe("identify.v0 — sign work, never swallow an error", () => {
  it("roster AI can sign an artifact", () => {
    const r = identifyWork({ actor: "astra", artifact: "feat/x", at: "2026-09-14T23:00:00.000Z" });
    assert.equal(r.ok, true);
    assert.equal(r.actor, "astra");
    assert.equal(r.identified, true);
    assert.equal(r.live, false);
    assert.equal(r.provenance.actor, "astra");
  });

  it("unsigned work is rejected", () => {
    assert.equal(identifyWork({ artifact: "x" }).code, "UNSIGNED");
    assert.equal(identifyWork({ actor: "not-a-node" }).code, "UNSIGNED");
  });

  it("codex and build are identifiable", () => {
    assert.equal(identifyWork({ actor: "codex", artifact: "pr" }).actor, "codex");
    assert.equal(identifyWork({ actor: "build", artifact: "pr" }).actor, "build");
  });

  it("error without involved AI cannot be silent", () => {
    const r = reportError({ message: "boom" });
    assert.equal(r.ok, false);
    assert.equal(r.code, "NO_INVOLVED");
  });

  it("error always notifies the involved AI", () => {
    const signed = identifyWork({ actor: "astra", artifact: "cycle" });
    const n = reportError({
      actor: signed.actor,
      code: "TEST_FAIL",
      message: "suite red on your commit",
      at: "2026-09-14T23:00:00.000Z",
    });
    assert.equal(n.ok, true);
    assert.equal(n.silent, false);
    assert.equal(n.notify, true);
    assert.deepEqual(n.to, ["astra"]);
    assert.equal(n.delivered, false);
    assert.equal(n.state, "PROPOSED");
    assert.match(formatAdvice(n), /NOTIFY @astra/);
    assert.match(formatAdvice(n), /TEST_FAIL/);
  });

  it("delivered stays false until a channel is measured", () => {
    const n = reportError({ actor: "codex", message: "403", delivered: true });
    assert.equal(n.delivered, true);
    assert.equal(n.state, "EXECUTED");
    assert.equal(n.live, false);
  });

  it("involved walks provenance, does not invent LIVE", () => {
    const ids = involvedOf({
      actor: "chatgpt",
      provenance: { actor: "gemini" },
    });
    assert.ok(ids.includes("chatgpt"));
    assert.ok(ids.includes("gemini"));
    assert.equal(reportError({ actors: ids, message: "conflict" }).to.length, 2);
  });
});
