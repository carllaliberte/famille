/**
 * ACORN — Continuous Evolution Reality Fabric
 * Contract: acorn.continuous-evolution-reality-fabric.v1
 * One conductor over existing fabrics; it proposes work, never grants authority.
 */
export const CONTRACT="acorn.continuous-evolution-reality-fabric.v1";
export const SURFACES=Object.freeze(["CUSTOMER","PRODUCT","MARKET","CAPABILITY","INTELLIGENCE","CONNECTOR","PROJECT","CODE","ARCHITECTURE","QUALITY","SECURITY","PERFORMANCE","ECONOMICS","RESOURCE","EVIDENCE","KNOWLEDGE","OPPORTUNITY","REAL_WORLD","UNKNOWN"]);
export const PHASES=Object.freeze(["OBSERVE","AUDIT","CLASSIFY","DETECT_GAP","DISCOVER","COMPARE","COMPOSE","SIMULATE","PROPOSE","BUILD","TEST","FALSIFY","MEASURE","VERIFY","REGISTER","REUSE","RECOMPOSE","REOBSERVE"]);
const arr=v=>Array.isArray(v)?v:[];
const states=new Set(["UNKNOWN","NOT_MEASURED","OBSERVED","MEASURED","VERIFIED","EXPIRED","BLOCKED","WAITING_HUMAN"]);
const actionable=new Set(["MISSING_CAPABILITY","MISSING_EVIDENCE","REGRESSION","QUALITY_DRIFT","SECURITY_BOUNDARY","BROKEN_WORKFLOW","FAILING_CHECK","STALE_PR","DIVERGENT_PR","OPPORTUNITY","PERFORMANCE_DRIFT","ECONOMIC_GAP"]);
const terminal=new Set(["MONEY","REFUND","PAYOUT","PRICE_CHANGE","CONTRACT","SIGN","DELETE","PUBLISH","WRITE_PROTECTED","MERGE"]);
export function observeWorld(snapshot={}){
 const observations=[];
 for(const surface of SURFACES){
  const item=snapshot[surface]??snapshot[surface.toLowerCase()];
  observations.push({surface,state:item?.state??"UNKNOWN",evidence:arr(item?.evidence),observed_at:item?.observed_at??null});
 }
 return {contract:CONTRACT,observed_at:new Date().toISOString(),observations};
}
export function detectGaps(observations=[]){
 return arr(observations).map(o=>{
  if(o.state==="VERIFIED"||o.state==="MEASURED"||o.state==="OBSERVED")return null;
  return {kind:o.state==="UNKNOWN"?"UNKNOWN":"MISSING_EVIDENCE",surface:o.surface,state:o.state,action:o.state==="UNKNOWN"?"RESEARCH":"MEASURE"};
 }).filter(Boolean);
}
export function classifyFindings(findings=[]){
 return arr(findings).map(f=>({...f,actionable:actionable.has(f.kind),human_gate:["SECURITY_BOUNDARY","WAITING_HUMAN"].includes(f.kind)}));
}
export function compareCandidates(candidates=[]){
 return arr(candidates).filter(c=>c&&c.verified===true&&arr(c.evidence).length>0).sort((a,b)=>(b.score??-Infinity)-(a.score??-Infinity));
}
export function composePlan(gaps=[],candidates=[]){
 const selected=compareCandidates(candidates);
 return {state:selected.length?"COMPOSED":"RESEARCH_REQUIRED",gaps:arr(gaps),selected:selected.slice(0,10),phases:PHASES};
}
export function authorizeEvolution(effect,context={}){
 const e=String(effect??"UNKNOWN").toUpperCase();
 if(terminal.has(e))return{authorized:false,state:"WAITING_HUMAN",reason:"HUMAN_AUTHORITY_REQUIRED"};
 if(e==="UNKNOWN")return{authorized:false,state:"BLOCKED",reason:"UNKNOWN_EFFECT_LOCKED"};
 if(context.human_authorized===true&&context.server_authorized===true)return{authorized:true,state:"AUTHORIZED"};
 return{authorized:false,state:"WAITING_HUMAN",reason:"EXPLICIT_AUTHORIZATION_REQUIRED"};
}
export function buildPortfolio(snapshot={},candidates=[]){
 const world=observeWorld(snapshot);
 const gaps=detectGaps(world.observations);
 const classified=classifyFindings(gaps);
 const plan=composePlan(classified,candidates);
 return {contract:CONTRACT,state:"PROPOSED",world,gaps:classified,plan,authority:"HUMAN_REQUIRED",auto_merge:false,auto_spend:false,auto_contract:false};
}
export function closeEvolution(outcome={}){
 const measured=outcome.measured===true, verified=outcome.verified===true, evidence=arr(outcome.evidence);
 if(!measured||!verified||!evidence.length)return{state:"OPEN",reason:"VERIFIED_MEASURED_EVIDENCE_REQUIRED"};
 return {state:"REGISTERABLE",capability_candidate:{id:outcome.capability_id??`capability:${crypto.randomUUID()}`,evidence,measurements:outcome.measurements??{},valid_until:outcome.valid_until??null,reusable:outcome.reusable!==false}};
}
export function assertEvolutionConstitution(){
 if(PHASES[0]!=="OBSERVE"||PHASES.at(-1)!=="REOBSERVE")throw new Error("EVOLUTION_LOOP_BROKEN");
 return true;
}
