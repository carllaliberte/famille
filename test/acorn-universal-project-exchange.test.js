import test from "node:test";
import assert from "node:assert/strict";
import {
  intake,
  qualify,
  compose,
  simulate,
  offer,
  order,
  pay,
  authorize,
  execute,
  verify,
  deliver,
  measureValue,
  learn,
  compileIntentToReality,
  assertProjectConstitution
} from "../scripts/acorn-universal-project-exchange.mjs";

test("intent compiles into a project graph", () => {
  const p = compileIntentToReality({
    intent: "build factory",
    required: ["robotics"],
    available_capabilities: ["robotics"],
    participants: ["robot-a"],
    resources: ["energy"]
  });
  assert.equal(p.state, "COMPOSING");
  assert.equal(p.compiler_stops_at, "COMPOSING");
  assert.equal(p.composition.participants[0], "robot-a");
  assert.equal(p.live, false);
  assert.ok(p.remaining.includes("PAYMENT"));
  assert.ok(p.remaining.includes("EXECUTE"));
  assert.ok(p.remaining.includes("DELIVER"));
  assert.equal(p.execution_authorized, undefined);
  assert.notEqual(p.state, "EXECUTING");
  assert.notEqual(p.state, "DELIVERED");
});

test("payment does not authorize execution", () => {
  const offered = offer(intake({ intent: "x" }), { price: 10 });
  const paid = pay(offered, { observed: true });
  assert.equal(paid.payment_observed, true);
  assert.equal(paid.execution_authorized, false);
  assert.equal(paid.state, "ORDERED");
  assert.equal(paid.authority, false);
  assert.throws(() => execute(paid), /PAYMENT_IS_NOT_AUTHORIZATION/);
  assert.throws(
    () =>
      assertProjectConstitution({
        payment_observed: true,
        execution_authorized: false,
        state: "EXECUTING"
      }),
    /PAYMENT_IS_NOT_AUTHORIZATION/
  );
});

test("human authorization is explicit", () => {
  const p = authorize(intake({ intent: "x" }), { human_authorized: true });
  assert.equal(p.state, "AUTHORIZED");
  assert.equal(p.execution_authorized, true);
});

test("execute and deliver require authorize, not pay", () => {
  const paid = pay(offer(intake({ intent: "x" }), { price: 10 }), { observed: true });
  assert.throws(() => deliver(paid), /PAYMENT_IS_NOT_AUTHORIZATION/);
  const authorized = authorize(paid, { human_authorized: true });
  const running = execute(authorized);
  assert.equal(running.state, "EXECUTING");
  assert.equal(running.external_effect, false);
  assert.equal(running.live, false);
  const checked = verify(running);
  assert.equal(checked.state, "VERIFYING");
  const delivered = deliver(checked);
  assert.equal(delivered.state, "DELIVERED");
  assert.equal(delivered.delivered, true);
  assert.equal(delivered.live, false);
});

test("measured value feeds learning", () => {
  const p = measureValue(intake({ intent: "x" }), { value: 100, cost: 40, quality: 0.9 });
  const l = learn(p, { reuse_candidates: ["template:x"] });
  assert.equal(l.learning.reuse_candidates[0], "template:x");
  assert.equal(p.measurement.margin, 60);
});

test("constitution blocks automatic authority", () => {
  assert.equal(assertProjectConstitution(), true);
  assert.throws(() => assertProjectConstitution({ auto_merge: true }), /AUTO_MERGE/);
  assert.throws(() => assertProjectConstitution({ auto_signature: true }), /AUTO_SIGNATURE/);
  assert.throws(() => assertProjectConstitution({ auto_spend: true }), /AUTO_SPEND/);
  assert.throws(() => order({ auto_spend: true }), /AUTO_SPEND/);
  assert.throws(() => pay({ auto_spend: true }), /AUTO_SPEND/);
  assert.throws(() => execute({ auto_merge: true, execution_authorized: true }), /AUTO_MERGE/);
});

test("qualify compose simulate remain available", () => {
  const q = qualify(intake({ intent: "gap" }), { required: ["a"], available_capabilities: [] });
  assert.equal(q.state, "QUALIFYING");
  const c = compose(q, { capabilities: ["a"] });
  assert.equal(c.state, "COMPOSING");
  const s = simulate(c, { cost: 1, duration: "1d" });
  assert.equal(s.state, "SIMULATING");
  assert.equal(s.external_effect, false);
});
