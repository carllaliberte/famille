#!/usr/bin/env node
/**
 * ACORN ECONOMIC OPTIMIZER
 *
 * Optimizes the whole organism for measured net value while preserving
 * equal public/developer access and human authority.
 *
 * Economic objective:
 *   NET_VALUE = VERIFIED_REVENUE - VERIFIED_OPERATING_COST - VERIFIED_FEES
 *   CRYPTO_YIELD = VERIFIED_CRYPTO_RECEIPTS - VERIFIED_CRYPTO_COSTS
 *
 * This module never invents revenue, never promises returns, never holds
 * private keys, and never spends merely to chase revenue.
 */
export const ECONOMIC_OPTIMIZER_VERSION = "acorn.economic-optimizer.v1";

const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const clamp=(v)=>Math.max(0,Math.min(1,n(v)));
const positive=(v)=>Math.max(0,n(v));

export const DEFAULT_ECONOMIC_POLICY=Object.freeze({
  objective:"MAXIMIZE_VERIFIED_NET_VALUE",
  free_first:true,
  public_access:"OPEN",
  developer_access:"OPEN",
  business_billing:"MEASURED_USAGE",
  strategic_partnerships:"CONFIGURABLE",
  crypto_settlement:"VERIFIED_ONLY",
  auto_spend:false,
  auto_contract:false,
  auto_merge:false,
  private_key_custody:false,
  human_authority:"carl",
  reinvestment_requires_evidence:true,
  price_changes_require_measurement:true,
});

export function measureUnitEconomics({revenue=0,operating_cost=0,fees=0,crypto_revenue=0,crypto_cost=0,units=0}={}) {
  const r=positive(revenue), c=positive(operating_cost), f=positive(fees);
  const cr=positive(crypto_revenue), cc=positive(crypto_cost);
  const u=positive(units);
  const net=r-c-f;
  const crypto_net=cr-cc;
  return {
    revenue:r, operating_cost:c, fees:f, net_value:Number(net.toFixed(8)),
    crypto_revenue:cr, crypto_cost:cc, crypto_net:Number(crypto_net.toFixed(8)),
    units:u,
    net_per_unit:u?Number((net/u).toFixed(8)):null,
    crypto_net_per_unit:u?Number((crypto_net/u).toFixed(8)):null,
    profitable:net>0,
    crypto_positive:crypto_net>0,
    measured:true,
  };
}

export function rankEconomicOpportunity(opportunity={}) {
  const e=measureUnitEconomics(opportunity.economics||opportunity);
  const demand=clamp(opportunity.demand);
  const reliability=clamp(opportunity.reliability);
  const confidence=clamp(opportunity.confidence);
  const margin=e.net_value>0 ? Math.min(1,e.net_value/Math.max(1,positive(opportunity.revenue||e.revenue))) : 0;
  const costEfficiency=e.units>0 ? Math.min(1,1/(1+e.operating_cost/e.units)) : 0;
  return Number((.35*clamp(demand)+.25*margin+.15*costEfficiency+.15*reliability+.10*confidence).toFixed(6));
}

export function chooseEconomicWork(opportunities=[], {max=5}={}) {
  return opportunities
    .filter(o=>o && o.enabled!==false && o.measured!==false)
    .map(o=>({...o,economic_score:rankEconomicOpportunity(o)}))
    .sort((a,b)=>b.economic_score-a.economic_score)
    .slice(0,Math.max(0,max));
}

export function reinvestmentDecision({measuredRevenue=0,measuredCost=0,incrementalCost=0,expectedIncrementalRevenue=0,verifiedEvidence=false,humanAuthorization=false}={}) {
  const revenue=positive(measuredRevenue), cost=positive(measuredCost), extra=positive(incrementalCost), expected=positive(expectedIncrementalRevenue);
  const currentNet=revenue-cost;
  const incrementalNet=expected-extra;
  if(!verifiedEvidence) return {decision:"HOLD",reason:"VERIFIED_EVIDENCE_REQUIRED",current_net:currentNet,incremental_net:incrementalNet};
  if(extra===0) return {decision:"ALLOW",reason:"NO_INCREMENTAL_COST",current_net:currentNet,incremental_net:incrementalNet};
  if(!humanAuthorization) return {decision:"HOLD_HUMAN",reason:"INCREMENTAL_SPEND_REQUIRES_HUMAN_AUTHORIZATION",current_net:currentNet,incremental_net:incrementalNet};
  if(currentNet<=0) return {decision:"HOLD",reason:"CURRENT_NET_VALUE_NOT_POSITIVE",current_net:currentNet,incremental_net:incrementalNet};
  if(incrementalNet<=0) return {decision:"HOLD",reason:"INCREMENTAL_RETURN_DOES_NOT_COVER_COST",current_net:currentNet,incremental_net:incrementalNet};
  return {decision:"ALLOW",reason:"VERIFIED_POSITIVE_INCREMENTAL_NET_VALUE",current_net:currentNet,incremental_net:incrementalNet};
}

export function economicAllocation({resources=[],opportunities=[],budget=0}={}) {
  const rankedResources=[...resources].sort((a,b)=>{ const score=r=>n(r.net_yield)-n(r.cost); const delta=score(b)-score(a); return delta!==0?delta:n(b.net_yield)-n(a.net_yield); });
  const rankedOpportunities=chooseEconomicWork(opportunities);
  const spendable=Math.max(0,n(budget));
  let remaining=spendable;
  const selected=[];
  for(const r of rankedResources){
    const cost=positive(r.cost);
    if(cost===0 || cost<=remaining){
      selected.push({...r,selected:true});
      remaining-=cost;
    }
  }
  return {
    version:ECONOMIC_OPTIMIZER_VERSION,
    objective:DEFAULT_ECONOMIC_POLICY.objective,
    resources:selected,
    opportunities:rankedOpportunities,
    budget:spendable,
    budget_remaining:Number(remaining.toFixed(8)),
    free_first:true,
    auto_spend:false,
    authority:"carl",
  };
}

export function economicPolicy(overrides={}) {
  return {...DEFAULT_ECONOMIC_POLICY,...overrides,version:ECONOMIC_OPTIMIZER_VERSION};
}

if(import.meta.url===`file://${process.argv[1]}`) console.log(JSON.stringify(economicPolicy(),null,2));
