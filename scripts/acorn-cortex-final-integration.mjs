/** ACORN — CORTEX FINAL INTEGRATION
 * Canonical orchestration boundary for the complete cognitive cycle.
 * This module composes existing Cortex fabrics instead of creating parallel runtimes.
 *
 * PERCEIVE → CONTEXTUALIZE → REMEMBER → DISCOVER → COMPOSE → PLAN → AUTHORIZE
 * → ACT → OBSERVE → MEASURE → VERIFY → LEARN → OPTIMIZE → REUSE → REOBSERVE
 */
import { conductMission, assertMissionConstitution } from "./acorn-cortex-mission-conductor.mjs";
import { createStateRecord, buildStateSnapshot, detectStateConflicts, rememberMission, createOutcomeMemory, assertStateMemoryConstitution } from "./acorn-cortex-state-memory-fabric.mjs";
import { buildLearningFabric, assertLearningConstitution } from "./acorn-universal-outcome-learning-fabric.mjs";
import { createActionRequest, authorizeAction, beginAction, observeAction, measureActionOutcome, learnActionOutcome, assertActionOutcomeConstitution } from "./acorn-cortex-action-outcome-fabric.mjs";

export const CONTRACT="acorn.cortex-final-integration.v1";
export const CYCLE=Object.freeze([
  "PERCEIVE","CONTEXTUALIZE","REMEMBER","DISCOVER","COMPOSE","PLAN",
  "AUTHORIZE","ACT","OBSERVE","MEASURE","VERIFY","LEARN","OPTIMIZE",
  "REUSE","REOBSERVE"
]);

const arr=v=>Array.isArray(v)?v:[];
const now=()=>new Date().toISOString();

export function assertCortexConstitution(snapshot={}){
  if(snapshot.authority===true) throw new Error("CORTEX_CANNOT_GRANT_AUTHORITY");
  if(snapshot.breaker_touched===true) throw new Error("CORTEX_MUST_NOT_TOUCH_BREAKER");
  if(snapshot.auto_authorize===true) throw new Error("AUTO_AUTHORIZATION_FORBIDDEN");
  if(snapshot.auto_execute===true) throw new Error("AUTO_EXECUTION_FORBIDDEN");
  if(snapshot.external_effect===true) throw new Error("CORTEX_EXTERNAL_EFFECT_FORBIDDEN");
  if(snapshot.hidden_learning===true) throw new Error("HIDDEN_LEARNING_FORBIDDEN");
  assertLearningConstitution();
  return true;
}

export function perceiveWorld(signals=[],{observed_at=now()}={}){
  const records=arr(signals).map((signal,i)=>createStateRecord({
    id:signal.id??`signal-${i}`,
    kind:signal.kind??"ENVIRONMENT_SIGNAL",
    value:signal.value??signal,
    source:signal.source??"UNKNOWN",
    observed_at:signal.observed_at??observed_at,
    valid_until:signal.valid_until??null,
    evidence:signal.evidence??[],
    measured:signal.measured===true,
    verified:signal.verified===true,
    version:signal.version??1
  }));
  return {
    state:"OBSERVED",
    records,
    snapshot:buildStateSnapshot(records),
    conflicts:detectStateConflicts(records),
    live:false,
    authority:false
  };
}

export function contextualizeWorld(perception,{context={},constraints={}}={}){
  const conflicts=perception?.conflicts??detectStateConflicts(perception?.records??[]);
  return {
    state:conflicts.state==="CONFLICTS_FOUND"?"CONTEXT_CONFLICT":"CONTEXTUALIZED",
    snapshot:perception?.snapshot??buildStateSnapshot(perception?.records??[]),
    context,
    constraints,
    conflicts,
    authority:false,
    live:false
  };
}

