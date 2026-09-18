import test from "node:test";
import assert from "node:assert/strict";
import {
  buildClientOrder,
  buildOfferReady,
  authorizeOrder,
  buildDeliveryChecklist,
  buildHandoff,
  clientReadyCycle,
  clientReadyPolicy,
} from "../scripts/acorn-client-ready.mjs";

test("customer request becomes a structured order", () => {
  const order = buildClientOrder({ order_id:"o1", customer_id:"c1", request:"Automate reporting", success_criteria:["daily output"] });
  assert.equal(order.valid, true);
  assert.equal(order.stage, "INTAKE");
});

test("offer is not ready without solution, deliverables, proof plan and rights", () => {
  const order = buildClientOrder({ request:"Build system" });
  const offer = buildOfferReady({ order, solution_summary:"", deliverables:[], evidence_plan:[], usage_rights:[] });
  assert.equal(offer.stage, "HOLD_HUMAN_AUTHORIZATION");
});

test("human authorization is an explicit gate", () => {
  const order = buildClientOrder({ order_id:"o2", request:"Build system" });
  const offer = buildOfferReady({
    order, solution_summary:"Turnkey system", deliverables:["system"],
    evidence_plan:["integration test"], usage_rights:["PERPETUAL_USE"], price:10000,
  });
  assert.equal(authorizeOrder({ order, offer, human_authorized:false }).authorized, false);
  assert.equal(authorizeOrder({ order, offer, human_authorized:true, authorized_by:"carl" }).authorized, true);
});

test("delivery checklist blocks incomplete handoff", () => {
  const checklist = buildDeliveryChecklist({
    deliverables:["system"], evidence:[{id:"e1",verified:true}],
    access:["customer-access"], documentation:["guide"], usage_rights:["PERPETUAL_USE"],
    support:["support@example"], payment_verified:false,
  });
  assert.equal(checklist.ready, false);
  assert.ok(checklist.missing.includes("TRAINING_OR_GUIDANCE"));
  assert.ok(checklist.missing.includes("PAYMENT_STATUS"));
});

test("verified delivery produces a handoff record", () => {
  const handoff = buildHandoff({
    customer:"c1", access:["access"], documentation:["guide"],
    training:["session"], rights:["PERPETUAL_USE"], support:["portal"],
    evidence:[{id:"e1",verified:true}],
  });
  assert.equal(handoff.stage, "HANDOFF");
  assert.deepEqual(handoff.proof_index, ["e1"]);
});

test("full cycle never bypasses human authority", () => {
  const cycle = clientReadyCycle({
    order:{order_id:"o3",customer_id:"c3",request:"Complex project"},
    solution_summary:"Complete turnkey delivery",
    deliverables:["solution","docs"],
    evidence_plan:["acceptance test"],
    measured_value_plan:["time saved"],
    usage_rights:["PERPETUAL_USE"],
    price:50000,
    evidence:[{id:"e3",verified:true}],
    access:["customer-access"],
    documentation:["guide"],
    training:["handoff"],
    support:["support"],
    payment_verified:true,
    human_authorized:false,
  });
  assert.equal(cycle.stage, "HOLD_HUMAN_AUTHORIZATION");
  assert.equal(cycle.policy.auto_contract, false);
  assert.equal(cycle.policy.auto_payment_capture, false);
});

test("policy is customer-first and turnkey", () => {
  const policy = clientReadyPolicy();
  assert.equal(policy.customer_first, true);
  assert.equal(policy.turnkey, true);
  assert.equal(policy.proof_before_claim, true);
  assert.equal(policy.human_authorization_required, true);
});
