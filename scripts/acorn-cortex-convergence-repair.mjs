/** ACORN — CORTEX CONVERGENCE REPAIR: one canonical knowledge substrate. */
export const CONTRACT="acorn.cortex-convergence.v1";
export const STATES=Object.freeze(["OBSERVED","MEASURED","VERIFIED","PROVISIONAL","EXPIRED","CONTESTED"]);
const a=v=>Array.isArray(v)?v:[];
export function normalizeKnowledge(k={}) {
 if(!k.subject||!k.predicate||!k.source) throw new Error("KNOWLEDGE_IDENTITY_REQUIRED");
 const evidence=a(k.evidence);
 return {...k,evidence,state:k.state||"PROVISIONAL",evidence_count:evidence.length,provenance:{source:k.source},authority:false,breaker_touched:false};
}
export function validateKnowledge(k,{minimumEvidence=1}={}) {
 const n=normalizeKnowledge(k);
 return {...n,state:n.evidence_count>=minimumEvidence?"VERIFIED":"OBSERVED",validation:{evidence_required:minimumEvidence,evidence_count:n.evidence_count}};
}
export function buildCortexSnapshot({knowledge=[],capabilities=[],participants=[],outcomes=[]}={}) {
 const items=a(knowledge).map(normalizeKnowledge).filter(k=>k.state!=="EXPIRED");
 return {contract:CONTRACT,knowledge_count:items.length,verified_count:items.filter(k=>k.state==="VERIFIED").length,capabilities:a(capabilities).length,participants:a(participants).length,outcomes:a(outcomes).length,knowledge:items,authority:false,breaker_touched:false};
}
export function assertCortexRepairConstitution(s={}) {
 if(s.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(s.auto_merge||s.auto_spend||s.auto_signature||s.authority_transfer) throw new Error("AUTHORITY_BOUNDARY_VIOLATION");
 return true;
}
