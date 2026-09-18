/** ACORN — CORTEX TOTAL OPTIMIZER
 * Integrates knowledge, capabilities, outcomes and self-optimization into one adaptive loop.
 * This is coordination intelligence, not autonomous authority.
 */
import {scoreOptimization,proposeOptimization,learnOptimization} from "./acorn-self-optimization.mjs";
import {buildKnowledgeGraph,deriveInsight,routeKnowledge} from "./acorn-cortex-knowledge-fabric.mjs";
import {buildFederationGraph,composeFederatedPlan} from "./acorn-universal-ai-federation.mjs";
import {rankOffers,buildFailoverPlan} from "./acorn-universal-ai-exchange.mjs";

export const CONTRACT="acorn.cortex-total-optimizer.v1";
export const LOOP=Object.freeze(["OBSERVE","UNDERSTAND","CONNECT","DISCOVER","COMPOSE","SIMULATE","EXECUTE","MEASURE","COMPARE","LEARN","OPTIMIZE","REUSE"]);
const A=v=>Array.isArray(v)?v:[];
const finite=v=>Number.isFinite(Number(v));
export function buildCortexState({goal,objectives=[],knowledge=[],participants=[],offers=[],measurements=[],outcomes=[],constraints={}}={}) {
 const graph=buildKnowledgeGraph(knowledge);
 const federation=buildFederationGraph(participants);
 const routed=routeKnowledge({knowledge,need:constraints.knowledge_need});
 const ranked=rankOffers(offers,{budget:constraints.budget,reliability_weight:constraints.reliability_weight??.45,cost_weight:constraints.cost_weight??.3,latency_weight:constraints.latency_weight??.15});
 return {contract:CONTRACT,goal,loop:LOOP,objectives,knowledge_graph:graph,federation_graph:federation,knowledge_route:routed,offer_rank:ranked.map(x=>x.offer.id),failover:buildFailoverPlan(ranked),measurements,outcomes,state:"OBSERVED",authority:false,breaker_touched:false};
}
export function optimizeCortex({state,candidate,expected_gain=0,expected_cost=0,risk="UNKNOWN",evidence=[]}={}) {
 const proposal=proposeOptimization({current_state:state?.state,objectives:A(state?.objectives),measurements:A(state?.measurements),candidate,expected_gain,expected_cost,risk,evidence});
 return {...proposal,contract:CONTRACT,optimization_target:"CORTEX"};
}
export function evaluateCortex({before={},after={},objectives=[]}={}) {
 const measurements=A(objectives).map(o=>({objective:o.name,baseline:before[o.name],current:after[o.name],delta:finite(before[o.name])&&finite(after[o.name])?Number(after[o.name])-Number(before[o.name]):null}));
 return scoreOptimization({objectives,measurements});
}
export function deriveCortexKnowledge({knowledge=[],goal,minimum_confidence=.5}={}) {
 return deriveInsight({knowledge,goal,minimum_confidence});
}
export function composeCortexPlan({goal,participants=[],constraints={}}={}) {
 return composeFederatedPlan({goal,participants,constraints});
}
export function closeOptimizationCycle({history=[],latestOutcome}={}) {
 const h=[...A(history),latestOutcome].filter(Boolean);
 return learnOptimization({history:h});
}
export function cortexDecisionFrame({state,insight,plan,optimization,authorization="HUMAN_REQUIRED"}={}) {
 return {contract:"acorn.cortex-decision-frame.v1",state:state?.state??"UNKNOWN",insight,plan,optimization,authorization,decision_state:"PROPOSED",external_effect:false,authority:false,auto_merge:false,auto_spend:false,auto_signature:false,breaker_touched:false};
}
export function assertCortexTotalConstitution(s={}) {
 if(s.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(s.authority_transfer) throw new Error("CORTEX_CANNOT_TRANSFER_AUTHORITY");
 if(s.auto_merge) throw new Error("AUTO_MERGE_FORBIDDEN");
 if(s.auto_spend) throw new Error("AUTO_SPEND_FORBIDDEN");
 if(s.auto_signature) throw new Error("AUTO_SIGNATURE_FORBIDDEN");
 if(s.hidden_learning) throw new Error("HIDDEN_LEARNING_FORBIDDEN");
 return true;
}
