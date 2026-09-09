import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  board,
  canParallel,
  classify,
  nextReady,
} from "../.github/swarm/cadence.mjs";

describe("cadence.v0 — parallel across repos, one PR per repo", () => {
  it("blocks a second famille head and keeps unforge-check READY", () => {
    assert.equal(canParallel({ repo: "famille" }, { repo: "unforge-check" }), true);
    assert.equal(canParallel({ repo: "famille" }, { repo: "famille" }), false);
    const open = [{ repo: "famille", head: "cursor/claim-findings", number: 272 }];
    assert.equal(classify({ repo: "famille", head: "cursor/claim-findings" }, open).state, "IN_PROGRESS");
    assert.equal(classify({ repo: "famille", id: "other" }, open).state, "BLOCKED");
    assert.equal(classify({ repo: "unforge-check" }, open).state, "READY");
    const b = board({
      tasks: [
        { id: "f", repo: "famille" },
        { id: "u", repo: "unforge-check" },
        { id: "j", repo: "acorn-juge" },
      ],
      openPrs: open.concat([{ repo: "acorn-juge", head: "legal", number: 30 }]),
    });
    assert.deepEqual(b.ready, ["u"]);
    assert.equal(b.auto_merge, false);
    assert.equal(nextReady({ tasks: [{ id: "u", repo: "unforge-check" }], openPrs: [] }).next, "u");
    assert.equal(classify({ repo: "famille" }, [
      { repo: "famille", number: 1 },
      { repo: "famille", number: 2 },
    ]).state, "HOLD");
  });
});
