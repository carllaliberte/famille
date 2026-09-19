import {analyzeSemanticGraph,blastRadius,rankCriticalPaths} from "./acorn-semantic-critical-path-engine.mjs";
export const CONTRACT="acorn.critical-path-conductor.v1";
export function runCriticalPathAnalysis({nodes=[],edges=[],evidenceByNode={},focusNode}={}){const analysis=analyzeSemanticGraph({nodes,edges});return {contract:CONTRACT,analysis,focus:focusNode?blastRadius({root:focusNode,nodes,edges}):null,priorities:rankCriticalPaths({analysis,evidenceByNode}),next_step:"MEASURE_OR_REOBSERVE",authority:false,auto_authorize:false,auto_execute:false,live:false}}
