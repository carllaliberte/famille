/** ACORN — REAL-WORLD BRIDGE
 * Provider-neutral HTTP execution for measured external systems.
 * Credentials are referenced by environment-variable name and never persisted.
 * Every call is classified, authorized, observed, hashed, and dated.
 *
 * Client payloads are not authority. WRITE/MONEY/PUBLISH/SIGN/DELETE/MERGE
 * require a server-minted Carl grant. HTTP cannot mint that grant.
 * base_url / path / method from a client are never trusted as routing.
 */
import crypto from "node:crypto";

const ISO=()=>new Date().toISOString();
const uid=p=>`${p}_${crypto.randomUUID()}`;
const hash=value=>crypto.createHash("sha256").update(typeof value==="string"?value:JSON.stringify(value)).digest("hex");
const SERVER_AUTHORITY=Symbol("acorn.server-authority");

export const EFFECTS=Object.freeze(["READ","WRITE","MONEY","PUBLISH","SIGN","DELETE","MERGE","UNKNOWN"]);
export const CONSEQUENTIAL_EFFECTS=Object.freeze(["WRITE","MONEY","PUBLISH","SIGN","DELETE","MERGE"]);
const READ_METHODS=Object.freeze(["GET","HEAD"]);
const WRITE_METHODS=Object.freeze(["GET","HEAD","POST","PUT","PATCH","DELETE"]);

function effectGuard(effect){
  const value=String(effect||"UNKNOWN").toUpperCase();
  if(!EFFECTS.includes(value)) throw new Error("UNKNOWN_EFFECT");
  return value;
}

export function isConsequentialEffect(effect){
  const value=String(effect||"UNKNOWN").toUpperCase();
  return value!=="READ";
}

export function grantServerAuthority({actor=null}={}){
  if(String(actor||"")!=="carl") return null;
  return Object.freeze({[SERVER_AUTHORITY]:true,source:"server",actor:"carl"});
}

export function isServerAuthority(authority){
  return Boolean(
    authority &&
    typeof authority==="object" &&
    authority[SERVER_AUTHORITY]===true &&
    authority.source==="server" &&
    authority.actor==="carl"
  );
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

function safeDecode(value){
  let current=String(value||"");
  for(let i=0;i<3;i+=1){
    try{
      const next=decodeURIComponent(current.replace(/\+/g,"%20"));
      if(next===current) break;
      current=next;
    }catch{
      break;
    }
  }
  return current;
}

function clientPathUnsafe(path){
  const raw=String(path||"");
  if(!raw) return false;
  if(/[\0\s\\]/.test(raw)) return true;
  const decoded=safeDecode(raw);
  if(/[\0\s\\]/.test(decoded)) return true;
  if(/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)||decoded.startsWith("//")) return true;
  return false;
}

export function assertPublicHttpsUrl(value){
  let url;
  try{ url=new URL(String(value||"")); }
  catch{ return {ok:false,reason:"URL_OUT_OF_SCOPE"}; }
  if(url.protocol!=="https:") return {ok:false,reason:"URL_OUT_OF_SCOPE"};
  if(url.username||url.password) return {ok:false,reason:"URL_OUT_OF_SCOPE"};
  if(blockedHost(url.hostname)) return {ok:false,reason:"URL_OUT_OF_SCOPE"};
  return {ok:true,url};
}

export function resolveSafeExternalUrl(base,path=""){
  const baseCheck=assertPublicHttpsUrl(base);
  if(!baseCheck.ok) return baseCheck;
  if(clientPathUnsafe(path)) return {ok:false,reason:"URL_OUT_OF_SCOPE"};
  const normalizedBase=baseCheck.url.pathname.endsWith("/")?baseCheck.url:new URL(baseCheck.url.pathname+"/",baseCheck.url);
  let resolved;
  try{ resolved=new URL(String(path||""),normalizedBase); }
  catch{ return {ok:false,reason:"URL_OUT_OF_SCOPE"}; }
  if(resolved.origin!==normalizedBase.origin) return {ok:false,reason:"URL_OUT_OF_SCOPE"};
  if(resolved.username||resolved.password) return {ok:false,reason:"URL_OUT_OF_SCOPE"};
  if(!resolved.pathname.startsWith(normalizedBase.pathname)) return {ok:false,reason:"URL_OUT_OF_SCOPE"};
  if(blockedHost(resolved.hostname)) return {ok:false,reason:"URL_OUT_OF_SCOPE"};
  return {ok:true,url:resolved};
}

function methodAllowed(effect,method){
  const m=String(method||"GET").toUpperCase();
  if(effect==="READ") return READ_METHODS.includes(m);
  return WRITE_METHODS.includes(m);
}

