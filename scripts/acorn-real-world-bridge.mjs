/** ACORN — REAL-WORLD BRIDGE
 * Provider-neutral HTTP execution for measured external systems.
 * Credentials are referenced by environment-variable name and never persisted.
 * Every call is classified, authorized, observed, hashed, and dated.
 *
 * Client payloads are not authority. HTTP cannot mint human authorization.
 * base_url / path / method from a client are never trusted as routing.
 * WRITE/MONEY/PUBLISH/SIGN/DELETE/MERGE require in-process human_authorized.
 */
import crypto from "node:crypto";

const ISO=()=>new Date().toISOString();
const uid=p=>`${p}_${crypto.randomUUID()}`;
const hash=value=>crypto.createHash("sha256").update(typeof value==="string"?value:JSON.stringify(value)).digest("hex");

export const EFFECTS=Object.freeze(["READ","WRITE","MONEY","PUBLISH","SIGN","DELETE","MERGE","UNKNOWN"]);
export const CONSEQUENTIAL_EFFECTS=Object.freeze(["WRITE","MONEY","PUBLISH","SIGN","DELETE","MERGE","UNKNOWN"]);
const READ_METHODS=Object.freeze(["GET","HEAD"]);

function effectGuard(effect){
  const value=String(effect||"UNKNOWN").toUpperCase();
  if(!EFFECTS.includes(value)) throw new Error("UNKNOWN_EFFECT");
  return value;
}

export function isConsequentialEffect(effect){
  const value=String(effect||"UNKNOWN").toUpperCase();
  return value!=="READ";
}

function blockedHost(hostname){
  const host=String(hostname||"").toLowerCase().replace(/\.+$/,"").replace(/^\[|\]$/g,"");
  if(!host) return true;
  if(host==="localhost"||host.endsWith(".localhost")||host==="metadata.google.internal"||host==="metadata") return true;
  if(host==="::1"||host==="::"||host.startsWith("fe80:")||host.startsWith("fc")||host.startsWith("fd")) return true;
  if(host.startsWith("::ffff:")) return blockedHost(host.slice(7));
  const ipv4=host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if(ipv4){
    const oct=ipv4.slice(1).map(Number);
    if(oct.some((n)=>n>255)) return true;
    const [a,b]=oct;
    if(a===0||a===10||a===127||a===255) return true;
    if(a===169&&b===254) return true;
    if(a===172&&b>=16&&b<=31) return true;
    if(a===192&&b===168) return true;
    if(a===100&&b>=64&&b<=127) return true;
  }
  return false;
}

function clientPathUnsafe(path){
  const raw=String(path||"");
  if(!raw) return false;
  if(/[\0\s\\]/.test(raw)) return true;
  let decoded=raw;
  try { decoded=decodeURIComponent(raw.replace(/\+/g,"%20")); } catch { /* keep raw */ }
  if(/[\0\s\\]/.test(decoded)) return true;
  if(/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)||decoded.startsWith("//")) return true;
  return false;
}

