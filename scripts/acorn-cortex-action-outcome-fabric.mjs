/** ACORN — CORTEX ACTION & OUTCOME FABRIC
 * Connects proposal -> authorization -> execution evidence -> outcome -> learning.
 * It composes existing execution/evidence/learning primitives; it creates no authority.
 */
import { createTask, startTask, completeTask, recordExecutionEvent } from "./acorn-execution-fabric.mjs";
import { registerEvidence, evidenceIsCurrent } from "./acorn-evidence-registry.mjs";
import { measureOutcome, learnFromOutcome, createCapabilityRevision } from "./acorn-universal-outcome-learning-fabric.mjs";

export const CONTRACT = "acorn.cortex-action-outcome-fabric.v1";
export const STATES = Object.freeze([
  "PROPOSED","AUTHORIZED","DENIED","HOLD","EXECUTING","EXECUTED","FAILED",
  "OBSERVED","MEASURED","LEARNED"
]);
const now=()=>new Date().toISOString();
const id=p=>`${p}:${Date.now()}${Math.random().toString(36).slice(2,8)}`;

export function createActionRequest({
  actor, capability, intent, proposal, requiredAuthority="HUMAN",
  target=null, parameters={}, expectedOutcome=null, evidenceRequired=true, provenance=null
}={}) {
  if(!actor||!capability||!intent||!proposal) throw new Error("ACTION_REQUEST_FIELDS_REQUIRED");
  return Object.freeze({
    id:id("action"), contract:CONTRACT, actor, capability, intent, proposal,
    required_authority:requiredAuthority, authorization_state:"HOLD",
    target, parameters, expected_outcome:expectedOutcome, evidence_required:Boolean(evidenceRequired),
    status:"PROPOSED", provenance, authority:false, breaker_touched:false, created_at:now()
  });
}

export function authorizeAction(action,{authorized=false,source=null}={}) {
  if(!action) throw new Error("ACTION_REQUIRED");
  if(!authorized) return {...action,authorization_state:"DENIED",status:"DENIED",authorization_source:source,authority:false};
  return {...action,authorization_state:"AUTHORIZED",status:"AUTHORIZED",authorization_source:source,authority:false};
}

export function beginAction(action,{executor="unknown"}={}) {
  if(action?.authorization_state!=="AUTHORIZED") return {...action,status:"HOLD",execution_error:"AUTHORIZATION_REQUIRED",authority:false};
  return {...action,status:"EXECUTING",executor,started_at:now(),authority:false,breaker_touched:false};
}

export function observeAction(action,{success=false,actualOutcome=null,evidence=[],error=null}={}) {
  if(!["EXECUTING","AUTHORIZED"].includes(action?.status)) throw new Error("ACTION_NOT_EXECUTING");
  const evidenceItems=evidence.map(e=>typeof e==="string"?{id:e,status:"MEASURED",measured:true,verified:true,evidence:[e]}:e);
  const current=evidenceItems.filter(e=>evidenceIsCurrent(e));
  const state=success ? (action.evidence_required && current.length===0 ? "OBSERVED" : "EXECUTED") : "FAILED";
  return {...action,status:state,actual_outcome:actualOutcome,evidence:evidenceItems,error,observed_at:now(),authority:false};
}

export function measureActionOutcome(action,{metrics=[],baseline={},verified=false}={}) {
  const outcome={
    id:id("outcome"), action_id:action?.id, verified:Boolean(verified),
    measured:true, expired:false, evidence:action?.evidence||[], metrics,
    valid_until:action?.expected_outcome?.valid_until??null,
    expected:action?.expected_outcome??null, actual:action?.actual_outcome??null
  };
  const measurement=measureOutcome(outcome,baseline);
  const status=measurement.state==="MEASURED_VERIFIED" ? "MEASURED" : "OBSERVED";
  return {...action,status,measurement,outcome,measured_at:now(),authority:false};
}

export function learnActionOutcome(measured,{capability={}}={}) {
  if(measured?.status!=="MEASURED") return {...measured,status:"OBSERVED",learning:null,authority:false};
  const learning=learnFromOutcome(measured.outcome);
  const revision=createCapabilityRevision(capability,measured.outcome);
  return {...measured,status:"LEARNED",learning,capability_revision:revision,authority:false,breaker_touched:false,learned_at:now()};
}

export function buildActionOutcomeRecord(input={}) {
  const action=createActionRequest(input);
  const authorized=authorizeAction(action,input.authorization||{});
  const begun=beginAction(authorized,input.execution||{});
  return {contract:CONTRACT,action:begun,authority:false,breaker_touched:false};
}

export function assertActionOutcomeConstitution(state={}) {
  if(state.authority===true) throw new Error("ACTION_FABRIC_CANNOT_GRANT_AUTHORITY");
  if(state.breaker_touched===true) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
  if(state.auto_authorize===true) throw new Error("AUTO_AUTHORIZATION_FORBIDDEN");
  if(state.auto_execute_consequential===true) throw new Error("CONSEQUENTIAL_EXECUTION_REQUIRES_AUTHORIZATION");
  if(state.hidden_learning===true) throw new Error("LEARNING_MUST_BE_TRACEABLE");
  return true;
}

/** Integration helper: create an execution task and its trace events without performing external effects. */
export function createExecutionTrace(action,{projectId="cortex",authorized=false}={}) {
  const task=createTask({projectId,kind:"CORTEX_ACTION",title:action?.intent||"Cortex action",effect:"EXTERNAL_EFFECT"});
  const started=startTask(task,{authorized});
  const events=[recordExecutionEvent({executionId:action?.id||"action",taskId:task.id,type:"ACTION_AUTHORIZATION",payload:{authorized}})];
  if(started.state==="RUNNING") events.push(recordExecutionEvent({executionId:action.id,taskId:task.id,type:"ACTION_STARTED",payload:{actor:action.actor,capability:action.capability}}));
  return {task:started,events,external_effect:false,authority:false};
}
