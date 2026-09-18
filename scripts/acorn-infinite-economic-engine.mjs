#!/usr/bin/env node
import crypto from "node:crypto";
import { buildProjectValueLedger } from "./acorn-project-value-ledger.mjs";

const ISO=()=>new Date().toISOString();
const id=p=>p+"_"+crypto.randomUUID();
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const pos=v=>Math.max(0,n(v));
const clean=(v,f="")=>String(v??f).trim();

export const INFINITE_ECONOMIC_ENGINE_VERSION="acorn.infinite-economic-engine.v1";
export const INFINITE_ECONOMIC_POLICY=Object.freeze({
 capability_is_not_authority:true,human_final_authority:true,measured_only:true,
 projected_is_not_realized:true,payment_is_not_receipt:true,no_auto_contract:true,
 no_auto_payment:true,no_auto_spend:true,no_auto_publish:true,no_auto_outreach:true,
 no_auto_sign:true,no_auto_merge:true,no_secret_custody:true,no_invented_revenue:true
});
const state=(name,data={})=>Object.freeze({id:id(name.toLowerCase()),state:name,measured_at:ISO(),...data});

export function createEconomicSignal({source_id,kind="DEMAND",problem_class="UNKNOWN",value=0,currency="CAD",verified=false,reusable=false,repeat_count=0,customer_count=0,cost=0,rights="UNKNOWN",evidence_id=null}={}) {
 return state("MEASURED_SIGNAL",{source_id:clean(source_id,null),kind:clean(kind,"DEMAND").toUpperCase(),problem_class:clean(problem_class,"UNKNOWN"),value:pos(value),currency:clean(currency,"CAD").toUpperCase(),verified:verified===true,reusable:reusable===true,repeat_count:pos(repeat_count),customer_count:pos(customer_count),cost:pos(cost),rights:clean(rights,"UNKNOWN"),evidence_id:evidence_id?clean(evidence_id):null,authority:"human"});
}

export function discoverEconomicOpportunities({signals=[]}={}) {
 const groups=new Map();
 for(const s of Array.isArray(signals)?signals:[]) {
  if(!s||s.state!=="MEASURED_SIGNAL")continue;
  const key=s.problem_class||"UNKNOWN";
  const g=groups.get(key)||{problem_class:key,signals:[],verified_value:0,observed_cost:0,repeat_count:0,customer_count:0,reusable_count:0};
  g.signals.push(s); if(s.verified)g.verified_value+=s.value; g.observed_cost+=s.cost;
  g.repeat_count+=s.repeat_count; g.customer_count+=s.customer_count; if(s.reusable)g.reusable_count++;
  groups.set(key,g);
 }
 return [...groups.values()].map(g=>state("OPPORTUNITY_DETECTED",{
  problem_class:g.problem_class,signal_count:g.signals.length,verified_value:g.verified_value,observed_cost:g.observed_cost,
  repeat_count:g.repeat_count,customer_count:g.customer_count,reusable_count:g.reusable_count,
  diagnostics:{repeatability_signal:g.repeat_count>0,reuse_signal:g.reusable_count>0,verified_value_signal:g.verified_value>0,demand_signal:g.customer_count>1||g.repeat_count>1},
  decision:"HUMAN_REVIEW_REQUIRED"
 }));
}

export function generateBusinessModels({asset,observed={},currency="CAD"}={}) {
 if(!asset?.id)return {state:"BLOCKED",reason:"ASSET_REQUIRED"};
 const models=[
  ["PROJECT","CUSTOM_SCOPE","ONE_TIME"],["LICENSE","USAGE_RIGHT","RECURRING_OR_PERPETUAL"],
  ["SUBSCRIPTION","CONTINUOUS_ACCESS","RECURRING"],["API","METERED_USAGE","USAGE_BASED"],
  ["SERVICE","OPERATIONS_AND_SUPPORT","RECURRING"],["PRODUCT","STANDARDIZED_DELIVERY","REPEATABLE"],
  ["PLATFORM","ECOSYSTEM_ACCESS","RECURRING"],["MARKETPLACE","TRANSACTION_OR_LISTING","RECURRING"],
  ["ENTERPRISE","PRIVATE_DEPLOYMENT","CONTRACTUAL"],["PARTNERSHIP","SHARED_VALUE","CONTRACTUAL"]
 ].map(([type,basis,recurrence])=>({type,basis,recurrence}));
 return state("BUSINESS_MODELS_PROPOSED",{asset_id:asset.id,problem_class:clean(asset.problem_class,"UNKNOWN"),
  currency:clean(currency,"CAD").toUpperCase(),models,
  observed:{customer_count:pos(observed.customer_count),repeat_count:pos(observed.repeat_count),verified_value:pos(observed.verified_value),measured_margin:pos(observed.measured_margin)},
  human_decision_required:true,policy:INFINITE_ECONOMIC_POLICY});
}

