import {assessRuntimeState,scheduleRuntimeCycle,detectRuntimeDrift} from "./acorn-continuous-runtime-control-loop.mjs";
export const CONTRACT="acorn.runtime-drift-conductor.v1";
export function runRuntimeControl({baseline={},runs=[],connectors=[],capabilities=[],outcomes=[],gaps=[]}={}){const state=assessRuntimeState({runs,connectors,capabilities,outcomes,gaps}),drift=detectRuntimeDrift({baseline,current:state}),cycle=scheduleRuntimeCycle({state});return {contract:CONTRACT,state,drift,cycle,human_gate:true,authority:false,auto_authorize:false,auto_execute:false,live:false}}
