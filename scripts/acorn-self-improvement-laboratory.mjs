/** ACORN — SELF-IMPROVEMENT LABORATORY
 * Validates optimization candidates through simulation, controlled comparison,
 * retest and reverification before they can become adoption candidates.
 * Contract: acorn.self-improvement-laboratory.v1
 */
import crypto from "node:crypto";
import { createExperiment, simulateExperiment, comparePrediction, learnExperiment } from "./acorn-experimentation-digital-twin.mjs";
import { proposeAdoption } from "./acorn-self-optimization-conductor.mjs";

export const CONTRACT="acorn.self-improvement-laboratory.v1";
export const CYCLE=Object.freeze(["HYPOTHESIZE","BASELINE","SIMULATE","COMPARE","RETEST","REVERIFY","EVIDENCE","ADOPTION_CANDIDATE","REOBSERVE"]);

const A=v=>Array.isArray(v)?v:[];

export function createImprovementExperiment({candidate=null,baseline=null,variables=[]}={}){
  if(!candidate) return {state:"BLOCKED",reason:"CANDIDATE_REQUIRED",authority:false};
  const experiment=createExperiment({
    hypothesis:{candidate,statement:"candidate improvement must outperform or preserve the measured baseline"},
    baseline,variables,mode:"SIMULATION"
  });
  return {contract:CONTRACT,experiment,state:"PLANNED",authority:false,external_effect:false};
}

export function runSimulation(lab,{predicted=[]}={}){
  if(lab?.state==="BLOCKED") return lab;
  const simulated=simulateExperiment({experiment:lab.experiment,outcomes:predicted});
  return {...lab,experiment:simulated,state:"SIMULATED",external_effect:false,authority:false};
}

export function compareWithObservation(lab,{observed=[],verified=false}={}){
  if(!lab?.experiment) return {state:"BLOCKED",reason:"EXPERIMENT_REQUIRED",authority:false};
  const comparison=comparePrediction({predicted:A(lab.experiment.predicted),observed:A(observed)});
  return {...lab,comparison,verified:verified===true,state:"COMPARED",authority:false};
}

export function retestAndReverify(lab,{retest_observed=[],reverified=false}={}){
  if(!lab?.comparison) return {...lab,state:"BLOCKED",reason:"COMPARISON_REQUIRED"};
  const retest=comparePrediction({predicted:A(lab.experiment.predicted),observed:A(retest_observed)});
  const stable=lab.comparison.matches===true&&retest.matches===true&&reverified===true;
  const evidence={id:crypto.randomUUID(),type:"SELF_IMPROVEMENT_EVIDENCE",measured:true,verified:stable,
    baseline:lab.experiment.baseline,initial_match:lab.comparison.matches,retest_match:retest.matches};
  const learned=learnExperiment({comparison:{...retest,measured:true},verified:stable});
  const adoption=proposeAdoption({selected:lab.experiment.hypothesis.candidate},{simulation_passed:true,retest_passed:retest.matches,reverified});
  return {...lab,retest,stable,evidence,learned,adoption,state:stable?"ADOPTION_CANDIDATE":"HOLD_FOR_VALIDATION",authority:false,external_effect:false};
}

export function assertSelfImprovementConstitution(snapshot={}){
  const violations=[];
  if(snapshot.external_effect===true) violations.push("EXTERNAL_EFFECT");
  if(snapshot.authority===true) violations.push("AUTHORITY_ESCALATION");
  if(snapshot.auto_execute===true) violations.push("AUTO_EXECUTION");
  if(snapshot.auto_adopt===true) violations.push("AUTO_ADOPTION");
  if(snapshot.auto_authorize===true) violations.push("AUTO_AUTHORIZATION");
  if(snapshot.skip_baseline===true) violations.push("BASELINE_REQUIRED");
  if(snapshot.skip_retest===true) violations.push("RETEST_REQUIRED");
  if(snapshot.skip_reverification===true) violations.push("REVERIFICATION_REQUIRED");
  return {contract:CONTRACT,valid:violations.length===0,violations};
}
