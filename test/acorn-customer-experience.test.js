import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCustomerBrief,
  buildDeliveryPackage,
  buildCustomerJourney,
  buildExpansionPlan,
  customerExperiencePolicy,
} from "../scripts/acorn-customer-experience.mjs";

test("customer brief turns raw intention into an explicit understood project", () => {
  const x = buildCustomerBrief({
    customer_id: "c1",
    project_id: "p1",
    intention: "Automate the full workflow",
    desired_outcome: "Turnkey delivery",
    constraints: ["deadline", "deadline", "privacy"],
  });
  assert.equal(x.state, "UNDERSTOOD");
  assert.deepEqual(x.constraints, ["deadline", "privacy"]);
  assert.equal(x.customer_confirmation_required, true);
});

test("delivery package exposes proof, measured value, rights and handoff", () => {
  const x = buildDeliveryPackage({
    project: { id: "p1", intention: "Turnkey system" },
    solution: { name: "Complete solution", description: "Delivered end-to-end" },
    evidence: [{ id: "e1", verified: true, source: "test", observed_at: "2026-09-18" }],
    measured_value: 25000,
    deliverables: [{ id: "d1", name: "System", verified: true }],
    usage_rights: ["PERPETUAL_USE"],
    handoff: { documentation: true, access_transferred: true, training: true },
    support: { included: true, period: "12M", channel: "support" },
  });
  assert.equal(x.proof_state, "EVIDENCED");
  assert.equal(x.measured_value, 25000);
  assert.deepEqual(x.usage_rights, ["PERPETUAL_USE"]);
  assert.equal(x.handoff.documentation, true);
  assert.equal(x.support.included, true);
});

test("unverified delivery cannot expose measured customer value", () => {
  const x = buildDeliveryPackage({
    project: { id: "p2" },
    evidence: [],
    measured_value: 99999,
    deliverables: [{ id: "d1", verified: false, state: "BUILDING" }],
  });
  assert.equal(x.measured_value, 0);
  assert.equal(x.proof_state, "UNVERIFIED");
  assert.equal(x.delivery_state, "BUILDING");
});

test("journey keeps commercial authority human and blocks incomplete handoff", () => {
  const brief = buildCustomerBrief({ project_id: "p3", intention: "Complex project" });
  const delivery = buildDeliveryPackage({
    project: { id: "p3", intention: "Complex project" },
    evidence: [{ id: "e1", verified: true }],
    deliverables: [{ id: "d1", verified: true }],
    usage_rights: ["PERPETUAL_USE"],
  });
  const x = buildCustomerJourney({
    brief,
    delivery,
    customer_confirmation: true,
    contract: { signed: false },
    payment: { verified: false },
  });
  assert.equal(x.stage, "HOLD_HUMAN");
  assert.equal(x.auto_contract, false);
  assert.equal(x.auto_spend, false);
  assert.equal(x.customer_can_see.proof, true);
  assert.equal(x.customer_can_see.usage_rights, true);
});

test("expansion reuses delivered value instead of forcing new infrastructure", () => {
  const x = buildExpansionPlan({
    delivered: true,
    verified_value: 10000,
    reusable_asset: true,
    repeat_demand: 4,
    support_needed: true,
  });
  assert.deepEqual(x.actions, [
    "MEASURE_EXPANSION_VALUE",
    "PACKAGE_REUSABLE_ASSET",
    "OFFER_REPEATABLE_SOLUTION",
    "MAINTENANCE_OR_OPTIMIZATION",
  ]);
  assert.equal(x.requires_human_authorization, true);
});

test("policy is turnkey but not autonomous contracting", () => {
  const p = customerExperiencePolicy();
  assert.equal(p.turnkey, true);
  assert.equal(p.one_coherent_delivery, true);
  assert.equal(p.legal_contract_required_for_contract, true);
  assert.equal(p.auto_contract, false);
  assert.equal(p.auto_outreach, false);
  assert.equal(p.no_fake_live, true);
});
