/** ACORN — CORTEX SIGNAL & CONTEXT ROUTER */
export const CONTRACT="acorn.cortex-signal-routing.v1";
export const SIGNALS=Object.freeze(["NEED","CHANGE","RISK","OPPORTUNITY","FAILURE","OUTCOME","KNOWLEDGE","CAPABILITY"]);
const arr=v=>Array.isArray(v)?v:[]; const now=()=>new Date().toISOString();
export function emitSignal({type,source,subject,payload={},urgency=0,expires_at=null}={}) {
 if(!SIGNALS.includes(type)) throw new Error("SIGNAL_UNSUPPORTED");
 if(!source||!subject) throw new Error("SIGNAL_IDENTITY_REQUIRED");
 return {id:`signal:${type.toLowerCase()}:${Date.now()}`,type,source,subject,payload,urgency,expires_at,state:"OBSERVED",created_at:now(),authority:false,breaker_touched:false};
}
export function classifySignal(signal,{context={}}={}) {
 const age=signal.expires_at&&Date.parse(signal.expires_at)<=Date.now();
 return {...signal,state:age?"EXPIRED":signal.urgency>=.8?"PRIORITY":"NORMAL",context,authority:false,breaker_touched:false};
}
export function routeSignals({signals=[],subscriptions=[],capabilities=[],knowledge=[]}={}) {
 return arr(signals).filter(s=>s.state!=="EXPIRED").map(s=>({
  signal_id:s.id,
  recipients:arr(subscriptions).filter(x=>x.types?.includes(s.type)||x.types?.includes("*")).map(x=>x.id),
  relevant_capabilities:arr(capabilities).filter(c=>arr(c.signal_types).includes(s.type)).map(c=>c.id),
  relevant_knowledge:arr(knowledge).filter(k=>k.state!=="EXPIRED"&&(k.subject===s.subject||k.predicate===s.type.toLowerCase())).map(k=>k.id),
  state:"ROUTED",authority:false,breaker_touched:false
 }));
}
export function buildContextPacket({signal,routes=[],history=[],constraints={}}={}) {
 return {contract:"acorn.cortex-context-packet.v1",signal_id:signal?.id,routes:arr(routes),relevant_history:arr(history).slice(-20),constraints,state:"READY_FOR_REASONING",authority:false,external_effect:false,breaker_touched:false};
}
export function selectNextAction({context,options=[]}={}) {
 const ranked=arr(options).map(o=>({...o,score:Number(o.expected_value||0)-Number(o.cost||0)-Number(o.risk||0)})).sort((a,b)=>b.score-a.score);
 return {context_id:context?.signal_id,selected:ranked[0]||null,alternatives:ranked.slice(1),state:"PROPOSED",requires_authorization:true,authority:false,breaker_touched:false};
}
export function recordSignalOutcome({signal_id,outcome,evidence=[],value=null}={}) {
 return {signal_id,outcome,evidence:arr(evidence),value,state:"MEASURED",measured_at:now(),authority:false,breaker_touched:false};
}
export function assertCortexRoutingConstitution(s={}) {
 if(s.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(s.auto_action) throw new Error("AUTO_ACTION_AUTHORIZATION_REQUIRED");
 if(s.authority_transfer) throw new Error("AUTHORITY_TRANSFER_FORBIDDEN");
 if(s.hidden_context) throw new Error("CONTEXT_MUST_BE_TRACEABLE");
 return true;
}
