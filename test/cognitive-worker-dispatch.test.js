import test from "node:test";
import assert from "node:assert/strict";
import { executeDispatch } from "../scripts/cognitive-worker.mjs";

test("worker dispatch continues across fronts and records exact failures", () => {
  const calls = [];
  const run = (_cmd, args) => {
    calls.push(args);
    if (args.includes("ref=badsha")) throw new Error("dispatch denied");
    return "";
  };

  const results = executeDispatch([
    { number: 456, sha: "goodsha" },
    { number: 455, sha: "badsha" },
  ], run);

  assert.equal(calls.length, 2);
  assert.equal(results[0].state, "DISPATCHED");
  assert.equal(results[1].state, "DISPATCH_FAILED");
  assert.match(results[1].error, /dispatch denied/);
});