function descriptorFromEnv(raw){
  if(!raw) return [];
  const parsed=JSON.parse(raw);
  if(!Array.isArray(parsed)) throw new Error("CONNECTORS_MUST_BE_ARRAY");
  return parsed.map(x=>{
    const base=String(x.base_url||"");
    const scope=assertPublicHttpsUrl(base);
    return {
      id:String(x.id||""),
      provider:String(x.provider||""),
      kind:String(x.kind||"http"),
      base_url:scope.ok?scope.url.toString():"",
      effect:effectGuard(x.effect),
      capabilities:Array.isArray(x.capabilities)?[...new Set(x.capabilities.map(String))]:[],
      credential_env:x.credential_env?String(x.credential_env):null,
      timeout_ms:Math.min(Math.max(Number(x.timeout_ms||15000),1000),60000),
      headers:x.headers&&typeof x.headers==="object"?x.headers:{},
      in_scope:scope.ok,
    };
  });
}

export function loadRealWorldConnectors(raw=process.env.ACORN_REAL_WORLD_CONNECTORS){
  return descriptorFromEnv(raw).filter(x=>x.id&&x.provider&&x.base_url&&x.in_scope);
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

function blocked(effect,reason,extra={}){
  return {id:uid("ext"),state:"BLOCKED",reason,effect,external_effect:false,authority:false,human_authorized:false,...extra};
}

export function buildExternalCall({
  connector,
  path="",
  method="GET",
  body=null,
  human_authorized=false,
  authority=null,
  source=null,
  idempotency_key=null,
}={}){
  if(!connector?.id) throw new Error("CONNECTOR_REQUIRED");
  const effect=effectGuard(connector.effect);
  const fromHttp=source==="http";
  const clientClaimed=human_authorized===true||(authority&&!isServerAuthority(authority));
  const authorized=!fromHttp&&isServerAuthority(authority);
  if(isConsequentialEffect(effect)&&!authorized){
    return blocked(effect,"HUMAN_AUTHORIZATION_REQUIRED",{client_authorization_ignored:clientClaimed||fromHttp});
  }
  if(!methodAllowed(effect,method)){
    return blocked(effect,"METHOD_NOT_ALLOWED",{client_authorization_ignored:clientClaimed||fromHttp});
  }
  const scoped=resolveSafeExternalUrl(connector.base_url,path);
  if(!scoped.ok) return blocked(effect,scoped.reason,{client_authorization_ignored:clientClaimed||fromHttp});
  const credential=credentialValue(connector);
  if(connector.credential_env&&!credential) return blocked(effect,"CREDENTIAL_NOT_CONFIGURED",{client_authorization_ignored:clientClaimed||fromHttp});
  return {
    id:uid("ext"),
    state:"AUTHORIZED",
    effect,
    url:scoped.url.toString(),
    method:String(method).toUpperCase(),
    body,
    credential_present:Boolean(credential),
    credential_env:connector.credential_env||null,
    idempotency_key:idempotency_key||uid("idem"),
    human_authorized:authorized,
    authority:false,
    client_authorization_ignored:Boolean(clientClaimed),
    source:fromHttp?"http":"server",
    external_effect:false,
    created_at:ISO(),
  };
}

export async function executeExternalCall(call,{fetchImpl=globalThis.fetch,credential=null}={}){
  if(call?.state!=="AUTHORIZED") return {...call,completed_at:ISO()};
  if(isConsequentialEffect(call.effect)&&call.source==="http"){
    return {...call,state:"BLOCKED",reason:"HUMAN_AUTHORIZATION_REQUIRED",completed_at:ISO(),external_effect:false};
  }
  if(typeof fetchImpl!=="function") return {...call,state:"BLOCKED",reason:"FETCH_UNAVAILABLE",completed_at:ISO()};
  const scoped=resolveSafeExternalUrl(call.url,"");
  if(!scoped.ok) return {...call,state:"BLOCKED",reason:scoped.reason,completed_at:ISO(),external_effect:false};
  const started=ISO(),headers={"accept":"application/json",...(call.body?{"content-type":"application/json"}:{}),
    "x-acorn-execution-id":call.id,"idempotency-key":call.idempotency_key};
  if(credential) headers.authorization=`Bearer ${credential}`;
  const response=await fetchImpl(scoped.url.toString(),{method:call.method,headers,body:call.body?JSON.stringify(call.body):undefined});
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
    const authority=isServerAuthority(invocation?.authority)?invocation.authority:null;
    const call=buildExternalCall({
      connector,
      path:"",
      method:connector?.effect==="READ"?"GET":"POST",
      body,
      authority,
      source:invocation?.source==="http"?"http":"adapter",
      idempotency_key:invocation?.id,
    });
    return executeExternalCall(call);
  };
}

export function realWorldBridgeSnapshot(connectors=loadRealWorldConnectors()){
  return {bridge:"ACORN_REAL_WORLD_BRIDGE",connectors:connectorSnapshotMeasured(connectors),
    policy:{
      capability_is_not_authority:true,
      human_authorization_for_consequential_effects:true,
      http_cannot_grant_authority:true,
      client_human_authorized_ignored:true,
      consequential_effects_server_locked:CONSEQUENTIAL_EFFECTS.slice(),
      untrusted_client_fields:["base_url","path","method","human_authorized","authority","authorized"],
      secret_custody:false,
      persist_raw_credentials:false,
      persist_raw_secrets:false,
      measured_only:true,
      external_effects_observed:true,
    },measured_at:ISO()};
}
