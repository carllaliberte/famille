import {buildMeasuredActionQueue,reconcileActionQueue} from "./acorn-measured-action-queue-convergence.mjs";
export const CONTRACT="acorn.action-queue-conductor.v1";
export function runActionQueueConvergence(input={}){const queue=buildMeasuredActionQueue(input);return {contract:CONTRACT,queue,reconciled:reconcileActionQueue({actions:queue.actions,completed:input.completed||[]}),next:"MEASURE_OR_REQUEST_AUTHORIZATION",human_gate:true,authority:false,auto_authorize:false,auto_execute:false,live:false}}
