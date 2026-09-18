import test from "node:test";
import assert from "node:assert/strict";
import {
  measureRevenueEconomics,
  rankRevenueOpportunity,
  chooseRevenueOpportunities,
  priceMeasuredOffer,
  consolidateBilling,
  consolidateCryptoSettlement,
  buildTaxReadyLedger,
  revenuePolicy,
  measureCommercialYield,
  scoreCommercialGrowth,
  buildCommercialActionPlan,
} from "../scripts/acorn-revenue-maximizer.mjs";

test("measures owner net value",()=>{
  const x=measureRevenueEconomics({gross_revenue:1000,infrastructure_cost:100,provider_cost:100,payment_fees:20,tax_reserve:100,verified_units:10,customer_count:2,transactions:2});
  assert.equal(x.net_value,780);
  assert.equal(x.owner_net_value,680);
  assert.equal(x.transaction_efficiency,500);
});

test("enterprise opportunities are economically prioritized",()=>{
  const a=rankRevenueOpportunity({audience:"ENTERPRISE",measured_value:10000,gross_revenue:8000,incremental_cost:1000,probability:1,repeatability:1,verified:true});
  const b=rankRevenueOpportunity({audience:"DEVELOPER",measured_value:100,gross_revenue:50,incremental_cost:40,probability:1,verified:true});
  assert.ok(a>b);
  const rows=chooseRevenueOpportunities([{id:"a",audience:"ENTERPRISE",gross_revenue:8000,measured_value:10000,incremental_cost:1000,verified:true},{id:"b",audience:"DEVELOPER",gross_revenue:50,measured_value:100,incremental_cost:40,verified:true}],{max:1});
  assert.equal(rows[0].id,"a");
});

test("pricing stays measurement based",()=>{
  const p=priceMeasuredOffer({measured_customer_value:1000,measured_delivery_cost:100,target_margin:.7});
  assert.equal(p.minimum_price,333.33333333);
  assert.equal(p.auto_price,false);
  assert.ok(p.suggested_price<=1000);
});

test("customer billing is consolidated",()=>{
  const bill=consolidateBilling({customer_id:"enterprise:1",period:"2026-09",events:[{id:"a",verified:true,amount_due:10},{id:"b",verified:true,amount_due:20},{id:"c",verified:false,amount_due:50}]});
  assert.equal(bill.event_count,2);
  assert.equal(bill.gross_amount,30);
  assert.equal(bill.transaction_target,1);
});

test("crypto settlement is batched and never custodial",()=>{
  const x=consolidateCryptoSettlement({customer_id:"enterprise:1",period:"2026-09",invoices:[{amount:30,verified:true},{amount:20,verified:true}],rail:{verified:true,type:"PUBLIC_ADDRESS"},minimum_threshold:40});
  assert.equal(x.eligible,true);
  assert.equal(x.transactions_target,1);
  assert.equal(x.custody,false);
  assert.equal(x.private_keys_in_acorn,false);
});

test("tax-ready ledger preserves accounting totals without giving tax advice",()=>{
  const x=buildTaxReadyLedger({customer_id:"enterprise:1",period:"2026-09",invoices:[{amount_due:100}],settlements:[{amount:100}],costs:[{amount:25}]});
  assert.equal(x.gross_revenue,100);
  assert.equal(x.settled_value,100);
  assert.equal(x.recorded_costs,25);
  assert.equal(x.tax_advice,false);
  assert.equal(x.tax_ready,true);
});

test("policy preserves Acorn essence",()=>{
  const p=revenuePolicy();
  assert.equal(p.open_access_preserved,true);
  assert.equal(p.provider_neutral,true);
  assert.equal(p.auto_contract,false);
  assert.equal(p.auto_spend,false);
  assert.equal(p.auto_merge,false);
  assert.equal(p.human_authority,"carl");
});


test("commercial yield penalizes direct, acquisition, payment and administration costs",()=>{
  const x=measureCommercialYield({gross_revenue:1000,direct_cost:100,acquisition_cost:50,payment_fees:20,admin_cost:10,recurring_revenue:700,expansion_revenue:150,verified_value:1200,transactions:2});
  assert.equal(x.net_owner_value,820);
  assert.equal(x.recurring_share,.7);
  assert.equal(x.revenue_per_transaction,500);
});

test("growth score rewards recurring expansion and low friction",()=>{
  const x=scoreCommercialGrowth({measured_yield:1,recurring_share:.8,expansion_share:.4,verified_demand:1,reuse:1,reliability:1,admin_burden:0,acquisition_friction:0});
  assert.ok(x>.8);
});

test("action plan prioritizes expansion and reusable capabilities without auto-contracting",()=>{
  const plan=buildCommercialActionPlan({
    opportunities:[
      {id:"new",audience:"MULTINATIONAL",gross_revenue:10000,measured_value:20000,incremental_cost:1000,verified:true},
      {id:"existing",audience:"ENTERPRISE",gross_revenue:5000,measured_value:10000,incremental_cost:500,verified:true,customer_id:"c1"},
    ],
    capabilities:["cortex"],
    existing_customers:[{id:"c1"}],
  });
  assert.equal(plan.acquisition_order[0],"MULTINATIONAL");
  assert.ok(plan.actions.some(x=>x.action==="EXPAND_EXISTING_CUSTOMER"));
  assert.ok(plan.actions.some(x=>x.action==="PACKAGE_REUSABLE_CAPABILITIES"));
  assert.equal(plan.no_auto_contract,true);
});
