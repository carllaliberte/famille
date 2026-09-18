/** ACORN — CORTEX OPERATING LOOP
 * Continuous environmental cognition: signal -> context -> decision proposal -> action plan -> outcome -> learning.
 * Coordination is automatic; authority is not.
 */
export const CONTRACT="acorn.cortex-operating-loop.v1";
export const SIGNALS=Object.freeze(["WORLD_CHANGE","KNOWLEDGE_UPDATE","CAPABILITY_CHANGE","DEMAND","RISK","OPPORTUNITY","OUTCOME"]);
export const STATES=Object.freeze(["RECEIVED","CONTEXTUALIZED","COMPOSED","PROPOSED","AUTHORIZED","EXECUTING","MEASURED","LEARNED","EXPIRED"]);
const arr=v=>Array.isArray(v)?v:[]; const n=v=>Number.isFinite(Number(v))?Number(v):0;
export function receiveSignal({type,payload,source,evidence=[],observed_at=new Date().toISOString()}={}) {
 if(!SIGNALS.includes(type)) throw new Error("SIGNAL_UNSUPPORTED");
 return {id:`signal:${type}:${Date.now()}`,type,payload,source,evidence:arr(evidence),observed_at,state:"RECEIVED",authority:false,breaker_touched:false};
}
export function contextualizeSignal(signal,{knowledge=[],capabilities=[],constraints=[]}={}) {
 return {...signal,state:"CONTEXTUALIZED",context:{knowledge_ids:arr(knowledge).map(x=>x.id||x),capabilities:arr(capabilities).map(x=>x.id||x),constraints},authority:false,breaker_touched:false};
}
export function composeResponse({signal,options=[],objectives=[]}={}) {
 const scored=arr(options).map((o,i)=>({...o,score:n(o.expected_value)-n(o.cost)-n(o.risk),rank:i}));
 scored.sort((a,b)=>b.score-a.score);
 return {contract:"acorn.cortex-composition.v1",signal_id:signal?.id,objectives,options:scored,state:"COMPOSED",selected:null,authority:false,requires_authorization:true,breaker_touched:false};
}
export function proposeNextBestAction(composition,{min_score=-Infinity}={}) {
 const selected=arr(composition?.options).find(o=>o.score>=min_score)||null;
 return {contract:"acorn.next-best-action.v1",signal_id:composition?.signal_id,candidate:selected,state:"PROPOSED",reason:selected?"best_scored_candidate":"NO_QUALIFIED_CANDIDATE",requires_authorization:true,authority:false,breaker_touched:false};
}
export function recordOutcome({proposal,actual_value=null,actual_cost=null,quality=null,evidence=[]}={}) {
 return {proposal_id:proposal?.signal_id,actual_value,actual_cost,quality,evidence:arr(evidence),state:"MEASURED",measured_at:new Date().toISOString(),authority:false,breaker_touched:false};
}
export function learnFromOutcome(outcome,{threshold=0}={}) {
 const net=outcome.actual_value===null||outcome.actual_cost===null?null:n(outcome.actual_value)-n(outcome.actual_cost);
 return {source:outcome.proposal_id,net_value:net,pattern_state:net!==null&&net>threshold?"REUSE_CANDIDATE":"DO_NOT_REUSE",state:"LEARNED",requires_validation:true,authority:false,breaker_touched:false};
}
export function buildContinuousLoop({signals=[],knowledge=[],capabilities=[],constraints=[],options=[],objectives=[]}={}) {
 const received=arr(signals); const contextualized=received.map(s=>contextualizeSignal(s,{knowledge,capabilities,constraints}));
 return {contract:CONTRACT,signals:contextualized.map(s=>s.id),contexts:contextualized.length,composition:composeResponse({signal:contextualized[0],options,objectives}),continuous:true,authority:false,breaker_touched:false};
}
export function assertCortexOperatingConstitution(s={}) {
 if(s.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(s.auto_authorize) throw new Error("AUTO_AUTHORIZATION_FORBIDDEN");
 if(s.auto_execute_consequential) throw new Error("CONSEQUENTIAL_EXECUTION_REQUIRES_AUTHORIZATION");
 if(s.hidden_learning) throw new Error("LEARNING_MUST_BE_TRACEABLE");
 return true;
}
