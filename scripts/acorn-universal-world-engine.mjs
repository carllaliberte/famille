/**
 * ACORN — Universal World Engine
 * Contract: acorn.universal-world-engine.v1
 *
 * One convergence fabric over the existing Acorn system.
 * It turns human intent into a measurable execution portfolio and turns
 * verified reality back into reusable capability, without creating authority.
 */
export const CONTRACT="acorn.universal-world-engine.v1";
export const LOOP=Object.freeze([
"INTENT","WORLD_OBSERVATION","DEMAND","CAPABILITY_DISCOVERY","BEST_KNOWN_COMPARISON",
"COMPOSITION","SIMULATION","QUALIFICATION","OFFER","ORDER","AUTHORIZATION",
"EXECUTION","OBSERVATION","EVIDENCE","VERIFICATION","VALIDATION","DELIVERY",
"VALUE_MEASUREMENT","BENCHMARK","LEARNING","CAPABILITY_REGISTRATION","REUSE",
"PRODUCTIZATION","OPPORTUNITY","RECOMPOSITION","REOBSERVE"
]);
export const DOMAINS=Object.freeze([
"CUSTOMER","ORGANIZATION","PROJECT","PRODUCT","MARKET","CAPABILITY","INTELLIGENCE",
"CONNECTOR","RESOURCE","DATA","TOOL","TASK","DEPENDENCY","RIGHT","AUTHORITY",
"CONTRACT","OFFER","ORDER","PAYMENT","EXECUTION","EVIDENCE","MEASUREMENT",
"OUTCOME","VALUE","KNOWLEDGE","ASSET","OPPORTUNITY","TIME","SECURITY","QUALITY",
"PERFORMANCE","ECONOMICS","REAL_WORLD","UNKNOWN"
]);
export const HARD_BOUNDARIES=Object.freeze([
"CAPABILITY != AUTHORITY","LEARNING != AUTHORITY","PAYMENT != EXECUTION",
"EXECUTION != VALUE","SIMULATED != EXECUTED","OBSERVED != VERIFIED",
"CODE_PRESENT != LIVE","BEST_KNOWN_IN_SCOPE != GLOBAL_OPTIMUM","BUILD != MERGE"
]);
const a=v=>Array.isArray(v)?v:[];
const upper=v=>String(v??"UNKNOWN").toUpperCase();
const verified=v=>v===true;
const consequential=new Set(["MONEY","REFUND","PAYOUT","PRICE_CHANGE","CONTRACT","SIGN","DELETE","PUBLISH","WRITE_PROTECTED","MERGE"]);
const truthStates=new Set(["UNKNOWN","NOT_MEASURED","OBSERVED","MEASURED","VERIFIED","EXPIRED","BLOCKED","WAITING_HUMAN"]);

