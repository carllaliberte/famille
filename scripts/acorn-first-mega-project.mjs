/**
 * ACORN — First Mega Project: Acorn for Acorn
 * Contract: acorn.self-project.engine.v1
 *
 * A reference customer project that exercises the existing Acorn fabrics
 * against Acorn itself. It does not create authority and does not claim
 * external execution that has not been measured.
 */
export const CONTRACT="acorn.self-project.engine.v1";
export const PROJECT_ID="ACORN-FOR-ACORN-001";
export const WORKSTREAMS=Object.freeze([
 "PRODUCT","INTAKE","CAPABILITY","INTELLIGENCE","CONNECTION","EXECUTION",
 "EVIDENCE","QUALITY","SECURITY","ECONOMICS","OPERATIONS","LEARNING","EVOLUTION","REAL_WORLD"
]);
export const PHASES=Object.freeze([
 "DEFINE","DISCOVER","ARCHITECT","COMPOSE","BUILD","TEST","FALSIFY","MEASURE",
 "VERIFY","DELIVER","OPERATE","BENCHMARK","OPTIMIZE","REUSE","RECOMPOSE","REOBSERVE"
]);
const a=v=>Array.isArray(v)?v:[];
const b=v=>v===true;
const states=new Set(["DEFINED","OBSERVED","MEASURED","VERIFIED","LIVE","UNKNOWN","BLOCKED","WAITING_HUMAN","NOT_MEASURED"]);
const dangerous=new Set(["MONEY","REFUND","PAYOUT","PRICE_CHANGE","CONTRACT","SIGN","DELETE","PUBLISH","WRITE_PROTECTED","MERGE"]);

export function createMegaProject(input={}){
 return {contract:CONTRACT,id:PROJECT_ID,name:"Acorn for Acorn — First Mega Project",
  customer:"Acorn",objective:String(input.objective??"Deliver Acorn itself as a complete reference system"),
  acceptance:a(input.acceptance),constraints:a(input.constraints),workstreams:WORKSTREAMS,
  phases:PHASES,state:"DEFINED",authority:"CARL",never_final:true,
  auto_merge:false,auto_spend:false,auto_contract:false};
}
export function observeProject(snapshot={}){
 return {project_id:PROJECT_ID,observed_at:snapshot.observed_at??new Date().toISOString(),
  surfaces:a(snapshot.surfaces).map(x=>({...x,state:states.has(x.state)?x.state:"UNKNOWN"})),
  evidence:a(snapshot.evidence),truth:"OBSERVED_NOT_LIVE"};
}
export function findGaps(project={},observation={}){
 const declared=new Set(a(project.acceptance));
 const evidence=a(observation.evidence);
 const gaps=declared.size&&!evidence.length?["ACCEPTANCE_EVIDENCE"]:[],
  unknown=a(observation.surfaces).filter(x=>x.state==="UNKNOWN").map(x=>x.id??x.name??"UNKNOWN");
 return [...gaps,...unknown.map(x=>`UNKNOWN:${x}`)];
}
export function buildPortfolio(project={},observation={}){
 const gaps=findGaps(project,observation);
 return {project_id:PROJECT_ID,state:gaps.length?"GAPS_IDENTIFIED":"CANDIDATE_COMPLETE",
  gaps,priority:gaps.length?"MEASURE_AND_REPAIR":"BENCHMARK_AND_OPTIMIZE",
  phases:PHASES,workstreams:WORKSTREAMS};
}
export function authorize(effect,ctx={}){
 const e=String(effect??"UNKNOWN").toUpperCase();
 if(dangerous.has(e))return{authorized:false,state:"WAITING_HUMAN",reason:"HUMAN_AUTHORITY_REQUIRED"};
 if(e==="UNKNOWN")return{authorized:false,state:"BLOCKED",reason:"UNKNOWN_EFFECT"};
 return ctx.server_authorized===true&&ctx.human_authorized===true
  ?{authorized:true,state:"AUTHORIZED"}:{authorized:false,state:"WAITING_HUMAN",reason:"EXPLICIT_AUTHORIZATION_REQUIRED"};
}
export function verifyAcceptance(results=[]){
 const r=a(results);
 const valid=r.length>0&&r.every(x=>b(x.verified)&&b(x.measured)&&a(x.evidence).length>0);
 return {state:valid?"VERIFIED":"NOT_VERIFIED",verified:valid,count:r.length,
  verified_count:r.filter(x=>b(x.verified)&&b(x.measured)).length};
}
export function benchmarkSelf(projectResults=[],criteria={}){
 const eligible=a(projectResults).filter(x=>b(x.verified)&&b(x.measured)&&x.expired!==true);
 const score=x=>Object.entries(criteria).reduce((s,[k,w])=>s+Number(x[k]??0)*Number(w??1),0);
 const ranked=eligible.map(x=>({...x,score:score(x)})).sort((x,y)=>y.score-x.score);
 return {state:ranked.length?"BENCHMARKED":"NOT_MEASURED",best_known:ranked[0]??null,
  candidates:ranked,global_optimum:false,scope:criteria};
}
export function deriveCapability(result={}){
 if(!b(result.verified)||!b(result.measured)||!a(result.evidence).length)
  return{state:"REJECTED",reason:"VERIFIED_MEASURED_EVIDENCE_REQUIRED"};
 return {state:"CAPABILITY_CANDIDATE",source:result.id??null,evidence:a(result.evidence),
  measurements:result.measurements??{},valid_until:result.valid_until??null,
  authority:"NONE",requires_reverification:true};
}
export function closeSelfLoop({project={},observation={},results=[],criteria={}}={}){
 const verification=verifyAcceptance(results);
 const benchmark=benchmarkSelf(results,criteria);
 const capability=verification.verified?deriveCapability(results[0]??{}):{state:"WAITING_FOR_PROOF"};
 return {contract:CONTRACT,project_id:PROJECT_ID,verification,benchmark,capability,
  next:benchmark.best_known?"OPTIMIZE_AND_REOBSERVE":"MEASURE_AND_BUILD",
  never_final:true};
}
export function assertSelfProjectConstitution(){
 if(!WORKSTREAMS.includes("REAL_WORLD")||!PHASES.includes("REOBSERVE"))throw new Error("SELF_PROJECT_INCOMPLETE");
 if(dangerous.has("MERGE")===false)throw new Error("AUTHORITY_BOUNDARY_BROKEN");
 return true;
}
