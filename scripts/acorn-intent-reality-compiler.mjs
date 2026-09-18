import crypto from "node:crypto";
import { compileIntent, discoverCapabilityForDemand, composeSolution, compileCommercialPath, recordExecutionOutcome, deriveReusableAssets } from "./acorn-universal-value-fabric.mjs";
import { selectBestKnownResult, buildAdaptationPlan } from "./acorn-best-known-result.mjs";

export const INTENT_REALITY_COMPILER_VERSION="acorn.intent-reality-compiler.v1";
export const COMPILER_STATES=Object.freeze(["INTAKE","QUALIFIED","DISCOVERED","COMPOSED","OFFERED","ORDERED","PAID_OBSERVED","AUTHORIZED","EXECUTED","MEASURED","DELIVERED","CAPABILITY_DERIVED","ADAPTATION_PROPOSED","HUMAN_HOLD"]);
const id=(p)=>p+"_"+crypto.randomUUID();

function hold(reason,data={}){return {version:INTENT_REALITY_COMPILER_VERSION,state:"HUMAN_HOLD",reason,...data,authority:"human",auto_merge:false};}

export function compileHumanIntent(input={}) {
  const intent=compileIntent(input);
  if(intent.state!=="QUALIFIED") return hold(intent.reason,{intent});
  const capabilities=Array.isArray(input.capabilities)?input.capabilities:[];
  const discovered=discoverCapabilityForDemand({need:intent.need,capabilities});
  if(!discovered.length) return {version:INTENT_REALITY_COMPILER_VERSION,state:"DISCOVERED",reason:"CAPABILITY_GAP",need:intent.need,tasks:intent.tasks,discovered:[],authority:"human",auto_merge:false};
  const best=selectBestKnownResult(discovered.map((c)=>({
    id:c.id,problem:intent.need.id,provider:c.provider||c.id,method:c.method||"capability",
    measured_at:c.measured_at,valid_until:c.valid_until,metrics:c.metrics||{match_score:c.match_score},
    evidence:c.evidence||[],constraints:c.constraints||[],satisfies_constraints:c.satisfies_constraints!==false
  })),{metric:"quality",direction:"max",scope:intent.need.id});
  return {version:INTENT_REALITY_COMPILER_VERSION,state:"DISCOVERED",need:intent.need,tasks:intent.tasks,discovered,best_known:best,authority:"human",auto_merge:false};
}

export function compileProject(input={}) {
  const discovery=compileHumanIntent(input);
  if(discovery.state!=="DISCOVERED") return discovery;
  const components=(discovery.discovered||[]).filter(c=>c.reusable!==false);
  const composition=composeSolution({need:discovery.need,capabilities:components,compatibility:input.compatibility||[],evidence:input.evidence||[]});
  if(composition.state!=="COMPOSED") return hold("COMPOSITION_NOT_PROVEN",{discovery,composition});
  const commercial=compileCommercialPath({project:composition.project,offer:input.offer,order:input.order,payment:input.payment});
  return {version:INTENT_REALITY_COMPILER_VERSION,state:commercial.state==="PAYMENT_OBSERVED"?"PAID_OBSERVED":commercial.state==="ORDERED"?"ORDERED":commercial.state==="OFFERED"?"OFFERED":"COMPOSED",discovery,composition,commercial,authority:"human",auto_merge:false};
}

export function recordReality({project,execution,evidence=[],measurements=[],customerValidation=null}={}) {
  const result=recordExecutionOutcome({project,execution,evidence,measurements,customerValidation});
  if(result.state==="BLOCKED") return hold(result.reason,{result});
  return {version:INTENT_REALITY_COMPILER_VERSION,state:customerValidation?.validated?"MEASURED":"EXECUTED",reality:result,authority:"human",auto_merge:false};
}

export function closeAndLearn({project,outcome,capabilities=[],rights=[],evidence=[],marketSignals=[],capabilitySignals=[],futureSignals=[]}={}) {
  const reuse=deriveReusableAssets({project,outcome,capabilities,rights,evidence});
  const adaptation=buildAdaptationPlan({current:{project_id:project?.id,outcome_id:outcome?.id},marketSignals,capabilitySignals,futureSignals});
  return {version:INTENT_REALITY_COMPILER_VERSION,state:reuse.state==="REUSABLE"?"CAPABILITY_DERIVED":"ADAPTATION_PROPOSED",reuse,adaptation,next:"DISCOVER_AGAIN",authority:"human",auto_merge:false};
}

export function compileIntentToReality(input={}) {
  const project=compileProject(input);
  return Object.freeze({
    version:INTENT_REALITY_COMPILER_VERSION,
    state:project.state,
    project,
    law:"INTENTION → REALITY → MEASUREMENT → CAPABILITY → NEW OPPORTUNITY",
    authority:"human",auto_merge:false,
    compiler_id:id("compiler")
  });
}
