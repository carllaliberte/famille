import test from "node:test";
import assert from "node:assert/strict";
import { emptyModelExecutionMemory, updateModelExecutionMemory, modelExecutionSummary } from "../scripts/model-execution-memory.mjs";

test("model execution memory records actual provider outcomes", () => {
  const next = updateModelExecutionMemory(emptyModelExecutionMemory(), [
    { id: "astra", status: "SUCCEEDED", reason: "response" },
    { id: "gemini", status: "ERROR", reason: "429 quota" },
    { id: "orfree", status: "SKIPPED", reason: "missing key" },
  ], "2026-09-15T00:10:00Z");
  assert.equal(next.cycles, 1);
  assert.equal(next.models.astra.succeeded, 1);
  assert.equal(next.models.gemini.errors, 1);
  assert.equal(next.models.orfree.skipped, 1);
});

test("repeated proof cycles accumulate without converting errors into success", () => {
  let memory = emptyModelExecutionMemory();
  memory = updateModelExecutionMemory(memory, [{ id: "astra", status: "SUCCEEDED" }]);
  memory = updateModelExecutionMemory(memory, [{ id: "astra", status: "ERROR" }]);
  assert.equal(memory.models.astra.attempts, 2);
  assert.equal(memory.models.astra.succeeded, 1);
  assert.equal(memory.models.astra.errors, 1);
  assert.equal(modelExecutionSummary(memory).models[0].success_rate, 0.5);
});

test("execution memory does not claim LIVE", () => {
  const summary = modelExecutionSummary(emptyModelExecutionMemory());
  assert.equal(summary.version, "model-execution-memory.v1");
  assert.equal(summary.models.length, 0);
});
