import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import worker from "../canal/worker.js";

const HOST = "https://acorn-royal-dune-blend.grok.me";
const SRC = readFileSync(new URL("../canal/worker.js", import.meta.url), "utf8");

function juge(qs) {
  return worker.fetch(new Request(`http://canal.test/juge?${qs}`));
}

describe("canal worker — local, 0 réseau", () => {
  let previousFetch;

  afterEach(() => {
    if (previousFetch) {
      globalThis.fetch = previousFetch;
      previousFetch = undefined;
    }
  });

  it("ε=0 is a lie without calling the host", async () => {
    previousFetch = globalThis.fetch;
    let called = 0;
    globalThis.fetch = async () => {
      called += 1;
      throw new Error("network");
    };
    const res = await juge("quelle=os&temoin=aucun&epsilon=0&horizon=2027-12-31");
    assert.equal(res.status, 400);
    assert.equal(called, 0);
    const body = await res.json();
    assert.equal(body.error, "lie");
    assert.equal(body.phrase, "Error margin zero is a lie");
    assert.equal(body.preview, true);
  });

  it("missing ε is a lie, still local", async () => {
    previousFetch = globalThis.fetch;
    let called = 0;
    globalThis.fetch = async () => {
      called += 1;
      throw new Error("network");
    };
    const res = await juge("quelle=os&temoin=aucun&horizon=2027-12-31");
    assert.equal(res.status, 400);
    assert.equal(called, 0);
    const body = await res.json();
    assert.equal(body.phrase, "Error margin zero is a lie");
    assert.equal(body.preview, true);
  });

  it("cites only the frozen host and does not wrangler", () => {
    assert.match(SRC, /https:\/\/acorn-royal-dune-blend\.grok\.me/);
    assert.equal((SRC.match(/\.grok\.me/g) || []).length, 1);
    assert.doesNotMatch(SRC, /wrangler/);
    assert.doesNotMatch(SRC, /QUANTUM/);
  });
});
