#!/usr/bin/env node
/**
 * ACORN — REVENUE MAXIMIZER
 *
 * Cross-organism economic optimization. This is a coordination layer over the
 * existing Market, Contribution, Settlement, Resource and Work fabrics — not a
 * second Cortex, runtime or authority.
 *
 * Objective:
 *   maximize VERIFIED NET OWNER VALUE while preserving open access,
 *   contributor incentives, measured quality and human sovereignty.
 *
 * It never invents revenue, silently changes prices, spends money, signs
 * contracts, or stores private credentials.
 */
export const REVENUE_MAXIMIZER_VERSION = "acorn.revenue-maximizer.v1";

const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const pos=v=>Math.max(0,n(v));
const clamp=v=>Math.max(0,Math.min(1,n(v)));

export const DEFAULT_REVENUE_POLICY=Object.freeze({
  objective:"MAXIMIZE_VERIFIED_NET_OWNER_VALUE",
  priority:["MULTINATIONAL","ENTERPRISE","BUSINESS","RESEARCH","DEVELOPER","PUBLIC"],
  open_access_preserved:true,
  sell_results_not_model_tokens:true,
  measured_pricing_only:true,
  price_floor_requires_cost:true,
  price_ceiling_requires_value_evidence:true,
  consolidate_customer_billing:true,
  consolidate_crypto_settlement:true,
  internal_contribution_ledger:true,
  tax_ready_records:true,
  free_first:true,
  provider_neutral:true,
  no_private_key_custody:true,
  auto_contract:false,
  auto_spend:false,
  auto_merge:false,
  human_authority:"carl",
});

export function measureRevenueEconomics({
  gross_revenue=0,
  infrastructure_cost=0,
  provider_cost=0,
  payment_fees=0,
  refunds=0,
  tax_reserve=0,
  verified_units=0,
  customer_count=0,
  transactions=0,
}={}) {
  const gross=pos(gross_revenue);
  const costs=pos(infrastructure_cost)+pos(provider_cost)+pos(payment_fees)+pos(refunds);
  const reserve=pos(tax_reserve);
  const net=gross-costs;
  const owner_net=net-reserve;
  const units=pos(verified_units);
  return {
    gross_revenue:gross,
    operating_cost:pos(infrastructure_cost),
    provider_cost:pos(provider_cost),
    payment_fees:pos(payment_fees),
    refunds:pos(refunds),
    tax_reserve:reserve,
    verified_units:units,
    customer_count:pos(customer_count),
    transactions:pos(transactions),
    net_value:Number(net.toFixed(8)),
    owner_net_value:Number(owner_net.toFixed(8)),
    net_margin:gross?Number((net/gross).toFixed(8)):null,
    revenue_per_customer:customer_count?Number((gross/pos(customer_count)).toFixed(8)):null,
    revenue_per_unit:units?Number((gross/units).toFixed(8)):null,
    net_per_unit:units?Number((net/units).toFixed(8)):null,
    transaction_efficiency:transactions?Number((gross/transactions).toFixed(8)):null,
    measured:true,
  };
}

export function rankRevenueOpportunity({
  audience="BUSINESS",
  measured_value=0,
  gross_revenue=0,
  incremental_cost=0,
  probability=0,
  repeatability=0,
  strategic_fit=0,
  complexity=0,
  verified=false,
}={}) {
  const commercial=["ENTERPRISE","MULTINATIONAL","BUSINESS"].includes(String(audience).toUpperCase());
  const value=pos(measured_value), revenue=pos(gross_revenue), cost=pos(incremental_cost);
  const margin=revenue>0?clamp((revenue-cost)/revenue):0;
  const economics=revenue>0?clamp(revenue/Math.max(1,cost+1)):0;
  const repeat=clamp(repeatability), prob=clamp(probability), fit=clamp(strategic_fit);
  const complexityPenalty=1-clamp(complexity);
  const verification=verified?1:0;
  return Number((
    .22*(commercial?1:.45)+
    .18*clamp(value/Math.max(1,revenue||value))+
    .18*margin+
    .14*economics+
    .10*prob+
    .07*repeat+
    .05*fit+
    .04*complexityPenalty+
    .02*verification
  ).toFixed(6));
}

