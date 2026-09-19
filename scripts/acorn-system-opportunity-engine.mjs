export const CONTRACT="acorn.system-opportunity-engine.v1";
export function deriveOpportunities({intelligence={},causal={},genome={}}={}){
 const out=[]; for(const g of intelligence.gaps?.items||[])out.push({kind:"GAP_CLOSURE",target:g,priority:5,requires_measurement:true});
 for(const n of intelligence.structure?.isolated||[])out.push({kind:"INTEGRATION",target:n,priority:4,requires_measurement:true});
 for(const r of intelligence.resources?.pressured||[])out.push({kind:"RESOURCE_OPTIMIZATION",target:r.id||"resource",priority:4,requires_measurement:true});
 for(const c of intelligence.capabilities?.weak||[])out.push({kind:"CAPABILITY_QUALIFICATION",target:c.id||"capability",priority:3,requires_measurement:true});
 return {contract:CONTRACT,opportunities:out.slice(0,100),selection:"EVIDENCE_AND_MEASUREMENT_REQUIRED",authority:false,auto_authorize:false,auto_execute:false,live:false}
}
export function assertOpportunityConstitution(x={}){const v=[];if(x.authority===true)v.push("AUTHORITY_ESCALATION");if(x.auto_authorize===true)v.push("AUTO_AUTHORIZATION");if(x.auto_execute===true)v.push("AUTO_EXECUTION");return {contract:CONTRACT,valid:!v.length,violations:v}}
