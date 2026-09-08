import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, it } from "node:test";
import { OWNER_ACTOR, resetGuests } from "../.github/swarm/flux.mjs";
import {
  CHANNELS,
  POOL_VERSION,
  STANCES,
  ask,
  canThink,
  channelOf,
  closeIndependent,
  connectAgent,
  dropDisagreement,
  editContribution,
  expire,
  findLessons,
  independentView,
  lesson,
  memory,
  positionOf,
  presence,
  relate,
  resetPool,
  revalidate,
  rewriteQuestion,
  roster,
  runCycle,
  suggestIndependent,
  synthesize,
  thinkAllIndependent,
  thinkIndependent,
  thinkers,
} from "../.github/swarm/pool.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = readFileSync(join(ROOT, ".github/swarm/pool.mjs"), "utf8");
const SCHEMA = readFileSync(join(ROOT, "schema/pool.v0.json"), "utf8");

afterEach(() => {
  resetGuests();
  resetPool();
});

function sessionWithIndependents(bodies, actor) {
  const asked = ask({ topic: "do certainties expire?", origin: "test" });
  assert.equal(asked.ok, true);
  const thought = thinkAllIndependent(asked.session, { bodies, actor });
  assert.equal(thought.ok, true, thought.ok ? "" : thought.error);
  const closed = closeIndependent(asked.session);
  assert.equal(closed.ok, true);
  return asked.session;
}

describe("pool schema is a session layer, not a mesh fork", () => {
  it("pool.v0 stays open, additionalProperties true, no IA enum, no next", () => {
    const schema = JSON.parse(SCHEMA);
    assert.equal(schema.title, "famille.pool.v0");
    assert.equal(schema.properties.flux.const, "acorn.v0");
    assert.equal(schema.additionalProperties, true);
    assert.equal(schema.properties.from, undefined);
    assert.equal(schema.properties.from?.enum, undefined);
    assert.ok(schema.not.anyOf.some((c) => c.required?.includes("next")));
    assert.ok(schema.not.anyOf.some((c) => c.required?.includes("instruction")));
    assert.doesNotMatch(SCHEMA, /"claude"/);
    assert.doesNotMatch(SCHEMA, /"astra"/);
    assert.doesNotMatch(SCHEMA, /"chatgpt"/);
    assert.doesNotMatch(SCHEMA, /"gemini"/);
    assert.match(SCHEMA, /Majority is not truth/);
    assert.match(SCHEMA, /LIVE VERIFIED is Carl only/);
  });
});

describe("Test A — All agents", () => {
  it("walks every declared identity without hardcoding a provider list", () => {
    const all = roster();
    const thinking = thinkers();
    assert.ok(all.length >= 38, `roster ${all.length}`);
    assert.equal(thinking.length, all.filter(canThink).length);
    assert.ok(thinking.length >= 30);
    const ids = thinking.map((a) => a.id);
    assert.ok(ids.includes("claude"));
    assert.ok(ids.includes("chatgpt"));
    assert.ok(ids.includes("gemini"));
    assert.ok(ids.includes("deepseek"));
    assert.ok(ids.includes("astra"));
    assert.ok(ids.includes("codex"));
    assert.ok(ids.includes("qwen"));
    assert.ok(ids.includes("kimi"));
    assert.ok(ids.includes("goose"));
    assert.ok(!ids.includes("carl"));
    assert.ok(!ids.includes("ci"));
    assert.ok(!ids.includes("github"));
    assert.ok(!ids.includes("worker"));
    const channels = presence();
    assert.equal(channels.length, all.length);
    for (const row of channels) {
      assert.equal(row.ok, true, row.id);
      assert.equal(row.declared, true, row.id);
      assert.equal(row.connected, false, row.id);
      assert.equal(row.live, false, row.id);
      assert.ok(CHANNELS.includes(row.channel), row.id);
      if (row.ready) {
        assert.equal(row.channel, "CHANNEL_NOT_PRESENT", row.id);
        assert.match(row.note, /CHANNEL NOT PRESENT/);
      }
    }
  });
});

