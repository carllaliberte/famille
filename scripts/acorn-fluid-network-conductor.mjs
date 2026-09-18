
/** ACORN — FLUID NETWORK CONDUCTOR
 * Unifies connector/network convergence with API-optional cognition.
 * APIs are merely one possible rail. Native capability flow is first-class.
 * Debug is always-on observation. Breaker is never touched.
 */
import {createCognitivePacket,discoverFluidPaths,composeCapabilityFlow,fluidCognitionSnapshot,assertFluidConstitution} from "./acorn-api-optional-fluid-cognition.mjs";
import {buildNetworkGraph,assertNetworkConvergence} from "./acorn-network-convergence.mjs";

export const CONTRACT="acorn.fluid-network-conductor.v1";

export function conduct({task_id,capability,payload=null,substrates=[],connectors=[]}={}) {
 const packet=createCognitivePacket({task_id,capability,payload});
 const paths=discoverFluidPaths(packet,{substrates});
 const flow=composeCapabilityFlow({packet,paths});
 const graph=buildNetworkGraph(connectors);
 const snapshot=fluidCognitionSnapshot({substrates,flows:[flow],links:[]});
 assertFluidConstitution(snapshot); assertNetworkConvergence(graph);
 return {contract:CONTRACT,packet,paths,flow,network:graph,snapshot,debug:true,api_optional:true,api_prerequisite:false,authority:false,breaker_touched:false};
}

export function optimizeFluidContinuously(state,{measurements={}}={}) {
 const paths=Array.isArray(state?.paths)?state.paths:[];
 const ranked=paths.map(p=>({...p,observed_latency_ms:measurements[p.substrate_id]?.latency_ms??null,reliability:measurements[p.substrate_id]?.reliability??null}));
 return {...state,paths:ranked,optimization:"CONTINUOUS_OBSERVATION",debug:true,api_optional:true,authority:false,breaker_touched:false};
}
