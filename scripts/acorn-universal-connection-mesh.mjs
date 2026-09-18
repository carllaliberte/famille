/** ACORN — UNIVERSAL CONNECTION MESH
 * Provider-neutral registry for connecting as many useful external surfaces as possible.
 * Discovery is open-ended; trust, execution and authority remain separately gated.
 */
const ISO=()=>new Date().toISOString(), arr=v=>Array.isArray(v)?v:[], str=v=>String(v??"").trim();
export const VERSION="acorn.universal-connection-mesh.v1";
export const SURFACE_CLASSES=Object.freeze(["AI","DEVELOPER","CLOUD","CODE","DATA","COMMUNICATION","PRODUCTIVITY","DESIGN","COMMERCE","RESEARCH","OBSERVABILITY","SECURITY","IOT","ROBOTICS","INDUSTRIAL","ENERGY","FUTURE"]);
export const STATES=Object.freeze(["DISCOVERED","CONFIGURED","AUTHENTICATED","CONNECTED","READABLE","EXECUTABLE","MEASURED","VERIFIED","EXPIRED","BLOCKED","UNKNOWN"]);
export const AUTH_BOUNDARIES=Object.freeze(["READ","PROPOSE","EXECUTE","WRITE","MONEY","PUBLISH","SIGN","DELETE","MERGE"]);
export const PROVIDER_SEEDS=Object.freeze([
 ["openai","AI"],["anthropic","AI"],["google","AI"],["xai","AI"],["mistral","AI"],["cohere","AI"],["deepseek","AI"],["groq","AI"],["cerebras","AI"],["nvidia","AI"],["meta","AI"],
 ["aws","CLOUD"],["microsoft","CLOUD"],["cloudflare","CLOUD"],["vercel","CLOUD"],["supabase","CLOUD"],
 ["github","CODE"],["gitlab","CODE"],["bitbucket","CODE"],["huggingface","AI"],["openrouter","AI"],["together","AI"],["sambanova","AI"],["perplexity","RESEARCH"],
 ["docker","CLOUD"],["kubernetes","CLOUD"],["mongodb","DATA"],["postgresql","DATA"],["snowflake","DATA"],["databricks","DATA"],
 ["slack","COMMUNICATION"],["discord","COMMUNICATION"],["twilio","COMMUNICATION"],["gmail","COMMUNICATION"],["calendar","PRODUCTIVITY"],
 ["notion","PRODUCTIVITY"],["linear","PRODUCTIVITY"],["jira","PRODUCTIVITY"],["asana","PRODUCTIVITY"],["figma","DESIGN"],["canva","DESIGN"],
 ["stripe","COMMERCE"],["shopify","COMMERCE"],["salesforce","COMMERCE"],["hubspot","COMMERCE"],
 ["datadog","OBSERVABILITY"],["sentry","OBSERVABILITY"],["grafana","OBSERVABILITY"],
 ["okta","SECURITY"],["auth0","SECURITY"],["cloudflare-security","SECURITY"],
 ["arduino","IOT"],["raspberry-pi","IOT"],["siemens","INDUSTRIAL"],["abb","INDUSTRIAL"],["schneider-electric","ENERGY"],["aws-iot","IOT"],
 ["ros","ROBOTICS"],["nvidia-omniverse","ROBOTICS"],["future-provider","FUTURE"]
]);
export function createConnectionSurface({id,provider,type="FUTURE",capabilities=[],protocols=["HTTPS"],auth="UNKNOWN",state="DISCOVERED",cost=null,rights=[],evidence=null,metadata={}}={}){
 if(!str(id)||!str(provider)) throw Error("CONNECTION_ID_PROVIDER_REQUIRED");
 if(!SURFACE_CLASSES.includes(type)) type="FUTURE";
 return {contract:VERSION,id,provider,type,capabilities:arr(capabilities),protocols:arr(protocols),auth,state,cost:Number.isFinite(Number(cost))?Number(cost):null,rights:arr(rights),evidence:evidence&&typeof evidence==="object"?evidence:null,metadata:metadata&&typeof metadata==="object"?metadata:{},authority:false,human_authorized:false,created_at:ISO()};
}
export function seedConnectionMesh(){return PROVIDER_SEEDS.map(([provider,type])=>createConnectionSurface({id:"provider:"+provider,provider,type,capabilities:["discover"],protocols:["HTTPS","MCP"],state:"DISCOVERED"}));}
export function registerFutureSurface(surface={}){return createConnectionSurface({...surface,type:"FUTURE",state:"DISCOVERED"});}
export function buildConnectionPlan({surfaces=[],required_capabilities=[],preferred_protocols=["MCP","HTTPS"]}={}){
 const req=new Set(arr(required_capabilities).map(str)); return arr(surfaces).filter(Boolean).map(s=>({...s,score:arr(s.capabilities).filter(c=>req.has(c)).length*100+arr(s.protocols).filter(p=>preferred_protocols.includes(p)).length})).sort((a,b)=>b.score-a.score).map(({score,...s})=>({...s,score}));
}
export function authorizeConnectionAction({surface,action="READ",human_authorized=false}={}){
 const a=String(action).toUpperCase(); if(!surface) return {allowed:false,reason:"NO_SURFACE"};
 if(!AUTH_BOUNDARIES.includes(a)) return {allowed:false,reason:"UNKNOWN_ACTION"};
 if(a==="READ"||a==="PROPOSE") return {allowed:true,reason:"LOW_RISK"};
 if(human_authorized===true) return {allowed:true,reason:"EXPLICIT_HUMAN_AUTHORIZATION"};
 return {allowed:false,reason:"HUMAN_AUTHORIZATION_REQUIRED"};
}
export function classifyConnectionTruth(surface){if(!surface)return"UNKNOWN"; if(surface.state==="VERIFIED")return"VERIFIED"; if(surface.state==="CONNECTED")return"CONNECTED"; if(surface.state==="EXECUTABLE")return"EXECUTABLE"; if(surface.state==="MEASURED")return"MEASURED"; return surface.state||"UNKNOWN";}
export function snapshotConnectionMesh({surfaces=[]}={}){const xs=arr(surfaces);return{contract:VERSION,total:xs.length,providers:new Set(xs.map(x=>x.provider)).size,connected:xs.filter(x=>x.state==="CONNECTED").length,verified:xs.filter(x=>x.state==="VERIFIED").length,executable:xs.filter(x=>x.state==="EXECUTABLE").length,unknown:xs.filter(x=>x.state==="UNKNOWN").length,authority:false,measured_at:ISO()};}
