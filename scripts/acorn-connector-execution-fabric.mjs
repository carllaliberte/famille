/** ACORN — CONNECTOR EXECUTION FABRIC
 * Adapters can execute capability; they never acquire authority.
 * CONFIGURED ≠ CONNECTED. CONFIGURED ≠ READY.
 */
const ISO=()=>new Date().toISOString();
export const CONNECTOR_STATES=Object.freeze(["DISCOVERED","CONFIGURED","READY","RUNNING","SUCCEEDED","FAILED","BLOCKED","DISCONNECTED"]);
export function createConnectorExecutor({connection,execute}={}){
 if(!connection?.id||typeof execute!=="function") throw new Error("CONNECTION_AND_EXECUTOR_REQUIRED");
 return {connection_id:connection.id,authority:false,state:"READY",execute};
}
export async function executeConnector(executor,{task,authorized=false,channel_present=true}={}){
 if(!channel_present) return {state:"BLOCKED",reason:"CHANNEL_NOT_PRESENT",measured_at:ISO()};
 if(!authorized) return {state:"BLOCKED",reason:"HUMAN_AUTHORIZATION_REQUIRED",measured_at:ISO()};
 const started=ISO();
 try{
  const output=await executor.execute(task);
  return {state:"SUCCEEDED",output,started_at:started,completed_at:ISO(),external_effect_claimed:false};
 }catch(error){
  return {state:"FAILED",error:String(error?.message||error),started_at:started,completed_at:ISO(),external_effect_claimed:false};
 }
}
export function connectorCapabilityMap(connections=[]){
 return connections.map(c=>({id:c.id,provider:c.provider,capabilities:[...(c.capabilities||[])],authority:false,state:c.state,configured:c.state==="CONFIGURED"||c.configured===true,connected:c.reachable===true&&c.state==="READY"}));
}
