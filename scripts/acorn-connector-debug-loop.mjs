/** ACORN — CONTINUOUS CONNECTOR DEBUG LOOP
 * Observes the existing Connector/Flux and network-convergence contracts.
 * It never changes Breaker state, grants authority, or stores secrets.
 */
import { measureConnector, securityInvariants } from "./acorn-connector-flux.mjs";
import { runAiApiDiscovery } from "./acorn-ai-api-auto-discovery.mjs";
import { buildNetworkGraph, networkSnapshot } from "./acorn-network-convergence.mjs";
export const VERSION="acorn.connector-debug-loop.v1";
export const DEBUG_DEFAULT=true;
export async function runConnectorDebugLoop({environment=process.env,fetchImpl=globalThis.fetch}={}) {
 const debug=environment.ACORN_CONNECTOR_DEBUG===undefined?DEBUG_DEFAULT:environment.ACORN_CONNECTOR_DEBUG!=="false";
 if(!debug) return {version:VERSION,debug:false,state:"DISABLED",breaker_touched:false,authority:false,live:false};
 const perf=measureConnector({samples:Math.min(32,Math.max(4,Number(environment.ACORN_DEBUG_SAMPLES)||16)),env:environment});
 const invariants=securityInvariants();
 const ai=await runAiApiDiscovery({fetchImpl,environment});
 const graph=buildNetworkGraph(ai.providers.map(p=>({id:"ai:"+p.provider,provider:p.provider,kind:"AI_API",capabilities:["ai","inference",...p.capabilities],state:p.state==="CONFIGURED"?"MEASURED":"DISCOVERED"})));
 return {version:VERSION,debug:true,state:"MEASURED",performance:perf,invariants,ai_providers:ai.total_providers,ai_models:ai.total_models,network:networkSnapshot(graph,[]),breaker_touched:false,authority:false,live:false,observed_at:new Date().toISOString()};
}
if(import.meta.url===`file://${process.argv[1]}`) console.log(JSON.stringify(await runConnectorDebugLoop(),null,2));