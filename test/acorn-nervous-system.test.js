import test from "node:test";
import assert from "node:assert/strict";
import {
  createSignal, normalizeSignal, createChannel, routeSignal, deliverSignal,
  createFeedback, assessSignalHealth, recoverSignal,
  assertNervousSystemConstitution, buildNervousSystemSnapshot
} from "../scripts/acorn-nervous-system.mjs";

test("creates provenance-bearing signal", () => {
  const s = createSignal({source:"calendar",type:"EVENT",payload:{id:"1"}});
  assert.equal(s.state,"RECEIVED");
  assert.equal(s.authority,false);
  assert.equal(s.external_effect,false);
  assert.ok(s.signal_id);
});

test("normalization fails closed on incomplete identity", () => {
  assert.equal(normalizeSignal({source:"x"}).error,"SIGNAL_IDENTITY_INCOMPLETE");
});

test("only governed channels route", () => {
  const s = createSignal({source:"gmail",type:"MESSAGE"});
  const open = createChannel({name:"open",governed:false,capabilities:["read"]});
  const good = createChannel({name:"good",governed:true,capabilities:["read"]});
  const r = routeSignal(s,[open,good],{capability:"read"});
  assert.equal(r.routes.length,1);
  assert.equal(r.routes[0].channel_id,good.channel_id);
});

test("action delivery remains breaker-gated", () => {
  const s = createSignal({source:"acorn",type:"ACTION"});
  const c = createChannel({mode:"ACTION",governed:true,capabilities:["act"]});
  const blocked = deliverSignal(s,c,{});
  assert.equal(blocked.error,"BREAKER_AUTHORIZATION_REQUIRED");
  const allowed = deliverSignal(s,c,{breaker_authorized:true});
  assert.equal(allowed.ok,true);
  assert.equal(allowed.external_effect,false);
});

test("feedback never becomes authority", () => {
  const f = createFeedback("s1",{status:"ok"},{measured:true,verified:true,evidence:["e1"]});
  assert.equal(f.measured,true);
  assert.equal(f.verified,true);
  assert.equal(f.authority,false);
  assert.equal(f.external_effect,false);
});

test("health exposes measured delivery without claiming verification", () => {
  const h = assessSignalHealth([{state:"OBSERVED"},{state:"FAILED"}],[createChannel({governed:true})]);
  assert.equal(h.received,2);
  assert.equal(h.delivered,1);
  assert.equal(h.failed,1);
  assert.equal(h.measured,true);
  assert.equal(h.verified,false);
});

test("failed signals are recoverable without execution", () => {
  const r = recoverSignal({signal_id:"s1"},"TIMEOUT");
  assert.equal(r.state,"QUEUED");
  assert.equal(r.retryable,true);
  assert.equal(r.external_effect,false);
});

test("constitution rejects unsafe paths", () => {
  const c = assertNervousSystemConstitution({breaker_bypassed:true});
  assert.equal(c.valid,false);
  assert.ok(c.violations.includes("BREAKER_BYPASS"));
});

test("snapshot defines one nervous-system cycle", () => {
  const s = buildNervousSystemSnapshot();
  assert.deepEqual(s.cycle,["RECEIVE","NORMALIZE","PROVENANCE","ROUTE","DELIVER","OBSERVE","FEEDBACK","MEASURE","RECOVER","REUSE"]);
  assert.equal(s.authority,false);
  assert.equal(s.external_effect,false);
  assert.equal(s.live,false);
});
