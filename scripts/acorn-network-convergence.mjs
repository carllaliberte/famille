/** ACORN — UNIVERSAL NETWORK CONVERGENCE
 * Reuses the original connector registry as the ingress membrane.
 * This fabric optimizes capability flow; it does not own authority and
 * intentionally does not modify Breaker.
 */
export const CONTRACT="acorn.network-convergence.v1";
export const INITIAL_MEMBRANE="acorn-connector-registry";
export const PROTECTED=["BREAKER"];
const A=v=>Array.isArray(v)?v:[]; const now=()=>new Date().toISOString();
const uniq=v=>[...new Set(A(v))];
const safe=(v)=>v===undefined?null:v;
export function createCapabilityEnvelope({task_id,capability,source,trace_id,priority="NORMAL",payload=null}={}) {
 if(!task_id||!capability||!source) throw new Error("NETWORK_ENVELOPE_REQUIRED");
 return {contract:CONTRACT,task_id,capability,source,trace_id:trace_id||`trace_${crypto.randomUUID()}`,priority,payload,created_at:now(),authority:false};
}
export function normalizeConnector(connector={}) {
 return {id:connector.id||null,provider:connector.provider||null,kind:connector.kind||null,capabilities:uniq(connector.capabilities),state:connector.state||"UNKNOWN",authority:false};
}
export function buildNetworkGraph(connectors=[]) {
 const nodes=A(connectors).map(normalizeConnector);
 const edges=[];
 for(const a of nodes) for(const b of nodes) if(a.id&&b.id&&a.id!==b.id){
   const overlap=a.capabilities.filter(c=>b.capabilities.includes(c));
   if(overlap.length) edges.push({from:a.id,to:b.id,capabilities:overlap,weight:overlap.length});
 }
 return {contract:CONTRACT,nodes,edges,protected:PROTECTED,breaker_touched:false};
}
export function discoverRoutes(graph,{capability,source,targets=[]}={}) {
 const adj=new Map(A(graph.nodes).map(n=>[n.id,n]));
 const wanted=A(targets).length?A(targets):A(graph.nodes).filter(n=>n.id!==source).map(n=>n.id);
 const routes=[];
 for(const target of wanted){
   if(!adj.has(source)||!adj.has(target)) continue;
   const q=[[source,[source]]],seen=new Set([source]);
   while(q.length){const [cur,path]=q.shift();if(cur===target){routes.push({source,target,path,hops:path.length-1,capability});break;}
     for(const e of A(graph.edges).filter(x=>x.from===cur&&x.capabilities.includes(capability))){
       if(!seen.has(e.to)){seen.add(e.to);q.push([e.to,[...path,e.to]]);}
     }
   }
 }
 return routes;
}
export function scoreRoute(route,{latency_ms=0,reliability=1,friction=0,cost=0}={}) {
 const hops=Math.max(0,(route?.hops??0)); return {route,score:(reliability*100)-(hops*4)-Math.max(0,latency_ms)/100-Math.max(0,friction)*10-Math.max(0,cost),truth:"SCOPED_ROUTE_SCORE"};
}
export function chooseFluidRoute(routes=[],measurements={}) {
 return A(routes).map(r=>scoreRoute(r,measurements[r.target]||{})).sort((a,b)=>b.score-a.score)[0]||null;
}
export function buildFlowPlan({envelope,route,limits={}}={}) {
 const hops=A(route?.path); return {contract:CONTRACT,trace_id:envelope?.trace_id||null,task_id:envelope?.task_id||null,capability:envelope?.capability||null,path:hops,hops:Math.max(0,hops.length-1),batch_size:limits.batch_size||1,timeout_ms:limits.timeout_ms||30000,max_inflight:limits.max_inflight||4,retry_budget:limits.retry_budget||2,backpressure:"EXPLICIT",authority:false,breaker_touched:false,state:"PLANNED"};
}
export function advanceFlow(plan,{result,latency_ms=null,evidence=null}={}) {
 return {...plan,state:result?.ok===true?"FLOWING":result?.retryable===true?"RETRYABLE":"STALLED",observation:{latency_ms,evidence},updated_at:now(),breaker_touched:false};
}
export function networkSnapshot(graph,flows=[]) {
 const ready=A(graph?.nodes).filter(n=>n.state==="READY").length;
 const flowing=A(flows).filter(f=>f.state==="FLOWING").length;
 return {contract:CONTRACT,nodes:A(graph?.nodes).length,ready,edges:A(graph?.edges).length,flows:A(flows).length,flowing,friction:flows.length?1-(flowing/flows.length):0,protected:PROTECTED,breaker_touched:false,measured_at:now()};
}
export function assertNetworkConvergence(graph={}) {
 if(graph.breaker_touched===true) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(!graph.contract||graph.contract!==CONTRACT) throw new Error("NETWORK_CONTRACT_INVALID");
 return true;
}