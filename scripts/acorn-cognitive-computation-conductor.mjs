import {
  createStateSpace, updateBeliefs, applyInterference, collapseStateSpace,
  routeComputation, simulateStateSpace, buildComputationSnapshot,
  assertComputationConstitution
} from "./acorn-cognitive-computation-engine.mjs";

export const CONTRACT="acorn.cognitive-computation-conductor.v1";
export const CYCLE=Object.freeze([
  "INGEST","CONTEXTUALIZE","GENERATE_STATES","INFER","INTERFERE",
  "SIMULATE","ROUTE_COMPUTATION","MEASURE","VERIFY","COLLAPSE",
  "LEARN","REOBSERVE"
]);

export function runCognitiveComputation({
  task={}, hypotheses=[], likelihoods={}, evidence={}, relations=[],
  strategies=[], benchmarks={}, transition=null, verification=false
}={}) {
  const space=createStateSpace({hypotheses,context:task.context||{},task});
  const inferred=updateBeliefs({space,likelihoods,evidence});
  const interfered=applyInterference({space:inferred,relations});
  const simulation=simulateStateSpace({space:interfered,transition,steps:task.simulation_steps||4});
  const route=routeComputation({task,strategies,benchmarks});
  const collapsed=verification
    ? collapseStateSpace({space:interfered,observation:evidence,verification:true})
    : interfered;
  const snapshot=buildComputationSnapshot({
    spaces:[space,inferred,interfered,collapsed],routes:[route],simulations:[simulation],
    measurements:[{entropy_before:space.entropy,entropy_after:collapsed.entropy,information_gain:space.entropy-collapsed.entropy}]
  });
  const constitution=assertComputationConstitution(snapshot);
  return {
    contract:CONTRACT,cycle:CYCLE,space, inferred, interfered, simulation, route,
    collapsed, snapshot, constitution,
    next_action:verification?"LEARN_AND_REOBSERVE":"OBSERVE_AND_VERIFY",
    authority:false,auto_authorize:false,auto_execute:false,live:false
  };
}
