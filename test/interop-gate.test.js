import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { cursorGate } from "../.github/swarm/cadence.mjs";
import { activate, CAPABILITY_UNAVAILABLE, route } from "../.github/swarm/workforce.mjs";
import { peutDire } from "../sdk/peut-dire.js";

const interop = readFileSync(new URL("../INTEROP-IA.md", import.meta.url), "utf8");
const walk = readFileSync(
  new URL("../examples/interop-juge-v0.md", import.meta.url),
  "utf8",
);
const osExample = JSON.parse(
  readFileSync(new URL("../examples/attest-os.json", import.meta.url), "utf8"),
);

describe("interop — cursorGate n'est pas une carte", () => {
  it("names four rails and refuses to fuse the holes", () => {
    assert.match(interop, /juge\.v0/);
    assert.match(interop, /mesh\.v0/);
    assert.match(interop, /cadence\.v0/);
    assert.match(interop, /workforce\.v0/);
    assert.match(interop, /cursorGate/);
    assert.match(interop, /route\(\)/);
    assert.match(interop, /activate\(\)/);
    assert.match(interop, /CAPABILITY UNAVAILABLE/);
    assert.match(interop, /pas PROJECT BLOCKED/);
    assert.match(interop, /pas une 5e carte/i);
    assert.match(interop, /Ce n'est pas le même trou/);
    assert.match(interop, /Jamais carl/);
    assert.match(interop, /canal=OPTICAL_QUANTUM/);
    assert.match(interop, /400 lie/);
    assert.match(walk, /cursorGate/);
    assert.match(walk, /route\(\)/);
    assert.match(walk, /activate\(\)/);
    assert.match(walk, /CAPABILITY UNAVAILABLE/);
    assert.match(walk, /Pas cette carte/);
    assert.match(walk, /Les certitudes ont une date de fin/);
  });

  it("keeps the named card hole: epsilon and horizon stay missing", () => {
    const r = peutDire(osExample, { today: "2026-09-09" });
    assert.equal(r.quantique, false);
    assert.equal(r.mode, "classique");
    assert.deepEqual(r.manques, ["epsilon", "horizon"]);
    assert.equal(osExample.epsilon, null);
    assert.equal(osExample.horizon, "");
  });

  it("READY is one act, an open head is RAS, never a missing card", () => {
    const one = cursorGate({ repo: "famille", openPrs: [] });
    assert.equal(one.action, "ONE");
    assert.equal(one.state, "READY");
    assert.equal(one.auto_merge, false);
    const ras = cursorGate({
      repo: "famille",
      openPrs: [
        {
          repo: "famille",
          number: 274,
          head: "cursor/flux-lu-pas-consommer",
        },
      ],
    });
    assert.equal(ras.action, "RAS");
    assert.equal(ras.state, "BLOCKED");
    assert.notEqual(ras.reason, "epsilon");
  });

  it("route() is not a card and never merges", () => {
    const syn = route({ task: "lu", producer: "gemini", need: "review" });
    assert.equal(syn.ok, true);
    assert.notEqual(syn.worker, "gemini");
    assert.notEqual(syn.worker, "carl");
    assert.notEqual(syn.reviewer, syn.worker);
    assert.notEqual(syn.reviewer, "carl");
    assert.equal(syn.merge, false);
    assert.equal(syn.auto_merge, false);
    assert.equal(syn.live, false);
    assert.equal(Object.hasOwn(syn, "epsilon"), false);
    assert.equal(Object.hasOwn(syn, "horizon"), false);
    const r = peutDire(osExample, { today: "2026-09-09" });
    assert.equal(r.mode, "classique");
    assert.deepEqual(r.manques, ["epsilon", "horizon"]);
  });

  it("activate() is not a card — skip/quota is not PROJECT BLOCKED", () => {
    const live = activate({ need: "review", quota: ["gemini"] });
    assert.equal(live.ok, true);
    assert.equal(live.blocked, false);
    assert.equal(live.unavailable_state, CAPABILITY_UNAVAILABLE);
    assert.ok(live.unavailable.includes("gemini"));
    assert.ok(live.parallel);
    assert.equal(live.auto_merge, false);
    assert.equal(live.live, false);
    assert.equal(Object.hasOwn(live, "epsilon"), false);
    assert.equal(Object.hasOwn(live, "horizon"), false);
    assert.doesNotMatch(JSON.stringify(live), /PROJECT BLOCKED/);
    const r = peutDire(osExample, { today: "2026-09-09" });
    assert.equal(r.mode, "classique");
    assert.deepEqual(r.manques, ["epsilon", "horizon"]);
  });
});
