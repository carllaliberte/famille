/** ACORN — BUSINESS OPERATING SYSTEM
 * Unifies customer, execution, evidence, delivery, value and product loops.
 * It creates decisions and artifacts; it never creates authority.
 */
import crypto from "node:crypto";
const ISO=()=>new Date().toISOString(), id=p=>p+"_"+crypto.randomUUID();
const hasMeasured=e=>Array.isArray(e)&&e.length>0&&e.every(x=>x?.status==="MEASURED");
const state=(name,data={})=>({id:id(name.toLowerCase()),state:name,measured_at:ISO(),...data});
export const BUSINESS_OS_POLICY=Object.freeze({
 capability_is_not_authority:true,measured_only:true,projected_is_not_realized:true,payment_is_not_receipt:true,
 human_authorization_required:true,human_contract:true,human_payment:true,human_spend:true,human_publish:true,human_merge:true,
 auto_outreach:false,auto_contract:false,auto_payment:false,auto_spend:false,auto_publish:false,auto_sign:false,auto_merge:false,secret_custody:false
});
export function createBusinessCase({customer,problem,context={},constraints=[],desiredOutcome}={}) {
 return state("INTAKE",{customer,problem,context,constraints,desired_outcome:desiredOutcome,stage:"INTAKE",authorization:{required:true,granted:false}});
}
export function qualifyBusinessCase(businessCase,{capabilities=[],evidence=[],fit="UNKNOWN",risk="UNKNOWN"}={}) {
 if(!businessCase?.id)return {state:"BLOCKED",reason:"BUSINESS_CASE_REQUIRED"};
 return {...businessCase,stage:"QUALIFIED",qualification:{fit,risk,capabilities,evidence_count:evidence.length},measured_at:ISO()};
}
export function designBusinessSolution(businessCase,{solution,deliverables=[],usageRights=["PERPETUAL_USE"],acceptanceCriteria=[],implementationPlan=[]}={}) {
 if(businessCase?.stage!=="QUALIFIED")return {state:"BLOCKED",reason:"QUALIFICATION_REQUIRED"};
 return state("SOLUTION_DESIGNED",{business_case_id:businessCase.id,solution,deliverables,usage_rights:usageRights,acceptance_criteria:acceptanceCriteria,implementation_plan:implementationPlan});
}
export function createBusinessOffer(solution,{price,currency="CAD",scope=[],terms=[],support="STANDARD"}={}) {
 if(solution?.state!=="SOLUTION_DESIGNED")return {state:"BLOCKED",reason:"SOLUTION_REQUIRED"};
 if(!(Number(price)>0)||!scope.length)return {state:"BLOCKED",reason:"PRICE_AND_SCOPE_REQUIRED"};
 return state("OFFER_READY",{solution_id:solution.id,price:Number(price),currency,scope,terms,support,human_review_required:true,authorization:{required:true,granted:false}});
}
export function authorizeBusinessOffer(offer,{humanAuthorized=false,authorizedBy=null}={}) {
 if(offer?.state!=="OFFER_READY")return {state:"BLOCKED",reason:"OFFER_NOT_READY"};
 if(!humanAuthorized)return {...offer,state:"AWAITING_HUMAN_AUTHORIZATION",authorization:{required:true,granted:false}};
 return {...offer,state:"AUTHORIZED",authorization:{required:true,granted:true,authorized_by:authorizedBy,authorized_at:ISO()}};
}
export function buildBusinessExecution(authorizedOffer,{tasks=[],intelligences=[],connectors=[]}={}) {
 if(authorizedOffer?.state!=="AUTHORIZED")return {state:"BLOCKED",reason:"HUMAN_AUTHORIZATION_REQUIRED"};
 return state("EXECUTION_READY",{offer_id:authorizedOffer.id,tasks,intelligences,connectors,effects:tasks.map(t=>({task_id:t.id||id("task"),effect:t.effect||"READ",external_effect:false,human_authorized:true})),authority:{human:true,ai_authority:false}});
}
export function recordBusinessExecution(execution,{results=[],evidence=[]}={}) {
 if(execution?.state!=="EXECUTION_READY")return {state:"BLOCKED",reason:"EXECUTION_NOT_READY"};
 const measured=hasMeasured(evidence);
 return state("EXECUTED",{execution_id:execution.id,results,evidence_count:evidence.length,measured_evidence:measured,external_effects_verified:false,completion:measured&&results.length>0?"EVIDENCE_PENDING_DELIVERY":"EVIDENCE_INSUFFICIENT"});
}
export function verifyBusinessDelivery({execution,access=false,documentation=false,training=false,usageRights=false,evidence=[]}={}) {
 const ready=execution?.state==="EXECUTED"&&access&&documentation&&training&&usageRights&&hasMeasured(evidence);
 return state(ready?"DELIVERY_VERIFIED":"DELIVERY_BLOCKED",{execution_id:execution?.id||null,checks:{access,documentation,training,usage_rights:usageRights,measured_evidence:hasMeasured(evidence)},human_acceptance_required:true});
}
export function acceptBusinessDelivery(delivery,{humanAccepted=false,acceptedBy=null}={}) {
 if(delivery?.state!=="DELIVERY_VERIFIED")return {state:"BLOCKED",reason:"DELIVERY_VERIFICATION_REQUIRED"};
 if(!humanAccepted)return {...delivery,state:"AWAITING_HUMAN_ACCEPTANCE",accepted:false};
 return {...delivery,state:"ACCEPTED",accepted:true,accepted_by:acceptedBy,accepted_at:ISO()};
}
export function measureBusinessValue({acceptedDelivery,value,evidence=[]}={}) {
 if(acceptedDelivery?.state!=="ACCEPTED")return {state:"BLOCKED",reason:"HUMAN_ACCEPTANCE_REQUIRED"};
 const measured=hasMeasured(evidence);
 return state(measured?"VALUE_MEASURED":"VALUE_PENDING",{delivery_id:acceptedDelivery.id,value,evidence_count:evidence.length,measured,projected:false});
}
export function captureBusinessAsset(valueRecord,{assetPattern,implementationNotes=[],reuseScope="INTERNAL_REUSE"}={}) {
 if(valueRecord?.state!=="VALUE_MEASURED")return {state:"BLOCKED",reason:"MEASURED_VALUE_REQUIRED"};
 return state("ASSET_CAPTURED",{value_record_id:valueRecord.id,asset_pattern:assetPattern,implementation_notes:implementationNotes,reuse_scope:reuseScope,rights_status:"HUMAN_REVIEW_REQUIRED"});
}
export function productizeBusinessAsset(asset,{name,problemClass,deliverables=[],offerBasis="HUMAN_SET"}={}) {
 if(asset?.state!=="ASSET_CAPTURED")return {state:"BLOCKED",reason:"ASSET_REQUIRED"};
 return state("PRODUCT_CANDIDATE",{asset_id:asset.id,name,problem_class:problemClass,deliverables,offer_basis:offerBasis,human_publish_required:true});
}
export function buildBusinessCommandCenter({cases=[],offers=[],executions=[],deliveries=[],values=[],assets=[],products=[]}={}) {
 const count=(xs,s)=>xs.filter(x=>x?.state===s).length;
 return {system:"ACORN_BUSINESS_OS",measured_at:ISO(),funnel:{intake:cases.length,qualified:count(cases,"QUALIFIED"),offers_ready:count(offers,"OFFER_READY"),authorized:count(offers,"AUTHORIZED"),execution_ready:count(executions,"EXECUTION_READY"),delivered:count(deliveries,"DELIVERY_VERIFIED"),accepted:count(deliveries,"ACCEPTED"),measured_value:count(values,"VALUE_MEASURED"),assets:count(assets,"ASSET_CAPTURED"),products:count(products,"PRODUCT_CANDIDATE")},policy:BUSINESS_OS_POLICY};
}
export function businessReadiness({businessCase,solution,offer,execution,delivery,value}={}) {
 const blockers=[];
 if(!businessCase?.id)blockers.push("INTAKE_REQUIRED");
 if(solution?.state!=="SOLUTION_DESIGNED")blockers.push("SOLUTION_REQUIRED");
 if(offer?.state!=="AUTHORIZED")blockers.push("HUMAN_AUTHORIZATION_REQUIRED");
 if(execution?.state!=="EXECUTION_READY")blockers.push("EXECUTION_NOT_READY");
 if(delivery?.state!=="DELIVERY_VERIFIED")blockers.push("DELIVERY_NOT_VERIFIED");
 if(value?.state!=="VALUE_MEASURED")blockers.push("VALUE_NOT_MEASURED");
 return {ready:blockers.length===0,blockers,measured_at:ISO()};
}
