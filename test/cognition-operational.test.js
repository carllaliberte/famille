import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  PRINCIPLES,
  adapterOf,
  callAdapter,
  canWrite,
  isolateAgent,
  join as joinAgent,
  mayJudge,
  memoryFor,
  openSession,
  presenceOf,
  reply,
  resetCognition,
  revise,
  runCycle,
  runIndependent,
  share,
  shareAcrossProjects,
  thinkers,
  visibleTo,
} from "../.github/swarm/cognition.mjs";
import { lookup, resetGuests } from "../.github/swarm/flux.mjs";

afterEach(() => {
  resetCognition();
  resetGuests();
});

describe("FULL COLLECTIVE COGNITION OPERATIONAL + multi-project", () => {
  it("1 several IAs participate in the same session", () => {
    const cycle = runCycle({ topic: "Do certainties expire?", project: "famille" });
    assert.equal(cycle.ok, true);
    const froms = new Set(cycle.filed.map((c) => c.from));
    assert.ok(froms.size >= 2);
    assert.equal(cycle.session.project, "famille");
  });

  it("2 initial analyses are isolated (parallel / no replyTo)", () => {
    const opened = openSession({ topic: "isolate", project: "famille" });
    const first = runIndependent(opened.session, { suggest: true });
    assert.ok(first.filed.length >= 2);
    assert.ok(first.filed.every((c) => c.isolated === true && c.replyTo === null));
    const onlySelf = visibleTo("independent", first.filed[0].from, first.filed);
    assert.equal(onlySelf.length, 1);
  });

  it("3 answers are redistributed after SHARE", () => {
    const opened = openSession({ topic: "share", project: "famille" });
    const first = runIndependent(opened.session, { suggest: true });
    share(opened.session);
    const all = visibleTo("share", first.filed[0].from, first.filed);
    assert.equal(all.length, first.filed.length);
  });

  it("4 IAs can contradict each other", () => {
    const cycle = runCycle({ topic: "contradict", project: "famille" });
    const disagrees = cycle.session.relations.filter((r) => r.reply === "DISAGREE");
    assert.ok(disagrees.length >= 1);
    assert.notEqual(disagrees[0].from, disagrees[0].to);
  });

  it("5 an IA can revise its position; previous stays", () => {
    const cycle = runCycle({ topic: "revise", project: "famille" });
    const from = cycle.filed[0].from;
    const rev = revise(cycle.session, {
      from,
      body: "Revision. Position: changed. Previous kept.",
    });
    assert.equal(rev.ok, true);
    assert.equal(rev.previous.tour, "independent");
    assert.equal(rev.contribution.tour, "revision");
    assert.equal(rev.contribution.previousId, rev.previous.id);
    assert.ok(cycle.session.contributions.some((c) => c.id === rev.previous.id));
  });

  it("6 unresolved disagreements persist", () => {
    const cycle = runCycle({ topic: "persist", project: "famille" });
    assert.equal(cycle.synthesis.truth, false);
    assert.ok(cycle.synthesis.disagreement || cycle.session.relations.length >= 1);
    assert.ok(cycle.lesson.disagreement);
  });

  it("7 synthesis keeps provenance", () => {
    const cycle = runCycle({ topic: "provenance", project: "famille" });
    assert.ok(cycle.synthesis.from);
    assert.ok(cycle.synthesis.packet.ts);
    assert.equal(cycle.synthesis.sessionId, cycle.session.id);
    assert.ok(cycle.filed.every((c) => c.project === "famille" && c.agent_id && c.message_id && c.timestamp));
  });

  it("8 memory is dated and project-bound", () => {
    const cycle = runCycle({ topic: "memory", project: "famille", ts: "2026-09-09T01:00:00.000Z" });
    const mine = memoryFor("famille");
    assert.ok(mine.length >= 1);
    assert.ok(mine.every((e) => e.project === "famille" && /T/.test(e.ts)));
    assert.equal(cycle.lesson.ts.slice(0, 10), "2026-09-09");
  });

  it("9 two projects stay isolated", () => {
    runCycle({ topic: "alpha question", project: "famille" });
    runCycle({ topic: "beta question", project: "other-project" });
    const a = memoryFor("famille");
    const b = memoryFor("other-project");
    assert.ok(a.length >= 1);
    assert.ok(b.length >= 1);
    assert.ok(a.every((e) => e.project === "famille"));
    assert.ok(b.every((e) => e.project === "other-project"));
    assert.ok(!a.some((e) => e.statement.includes("beta question")));
    assert.ok(!b.some((e) => e.statement.includes("alpha question")));
  });

  it("10 inter-project info requires an explicit action", () => {
    const cycle = runCycle({ topic: "export me", project: "famille" });
    const entry = cycle.lesson;
    assert.equal(shareAcrossProjects(entry, "other-project").code, "IMPLICIT_LEAK");
    const copied = shareAcrossProjects(entry, "other-project", { explicit: true });
    assert.equal(copied.ok, true);
    assert.equal(copied.entry.project, "other-project");
    assert.ok(copied.entry.sources.includes(`project:famille`));
  });

  it("11 no canal is never CONNECTED", () => {
    const guest = lookup("codex");
    const p = presenceOf(guest);
    assert.notEqual(p.presence, "CONNECTED");
    assert.notEqual(p.presence, "ACTIVE");
    const called = callAdapter(guest, { body: "hi" });
    assert.equal(called.ok, false);
    assert.ok(["CHANNEL_NOT_PRESENT", "BLOCKED", "UNAVAILABLE", "ERROR"].includes(called.presence));
    const adapter = adapterOf(guest);
    assert.equal(adapter.connected, false);
    assert.equal(adapter.write, false);
  });

  it("12 one agent error does not destroy the session", () => {
    const opened = openSession({ topic: "isolate-error", project: "famille" });
    const boom = isolateAgent(() => {
      throw new Error("provider down");
    });
    assert.equal(boom.ok, false);
    assert.equal(boom.code, "AGENT_ERROR");
    const first = runIndependent(opened.session, { suggest: true });
    assert.equal(first.ok, true);
    assert.ok(first.filed.length >= 1);
  });

  it("13 no IA is implicitly judge; principles hold", () => {
    assert.deepEqual(PRINCIPLES, [
      "human_vision",
      "collective_cognition",
      "disagreement_is_data",
      "writing_is_capability",
      "consensus_is_not_truth",
    ]);
    assert.equal(mayJudge("gemini").ok, false);
    assert.equal(mayJudge("carl").ok, true);
    assert.equal(joinAgent({ id: "oracle-model", name: "Oracle" }).code, "NO_JUGE");
    assert.equal(joinAgent({ id: "truth-model", name: "Truth" }).code, "NO_JUGE");
  });

  it("14 GitHub write is not required to cogitate", () => {
    const thinking = thinkers();
    assert.ok(thinking.length >= 2);
    assert.ok(thinking.every((a) => canWrite(a) === false || canWrite(a) === true));
    assert.ok(thinking.some((a) => canWrite(a) === false));
    const cycle = runCycle({ topic: "no write required", project: "famille" });
    assert.equal(cycle.ok, true);
    assert.ok(cycle.filed.every((c) => c.write === false));
  });
});
