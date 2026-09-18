/** ACORN — CORTEX CONTEXT ORCHESTRATION
 * Turns distributed signals into shared, scoped, traceable context.
 * Coordination is not authority.
 */
export const CONTRACT="acorn.cortex-context-orchestration.v1";
export const SIGNAL_TYPES=Object.freeze(["NEED","CAPABILITY","KNOWLEDGE","EVENT","CONSTRAINT","RISK","OUTCOME","OPPORTUNITY","RESOURCE","REQUEST"]);
export const CONTEXT_STATES=Object.freeze(["OPEN","ACTIVE","STALE","EXPIRED","CONFLICTED","RESOLVED"]);
const A=v=>Array.isArray(v)?v:[]; const now=()=>new Date().toISOString();
export function ingestSignal({type,payload,source,confidence=0,evidence=[],scope="ecosystem",expires_at=null}={}) {
 if(!SIGNAL_TYPES.includes(type)) throw new Error("SIGNAL_TYPE_UNSUPPORTED");
 if(!source) throw new Error("SOURCE_REQUIRED");
 return {id:`signal:${type.toLowerCase()}:${Date.now()}:${Math.random().toString(36).slice(2,8)}`,type,payload,source,confidence,evidence:A(evidence),scope,expires_at,state:"OPEN",provenance:{source,received_at:now()},authority:false,breaker_touched:false};
}
export function contextualize({signals=[],goal,constraints=[]}={}) {
 const active=A(signals).filter(s=>s.state==="OPEN"||s.state==="ACTIVE");
 return {contract:CONTRACT,goal,signals:active.map(s=>s.id),signal_types:[...new Set(active.map(s=>s.type))],constraints:A(constraints),state:"ACTIVE",created_at:now(),authority:false,breaker_touched:false};
}
export function resolveConflicts({signals=[]}={}) {
 const groups=new Map();
 for(const s of A(signals)){const k=`${s.type}:${JSON.stringify(s.payload)}`; if(!groups.has(k))groups.set(k,[]);groups.get(k).push(s);}
 return [...groups.values()].map(g=>g.sort((a,b)=>Number(b.confidence)-Number(a.confidence))).flat();
}
export function detectConflicts({signals=[]}={}) {
 const byType=new Map();
 for(const s of A(signals)){if(!byType.has(s.type))byType.set(s.type,[]);byType.get(s.type).push(s);}
 return [...byType.entries()].flatMap(([type,list])=>list.length>1?[{type,signals:list.map(s=>s.id),state:"CONFLICTED"}]:[]);
}
export function routeContext({context,needs=[],capabilities=[]}={}) {
 const text=JSON.stringify(context||{}).toLowerCase();
 return {needs:A(needs),matching_capabilities:A(capabilities).filter(c=>text.includes(String(c).toLowerCase())),state:"ROUTED",authority:false,breaker_touched:false};
}
export function refreshContext({signals=[],at=Date.now()}={}) {
 return A(signals).map(s=>s.expires_at&&Date.parse(s.expires_at)<=at?{...s,state:"EXPIRED"}:s);
}
export function buildCortexPulse({signals=[],knowledge=[],capabilities=[],outcomes=[]}={}) {
 return {contract:CONTRACT,at:now(),signals:A(signals).length,knowledge:A(knowledge).length,capabilities:A(capabilities).length,outcomes:A(outcomes).length,conflicts:detectConflicts({signals}).length,state:"OBSERVED",authority:false,breaker_touched:false};
}
export function assertCortexContextConstitution(s={}) {
 if(s.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(s.authority_transfer) throw new Error("CONTEXT_MUST_NOT_GRANT_AUTHORITY");
 if(s.hidden_context) throw new Error("CONTEXT_MUST_BE_TRACEABLE");
 return true;
}
