import test from "node:test";
import assert from "node:assert/strict";
import {
  discoverCapabilities,
  memoryForClient,
  parseClient,
  resetCognition,
  serveClientProblem,
  shareAcrossClients,
} from "../.github/swarm/cognition.mjs";
import { resetGuests } from "../.github/swarm/flux.mjs";

function clean() {
  resetCognition();
  resetGuests();
}

test("client id is constrained like project id", () => {
  assert.equal(parseClient("acme").ok, true);
  assert.equal(parseClient("ACME").id, "acme");
  assert.equal(parseClient("bad_id").ok, false);
});

test("two clients stay isolated; implicit share is refused", () => {
  clean();
  const a = serveClientProblem({ client: "acme", problem: "Can certainties expire?", ts: "2026-09-16T18:00:00.000Z" });
  const b = serveClientProblem({ client: "bravo", problem: "Measure a missing field as classique.", ts: "2026-09-16T18:00:01.000Z" });
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  const memA = memoryForClient("acme");
  const memB = memoryForClient("bravo");
  assert.ok(memA.length >= 1);
  assert.ok(memB.length >= 1);
  assert.ok(memA.every((row) => row.client === "acme"));
  assert.ok(memB.every((row) => row.client === "bravo"));
  assert.ok(!memA.some((row) => row.client === "bravo"));
  assert.ok(!memB.some((row) => row.client === "acme"));
  assert.match(a.problem, /expire/);
  assert.match(b.problem, /classique/);
  const lesson = memA[0];
  assert.equal(shareAcrossClients(lesson, "bravo").code, "IMPLICIT_LEAK");
  const copied = shareAcrossClients(lesson, "bravo", { explicit: true });
  assert.equal(copied.ok, true);
  assert.equal(copied.entry.client, "bravo");
  assert.ok(copied.entry.sources.includes("client:acme"));
});

test("client path executes, measures, never mints LIVE, and holds for credentials", () => {
  clean();
  const served = serveClientProblem({ client: "demo", problem: "Review and measure a real client problem." });
  assert.equal(served.ok, true);
  assert.equal(served.live, false);
  assert.equal(served.auto_merge, false);
  assert.equal(served.authority, "carl");
  assert.equal(served.completeness.DEFINED, true);
  assert.equal(served.completeness.EXECUTED, true);
  assert.equal(served.completeness.MEASURED, true);
  assert.equal(served.completeness.LIVE_VERIFIED, false);
  assert.equal(served.hold.decision, "HOLD_HUMAN");
  assert.equal(served.result.truth, undefined);
  assert.equal(served.understanding.truth, false);
  assert.ok(served.result.contributors >= 2);
  assert.equal(served.together.measured, true);
  assert.equal(served.isolation.leaked, false);
  assert.ok(!JSON.stringify(served.result).includes("FULL SWARM OPERATIONAL"));
});

test("routing is task-context, never a global best/worst ranking", () => {
  const found = discoverCapabilities("review this measured card");
  assert.equal(found.global_best, false);
  assert.equal(found.ranking, "by-task");
  assert.ok(found.needed.includes("review"));
  assert.match(found.together, /ensemble/);
});
