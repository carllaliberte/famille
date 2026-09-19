/** ACORN — UNIVERSAL CAPABILITY MESH
 * Contract: acorn.universal-capability-mesh.v1
 * Capability is the portable unit of cognition: discoverable, qualified, routable,
 * measurable, expirable and composable. Identity, capability and authority remain distinct.
 */
export const CONTRACT="acorn.universal-capability-mesh.v1";
export const STATES=Object.freeze(["DECLARED","DISCOVERED","QUALIFIED","ROUTABLE","DEGRADED","EXPIRED","REVOKED","BLOCKED"]);
export const CYCLE=Object.freeze(["DECLARE","DISCOVER","NORMALIZE","QUALIFY","MEASURE","ROUTE","COMPOSE","EXECUTE_THROUGH_GOVERNANCE","OBSERVE","VERIFY","LEARN","EXPIRE_OR_REVOKE","REDISCOVER"]);

const A=v=>Array.isArray(v)?v:[];
const s=v=>String(v??"").trim();
const finite=v=>Number.isFinite(Number(v))?Number(v):null;

export function declareCapability({id,kind="UNKNOWN",name=null,provider=null,version="1",inputs=[],outputs=[],constraints=[],evidence=[],authority=false}={}){
  return {contract:CONTRACT,id:s(id)||null,kind:s(kind)||"UNKNOWN",name:name??id??null,provider:provider??null,version:s(version)||"1",inputs:A(inputs),outputs:A(outputs),constraints:A(constraints),evidence:A(evidence),state:"DECLARED",authority:false,declared_authority:authority===true,live:false};
}
export function qualifyCapability(capability,{verified=false,measured=false,evidence=[]}={}){
  const ev=[...A(capability?.evidence),...A(evidence)];
  const qualified=verified===true&&measured===true&&ev.length>0;
  return {...capability,evidence:ev,state:qualified?"QUALIFIED":"DISCOVERED",qualified,measured,verified,authority:false,live:false};
}
export function scoreCapability(capability,{context={},outcomes=[]}={}){
  const rows=A(outcomes).filter(x=>x?.measured===true&&x?.verified===true&&x?.capability_id===capability?.id);
  const reliability=rows.length?rows.filter(x=>x.success===true).length/rows.length:null;
  const cost=rows.map(x=>finite(x.cost)).filter(x=>x!==null);
  const latency=rows.map(x=>finite(x.latency)).filter(x=>x!==null);
  return {capability_id:capability?.id??null,context,observed_outcomes:rows.length,reliability,cost:cost.length?cost.reduce((a,b)=>a+b,0)/cost.length:null,latency:latency.length?latency.reduce((a,b)=>a+b,0)/latency.length:null,evidence_bound:true,optimization:"BEST_KNOWN_IN_SCOPE",authority:false};
}
export function routeCapabilities({capabilities=[],required=[],context={},outcomes=[]}={}){
  const need=new Set(A(required).map(s));
  return A(capabilities).filter(c=>c?.state==="QUALIFIED"&&c?.live!==false&&(!need.size||need.has(s(c.id))||need.has(s(c.name)))).map(c=>({...c,score:scoreCapability(c,{context,outcomes}),routeable:true})).sort((a,b)=>(b.score.reliability??-1)-(a.score.reliability??-1)||s(a.id).localeCompare(s(b.id)));
}
export function composeCapabilities({capabilities=[],requirements=[],context={}}={}){
  const routes=routeCapabilities({capabilities,required:requirements,context});
  return {contract:CONTRACT,requirements:A(requirements),context,candidates:routes,composition:routes.length?routes.map(x=>x.id):[],state:routes.length?"COMPOSITION_CANDIDATE":"NO_CAPABILITY",requires_governance:true,authority:false,external_effect:false,auto_execute:false};
}
export function learnCapability({capability,outcome}={}){
  const valid=outcome?.measured===true&&outcome?.verified===true&&outcome?.capability_id===capability?.id;
  return {...capability,learning:valid?{state:"LEARNED",outcome_id:outcome.id??null}:{state:"HOLD_FOR_EVIDENCE"},authority:false};
}
export function expireCapability(capability,{expired=false,revoked=false,reason=null}={}){
  return {...capability,state:revoked?"REVOKED":expired?"EXPIRED":capability?.state??"DECLARED",expiry_reason:reason,authority:false};
}
export function buildCapabilityMesh({capabilities=[],context={},outcomes=[],requirements=[]}={}){
  const qualified=A(capabilities).map(c=>c?.state==="QUALIFIED"?c:qualifyCapability(c,{verified:c?.verified===true,measured:c?.measured===true}));
  const routes=routeCapabilities({capabilities:qualified,required:requirements,context,outcomes});
  return {contract:CONTRACT,cycle:CYCLE,capabilities:qualified,routes,composition:composeCapabilities({capabilities:qualified,requirements,context}),counts:{declared:qualified.length,qualified:qualified.filter(x=>x.state==="QUALIFIED").length,routable:routes.length},authority:false,external_effect:false,auto_authorize:false,auto_execute:false,live:false};
}
export function assertCapabilityMeshConstitution(snapshot={}){
  const violations=[];
  if(snapshot.authority===true) violations.push("CAPABILITY_AUTHORITY_FORBIDDEN");
  if(snapshot.auto_authorize===true) violations.push("AUTO_AUTHORIZATION");
  if(snapshot.auto_execute===true) violations.push("AUTO_EXECUTION");
  if(snapshot.external_effect===true) violations.push("EXTERNAL_EFFECT");
  if(snapshot.breaker_bypass===true) violations.push("BREAKER_BYPASS");
  if(snapshot.hidden_learning===true) violations.push("HIDDEN_LEARNING");
  if(snapshot.unverified_live===true) violations.push("UNVERIFIED_LIVE");
  return {contract:CONTRACT,valid:violations.length===0,violations,capability_ne_authority:true,existing_governance_only:true};
}
