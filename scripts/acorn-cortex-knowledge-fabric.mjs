/** ACORN — CORTEX KNOWLEDGE FABRIC
 * Shared cognition without centralized authority.
 */
export const CONTRACT="acorn.cortex-knowledge-fabric.v1";
export const KNOWLEDGE_STATES=Object.freeze(["OBSERVED","MEASURED","VERIFIED","PROVISIONAL","EXPIRED","CONTESTED"]);
export const KNOWLEDGE_TYPES=Object.freeze(["FACT","CAPABILITY","PATTERN","LESSON","CONSTRAINT","OPPORTUNITY","RISK","OUTCOME"]);
const arr=v=>Array.isArray(v)?v:[]; const now=()=>new Date().toISOString();
export function createKnowledge({subject,predicate,value,type="FACT",source,confidence=0,evidence=[],expires_at=null,scope="ecosystem"}={}) {
 if(!subject||!predicate||!source) throw new Error("KNOWLEDGE_IDENTITY_REQUIRED");
 if(!KNOWLEDGE_TYPES.includes(type)) throw new Error("KNOWLEDGE_TYPE_UNSUPPORTED");
 return {id:`knowledge:${subject}:${predicate}:${Date.now()}`,subject,predicate,value,type,source,confidence,evidence:arr(evidence),expires_at,scope,state:"PROVISIONAL",provenance:{source,created_at:now()},authority:false,breaker_touched:false};
}
export function validateKnowledge(k,{required_evidence=1}={}) {
 const valid=arr(k.evidence).length>=required_evidence && k.source;
 return {...k,state:valid?"VERIFIED":"PROVISIONAL",validated_at:now(),authority:false,breaker_touched:false};
}
export function shareKnowledge(k,{recipient_scope="ecosystem",consent=true}={}) {
 if(!consent) return {...k,shared:false,reason:"CONSENT_REQUIRED"};
 return {knowledge_id:k.id,recipient_scope,shared:true,source:k.source,state:k.state,confidence:k.confidence,expires_at:k.expires_at,authority:false,breaker_touched:false};
}
export function buildKnowledgeGraph(items=[]) {
 const valid=arr(items).filter(k=>k.state!=="EXPIRED");
 const nodes=valid.map(k=>({id:k.id,type:k.type,subject:k.subject,predicate:k.predicate,value:k.value,state:k.state,confidence:k.confidence}));
 const edges=[];
 for(const a of valid) for(const b of valid) if(a.id!==b.id && (a.subject===b.subject||a.predicate===b.predicate)) edges.push({from:a.id,to:b.id,relation:a.subject===b.subject?"SAME_SUBJECT":"SAME_PATTERN"});
 return {contract:CONTRACT,nodes,edges,created_at:now(),breaker_touched:false};
}
export function deriveInsight({knowledge=[],goal,minimum_confidence=.5}={}) {
 const usable=arr(knowledge).filter(k=>["VERIFIED","MEASURED","OBSERVED"].includes(k.state)&&Number(k.confidence)>=minimum_confidence);
 return {goal,inputs:usable.map(k=>k.id),patterns:[...new Set(usable.map(k=>k.predicate))],state:"PROVISIONAL",requires_validation:true,authority:false,breaker_touched:false};
}
export function routeKnowledge({knowledge=[],need}={}) {
 return arr(knowledge).filter(k=>k.state!=="EXPIRED" && (!need||k.subject===need||k.predicate===need)).sort((a,b)=>Number(b.confidence)-Number(a.confidence)).map(k=>k.id);
}
export function expireKnowledge({knowledge=[],at=Date.now()}={}) {
 return arr(knowledge).map(k=>k.expires_at && Date.parse(k.expires_at)<=at?{...k,state:"EXPIRED"}:k);
}
export function cortexSnapshot({knowledge=[],participants=[],capabilities=[],outcomes=[]}={}) {
 return {contract:CONTRACT,knowledge_count:arr(knowledge).length,verified_count:arr(knowledge).filter(k=>k.state==="VERIFIED").length,participants:arr(participants).length,capabilities:arr(capabilities).length,outcomes:arr(outcomes).length,updated_at:now(),authority:false,breaker_touched:false};
}
export function assertCortexConstitution(s={}) {
 if(s.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(s.authority_transfer) throw new Error("KNOWLEDGE_MUST_NOT_GRANT_AUTHORITY");
 if(s.hidden_learning) throw new Error("LEARNING_MUST_BE_TRACEABLE");
 return true;
}