export function chooseRevenueOpportunities(opportunities=[], {max=10}={}) {
  return opportunities
    .filter(x=>x && x.enabled!==false && x.verified!==false)
    .map(x=>({...x,revenue_score:rankRevenueOpportunity(x)}))
    .sort((a,b)=>b.revenue_score-a.revenue_score)
    .slice(0,Math.max(0,Number(max)||0));
}

export function priceMeasuredOffer({
  measured_customer_value=0,
  measured_delivery_cost=0,
  comparable_price=null,
  target_margin=0.70,
  minimum_margin=0.20,
  currency="USD",
}={}) {
  const value=pos(measured_customer_value);
  const cost=pos(measured_delivery_cost);
  const margin=Math.max(clamp(minimum_margin),Math.min(.95,clamp(target_margin)));
  const floor=cost>0?cost/(1-margin):0;
  const valueCeiling=value>0?value:Infinity;
  const comparable=comparable_price==null?null:pos(comparable_price);
  const candidate=comparable!=null?Math.max(floor,Math.min(valueCeiling,comparable)):Math.max(floor, valueCeiling===Infinity?0:valueCeiling*.85);
  const price=valueCeiling===Infinity?candidate:Math.min(candidate,valueCeiling);
  return {
    currency,
    measured_customer_value:value,
    measured_delivery_cost:cost,
    minimum_price:Number(floor.toFixed(8)),
    suggested_price:Number(Math.max(0,price).toFixed(8)),
    target_margin:margin,
    value_ceiling:Number.isFinite(valueCeiling)?Number(valueCeiling.toFixed(8)):null,
    pricing_basis:"MEASURED_VALUE_AND_COST",
    requires_measurement:true,
    auto_price:false,
  };
}

export function consolidateBilling({
  customer_id,
  period,
  events=[],
  currency="USD",
  settlement_threshold=0,
}={}) {
  const valid=(Array.isArray(events)?events:[]).filter(e=>e?.verified===true && pos(e.amount_due)>0);
  const gross=valid.reduce((s,e)=>s+pos(e.amount_due),0);
  const due=gross>=pos(settlement_threshold)?gross:0;
  return {
    type:"CONSOLIDATED_CUSTOMER_BILL",
    customer_id:customer_id||null,
    period:period||null,
    currency,
    event_count:valid.length,
    gross_amount:Number(gross.toFixed(8)),
    amount_due:Number(due.toFixed(8)),
    transaction_target:due>0?1:0,
    events:valid.map(e=>({id:e.id||e.offer_id||null,amount_due:pos(e.amount_due),unit:e.unit||null})),
    verified:true,
    auto_contract:false,
    auto_spend:false,
    authority:"carl",
  };
}

export function consolidateCryptoSettlement({
  customer_id,
  period,
  invoices=[],
  rail=null,
  minimum_threshold=0,
}={}) {
  const valid=(Array.isArray(invoices)?invoices:[]).filter(x=>x?.verified===true && pos(x.amount)>0);
  const amount=valid.reduce((s,x)=>s+pos(x.amount),0);
  const eligible=rail?.verified===true && amount>=pos(minimum_threshold);
  return {
    type:"CONSOLIDATED_CRYPTO_SETTLEMENT",
    customer_id:customer_id||null,
    period:period||null,
    invoice_count:valid.length,
    amount:Number(amount.toFixed(8)),
    eligible,
    state:eligible?"REQUESTED":"HOLD_HUMAN",
    rail:rail?.verified===true?rail:null,
    transactions_target:eligible?1:0,
    custody:false,
    private_keys_in_acorn:false,
    authority:"carl",
  };
}

export function buildTaxReadyLedger({
  customer_id,
  period,
  invoices=[],
  settlements=[],
  costs=[],
}={}) {
  const sum=rows=>rows.reduce((s,x)=>s+pos(x.amount||x.amount_due||x.value),0);
  return {
    type:"TAX_READY_ECONOMIC_LEDGER",
    customer_id:customer_id||null,
    period:period||null,
    invoices_count:Array.isArray(invoices)?invoices.length:0,
    settlements_count:Array.isArray(settlements)?settlements.length:0,
    costs_count:Array.isArray(costs)?costs.length:0,
    gross_revenue:Number(sum(Array.isArray(invoices)?invoices:[]).toFixed(8)),
    settled_value:Number(sum(Array.isArray(settlements)?settlements:[]).toFixed(8)),
    recorded_costs:Number(sum(Array.isArray(costs)?costs:[]).toFixed(8)),
    source_records_preserved:true,
    reconciliation_required:true,
    tax_advice:false,
    tax_ready:true,
    authority:"carl",
  };
}


