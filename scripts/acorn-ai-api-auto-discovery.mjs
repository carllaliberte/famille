/** ACORN — AI API AUTO-DISCOVERY / DEVELOPER MODE
 * Runtime catalog discovery is evidence-seeking, not a claim of authentication.
 * OpenRouter is used as a broad catalog/fallback discovery rail; direct providers
 * are represented by provider-neutral contracts and only become CONNECTED after
 * an actual credentialed probe succeeds. No secrets are stored in the repo.
 */
const ISO=()=>new Date().toISOString(); const arr=v=>Array.isArray(v)?v:[]; const clean=v=>String(v??"").trim();
export const VERSION="acorn.ai-api-auto-discovery.v1";
export const DISCOVERY_SOURCES=Object.freeze(["OPENROUTER_PUBLIC_CATALOG","DIRECT_PROVIDER_METADATA","RUNTIME_CONNECTOR_REGISTRY","FUTURE_SURFACE_DISCOVERY"]);
export const DIRECT_PROVIDERS=Object.freeze(["openai","anthropic","google","xai","mistral","cohere","deepseek","groq","cerebras","nvidia","meta","perplexity","together","fireworks","replicate","huggingface","moonshot","ai21","sambanova","cerebras","bedrock","vertex"]);
const KEY_ENV=p=>({openai:"OPENAI_API_KEY",anthropic:"ANTHROPIC_API_KEY",google:"GEMINI_API_KEY",xai:"XAI_API_KEY",mistral:"MISTRAL_API_KEY",cohere:"COHERE_API_KEY",deepseek:"DEEPSEEK_API_KEY",groq:"GROQ_API_KEY",cerebras:"CEREBRAS_API_KEY",nvidia:"NVIDIA_API_KEY",perplexity:"PERPLEXITY_API_KEY",together:"TOGETHER_API_KEY",fireworks:"FIREWORKS_API_KEY",replicate:"REPLICATE_API_TOKEN",huggingface:"HF_TOKEN",moonshot:"MOONSHOT_API_KEY",ai21:"AI21_API_KEY",sambanova:"SAMBANOVA_API_KEY",bedrock:"AWS_ACCESS_KEY_ID",vertex:"GOOGLE_APPLICATION_CREDENTIALS"}[p]||null);
export function normalizeProvider(raw={}){const id=clean(raw.id||raw.provider||raw.slug||raw.name).toLowerCase();return{id,provider:id,name:clean(raw.name)||id,models:arr(raw.models),capabilities:arr(raw.capabilities),source:raw.source||"unknown",api_style:raw.api_style||"UNKNOWN",base_url:clean(raw.base_url)||null,documentation:clean(raw.documentation)||null,requires_key:raw.requires_key!==false,key_env:raw.key_env||KEY_ENV(id),state:raw.state||"DISCOVERED",authority:false};}
export async function discoverOpenRouterCatalog({fetchImpl=globalThis.fetch,limit=1000}={}) {
 if(typeof fetchImpl!=="function") return {status:"NOT_EXECUTED",reason:"FETCH_UNAVAILABLE",providers:[],models:[]};
 try {
  const r=await fetchImpl("https://openrouter.ai/api/v1/models",{headers:{"accept":"application/json"}});
  if(!r.ok) return {status:"FAILED",http_status:r.status,providers:[],models:[]};
  const body=await r.json(); const models=arr(body?.data).slice(0,limit).map(m=>({id:m.id,name:m.name||m.id,provider:clean(m.id).split("/")[0]||"unknown",context_length:m.context_length||null,pricing:m.pricing||null,architecture:m.architecture||null,source:"OPENROUTER_PUBLIC_CATALOG"}));
  const providers=[...new Set(models.map(m=>m.provider))].map(provider=>normalizeProvider({provider,source:"OPENROUTER_PUBLIC_CATALOG",models:models.filter(m=>m.provider===provider).map(m=>m.id),state:"DISCOVERED",requires_key:true}));
  return {status:"MEASURED",providers,models,source:"OPENROUTER_PUBLIC_CATALOG",measured_at:ISO(),authority:false};
 } catch(error){return {status:"FAILED",reason:clean(error?.message||error),providers:[],models:[]};}
}
export function discoverDirectProviderSurfaces({environment=process.env,metadata=[]}={}) {
 const meta=new Map(arr(metadata).map(normalizeProvider));
 const providers=arr(DIRECT_PROVIDERS).map(id=>meta.get(id)||normalizeProvider({provider:id,source:"DIRECT_PROVIDER_METADATA",state:environment[KEY_ENV(id)]?"CONFIGURED":"DISCOVERED"}));
 return {status:"DISCOVERED",providers,measured_at:ISO(),authority:false};
}
export function reconcileAiCatalog({catalog=[],direct=[]}={}) {
 const map=new Map();
 for(const raw of [...arr(catalog),...arr(direct)]) {const p=normalizeProvider(raw);if(!p.id)continue;const old=map.get(p.id);map.set(p.id,{...(old||{}),...p,models:[...new Set([...(old?.models||[]),...p.models])],capabilities:[...new Set([...(old?.capabilities||[]),...p.capabilities])]});}
 return [...map.values()].sort((a,b)=>a.id.localeCompare(b.id));
}
export function buildDeveloperAccessPlan({providers=[],environment=process.env}={}) {
 return arr(providers).map(p=>({provider:p.provider,model_count:p.models.length,capabilities:p.capabilities,credential_env:p.key_env,credential_present:Boolean(p.key_env&&environment[p.key_env]),state:p.state==="CONFIGURED"?"CONFIGURED":"DISCOVERED",next:"PROBE_WITHOUT_REPO_SECRET",authority:false}));
}
export async function runAiApiDiscovery({fetchImpl=globalThis.fetch,environment=process.env}={}) {
 const openrouter=await discoverOpenRouterCatalog({fetchImpl});
 const direct=discoverDirectProviderSurfaces({environment});
 const providers=reconcileAiCatalog({catalog:openrouter.providers,direct:direct.providers});
 return {contract:VERSION,source_count:DISCOVERY_SOURCES.length,openrouter,direct,providers,developer_plan:buildDeveloperAccessPlan({providers,environment}),total_providers:providers.length,total_models:openrouter.models.length,measured_at:ISO(),live:false,verified:false,authority:false};
}
if(import.meta.url===`file://${process.argv[1]}`) console.log(JSON.stringify(await runAiApiDiscovery(),null,2));