import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyLane,
  laneInventory,
  preferUnpaid,
  secretAvailable,
} from "../scripts/inference-lanes.mjs";
import { CANALS, MODELS, idsForDispatch, keyedModels } from "../.github/swarm/review.mjs";

test("lanes classify ollama and github-models as keyless, :free as free, others paid", () => {
  assert.equal(classifyLane(CANALS.local), "keyless");
  assert.equal(classifyLane(CANALS.ghmodels), "keyless");
  assert.equal(classifyLane(CANALS.orfree), "free");
  assert.equal(classifyLane(CANALS.xai), "paid");
  assert.equal(classifyLane(CANALS.openrouter), "paid");
});

test("OPENROUTER_API_KEY unlocks :free canals without a per-model key", () => {
  assert.equal(secretAvailable(CANALS.orfree, { OPENROUTER_API_KEY: "o" }), true);
  assert.equal(secretAvailable(CANALS.xai, { OPENROUTER_API_KEY: "o" }), false);
  const { run, skip } = keyedModels(["orfree", "xai"], { OPENROUTER_API_KEY: "o" });
  assert.ok(run.some((row) => row.id === "orfree"));
  assert.ok(skip.some((row) => row.id === "xai"));
});

test("paid models are skipped when a keyless or free lane exists", () => {
  const decision = preferUnpaid(
    [MODELS.local, MODELS.xai, MODELS.orfree],
    { OLLAMA_HOST: "http://127.0.0.1:11434", XAI_API_KEY: "x", OPENROUTER_API_KEY: "o" },
  );
  assert.ok(decision.selected.includes("local"));
  assert.equal(decision.selected.includes("xai"), false);
  assert.deepEqual(decision.skipped_paid, ["xai"]);
  assert.equal(decision.paid_required, false);
});

test("paid is last resort only when no unpaid lane is available", () => {
  const ids = idsForDispatch({ XAI_API_KEY: "x" });
  assert.ok(ids.includes("xai"));
  assert.equal(ids.includes("local"), false);
});

test("GITHUB_TOKEN selects GitHub Models without a paid API key", () => {
  const ids = idsForDispatch({ GITHUB_TOKEN: "ghs_test" });
  assert.ok(ids.includes("ghmodels"));
  assert.equal(ids.includes("xai"), false);
});

test("Cortex local remains available without any model key", () => {
  const inventory = laneInventory({});
  assert.equal(inventory.keyless.cortex_local, true);
  assert.equal(inventory.paid_required, false);
  assert.equal(inventory.live, false);
});
