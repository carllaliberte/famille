import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { cursorGate } from "../.github/swarm/cadence.mjs";
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
  it("names three rails and refuses to fuse the holes", () => {
    assert.match(interop, /juge\.v0/);
    assert.match(interop, /mesh\.v0/);
    assert.match(interop, /cadence\.v0/);
    assert.match(interop, /cursorGate/);
    assert.match(interop, /pas une 5e carte/i);
    assert.match(interop, /Ce n'est pas le même trou/);
    assert.match(walk, /cursorGate/);
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
});
