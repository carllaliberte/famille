
/** ACORN — API-OPTIONAL FLUID COGNITION
 * A brain does not require an API. Neither does Acorn.
 * APIs are adapters/rails, never cognitive prerequisites.
 * CAPABILITY != AUTHORITY. Breaker is immutable and never touched here.
 */
export const CONTRACT="acorn.api-optional-fluid-cognition.v1";
export const PRINCIPLE="API_IS_OPTIONAL_CAPABILITY_IS_PRIMARY";
export const PROTECTED=Object.freeze(["BREAKER"]);
export const CHANNELS=Object.freeze(["IN_PROCESS","MEMORY","FILE","STDIO","LOCAL_PROCESS","SOCKET","DEVICE","HUMAN","FEDERATED","WEB","API"]);
const arr=v=>Array.isArray(v)?v:[]; const now=()=>new Date().toISOString();
const uid=p=>p+"_"+crypto.randomUUID(); const uniq=v=>[...new Set(arr(v))];

export function registerSubstrate({id,kind="IN_PROCESS",capabilities=[],available=true,metadata={}}={}) {
 if(!id) throw new Error("SUBSTRATE_ID_REQUIRED");
 if(!CHANNELS.includes(kind)) throw new Error("CHANNEL_KIND_UNSUPPORTED");
 return {id,kind,capabilities:uniq(capabilities),available:Boolean(available),metadata,authority:false,api_required:false,breaker_touched:false,registered_at:now()};
}
export function createCognitivePacket({task_id,capability,payload=null,trace_id=null,priority="NORMAL"}={}) {
 if(!task_id||!capability) throw new Error("COGNITIVE_PACKET_REQUIRED");
 return {contract:CONTRACT,id:uid("pkt"),task_id,capability,payload,trace_id:trace_id||uid("trace"),priority,created_at:now(),authority:false,api_required:false,breaker_touched:false};
}
export function discoverFluidPaths(packet,{substrates=[],preferred_kinds=[]}={}) {
 const candidates=arr(substrates).filter(s=>s.available&&s.capabilities.includes(packet?.capability));
 const pref=new Map(arr(preferred_kinds).map((k,i)=>[k,arr(preferred_kinds).length-i]));
 return candidates.map(s=>({substrate_id:s.id,kind:s.kind,capability:packet.capability,score:(pref.get(s.kind)||0)+(s.kind==="IN_PROCESS"?100:0)+(s.kind==="MEMORY"?90:0)+(s.kind==="LOCAL_PROCESS"?80:0),api_required:false,authority:false,breaker_touched:false})).sort((a,b)=>b.score-a.score);
}
export function chooseFluidPath(paths=[]) { return arr(paths).find(p=>p.kind!=="API")||arr(paths)[0]||null; }
export function negotiateIntercompanyLink({parties=[],capabilities=[],value_exchange=[],data_policy="MINIMAL",duration="RENEWABLE",exit="OPEN",authority="SEPARATE"}={}) {
 if(arr(parties).length<2) throw new Error("TWO_PARTIES_REQUIRED");
 return {contract:"acorn.intercompany-fluid-link.v1",parties:uniq(parties),capabilities:uniq(capabilities),value_exchange:arr(value_exchange),data_policy,duration,exit,authority,api_required:false,non_exclusive:true,no_lock_in:true,no_transfer_of_authority:true,human_signature_required:true,status:"NEGOTIATION_TEMPLATE",created_at:now(),breaker_touched:false};
}
export function composeCapabilityFlow({packet,paths=[],allow_api_fallback=true}={}) {
 const chosen=chooseFluidPath(paths);
 if(!chosen) return {state:"WAITING_CAPABILITY",api_required:false,reason:"NO_AVAILABLE_SUBSTRATE",packet,breaker_touched:false};
 return {state:"READY_TO_FLOW",packet,path:chosen,api_required:chosen.kind==="API",api_fallback:Boolean(allow_api_fallback&&chosen.kind==="API"),authority:false,external_effect:false,breaker_touched:false};
}
export async function flowWithoutApi(flow,{executor}={}) {
 if(flow?.state!=="READY_TO_FLOW") return {...flow,state:"BLOCKED"};
 if(flow.path.kind==="API") return {...flow,state:"API_FALLBACK_AVAILABLE",reason:"API_IS_OPTIONAL_NOT_PREREQUISITE"};
 if(typeof executor!=="function") return {...flow,state:"BLOCKED",reason:"NATIVE_EXECUTOR_NOT_REGISTERED"};
 const started=now();
 try { const result=await executor({packet:flow.packet,substrate:flow.path}); return {...flow,state:"FLOWING",result,started_at:started,completed_at:now(),api_required:false,external_effect:false,breaker_touched:false}; }
 catch(error) { return {...flow,state:"FAILED",error:String(error?.message||error),started_at:started,completed_at:now(),api_required:false,breaker_touched:false}; }
}
export function fluidCognitionSnapshot({substrates=[],flows=[],links=[]}={}) {
 const native=arr(substrates).filter(s=>s.kind!=="API"&&s.available).length;
 const flowing=arr(flows).filter(f=>f.state==="FLOWING").length;
 return {contract:CONTRACT,principle:PRINCIPLE,substrates:arr(substrates).length,native_available:native,flows:arr(flows).length,flowing,links:arr(links).length,api_optional:true,api_prerequisite:false,authority:false,breaker_touched:false,measured_at:now()};
}
export function assertFluidConstitution(snapshot={}) {
 if(snapshot.breaker_touched===true) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(snapshot.api_prerequisite===true) throw new Error("API_MUST_NOT_BE_COGNITIVE_PREREQUISITE");
 return true;
}
