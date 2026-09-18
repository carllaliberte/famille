/** ACORN — DEVELOPER HALL OF CAPABILITY
 * Evidence-backed attribution, not endorsement or partnership.
 */
const ISO=()=>new Date().toISOString(), arr=v=>Array.isArray(v)?v:[];
export const DEVELOPER_HALL_VERSION="acorn.developer-hall.v1";
export function createDeveloperContribution({id,developer,ecosystem,capabilities=[],evidence=[],links=[],status="DISCOVERED",measured_value=null}={}){
 if(!id||!developer||!ecosystem) throw Error("DEVELOPER_CONTRIBUTION_REQUIRED");
 return {contract:DEVELOPER_HALL_VERSION,id,developer,ecosystem,capabilities:arr(capabilities),evidence:arr(evidence),links:arr(links),status,measured_value,attribution:"evidence-backed contribution",endorsement:false,partnership:false,sponsorship:false,authority:false,measured_at:ISO()};
}
export function buildDeveloperHall({contributions=[]}={}){return {contract:DEVELOPER_HALL_VERSION,contributions:arr(contributions),count:arr(contributions).length,claims:"ATTRIBUTION_ONLY",authority:false,measured_at:ISO()};}
export function spotlightMeasuredCapabilities({contributions=[],limit=20}={}){return arr(contributions).filter(x=>x&&arr(x.evidence).length>0).sort((a,b)=>Number(Boolean(b.measured_value))-Number(Boolean(a.measured_value))).slice(0,limit);}
