import test from "node:test";import assert from "node:assert/strict";import {connectNeuralNodes,routeNeuralSignal,buildInteroperabilitySnapshot} from "../scripts/acorn-neural-interoperability-fabric.mjs";
const nodes=[{id:"cortex",type:"CORTEX"},{id:"memory",type:"MEMORY"},{id:"action",type:"ACTION"}],edges=[{from:"cortex",to:"memory"},{from:"memory",to:"action"}];
test("connects typed nodes",()=>assert.equal(connectNeuralNodes({nodes,edges}).edges.length,2));
test("routes only governed active edges",()=>assert.equal(routeNeuralSignal({signal:{from:"cortex",to:"memory"},graph:{edges}}).route,"ROUTABLE"));
test("exposes disconnected nodes",()=>assert.deepEqual(buildInteroperabilitySnapshot({nodes:[{id:"a"},{id:"b"}],edges:[]}).unconnected,["a","b"]));
