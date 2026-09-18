/** ACORN — UNIVERSAL DEVELOPER ACCESS FABRIC
 * Provider-neutral developer access, capability discovery and free-first routing.
 * Catalog entries are discovery seeds, not proof of live access.
 * CAPABILITY != AUTHORITY; FREE != UNLIMITED; DISCOVERED != CONNECTED.
 */
const ISO=()=>new Date().toISOString();
const clean=v=>String(v??"").trim();
const arr=v=>Array.isArray(v)?v:[];
export const UNIVERSAL_DEVELOPER_ACCESS_VERSION="acorn.universal-developer-access.v1";

export const DEVELOPER_ECOSYSTEMS=Object.freeze([
  "openai","anthropic","google","xai","mistral","cohere","deepseek","groq","cerebras",
  "nvidia","meta","aws","microsoft","cloudflare","github","huggingface","openrouter",
  "together","sambanova","perplexity","vercel","supabase","mongodb","postgresql",
  "docker","kubernetes","stripe","twilio","slack","discord","linear","figma"
]);

export const ACCESS_CLASSES=Object.freeze([
  "FREE_PERMANENT","FREE_TRIAL","CREDIT","STARTUP_PROGRAM","COMMUNITY",
  "OPEN_SOURCE","SELF_HOSTED","PAID","UNKNOWN"
]);

export const ACCESS_STATES=Object.freeze([
  "DISCOVERED","CONFIGURED","AUTHENTICATED","CONNECTED","EXECUTED",
  "MEASURED","VERIFIED","EXPIRED","BLOCKED","UNKNOWN"
]);

const SEEDS={
  openai:["responses","agents","mcp","web_search","file_search","computer_use","shell","code_interpreter","image_generation"],
  anthropic:["messages","mcp","computer_use","tool_use"],
  google:["gemini","ai_studio","grounding","maps","vertex_ai","mcp"],
  xai:["models","tools","mcp"],
  mistral:["models","agents","ocr","codestral"],
  cohere:["chat","embed","rerank","tool_use"],
  deepseek:["chat","reasoning"],
  groq:["inference","tool_use"],
  cerebras:["inference"],
  nvidia:["nim","cuda","nvidia_api","omniverse"],
  meta:["llama","open_models"],
  aws:["bedrock","sagemaker","lambda"],
  microsoft:["foundry","azure_ai","github","mcp"],
  cloudflare:["workers_ai","ai_gateway","mcp","workers"],
  github:["apps","actions","api","graphql","mcp","codespaces"],
  huggingface:["inference","datasets","spaces","models"],
  openrouter:["multi_provider_inference","models","routing"],
  together:["inference","models"],
  sambanova:["inference"],
  perplexity:["search","sonar"],
  vercel:["ai_sdk","functions","mcp"],
  supabase:["postgres","edge_functions","storage","auth"],
  mongodb:["database","vector_search","atlas"],
  postgresql:["database","extensions"],
  docker:["containers","build","registry"],
  kubernetes:["orchestration","compute"],
  stripe:["payments","billing","connect"],
  twilio:["sms","voice","messaging"],
  slack:["messaging","apps"],
  discord:["messaging","bots"],
  linear:["issues","projects"],
  figma:["design","files","plugins","mcp"]
};

export function createDeveloperAccess({
  id,provider,capability,access_class="UNKNOWN",state="DISCOVERED",
  cost=0,currency="USD",quota=null,requires_key=true,source="catalog",
  endpoint=null,version="unknown",evidence=null,expires_at=null,metadata={}
}={}){
  const p=clean(provider).toLowerCase(), c=clean(capability);
  if(!p||!c) throw Error("DEVELOPER_PROVIDER_AND_CAPABILITY_REQUIRED");
  return {
    contract:UNIVERSAL_DEVELOPER_ACCESS_VERSION,
    id:clean(id)||p+":"+c,
    provider:p,capability:c,access_class:ACCESS_CLASSES.includes(access_class)?access_class:"UNKNOWN",
    state:ACCESS_STATES.includes(state)?state:"UNKNOWN",
    economics:{cost:Number.isFinite(Number(cost))?Number(cost):null,currency,free_candidate:Number(cost)===0},
    quota:quota??null,auth:{requires_key:Boolean(requires_key),secret_material_present:false},
    source,endpoint:clean(endpoint)||null,version:clean(version)||"unknown",
    evidence:evidence&&typeof evidence==="object"?evidence:null,
    expires_at:expires_at||null,metadata:metadata&&typeof metadata==="object"?metadata:{},
    authority:false,human_authorized:false,measured_at:ISO()
  };
}

