/**
 * ACORN — Universal Production Grade Program
 * Contract: acorn.universal-production-grade.v1
 *
 * One convergence contract for turning the current Acorn system into a
 * deliverable product: customer experience, real execution, evidence,
 * economics, operations, security and continuous optimization.
 */
export const CONTRACT="acorn.universal-production-grade.v1";
export const PLANES=Object.freeze(["CUSTOMER","PRODUCT","INTENT","CAPABILITY","INTELLIGENCE","CONNECTIVITY","EXECUTION","EVIDENCE","QUALITY","SECURITY","ECONOMICS","OPERATIONS","REAL_WORLD","EVOLUTION"]);
export const GATES=Object.freeze(["DISCOVERED","CONFIGURED","AUTHENTICATED","CONNECTED","EXECUTABLE","MEASURED","VERIFIED","DELIVERABLE","LIVE"]);
export const LOOP=Object.freeze(["INTENT","DISCOVER","DESIGN","COMPOSE","CONNECT","EXECUTE","OBSERVE","EVIDENCE","VERIFY","DELIVER","MEASURE_VALUE","BENCHMARK","OPTIMIZE","OPERATE","REUSE","RECOMPOSE","REOBSERVE"]);
const a=v=>Array.isArray(v)?v:[];
const b=v=>v===true;
const dangerous=new Set(["MONEY","REFUND","PAYOUT","PRICE_CHANGE","CONTRACT","SIGN","DELETE","PUBLISH","WRITE_PROTECTED","MERGE"]);
export function createProductionProgram(input={}){
 return {contract:CONTRACT,name:"Acorn Universal Production Grade",objective:String(input.objective??"Make Acorn genuinely deliverable end-to-end"),
  planes:PLANES,gates:GATES,loop:LOOP,requirements:a(input.requirements),constraints:a(input.constraints),
  authority:"CARL",never_final:true,auto_merge:false,auto_spend:false,auto_contract:false,state:"DEFINED"};
}
export function truthGate(item={}){
 const required=["evidence","measured","verified"];
 const ok=required.every(k=>b(item[k]))&&a(item.evidence).length>0;
 return {state:ok?"VERIFIED":"NOT_VERIFIED",verified:ok,live:ok&&item.live===true};
}
export function connectionGate(connection={}){
 const state=String(connection.state??"UNKNOWN").toUpperCase();
 return {state,deliverable:["EXECUTABLE","MEASURED","VERIFIED","LIVE"].includes(state),truth:state==="LIVE"?"LIVE_REQUIRES_EXTERNAL_EVIDENCE":"NOT_LIVE"};
}
export function customerGate(customer={}){
 return {state:customer.objective&&a(customer.acceptance).length?"DEFINED":"BLOCKED",
  objective:Boolean(customer.objective),acceptance:a(customer.acceptance)};
}
export function deliveryGate({customer={},connections=[],outcome={}}={}){
 const cg=customerGate(customer), verified=truthGate(outcome);
 const gaps=[...(cg.state==="BLOCKED"?["CUSTOMER_OBJECTIVE_OR_ACCEPTANCE"]:[]),
   ...a(connections).filter(c=>!connectionGate(c).deliverable).map(c=>`CONNECTION:${c.id??"UNKNOWN"}`),
   ...(verified.verified?[]:["VERIFIED_OUTCOME"])];
 return {state:gaps.length?"BLOCKED":"DELIVERABLE",gaps,customer:cg,connections:a(connections).map(connectionGate),outcome:verified};
}
export function authorize(effect,ctx={}){
 const e=String(effect??"UNKNOWN").toUpperCase();
 if(dangerous.has(e))return{authorized:false,state:"WAITING_HUMAN"};
 if(e==="UNKNOWN")return{authorized:false,state:"BLOCKED"};
 return ctx.human_authorized===true&&ctx.server_authorized===true?{authorized:true,state:"AUTHORIZED"}:{authorized:false,state:"WAITING_HUMAN"};
}
export function optimizePortfolio(candidates=[],weights={}){
 const eligible=a(candidates).filter(c=>b(c.verified)&&b(c.measured)&&c.expired!==true);
 const score=x=>Object.entries(weights).reduce((s,[k,w])=>s+Number(x[k]??0)*Number(w??1),0);
 const ranked=eligible.map(x=>({...x,score:score(x)})).sort((x,y)=>y.score-x.score);
 return {state:ranked.length?"BENCHMARKED":"NOT_MEASURED",best_known:ranked[0]??null,candidates:ranked,global_optimum:false};
}
export function buildProductionProgram(input={}){
 const p=createProductionProgram(input);
 return {...p,delivery:deliveryGate(input),authorization:authorize("EXECUTE",{}),
  optimization:optimizePortfolio(input.candidates??[],input.weights??{}),
  truth:"DEFINED != CODE_PRESENT != TESTED != EXECUTED != MEASURED != VERIFIED != LIVE"};
}
export function assertProductionConstitution(){
 if(PLANES.length!==14||LOOP[0]!=="INTENT"||LOOP.at(-1)!=="REOBSERVE")throw new Error("PRODUCTION_CONSTITUTION_BROKEN");
 if(!dangerous.has("MERGE"))throw new Error("AUTHORITY_BOUNDARY_BROKEN");
 return true;
}