export function createIntent(input={}){
 return {id:input.id??`intent:${crypto.randomUUID()}`,objective:String(input.objective??""),
  requirements:a(input.requirements),constraints:a(input.constraints),budget:input.budget??null,
  deadline:input.deadline??null,jurisdiction:input.jurisdiction??null,quality:input.quality??null,
  customer:input.customer??null,created_at:input.created_at??new Date().toISOString()};
}
export function compileIntent(intent={}){
 const objective=String(intent.objective??"").trim();
 if(!objective)return{state:"INVALID",reason:"OBJECTIVE_REQUIRED"};
 const tasks=a(intent.requirements).map((r,i)=>({id:`task:${i+1}`,requirement:r,state:"DISCOVER"}));
 return{state:"COMPILED",intent_id:intent.id??null,objective,tasks,constraints:a(intent.constraints),
   commercial:{budget:intent.budget??null,deadline:intent.deadline??null},quality:intent.quality??null};
}
export function normalizeObservation(o={}){
 const state=upper(o.state);
 return {domain:upper(o.domain),state:truthStates.has(state)?state:"UNKNOWN",
   observed_at:o.observed_at??null,evidence:a(o.evidence),source:o.source??null,valid_until:o.valid_until??null,
   verified:verified(o.verified),measured:verified(o.measured)};
}
export function discoverDemand(world=[]){
 return a(world).filter(o=>["NEED","MARKET","CUSTOMER","OPPORTUNITY"].includes(o.domain))
  .map(o=>({...o,demand_state:o.verified&&o.measured?"QUALIFIED":"EXPLORATORY"}));
}
export function discoverCapabilities(candidates=[]){
 return a(candidates).map(c=>({...c,verified:verified(c.verified),evidence:a(c.evidence),
   capability_state:verified(c.verified)&&a(c.evidence).length?"QUALIFIED":"UNVERIFIED"}));
}
export function compareCapabilities(candidates=[],criteria={}){
 const usable=discoverCapabilities(candidates).filter(c=>c.verified&&c.evidence.length);
 const weight=k=>Number(criteria[k]??1);
 return usable.sort((x,y)=>{
   const score=c=>weight("quality")*Number(c.quality??0)+weight("reliability")*Number(c.reliability??0)
    +weight("freshness")*Number(c.freshness??0)+weight("reusability")*Number(c.reusability??0)
    -weight("cost")*Number(c.cost??0);
   return score(y)-score(x);
 }).map((c,i)=>({...c,rank:i+1,selection_state:i===0?"BEST_KNOWN_IN_SCOPE":"COMPARABLE"}));
}
export function composeSolution(tasks=[],capabilities=[]){
 const ranked=compareCapabilities(capabilities);
 const missing=a(tasks).filter(t=>!ranked.some(c=>a(c.task_types).includes(t.requirement)||a(c.capabilities).includes(t.requirement)));
 return {state:missing.length?"GAP_REMAINS":"COMPOSED",tasks:a(tasks),selected:ranked,missing,
   best_known:"BEST_KNOWN_IN_SCOPE"};
}
export function simulate(plan={},constraints={}){
 return {state:"SIMULATED",executed:false,plan,constraints,
   predicted:{cost:plan.cost??null,duration:plan.duration??null,quality:plan.quality??null}};
}
export function qualify(plan={},evidence=[]){
 const ev=a(evidence);
 return {state:plan.state==="COMPOSED"&&ev.length?"QUALIFIED":"EXPLORATORY",evidence:ev,
   verified:false,executed:false};
}
export function authorize(effect,ctx={}){
 const e=upper(effect);
 if(consequential.has(e))return{authorized:false,state:"WAITING_HUMAN",reason:"HUMAN_AUTHORITY_REQUIRED"};
 if(e==="UNKNOWN")return{authorized:false,state:"BLOCKED",reason:"UNKNOWN_EFFECT_LOCKED"};
 if(ctx.server_authorized===true&&ctx.human_authorized===true)return{authorized:true,state:"AUTHORIZED"};
 return{authorized:false,state:"WAITING_HUMAN",reason:"EXPLICIT_AUTHORIZATION_REQUIRED"};
}
export function recordOutcome(outcome={}){
 return {state:"OBSERVED",executed:verified(outcome.executed),observed_at:outcome.observed_at??new Date().toISOString(),
  evidence:a(outcome.evidence),measurements:outcome.measurements??{},value:outcome.value??null,
  payment_observed:verified(outcome.payment_observed)};
}
export function verifyOutcome(outcome={}){
 const ok=verified(outcome.executed)&&verified(outcome.measured)&&verified(outcome.verified)&&a(outcome.evidence).length>0;
 return {...outcome,state:ok?"VERIFIED":"NOT_VERIFIED",verified:ok};
}
export function benchmark(outcomes=[],scope={}){
 const verifiedOutcomes=a(outcomes).filter(o=>o.verified===true&&o.measured===true);
 const sorted=verifiedOutcomes.slice().sort((x,y)=>Number(y.score??0)-Number(x.score??0));
 return {scope,state:sorted.length?"BENCHMARKED":"NOT_MEASURED",
   winner:sorted[0]??null,candidates:sorted,global_optimum_claim:false};
}
export function learnFromOutcome(outcome={}){
 if(outcome.verified!==true||outcome.measured!==true||!a(outcome.evidence).length)
  return{state:"REJECTED",reason:"VERIFIED_MEASURED_EVIDENCE_REQUIRED"};
 return {state:"CAPABILITY_CANDIDATE",source_outcome:outcome.id??null,evidence:a(outcome.evidence),
  measurements:outcome.measurements??{},valid_until:outcome.valid_until??null,
  authority:"NONE",requires_verification:true};
}
export function createOpportunity(capability={},demand={}){
 const qualified=capability.verified===true&&demand.verified===true;
 return {state:qualified?"QUALIFIED":"EXPLORATORY",capability_id:capability.id??null,demand_id:demand.id??null,
  verified:qualified,reason:qualified?"VERIFIED_MATCH":"VERIFIED_CAPABILITY_AND_DEMAND_REQUIRED"};
}
export function productize(asset={}){
 return asset.verified===true&&asset.reusable===true
  ?{state:"PRODUCT_CANDIDATE",source:asset.id??null,evidence:a(asset.evidence),rights:asset.rights??null}
  :{state:"NOT_READY",reason:"VERIFIED_REUSABLE_ASSET_REQUIRED"};
}
export function buildWorldPortfolio({intent={},world=[],capabilities=[],evidence=[],outcomes=[]}={}){
 const compiled=compileIntent(intent);
 const observations=a(world).map(normalizeObservation);
 const demand=discoverDemand(observations);
 const solution=compiled.state==="COMPILED"?composeSolution(compiled.tasks,capabilities):{state:"INVALID"};
 const simulation=simulate(solution,intent.constraints);
 const qualification=qualify(solution,evidence);
 const bench=benchmark(outcomes,{intent_id:intent.id??null});
 return {contract:CONTRACT,loop:LOOP,domains:DOMAINS,boundaries:HARD_BOUNDARIES,
  intent,compiled,observations,demand,solution,simulation,qualification,benchmark:bench,
  authority:"HUMAN_REQUIRED",auto_merge:false,auto_spend:false,auto_contract:false};
}
export function closeWorldCycle(outcome={}){
 const verifiedOutcome=verifyOutcome(outcome);
 if(verifiedOutcome.state!=="VERIFIED")return{state:"OPEN",verifiedOutcome};
 const capability=learnFromOutcome(verifiedOutcome);
 const opportunity=createOpportunity({...capability,id:`capability-from:${outcome.id??"outcome"}`,verified:true},
  {id:outcome.demand_id??null,verified:outcome.demand_verified===true});
 const product=productize({...capability,id:capability.source_outcome,reusable:outcome.reusable===true,verified:true});
 return {state:"CLOSED_AND_REUSABLE",verifiedOutcome,capability,opportunity,product,next:"REOBSERVE"};
}
export function assertWorldConstitution(){
 if(LOOP[0]!=="INTENT"||LOOP.at(-1)!=="REOBSERVE")throw new Error("WORLD_LOOP_BROKEN");
 if(HARD_BOUNDARIES.some(x=>!x.includes("!=")))throw new Error("BOUNDARY_BROKEN");
 return true;
}
