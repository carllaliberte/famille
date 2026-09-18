/** ACORN — CORTEX EXECUTIVE ORCHESTRATION
 * Turns the measured collective state into ranked, traceable proposals.
 * It recommends coordination; it never becomes autonomous authority.
 */
export const CONTRACT="acorn.cortex-executive-orchestration.v1";
export const SIGNAL_TYPES=Object.freeze(["NEED","OPPORTUNITY","RISK","BLOCKER","CHANGE","OUTCOME"]);
const arr=v=>Array.isArray(v)?v:[]; const n=v=>Number.isFinite(Number(v))?Number(v):0;
export function synthesizeSituation({state={},signals=[],knowledge=[],capabilities=[],outcomes=[]}={}) {
 const fresh=arr(signals).filter(s=>s.state!=="EXPIRED");
 return {contract:CONTRACT,environment:state,signals:fresh,knowledge_count:arr(knowledge).length,capabilities_count:arr(capabilities).length,outcomes_count:arr(outcomes).length,coherence:fresh.length?1:0,state:"OBSERVED",authority:false,breaker_touched:false};
}
export function prioritizeSignals({signals=[],objectives=[]}={}) {
 const weights=new Map(arr(objectives).map(o=>[o.name,n(o.weight,1)]));
 return arr(signals).map(s=>({...s,priority:n(s.impact,1)*n(s.urgency,1)*n(weights.get(s.objective),1)})).sort((a,b)=>b.priority-a.priority);
}
export function identifyLeverage({signals=[],capabilities=[],knowledge=[]}={}) {
 return arr(signals).map(s=>({signal:s.id||s.type,capabilities:arr(capabilities).filter(c=>arr(s.required_capabilities).includes(c.name||c)),knowledge:arr(knowledge).filter(k=>k.subject===s.subject||k.predicate===s.type).map(k=>k.id),state:"PROPOSED",authority:false}));
}
export function buildActionPortfolio({prioritized=[],leverage=[],constraints={}}={}) {
 return arr(prioritized).map((s,i)=>({id:`proposal:${i+1}`,signal:s.id||s.type,priority:s.priority||0,leverages:arr(leverage).filter(x=>x.signal===(s.id||s.type)).map(x=>x.capabilities).flat(),constraints,state:"PROPOSED",requires_human_authorization:true,external_effect:false,authority:false,auto_execute:false,breaker_touched:false}));
}
export function detectFeedback({portfolio=[],outcomes=[]}={}) {
 return arr(portfolio).map(p=>({proposal:p.id,outcome:arr(outcomes).find(o=>o.proposal===p.id)||null,learned:!!arr(outcomes).find(o=>o.proposal===p.id),state:"MEASURED",authority:false,breaker_touched:false}));
}
export function buildCortexCycle(input={}) {
 const situation=synthesizeSituation(input);
 const prioritized=prioritizeSignals({signals:situation.signals,objectives:input.objectives});
 const leverage=identifyLeverage({signals:prioritized,capabilities:input.capabilities,knowledge:input.knowledge});
 const portfolio=buildActionPortfolio({prioritized,leverage,constraints:input.constraints});
 return {contract:CONTRACT,situation,prioritized,portfolio,cycle:"OBSERVE→UNDERSTAND→PRIORITIZE→COMPOSE→PROPOSE→AUTHORIZE→EXECUTE→MEASURE→LEARN",state:"PROPOSED",authority:false,breaker_touched:false};
}
export function assertCortexExecutiveConstitution(s={}) {
 if(s.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(s.auto_execute) throw new Error("AUTO_EXECUTION_FORBIDDEN");
 if(s.authority_transfer) throw new Error("AUTHORITY_TRANSFER_FORBIDDEN");
 if(s.hidden_learning) throw new Error("HIDDEN_LEARNING_FORBIDDEN");
 return true;
}