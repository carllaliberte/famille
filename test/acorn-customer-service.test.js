import test from "node:test";
import assert from "node:assert/strict";
import {
  createCustomer,
  createCustomerRequest,
  qualifyRequest,
  buildCustomerOffer,
  authorizeCustomerOrder,
  buildPaymentIntent,
  buildOnboarding,
  buildExecutionPlan,
  buildVerification,
  buildDelivery,
  customerServiceCycle,
  isolateTenant,
  customerServicePolicy,
} from "../scripts/acorn-customer-service.mjs";

const base = {
  customer:{customer_id:"c1",name:"Acme",contact:"customer@example.com"},
  request:"Automate monthly reporting",
  success_criteria:["cut reporting time"],
  capabilities:["automation","data"],
  solution:"Turnkey reporting automation",
  deliverables:["automation","documentation"],
  evidence_plan:["integration test"],
  value_metrics:["hours saved"],
  usage_rights:["PERPETUAL_USE"],
  price:5000,
  currency:"USD",
  human_authorized:true,
  authorized_by:"carl",
  payment_status:"PAID",
  payment_verified:true,
  external_payment_id:"pay_1",
  access:["source-system"],
  files:["requirements.pdf"],
  environment:["production"],
  tasks:["build","test","handoff"],
  resources:["compute"],
  intelligence:["adaptive-router"],
  evidence:[{id:"e1",verified:true}],
  tests:[{id:"t1",passed:true}],
  value_measurements:[{metric:"hours_saved",baseline:20,actual:5}],
  delivery_access:["customer-console"],
  documentation:["user-guide"],
  training:["handoff-session"],
  customer_accepted:true,
};

test("customer service kernel exposes the complete autonomous journey", () => {
  const result = customerServiceCycle(base);
  assert.equal(result.stage, "SUPPORT");
  assert.equal(result.payment.verified, true);
  assert.equal(result.verification.verified, true);
  assert.equal(result.delivery.stage, "DELIVERED");
  assert.equal(result.tenant_isolation_ok, true);
});

test("human authorization cannot be bypassed", () => {
  const result = customerServiceCycle({...base, human_authorized:false});
  assert.equal(result.stage, "HOLD_HUMAN_AUTHORIZATION");
  assert.equal(result.policy.auto_contract, false);
  assert.equal(result.policy.auto_spend, false);
});

test("payment must be externally verified before fulfillment", () => {
  const result = customerServiceCycle({...base, payment_status:"PAID",payment_verified:false});
  assert.equal(result.stage, "PAYMENT_PENDING");
  assert.equal(result.payment.verified, false);
});

test("evidence and tests are required before delivery", () => {
  const result = customerServiceCycle({...base, evidence:[], tests:[]});
  assert.equal(result.stage, "VERIFYING");
  assert.equal(result.delivery.stage, "VERIFYING");
});

test("tenant isolation rejects cross-customer records", () => {
  const a = createCustomer({customer_id:"a"});
  const b = createCustomer({customer_id:"b"});
  assert.equal(isolateTenant({tenant_id:a.tenant_id}, a), true);
  assert.equal(isolateTenant({tenant_id:a.tenant_id}, b), false);
});

test("building blocks compose independently", () => {
  const customer = createCustomer({customer_id:"c2"});
  const request = createCustomerRequest({customer,request:"Build API"});
  const qualification = qualifyRequest(request,{capabilities:["api"]});
  const offer = buildCustomerOffer({
    request,qualification,solution:"API",deliverables:["api"],
    evidence_plan:["test"],usage_rights:["PERPETUAL_USE"]
  });
  const auth = authorizeCustomerOrder({offer,authorized:true,authorized_by:"carl"});
  const payment = buildPaymentIntent({offer,status:"PAID",verified:true,external_payment_id:"p2"});
  const onboarding = buildOnboarding({customer});
  const execution = buildExecutionPlan({offer,onboarding,tasks:["build"]});
  const verification = buildVerification({
    execution,evidence:[{id:"e",verified:true}],tests:[{passed:true}]
  });
  const delivery = buildDelivery({
    offer,verification,access:["console"],documentation:["docs"],training:["guide"]
  });
  assert.equal(auth.authorized,true);
  assert.equal(payment.verified,true);
  assert.equal(execution.stage,"READY_TO_BUILD");
  assert.equal(verification.verified,true);
  assert.equal(delivery.stage,"DELIVERED");
});

test("policy preserves human sovereignty and evidence boundaries", () => {
  const p = customerServicePolicy();
  assert.equal(p.autonomous_customer_journey,true);
  assert.equal(p.tenant_isolation_required,true);
  assert.equal(p.proof_before_claim,true);
  assert.equal(p.secret_custody,false);
  assert.equal(p.auto_payment_capture,false);
  assert.equal(p.auto_merge,false);
  assert.equal(p.invented_live,false);
});
