/** ACORN — COGNITIVE METABOLISM & RESOURCE FABRIC
 * Resource-aware allocation across cognition without granting authority.
 */
import crypto from "node:crypto";
export const CONTRACT="acorn.cognitive-metabolism-resource-fabric.v1";
export const RESOURCE_TYPES=Object.freeze(["TOKEN","COMPUTE","TIME","ENERGY","MEMORY","BANDWIDTH","MONEY","CAPACITY","UNKNOWN"]);
export const STATES=Object.freeze(["AVAILABLE","RESERVED","CONSUMED","EXHAUSTED","EXPIRED","BLOCKED"]);
const A=v=>Array.isArray(v)?v:[]; const num=v=>Number.isFinite(Number(v))?Number(v):null;
const id=p=>`${p}_${crypto.randomUUID()}`;
export function createResource({id:rid,type,amount=0,unit="unit",cost=0,expires_at=null,evidence=[]}={}){
 if(!rid) throw new Error("RESOURCE_ID_REQUIRED");
 if(!RESOURCE_TYPES.includes(type)) throw new Error("RESOURCE_TYPE_UNSUPPORTED");
 return Object.freeze({id:String(rid),type,amount:num(amount)??0,unit:String(unit),cost:num(cost)??0,expires_at,evidence:A(evidence),state:"AVAILABLE",authority:false,created_at:new Date().toISOString()});
}
export function measureResource(resource,{consumed=0,observed_at=new Date().toISOString(),verified=false}={}){
 const available=Math.max(0,(num(resource?.amount)??0)-(num(consumed)??0));
 return {...resource,remaining:available,measurement:{consumed:num(consumed)??0,observed_at,verified:verified===true,measured:true},authority:false};
}
export function createBudget({id:bid,limits={},purpose=null,expires_at=null,evidence=[]}={}){
 if(!bid) throw new Error("BUDGET_ID_REQUIRED");
 return {id:String(bid),limits:{...limits},purpose,expires_at,evidence:A(evidence),state:"AVAILABLE",authority:false,auto_spend:false,auto_authorize:false,created_at:new Date().toISOString()};
}
export function assessCapacity({resources=[],budget=null,request={}}={}){
 const gaps=[];
 for(const [type,needRaw] of Object.entries(request||{})){
   const need=num(needRaw)??0;
   const r=A(resources).find(x=>x.type===type&&["AVAILABLE","RESERVED"].includes(x.state));
   const available=num(r?.remaining)??num(r?.amount)??0;
   const budgetLimit=num(budget?.limits?.[type]);
   const bounded=budgetLimit===null?available:Math.min(available,budgetLimit);
   if(bounded<need) gaps.push({type,need,available:bounded,deficit:need-bounded});
 }
 return {contract:CONTRACT,feasible:gaps.length===0,gaps,authority:false,auto_spend:false,auto_authorize:false};
}
export function rankResourcePlan({plans=[],weights={cost:.25,latency:.2,reliability:.25,capacity:.2,evidence:.1}}={}){
 const score=p=>{
  const n=(v,d=.5)=>num(v)===null?d:Math.max(0,Math.min(1,num(v)));
  return weights.cost*(1/(1+Math.max(0,num(p.cost)??0)))+
    weights.latency*(1/(1+Math.max(0,(num(p.latency_ms)??1000)/1000)))+
    weights.reliability*n(p.reliability)+weights.capacity*n(p.capacity)+weights.evidence*(A(p.evidence).length?1:0);
 };
 return {contract:CONTRACT,plans:A(plans).map(p=>({...p,score:score(p)})).sort((a,b)=>b.score-a.score),authority:false};
}
export function learnResourceEfficiency({baseline={},outcome={}}={}){
 const valid=outcome.measured===true&&outcome.verified===true&&outcome.valid!==false;
 if(!valid) return {state:"NO_LEARNING",authority:false,requires_measured_verified:true};
 const before=num(baseline.cost)??0, after=num(outcome.cost)??before;
 const efficiency=before>0?Math.max(0,Math.min(1,(before-after)/before)):0;
 return {state:"LEARNED",efficiency_gain:efficiency,before_cost:before,after_cost:after,authority:false};
}
export function optimizeResourceAllocation({resources=[],requests=[],outcomes=[]}={}){
 const allocations=A(requests).map(req=>({...req,capacity:assessCapacity({resources,request:req.requirements}).feasible}));
 const measured=A(outcomes).filter(o=>o.measured===true&&o.verified===true);
 return {contract:CONTRACT,allocations,measured_outcomes:measured.length,optimization:"CANDIDATE",learning_requires_measured_verified:true,authority:false,external_effect:false};
}
export function buildMetabolismSnapshot({resources=[],budgets=[],allocations=[],at=new Date().toISOString()}={}){
 return {contract:CONTRACT,captured_at:at,resources:A(resources),budgets:A(budgets),allocations:A(allocations),authority:false,external_effect:false};
}
export function assertMetabolismConstitution(snapshot={}){
 if(snapshot.authority===true) throw new Error("METABOLISM_CANNOT_GRANT_AUTHORITY");
 if(snapshot.auto_authorize===true) throw new Error("METABOLISM_CANNOT_AUTHORIZE");
 if(snapshot.auto_spend===true) throw new Error("METABOLISM_CANNOT_SPEND");
 if(snapshot.external_effect===true) throw new Error("METABOLISM_CANNOT_EXECUTE");
 if(snapshot.hidden_learning===true) throw new Error("METABOLISM_LEARNING_MUST_BE_EXPLICIT");
 return true;
}
