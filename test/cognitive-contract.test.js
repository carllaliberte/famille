import test from "node:test";
import assert from "node:assert/strict";
import {
  assertCognitiveContract,
  contractSummary,
  createCognitiveContract,
  transitionCognitiveContract,
} from "../.github/swarm/cognitive-contract.mjs";

test("creates a provenance-preserving proposed contract", () => {
  const contract = createCognitiveContract({
    identity: "astra",
    model: "reasoning-model",
    channel: "test-channel",
    intent: "analyze",
    capabilities: ["reasoning", "verification"],
    evidence: ["e1"],
    provenance: { source: "test", ref: "main", trace: "t1" },
  });

  assert.equal(contract.state, "PROPOSED");
  assert.deepEqual(contract.capabilities, ["reasoning", "verification"]);
  assert.equal(contract.authority.breaker, "HUMAN_CONTROLLED");
  assert.equal(contract.authority.can_merge, false);
  assert.equal(assertCognitiveContract(contract), true);
});

test("enforces the evidence lifecycle without silent state jumps", () => {
  let contract = createCognitiveContract({
    identity: "grok",
    model: "model",
    channel: "worker",
    intent: "test",
  });

  contract = transitionCognitiveContract(contract, "EXECUTED", { action: "run" });
  contract = transitionCognitiveContract(contract, "OBSERVED", { observation: { ok: true } });
  contract = transitionCognitiveContract(contract, "MEASURED", { evidence: ["measurement-1"] });
  contract = transitionCognitiveContract(contract, "VERIFIED", { confidence: 0.9 });

  assert.equal(contract.state, "VERIFIED");
  assert.equal(contract.observation.ok, true);
  assert.deepEqual(contract.evidence, ["measurement-1"]);
  assert.equal(contract.authority.can_merge, false);
});

test("rejects an invalid transition", () => {
  const contract = createCognitiveContract({
    identity: "grok",
    model: "model",
    channel: "worker",
    intent: "test",
  });

  assert.throws(
    () => transitionCognitiveContract(contract, "VERIFIED"),
    /INVALID_COGNITIVE_TRANSITION:PROPOSED->VERIFIED/,
  );
});

test("breaker authority remains exclusively human-controlled", () => {
  assert.throws(
    () => createCognitiveContract({
      identity: "provider",
      model: "model",
      channel: "channel",
      intent: "test",
      authority: { breaker: "OPEN" },
    }),
    /BREAKER_CONTROL_FORBIDDEN/,
  );

  const contract = createCognitiveContract({
    identity: "provider",
    model: "model",
    channel: "channel",
    intent: "test",
    authority: { can_execute: true, can_write: true },
  });
  const attempted = transitionCognitiveContract(contract, "EXECUTED", {
    authority: { breaker: "ATTEMPTED_OVERRIDE", can_merge: true },
  });

  assert.equal(attempted.authority.breaker, "HUMAN_CONTROLLED");
  assert.equal(attempted.authority.can_merge, false);
  assert.equal(contractSummary(attempted).breaker, "HUMAN_CONTROLLED");
});

test("supports HOLD_HUMAN as a terminal governance state", () => {
  let contract = createCognitiveContract({
    identity: "nvidia",
    model: "accelerator",
    channel: "external",
    intent: "invoke",
  });
  contract = transitionCognitiveContract(contract, "HOLD_HUMAN");
  assert.equal(contract.state, "HOLD_HUMAN");
  assert.throws(() => transitionCognitiveContract(contract, "EXECUTED"), /INVALID_COGNITIVE_TRANSITION/);
});
