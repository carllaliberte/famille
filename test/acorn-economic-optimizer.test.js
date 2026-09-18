import test from "node:test";
import assert from "node:assert/strict";
import {
  measureUnitEconomics, rankEconomicOpportunity, chooseEconomicWork,
  reinvestmentDecision, economicAllocation, economicPolicy
} from "../scripts/acorn-economic-optimizer.mjs";

test("measures net value and crypto yield without inventing revenue",()=>{
  const x=measureUnitEconomics({revenue:100,operating_cost:20,fees:5,crypto_revenue:80,crypto_cost:3,units:10});
  assert.equal(x.net_value,75); assert.equal(x.crypto_net,77); assert.equal(x.net_per_unit,7.5);
});
test("economic ranking favors measured margin, demand and reliability",()=>{
  assert.ok(rankEconomicOpportunity({demand:1,reliability:1,confidence:1,economics:{revenue:100,cost:10,units:10}})>0.5);
});
test("opportunity selection remains bounded",()=>{
  const x=chooseEconomicWork([{id:"a",demand:1,reliability:1,confidence:1,economics:{revenue:100,cost:10,units:10}},{id:"b",enabled:false}],{max:1});
  assert.deepEqual(x.map(v=>v.id),["a"]);
});
test("reinvestment stays human gated",()=>{
  assert.equal(reinvestmentDecision({measuredRevenue:100,measuredCost:20,incrementalCost:10,expectedIncrementalRevenue:30,verifiedEvidence:true}).decision,"HOLD_HUMAN");
  assert.equal(reinvestmentDecision({measuredRevenue:100,measuredCost:20,incrementalCost:10,expectedIncrementalRevenue:30,verifiedEvidence:true,humanAuthorization:true}).decision,"ALLOW");
});
test("allocation prefers measured net yield but never enables automatic spend",()=>{
  const x=economicAllocation({resources:[{id:"free",cost:0,net_yield:10},{id:"paid",cost:5,net_yield:100}],budget:5});
  assert.equal(x.resources[0].id,"paid"); assert.equal(x.auto_spend,false); assert.equal(x.authority,"carl");
});
test("policy preserves equal access and sovereignty",()=>{
  const p=economicPolicy(); assert.equal(p.public_access,"OPEN"); assert.equal(p.developer_access,"OPEN"); assert.equal(p.private_key_custody,false);
});