describe("Test B — New agent", () => {
  it("nouvelle-ia and new-agent join by identifier and think", () => {
    const a = connectAgent({ id: "nouvelle-ia", name: "Nouvelle IA" });
    assert.equal(a.ok, true);
    assert.equal(canThink(a.agent), true);
    assert.ok(thinkers().some((x) => x.id === "nouvelle-ia"));
    const asked = ask({ topic: "can a new IA enter the pool?" });
    const thought = thinkIndependent(asked.session, {
      from: "nouvelle-ia",
      body: "Independent. nouvelle-ia. Position: lu-the-frame. Joined by id. Never QUANTUM. Never LIVE.",
    });
    assert.equal(thought.ok, true, thought.ok ? "" : thought.error);
    assert.equal(thought.contribution.packet.from, "nouvelle-ia");
    assert.equal(thought.contribution.isolated, true);

    const b = connectAgent({ id: "new-agent", name: "New Agent" });
    assert.equal(b.ok, true);
    const thought2 = thinkIndependent(asked.session, {
      from: "new-agent",
      body: "Independent. new-agent. Position: lu-the-frame. Same protocol. Never QUANTUM. Never LIVE.",
    });
    assert.equal(thought2.ok, true);
    const ch = channelOf(a.agent, { session: asked.session });
    assert.equal(ch.channel, "ACTIVE");
    assert.equal(ch.connected, false);
    assert.equal(ch.live, false);
  });
});

describe("Test C — Independent round", () => {
  it("isolates filings: others are invisible until close", () => {
    const asked = ask({ topic: "isolate the first round" });
    const g = thinkIndependent(asked.session, {
      from: "grok",
      body: "Independent. grok. Position: protocol-first. Secret to others. Never QUANTUM. Never LIVE.",
      actor: OWNER_ACTOR,
    });
    assert.equal(g.ok, true);
    const viewClaude = independentView(asked.session, "claude");
    assert.equal(viewClaude.isolated, true);
    assert.equal(viewClaude.contributions.length, 0);
    assert.equal(viewClaude.question.topic, "isolate the first round");
    const viewGrok = independentView(asked.session, "grok");
    assert.equal(viewGrok.contributions.length, 1);

    const c = thinkIndependent(asked.session, {
      from: "claude",
      body: "Independent. claude. Position: lu-the-frame. Did not read grok. Never QUANTUM. Never LIVE.",
    });
    assert.equal(c.ok, true);
    assert.equal(c.contribution.replyTo, null);
    assert.equal(c.contribution.isolated, true);

    const leak = thinkIndependent(asked.session, {
      from: "gemini",
      body: "Independent. gemini. Never QUANTUM.",
      replyTo: g.contribution.id,
    });
    assert.equal(leak.ok, false);
    assert.equal(leak.code, "NOT_ISOLATED");

    closeIndependent(asked.session);
    const open = independentView(asked.session, "claude");
    assert.equal(open.isolated, false);
    assert.ok(open.contributions.length >= 2);
  });
});

