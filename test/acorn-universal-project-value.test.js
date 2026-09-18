import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeProjectIntake,
  classifyProjectComplexity,
  buildProjectPlan,
  evaluateDelivery,
  productizeProject,
  buildCommercialOffer,
  buildGrowthPlan,
  buildOperatingDashboard,
  launchReadiness,
  universalProjectValueCycle,
  enginePolicy,
} from "../scripts/acorn-universal-project-value.mjs";

test("intention becomes a normalized project intake", () => {
  const x = normalizeProjectIntake({
    id: "p1",
    intention: "Build a complete business automation",
    audience: "business",
    constraints: ["privacy", "privacy"],
    budget: 5000,
  });
  assert.equal(x.valid, true);
  assert.equal(x.state, "INTAKE");
  assert.deepEqual(x.constraints, ["privacy"]);
  assert.equal(x.budget, 5000);
});

test("complex projects are classified from measured structural pressure", () => {
  const x = classifyProjectComplexity({
    constraints: ["a","b","c","d","e"],
    capability_count: 8,
    integrations: 6,
    evidence_level: "HIGH",
  });
  assert.equal(x.level, "COMPLEX");
  assert.ok(x.score >= .75);
});

test("planning prefers verified reusable assets and exposes missing capabilities", () => {
  const intake = normalizeProjectIntake({ id:"p2", intention:"research system", audience:"enterprise" });
  const plan = buildProjectPlan({
    intake,
    capabilities:[
      {id:"c1", available:true, verified:true},
      {id:"c2", required:true, available:false},
    ],
    reusable_assets:[{id:"template-1", verified:true}],
  });
  assert.equal(plan.state, "PLANNED");
  assert.deepEqual(plan.reusable_assets, ["template-1"]);
  assert.deepEqual(plan.missing_capabilities, ["c2"]);
});

test("delivery requires execution and verification evidence", () => {
  assert.equal(evaluateDelivery({execution:{executed:true},evidence:{verified:false}}).state, "VERIFYING");
  assert.equal(evaluateDelivery({execution:{executed:true},evidence:{verified:true},measured_value:100}).state, "DELIVERED");
});

test("verified reusable work becomes a productization candidate", () => {
  const x = productizeProject({
    project_id:"p3",
    reusable_components:["workflow","connector"],
    similar_projects:8,
    measured_value:10000,
    delivery_cost:1000,
    verified:true,
  });
  assert.equal(x.state, "PRODUCTIZATION_CANDIDATE");
  assert.equal(x.build_once_sell_many, true);
  assert.equal(x.auto_license, false);
});

test("commercial offer never claims billability without delivery and price", () => {
  const project = normalizeProjectIntake({id:"p4",intention:"website",audience:"business"});
  const pending = buildCommercialOffer({project,delivery:{deliverable_ready:false},price:100});
  assert.equal(pending.billable, false);
  const ready = buildCommercialOffer({project,delivery:{deliverable_ready:true},price:100,revenue_streams:["PROJECT","SUBSCRIPTION","INVALID"]});
  assert.equal(ready.billable, true);
  assert.deepEqual(ready.revenue_streams, ["PROJECT","SUBSCRIPTION"]);
});

test("growth plan activates only channels supported by observed activity", () => {
  const x = buildGrowthPlan({qualified_leads:2,reusable_products:1,partners:1,api_clients:1,enterprise_accounts:1});
  assert.deepEqual(x.channels, ["DIRECT","SELF_SERVICE","MARKETPLACE","PARTNER","WHITE_LABEL","API"]);
  assert.equal(x.auto_outreach, false);
});

test("operating dashboard measures the business without inventing live state", () => {
  const x = buildOperatingDashboard({
    projects:[{state:"DELIVERED"},{state:"HOLD_HUMAN"}],
    customers:[{id:"c1"}],
    revenue:{gross_revenue:1000,recurring_revenue:700},
    capabilities:[{id:"c1"}],
    evidence:[{verified:true}],
  });
  assert.equal(x.completed_projects,1);
  assert.equal(x.blocked_projects,1);
  assert.equal(x.recurring_share,.7);
  assert.equal(x.live,false);
});

test("launch readiness blocks collection when evidence or payment rail is missing", () => {
  const intake = normalizeProjectIntake({id:"p5",intention:"deliver",audience:"business"});
  const plan = {state:"READY"};
  const delivery = {state:"DELIVERED",verified:true};
  const offer = buildCommercialOffer({project:intake,delivery,price:100});
  const blocked = launchReadiness({intake,plan,delivery,offer,payment_rail:{verified:false}});
  assert.equal(blocked.ready_for_commercial_delivery, false);
  assert.ok(blocked.hard_blocks.includes("PAYMENT_RAIL_NOT_VERIFIED"));
  const ready = launchReadiness({intake,plan,delivery,offer:{...offer,billable:false}});
  assert.equal(ready.ready_for_commercial_delivery,true);
});

test("universal cycle composes intake, planning, delivery, productization, monetization and growth", () => {
  const x = universalProjectValueCycle({
    id:"p6",
    intention:"complete enterprise automation",
    audience:"enterprise",
    capabilities:[{id:"orchestrator",available:true,verified:true}],
    reusable_assets:[{id:"base",verified:true}],
    execution:{executed:true},
    evidence:{verified:true},
    measured_value:20000,
    delivery_cost:2000,
    projected_revenue:8000,
    realized_revenue:5000,
    value_records:[
      {id:"rev-1",kind:"REVENUE",status:"REALIZED",amount:5000,source:"verified-payment-event"},
      {id:"cost-1",kind:"COST",status:"REALIZED",amount:2000,source:"delivery-ledger"},
    ],
    reusable_components:["orchestrator"],
    similar_projects:9,
    price:5000,
    payment_rail:{verified:true},
    revenue_streams:["PROJECT","LICENSE","SUBSCRIPTION"],
    growth:{qualified_leads:1,reusable_products:1},
  });
  assert.equal(x.readiness.ready_for_commercial_delivery,true);
  assert.equal(x.delivery.state,"DELIVERED");
  assert.equal(x.product.state,"PRODUCTIZATION_CANDIDATE");
  assert.equal(x.offer.billable,true);
  assert.equal(x.economic_ledger.realized_revenue,5000);
  assert.equal(x.economic_ledger.realized_net_value,3000);
  assert.equal(x.economic_ledger.projected_net_value,6000);
  assert.equal(x.economic_proof.commercial_state,"REALIZED_AND_EVIDENCED");
  assert.equal(x.asset_economics.productization_evidence,true);
  assert.deepEqual(x.growth.channels,["DIRECT","SELF_SERVICE","MARKETPLACE"]);
  assert.equal(x.policy.capability_is_not_authority,true);
  assert.equal(x.policy.auto_contract,false);
});

test("policy keeps Acorn commercially useful without transferring authority", () => {
  const p = enginePolicy();
  assert.equal(p.sell_results_not_models,true);
  assert.equal(p.reuse_before_rebuild,true);
  assert.equal(p.build_once_sell_many,true);
  assert.equal(p.auto_spend,false);
  assert.equal(p.auto_merge,false);
  assert.equal(p.auto_contract,false);
  assert.equal(p.private_key_custody,false);
  assert.equal(p.human_authority,"carl");
});
