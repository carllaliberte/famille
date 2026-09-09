import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assign, bundle, canBundle, formatBundle, neverBundle, pool, recommend, riskTier, route } from "../.github/swarm/workforce.mjs";

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
    assert.equal(riskTier({ task: "docs eval" }), 0);
    assert.equal(neverBundle({ files: ["juge.v0.json"] }), true);
    const packed = bundle([
      { task: "docs", repo: "famille", subsystem: "eval" },
      { task: "comment", repo: "famille", subsystem: "eval" },
      { task: "rotate signing.key", repo: "famille", subsystem: "eval" },
    ]);
    assert.equal(packed.synapses, 3);
    assert.equal(packed.human_decisions, 2);
    assert.equal(packed.auto_merge, false);
    assert.ok(packed.bundles.some((b) => b.split && b.tier === 3));
    const note = formatBundle(packed.bundles.find((b) => b.split));
    assert.match(note, /HOLD_HUMAN/);
    assert.match(note, /Carl only/);
    assert.doesNotMatch(note, /CERTIFIED/);
    const docs = { task: "docs", repo: "famille", subsystem: "eval" };
    const comment = { task: "comment", repo: "famille", subsystem: "eval" };
    const key = { task: "rotate signing.key" };
    const juge = { files: ["schema/juge.v0.json"] };
    assert.equal(canBundle(docs, comment).act, "BUNDLE");
    assert.equal(canBundle(docs, key).act, "NEVER-BUNDLE");
    assert.equal(canBundle(docs, juge).act, "NEVER-BUNDLE");
    assert.equal(canBundle(docs, { task: "secret token" }).act, "NEVER-BUNDLE");
    assert.equal(canBundle(docs, { task: "authority change" }).act, "NEVER-BUNDLE");
    assert.equal(canBundle(docs, { task: "docs", repo: "unforge-check" }).act, "SPLIT");
    assert.equal(canBundle(docs, { task: "fn", repo: "famille", subsystem: "eval" }).act, "SPLIT");
    assert.equal(canBundle(docs, { ...docs, provenance: false }).act, "HOLD_HUMAN");
    assert.equal(canBundle(docs, comment).auto_merge, false);
  });
});
