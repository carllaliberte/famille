/** ACORN — CORTEX MISSION CONDUCTOR
 * Integrates signal/intelligence discovery, capability composition, bounded action planning,
 * and outcome-learning into one traceable cognitive cycle.
 * It proposes; it never grants authority or performs consequential effects.
 */
import { intelligenceAdapter, qualifyIntelligence, buildAdaptiveIntelligenceGraph } from "./acorn-cortex-intelligence-adapter.mjs";
import { composeCapabilityTeam, selectTeam, buildCognitivePlan } from "./acorn-cortex-capability-composition.mjs";
import { createActionRequest, createExecutionTrace, assertActionOutcomeConstitution } from "./acorn-cortex-action-outcome-fabric.mjs";

export const CONTRACT="acorn.cortex-mission-conductor.v1";
const A=v=>Array.isArray(v)?v:[];
const now=()=>new Date().toISOString();

export function discoverAndQualifyIntelligences(participants=[],{
  required_capabilities=[],
  min_evidence=0
}={}) {
  const normalized=A(participants).map(p=>intelligenceAdapter(p));
  return normalized.map(i=>qualifyIntelligence(i,{
    required_capabilities,
    min_evidence,
    available:true
  }));
}

export function conductMission({
  goal,
  required_capabilities=[],
  participants=[],
  constraints={},
  min_evidence=0,
  steps=[],
  action=null,
  authorization={}
}={}) {
  if(!goal) throw new Error("GOAL_REQUIRED");

  const intelligences=discoverAndQualifyIntelligences(participants,{
    required_capabilities,
    min_evidence
  });
  const graph=buildAdaptiveIntelligenceGraph(intelligences);
  const composition=composeCapabilityTeam({
    goal,
    required_capabilities,
    intelligences,
    constraints,
    min_evidence
  });
  const team=selectTeam(composition);
  const plan=buildCognitivePlan({team,steps});

  let actionRecord=null;
  let executionTrace=null;
  if(action){
    const requested=createActionRequest({
      ...action,
      authorization
    });
    assertActionOutcomeConstitution(requested);
    actionRecord=requested;
    executionTrace=createExecutionTrace(requested,{
      projectId:action.projectId||"cortex",
      authorized:authorization?.authorized===true
    });
  }

  return {
    contract:CONTRACT,
    goal,
    state:composition.complete ? "MISSION_COMPOSABLE" : "CAPABILITY_GAP",
    intelligences,
    intelligence_graph:graph,
    composition,
    team,
    plan,
    action:actionRecord,
    execution_trace:executionTrace,
    requires_authorization:true,
    authority:false,
    breaker_touched:false,
    external_effect:false,
    learning_boundary:"OUTCOMES_MUST_BE_MEASURED_AND_VERIFIED_BEFORE_LEARNING",
    created_at:now()
  };
}

export function assertMissionConstitution(snapshot={}) {
  if(snapshot.authority===true) throw new Error("MISSION_CONDUCTOR_CANNOT_GRANT_AUTHORITY");
  if(snapshot.breaker_touched===true) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
  if(snapshot.external_effect===true) throw new Error("MISSION_CONDUCTOR_MUST_NOT_PERFORM_EXTERNAL_EFFECT");
  if(snapshot.auto_authorize===true) throw new Error("AUTO_AUTHORIZATION_FORBIDDEN");
  if(snapshot.auto_execute===true) throw new Error("AUTO_EXECUTION_FORBIDDEN");
  if(snapshot.learning_boundary!=="OUTCOMES_MUST_BE_MEASURED_AND_VERIFIED_BEFORE_LEARNING")
    throw new Error("LEARNING_BOUNDARY_INVALID");
  return true;
}
