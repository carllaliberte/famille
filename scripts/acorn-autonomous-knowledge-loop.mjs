/** ACORN — AUTONOMOUS KNOWLEDGE LOOP
 * Chooses the next bounded observation that would reduce uncertainty.
 * It may reason about what to observe; it never performs the observation.
 * Contract: acorn.autonomous-knowledge-loop.v1
 */
import crypto from "node:crypto";
import { buildRealityState, createRealityObservation, informationGain, riskAdjustedInformationGain } from "./acorn-cognitive-reality-fabric.mjs";

export const CONTRACT="acorn.autonomous-knowledge-loop.v1";
export const STATES=Object.freeze(["ASSESS","GAP_FOUND","CANDIDATES_BUILT","SELECTED","BLOCKED","WAITING_FOR_OBSERVATION","LEARNED"]);
const arr=v=>Array.isArray(v)?v:[];
const n=v=>Number.isFinite(Number(v))?Number(v):0;

export function assessKnowledge(observations=[],{at}={}){
  const reality=buildRealityState(observations,{at});
  const gaps=[];
  if(reality.state==="UNKNOWN") gaps.push({kind:"NO_CURRENT_EVIDENCE",priority:1});
  if(reality.state==="CONFLICT") gaps.push({kind:"CONFLICT",priority:1});
  if(reality.stale_observation_ids?.length) gaps.push({kind:"STALE_EVIDENCE",priority:.8,ids:reality.stale_observation_ids});
  if(reality.state==="OBSERVED" && !reality.verified) gaps.push({kind:"UNVERIFIED_OBSERVATION",priority:.7});
  return {state:gaps.length?"GAP_FOUND":"ASSESS",reality,gaps,authority:false,live:false};
}

export function buildObservationCandidates({gaps=[],capability=null,observations=[]}={}){
  const candidates=[];
  for(const gap of arr(gaps)){
    candidates.push({
      candidate_id:crypto.randomUUID(),
      kind:gap.kind,
      subject:gap.subject??capability??"UNKNOWN",
      capability:capability??null,
      purpose:gap.kind==="CONFLICT"?"RECONCILE_CONFLICT":"INCREASE_EVIDENCE",
      expected_information_gain:gap.priority??0,
      cost:0,
      risk:0,
      reversibility:"REVERSIBLE",
      requires_human_authorization:true,
      auto_execute:false
    });
  }
  if(!candidates.length) candidates.push({
    candidate_id:crypto.randomUUID(),kind:"MONITOR",subject:capability??"ENVIRONMENT",
    capability,purpose:"MAINTAIN_FRESHNESS",expected_information_gain:.1,cost:0,risk:0,
    reversibility:"REVERSIBLE",requires_human_authorization:true,auto_execute:false
  });
  return candidates;
}

export function scoreObservationCandidate(candidate,{control_gap=0,blast_radius=0}={}){
  return riskAdjustedInformationGain({
    information:n(candidate.expected_information_gain),
    risk:n(candidate.risk),cost:n(candidate.cost),
    controlGapValue:n(control_gap),blastRadiusValue:n(blast_radius)
  });
}

export function selectObservationCandidate(candidates=[],opts={}){
  const scored=arr(candidates).map(candidate=>({...candidate,score:scoreObservationCandidate(candidate,opts)}));
  // Deterministic ordering is deliberate; this is a bounded selection heuristic, not an optimum claim.
  scored.sort((a,b)=>(b.score.score-a.score.score)||String(a.kind).localeCompare(String(b.kind))||String(a.candidate_id).localeCompare(String(b.candidate_id)));
  return scored[0]??null;
}

export function planKnowledgeLoop({observations=[],capability=null,gaps=null,control_gap=0,blast_radius=0}={}){
  const assessment=assessKnowledge(observations);
  const targetGaps=gaps??assessment.gaps;
  const candidates=buildObservationCandidates({gaps:targetGaps,capability,observations});
  const selected=selectObservationCandidate(candidates,{control_gap,blast_radius});
  return {
    contract:CONTRACT,state:selected?"SELECTED":"BLOCKED",
    assessment,candidates,selected,
    next:"WAITING_FOR_OBSERVATION",
    authority:false,external_effect:false,auto_execute:false,live:false
  };
}

export function recordKnowledgeOutcome(plan,{observation=null,verified=false,measured=false}={}){
  if(!plan?.selected) return {state:"BLOCKED",reason:"NO_SELECTED_OBSERVATION",authority:false,live:false};
  if(!observation) return {state:"WAITING_FOR_OBSERVATION",selected:plan.selected,authority:false,live:false};
  const row=createRealityObservation({...observation,measured,verified});
  return {
    state:verified&&measured?"LEARNED":"OBSERVED",
    selected:plan.selected,observation:row,
    information_gain:informationGain({before:[],after:[row]}),
    authority:false,external_effect:false,live:false
  };
}

export function assertKnowledgeLoopConstitution(snapshot={}){
  const violations=[];
  if(snapshot.auto_execute===true) violations.push("AUTO_OBSERVATION_FORBIDDEN");
  if(snapshot.auto_authorize===true) violations.push("AUTO_AUTHORIZATION_FORBIDDEN");
  if(snapshot.authority===true) violations.push("AUTHORITY_ESCALATION");
  if(snapshot.external_effect===true) violations.push("EXTERNAL_EFFECT");
  if(snapshot.hidden_learning===true) violations.push("HIDDEN_LEARNING");
  return {contract:CONTRACT,valid:violations.length===0,violations,bounded_selection:true};
}
