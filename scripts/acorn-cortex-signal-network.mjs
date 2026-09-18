/** ACORN — CORTEX SIGNAL NETWORK */
export const CONTRACT="acorn.cortex-signal-network.v1";
export const SIGNALS=Object.freeze(["NEED","OPPORTUNITY","CAPABILITY","RISK","CHANGE","FAILURE","SUCCESS","KNOWLEDGE","RESOURCE","DEADLINE","VALUE"]);
const arr=v=>Array.isArray(v)?v:[]; const now=()=>new Date().toISOString();
export function createSignal({type,source,payload={},priority=0,expires_at=null,evidence=[]}={}) {
 if(!SIGNALS.includes(type)) throw new Error("SIGNAL_TYPE_UNSUPPORTED");
 if(!source) throw new Error("SIGNAL_SOURCE_REQUIRED");
 return {id:`signal:${type.toLowerCase()}:${Date.now()}:${Math.random().toString(36).slice(2,8)}`,type,source,payload,priority,expires_at,evidence:arr(evidence),state:"OBSERVED",created_at:now(),authority:false,breaker_touched:false};
}
export function qualifySignal(signal,{minimum_evidence=0}={}) {
 const valid=arr(signal.evidence).length>=minimum_evidence && !signal.expires_at || (signal.expires_at && Date.parse(signal.expires_at)>Date.now());
 return {...signal,state:valid?"QUALIFIED":"EXPIRED",qualified_at:now(),authority:false,breaker_touched:false};
}
export function routeSignals({signals=[],interests=[],limit=20}={}) {
 const active=arr(signals).filter(s=>s.state!=="EXPIRED");
 const score=s=>Number(s.priority)+(interests.includes(s.type)?100:0)+(arr(s.evidence).length*2);
 return active.sort((a,b)=>score(b)-score(a)).slice(0,limit).map(s=>({...s,routing_score:score(s)}));
}
export function correlateSignals({signals=[]}={}) {
 const groups=new Map();
 for(const s of arr(signals)){const key=s.payload?.topic||s.type;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(s);}
 return [...groups].map(([topic,items])=>({topic,signal_ids:items.map(x=>x.id),signal_types:[...new Set(items.map(x=>x.type))],strength:items.length,state:"CORRELATED",authority:false,breaker_touched:false}));
}
export function generateResponseCandidates({correlations=[],capabilities=[]}={}) {
 return arr(correlations).map(c=>({topic:c.topic,capabilities:arr(capabilities).filter(x=>x.topic===c.topic||x.type==="UNIVERSAL"),trigger_strength:c.strength,state:"PROPOSED",requires_validation:true,authority:false,breaker_touched:false}));
}
export function recordSignalOutcome({signal_id,outcome,evidence=[]}={}) {
 return {signal_id,outcome,evidence:arr(evidence),state:"MEASURED",measured_at:now(),authority:false,breaker_touched:false};
}
export function learnSignalPattern({outcomes=[]}={}) {
 const successes=arr(outcomes).filter(x=>x.outcome==="SUCCESS");
 return {successful_patterns:successes.map(x=>x.signal_id),sample_size:arr(outcomes).length,state:"LEARNED",authority:false,breaker_touched:false};
}
export function assertSignalConstitution(s={}) {
 if(s.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(s.authority_transfer) throw new Error("SIGNALS_CANNOT_GRANT_AUTHORITY");
 if(s.auto_action) throw new Error("SIGNAL_CANNOT_EXECUTE_AUTOMATICALLY");
 return true;
}