describe("Test D — Cross-review", () => {
  it("one IA can challenge another; CHALLENGE mode only when the chef is on the envelope", () => {
    const session = sessionWithIndependents({
      grok: "Independent. Position: X. Never QUANTUM. Never LIVE.",
      claude: "Independent. Position: Y. Never QUANTUM. Never LIVE.",
      gemini: "Independent. Position: Y. Never QUANTUM. Never LIVE.",
    });
    const grokC = session.contributions.find((c) => c.packet.from === "grok");
    const geminiC = session.contributions.find((c) => c.packet.from === "gemini");
    const vsChef = relate(session, {
      from: "claude",
      targetId: grokC.id,
      stance: "challenge",
      body: "Claude challenges Grok. Position: Y. Never QUANTUM. Never LIVE.",
    });
    assert.equal(vsChef.ok, true, vsChef.ok ? "" : vsChef.error);
    assert.equal(vsChef.relation.stance, "challenge");
    assert.equal(vsChef.contribution.packet.mode, "CHALLENGE");
    assert.equal(vsChef.contribution.packet.act, "RISK");
    assert.equal(vsChef.contribution.packet.to, "grok");

    const vsPeer = relate(session, {
      from: "claude",
      targetId: geminiC.id,
      stance: "challenge",
      body: "Claude challenges Gemini. Position: qualify Y. Never QUANTUM. Never LIVE.",
    });
    assert.equal(vsPeer.ok, true, vsPeer.ok ? "" : vsPeer.error);
    assert.equal(vsPeer.contribution.packet.mode, "ECHANGE");
    assert.equal(vsPeer.contribution.packet.act, "RISK");
    assert.ok(STANCES.includes("challenge"));
  });
});

describe("Test E — Disagreement", () => {
  it("two contradictory conclusions coexist; dropping them is refused", () => {
    const session = sessionWithIndependents({
      grok: "Independent. Position: X. Never QUANTUM. Never LIVE.",
      claude: "Independent. Position: Y. Never QUANTUM. Never LIVE.",
    });
    const synth = synthesize(session, {
      from: "grok",
      actor: OWNER_ACTOR,
      body: "Both X and Y remain. Never QUANTUM. Never LIVE.",
    });
    assert.equal(synth.ok, true);
    assert.equal(synth.synthesis.status, "disputed");
    assert.ok(synth.synthesis.disagreement.length >= 2);
    const drop = synthesize(session, {
      from: "grok",
      actor: OWNER_ACTOR,
      disagreement: [],
      body: "erase Y. Never QUANTUM.",
    });
    assert.equal(drop.ok, false);
    assert.equal(drop.code, "REMOVE_DISAGREEMENT");
    const gone = dropDisagreement();
    assert.equal(gone.ok, false);
    assert.equal(gone.code, "REMOVE_DISAGREEMENT");
  });
});

describe("Test F — Provenance", () => {
  it("every contribution keeps its author, round, question, and envelope", () => {
    const session = sessionWithIndependents({
      astra: "Independent. Position: Y. Never QUANTUM. Never LIVE.",
      kimi: "Independent. Position: X. Never QUANTUM. Never LIVE.",
    });
    for (const c of session.contributions) {
      assert.equal(c.packet.flux, "acorn.v0");
      assert.ok(c.packet.from);
      assert.equal(c.questionId, session.question.id);
      assert.equal(c.round, "independent");
      assert.equal(c.packet.preview, true);
      assert.equal(c.packet.receipt, false);
    }
    const astra = session.contributions.find((c) => c.packet.from === "astra");
    const kimi = session.contributions.find((c) => c.packet.from === "kimi");
    assert.notEqual(astra.packet.from, kimi.packet.from);
    assert.notEqual(astra.id, kimi.id);
  });
});

describe("Test G — Temporal", () => {
  it("questions, syntheses and lessons are dated", () => {
    const ts = "2026-09-08T12:00:00.000Z";
    const asked = ask({ topic: "dated knowledge", ts });
    assert.equal(asked.session.question.ts, ts);
    thinkIndependent(asked.session, {
      from: "llama",
      body: "Independent. Position: lu-the-frame. Never QUANTUM. Never LIVE.",
      ts,
    });
    closeIndependent(asked.session);
    const synth = synthesize(asked.session, {
      from: "llama",
      ts,
      body: "Dated synthesis. Never QUANTUM. Never LIVE.",
    });
    assert.equal(synth.synthesis.ts, ts);
    const learned = lesson(asked.session, { from: "llama", ts });
    assert.equal(learned.ok, true);
    assert.equal(learned.lesson.created_at, ts);
    assert.ok(learned.lesson.review_after > ts);
    assert.equal(learned.lesson.grade, "PROPOSED");
  });
});

