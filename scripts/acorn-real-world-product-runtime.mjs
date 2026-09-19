export const CONTRACT="acorn.real-world-product-runtime.v1";
const ok=x=>x?.verified===true&&x?.measured===true&&x?.evidence;
export function defineProductRuntime({project={},capabilities=[],connectors=[],outcomes=[]}={}){
 const qualified=capabilities.filter(ok),live=connectors.filter(x=>x?.state==="LIVE_VERIFIED"&&x?.evidence),proven=outcomes.filter(ok);
 return {contract:CONTRACT,state:qualified.length&&live.length?"READY_FOR_GOVERNED_DELIVERY":"INSUFFICIENT_REALITY_EVIDENCE",project,qualified_capabilities:qualified.length,live_connectors:live.length,verified_outcomes:proven.length,customer_value_evidence:proven.filter(x=>x.dimension==="CUSTOMER_VALUE").length,human_gate:true,external_effect_requires_existing_governance:true,authority:false,auto_contract:false,auto_spend:false,auto_publish:false,auto_execute:false,live:false}
}
export function buildDeliveryPlan({product={},capabilities=[],connectors=[]}={}){return {contract:CONTRACT,stages:["INTAKE","QUALIFY","DESIGN","BUILD","VERIFY","DELIVER_THROUGH_GOVERNANCE","OBSERVE","MEASURE","LEARN"],product,capabilities:capabilities.filter(ok),connectors:connectors.filter(x=>x?.state==="LIVE_VERIFIED"),human_authorization_required:true,auto_execute:false}}
export function assertProductRuntimeConstitution(x={}){const v=[];if(x.authority===true)v.push("AUTHORITY_ESCALATION");if(x.auto_contract===true)v.push("AUTO_CONTRACT");if(x.auto_spend===true)v.push("AUTO_SPEND");if(x.auto_execute===true)v.push("AUTO_EXECUTION");if(x.live===true)v.push("FAKE_LIVE");return {contract:CONTRACT,valid:!v.length,violations:v}}
