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
