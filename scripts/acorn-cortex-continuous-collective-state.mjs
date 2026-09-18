/** ACORN — CONTINUOUS COLLECTIVE CORTEX
 * Converts distributed observations into a traceable, shared environmental state.
 * Coordination only: no authority transfer and no autonomous consequential action.
 */
export const CONTRACT="acorn.cortex.continuous-collective-state.v1";
export const SIGNAL_STATES=Object.freeze(["OBSERVED","CORROBORATED","CONFLICTED","EXPIRED"]);
const arr=v=>Array.isArray(v)?v:[];
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const ts=()=>new Date().toISOString();

export function ingestSignal({actor,subject,kind,value,evidence=[],confidence=0,expires_at=null}={}) {
 if(!actor||!subject||!kind) throw new Error("SIGNAL_IDENTITY_REQUIRED");
 return {id:`signal:${Date.now()}:${Math.random().toString(36).slice(2,8)}`,actor,subject,kind,value,evidence:arr(evidence),confidence:n(confidence),expires_at,state:"OBSERVED",created_at:ts(),authority:false,breaker_touched:false};
}

export function corroborateSignals(signals=[]) {
 const groups=new Map();
 for(const s of arr(signals)) { const k=`${s.subject}|${s.kind}|${JSON.stringify(s.value)}`; if(!groups.has(k))groups.set(k,[]);groups.get(k).push(s); }
 return arr(signals).map(s=>{const k=`${s.subject}|${s.kind}|${JSON.stringify(s.value)}`;const peers=groups.get(k)||[];return {...s,state:peers.length>1?"CORROBORATED":s.state,corroborators:peers.length};});
}

export function detectConflicts(signals=[]) {
 const groups=new Map();
 for(const s of arr(signals)){const k=`${s.subject}|${s.kind}`;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(s);}
 return [...groups.values()].flatMap(g=>{
   const values=[...new Set(g.map(x=>JSON.stringify(x.value)))];
   if(values.length<2)return [];
   return g.map(s=>({...s,state:"CONFLICTED",conflict_group:`${s.subject}|${s.kind}`,authority:false,breaker_touched:false}));
 });
}

export function consolidateMemory({signals=[],knowledge=[],now=Date.now()}={}) {
 const live=arr(signals).filter(s=>!s.expires_at||Date.parse(s.expires_at)>now);
 const corroborated=corroborateSignals(live);
 const conflicts=detectConflicts(corroborated);
 const conflictIds=new Set(conflicts.map(x=>x.id));
 const consolidated=[...corroborated.filter(x=>!conflictIds.has(x.id)),...conflicts];
 return {contract:CONTRACT,signals:consolidated,prior_knowledge:arr(knowledge),counts:{live:live.length,conflicted:conflicts.length,corroborated:corroborated.filter(x=>x.state==="CORROBORATED").length},state:"CONSOLIDATED",created_at:ts(),authority:false,breaker_touched:false};
}

export function routeRelevantState({state,query,limit=20}={}) {
 const q=String(query||"").toLowerCase();
 return arr(state?.signals).filter(s=>s.state!=="EXPIRED" && (!q||[`${s.subject} ${s.kind} ${JSON.stringify(s.value)}`.toLowerCase()].some(x=>x.includes(q)))).sort((a,b)=>n(b.confidence)-n(a.confidence)).slice(0,limit);
}

export function buildCollectiveState({state,objectives=[],constraints=[]}={}) {
 const signals=arr(state?.signals);
 return {contract:CONTRACT,objectives:arr(objectives),constraints:arr(constraints),signal_count:signals.length,conflicts:signals.filter(x=>x.state==="CONFLICTED").length,corroborated:signals.filter(x=>x.state==="CORROBORATED").length,knowledge_ready:signals.filter(x=>x.state==="CORROBORATED").map(x=>x.id),state:"CURRENT_AS_MEASURED",created_at:ts(),authority:false,breaker_touched:false};
}

export function proposeCortexAction({goal,current_state,alternatives=[],expected_effects=[]}={}) {
 return {contract:"acorn.cortex-action-proposal.v1",goal,current_state,alternatives:arr(alternatives),expected_effects:arr(expected_effects),state:"PROPOSED",requires_human_authorization:true,external_effect:false,authority:false,breaker_touched:false};
}

export function assertCortexConstitution(s={}) {
 if(s.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(s.authority_transfer) throw new Error("CORTEX_CANNOT_TRANSFER_AUTHORITY");
 if(s.hidden_learning) throw new Error("CORTEX_LEARNING_MUST_BE_TRACEABLE");
 if(s.autonomous_consequential_action) throw new Error("CONSEQUENTIAL_ACTION_REQUIRES_AUTHORIZATION");
 return true;
}
