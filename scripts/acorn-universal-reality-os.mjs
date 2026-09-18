/**
 * ACORN — Universal Reality Operating System
 * Contract: acorn.universal-reality-os.v1
 * Convergence fabric over the existing project/value/quality/connection/evolution systems.
 */
export const CONTRACT="acorn.universal-reality-os.v1";
export const LOOP=Object.freeze(["INTENT","OBSERVE","DISCOVER","COMPARE","COMPOSE","SIMULATE","QUALIFY","OFFER","ORDER","AUTHORIZE","EXECUTE","VERIFY","DELIVER","MEASURE","BENCHMARK","LEARN","REGISTER","REUSE","RECOMPOSE","OBSERVE"]);
export const BOUNDARIES=Object.freeze({
  CAPABILITY_AUTHORITY:"CAPABILITY != AUTHORITY",
  LEARNING_AUTHORITY:"LEARNING != AUTHORITY",
  PAYMENT_EXECUTION:"PAYMENT != EXECUTION",
  EXECUTION_VALUE:"EXECUTION != VALUE",
  SIMULATION_EXECUTION:"SIMULATED != EXECUTED",
  BUILD_MERGE:"BUILD != MERGE",
  BEST_KNOWN:"BEST_KNOWN_IN_SCOPE != GLOBAL_OPTIMUM"
});
const arr=v=>Array.isArray(v)?v:[];
const finite=v=>Number.isFinite(v);
const now=()=>new Date().toISOString();
const terminal=new Set(["MONEY","REFUND","PAYOUT","PRICE_CHANGE","CONTRACT","SIGN","DELETE","PUBLISH","WRITE_PROTECTED","MERGE"]);

export function createRealityIntent(input={}){
 return {id:input.id??`intent:${crypto.randomUUID()}`,objective:input.objective??null,requirements:arr(input.requirements),constraints:arr(input.constraints),budget:input.budget??null,deadline:input.deadline??null,jurisdiction:input.jurisdiction??null,success:arr(input.success),authority:"HUMAN_REQUIRED",created_at:input.created_at??now()};
}
export function compileReality(intent={},catalog={}){
 if(typeof intent.objective!=="string"||!intent.objective.trim())return{state:"BLOCKED",reason:"MISSING_OBJECTIVE"};
 const needs=[{kind:"OBJECTIVE",value:intent.objective},...arr(intent.requirements).map(value=>({kind:"REQUIREMENT",value})),...arr(intent.constraints).map(value=>({kind:"CONSTRAINT",value}))];
 const candidates=arr(catalog.capabilities).filter(c=>c&&c.available!==false&&c.verified===true&&arr(c.evidence).length>0);
 const tasks=needs.filter(n=>n.kind!=="CONSTRAINT").map((n,i)=>({id:`task:${i}`,need:n,state:"DISCOVERED"}));
 return {contract:CONTRACT,state:"COMPILED",intent,needs,tasks,candidates,selected:[],composition:[],authority:"HUMAN_REQUIRED"};
}
export function composeCapabilities(capabilities=[]){
 const usable=arr(capabilities).filter(c=>c&&c.verified===true&&arr(c.evidence).length>0);
 const composition=usable.map((c,i)=>({step:i,capability_id:c.id,depends_on:arr(c.depends_on),rights:c.rights??null}));
 return {state:composition.length?"COMPOSABLE":"NO_VERIFIED_CAPABILITIES",composition};
}
export function qualifyOutcome(outcome={}){
 const evidence=arr(outcome.evidence);
 const measured=outcome.measured===true;
 const verified=outcome.verified===true;
 return {state:measured&&verified&&evidence.length?"VERIFIED_OUTCOME":"NOT_VERIFIED",measured,verified,evidence_count:evidence.length,value_measured:finite(outcome.value),cost_measured:finite(outcome.cost)};
}
export function benchmarkOutcome(candidate={},peers=[]){
 if(candidate.verified!==true||candidate.measured!==true||!candidate.scope)return{state:"NOT_MEASURED"};
 const comparable=[candidate,...arr(peers)].filter(x=>x&&x.scope===candidate.scope&&x.verified===true&&x.measured===true&&finite(x.quality)&&finite(x.cost)&&finite(x.latency));
 const dominated=comparable.some(x=>x.id!==candidate.id&&x.quality>=candidate.quality&&x.cost<=candidate.cost&&x.latency<=candidate.latency&&(x.quality>candidate.quality||x.cost<candidate.cost||x.latency<candidate.latency));
 return {state:"COMPARABLE",scope:candidate.scope,compared_count:comparable.length,best_known_in_scope:!dominated};
}
export function authorize(effect,context={}){
 const e=String(effect??"UNKNOWN").toUpperCase();
 if(terminal.has(e))return{state:"WAITING_HUMAN",authorized:false,reason:"HUMAN_AUTHORITY_REQUIRED"};
 if(e==="UNKNOWN")return{state:"BLOCKED",authorized:false,reason:"UNKNOWN_EFFECT_LOCKED"};
 if(context.human_authorized===true&&context.server_authorized===true)return{state:"AUTHORIZED",authorized:true};
 return{state:"WAITING_HUMAN",authorized:false,reason:"EXPLICIT_AUTHORIZATION_REQUIRED"};
}
export function economicState(x={}){
 if(!finite(x.revenue)||!finite(x.cost))return{state:"NOT_MEASURED"};
 const margin=x.revenue-x.cost;
 return{state:"MEASURED",revenue:x.revenue,cost:x.cost,margin,margin_rate:x.revenue?margin/x.revenue:null,authority:"HUMAN_REQUIRED"};
}
export function learnFromReality(outcome={}){
 const q=qualifyOutcome(outcome);
 if(q.state!=="VERIFIED_OUTCOME")return{state:"NOT_REGISTERED",reason:"VERIFIED_OUTCOME_REQUIRED"};
 return{state:"CAPABILITY_CANDIDATE",capability:{id:outcome.capability_id??`capability:${crypto.randomUUID()}`,source:outcome.project_id??null,evidence:arr(outcome.evidence),measurements:{quality:outcome.quality,cost:outcome.cost,latency:outcome.latency,value:outcome.value},valid_until:outcome.valid_until??null,reusable:outcome.reusable!==false}};
}
export function createOpportunity(capability={},demand={}){
 if(capability.verified!==true||demand.verified!==true)return{state:"EXPLORATORY",verified:false};
 return{state:"EVIDENCE_BACKED",verified:true,capability_id:capability.id,demand_id:demand.id,authority:"HUMAN_REQUIRED"};
}
export function closeLoop({intent,outcome,peers=[]}={}){
 const q=qualifyOutcome(outcome);
 const learned=learnFromReality(outcome);
 const benchmark=benchmarkOutcome(outcome,peers);
 return{contract:CONTRACT,timestamp:now(),loop:LOOP,state:q.state==="VERIFIED_OUTCOME"?"LOOP_CLOSED":"LOOP_OPEN",intent_id:intent?.id??null,qualification:q,benchmark,learning:learned};
}
export function assertConstitution(){
 for(const value of Object.values(BOUNDARIES))if(!value)throw new Error("CONSTITUTION_BROKEN");
 return true;
}
