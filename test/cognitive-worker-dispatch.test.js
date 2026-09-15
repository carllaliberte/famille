import test from "node:test";
import assert from "node:assert/strict";
import { executeDispatch, parseCommentPayload } from "../scripts/cognitive-worker.mjs";

test("worker dispatch continues across fronts and records exact failures", () => {
  const calls = [];
  const run = (_cmd, args) => {
    calls.push(args);
    const joined = args.join(" ");
    if (joined.includes("/455/") || args.includes("ref=badsha")) throw new Error("dispatch denied");
    if (joined.includes("/issues/comments/")) {
      return JSON.stringify({ id: 111, html_url: "https://github.com/carllaliberte/famille/issues/456#issuecomment-111", body: "/swarm" });
    }
    return JSON.stringify({ id: 111, html_url: "https://github.com/carllaliberte/famille/issues/456#issuecomment-111" });
  };

  const results = executeDispatch([
    { number: 456, sha: "goodsha" },
    { number: 455, sha: "badsha" },
  ], run);

  assert.ok(calls.length >= 2);
  assert.equal(results[0].state, "VERIFIED");
  assert.equal(results[0].comment_id, 111);
  assert.equal(results[1].state, "DISPATCH_FAILED");
  assert.match(results[1].error, /dispatch denied/);
});

test("empty GitHub response is ATTEMPTED failure, never a fake success", () => {
  const results = executeDispatch([{ number: 1, sha: "x" }], () => "");
  assert.equal(results[0].state, "DISPATCH_FAILED");
  assert.equal(results[0].phase, "ATTEMPTED");
  assert.equal(parseCommentPayload(""), null);
});
