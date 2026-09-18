/**
 * ACORN — Security & Reliability Convergence
 * Contract: acorn.security-reliability-convergence.v1
 *
 * Pure policy helpers over the existing runtime. No new authority layer.
 */
export const CONTRACT="acorn.security-reliability-convergence.v1";
const CONSEQUENT=[ "WRITE","MONEY","PUBLISH","SIGN","DELETE","MERGE","CONTRACT","REFUND","PAYOUT","PRICE_CHANGE","WRITE_PROTECTED" ];
const PRIVATE_HOST=/^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|169\.254\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[0-1])\.)/i;

export function classifyEffect(effect){
 const e=String(effect??"UNKNOWN").toUpperCase();
 return CONSEQUENT.includes(e)?"CONSEQUENTIAL":e==="READ"||e==="OBSERVE"?"READ_ONLY":"UNKNOWN";
}
export function authorizeExternalAction({effect,source="internal",human_authorized=false,server_authorized=false}={}){
 const kind=classifyEffect(effect);
 if(kind==="CONSEQUENTIAL") return {authorized:false,state:"WAITING_HUMAN",reason:"HUMAN_AUTHORITY_REQUIRED"};
 if(kind==="UNKNOWN") return {authorized:false,state:"BLOCKED",reason:"UNKNOWN_EFFECT_LOCKED"};
 if(source==="http" && human_authorized) return {authorized:false,state:"BLOCKED",reason:"HTTP_CANNOT_GRANT_AUTHORITY"};
 if(human_authorized===true && server_authorized===true) return {authorized:true,state:"AUTHORIZED",reason:null};
 return {authorized:false,state:"WAITING_HUMAN",reason:"EXPLICIT_AUTHORIZATION_REQUIRED"};
}
export function validateHttpsOrigin(baseUrl){
 try{
  const u=new URL(baseUrl);
  if(u.protocol!=="https:") return {ok:false,reason:"HTTPS_REQUIRED"};
  if(PRIVATE_HOST.test(u.hostname)) return {ok:false,reason:"PRIVATE_HOST_BLOCKED"};
  return {ok:true,origin:u.origin};
 }catch{return {ok:false,reason:"INVALID_URL"}}
}
export function validateRelativePath(baseUrl,path){
 const origin=validateHttpsOrigin(baseUrl);
 if(!origin.ok)return origin;
 if(typeof path!=="string"||!path)return {ok:false,reason:"PATH_REQUIRED"};
 if(path.startsWith("//")||/^[a-z][a-z0-9+.-]*:/i.test(path)||path.includes("..")) return {ok:false,reason:"URL_OUT_OF_SCOPE"};
 try{
  const base=new URL(baseUrl); const target=new URL(path,base);
  if(target.origin!==base.origin || !target.pathname.startsWith(base.pathname.endsWith("/")?base.pathname:base.pathname+"/")) return {ok:false,reason:"URL_OUT_OF_SCOPE"};
  return {ok:true,url:target.toString()};
 }catch{return {ok:false,reason:"INVALID_URL"}}
}
export function externalTruth({executed=false,measured=false,verified=false,live=false}={}){
 return {
  executed:executed?"EXECUTED":"NOT_EXECUTED",
  measured:measured?"MEASURED":"NOT_MEASURED",
  verified:verified?"VERIFIED":"NOT_VERIFIED",
  live:live?"LIVE":"NOT_LIVE"
 };
}
export function idempotencyDecision({key,existing=null}={}){
 if(!key)return {state:"NEW",replay:false};
 if(existing)return {state:"REPLAY",replay:true,result:existing};
 return {state:"NEW",replay:false};
}
export function staleJobDecision({state,updatedAt,now=new Date().toISOString(),staleMs=120000}={}){
 if(state!=="RUNNING")return {state:"UNCHANGED"};
 const age=Date.parse(now)-Date.parse(updatedAt);
 if(!Number.isFinite(age)||age<staleMs)return {state:"RUNNING"};
 return {state:"REQUEUE",reason:"STALE_RUNNING"};
}
export function redactExternalResult(result={}){
 const out={...result};
 delete out.credential; delete out.credential_env; delete out.authorization; delete out.secret; delete out.token; delete out.raw_output; delete out.output;
 return out;
}
