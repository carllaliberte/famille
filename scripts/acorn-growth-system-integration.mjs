/** ACORN Growth System Integration — connects the growth-capacity ladder into one governed system loop. */
import {runGrowthCapacityEngine,assertGrowthCapacityConstitution} from "./acorn-growth-capacity-engine.mjs";
import {runGrowthAmplification,assertGrowthAmplificationConstitution} from "./acorn-growth-amplification-engine.mjs";
import {runCapabilityCompounding,assertCapabilityCompoundingConstitution} from "./acorn-capability-compounding-engine.mjs";
import {runCombinatorialCapabilitySpace,assertCombinatorialCapabilitySpaceConstitution} from "./acorn-combinatorial-capability-space-engine.mjs";
import {runGrowthSelection,assertGrowthSelectionConstitution} from "./acorn-growth-selection-engine.mjs";

export const CONTRACT="acorn.growth-system-integration.v1";
export const CYCLE=Object.freeze(["MEASURE_CAPACITY","DISCOVER_BOTTLENECKS","MAP_MULTIPLIERS","EXPAND_CAPABILITY_SPACE","COMPOUND_CAPABILITIES","SCORE_GROWTH_LEVERAGE","BUILD_GOVERNED_PORTFOLIO","SIMULATE","TEST","MEASURE","VERIFY","REBALANCE","REOBSERVE"]);

const A=x=>Array.isArray(x)?x:[];
export function buildGrowthSystem(input={}){
  const capacity=runGrowthCapacityEngine(input);
  const amplification=runGrowthAmplification(input);
  const compounding=runCapabilityCompounding(input);
  const space=runCombinatorialCapabilitySpace(input);
  const candidates=[
    ...A(space.diversified?.candidates),
    ...A(compounding.frontier?.candidates),
    ...A(amplification.multipliers?.multipliers),
    ...A(capacity.levers)
  ].map((x,i)=>({...x,id:x.id??`growth-${i}`}));
  const selection=runGrowthSelection({...input,candidates});
  const frontier_size=candidates.length;
  return {
    contract:CONTRACT,cycle:CYCLE,
    capacity,amplification,compounding,space,
    unified_frontier:{size:frontier_size,candidates},
    selection,
    state:selection.batch?.batch?.length?"GROWTH_SYSTEM_PORTFOLIO_READY":"REOBSERVE_GROWTH_SYSTEM",
    next_action:selection.next_action,
    authority:false,auto_authorize:false,auto_execute:false,auto_adopt:false,auto_promote:false,auto_spend:false,live:false,
    integration:{single_growth_loop:true,parallel_growth_layers:false,governed_selection:true,verified_learning_only:true}
  };
}
export function assertGrowthSystemConstitution(x={}){
  const checks=[
    assertGrowthCapacityConstitution(x),
    assertGrowthAmplificationConstitution(x),
    assertCapabilityCompoundingConstitution(x),
    assertCombinatorialCapabilitySpaceConstitution(x),
    assertGrowthSelectionConstitution(x)
  ];
  const violations=[...new Set(checks.flatMap(c=>c.violations||[]))];
  return {contract:CONTRACT,valid:violations.length===0,violations};
}
export function summarizeGrowthSystem(s={}){
  return {contract:CONTRACT,state:s.state??"UNKNOWN",frontier_size:s.unified_frontier?.size??0,capacity_signal:s.capacity?.metrics?.growth_signal??0,amplification_signal:s.amplification?.metrics?.amplification_signal??0,compound_candidates:s.compounding?.frontier?.candidates?.length??0,space_candidates:s.space?.diversified?.candidates?.length??0,governed_batch:s.selection?.batch?.batch?.length??0,next_action:s.next_action??null,authority:false,live:false};
}
