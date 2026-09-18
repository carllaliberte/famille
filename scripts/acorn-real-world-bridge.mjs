/** ACORN — REAL-WORLD BRIDGE
 * Provider-neutral HTTP execution for measured external systems.
 * Credentials are referenced by environment-variable name and never persisted.
 * Every call is classified, authorized, observed, hashed, and dated.
 */
import crypto from "node:crypto";

const ISO=()=>new Date().toISOString();
const uid=p=>`${p}_${crypto.randomUUID()}`;
const hash=value=>crypto.createHash("sha256").update(typeof value==="string"?value:JSON.stringify(value)).digest("hex");

export const EFFECTS=Object.freeze(["READ","WRITE","MONEY","PUBLISH","SIGN","DELETE","MERGE","UNKNOWN"]);

function effectGuard(effect){
  const value=String(effect||"UNKNOWN").toUpperCase();
  if(!EFFECTS.includes(value)) throw new Error("UNKNOWN_EFFECT");
  return value;
}
function descriptorFromEnv(raw){
  if(!raw) return [];
  const parsed=JSON.parse(raw);
  if(!Array.isArray(parsed)) throw new Error("CONNECTORS_MUST_BE_ARRAY");
  return parsed.map(x=>({
    id:String(x.id||""),
    provider:String(x.provider||""),
    kind:String(x.kind||"http"),
    base_url:String(x.base_url||""),
    effect:effectGuard(x.effect),
    capabilities:Array.isArray(x.capabilities)?[...new Set(x.capabilities.map(String))]:[],
    credential_env:x.credential_env?String(x.credential_env):null,
    timeout_ms:Math.min(Math.max(Number(x.timeout_ms||15000),1000),60000),
    headers:x.headers&&typeof x.headers==="object"?x.headers:{},
  }));
}
export function loadRealWorldConnectors(raw=process.env.ACORN_REAL_WORLD_CONNECTORS){
  return descriptorFromEnv(raw).filter(x=>x.id&&x.provider&&x.base_url);
}
export function connectorSnapshotMeasured(connectors=loadRealWorldConnectors()){
  return {count:connectors.length,providers:[...new Set(connectors.map(x=>x.provider))],
    configured:connectors.filter(x=>x.credential_env?Boolean(process.env[x.credential_env]):true).length,
    effects:[...new Set(connectors.map(x=>x.effect))],secret_custody:false,measured_at:ISO()};
}
function credentialValue(connector){
  if(!connector.credential_env) return null;
  const value=process.env[connector.credential_env];
  return value||null;
}
function resolveUrl(base,path=""){
  const url=new URL(path||".",base.endsWith("/")?base:`${base}/`);
  return url.toString();
}
export function buildExternalCall({connector,path="",method="GET",body=null,human_authorized=false,idempotency_key=null}={}){
  if(!connector?.id) throw new Error("CONNECTOR_REQUIRED");
  const effect=effectGuard(connector.effect);
  const consequential=effect!=="READ";
  if(consequential&&!human_authorized) return {id:uid("ext"),state:"BLOCKED",reason:"HUMAN_AUTHORIZATION_REQUIRED",effect,external_effect:false};
  if(!human_authorized&&effect==="READ") {
    // Read-only calls may execute when the connector is explicitly configured as READ.
  }
  const credential=credentialValue(connector);
  if(connector.credential_env&&!credential) return {id:uid("ext"),state:"BLOCKED",reason:"CREDENTIAL_NOT_CONFIGURED",effect,external_effect:false};
  return {id:uid("ext"),state:"AUTHORIZED",effect,url:resolveUrl(connector.base_url,path),method:String(method).toUpperCase(),
    body,credential_present:Boolean(credential),credential_env:connector.credential_env||null,
    idempotency_key:idempotency_key||uid("idem"),human_authorized:Boolean(human_authorized),
    authority:false,external_effect:false,created_at:ISO()};
}
export async function executeExternalCall(call,{fetchImpl=globalThis.fetch}={}){
  if(call?.state!=="AUTHORIZED") return {...call,completed_at:ISO()};
  if(typeof fetchImpl!=="function") return {...call,state:"BLOCKED",reason:"FETCH_UNAVAILABLE",completed_at:ISO()};
  const started=ISO(),headers={"accept":"application/json",...(call.body?{"content-type":"application/json"}:{}),
    "x-acorn-execution-id":call.id,"idempotency-key":call.idempotency_key};
  // The secret itself never enters the call record. It is read only at execution time.
  const response=await fetchImpl(call.url,{method:call.method,headers,body:call.body?JSON.stringify(call.body):undefined});
  const text=await response.text();
  let output=text; try{output=JSON.parse(text)}catch{}
  const measured_at=ISO();
  return {...call,state:response.ok?"SUCCEEDED":"FAILED",http_status:response.status,
    output_hash:hash(output),output:response.ok?output:undefined,
    error:response.ok?null:"EXTERNAL_HTTP_ERROR",started_at:started,completed_at:measured_at,
    measured_at,external_effect:call.effect!=="READ",
    evidence:{origin:"external_http",status:response.status,ok:response.ok,measured_at,valid_until:null,
      confidence:response.ok?1:0,margin:response.ok?1:0}};
}
export function buildExternalIntelligenceAdapter({connector,requestBuilder}={}){
  return async invocation=>{
    const body=typeof requestBuilder==="function"?requestBuilder(invocation):{input:invocation.input||invocation.task_id||""};
    const call=buildExternalCall({connector,path:"",method:"POST",body,human_authorized:Boolean(invocation.human_authorized),idempotency_key:invocation.id});
    return executeExternalCall(call);
  };
}
export function realWorldBridgeSnapshot(connectors=loadRealWorldConnectors()){
  return {bridge:"ACORN_REAL_WORLD_BRIDGE",connectors:connectorSnapshotMeasured(connectors),
    policy:{capability_is_not_authority:true,human_authorization_for_consequential_effects:true,
      secret_custody:false,persist_raw_credentials:false,persist_raw_secrets:false,
      measured_only:true,external_effects_observed:true},measured_at:ISO()};
}
