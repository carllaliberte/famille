/** ACORN — UNIVERSAL INTELLIGENCE FABRIC
 * Provider/model identity is data. Capability is discovered and measured.
 * No fixed allowlist, no authority transfer, no automatic external effect.
 *
 * Lifecycle: DISCOVERED → QUALIFIED → READY → SELECTABLE
 * Never automatically AUTHORIZED. CAPABILITY ≠ AUTHORITY.
 */
import crypto from "node:crypto";

const ISO=()=>new Date().toISOString();
const uid=p=>`${p}_${crypto.randomUUID()}`;

export const INTELLIGENCE_STATES=Object.freeze(["DISCOVERED","QUALIFIED","MEASURED","READY","SELECTABLE","DEGRADED","BLOCKED"]);
export function createIntelligence({
  id,provider,model,capabilities=[],endpoint=null,metadata={},
  channel=null,availability="UNKNOWN",cost=null,constraints=[],provenance="acorn",version="0"
}={}){
 if(!id||!provider||!model) throw new Error("INTELLIGENCE_ID_PROVIDER_MODEL_REQUIRED");
 return {
   id,identity:id,provider,model,endpoint,channel,
   availability,cost,constraints:[...constraints],provenance,version,
   capabilities:[...new Set(capabilities)],metadata,
   state:"DISCOVERED",authority:false,credentials_present:false,secret_custody:false,
   discovered_at:ISO(),measured_at:null,evidence:[]
 };
}
export function measureIntelligence(intelligence,{reachable=false,capabilities=[],latency_ms=null,quality=null}={}){
 const merged=[...new Set([...(intelligence.capabilities||[]),...capabilities])];
 const evidence={reachable,latency_ms,quality,measured_at:ISO()};
 const state=reachable?"READY":"DEGRADED";
 return {...intelligence,capabilities:merged,state,authority:false,measured_at:evidence.measured_at,evidence:[...(intelligence.evidence||[]),evidence]};
}
export function routeIntelligence(task,{intelligences=[],connections=[]}={}) {
  // Provider-neutral routing: provider/model names are never scoring dimensions.
  // Selection is based only on declared task compatibility and measured state.
 const required=new Set(task?.required_capabilities||[]);
 const rank=x=>{
   const matches=[...required].filter(c=>(x.capabilities||[]).includes(c)).length;
   const stateBonus={SELECTABLE:3,READY:2,QUALIFIED:1,DISCOVERED:0}[x.state]??0;
   const measured=(x.measured_at?1:0);
   return matches*100+stateBonus*10+measured;
 };
 const selectable=(i)=>i.state==="READY"||i.state==="DISCOVERED"||i.state==="QUALIFIED"||i.state==="SELECTABLE";
 return [
   ...intelligences.filter(selectable).map(i=>({kind:"intelligence",id:i.id,provider:i.provider,model:i.model,score:rank(i),authority:false})),
   ...connections.filter(c=>c.state==="READY"||c.state==="DISCOVERED"||c.state==="CONFIGURED").map(c=>({kind:"connection",id:c.id,provider:c.provider,score:rank(c),authority:false}))
 ].sort((a,b)=>b.score-a.score);
}
export function createInvocation(task,intelligence,{human_authorized=false}={}) {
  // Authorization is an execution gate, never a provider privilege.
 if(!intelligence?.id) throw new Error("INTELLIGENCE_REQUIRED");
 return {id:uid("inv"),task_id:task?.id||null,intelligence_id:intelligence.id,state:human_authorized?"AUTHORIZED":"BLOCKED",
   authority:false,human_authorized:Boolean(human_authorized),external_effect:false,created_at:ISO(),
   reason:human_authorized?null:"HUMAN_AUTHORIZATION_REQUIRED"};
}
export async function invokeAdapter(invocation,{adapter}={}){
 if(!invocation.human_authorized) return {...invocation,state:"BLOCKED",completed_at:ISO()};
 if(typeof adapter!=="function") return {...invocation,state:"BLOCKED",reason:"ADAPTER_NOT_REGISTERED",completed_at:ISO()};
 const started=ISO();
 try { const output=await adapter(invocation); return {...invocation,state:"SUCCEEDED",output,started_at:started,completed_at:ISO(),external_effect:false}; }
 catch(error){ return {...invocation,state:"FAILED",error:String(error?.message||error),started_at:started,completed_at:ISO(),external_effect:false}; }
}
export function validateIntelligenceParity(intelligences=[]){
 const blockers=[];
 const ids=new Set();
 for(const i of Array.isArray(intelligences)?intelligences:[]){
   if(!i?.id||!i?.provider||!i?.model) blockers.push("INTELLIGENCE_ID_PROVIDER_MODEL_REQUIRED");
   if(ids.has(i.id)) blockers.push("INTELLIGENCE_ID_DUPLICATE:"+i.id);
   ids.add(i.id);
   if(i.authority!==false) blockers.push("INTELLIGENCE_AUTHORITY_MUST_BE_FALSE:"+i.id);
   if(i.secret_custody!==false) blockers.push("INTELLIGENCE_SECRET_CUSTODY_MUST_BE_FALSE:"+i.id);
 }
 return {ready:blockers.length===0,blockers,measured_at:ISO()};
}
export function intelligenceSnapshot(intelligences=[]){
 return {count:intelligences.length,ready:intelligences.filter(i=>i.state==="READY"||i.state==="SELECTABLE").length,
   providers:[...new Set(intelligences.map(i=>i.provider))],authority:false,measured_at:ISO()};
}
