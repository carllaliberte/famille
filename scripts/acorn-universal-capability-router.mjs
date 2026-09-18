/** ACORN — UNIVERSAL CAPABILITY ROUTER
 * Selects the best known measured route for an intent across the connection mesh.
 * Scores are scoped and evidence-aware; no claim of global optimum.
 */
const ISO=()=>new Date().toISOString(),arr=v=>Array.isArray(v)?v:[],num=v=>Number.isFinite(Number(v))?Number(v):null;
export const VERSION="acorn.universal-capability-router.v1";
export const DIMENSIONS=Object.freeze(["capability_fit","quality","latency","reliability","cost","freshness","evidence","privacy","availability","reusability"]);
export function createRoute({id,provider,capabilities=[],quality=null,latency_ms=null,reliability=null,cost=null,freshness=null,privacy=null,availability=null,evidence=null,rights=[]}={}){
 if(!id||!provider)throw Error("ROUTE_ID_PROVIDER_REQUIRED");
 return {contract:VERSION,id,provider,capabilities:arr(capabilities),quality:num(quality),latency_ms:num(latency_ms),reliability:num(reliability),cost:num(cost),freshness:num(freshness),privacy:num(privacy),availability:num(availability),evidence:evidence&&typeof evidence==="object"?evidence:null,rights:arr(rights),authority:false,measured_at:ISO()};
}
export function scoreRoute(route,{required_capabilities=[],weights={}}={}){
 const req=new Set(arr(required_capabilities)); const fit=req.size?arr(route.capabilities).filter(x=>req.has(x)).length/req.size:1;
 const norm=(v,d=0)=>v==null?d:Math.max(0,Math.min(1,v));
 const quality=norm(route.quality), reliability=norm(route.reliability), freshness=norm(route.freshness), privacy=norm(route.privacy), availability=norm(route.availability);
 const latency=route.latency_ms==null?.5:1-Math.min(1,route.latency_ms/10000);
 const cost=route.cost==null?.5:1-Math.min(1,route.cost/100);
 const evidence=route.evidence?.verified===true?1:route.evidence?.observed===true?.6:0;
 const w={capability_fit:3,quality:3,latency:1,reliability:2,cost:2,freshness:1,evidence:2,privacy:1,availability:2,...weights};
 const vals={capability_fit:fit,quality,latency,reliability,cost,freshness,evidence,privacy,availability,reusability:0};
 const total=Object.entries(vals).reduce((s,[k,v])=>s+v*(w[k]??1),0);
 return {score:Number(total.toFixed(6)),dimensions:vals};
}
export function rankRoutes({routes=[],required_capabilities=[],weights={}}={}){
 return arr(routes).map(r=>({...r,...scoreRoute(r,{required_capabilities,weights})})).filter(r=>r.dimensions.capability_fit>0).sort((a,b)=>b.score-a.score);
}
export function chooseRoute(input={}){const ranked=rankRoutes(input);return ranked[0]||null;}
export function buildRoutePortfolio({routes=[],required_capabilities=[],alternatives=3}={}){const ranked=rankRoutes({routes,required_capabilities});return{contract:VERSION,required_capabilities,primary:ranked[0]||null,alternatives:ranked.slice(1,alternatives),count:ranked.length,selection_scope:"BEST_KNOWN_IN_SCOPE",global_optimum:false,authority:false,measured_at:ISO()};}
export function recordRouteOutcome({route,result,evidence,metrics={}}={}){return{contract:VERSION,route_id:route?.id||null,result,result_metrics:metrics,evidence:evidence||null,measured_at:ISO(),feeds_learning:true,authority:false};}
