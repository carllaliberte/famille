/** ACORN — COLLECTIVE KNOWLEDGE & FLUIDITY FABRIC */
export const CONTRACT="acorn.collective-knowledge-fluidity.v1";
export const KNOWLEDGE_STATES=Object.freeze(["PROPOSED","OBSERVED","MEASURED","VERIFIED","EXPIRED","REVOKED"]);
const A=v=>Array.isArray(v)?v:[]; const S=v=>String(v??"").trim();
const hash=s=>{let h=2166136261;for(const c of S(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(16)};
export function createKnowledge({subject,claim,evidence=[],source="UNKNOWN",scope="LOCAL",confidence=0.5,expires_at=null}={}) {
 if(!S(subject)||!S(claim)) throw new Error("KNOWLEDGE_CONTENT_REQUIRED");
 return {id:`knowledge:${hash(subject+"|"+claim+"|"+scope)}`,subject,claim,evidence:A(evidence),source,scope,confidence,state:"PROPOSED",expires_at,provenance:{source,scope,evidence_count:A(evidence).length},authority:false,breaker_touched:false};
}
export function addEvidence(knowledge,{evidence,source,measurement=null}={}) {
 const next={...knowledge,evidence:[...knowledge.evidence,evidence].filter(Boolean),source:source||knowledge.source};
 if(measurement!==null) next.measurement=measurement;
 return {...next,state:next.evidence.length?"OBSERVED":"PROPOSED",authority:false,breaker_touched:false};
}
export function verifyKnowledge(knowledge,{verifier="MEASURED_SYSTEM",confidence=0.8,scope=knowledge.scope}={}) {
 return {...knowledge,confidence,scope,state:"VERIFIED",verified_by:verifier,verified_at:new Date().toISOString(),authority:false,breaker_touched:false};
}
export function shareKnowledge(knowledge,{from="UNKNOWN",to=[],purpose="REUSE"}={}) {
 if(knowledge.state!=="VERIFIED"&&knowledge.state!=="MEASURED") return {state:"BLOCKED",reason:"KNOWLEDGE_NOT_TRUSTED",knowledge_id:knowledge.id};
 return {knowledge_id:knowledge.id,from,to:A(to),purpose,transfer:"PROVENANCE_PRESERVED",state:"PROPOSED",authority:false,breaker_touched:false};
}
export function mergeKnowledge({items=[],subject}={}) {
 const relevant=A(items).filter(x=>x.subject===subject&&["OBSERVED","MEASURED","VERIFIED"].includes(x.state));
 const evidence=[...new Set(relevant.flatMap(x=>A(x.evidence)))];
 const confidence=relevant.length?Math.max(...relevant.map(x=>Number(x.confidence)||0)):0;
 const conflicts=[...new Set(relevant.map(x=>x.claim))];
 return {subject,claims:conflicts,evidence,confidence,state:relevant.length?"OBSERVED":"PROPOSED",conflict:conflicts.length>1,provenance:relevant.map(x=>x.id),authority:false,breaker_touched:false};
}
export function routeForKnowledge({knowledge,participants=[],constraints={}}={}) {
 return A(participants).map(p=>({participant:p.id||p.identity,capability:p.capability||"knowledge",knowledge_id:knowledge.id,fit:knowledge.scope===p.scope?1:0.5,constraints,state:"PROPOSED",authority:false})).sort((a,b)=>b.fit-a.fit);
}
export function learnGlobally({local_results=[],global_memory=[]}={}) {
 const all=[...A(global_memory),...A(local_results)];
 const verified=all.filter(x=>x.state==="VERIFIED");
 const reusable=[...new Map(verified.map(x=>[x.id,x])).values()];
 return {reusable_count:reusable.length,knowledge_ids:reusable.map(x=>x.id),deduplicated:true,provenance_preserved:true,state:"LEARNED",authority:false,breaker_touched:false};
}
export function assertCollectiveKnowledgeConstitution(snapshot={}) {
 if(snapshot.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(snapshot.authority_transfer) throw new Error("KNOWLEDGE_CANNOT_GRANT_AUTHORITY");
 if(snapshot.undated_verification) throw new Error("VERIFICATION_REQUIRES_TEMPORAL_CONTEXT");
 if(snapshot.unproven_global_claim) throw new Error("GLOBAL_CLAIM_REQUIRES_EVIDENCE");
 return true;
}