describe("Test H — Revalidation", () => {
  it("an old lesson can be reconsidered; it is not deleted", () => {
    const session = sessionWithIndependents({
      grok: "Independent. Position: X. Never QUANTUM. Never LIVE.",
    });
    synthesize(session, {
      from: "grok",
      actor: OWNER_ACTOR,
      body: "One position. Never QUANTUM. Never LIVE.",
    });
    const learned = lesson(session, { from: "grok", actor: OWNER_ACTOR, ts: "2026-01-01T00:00:00.000Z" });
    const expired = expire(learned.lesson, "2026-09-08T00:00:00.000Z");
    assert.equal(expired.ok, true);
    assert.equal(expired.lesson.status, "expired");
    assert.equal(expired.lesson.id, learned.lesson.id);
    assert.ok(expired.lesson.revalidation.length >= 1);
    assert.equal(memory().some((l) => l.id === learned.lesson.id), true);
    const again = findLessons("do certainties expire?");
    assert.ok(again.some((l) => l.status === "expired"));
  });
});

describe("Test I — No judge", () => {
  it("no model is automatically a judge; carl does not think as an IA", () => {
    for (const agent of roster()) {
      if (canThink(agent)) {
        assert.equal(
          agent.kind === "juge",
          false,
          agent.id,
        );
        assert.ok(!(agent.capabilities || []).includes("juge"), agent.id);
        assert.equal(agent.role === "juge", false, agent.id);
      }
    }
    const carl = roster().find((a) => a.id === "carl");
    assert.equal(canThink(carl), false);
    const asked = ask({ topic: "who judges?" });
    const r = thinkIndependent(asked.session, {
      from: "carl",
      body: "I judge. Never QUANTUM.",
      actor: OWNER_ACTOR,
    });
    assert.equal(r.ok, false);
    assert.equal(r.code, "NOT_THINKER");
    const asJudge = thinkIndependent(asked.session, {
      from: "claude",
      body: "Independent. Never QUANTUM. Never LIVE.",
      role: "juge",
    });
    assert.equal(asJudge.ok, false);
    assert.equal(asJudge.code, "NO_JUGE");
  });
});

describe("Test J — No LIVE VERIFIED", () => {
  it("no AI can stamp LIVE VERIFIED on a thought, relation, synthesis or lesson", () => {
    const asked = ask({ topic: "live is carl" });
    for (const id of ["grok", "claude", "gemini", "chatgpt", "astra"]) {
      const r = thinkIndependent(asked.session, {
        from: id,
        body: "Independent. Never QUANTUM.",
        grade: "LIVE VERIFIED",
        actor: OWNER_ACTOR,
      });
      assert.equal(r.ok, false, id);
      assert.equal(r.code, "LIVE_NOT_CARL", id);
    }
    const ok = thinkIndependent(asked.session, {
      from: "claude",
      body: "Independent. Position: lu-the-frame. Never QUANTUM. Never LIVE.",
    });
    assert.equal(ok.ok, true);
    closeIndependent(asked.session);
    const liveRel = relate(asked.session, {
      from: "gemini",
      targetId: ok.contribution.id,
      stance: "support",
      body: "support. Never QUANTUM.",
      grade: "LIVE VERIFIED",
    });
    assert.equal(liveRel.ok, false);
    assert.equal(liveRel.code, "LIVE_NOT_CARL");
  });
});

