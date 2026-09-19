/** ACORN — COGNITIVE REALITY BRIDGE
 * Canonical bridge: Live World Activation → Cognitive Reality Fabric → World Model → Cortex.
 * It composes existing fabrics; it is not a second runtime or brain.
 * Contract: acorn.cognitive-reality-bridge.v1
 */
import { createActivationRequest, recordActivationObservation, buildWorldSignal, routeActivation } from "./acorn-live-world-activation-fabric.mjs";
import { createFabric, addObservation, snapshotFabric, informationGain, riskAdjustedInformationGain } from "./acorn-cognitive-reality-fabric.mjs";
import { buildWorldModel, worldModelGaps } from "./acorn-environmental-perception-world-model.mjs";

export const CONTRACT="acorn.cognitive-reality-bridge.v1";
export const STAGES=Object.freeze(["ACTIVATE","OBSERVE","NORMALIZE","ASSESS_FRESHNESS","RECONCILE","MODEL","EXPOSE_GAPS","FEED_CORTEX"]);

export function buildRealityBridge({ connector_id, capability=null, source=null, observation={}, previous=[] }={}){
  const activation=createActivationRequest({connector_id,capability});
  const measured=recordActivationObservation(activation,{...observation,source:source??observation.source});
  const signal=buildWorldSignal(measured);
  const fabric=createFabric({nodeId:"acorn-cortex"});
  for(const row of previous) addObservation(fabric,row);
  const before=[...fabric.observations.values()];
  addObservation(fabric,{id:signal.signal_id,subject:connector_id,predicate:capability??"CONNECTIVITY",value:signal.state,observer:"acorn",timestamp:signal.observed_at,source:signal.source,evidence:signal.evidence,epistemic_state:signal.verified?"VERIFIED":"OBSERVED",observability:signal.live?"VERIFIED":"DIRECT"});
  const reality=snapshotFabric(fabric);
  const gain=informationGain({before,after:reality.observations});
  const world=buildWorldModel({signals:[signal]});
  const gaps=worldModelGaps(world);
  return {
    contract:CONTRACT,stages:STAGES,
    activation:measured,signal,reality,world,gaps,
    information_gain:gain,
    state:measured.live?"LIVE_VERIFIED":"OBSERVED",
    live:measured.live===true,
    authority:false,external_effect:false
  };
}

export function routeRealityToCortex(bridge,{connectivity=null,nervous=null}={}){
  const routed=routeActivation(bridge?.activation,{connectivity,nervous});
  return {
    ...routed,
    reality_state:bridge?.reality?.counts?.contradictions>0?"CONFLICT":"READY",
    cortex_input: routed.ok===true ? bridge?.signal??null : null,
    authority:false,external_effect:false
  };
}

export function selectNextObservation(bridge,{risk=0,cost=0}={}){
  const gapCount=bridge?.gaps?.gaps?.length??0;
  const information=gapCount>0?Math.min(1,gapCount/3):0;
  return {
    action:gapCount>0?"REOBSERVE_GAPS":"CONTINUE_MONITORING",
    targets:bridge?.gaps?.gaps??[],
    score:riskAdjustedInformationGain({information,risk,cost,controlGapValue:bridge?.reality?.counts?.contradictions?1:0}),
    auto_execute:false,authority:false,live:false
  };
}

export function assertRealityBridgeConstitution(snapshot={}){
  const violations=[];
  if(snapshot.authority===true) violations.push("AUTHORITY_ESCALATION");
  if(snapshot.external_effect===true) violations.push("EXTERNAL_EFFECT");
  if(snapshot.bypass_connectivity===true) violations.push("CONNECTIVITY_BYPASS");
  if(snapshot.bypass_nervous_system===true) violations.push("NERVOUS_SYSTEM_BYPASS");
  if(snapshot.auto_execute===true) violations.push("AUTO_EXECUTION");
  if(snapshot.auto_authorize===true) violations.push("AUTO_AUTHORIZATION");
  return {contract:CONTRACT,valid:violations.length===0,violations,one_cortex:true,one_reality_fabric:true};
}
