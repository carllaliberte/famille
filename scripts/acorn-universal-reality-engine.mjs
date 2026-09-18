export const CONTRACT="acorn.universal-reality-engine.v1";
export const HARD_BOUNDARIES=Object.freeze({
  capability_authority:"CAPABILITY != AUTHORITY",
  learning_authority:"LEARNING != AUTHORITY",
  build_merge:"BUILD != MERGE",
  payment_execution_value:"PAYMENT != EXECUTION != VALUE",
  simulated_executed:"SIMULATED != EXECUTED"
});
const TERMINAL=new Set(["MONEY","REFUND","PAYOUT","PRICE_CHANGE","CONTRACT","SIGN","DELETE","PUBLISH","WRITE_PROTECTED","MERGE"]);
const finite=v=>Number.isFinite(v), arr=v=>Array.isArray(v)?v:[], text=v=>typeof v==="string"&&v.trim().length>0;
const now=()=>new Date().toISOString();

export function createIntent(input={}){
 return {id:input.id??`intent:${crypto.randomUUID()}`,objective:input.objective??null,requirements:arr(input.requirements),constraints:arr(input.constraints),budget:input.budget??null,deadline:input.deadline??null,jurisdiction:input.jurisdiction??null,quality:input.quality??null,authority:"HUMAN_REQUIRED",state:"DEFINED",created_at:input.created_at??now()};
}
export function compileIntentToRealityPlan(intent,context={}){
 if(!intent||!text(intent.objective)) return {ok:false,state:"BLOCKED",reason:"MISSING_OBJECTIVE",plan:null};
 const needs=[{id:`need:${intent.id}:objective`,kind:"OBJECTIVE",value:intent.objective},...arr(intent.requirements).map((value,i)=>({id:`need:${intent.id}:requirement:${i}`,kind:"REQUIREMENT",value})),...arr(intent.constraints).map((value,i)=>({id:`need:${intent.id}:constraint:${i}`,kind:"CONSTRAINT",value}))];
 const tasks=needs.filter(n=>n.kind!=="CONSTRAINT").map((n,i)=>({id:`task:${intent.id}:${i}`,need_id:n.id,state:"DISCOVERED"}));
 return {ok:true,contract:CONTRACT,state:"DEFINED",intent,context,needs,tasks,capabilities:[],composition:[],execution:[],evidence:[],measurements:[]};
}
export function registerCapabilityOutcome(outcome={}){
 const evidence=arr(outcome.evidence);
 if(outcome.measured!==true||outcome.verified!==true||evidence.length===0)return{registered:false,state:"NOT_MEASURED",reason:"MEASURED_VERIFIED_EVIDENCE_REQUIRED"};
 return {registered:true,state:"REGISTERED",capability:{id:outcome.capability_id??`capability:${crypto.randomUUID()}`,source_project:outcome.project_id??null,provenance:outcome.provenance??null,evidence,measurements:outcome.measurements??{},valid_until:outcome.valid_until??null,reusable:outcome.reusable!==false,registered_at:now()}};
}
export function benchmarkOutcome(candidate={},peers=[]){
 if(!candidate?.scope||candidate.verified!==true||candidate.measured!==true)return{state:"NOT_MEASURED",comparable:false,candidate:null};
 const comparable=[candidate,...arr(peers)].filter(x=>x&&x.scope===candidate.scope&&x.verified===true&&x.measured===true&&finite(x.quality)&&finite(x.cost)&&finite(x.latency));
 const better=comparable.filter(x=>x.id!==candidate.id&&(x.quality>=candidate.quality&&x.cost<=candidate.cost&&x.latency<=candidate.latency)&&(x.quality>candidate.quality||x.cost<candidate.cost||x.latency<candidate.latency));
 return {state:"COMPARABLE",comparable:comparable.length>0,candidate_id:candidate.id??null,best_known_in_scope:better.length===0,compared_count:comparable.length};
}
export function chooseRoute(routes=[],objective={}){
 const valid=arr(routes).filter(r=>r&&r.available!==false&&r.authorized!==false&&r.evidence===true&&finite(r.quality)&&finite(r.cost)&&finite(r.latency)&&finite(r.reliability));
 if(!valid.length)return{state:"NO_VERIFIED_ROUTE",route:null,candidates:0};
 const w={quality:objective.quality_weight??.4,reliability:objective.reliability_weight??.25,cost:objective.cost_weight??.15,latency:objective.latency_weight??.1,evidence:objective.evidence_weight??.1};
 const score=r=>w.quality*r.quality+w.reliability*r.reliability+w.cost/(1+Math.max(0,r.cost))+w.latency/(1+Math.max(0,r.latency))+w.evidence*(r.evidence_score??0);
 const ranked=valid.map(r=>({...r,route_score:score(r)})).sort((a,b)=>b.route_score-a.route_score);
 return {state:"BEST_KNOWN_IN_SCOPE",route:ranked[0],candidates:ranked.length,ranked};
}
export function authorizeAction(action={}){
 if(!text(action.kind))return{authorized:false,state:"BLOCKED",reason:"MISSING_ACTION"};
 if(TERMINAL.has(action.kind))return{authorized:false,state:"WAITING_HUMAN",reason:"HUMAN_AUTHORITY_REQUIRED",kind:action.kind};
 if(action.human_authorized===true&&action.server_authorized===true)return{authorized:true,state:"AUTHORIZED",kind:action.kind};
 return{authorized:false,state:"WAITING_HUMAN",reason:"EXPLICIT_AUTHORIZATION_REQUIRED",kind:action.kind};
}
export function closeRealityLoop(input={}){
 const outcome=input.outcome??null; const registration=outcome?registerCapabilityOutcome(outcome):{registered:false,state:"NOT_MEASURED"};
 return {contract:CONTRACT,timestamp:now(),state:registration.registered?"VALUE_LOOP_CLOSED":"VALUE_LOOP_OPEN",intent_id:input.intent?.id??null,outcome_id:outcome?.id??null,capability:registration.capability??null,truth:{execution:outcome?.executed===true?"EXECUTED":"NOT_EXECUTED",measurement:outcome?.measured===true?"MEASURED":"NOT_MEASURED",verification:outcome?.verified===true?"VERIFIED":"NOT_VERIFIED"}};
}
export function assertRealityContract(){
 for(const [k,v] of Object.entries(HARD_BOUNDARIES))if(!v)throw new Error(`BOUNDARY_BROKEN:${k}`);
 return true;
}