import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AI_WRITE,
  board,
  mayWrite,
  mesh,
  register,
} from "../.github/swarm/providers.mjs";

describe("providers.v0 — provider-neutral, AI_WRITE forbidden", () => {
  it("never READY from config alone; fake vendor joins without rewriting core; AI cannot write", () => {
    const dry = mesh();
    assert.equal(AI_WRITE, false);
    assert.equal(dry.auto_merge, false);
    assert.equal(dry.ready.length, 0);
    const gemini = dry.rows.find((r) => r.node_id === "gemini");
    assert.ok(gemini);
    assert.notEqual(gemini.status, "READY");
    assert.equal(gemini.write_scope, "DENIED");
    assert.equal(mayWrite(gemini), false);
    const carl = dry.rows.find((r) => r.node_id === "carl");
    assert.equal(mayWrite(carl), true);
    const keyed = mesh(undefined, { GEMINI_API_KEY: "x".repeat(12) });
    assert.ok(keyed.ready.includes("gemini"));
    assert.equal(mayWrite(keyed.rows.find((r) => r.node_id === "gemini")), false);
    const withAcme = register({
      id: "acme",
      name: "Acme",
      kind: "model",
      role: "reviews",
      capabilities: ["review"],
      status: "declared",
    });
    assert.ok(withAcme.rows.some((r) => r.node_id === "acme"));
    assert.equal(withAcme.rows.find((r) => r.node_id === "acme").status, "REGISTERED");
    assert.match(board(dry), /ai_write: DENIED/);
    assert.match(board(dry), /ready: 0/);
  });
});
