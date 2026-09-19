import test from "node:test";
import assert from "node:assert/strict";
import {
  intelligenceAdapter,
  qualifyIntelligence,
  routeByCapability,
  selectRoute,
  buildAdaptiveIntelligenceGraph,
  assertIntelligenceAdapterConstitution
} from "../scripts/acorn-cortex-intelligence-adapter.mjs";

test("capability never becomes authority", () => {
  const i = intelligenceAdapter({identity:"future-ai",provider:"future-provider",capabilities:["analysis"]});
  assert.equal(i.authority, false);
  assert.doesNotThrow(() => assertIntelligenceAdapterConstitution(i));
});

test("adapter is provider-neutral and does not require an allowlist", () => {
  const a = intelligenceAdapter({identity:"alpha",provider:"unknown-future-provider",capabilities:["reasoning"]});
  const b = intelligenceAdapter({identity:"beta",provider:"another-provider",capabilities:["reasoning"]});
  const graph = buildAdaptiveIntelligenceGraph([a,b]);
  assert.equal(graph.provider_neutral, true);
  assert.equal(graph.fixed_provider_allowlist, false);
  assert.deepEqual(graph.capabilities, ["reasoning"]);
});

test("qualification and capability routing are evidence-aware", () => {
  const a = qualifyIntelligence(
    intelligenceAdapter({identity:"alpha",capabilities:["analysis"],evidence:["e1"]}),
    {required_capabilities:["analysis"],min_evidence:1}
  );
  const route = routeByCapability({capability:"analysis",intelligences:[a],required_evidence:1});
  assert.equal(route.state, "ROUTABLE");
  assert.equal(route.candidates.length, 1);
  assert.equal(route.requires_authorization, true);
});

test("routing does not silently select or execute", () => {
  const a = qualifyIntelligence(intelligenceAdapter({identity:"alpha",capabilities:["analysis"]}),{required_capabilities:["analysis"]});
  const route = routeByCapability({capability:"analysis",intelligences:[a]});
  assert.equal(route.selected, null);
  const selected = selectRoute(route);
  assert.equal(selected.selected.identity, "alpha");
  assert.equal(selected.authority, false);
  assert.equal(selected.breaker_touched, false);
});

test("constitution rejects authority, breaker access and autonomous execution", () => {
  assert.throws(() => assertIntelligenceAdapterConstitution({authority:true}), /CAPABILITY_MUST_NOT_GRANT_AUTHORITY/);
  assert.throws(() => assertIntelligenceAdapterConstitution({breaker_touched:true}), /BREAKER_MUST_REMAIN_UNTOUCHED/);
  assert.throws(() => assertIntelligenceAdapterConstitution({auto_authorize:true}), /AUTO_AUTHORIZATION_FORBIDDEN/);
  assert.throws(() => assertIntelligenceAdapterConstitution({auto_execute:true}), /AUTO_EXECUTION_FORBIDDEN/);
  assert.throws(() => assertIntelligenceAdapterConstitution({fixed_provider_allowlist:true}), /FIXED_PROVIDER_ALLOWLIST_FORBIDDEN/);
});