export function seedDeveloperCatalog({providers=DEVELOPER_ECOSYSTEMS}={}){
  const out=[];
  for(const provider of arr(providers)){
    const p=clean(provider).toLowerCase(), caps=SEEDS[p]||["future_surface"];
    for(const capability of caps) out.push(createDeveloperAccess({
      provider:p,capability,access_class:"UNKNOWN",state:"DISCOVERED",
      source:"developer-ecosystem-seed"
    }));
  }
  return out;
}

export function discoverDeveloperSurfaces({surfaces=[],catalog=seedDeveloperCatalog()}={}){
  const known=new Map(catalog.map(x=>[x.id,x]));
  for(const raw of arr(surfaces)){
    if(!raw||typeof raw!=="object") continue;
    const provider=clean(raw.provider).toLowerCase()||"unknown";
    const capability=clean(raw.capability||raw.type||raw.name)||"future_surface";
    const item=createDeveloperAccess({...raw,provider,capability,state:raw.state||"DISCOVERED",source:raw.source||"runtime-discovery"});
    known.set(item.id,item);
  }
  return [...known.values()];
}

export function classifyAccessEconomics(access){
  const a=access||{};
  if(a.access_class==="FREE_PERMANENT"||a.access_class==="OPEN_SOURCE"||a.access_class==="SELF_HOSTED") return 0;
  if(a.access_class==="FREE_TRIAL"||a.access_class==="CREDIT"||a.access_class==="STARTUP_PROGRAM"||a.access_class==="COMMUNITY") return 1;
  if(a.access_class==="PAID") return 3;
  return 2;
}

export function rankDeveloperAccess({candidates=[],requirements=[],prefer_free=true}={}){
  const req=new Set(arr(requirements).map(clean).filter(Boolean));
  return arr(candidates).filter(x=>x&&x.state!=="BLOCKED"&&x.state!=="EXPIRED").filter(x=>!req.size||req.has(x.capability))
    .sort((a,b)=>{
      const free=prefer_free?(classifyAccessEconomics(a)-classifyAccessEconomics(b)):0;
      const verified=(Number(b.state==="VERIFIED")-Number(a.state==="VERIFIED"));
      const measured=(Number(b.state==="MEASURED")-Number(a.state==="MEASURED"));
      const cost=(Number(a.economics?.cost??Infinity)-Number(b.economics?.cost??Infinity));
      return free||verified||measured||cost||String(a.id).localeCompare(String(b.id));
    });
}

export function chooseDeveloperRoute({candidates=[],requirements=[],budget=null,prefer_free=true}={}){
  const ranked=rankDeveloperAccess({candidates,requirements,prefer_free});
  const affordable=budget==null?ranked:ranked.filter(x=>x.economics?.cost==null||Number(x.economics.cost)<=Number(budget));
  const selected=affordable[0]||null;
  return {contract:UNIVERSAL_DEVELOPER_ACCESS_VERSION,selected,alternatives:affordable.slice(1),state:selected?"ROUTE_SELECTED":"NO_CAPABILITY",cost: selected?.economics?.cost??null,authority:false,measured_at:ISO()};
}

export function registerFutureDeveloperSurface({provider,name,version="unknown",capabilities=[],protocols=[],endpoint=null}={}){
  return createDeveloperAccess({
    id:"future:"+clean(provider||"unknown")+":"+clean(name||"surface"),
    provider:clean(provider)||"unknown",capability:clean(name)||"future_surface",
    access_class:"UNKNOWN",state:"DISCOVERED",source:"future-surface",
    version,endpoint,metadata:{future_compatible:true,capabilities:arr(capabilities),protocols:arr(protocols)}
  });
}

export function redactDeveloperAccess(access){
  return {...access,auth:{...(access?.auth||{}),secret_material_present:false},authority:false,human_authorized:false};
}

export function snapshotDeveloperAccess({access=[]}={}){
  const list=arr(access);
  return {contract:UNIVERSAL_DEVELOPER_ACCESS_VERSION,total:list.length,
    by_provider:Object.fromEntries([...new Set(list.map(x=>x.provider))].map(p=>[p,list.filter(x=>x.provider===p).length])),
    free_candidates:list.filter(x=>x.economics?.free_candidate).length,
    verified:list.filter(x=>x.state==="VERIFIED").length,
    unknown:list.filter(x=>x.state==="UNKNOWN"||x.access_class==="UNKNOWN").length,
    authority:false,measured_at:ISO()};
}
