/** ACORN — production control plane: commercial + operations + customer value. */
export const CONTROL_VERSION="acorn.production-control.v1";
export const HARD_BOUNDARIES=Object.freeze({
  auto_contract:false,auto_payment_capture:false,auto_spend:false,secret_custody:false,
  auto_outreach:false,auto_merge:false,invented_live:false,human_authorization_required:true
});
const s=v=>String(v??"").trim();
const arr=v=>Array.isArray(v)?v:[];
export function buildOfferCatalog({assets=[],projects=[],currency="CAD"}={}) {
  return arr(assets).filter(a=>a?.validated===true).map(a=>({
    id:s(a.id),name:s(a.name||a.title||a.id),source_asset_id:s(a.id),
    price_basis:s(a.price_basis||"HUMAN_DEFINED"),currency,
    usage_rights:arr(a.usage_rights),evidence:arr(a.evidence),
    publishable:false,requires_human_publish:true
  }));
}
export function operationsSnapshot({requests=[],jobs=[],evidence=[],now=new Date().toISOString()}={}) {
  const counts=(items,key)=>items.reduce((m,x)=>{const k=s(x?.[key]||"UNKNOWN");m[k]=(m[k]||0)+1;return m},{});
  return {version:CONTROL_VERSION,measured_at:now,requests:counts(requests,"status"),jobs:counts(jobs,"state"),
    evidence_current:evidence.filter(e=>!e.valid_until||Date.parse(e.valid_until)>=Date.parse(now)).length,
    boundaries:HARD_BOUNDARIES};
}
export function customerValueRecord({request_id,customer_id,metrics=[],evidence=[]}={}) {
  return {request_id:s(request_id)||null,customer_id:s(customer_id)||null,metrics:arr(metrics),
    evidence_ids:arr(evidence).map(e=>e.id||e.evidence_id).filter(Boolean),
    measured:true,settled:false,measured_at:new Date().toISOString()};
}
