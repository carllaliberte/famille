import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assign, pool, recommend, route } from "../.github/swarm/workforce.mjs";

describe("workforce.v0 — dormant bots stay in the pool", () => {
  it("counts declared guests as IDLE and wakes them before recruiting", () => {
    const p = pool();
    assert.ok(p.n >= 30, p.n);
    assert.ok(p.idle.includes("llama"));
    assert.ok(p.idle.includes("fable"));
    assert.ok(p.available.includes("gemini"));
    assert.ok(p.available.includes("build"));
    assert.equal(p.auto_merge, false);
    assert.equal(recommend({ bottleneck: "merge" }).recruit, false);
    assert.equal(recommend({ bottleneck: "same_repo" }).recruit, false);
    const rec = recommend({ bottleneck: "review", need: "review" });
    assert.equal(rec.recruit, false);
    assert.equal(rec.reason, "dormant first");
    assert.ok(rec.wake);
    const woke = assign(rec.wake, "lu-pr-272");
    assert.equal(woke.ok, true);
    assert.equal(woke.woke, true);
    assert.equal(woke.merge, false);
    assert.equal(assign("no-such", "x").code, "UNKNOWN_AGENT");
    const syn = route({ task: "lu", producer: "gemini", need: "review" });
    assert.equal(syn.ok, true);
    assert.notEqual(syn.worker, "gemini");
    assert.notEqual(syn.worker, "carl");
    assert.notEqual(syn.reviewer, syn.worker);
    assert.equal(syn.independent, true);
    assert.equal(syn.merge, false);
    assert.equal(syn.synapse.act, "ROUTE");
  });
});