export function measureCommercialYield({
  gross_revenue=0,
  direct_cost=0,
  acquisition_cost=0,
  payment_fees=0,
  admin_cost=0,
  recurring_revenue=0,
  expansion_revenue=0,
  verified_value=0,
  transactions=0,
}={}) {
  const gross=pos(gross_revenue);
  const costs=pos(direct_cost)+pos(acquisition_cost)+pos(payment_fees)+pos(admin_cost);
  const net=gross-costs;
  return {
    gross_revenue:gross,
    total_cost:costs,
    net_owner_value:Number(net.toFixed(8)),
    recurring_revenue:pos(recurring_revenue),
    expansion_revenue:pos(expansion_revenue),
    verified_value:pos(verified_value),
    transactions:pos(transactions),
    net_yield_on_cost:costs?Number((net/costs).toFixed(8)):null,
    revenue_per_transaction:transactions?Number((gross/transactions).toFixed(8)):null,
    net_per_transaction:transactions?Number((net/transactions).toFixed(8)):null,
    recurring_share:gross?Number((pos(recurring_revenue)/gross).toFixed(8)):0,
    expansion_share:gross?Number((pos(expansion_revenue)/gross).toFixed(8)):0,
    measured:true,
  };
}

export function scoreCommercialGrowth({
  measured_yield=0,
  recurring_share=0,
  expansion_share=0,
  verified_demand=0,
  reuse=0,
  reliability=0,
  admin_burden=0,
  acquisition_friction=0,
}={}) {
  return Number((
    0.28*clamp(measured_yield) +
    0.18*clamp(recurring_share) +
    0.16*clamp(expansion_share) +
    0.14*clamp(verified_demand) +
    0.10*clamp(reuse) +
    0.08*clamp(reliability) +
    0.03*(1-clamp(admin_burden)) +
    0.03*(1-clamp(acquisition_friction))
  ).toFixed(6));
}

export function buildCommercialActionPlan({
  opportunities=[],
  capabilities=[],
  existing_customers=[],
}={}) {
  const ranked=chooseRevenueOpportunities(opportunities,{max:50});
  const actions=[];
  for(const opportunity of ranked){
    const segment=String(opportunity.audience||"BUSINESS").toUpperCase();
    const verified=opportunity.verified!==false;
    if(!verified) continue;
    actions.push({
      action: existing_customers.some(c=>c?.id===opportunity.customer_id) ? "EXPAND_EXISTING_CUSTOMER" : "QUALIFY_HIGH_VALUE_DEMAND",
      opportunity_id:opportunity.id||null,
      segment,
      priority:opportunity.revenue_score,
      capability_ids:Array.isArray(opportunity.capability_ids)?opportunity.capability_ids:[],
      measured:true,
      requires_human_contract:segment==="ENTERPRISE"||segment==="MULTINATIONAL",
      auto_contract:false,
    });
  }
  if(capabilities.length){
    actions.push({
      action:"PACKAGE_REUSABLE_CAPABILITIES",
      capability_count:capabilities.length,
      reuse_candidates:maximizeCapabilityReuse(opportunities),
      measured:true,
    });
  }
  return {
    version:REVENUE_MAXIMIZER_VERSION,
    actions:actions.sort((a,b)=>(b.priority||0)-(a.priority||0)),
    objective:"MAXIMIZE_VERIFIED_SUSTAINABLE_NET_REVENUE",
    acquisition_order:["MULTINATIONAL","ENTERPRISE","BUSINESS","RESEARCH","DEVELOPER","PUBLIC"],
    expansion_before_new_infrastructure:true,
    reuse_before_new_infrastructure:true,
    no_auto_contract:true,
    no_auto_spend:true,
    authority:"carl",
  };
}

export function revenuePolicy(overrides={}) {
  return {...DEFAULT_REVENUE_POLICY,...overrides,version:REVENUE_MAXIMIZER_VERSION};
}

if(import.meta.url===`file://${process.argv[1]}`) console.log(JSON.stringify(revenuePolicy(),null,2));
