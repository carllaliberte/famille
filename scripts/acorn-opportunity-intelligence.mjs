/** ACORN — UNIVERSAL OPPORTUNITY INTELLIGENCE
 * One fabric for discovering useful resources, opportunities and reusable solutions.
 * Discovery is not proof. Ranking is not authority. External facts require evidence.
 */
const ISO=()=>new Date().toISOString(), arr=v=>Array.isArray(v)?v:[], clean=v=>String(v??"").trim();
export const OPPORTUNITY_INTELLIGENCE_VERSION="acorn.opportunity-intelligence.v1";
export const OPPORTUNITY_TYPES=Object.freeze(["CAPABILITY","RESOURCE","CREDIT","FREE_TIER","STARTUP_PROGRAM","OPEN_SOURCE","API","MCP","MODEL","COMPUTE","DATA","CONNECTOR","PROJECT_TEMPLATE","MARKET_NEED","PARTNER","GRANT","UNKNOWN"]);
export const STATUS=Object.freeze(["DISCOVERED","QUALIFIED","MEASURED","VERIFIED","EXPIRED","BLOCKED","UNKNOWN"]);
export function createOpportunity({id,type="UNKNOWN",provider="unknown",name="",capabilities=[],access_class="UNKNOWN",cost=null,expires_at=null,evidence=null,requirements=[],jurisdictions=[],source="discovery",metadata={}}={}){
 if(!clean(id)||!OPPORTUNITY_TYPES.includes(type)) throw Error("OPPORTUNITY_ID_AND_TYPE_REQUIRED");
 return {contract:OPPORTUNITY_INTELLIGENCE_VERSION,id,type,provider:clean(provider)||"unknown",name:clean(name)||id,capabilities:arr(capabilities),access_class,cost:Number.isFinite(Number(cost))?Number(cost):null,expires_at:expires_at||null,evidence:evidence&&typeof evidence==="object"?evidence:null,requirements:arr(requirements),jurisdictions:arr(jurisdictions),source,metadata:metadata&&typeof metadata==="object"?metadata:{},status:"DISCOVERED",authority:false,human_authorized:false,measured_at:ISO()};
}
export function discoverOpportunitySurfaces({surfaces=[]}={}){return arr(surfaces).filter(Boolean).map((x,i)=>createOpportunity({...x,id:clean(x.id)||"opportunity:"+i,type:OPPORTUNITY_TYPES.includes(x.type)?x.type:"UNKNOWN"}))}
export function qualifyOpportunity(x,{now=Date.now()}={}){
 if(!x||x.status==="BLOCKED") return {...x,status:"BLOCKED"};
 if(x.expires_at&&Date.parse(x.expires_at)<=now) return {...x,status:"EXPIRED"};
 return {...x,status:x.evidence?"QUALIFIED":"DISCOVERED",authority:false};
}
export function rankOpportunities({opportunities=[],required_capabilities=[],prefer_free=true}={}){
 const req=new Set(arr(required_capabilities).map(clean).filter(Boolean));
 return arr(opportunities).map(x=>qualifyOpportunity(x)).filter(x=>x.status!=="BLOCKED"&&x.status!=="EXPIRED")
 .filter(x=>!req.size||arr(x.capabilities).some(c=>req.has(c)))
 .sort((a,b)=>{
  const free=prefer_free?(Number(a.cost??Infinity)-Number(b.cost??Infinity)):0;
  const evidence=Number(Boolean(b.evidence))-Number(Boolean(a.evidence));
  const verified=Number(b.status==="VERIFIED")-Number(a.status==="VERIFIED");
  return free||verified||evidence||a.id.localeCompare(b.id);
 });
}
export function buildOpportunityPortfolio({opportunities=[],required_capabilities=[],limit=25}={}){
 const ranked=rankOpportunities({opportunities,required_capabilities});
 return {contract:OPPORTUNITY_INTELLIGENCE_VERSION,required_capabilities:arr(required_capabilities),items:ranked.slice(0,limit),count:Math.min(limit,ranked.length),state:ranked.length?"READY_FOR_RESEARCH":"NO_MATCH",authority:false,measured_at:ISO()};
}
export function deriveReusableOpportunity({outcome,capabilities=[],evidence=null}={}){
 return {contract:OPPORTUNITY_INTELLIGENCE_VERSION,type:"PROJECT_TEMPLATE",provider:"acorn",name:"derived:"+clean(outcome?.id||"outcome"),capabilities:arr(capabilities),source:"measured-outcome",evidence,status:evidence?"QUALIFIED":"DISCOVERED",authority:false,human_authorized:false,derived_from:outcome?.id||null,measured_at:ISO()};
}
export function snapshotOpportunityIntelligence({opportunities=[]}={}){
 const list=arr(opportunities); return {contract:OPPORTUNITY_INTELLIGENCE_VERSION,total:list.length,verified:list.filter(x=>x.status==="VERIFIED").length,qualified:list.filter(x=>x.status==="QUALIFIED").length,free_candidates:list.filter(x=>x.cost===0).length,expired:list.filter(x=>x.status==="EXPIRED").length,authority:false,measured_at:ISO()};
}
