import {registerNeuralNode,createNeuralSignal,connectNeuralNodes,routeNeuralSignal,buildInteroperabilitySnapshot} from "./acorn-neural-interoperability-fabric.mjs";
export const CONTRACT="acorn.neural-interoperability-conductor.v1";
export function runNeuralInteroperability({nodes=[],edges=[],signals=[]}={}){const graph=connectNeuralNodes({nodes,edges});const routed=signals.map(signal=>routeNeuralSignal({signal,graph}));return {contract:CONTRACT,graph,signals:routed,snapshot:buildInteroperabilitySnapshot({nodes,edges,signals,gaps:graph.unconnected}),next:graph.unconnected.length?"CONNECT_OR_REOBSERVE":"MEASURE_INTEROPERABILITY",authority:false,auto_authorize:false,auto_execute:false,live:false}}
export {registerNeuralNode,createNeuralSignal};
