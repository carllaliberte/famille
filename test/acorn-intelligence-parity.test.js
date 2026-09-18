import test from "node:test";
import assert from "node:assert/strict";
import {
  createIntelligence,
  measureIntelligence,
  routeIntelligence,
  createInvocation,
  validateIntelligenceParity
} from "../scripts/acorn-intelligence-fabric.mjs";

test("all intelligence providers share the same authority boundary", () => {
  const providers = ["grok","openai","anthropic","google","future-provider"];
  const nodes = providers.map((provider, i) =>
    createIntelligence({
      id:"ai_"+i,
      provider,
      model:"model-"+i,
      capabilities:["research","coding"],
      channel:"adapter"
    })
  );
  const parity = validateIntelligenceParity(nodes);
  assert.equal(parity.ready, true);
  assert.ok(nodes.every(n => n.authority === false && n.secret_custody === false));
});

test("routing is capability and evidence based, never provider based", () => {
  const grok = measureIntelligence(createIntelligence({
    id:"grok",
    provider:"grok",
    model:"model-a",
    capabilities:["coding"]
  }), {reachable:true, quality:0.8});
  const openai = measureIntelligence(createIntelligence({
    id:"openai",
    provider:"openai",
    model:"model-b",
    capabilities:["coding"]
  }), {reachable:true, quality:0.8});
  const routed = routeIntelligence({required_capabilities:["coding"]},{intelligences:[grok,openai]});
  assert.deepEqual(routed.map(x=>x.id).sort(), ["grok","openai"]);
  assert.equal(routed[0].score, routed[1].score);
});

test("authority never transfers through an intelligence adapter", () => {
  const ai = createIntelligence({
    id:"future",
    provider:"future-provider",
    model:"future-model",
    capabilities:["coding"]
  });
  const invocation = createInvocation({id:"task-1",required_capabilities:["coding"]}, ai);
  assert.equal(invocation.state, "BLOCKED");
  assert.equal(invocation.authority, false);
  assert.equal(invocation.external_effect, false);
});

test("parity validator rejects provider nodes that self-claim authority", () => {
  const ai = createIntelligence({id:"bad",provider:"x",model:"y"});
  const invalid = {...ai, authority:true};
  const result = validateIntelligenceParity([invalid]);
  assert.equal(result.ready, false);
  assert.ok(result.blockers.includes("INTELLIGENCE_AUTHORITY_MUST_BE_FALSE:bad"));
});
