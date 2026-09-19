import crypto from "node:crypto";
export const CONTRACT="acorn.observability-reliability-fabric.v1";
const n=v=>Number.isFinite(v)?v:null;
export function recordObservation(i={}){return {id:i.id||crypto.randomUUID(),subject:i.subject||null,status:i.status||"UNKNOWN",latency_ms:n(i.latency_ms),cost:n(i.cost),success:i.success===true,measured:i.measured===true,verified:i.verified===true,evidence:i.evidence||null,timestamp:i.timestamp||new Date().toISOString()}}
export function summarizeReliability(os=[]){const u=os.filter(o=>o.measured===true&&o.verified===true),s=u.filter(o=>o.success===true).length,l=u.map(o=>o.latency_ms).filter(v=>v!==null);return {contract:CONTRACT,samples:os.length,verified_samples:u.length,success_rate:u.length?s/u.length:null,mean_latency_ms:l.length?l.reduce((a,b)=>a+b,0)/l.length:null,measured:u.length>0,truth:"MEASURED_OBSERVATIONS_ONLY"}}
export function reliabilityGaps(s={}){const g=[];if(!s.verified_samples)g.push("NO_VERIFIED_SAMPLES");if(s.success_rate!==null&&s.success_rate<1)g.push("OBSERVED_FAILURES");if(s.mean_latency_ms===null)g.push("LATENCY_NOT_MEASURED");return g}
export function assertReliabilityConstitution(x={}){const v=[];if(x.authority===true)v.push("AUTHORITY_ESCALATION");if(x.auto_execute===true)v.push("AUTO_EXECUTION");return {contract:CONTRACT,valid:!v.length,violations:v}}
