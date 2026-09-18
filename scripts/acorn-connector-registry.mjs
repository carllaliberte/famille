/** ACORN — UNIVERSAL CONNECTOR REGISTRY
 * Connectors describe and execute capabilities without owning authority.
 */
const ISO=()=>new Date().toISOString();
const uid=p=>`${p}_${crypto.randomUUID()}`;
export function registerConnector({id,provider,kind,capabilities=[],state="DISCOVERED",metadata={}}={}){
 if(!id||!provider||!kind) throw new Error("CONNECTOR_ID_PROVIDER_KIND_REQUIRED");
 return {id,provider,kind,capabilities:[...new Set(capabilities)],state,metadata,
   authority:false,credentials_present:false,secret_custody:false,registered_at:ISO(),measured_at:null};
}
export function measureConnector(connector,{reachable=false,capabilities=[],latency_ms=null}={}){
 return {...connector,capabilities:[...new Set([...(connector.capabilities||[]),...capabilities])],
   state:reachable?"READY":"DEGRADED",measured_at:ISO(),evidence:{reachable,latency_ms,measured_at:ISO()}};
}
export function planConnectorExecution({task,connector,human_authorized=false}={}){
 if(!task?.id||!connector?.id) throw new Error("TASK_AND_CONNECTOR_REQUIRED");
 return {id:uid("cx"),task_id:task.id,connector_id:connector.id,state:human_authorized?"AUTHORIZED":"BLOCKED",
   authority:false,human_authorized:Boolean(human_authorized),external_effect:false,
   created_at:ISO(),reason:human_authorized?null:"HUMAN_AUTHORIZATION_REQUIRED"};
}
export async function executeRegisteredConnector(plan,{adapter}={}){
 if(!plan.human_authorized) return {...plan,state:"BLOCKED",completed_at:ISO()};
 if(typeof adapter!=="function") return {...plan,state:"BLOCKED",reason:"ADAPTER_NOT_REGISTERED",completed_at:ISO()};
 const started=ISO();
 try {const output=await adapter(plan);return {...plan,state:"SUCCEEDED",output,started_at:started,completed_at:ISO(),external_effect:false};}
 catch(error){return {...plan,state:"FAILED",error:String(error?.message||error),started_at:started,completed_at:ISO(),external_effect:false};}
}
export function connectorSnapshot(connectors=[]){
 return {count:connectors.length,ready:connectors.filter(c=>c.state==="READY").length,
   providers:[...new Set(connectors.map(c=>c.provider))],authority:false,measured_at:ISO()};
}