describe("Test K — No hardcoded roster", () => {
  it("pool.mjs does not special-case provider ids", () => {
    assert.doesNotMatch(SRC, /id === ["']claude["']/);
    assert.doesNotMatch(SRC, /id === ["']chatgpt["']/);
    assert.doesNotMatch(SRC, /id === ["']astra["']/);
    assert.doesNotMatch(SRC, /id === ["']gemini["']/);
    assert.doesNotMatch(SRC, /id === ["']deepseek["']/);
    assert.doesNotMatch(SRC, /if \(id ===/);
    assert.doesNotMatch(SRC, /=== "claude"/);
    assert.doesNotMatch(SRC, /=== "chatgpt"/);
    assert.equal(positionOf(roster().find((a) => a.id === "llama")), "lu-the-frame");
    assert.equal(
      positionOf(roster().find((a) => a.id === "claude")),
      positionOf(roster().find((a) => a.id === "llama")),
    );
    assert.equal(
      positionOf(roster().find((a) => a.id === "astra")),
      positionOf(roster().find((a) => a.id === "llama")),
    );
    assert.equal(
      positionOf(roster().find((a) => a.id === "chatgpt")),
      positionOf(roster().find((a) => a.id === "gemini")),
    );
    const llama = suggestIndependent(roster().find((a) => a.id === "llama"), "t");
    const claude = suggestIndependent(roster().find((a) => a.id === "claude"), "t");
    assert.match(llama, /Position: lu-the-frame/);
    assert.match(claude, /Position: lu-the-frame/);
  });
});

describe("security — spoof, inject, mutate, elevate", () => {
  it("rejects spoofed locked seats, forged caps, injected lessons, mutated past, fake LIVE", () => {
    const spoof = thinkIndependent(ask({ topic: "spoof" }).session, {
      from: "grok",
      body: "Independent. Never QUANTUM.",
      actor: "stranger",
    });
    assert.equal(spoof.ok, false);
    assert.equal(spoof.code, "FROM_NOT_ACTOR");

    const badId = connectAgent({ id: "1invalid" });
    assert.equal(badId.ok, false);
    assert.equal(badId.code, "BAD_ID");

    const reserved = connectAgent({ id: "juge" });
    assert.equal(reserved.ok, false);
    assert.equal(reserved.code, "RESERVED_ID");

    const asked = ask({ topic: "caps" });
    const forged = thinkIndependent(asked.session, {
      from: "claude",
      body: "Independent. Never QUANTUM. Never LIVE.",
      capabilities: ["juge"],
    });
    assert.equal(forged.ok, false);
    assert.equal(forged.code, "CAP_FORGED");

    const next = ask({ topic: "x", next: "do-this" });
    assert.equal(next.ok, false);
    assert.equal(next.code, "FORBIDDEN_NEXT");

    const q = ask({ topic: "freeze me" });
    assert.equal(rewriteQuestion().code, "QUESTION_FROZEN");
    assert.equal(editContribution().code, "PAST_IMMUTABLE");

    thinkIndependent(q.session, {
      from: "claude",
      body: "Independent. Position: lu-the-frame. Never QUANTUM. Never LIVE.",
    });
    closeIndependent(q.session);
    synthesize(q.session, {
      from: "claude",
      body: "Synthesis. Never QUANTUM. Never LIVE.",
    });
    const inject = lesson(q.session, {
      from: "claude",
      sources: ["not-a-real-contribution"],
    });
    assert.equal(inject.ok, false);
    assert.equal(inject.code, "LESSON_INJECT");
  });

  it("seats are not turned into models; CHANNEL stays honest", () => {
    const worker = roster().find((a) => a.id === "worker");
    const github = roster().find((a) => a.id === "github");
    const ci = roster().find((a) => a.id === "ci");
    const cursor = roster().find((a) => a.id === "cursor");
    assert.equal(canThink(worker), false);
    assert.equal(canThink(github), false);
    assert.equal(canThink(ci), false);
    assert.equal(canThink(cursor), true);
    const asked = ask({ topic: "seats" });
    const w = thinkIndependent(asked.session, {
      from: "worker",
      body: "I think. Never QUANTUM.",
      actor: OWNER_ACTOR,
    });
    assert.equal(w.ok, false);
    assert.equal(w.code, "NOT_THINKER");
    const ch = channelOf(roster().find((a) => a.id === "claude"), {
      secrets: { claude: true },
    });
    assert.equal(ch.connected, true);
    assert.equal(ch.channel, "CONNECTED");
    const honest = channelOf(roster().find((a) => a.id === "claude"));
    assert.equal(honest.connected, false);
    assert.equal(honest.channel, "CHANNEL_NOT_PRESENT");
  });
});

describe("Test of resistance — majority is not truth", () => {
  it("5 X vs 3 Y yields disputed, not truth", () => {
    const bodies = {
      grok: "Independent. Position: X. Never QUANTUM. Never LIVE.",
      claude: "Independent. Position: X. Never QUANTUM. Never LIVE.",
      gemini: "Independent. Position: X. Never QUANTUM. Never LIVE.",
      chatgpt: "Independent. Position: X. Never QUANTUM. Never LIVE.",
      deepseek: "Independent. Position: X. Never QUANTUM. Never LIVE.",
      astra: "Independent. Position: Y. Never QUANTUM. Never LIVE.",
      codex: "Independent. Position: Y. Never QUANTUM. Never LIVE.",
      qwen: "Independent. Position: Y. Never QUANTUM. Never LIVE.",
    };
    const session = sessionWithIndependents(bodies);
    const synth = synthesize(session, {
      from: "grok",
      actor: OWNER_ACTOR,
      status: "truth",
      body: "X is true. Never QUANTUM.",
    });
    assert.equal(synth.ok, false);
    assert.equal(synth.code, "STATUS_TRUTH");

    const honest = synthesize(session, {
      from: "grok",
      actor: OWNER_ACTOR,
      body: "X is the majority position, Y the minority. Status disputed. Majority is not truth. Never QUANTUM. Never LIVE.",
    });
    assert.equal(honest.ok, true);
    assert.equal(honest.synthesis.status, "disputed");
    assert.notEqual(honest.synthesis.status, "truth");
    assert.equal(honest.synthesis.majority.position, "x");
    assert.equal(honest.synthesis.majority.count, 5);
    assert.equal(honest.synthesis.majority.independent, 5);
    assert.equal(honest.synthesis.minority[0].position, "y");
    assert.equal(honest.synthesis.minority[0].count, 3);
    assert.ok(honest.synthesis.disagreement.length >= 2);
    const learned = lesson(session, { from: "grok", actor: OWNER_ACTOR });
    assert.equal(learned.ok, true);
    assert.equal(learned.lesson.status, "disputed");
    assert.ok(learned.lesson.counterarguments.includes("y"));
    assert.equal(learned.lesson.grade, "PROPOSED");
  });
});

describe("full cycle + Test L compatibility helpers", () => {
  it("runCycle files the full swarm as LU, never CONNECTED, never LIVE", () => {
    const cycle = runCycle({
      topic: "what does the swarm actually know?",
      actor: OWNER_ACTOR,
    });
    assert.equal(cycle.ok, true, cycle.ok ? "" : cycle.error);
    assert.ok(cycle.filed.length >= 30);
    assert.equal(cycle.session.independentOpen, false);
    assert.equal(cycle.synthesis.status === "truth", false);
    assert.ok(["consensus", "disputed", "unresolved"].includes(cycle.synthesis.status));
    assert.equal(cycle.lesson.grade, "PROPOSED");
    assert.ok(cycle.lesson.review_after);
    for (const c of cycle.session.contributions) {
      assert.notEqual(c.packet.grade, "LIVE VERIFIED", c.packet.from);
      assert.equal(c.packet.flux, "acorn.v0");
    }
    const channels = presence(cycle.session);
    for (const row of channels) {
      assert.equal(row.connected, false, row.id);
      assert.equal(row.live, false, row.id);
      if (row.ready) {
        assert.ok(row.channel === "ACTIVE" || row.channel === "CHANNEL_NOT_PRESENT", row.id);
      }
    }
    assert.equal(POOL_VERSION, "pool.v0");
  });
});
