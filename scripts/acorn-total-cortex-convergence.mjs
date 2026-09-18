/** ACORN — TOTAL CORTEX CONVERGENCE
 * One coordination loop across knowledge, capability, projects, value and environment.
 */
export const CONTRACT="acorn.total-cortex-convergence.v1";
export const PLANES=Object.freeze(["KNOWLEDGE","CAPABILITY","INTELLIGENCE","CONNECTOR","PARTNER","PROJECT","RESOURCE","EXECUTION","EVIDENCE","MEASUREMENT","VALUE","LEARNING","ENVIRONMENT"]);
const arr=v=>Array.isArray(v)?v:[]; const n=v=>Number.isFinite(Number(v))?Number(v):0;
export function normalizeSignal({plane,source,subject,payload,evidence=[],confidence=0,expires_at=null}={}) {
 if(!PLANES.includes(plane)) throw new Error("PLANE_UNSUPPORTED"); if(!source||!subject) throw new Error("SIGNAL_IDENTITY_REQUIRED");
 return {id:`signal:${plane}:${subject}:${Date.now()}`,plane,source,subject,payload,evidence:arr(evidence),confidence:n(confidence),expires_at,state:"OBSERVED",provenance:{source},authority:false,breaker_touched:false};
}
export function assessSignal(signal,{minimum_confidence=.5,now=Date.now()}={}) {
 const expired=signal.expires_at && Date.parse(signal.expires_at)<=now;
 return {...signal,state:expired?"EXPIRED":signal.confidence>=minimum_confidence?"QUALIFIED":"PROVISIONAL",assessed_at:new Date().toISOString(),authority:false,breaker_touched:false};
}
export function buildCortexState({signals=[],knowledge=[],capabilities=[],projects=[],outcomes=[],environment={}}={}) {
 const active=arr(signals).filter(s=>s.state!=="EXPIRED");
 const byPlane=Object.fromEntries(PLANES.map(p=>[p,active.filter(s=>s.plane===p).length]));
 return {contract:CONTRACT,planes:byPlane,knowledge_count:arr(knowledge).length,capability_count:arr(capabilities).length,project_count:arr(projects).length,outcome_count:arr(outcomes).length,environment,signal_count:active.length,state:"OBSERVED",authority:false,breaker_touched:false,updated_at:new Date().toISOString()};
}
export function findGaps({required_capabilities=[],available_capabilities=[],required_resources=[],available_resources=[]}={}) {
 const ac=new Set(arr(available_capabilities)); const ar=new Set(arr(available_resources));
 return {missing_capabilities:arr(required_capabilities).filter(x=>!ac.has(x)),missing_resources:arr(required_resources).filter(x=>!ar.has(x)),state:"MEASURED"};
}
export function composeCortexPlan({intent,signals=[],required_capabilities=[],available_capabilities=[],required_resources=[],available_resources=[],constraints={}}={}) {
 const gaps=findGaps({required_capabilities,available_capabilities,required_resources,available_resources});
 return {contract:"acorn.cortex-project-plan.v1",intent,signals:arr(signals).map(s=>s.id),gaps,constraints,state:"PROPOSED",requires_authorization:true,authority:false,external_effect:false,breaker_touched:false,created_at:new Date().toISOString()};
}
export function prioritizeLearning({outcomes=[],candidates=[]}={}) {
 return arr(candidates).map(c=>{const related=arr(outcomes).filter(o=>o.capability===c||o.subject===c);const value=related.reduce((x,o)=>x+n(o.value),0);return {candidate:c,measured_value:value,evidence_count:related.length};}).sort((a,b)=>b.measured_value-a.measured_value);
}
export function cortexOptimizationLoop({signals=[],outcomes=[],candidates=[],intent}={}) {
 const state=buildCortexState({signals,outcomes}); const learning=prioritizeLearning({outcomes,candidates});
 return {contract:CONTRACT,intent,state,learning,loop:["OBSERVE","QUALIFY","COMPOSE","PROPOSE","AUTHORIZE","EXECUTE","VERIFY","MEASURE","LEARN","RECOMPOSE"],next_action:"PROPOSED_OPTIMIZATION",authority:false,requires_human_authorization:true,breaker_touched:false};
}
export function assertTotalCortexConstitution(s={}) {
 if(s.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(s.auto_merge) throw new Error("AUTO_MERGE_FORBIDDEN");
 if(s.auto_spend) throw new Error("AUTO_SPEND_FORBIDDEN");
 if(s.auto_signature) throw new Error("AUTO_SIGNATURE_FORBIDDEN");
 if(s.authority_transfer) throw new Error("AUTHORITY_TRANSFER_FORBIDDEN");
 if(s.hidden_learning) throw new Error("HIDDEN_LEARNING_FORBIDDEN");
 return true;
}
