/** ACORN — CORTEX SIGNAL FABRIC
 * Turns environmental observations into prioritized, traceable cognitive signals.
 */
export const CONTRACT="acorn.cortex-signal-fabric.v1";
export const SIGNAL_TYPES=Object.freeze(["CHANGE","NEED","OPPORTUNITY","RISK","CAPABILITY","KNOWLEDGE","OUTCOME","CONSTRAINT"]);
export const PRIORITIES=Object.freeze(["LOW","NORMAL","HIGH","CRITICAL"]);
const arr=v=>Array.isArray(v)?v:[]; const now=()=>new Date().toISOString();
export function emitSignal({type,subject,payload={},source,evidence=[],priority="NORMAL",expires_at=null}={}) {
 if(!SIGNAL_TYPES.includes(type)) throw new Error("SIGNAL_TYPE_UNSUPPORTED");
 if(!subject||!source) throw new Error("SIGNAL_IDENTITY_REQUIRED");
 if(!PRIORITIES.includes(priority)) throw new Error("PRIORITY_INVALID");
 return {id:`signal:${type.toLowerCase()}:${subject}:${Date.now()}`,type,subject,payload,source,evidence:arr(evidence),priority,expires_at,state:"OBSERVED",created_at:now(),authority:false,external_effect:false,breaker_touched:false};
}
export function qualifySignal(signal,{minimum_evidence=1}={}) {
 const qualified=arr(signal.evidence).length>=minimum_evidence;
 return {...signal,state:qualified?"QUALIFIED":"OBSERVED",qualified,authority:false,breaker_touched:false};
}
export function correlateSignals(signals=[]) {
 const groups=new Map();
 for(const s of arr(signals)){const key=`${s.type}:${s.subject}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(s.id);}
 return {contract:CONTRACT,groups:[...groups.entries()].map(([key,ids])=>({key,signal_ids:ids,count:ids.length})),state:"CORRELATED",breaker_touched:false};
}
export function prioritizeSignals(signals=[],context={}) {
 const rank={LOW:1,NORMAL:2,HIGH:3,CRITICAL:4};
 return arr(signals).slice().sort((a,b)=>(rank[b.priority]||0)-(rank[a.priority]||0)).map(s=>({signal_id:s.id,priority:s.priority,relevance:context[s.type]??1,state:s.state}));
}
export function buildCortexContext({signals=[],knowledge=[],capabilities=[],outcomes=[]}={}) {
 const active=arr(signals).filter(s=>s.state!=="EXPIRED");
 return {contract:CONTRACT,signals:active.length,high_priority:active.filter(s=>["HIGH","CRITICAL"].includes(s.priority)).length,knowledge:arr(knowledge).length,capabilities:arr(capabilities).length,outcomes:arr(outcomes).length,context_state:"CURRENT_SNAPSHOT",generated_at:now(),authority:false,breaker_touched:false};
}
export function proposeResponse({signal,context={},candidate_actions=[]}={}) {
 return {signal_id:signal?.id,context,candidate_actions:arr(candidate_actions),state:"PROPOSED",requires_authorization:true,authority:false,external_effect:false,auto_execute:false,breaker_touched:false,created_at:now()};
}
export function learnFromOutcome({signal,response,outcome}={}) {
 return {signal_id:signal?.id,response_state:response?.state,outcome,learning_state:"PROVISIONAL",requires_validation:true,authority:false,breaker_touched:false,created_at:now()};
}
export function assertCortexSignalConstitution(s={}) {
 if(s.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(s.auto_execute) throw new Error("AUTO_EXECUTION_FORBIDDEN");
 if(s.hidden_signal) throw new Error("SIGNALS_MUST_BE_TRACEABLE");
 if(s.authority_transfer) throw new Error("SIGNAL_MUST_NOT_GRANT_AUTHORITY");
 return true;
}
