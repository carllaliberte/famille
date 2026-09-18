/** ACORN — ACTIVE CORTEX MEMORY
 * Continuous environmental cognition: signal -> context -> memory -> prediction -> action proposal -> outcome -> learning.
 */
export const CONTRACT="acorn.cortex-active-memory.v1";
export const SIGNAL_STATES=Object.freeze(["RECEIVED","CORRELATED","RELEVANT","IGNORED","EXPIRED"]);
export const MEMORY_TYPES=Object.freeze(["EVENT","CONTEXT","KNOWLEDGE","PATTERN","DECISION","OUTCOME","LESSON"]);
const arr=v=>Array.isArray(v)?v:[]; const n=v=>Number.isFinite(Number(v))?Number(v):0; const now=()=>new Date().toISOString();
export function ingestSignal({source,kind,payload,timestamp=now(),evidence=[],scope="ecosystem"}={}) {
 if(!source||!kind) throw new Error("SIGNAL_IDENTITY_REQUIRED");
 return {id:`signal:${source}:${kind}:${Date.now()}`,source,kind,payload,timestamp,evidence:arr(evidence),scope,state:"RECEIVED",authority:false,breaker_touched:false};
}
export function correlateSignals(signals=[],memory=[]) {
 return arr(signals).map(s=>{const related=arr(memory).filter(m=>m.scope===s.scope&&(m.kind===s.kind||m.subject===s.kind)).map(m=>m.id);return {...s,related_memory:related,state:related.length?"CORRELATED":"RELEVANT"};});
}
export function writeMemory({type,subject,value,source,evidence=[],confidence=0,scope="ecosystem",expires_at=null}={}) {
 if(!MEMORY_TYPES.includes(type)||!subject||!source) throw new Error("MEMORY_CONTRACT_INVALID");
 return {id:`memory:${type}:${subject}:${Date.now()}`,type,subject,value,source,evidence:arr(evidence),confidence:n(confidence),scope,expires_at,state:"ACTIVE",provenance:{source,created_at:now()},authority:false,breaker_touched:false};
}
export function retrieveContext({query,memory=[],limit=10}={}) {
 const q=String(query||"").toLowerCase();
 return arr(memory).filter(m=>m.state==="ACTIVE"&&(!m.expires_at||Date.parse(m.expires_at)>Date.now())).map(m=>({...m,score:(String(m.subject).toLowerCase().includes(q)?2:0)+n(m.confidence)})).filter(m=>m.score>0).sort((a,b)=>b.score-a.score).slice(0,limit);
}
export function buildPrediction({goal,context=[],uncertainty="UNKNOWN",expected_outcome=null}={}) {
 return {contract:"acorn.cortex-prediction.v1",goal,context_ids:arr(context).map(x=>x.id),uncertainty,expected_outcome,state:"PROVISIONAL",requires_measurement:true,authority:false,breaker_touched:false};
}
export function closeLearningLoop({prediction,outcome,evidence=[]}={}) {
 const actual=outcome?.value;
 const expected=prediction?.expected_outcome;
 const error=(Number.isFinite(Number(actual))&&Number.isFinite(Number(expected)))?Number(actual)-Number(expected):null;
 return {prediction_id:prediction?.id||null,outcome,evidence:arr(evidence),prediction_error:error,state:"MEASURED",lesson_candidate:error===null?"INSUFFICIENT_DATA":"READY_FOR_LEARNING",authority:false,breaker_touched:false};
}
export function prioritizeSignals({signals=[],objectives=[]}={}) {
 const weights=new Map(arr(objectives).map(o=>[o.name,n(o.weight,1)]));
 return arr(signals).map(s=>({...s,priority:n(s.priority,1)*(weights.get(s.kind)||1)})).sort((a,b)=>b.priority-a.priority);
}
export function cortexCycle({signals=[],memory=[],objectives=[]}={}) {
 const correlated=correlateSignals(signals,memory);
 const prioritized=prioritizeSignals({signals:correlated,objectives});
 return {contract:CONTRACT,signals_received:signals.length,signals_relevant:prioritized.filter(s=>s.state==="CORRELATED"||s.state==="RELEVANT").length,memory_items:memory.length,top_signals:prioritized.slice(0,10).map(s=>s.id),state:"MEASURED",updated_at:now(),authority:false,breaker_touched:false};
}
export function assertActiveCortexConstitution(s={}) {
 if(s.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(s.auto_action) throw new Error("CORTEX_MUST_NOT_AUTO_ACT");
 if(s.hidden_memory) throw new Error("MEMORY_MUST_BE_TRACEABLE");
 if(s.authority_transfer) throw new Error("CORTEX_CANNOT_TRANSFER_AUTHORITY");
 return true;
}
