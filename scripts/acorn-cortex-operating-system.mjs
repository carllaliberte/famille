/** ACORN — CORTEX OPERATING SYSTEM
 * Continuous ecosystem cognition: signal -> knowledge -> capability -> decision support -> learning.
 * This is coordination, not sovereignty. CAPABILITY !== AUTHORITY.
 */
export const CONTRACT="acorn.cortex-operating-system.v1";
export const STATES=Object.freeze(["PROPOSED","OBSERVED","MEASURED","VERIFIED","EXPIRED","CONTESTED","REVOKED"]);
export const SIGNALS=Object.freeze(["NEED","KNOWLEDGE","CAPABILITY","OUTCOME","RISK","OPPORTUNITY","CONSTRAINT","RESOURCE"]);
const A=v=>Array.isArray(v)?v:[]; const S=v=>String(v??"").trim(); const n=v=>Number.isFinite(Number(v))?Number(v):0;
function fingerprint(x){let h=2166136261;for(const c of JSON.stringify(x))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0).toString(16);}
export function ingestSignal({kind,subject,value,source,evidence=[],expires_at=null,confidence=.5,scope="ecosystem"}={}) {
 if(!SIGNALS.includes(kind))throw new Error("SIGNAL_UNSUPPORTED"); if(!S(source)||!S(subject))throw new Error("PROVENANCE_REQUIRED");
 return {id:"signal:"+fingerprint({kind,subject,value,source,scope}),kind,subject,value,source,evidence:A(evidence),expires_at,confidence,scope,state:"PROPOSED",provenance:{source,scope},authority:false,breaker_touched:false};
}
export function qualifySignal(signal,{minimum_evidence=1,minimum_confidence=0}={}) {
 if(!signal||signal.state==="EXPIRED"||signal.state==="REVOKED")return {...signal,state:signal.state};
 const observed=A(signal.evidence).length>=minimum_evidence;
 return {...signal,state:observed&&n(signal.confidence)>=minimum_confidence?"OBSERVED":"PROPOSED",evidence_count:A(signal.evidence).length,authority:false,breaker_touched:false};
}
export function measureSignal(signal,{result,evidence=[]}={}) {
 return {...signal,result,measurement_evidence:A(evidence),state:"MEASURED",measured_at:new Date().toISOString(),authority:false,breaker_touched:false};
}
export function buildCortexGraph(signals=[]) {
 const live=A(signals).filter(x=>x.state!=="EXPIRED"&&x.state!=="REVOKED");
 const nodes=live.map(x=>({id:x.id,kind:x.kind,subject:x.subject,state:x.state,confidence:n(x.confidence)}));
 const edges=[];
 for(const a of live)for(const b of live)if(a.id!==b.id&&(a.subject===b.subject||a.kind===b.kind))edges.push({from:a.id,to:b.id,relation:a.subject===b.subject?"SUBJECT":"SIGNAL_TYPE"});
 return {contract:CONTRACT,nodes,edges,authority:false,breaker_touched:false};
}
export function discoverForNeed({need,signals=[],capabilities=[]}={}) {
 const matches=A(signals).filter(x=>x.state!=="EXPIRED"&&x.state!=="REVOKED"&&(x.subject===need||x.value===need));
 const caps=A(capabilities).filter(x=>x.state!=="EXPIRED"&&x.state!=="REVOKED"&&(x.name===need||A(x.tags).includes(need)));
 return {need,matches:matches.map(x=>x.id),capabilities:caps.map(x=>x.id),state:"OBSERVED",authority:false,breaker_touched:false};
}
export function composeCortexPlan({goal,signals=[],capabilities=[],constraints=[]}={}) {
 return {contract:"acorn.cortex-plan.v1",goal,inputs:[...A(signals).map(x=>x.id),...A(capabilities).map(x=>x.id)],constraints:A(constraints),state:"PROPOSED",requires_validation:true,requires_authorization:true,authority:false,external_effect:false,breaker_touched:false};
}
export function evaluateImprovement({before={},after={},weights={}}={}) {
 const keys=[...new Set([...Object.keys(before),...Object.keys(after)])]; let score=0;
 for(const k of keys){const d=n(after[k])-n(before[k]);score+=d*n(weights[k]??1);}
 return {score,dimensions:keys,state:"MEASURED",authority:false,breaker_touched:false};
}
export function learn({observations=[],minimum_score=0}={}) {
 const accepted=A(observations).filter(x=>n(x.score)>minimum_score);
 return {accepted:accepted.map(x=>x.pattern||x.candidate).filter(Boolean),count:accepted.length,state:"LEARNED",reusable:true,authority:false,breaker_touched:false};
}
export function expire(signals=[],at=Date.now()) {return A(signals).map(x=>x.expires_at&&Date.parse(x.expires_at)<=at?{...x,state:"EXPIRED"}:x);}
export function cortexSnapshot({signals=[],capabilities=[],outcomes=[],plans=[]}={}) {
 return {contract:CONTRACT,signals:A(signals).length,verified:A(signals).filter(x=>x.state==="VERIFIED").length,capabilities:A(capabilities).length,outcomes:A(outcomes).length,plans:A(plans).length,updated_at:new Date().toISOString(),authority:false,breaker_touched:false};
}
export function assertCortexConstitution(s={}) {
 if(s.breaker_touched)throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(s.authority_transfer)throw new Error("AUTHORITY_TRANSFER_FORBIDDEN");
 if(s.auto_merge)throw new Error("AUTO_MERGE_FORBIDDEN");
 if(s.auto_spend)throw new Error("AUTO_SPEND_FORBIDDEN");
 if(s.auto_signature)throw new Error("AUTO_SIGNATURE_FORBIDDEN");
 if(s.hidden_learning)throw new Error("HIDDEN_LEARNING_FORBIDDEN");
 return true;
}
