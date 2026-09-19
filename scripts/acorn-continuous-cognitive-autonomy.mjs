export const CONTRACT="acorn.continuous-cognitive-autonomy.v1";
export const CYCLE=Object.freeze(["PERCEIVE","ASSESS","PLAN","REQUEST_AUTHORIZATION","ACT_THROUGH_GOVERNANCE","OBSERVE","MEASURE","VERIFY","LEARN","REPLAN","REOBSERVE"]);
const A=v=>Array.isArray(v)?v:[]; const n=v=>Number.isFinite(Number(v))?Number(v):0;
export function buildAutonomyCycle({state={},options=[],outcomes=[],requirements=[]}={}){
 const verified=A(outcomes).filter(x=>x?.measured===true&&x?.verified===true);
 const candidates=A(options).filter(x=>x?.authority!==true&&x?.auto_execute!==true);
 const selected=candidates.slice().sort((a,b)=>n(b.score)-n(a.score)||String(a.id).localeCompare(String(b.id)))[0]??null;
 return {contract:CONTRACT,cycle:CYCLE,state:selected?"NEXT_GOVERNED_STEP":"MONITORING",state_snapshot:state,verified_outcomes:verified.length,requirements:A(requirements),candidates,selected,requires_human_authorization:true,authority:false,auto_authorize:false,auto_execute:false,external_effect:false,breaker_bypass:false};
}
export function requestAutonomyAction(cycle){return {state:cycle?.selected?"AUTHORIZATION_REQUEST_CANDIDATE":"MONITORING",request:cycle?.selected??null,requires_human_authorization:true,authority:false,auto_execute:false,external_effect:false};}
export function assertAutonomyConstitution(x={}){const violations=[];if(x.authority===true)violations.push("AUTONOMY_AUTHORITY");if(x.auto_authorize===true)violations.push("AUTO_AUTHORIZATION");if(x.auto_execute===true)violations.push("AUTO_EXECUTION");if(x.external_effect===true)violations.push("EXTERNAL_EFFECT");if(x.breaker_bypass===true)violations.push("BREAKER_BYPASS");return {contract:CONTRACT,valid:!violations.length,violations};}
