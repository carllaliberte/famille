import {buildSystemContext,selectContextForTask,reconcileContext,buildContextDelta} from "./acorn-continuous-system-context-fabric.mjs";
export const CONTRACT="acorn.system-context-conductor.v1";
export function runSystemContext({events=[],observations=[],nodes=[],task,now,freshnessMs}={}){const context=buildSystemContext({events,observations,nodes,now,freshnessMs});return {contract:CONTRACT,context,task_context:task?selectContextForTask({context,task}):null,next:context.contradictions?.length?"RECONCILE_CONTRADICTIONS":context.state==="CONTEXT_GAP"?"REOBSERVE":"CONTINUE_WITH_MEASURED_CONTEXT",authority:false,auto_authorize:false,auto_execute:false,live:false}}
export {reconcileContext,buildContextDelta};
