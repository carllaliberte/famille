import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, it } from "node:test";
import {
  CLAIMS,
  COGNITION_VERSION,
  DRIFTS,
  MODE,
  PRESENCE,
  REPLIES,
  STEPS,
  TOURS,
  adapterOf,
  asTruth,
  canThink,
  census,
  classify,
  clusterStatus,
  contradict,
  correct,
  dropDisagreement,
  flagDrift,
  join as joinAgent,
  mayJudge,
  memory,
  openSession,
  presenceOf,
  reevaluate,
  remember,
  reply,
  resetCognition,
  revise,
  rewriteMemory,
  runCycle,
  runIndependent,
  runRevision,
  share,
  swarmLabel,
  thinkers,
  verifySwarm,
  visibleTo,
} from "../.github/swarm/cognition.mjs";
import { isAgent, lookup, resetGuests } from "../.github/swarm/flux.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

afterEach(() => {
  resetCognition();
  resetGuests();
});

describe("COLLECTIVE_COGNITION — unique mode", () => {
  it("is the unique mode; ten steps; four tours; open presence; distinct claims", () => {
    assert.equal(MODE, "COLLECTIVE_COGNITION");
    assert.equal(COGNITION_VERSION, "cognition.v0");
    assert.deepEqual(STEPS, [
      "question",
      "independent",
      "share",
      "counter",
      "disagreement",
      "evidence",
      "synthesis",
      "lesson",
      "memory",
      "reevaluate",
    ]);
    assert.deepEqual(TOURS, [
      "independent",
      "confrontation",
      "revision",
      "synthesis",
    ]);
    assert.ok(PRESENCE.includes("DECLARED"));
    assert.ok(PRESENCE.includes("CHANNEL_NOT_PRESENT"));
    assert.ok(PRESENCE.includes("CONNECTED"));
    assert.ok(PRESENCE.includes("ACTIVE"));
    assert.ok(PRESENCE.includes("BLOCKED"));
    assert.ok(PRESENCE.includes("LIVE VERIFIED"));
    assert.ok(CLAIMS.includes("fact"));
    assert.ok(CLAIMS.includes("disagreement"));
    assert.deepEqual(REPLIES, [
      "AGREE",
      "DISAGREE",
      "PARTIAL",
      "UNCERTAIN",
      "NEED_EVIDENCE",
      "NEED_RETEST",
    ]);
    assert.ok(DRIFTS.includes("FALSE_CONSENSUS"));
    assert.ok(DRIFTS.includes("JUDGE_BEHAVIOR"));
  });

  it("cognition.v0 has no IA enum, no next, additionalProperties true", () => {
    const schema = JSON.parse(read("schema/cognition.v0.json"));
    const raw = read("schema/cognition.v0.json");
    assert.equal(schema.title, "famille.cognition.v0");
    assert.equal(schema.properties.mode.const, "COLLECTIVE_COGNITION");
    assert.equal(schema.additionalProperties, true);
    assert.equal(schema.properties.next, false);
    assert.equal(schema.properties.instruction, false);
    assert.ok(schema.not.anyOf.some((c) => c.required?.includes("next")));
    assert.doesNotMatch(raw, /"claude"/);
    assert.doesNotMatch(raw, /"chatgpt"/);
    assert.doesNotMatch(raw, /"gemini"/);
    assert.doesNotMatch(raw, /"astra"/);
    assert.doesNotMatch(read("schema/mesh.v0.json"), /COLLECTIVE_COGNITION/);
  });

  it("COGNITION.md is the unique rule; consensus is not truth; Carl decides", () => {
    const doc = read("COGNITION.md");
    assert.match(doc, /COLLECTIVE_COGNITION/);
    assert.match(doc, /QUESTION → RÉFLEXION INDÉPENDANTE → PARTAGE/);
    assert.match(doc, /LE CONSENSUS N'EST PAS LA VÉRITÉ/);
    assert.match(doc, /AUCUNE IA N'EST LE JUGE/);
    assert.match(doc, /AUCUNE IA NE POSSÈDE LA VÉRITÉ/);
    assert.match(doc, /TOUTES LES IA COGITENT/);
    assert.match(doc, /TOUTES LES IA PEUVENT SE CONTREDIRE/);
    assert.match(doc, /LES DÉSACCORDS RESTENT VISIBLES/);
    assert.match(doc, /LES CONNAISSANCES SONT DATÉES ET RÉVISABLES/);
    assert.match(doc, /CARL CONSERVE LA DÉCISION FINALE/);
    assert.match(doc, /LIVE VERIFIED = CARL SEULEMENT/);
    assert.match(doc, /DECLARED, CONNECTED, ACTIVE et LIVE VERIFIED/);
    assert.match(doc, /sans imposer de liste fermée/);
    assert.match(doc, /hiérarchie cognitive/);
    assert.match(doc, /ARCHITECTURE READY/);
    assert.match(doc, /CHANNEL NOT PRESENT/);
    assert.doesNotMatch(doc, /action suivante/);
    assert.doesNotMatch(doc, /parler à travers cette page/);
  });

  it("thinkers are equal; seats ci/github/worker/carl are not models; no AI is juge", () => {
    const ids = thinkers().map((a) => a.id);
    assert.ok(ids.length >= 30);
    assert.ok(ids.includes("grok"));
    assert.ok(ids.includes("claude"));
    assert.ok(ids.includes("chatgpt"));
    assert.ok(ids.includes("gemini"));
    assert.ok(ids.includes("deepseek"));
    assert.ok(ids.includes("astra"));
    assert.ok(ids.includes("codex"));
    assert.ok(!ids.includes("carl"));
    assert.ok(!ids.includes("ci"));
    assert.ok(!ids.includes("github"));
    assert.ok(!ids.includes("worker"));
    assert.equal(canThink(lookup("carl")), false);
    assert.equal(canThink(lookup("worker")), false);
    assert.equal(canThink(lookup("claude")), true);
    assert.equal(canThink(lookup("chatgpt")), true);
    assert.equal(mayJudge("grok").ok, false);
    assert.equal(mayJudge("claude").code, "NO_JUGE");
    assert.equal(mayJudge("chatgpt").ok, false);
    assert.equal(mayJudge("carl").ok, true);
  });

  it("declared is not connected; connected and active require a real canal", () => {
    const claude = lookup("claude");
    const bare = presenceOf(claude);
    assert.equal(bare.ok, true);
    assert.equal(bare.presence, "CHANNEL_NOT_PRESENT");
    assert.equal(bare.connected, false);
    assert.equal(bare.active, false);
    assert.equal(bare.live, false);

    const claimed = presenceOf(claude, { claim: "CONNECTED" });
    assert.equal(claimed.ok, false);
    assert.equal(claimed.code, "CLAIMED_CHANNEL");

    const claimedActive = presenceOf(lookup("chatgpt"), { claim: "ACTIVE" });
    assert.equal(claimedActive.ok, false);
    assert.equal(claimedActive.code, "CLAIMED_CHANNEL");

    const live = presenceOf(lookup("gemini"), { claim: "LIVE VERIFIED" });
    assert.equal(live.ok, false);
    assert.equal(live.code, "LIVE_NOT_CARL");

    const keyed = presenceOf(lookup("chatgpt"));
    assert.equal(keyed.presence, "BLOCKED");
    assert.match(keyed.reason, /API CREDENTIAL REQUIRED/);

    const connected = presenceOf(claude, { canal: true, secret: true });
    assert.equal(connected.presence, "CONNECTED");
    assert.equal(connected.live, false);

    const active = presenceOf(claude, { canal: true, deposited: true });
    assert.equal(active.presence, "ACTIVE");
    assert.equal(active.live, false);
  });

  it("census is honest: architecture ready, 0 connected, 0 live, never FULL SWARM OPERATIONAL", () => {
    const snap = census();
    assert.equal(snap.live, 0);
    assert.equal(snap.connected, 0);
    assert.equal(snap.active, 0);
    assert.equal(snap.operational, false);
    assert.equal(snap.label, "ARCHITECTURE READY");
    assert.equal(swarmLabel(snap), "ARCHITECTURE READY");
    assert.ok(snap.thinkers >= 30);
    assert.ok(snap.blocked >= 1);
    assert.ok(snap.channelNotPresent >= 1);
    const src = read(".github/swarm/cognition.mjs");
    assert.match(src, /ARCHITECTURE READY/);
    assert.match(src, /FULL SWARM OPERATIONAL is forbidden/);
    assert.doesNotMatch(src, /FULL SWARM OPERATIONAL"/);
  });

  it("independent thought is isolated until SHARE", () => {
    const filings = [
      { from: "claude", body: "A" },
      { from: "gemini", body: "B" },
      { from: "chatgpt", body: "C" },
    ];
    const isolated = visibleTo("independent", "claude", filings);
    assert.deepEqual(isolated.map((c) => c.from), ["claude"]);
    const shared = visibleTo("share", "claude", filings);
    assert.equal(shared.length, 3);
    const counter = visibleTo("counter", "gemini", filings);
    assert.equal(counter.length, 3);
  });

  it("any thinking IA may contradict any other; majority is not truth", () => {
    const ok = contradict("claude", "chatgpt");
    assert.equal(ok.ok, true);
    assert.equal(contradict("claude", "claude").ok, false);
    assert.equal(contradict("carl", "claude").code, "NOT_THINKER");

    const fiveVsThree = clusterStatus([
      { position: "x", count: 5 },
      { position: "y", count: 3 },
    ]);
    assert.equal(fiveVsThree.status, "disputed");
    assert.equal(fiveVsThree.truth, false);
    assert.equal(fiveVsThree.majority.count, 5);
    assert.equal(asTruth().code, "CONSENSUS_NOT_TRUTH");

    const one = clusterStatus([{ position: "x", count: 9 }]);
    assert.equal(one.status, "consensus");
    assert.equal(one.truth, false);
  });

  it("disagreements stay; memory is dated and re-evaluable; claims are distinct", () => {
    assert.equal(dropDisagreement().code, "REMOVE_DISAGREEMENT");
    assert.equal(rewriteMemory().code, "PAST_IMMUTABLE");
    assert.equal(classify("fact").ok, true);
    assert.equal(classify("hypothesis").ok, true);
    assert.equal(classify("truth").code, "UNKNOWN_CLAIM");

    const stored = remember({
      from: "deepseek",
      claim: "proposal",
      statement: "Certainties expire. Never QUANTUM.",
      disagreement: ["gemini: they might not"],
      ts: "2026-09-08T20:00:00.000Z",
    });
    assert.equal(stored.ok, true);
    assert.equal(stored.entry.truth, false);
    assert.equal(stored.entry.ts, "2026-09-08T20:00:00.000Z");
    assert.equal(memory().length, 1);

    const truth = remember({
      from: "chatgpt",
      claim: "fact",
      statement: "no",
      status: "truth",
    });
    assert.equal(truth.ok, false);
    assert.equal(truth.code, "CONSENSUS_NOT_TRUTH");

    const next = reevaluate(stored.entry, {
      from: "gemini",
      evidence: "new dated proof",
      claim: "hypothesis",
    });
    assert.equal(next.ok, true);
    assert.equal(memory().length, 2);
    assert.equal(memory()[0].id, stored.entry.id);
    assert.match(next.entry.context, /reevaluate:/);
  });

  it("a new IA joins the unique mode without touching mesh.v0 or cognition.v0", () => {
    const meshBefore = read("schema/mesh.v0.json");
    const cogBefore = read("schema/cognition.v0.json");
    const added = joinAgent({
      id: "nouvelle-ia",
      name: "Nouvelle IA",
      capabilities: ["lu", "flux"],
    });
    assert.equal(added.ok, true);
    assert.equal(isAgent("nouvelle-ia"), true);
    assert.equal(canThink(lookup("nouvelle-ia")), true);
    const seen = presenceOf(lookup("nouvelle-ia"));
    assert.equal(seen.presence, "CHANNEL_NOT_PRESENT");
    assert.equal(seen.live, false);
    const opened = openSession({ topic: "Can a new IA cogitate on day one?" });
    const first = runIndependent(opened.session, { suggest: true });
    assert.equal(first.ok, true);
    assert.ok(first.filed.some((c) => c.from === "nouvelle-ia"));
    assert.equal(read("schema/mesh.v0.json"), meshBefore);
    assert.equal(read("schema/cognition.v0.json"), cogBefore);
  });

  it("forbids next/instruction; does not special-case named IAs; no secrets", () => {
    const blocked = remember({
      statement: "no",
      claim: "opinion",
      next: "do-this",
    });
    assert.equal(blocked.code, "FORBIDDEN_NEXT");
    assert.equal(joinAgent({ id: "judge-model", capabilities: ["lu"] }).code, "NO_JUGE");
    const src = read(".github/swarm/cognition.mjs");
    assert.doesNotMatch(src, /id === ["']claude["']/);
    assert.doesNotMatch(src, /id === ["']chatgpt["']/);
    assert.doesNotMatch(src, /id === ["']gemini["']/);
    assert.doesNotMatch(src, /if provider == /);
    assert.doesNotMatch(src, /sk-[a-zA-Z0-9]/);
    assert.doesNotMatch(read("schema/cognition.v0.json"), /sk-/);
    assert.doesNotMatch(read("schema/agents.json"), /sk-/);
  });
});

describe("COLLECTIVE_COGNITION — session", () => {
  it("runs one question through all thinkers, then counter-analysis, disagreement, synthesis", () => {
    const cycle = runCycle({
      topic: "Les certitudes ont-elles une date de fin ?",
      actor: "carllaliberte",
    });
    assert.equal(cycle.ok, true);
    assert.ok(cycle.filed.length >= 30);
    assert.equal(cycle.census.connected, 0);
    assert.equal(cycle.census.live, 0);
    assert.equal(cycle.census.label, "ARCHITECTURE READY");
    assert.ok(cycle.session.relations.length >= 1);
    assert.ok(cycle.session.relations.some((r) => r.reply === "DISAGREE"));
    assert.ok(cycle.session.relations.some((r) => r.reply === "NEED_EVIDENCE"));
    assert.ok((cycle.revised || []).length >= 1);
    assert.ok(cycle.session.contributions.some((c) => c.tour === "revision"));
    assert.equal(cycle.synthesis.truth, false);
    assert.ok(cycle.synthesis.status === "disputed" || cycle.synthesis.status === "consensus");
    assert.ok(cycle.lesson);
    assert.equal(cycle.lesson.truth, false);
    const first = cycle.filed[0];
    assert.match(first.packet.body, /Independent/);
    assert.equal(first.isolated, true);
  });

  it("first filing is not automatically the truth of the group", () => {
    const opened = openSession({ topic: "Is majority proof?" });
    runIndependent(opened.session, {
      bodies: {
        grok: "Position: yes-majority. Isolated.",
        claude: "Position: no-majority. Isolated.",
      },
      suggest: false,
    });
    share(opened.session);
    const independents = opened.session.contributions.filter((c) => c.tour === "independent");
    assert.ok(independents.length >= 2);
    const positions = new Set(independents.map((c) => c.position));
    assert.ok(positions.size >= 2);
  });

  it("reply and drift stay on the session; adapters are generic", () => {
    const opened = openSession({ topic: "Can a specialty become a judge?" });
    const first = runIndependent(opened.session, { suggest: true });
    share(opened.session);
    const a = first.filed[0];
    const b = first.filed[1];
    const r = reply(opened.session, {
      from: b.from,
      targetId: a.id,
      reply: "DISAGREE",
      body: "Specialty is a contribution, not authority.",
    });
    assert.equal(r.ok, true);
    const drift = flagDrift(opened.session, {
      from: b.from,
      drift: "JUDGE_BEHAVIOR",
      body: "An IA tried to close the question.",
    });
    assert.equal(drift.ok, true);
    const ad = adapterOf(lookup("claude"));
    assert.equal(ad.ok, true);
    assert.equal(ad.protocol, MODE);
    assert.equal(ad.note.includes("not authority"), true);
  });

  it("generic prompt names the unique mode and forbids a closed from enum", () => {
    const prompt = read("prompts/cognition.md");
    assert.match(prompt, /COLLECTIVE_COGNITION/);
    assert.match(prompt, /You are not the judge/);
    assert.match(prompt, /from: <id>/);
    assert.doesNotMatch(prompt, /from: <gemini\|claude\|chatgpt/);
    assert.match(prompt, /LIVE VERIFIED = Carl/);
  });

  it("accepts REQUEST_EVIDENCE as NEED_EVIDENCE; revision keeps the previous position", () => {
    const opened = openSession({ topic: "Can a position change without erasing the past?" });
    const first = runIndependent(opened.session, {
      bodies: {
        grok: "Position: keep-old. Isolated.",
        claude: "Position: keep-old. Isolated.",
      },
      suggest: false,
    });
    share(opened.session);
    const a = first.filed[0];
    const b = first.filed[1];
    const asked = reply(opened.session, {
      from: b.from,
      targetId: a.id,
      reply: "REQUEST_EVIDENCE",
      body: "Need a dated proof.",
    });
    assert.equal(asked.ok, true);
    assert.equal(asked.relation.reply, "NEED_EVIDENCE");
    const rev = revise(opened.session, {
      from: a.from,
      previousId: a.id,
      body: "Revision. Position: keep-old. Previous kept.",
    });
    assert.equal(rev.ok, true);
    assert.equal(rev.contribution.tour, "revision");
    assert.equal(rev.contribution.previousId, a.id);
    assert.equal(rev.contribution.previousPosition, a.position);
    assert.equal(a.position, "keep-old");
    const all = runRevision(opened.session, { actor: "carllaliberte" });
    assert.equal(all.ok, true);
    assert.ok(all.filed.length >= 1);
  });

  it("correction keeps the original filing and dates the new one", () => {
    const opened = openSession({ topic: "What happens when an IA is wrong?" });
    const first = runIndependent(opened.session, {
      bodies: {
        grok: "Position: wrong-claim. Isolated.",
        claude: "Position: correction-ready. Isolated.",
      },
      suggest: false,
    });
    share(opened.session);
    const original = first.filed[0];
    const fix = correct(opened.session, {
      from: first.filed[1].from,
      targetId: original.id,
      body: "Correction. The original claim does not hold. Original kept.",
    });
    assert.equal(fix.ok, true);
    assert.equal(fix.original.id, original.id);
    assert.equal(
      opened.session.contributions.some((c) => c.id === original.id),
      true,
    );
    assert.equal(rewriteMemory().code, "PAST_IMMUTABLE");
    assert.ok(fix.lesson);
    assert.match(fix.lesson.context, /corrects:/);
    assert.ok(fix.lesson.validAt);
    assert.ok(fix.lesson.reviewAfter);
  });

  it("verifySwarm runs the full LU cycle and never claims FULL SWARM OPERATIONAL", () => {
    const report = verifySwarm({
      topic: "Les certitudes ont-elles une date de fin ?",
    });
    assert.equal(report.ok, true);
    assert.equal(report.mode, "COLLECTIVE_COGNITION");
    assert.equal(report.label, "ARCHITECTURE READY");
    assert.equal(report.census.connected, 0);
    assert.equal(report.census.active, 0);
    assert.equal(report.census.live, 0);
    assert.ok(report.tour1 >= 30);
    assert.ok(report.tour3 >= 30);
    assert.ok(report.disagreements >= 1);
    assert.equal(report.provenance, true);
    assert.equal(report.truth, false);
    assert.equal(report.judge, false);
    assert.ok(report.agents.some((a) => a.id === "claude" && a.tour1 === true));
    assert.ok(report.agents.every((a) => a.presence !== "CONNECTED"));
    assert.ok(report.agents.every((a) => a.presence !== "LIVE VERIFIED"));
  });
});
