/** ACORN — OPERATIONAL SELF-MODEL
 * Turns measured runtime history into a current, provenance-aware model of
 * Acorn's capabilities, limitations, resources and uncertainty.
 * It observes itself; it does not grant itself authority.
 * Contract: acorn.operational-self-model.v1
 */
import crypto from "node:crypto";
import { buildSelfModel, recordLimitation, assessSelf } from "./acorn-self-model-metacognition.mjs";

export const CONTRACT="acorn.operational-self-model.v1";
export const CYCLE=Object.freeze(["COLLECT","NORMALIZE","MEASURE","VERIFY","UPDATE","DIAGNOSE","EXPOSE_LIMITS","IDENTIFY_GAPS","REOBSERVE"]);

const A=v=>Array.isArray(v)?v:[];

export function createOperationalSelfModel({capabilities=[],intelligences=[],resources=[],uncertainties=[],errors=[],outcomes=[]}={}){
  const measuredOutcomes=A(outcomes).filter(x=>x?.measured===true&&x?.verified===true);
  return {
    ...buildSelfModel({capabilities,intelligences,resources,uncertainties,errors}),
    contract:CONTRACT,cycle:CYCLE,
    evidence:{verified_outcomes:measuredOutcomes.length,total_outcomes:A(outcomes).length},
    observed_at:new Date().toISOString(),
    authority:false,live:false
  };
}

export function diagnoseSelf({model={},requirements=[],observed_failures=[]}={}){
  const assessment=assessSelf({capabilities:A(model.capabilities),requirements:A(requirements)});
  const limitations=A(observed_failures).map(f=>recordLimitation({
    kind:f.kind??"FAILURE",detail:f.detail??"UNSPECIFIED",evidence:A(f.evidence)
  }));
  const gaps=[...assessment.missing,...limitations.map(x=>x.kind)].filter(Boolean);
  return {
    contract:CONTRACT,capable:assessment.capable,missing:assessment.missing,
    limitations,gaps:[...new Set(gaps)],authority:false,external_effect:false
  };
}

export function updateOperationalSelfModel(model={},diagnosis={}){
  const id=crypto.randomUUID();
  const uncertainty=[...A(model.uncertainties),...A(diagnosis.gaps)];
  return {
    ...model,
    model_revision:id,
    uncertainties:[...new Set(uncertainty)],
    limitations:[...A(model.limitations),...A(diagnosis.limitations)],
    updated_at:new Date().toISOString(),
    authority:false,live:false
  };
}

export function planSelfReobservation({diagnosis={},max_targets=5}={}){
  return {
    state:diagnosis.gaps?.length?"REOBSERVE_LIMITS":"MONITOR",
    targets:A(diagnosis.gaps).slice(0,max_targets),
    auto_execute:false,authority:false,external_effect:false
  };
}

export function assertOperationalSelfModelConstitution(snapshot={}){
  const violations=[];
  if(snapshot.authority===true) violations.push("SELF_MODEL_AUTHORITY_FORBIDDEN");
  if(snapshot.auto_authorize===true) violations.push("SELF_MODEL_CANNOT_AUTHORIZE");
  if(snapshot.auto_execute===true) violations.push("SELF_MODEL_CANNOT_EXECUTE");
  if(snapshot.external_effect===true) violations.push("SELF_MODEL_CANNOT_EFFECT");
  if(snapshot.hidden_learning===true) violations.push("SELF_MODEL_LEARNING_MUST_BE_EXPLICIT");
  return {contract:CONTRACT,valid:violations.length===0,violations};
}