export function resolveConnectorUrl(base, path=""){
  const originRaw=String(base||"");
  if(!/^https:\/\//i.test(originRaw)) return {ok:false,reason:"URL_OUT_OF_SCOPE"};
  if(clientPathUnsafe(path)) return {ok:false,reason:"URL_OUT_OF_SCOPE"};
  let origin;
  try { origin=new URL(originRaw.endsWith("/")?originRaw:originRaw+"/"); }
  catch { return {ok:false,reason:"URL_OUT_OF_SCOPE"}; }
  if(origin.protocol!=="https:"||origin.username||origin.password||blockedHost(origin.hostname)){
    return {ok:false,reason:"URL_OUT_OF_SCOPE"};
  }
  let url;
  try { url=new URL(String(path||"")||".", origin); }
  catch { return {ok:false,reason:"URL_OUT_OF_SCOPE"}; }
  if(url.protocol!=="https:"||url.username||url.password) return {ok:false,reason:"URL_OUT_OF_SCOPE"};
  if(url.origin!==origin.origin) return {ok:false,reason:"URL_OUT_OF_SCOPE"};
  if(blockedHost(url.hostname)) return {ok:false,reason:"URL_OUT_OF_SCOPE"};
  const prefix=origin.pathname==="/"? "/" : origin.pathname;
  if(!url.pathname.startsWith(prefix)) return {ok:false,reason:"URL_OUT_OF_SCOPE"};
  return {ok:true,url:url.toString()};
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
export function buildExternalCall({connector,path="",method="GET",body=null,human_authorized=false,idempotency_key=null,source="in-process"}={}){
  if(!connector?.id) throw new Error("CONNECTOR_REQUIRED");
  const effect=effectGuard(connector.effect);
  const consequential=isConsequentialEffect(effect);
  if(consequential&&!human_authorized) return {id:uid("ext"),state:"BLOCKED",reason:"HUMAN_AUTHORIZATION_REQUIRED",effect,external_effect:false,human_authorized:false,authority:false};
  const verb=String(method||"GET").toUpperCase();
  if(!consequential && !READ_METHODS.includes(verb)) {
    return {id:uid("ext"),state:"BLOCKED",reason:"READ_METHOD_REQUIRED",effect,external_effect:false,human_authorized:false,authority:false};
  }
  const resolved=resolveConnectorUrl(connector.base_url, path);
  if(!resolved.ok) return {id:uid("ext"),state:"BLOCKED",reason:resolved.reason,effect,external_effect:false,human_authorized:false,authority:false};
  const credential=credentialValue(connector);
  if(connector.credential_env&&!credential) return {id:uid("ext"),state:"BLOCKED",reason:"CREDENTIAL_NOT_CONFIGURED",effect,external_effect:false};
  return {id:uid("ext"),state:"AUTHORIZED",effect,url:resolved.url,method:verb,
    body:consequential?body:null,credential_present:Boolean(credential),credential_env:connector.credential_env||null,
    timeout_ms:connector.timeout_ms||15000,
    idempotency_key:idempotency_key||uid("idem"),human_authorized:Boolean(human_authorized),
    authority:false,external_effect:false,source:source||"in-process",created_at:ISO()};
}
export async function executeExternalCall(call,{fetchImpl=globalThis.fetch,credential=null}={}){
  if(call?.state!=="AUTHORIZED") return {...call,completed_at:ISO()};
  if(typeof fetchImpl!=="function") return {...call,state:"BLOCKED",reason:"FETCH_UNAVAILABLE",completed_at:ISO()};
  const started=ISO(),headers={"accept":"application/json",...(call.body?{"content-type":"application/json"}:{}),
    "x-acorn-execution-id":call.id,"idempotency-key":call.idempotency_key};
  if(credential) headers.authorization=`Bearer ${credential}`;
  const timeout=Math.min(Math.max(Number(call.timeout_ms||15000),1000),60000);
  let response;
  try {
    response=await fetchImpl(call.url,{
      method:call.method,
      headers,
      body:call.body?JSON.stringify(call.body):undefined,
      redirect:"error",
      signal:AbortSignal.timeout(timeout)
    });
  } catch (error) {
    const reason=String(error?.name||"")==="TimeoutError"?"TIMEOUT":"FETCH_FAILED";
    return {...call,state:"FAILED",reason,error:reason,started_at:started,completed_at:ISO(),external_effect:false};
  }
  const text=await response.text();
  const bounded=text.length>262144?text.slice(0,262144):text;
  let output=bounded; try{output=JSON.parse(bounded)}catch{}
  const measured_at=ISO();
  return {...call,state:response.ok?"SUCCEEDED":"FAILED",http_status:response.status,
    output_hash:hash(output),output:response.ok?output:undefined,
    error:response.ok?null:"EXTERNAL_HTTP_ERROR",started_at:started,completed_at:measured_at,
    measured_at,external_effect:false,
    evidence:{origin:"external_http",status:response.status,ok:response.ok,measured_at,valid_until:null,
      epistemic:"OBSERVED",confidence:response.ok?1:0,margin:response.ok?0.1:0,verified:false,live:false}};
}
export function publicExternalResult(result={}){
  const out={...result};
  delete out.credential;
  delete out.output;
  delete out.headers;
  delete out.body;
  return out;
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
      http_cannot_grant_authority:true,secret_custody:false,persist_raw_credentials:false,persist_raw_secrets:false,
      measured_only:true,external_effects_observed:true},measured_at:ISO()};
}