export function optimizeCortex({outcome={},baseline={},outcomes=[],weights={},capability={}}={}){
  const learning=buildLearningFabric({outcome,baseline,outcomes,weights,capability});
  const optimization=learning.learning.state==="LEARNED"
    ? {state:"OPTIMIZATION_CANDIDATE",route_updates:true,capability_updates:true,reuse:true}
    : {state:"OPTIMIZATION_BLOCKED",route_updates:false,capability_updates:false,reuse:false};
  return {learning,optimization,authority:false,live:false};
}

export function buildReuseDecision({outcome={},baseline={},outcomes=[],weights={},capability={}}={}){
  const optimized=optimizeCortex({outcome,baseline,outcomes,weights,capability});
  return {
    state:optimized.learning.learning.state==="LEARNED"?"REUSE_ELIGIBLE":"REUSE_BLOCKED",
    source:outcome?.id??null,
    optimization:optimized.optimization,
    authority:false,
    live:false
  };
}

/**
 * Full bounded cycle. No external effect is performed by this function.
 * An action can be proposed/authorized in the trace, but consequential execution
 * remains behind the existing execution/effect governance boundary.
 */
export function runCortexCycle({
  goal,
  required_capabilities=[],
  participants=[],
  constraints={},
  min_evidence=0,
  steps=[],
  signals=[],
  context={},
  action=null,
  authorization={},
  execution={},
  observation={},
  outcome=null,
  baseline={},
  outcomes=[],
  weights={},
  capability={}
}={}){
  if(!goal) throw new Error("GOAL_REQUIRED");

  const perception=perceiveWorld(signals);
  const contextualized=contextualizeWorld(perception,{context,constraints});

  const mission=conductMission({
    goal,required_capabilities,participants,constraints,min_evidence,steps,
    action:null,authorization
  });
  assertMissionConstitution(mission);

  const memory=rememberMission(mission,contextualized.snapshot.records);
  assertStateMemoryConstitution(memory);

  let actionTrace=null;
  let measured=null;
  let learned=null;
  if(action){
    const requested=createActionRequest({...action,authorization});
    assertActionOutcomeConstitution(requested);
    const authorized=authorizeAction(requested,authorization);
    const begun=beginAction(authorized,execution);
    if(observation && begun.status==="EXECUTING"){
      const observed=observeAction(begun,observation);
      measured=measureActionOutcome(observed,{
        metrics:observation.metrics??[],
        baseline,
        verified:observation.verified===true
      });
      learned=learnActionOutcome(measured,{capability});
      actionTrace={requested,authorized,begun,observed,measured,learned};
    } else {
      actionTrace={requested,authorized,begun};
    }
  }

  const effectiveOutcome=outcome??measured?.outcome??null;
  const optimization=effectiveOutcome
    ? optimizeCortex({outcome:effectiveOutcome,baseline,outcomes,weights,capability})
    : {learning:null,optimization:{state:"WAITING_FOR_MEASURED_OUTCOME"},authority:false,live:false};
  const reuse=effectiveOutcome
    ? buildReuseDecision({outcome:effectiveOutcome,baseline,outcomes,weights,capability})
    : {state:"REUSE_BLOCKED",source:null,authority:false,live:false};

  const completedCycle=Boolean(
    perception.state==="OBSERVED" &&
    ["CONTEXTUALIZED","CONTEXT_CONFLICT"].includes(contextualized.state) &&
    mission &&
    memory
  );

  const next_state=actionTrace?.learned?.status==="LEARNED"
    ? reuse.state
    : effectiveOutcome
      ? optimization.optimization.state
      : "OBSERVE_OR_MEASURE";

  return {
    contract:CONTRACT,
    cycle:CYCLE,
    state:completedCycle?"CYCLE_BUILT":"CYCLE_INCOMPLETE",
    perception,
    context:contextualized,
    mission,
    memory,
    action:actionTrace,
    optimization,
    reuse,
    next_state,
    authority:false,
    breaker_touched:false,
    external_effect:false,
    live:false,
    truth:"LEARNING != AUTHORITY != LIVE",
    created_at:now()
  };
}
