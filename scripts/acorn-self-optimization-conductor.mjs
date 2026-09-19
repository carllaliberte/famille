/** ACORN — SELF-OPTIMIZATION CONDUCTOR
 * Composes existing knowledge, outcome, synaptic and resource fabrics.
 * It proposes bounded improvements from measured reality; it never authorizes or executes them.
 * Contract: acorn.self-optimization-conductor.v1
 */
import crypto from "node:crypto";
import { planKnowledgeLoop } from "./acorn-autonomous-knowledge-loop.mjs";
import { buildLearningFabric } from "./acorn-universal-outcome-learning-fabric.mjs";
import { optimizeSynapticGraph } from "./acorn-dynamic-synaptic-cognitive-fabric.mjs";
import { optimizeResourceAllocation } from "./acorn-cognitive-metabolism-resource-fabric.mjs";

export const CONTRACT="acorn.self-optimization-conductor.v1";
export const CYCLE=Object.freeze(["ASSESS","MEASURE","VERIFY","IDENTIFY_GAPS","GENERATE_OPTIONS","SCORE","SELECT","SIMULATE","RETEST","REVERIFY","ADOPT_CANDIDATE","REOBSERVE"]);

const A=v=>Array.isArray(v)?v:[];
const num=v=>Number.isFinite(Number(v))?Number(v):0;

export function buildOptimizationCycle({observations=[],outcome={},outcomes=[],synapses=[],resources=[],requests=[],capability=null}={}){
  const knowledge=planKnowledgeLoop({observations,capability});
  const learning=buildLearningFabric({outcome,outcomes,capability:{id:capability}});
  const synaptic=optimizeSynapticGraph({synapses,outcomes});
  const metabolism=optimizeResourceAllocation({resources,requests,outcomes});
  const candidates=[];
  if(knowledge.selected) candidates.push({kind:"KNOWLEDGE",id:knowledge.selected.candidate_id,score:num(knowledge.selected.score?.score)});
  for(const s of A(synaptic.synapses).filter(x=>x.learning?.state==="LEARNED").slice(0,5))
    candidates.push({kind:"SYNAPSE",id:s.id,score:num(s.score?.score)});
  if(metabolism.optimization==="CANDIDATE") candidates.push({kind:"RESOURCE",id:crypto.randomUUID(),score:0});
  if(learning.learning.state==="LEARNED") candidates.push({kind:"CAPABILITY",id:learning.revision.capability,score:1});
  candidates.sort((a,b)=>b.score-a.score||String(a.kind).localeCompare(String(b.kind)));
  return {
    contract:CONTRACT,cycle:CYCLE,
    state:"OPTIMIZATION_CANDIDATES",
    knowledge,learning,synaptic,metabolism,
    candidates,
    selected:candidates[0]??null,
    adoption:"CANDIDATE_ONLY",
    requires_retest:true,
    requires_reverification:true,
    authority:false,external_effect:false,auto_authorize:false,auto_execute:false,auto_spend:false
  };
}

export function proposeAdoption(cycle,{simulation_passed=false,retest_passed=false,reverified=false}={}){
  if(!cycle?.selected) return {state:"NO_CANDIDATE",authority:false};
  const ready=simulation_passed===true&&retest_passed===true&&reverified===true;
  return {
    state:ready?"ADOPTION_CANDIDATE":"HOLD_FOR_VALIDATION",
    candidate:cycle.selected,
    simulation_passed, retest_passed, reverified,
    human_authorization_required:true,
    auto_adopt:false,authority:false,external_effect:false
  };
}

export function assertSelfOptimizationConstitution(snapshot={}){
  const violations=[];
  if(snapshot.authority===true) violations.push("AUTHORITY_ESCALATION");
  if(snapshot.auto_authorize===true) violations.push("AUTO_AUTHORIZATION");
  if(snapshot.auto_execute===true) violations.push("AUTO_EXECUTION");
  if(snapshot.auto_adopt===true) violations.push("AUTO_ADOPTION");
  if(snapshot.auto_spend===true) violations.push("AUTO_SPEND");
  if(snapshot.external_effect===true) violations.push("EXTERNAL_EFFECT");
  if(snapshot.hidden_learning===true) violations.push("HIDDEN_LEARNING");
  if(snapshot.skip_retest===true) violations.push("RETEST_REQUIRED");
  if(snapshot.skip_reverification===true) violations.push("REVERIFICATION_REQUIRED");
  return {contract:CONTRACT,valid:violations.length===0,violations,one_cortex:true,no_new_authority:true};
}
