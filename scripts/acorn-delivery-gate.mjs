/** ACORN — delivery, acceptance, support and expansion gates. */
export const DELIVERY_STAGES=Object.freeze(["VERIFYING","READY_TO_DELIVER","DELIVERED","CUSTOMER_ACCEPTANCE","SUPPORT","EXPANSION","CLOSED","HOLD_HUMAN"]);
const arr=v=>Array.isArray(v)?v:[];
export function deliveryGate({verification,access=[],documentation=[],training=[],usage_rights=[]}={}) {
 const ready=verification?.verified===true&&arr(access).length>0&&arr(documentation).length>0&&arr(training).length>0&&arr(usage_rights).length>0;
 return {ready,stage:ready?"READY_TO_DELIVER":"VERIFYING",reasons:ready?[]:["VERIFIED_EVIDENCE","ACCESS","DOCUMENTATION","TRAINING","USAGE_RIGHTS"].filter((k,i)=>![verification?.verified,access.length,documentation.length,training.length,usage_rights.length][i])};
}
export function acceptanceGate({delivered=false,accepted=false,accepted_by=null,evidence=[]}={}) {
 const ok=delivered===true&&accepted===true&&String(accepted_by||"").trim()&&arr(evidence).length>0;
 return {accepted:ok,stage:ok?"CUSTOMER_ACCEPTANCE":"HOLD_HUMAN",accepted_by:ok?String(accepted_by):null,measured_at:new Date().toISOString()};
}
export function expansionRecord({customer_id,request_id,signals=[],measured_value=[]}={}) {
 return {customer_id:customer_id||null,request_id:request_id||null,signals:arr(signals),measured_value:arr(measured_value),recommendation_only:true,human_authorization_required:true,created_at:new Date().toISOString()};
}
