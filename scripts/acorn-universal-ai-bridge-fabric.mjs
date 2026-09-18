/** ACORN — UNIVERSAL AI BRIDGE FABRIC */
export const CONTRACT="acorn.universal-ai-bridge-fabric.v1";
export const BRIDGE_MODES=Object.freeze(["NATIVE","OPENAI_COMPATIBLE","HTTP","SDK","LOCAL","MCP","CLI","WEB","FUTURE_ADAPTER"]);
const A=v=>Array.isArray(v)?v:[]; const now=()=>new Date().toISOString();
export function describeBridge({provider,model_pattern="*",mode="FUTURE_ADAPTER",capabilities=[],endpoint=null,credential_env=null}={}) {
 if(!provider) throw new Error("BRIDGE_PROVIDER_REQUIRED");
 if(!BRIDGE_MODES.includes(mode)) throw new Error("BRIDGE_MODE_UNSUPPORTED");
 return {id:"bridge_"+provider+"_"+mode.toLowerCase(),provider,model_pattern,mode,capabilities:A(capabilities),endpoint,credential_env,state:"DISCOVERED",authority:false,secret_custody:false,api_required:false,breaker_touched:false,created_at:now()};
}
export function selectBridge({capability,model=null,bridges=[]}={}) {
 return A(bridges).filter(b=>b.state!=="BLOCKED"&&A(b.capabilities).includes(capability)&&(!model||b.model_pattern==="*"||model.includes(b.model_pattern))).sort((a,b)=>(a.mode==="NATIVE"?0:1)-(b.mode==="NATIVE"?0:1))[0]||null;
}
export function buildBridgeChain({capability,model=null,bridges=[]}={}) {
 return A(bridges).filter(b=>b.state!=="BLOCKED"&&A(b.capabilities).includes(capability)&&(!model||b.model_pattern==="*"||model.includes(b.model_pattern))).map((b,i)=>({...b,rank:i+1,api_optional:true,authority:false,breaker_touched:false}));
}
export async function executeBridge({bridge,request,adapter}={}) {
 if(!bridge) return {state:"NO_BRIDGE",api_required:false,authority:false,breaker_touched:false};
 if(typeof adapter!=="function") return {state:"ADAPTER_NOT_REGISTERED",bridge_id:bridge.id,authority:false,breaker_touched:false};
 try { const result=await adapter({bridge,request}); return {state:"SUCCEEDED",bridge_id:bridge.id,result,authority:false,external_effect:false,breaker_touched:false}; }
 catch(error) { return {state:"FAILED",bridge_id:bridge.id,error:String(error?.message||error),authority:false,external_effect:false,breaker_touched:false}; }
}
export function registerFutureModel({provider,model,capabilities=[],bridge_mode="FUTURE_ADAPTER",metadata={}}={}) {
 return {provider,model,capabilities:A(capabilities),bridge_mode,metadata,state:"DISCOVERED",adapter_generated:true,api_optional:true,authority:false,breaker_touched:false,registered_at:now()};
}
export function assertBridgeConstitution({breaker_touched=false,api_prerequisite=false}={}) {
 if(breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(api_prerequisite) throw new Error("API_MUST_NOT_BE_COGNITIVE_PREREQUISITE");
 return true;
}