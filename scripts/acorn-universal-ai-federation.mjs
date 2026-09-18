/** ACORN — UNIVERSAL AI FEDERATION FABRIC */
export const CONTRACT="acorn.universal-ai-federation.v1";
export const FEDERATION_STATES=Object.freeze(["DISCOVERED","TRUST_PENDING","QUALIFIED","AVAILABLE","DEGRADED","EXPIRED","REVOKED"]);
export const RELATION_TYPES=Object.freeze(["CAPABILITY","AGENT","TOOL","DATA","COMPUTE","RESOURCE","PARTNER"]);
const A=v=>Array.isArray(v)?v:[]; const now=()=>new Date().toISOString();
function id(prefix,value){return `${prefix}:${String(value).trim().toLowerCase().replace(/[^a-z0-9._-]+/g,"-")}`;}
export function discoverParticipant({identity,type="AGENT",capabilities=[],routes=[],commercial_profile=null,evidence=[]}={}) {
 if(!identity) throw new Error("IDENTITY_REQUIRED");
 if(!RELATION_TYPES.includes(type)) throw new Error("RELATION_TYPE_UNSUPPORTED");
 return {id:id("participant",identity),identity,type,capabilities:A(capabilities),routes:A(routes),commercial_profile,evidence:A(evidence),state:"DISCOVERED",authority:false,breaker_touched:false,discovered_at:now()};
}
export function qualifyParticipant(participant,{required_capabilities=[],required_evidence=0,now_iso=now()}={}) {
 const caps=new Set(A(participant.capabilities)); const capable=A(required_capabilities).every(x=>caps.has(x));
 const enough=A(participant.evidence).length>=required_evidence;
 return {...participant,state:capable&&enough?"QUALIFIED":"TRUST_PENDING",qualified_at:now_iso,authority:false,breaker_touched:false};
}
export function buildFederationGraph(participants=[]) {
 const nodes=A(participants).map(p=>({id:p.id,type:p.type,state:p.state,capabilities:A(p.capabilities),authority:false}));
 const edges=[]; for(const a of nodes) for(const b of nodes) if(a.id!==b.id) { const shared=A(a.capabilities).filter(c=>A(b.capabilities).includes(c)); if(shared.length) edges.push({from:a.id,to:b.id,capabilities:shared,authority:false,breaker_touched:false}); }
 return {contract:CONTRACT,nodes,edges,created_at:now(),breaker_touched:false};
}
export function composeFederatedPlan({goal,participants=[],constraints={}}={}) {
 const eligible=A(participants).filter(p=>p.state==="QUALIFIED"||p.state==="AVAILABLE");
 const capabilities=[...new Set(eligible.flatMap(p=>A(p.capabilities)))];
 return {contract:"acorn.federated-plan.v1",goal,participants:eligible.map(p=>p.id),capabilities,constraints,state:"PROPOSED",authority:false,external_effect:false,requires_authorization:true,breaker_touched:false,created_at:now()};
}
export function proposeCommercialBundle({participants=[],capability_value=0,cost=0,risk="UNKNOWN",renewal=true}={}) {
 return {contract:"acorn.federated-commercial-bundle.v1",participants:A(participants),capability_value,cost,estimated_margin:capability_value-cost,risk,renewal,terms:["PRICE","SLA","DATA","IP","SECURITY","SUPPORT","REVENUE_SHARE","EXIT"],state:"PROPOSED",executed:false,human_signature_required:true,authority:false,breaker_touched:false};
}
export function rebalanceBundle(bundle,{measured_value=null,measured_cost=null}={}) {
 return {...bundle,measured_value,measured_cost,measured_margin:measured_value===null||measured_cost===null?null:measured_value-measured_cost,state:"OPTIMIZATION_PROPOSED",executed:false,authority:false,breaker_touched:false};
}
export function assertFederationConstitution(snapshot={}) {
 if(snapshot.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(snapshot.authority_transfer) throw new Error("AUTHORITY_TRANSFER_FORBIDDEN");
 if(snapshot.auto_signature) throw new Error("AUTOMATIC_SIGNATURE_FORBIDDEN");
 if(snapshot.auto_spend) throw new Error("AUTOMATIC_SPEND_FORBIDDEN");
 return true;
}