export function productizeEconomicAsset({asset,evidence=[],demandSignals=0,customerCount=0}={}) {
 if(!asset?.id)return {state:"BLOCKED",reason:"ASSET_REQUIRED"};
 const measured=Array.isArray(evidence)&&evidence.length>0&&evidence.every(e=>e?.status==="MEASURED");
 const reusable=asset.reusable===true||pos(asset.reusable_uses)>0;
 const candidate=measured&&reusable&&(pos(demandSignals)>0||pos(customerCount)>1);
 return state(candidate?"PRODUCTIZATION_CANDIDATE":"PRODUCTIZATION_PENDING",{
  asset_id:asset.id,measured_evidence:measured,reusable_signal:reusable,demand_signals:pos(demandSignals),customer_count:pos(customerCount),
  recommendation:candidate?"PREPARE_HUMAN_REVIEW":"COLLECT_MORE_MEASURED_SIGNAL",human_publish_required:true
 });
}

export function buildEconomicPortfolio({projects=[],assets=[],products=[],opportunities=[],currency="CAD"}={}) {
 const ledgers=(Array.isArray(projects)?projects:[]).map(p=>p?.ledger||buildProjectValueLedger({
  project_id:p?.id,records:p?.records||[],projected_revenue:p?.projected_revenue||0,realized_revenue:p?.realized_revenue||0,
  delivery_cost:p?.delivery_cost||0,measured_value:p?.measured_value||0,evidence_verified:p?.evidence_verified===true,currency:p?.currency||currency
 }));
 const realizedRevenue=ledgers.reduce((s,l)=>s+pos(l.realized_revenue),0);
 const realizedCost=ledgers.reduce((s,l)=>s+pos(l.realized_cost),0);
 const measuredValue=ledgers.reduce((s,l)=>s+pos(l.measured_value),0);
 return state("ECONOMIC_PORTFOLIO",{
  currency:clean(currency,"CAD").toUpperCase(),project_count:ledgers.length,asset_count:Array.isArray(assets)?assets.length:0,
  product_count:Array.isArray(products)?products.length:0,opportunity_count:Array.isArray(opportunities)?opportunities.length:0,
  realized_revenue:realizedRevenue,realized_cost:realizedCost,realized_net_value:Math.max(0,realizedRevenue-realizedCost),
  measured_value:measuredValue,projected_revenue:ledgers.reduce((s,l)=>s+pos(l.projected_revenue),0),
  economics:{revenue_is_evidence_bounded:true,projected_is_not_realized:true,payment_is_not_receipt:true,reuse_is_separately_measured:true},
  policy:INFINITE_ECONOMIC_POLICY
 });
}

export function runInfiniteEconomicCycle({signals=[],assets=[],projects=[],products=[],currency="CAD"}={}) {
 const opportunities=discoverEconomicOpportunities({signals});
 const models=assets.flatMap(asset=>{
  const matching=signals.filter(s=>s?.problem_class===asset?.problem_class);
  const r=generateBusinessModels({asset,currency,observed:{
   customer_count:matching.length,repeat_count:matching.reduce((s,x)=>s+pos(x.repeat_count),0),
   verified_value:matching.filter(x=>x?.verified).reduce((s,x)=>s+pos(x.value),0)
  }});
  return r.state==="BUSINESS_MODELS_PROPOSED"?[r]:[];
 });
 const productization=assets.map(asset=>{
  const matching=opportunities.filter(o=>o.problem_class===asset.problem_class);
  const count=signals.filter(s=>s?.problem_class===asset.problem_class).length;
  return productizeEconomicAsset({asset,evidence:asset.evidence||[],demandSignals:matching.length,customerCount:count});
 });
 const portfolio=buildEconomicPortfolio({projects,assets,products,opportunities,currency});
 return state("ECONOMIC_CYCLE_READY",{
  stages:{opportunities,business_models:models,productization,portfolio},
  next_actions:["HUMAN_SELECT_OPPORTUNITY","HUMAN_APPROVE_OFFER","HUMAN_AUTHORIZE_CONTRACT","EXECUTE_WITH_MEASURED_EVIDENCE","RECONCILE_REALIZED_VALUE","CAPTURE_REUSABLE_ASSET","REASSESS_PRODUCTIZATION"],
  authority:{acorn:"PROPOSE_AND_MEASURE",human:"AUTHORIZE_AND_DECIDE"},policy:INFINITE_ECONOMIC_POLICY
 });
}

export function economicEngineSnapshot(input={}) {
 const c=runInfiniteEconomicCycle(input);
 return {version:INFINITE_ECONOMIC_ENGINE_VERSION,state:c.state,measured_at:c.measured_at,
  opportunity_count:c.stages.opportunities.length,model_count:c.stages.business_models.length,
  productization_count:c.stages.productization.length,portfolio:c.stages.portfolio,policy:INFINITE_ECONOMIC_POLICY};
}

if(import.meta.url===`file://${process.argv[1]}`)console.log(JSON.stringify(economicEngineSnapshot(),null,2));
