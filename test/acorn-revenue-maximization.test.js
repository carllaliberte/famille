import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyCommercialSegment,
  discoverRevenueOpportunity,
  revenueOpportunityScore,
  priceMeasuredOffer,
  diversifyOffer,
  maximizeCapabilityReuse,
  consolidatedBillingLedger,
  taxReadyLedger,
  commercialFunnel,
  revenuePolicy,
} from "../scripts/acorn-revenue-maximization.mjs";

test("prioritizes large commercial segments without closing public access", () => {
  assert.equal(classifyCommercialSegment({employees: 50000}), "MULTINATIONAL");
  assert.equal(classifyCommercialSegment({employees: 100}), "BUSINESS");
  assert.equal(classifyCommercialSegment({kind:"public"}), "PUBLIC");
  assert.deepEqual(revenuePolicy().open_access, ["PUBLIC","DEVELOPER","COMMUNITY","RESEARCH"]);
});

test("scores measured reusable enterprise opportunities", () => {
  const o = discoverRevenueOpportunity({
    id:"o1", capability_ids:["c1","c2"], segment:"MULTINATIONAL",
    demand:1, urgency:.8, measured_outcome:100000, customer_budget:200000,
    recurrence:.9, reuse_count:8, reliability:.95, evidence_verified:true,
    acquisition_cost:5000, delivery_cost:15000,
  });
  assert.ok(revenueOpportunityScore(o) > .7);
});

test("pricing never invents value and respects measured cost floor", () => {
  const priced = priceMeasuredOffer({
    measured_customer_value:100000,
    delivery_cost:10000,
    acquisition_cost:5000,
    target_margin:.6,
  });
  assert.ok(priced.recommended_price >= priced.floor_price);
  const unmeasured = priceMeasuredOffer({delivery_cost:10});
  assert.equal(unmeasured.measured, false);
});

test("one capability can support many commercial offers", () => {
  const offers = diversifyOffer({
    base_offer:{id:"o",family:"COGNITIVE_ORCHESTRATION",measured:true},
    capabilities:["cortex-orchestration"],
    use_cases:["research","automation"],
  });
  assert.equal(offers.length, 6);
  assert.ok(offers.every(o => o.commercial));
});

test("reuse ledger identifies capability leverage", () => {
  const rows = [
    {id:"a",capability_ids:["c1","c2"]},
    {id:"b",capability_ids:["c1"]},
    {id:"c",capability_ids:["c1"]},
  ];
  assert.equal(maximizeCapabilityReuse(rows)[0].capability_id, "c1");
  assert.equal(maximizeCapabilityReuse(rows)[0].opportunity_count, 3);
});

test("billing consolidates only verified events", () => {
  const ledger = consolidatedBillingLedger({
    customer_id:"enterprise-1",
    period:"2026-09",
    events:[
      {verified:true,amount:100,cost:20,fees:2},
      {verified:false,amount:1000,cost:0,fees:0},
      {verified:true,amount:50,cost:10,fees:1},
    ],
  });
  assert.equal(ledger.verified_event_count, 2);
  assert.equal(ledger.gross_revenue, 150);
  assert.equal(ledger.net_revenue, 117);
  assert.equal(ledger.settlement_due, true);
});

test("tax-ready ledger preserves verified source records", () => {
  const ledger = taxReadyLedger({
    period:"2026",
    invoices:[{verified:true,amount:100}],
    settlements:[{verified:true,amount:80}],
    costs:[{verified:true,amount:20}],
  });
  assert.equal(ledger.totals.invoiced, 100);
  assert.equal(ledger.totals.settled, 80);
  assert.equal(ledger.totals.costs, 20);
  assert.equal(ledger.tax_ready, true);
});

test("commercial funnel is operationally autonomous but authority-safe", () => {
  const funnel = commercialFunnel({
    opportunities:[discoverRevenueOpportunity({segment:"MULTINATIONAL",demand:1,measured_outcome:100,reliability:1,evidence_verified:true})],
  });
  assert.equal(funnel.no_auto_contract, true);
  assert.equal(funnel.no_auto_spend, true);
  assert.equal(funnel.authority, "carl");
});
