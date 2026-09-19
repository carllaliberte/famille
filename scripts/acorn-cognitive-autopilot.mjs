/** ACORN — GOVERNED COGNITIVE AUTOPILOT
 * Closes the operational loop across reality, knowledge, self-model,
 * self-optimization and experimentation. It can continuously decide WHAT
 * should happen next, but authorization and consequential execution remain
 * outside this conductor.
 * Contract: acorn.cognitive-autopilot.v1
 */
import crypto from "node:crypto";
import { planKnowledgeLoop } from "./acorn-autonomous-knowledge-loop.mjs";
import { buildOptimizationCycle } from "./acorn-self-optimization-conductor.mjs";
import { createOperationalSelfModel, diagnoseSelf, planSelfReobservation } from "./acorn-operational-self-model.mjs";
import { createImprovementExperiment } from "./acorn-self-improvement-laboratory.mjs";

export const CONTRACT="acorn.cognitive-autopilot.v1";
export const CYCLE=Object.freeze([
  "PERCEIVE","ASSESS_STATE","ASSESS_SELF","IDENTIFY_GAPS",
  "PLAN_KNOWLEDGE","PLAN_OPTIMIZATION","EXPERIMENT","SELECT_NEXT_STEP",
  "REQUEST_AUTHORIZATION","EXECUTE_THROUGH_EXISTING_GOVERNANCE",
  "OBSERVE","MEASURE","VERIFY","LEARN","REOPTIMIZE","REOBSERVE"
]);

const A=v=>Array.isArray(v)?v:[];

export function buildCognitiveAutopilot({
  observations=[],outcome={},outcomes=[],synapses=[],resources=[],requests=[],
  capabilities=[],intelligences=[],uncertainties=[],errors=[],requirements=[],
  candidate=null,baseline=null,variables=[]
}={}){
  const self=createOperationalSelfModel({capabilities,intelligences,resources,uncertainties,errors,outcomes});
  const diagnosis=diagnoseSelf({model:self,requirements,observed_failures:errors});
  const knowledge=planKnowledgeLoop({observations,capability:requirements[0]??null});
  const optimization=buildOptimizationCycle({observations,outcome,outcomes,synapses,resources,requests,capability:requirements[0]??null});
  const experiment=candidate?createImprovementExperiment({candidate,baseline,variables}):null;

  const options=[];
  if(diagnosis.gaps.length) options.push({kind:"SELF_REOBSERVE",priority:1,plan:planSelfReobservation({diagnosis})});
  if(knowledge.selected) options.push({kind:"KNOWLEDGE",priority:Number(knowledge.selected.score?.score??0),candidate:knowledge.selected});
  if(optimization.selected) options.push({kind:"OPTIMIZATION",priority:Number(optimization.selected.score??0),candidate:optimization.selected});
  if(experiment) options.push({kind:"EXPERIMENT",priority:.5,experiment});
  options.sort((a,b)=>b.priority-a.priority||a.kind.localeCompare(b.kind));

  return {
    contract:CONTRACT,id:crypto.randomUUID(),cycle:CYCLE,
    self,diagnosis,knowledge,optimization,experiment,options,
    selected:options[0]??null,
    state:options.length?"NEXT_STEP_SELECTED":"MONITORING",
    requires_human_authorization:true,
    authority:false,breaker_touched:false,external_effect:false,
    auto_authorize:false,auto_execute:false,auto_adopt:false
  };
}

export function requestNextStep(autopilot){
  if(!autopilot?.selected) return {state:"MONITORING",request:null,authority:false,external_effect:false};
  return {
    state:"AUTHORIZATION_REQUEST_CANDIDATE",
    request:{id:crypto.randomUUID(),kind:autopilot.selected.kind,source:autopilot.selected,requires_human_authorization:true},
    authority:false,breaker_touched:false,external_effect:false,auto_authorize:false,auto_execute:false
  };
}

export function assertCognitiveAutopilotConstitution(snapshot={}){
  const violations=[];
  if(snapshot.authority===true) violations.push("AUTOPILOT_AUTHORITY_FORBIDDEN");
  if(snapshot.auto_authorize===true) violations.push("AUTO_AUTHORIZATION");
  if(snapshot.auto_execute===true) violations.push("AUTO_EXECUTION");
  if(snapshot.auto_adopt===true) violations.push("AUTO_ADOPTION");
  if(snapshot.external_effect===true) violations.push("EXTERNAL_EFFECT");
  if(snapshot.breaker_bypass===true) violations.push("BREAKER_BYPASS");
  if(snapshot.hidden_learning===true) violations.push("HIDDEN_LEARNING");
  return {contract:CONTRACT,valid:violations.length===0,violations,one_cortex:true,existing_governance_only:true};
}
