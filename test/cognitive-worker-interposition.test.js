import test from "node:test";
import assert from "node:assert/strict";
import { executeDispatch } from "../scripts/cognitive-worker.mjs";
import { authorizeRuntimeEffect } from "../scripts/acorn-runtime-interposition.mjs";

test("real cognitive-worker dispatch is governed by the interposition firewall", () => {
  const calls = [];
  const run = (command, args) => {
    calls.push([command, args]);
    if (args[0] === "api" && args[1].includes("/comments")) return JSON.stringify({ id: 123, html_url: "https://github.com/example" });
    return JSON.stringify({ id: 123 });
  };
  const result = executeDispatch([{ number: 1, sha: "abc" }], run, {
    GITHUB_REPOSITORY: "carllaliberte/famille",
    ACORN_SYSTEM_MODE: "RUN",
  });
  assert.equal(result[0].state, "VERIFIED");
  assert.equal(result[0].interposition.decision, "ALLOW");
  assert.equal(result[0].interposition.authority_granted, false);
  assert.equal(calls.length, 2);
});

test("runtime execution cannot proceed when interposition requirements are not satisfied", () => {
  const decision = authorizeRuntimeEffect({
    actor: "test",
    operation: "dangerous.effect",
    capability: { id: "dangerous", observability: "NONE", control: "NONE", reversibility: "UNKNOWN" },
    evidence: { measured: false },
  });
  assert.notEqual(decision.decision, "ALLOW");
  assert.equal(decision.authority_granted, false);
});
