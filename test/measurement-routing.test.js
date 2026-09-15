import test from "node:test";
import assert from "node:assert/strict";
import { orderByMeasuredRank } from "../scripts/cognitive-worker.mjs";

test("promotion feedback moves a measured source ahead of rank order", () => {
  const ids = orderByMeasuredRank(["astra", "grok", "gemini"], {
    measured: [
      { id: "astra", rank: 1 },
      { id: "grok", rank: 2 },
      { id: "gemini", rank: 3 },
    ],
  }, {
    actions: [
      { id: "grok", action: "PROMOTE_PRIORITY" },
      { id: "gemini", action: "DEPRIORITIZE" },
    ],
  });
  assert.deepEqual(ids, ["grok", "astra", "gemini"]);
});

test("measure-more feedback gets confirmation priority", () => {
  const ids = orderByMeasuredRank(["astra", "grok", "gemini"], {
    measured: [
      { id: "astra", rank: 1 },
      { id: "grok", rank: 2 },
      { id: "gemini", rank: 3 },
    ],
  }, {
    actions: [
      { id: "gemini", action: "MEASURE_MORE" },
      { id: "astra", action: "PROMOTE_PRIORITY" },
      { id: "grok", action: "DEPRIORITIZE" },
    ],
  });
  assert.deepEqual(ids, ["astra", "gemini", "grok"]);
});

test("deprioritized sources remain usable but go last", () => {
  const ids = orderByMeasuredRank(["astra", "grok", "gemini"], {
    measured: [
      { id: "astra", rank: 1 },
      { id: "grok", rank: 2 },
      { id: "gemini", rank: 3 },
    ],
  }, {
    actions: [{ id: "astra", action: "DEPRIORITIZE" }],
  });
  assert.deepEqual(ids, ["grok", "gemini", "astra"]);
});
