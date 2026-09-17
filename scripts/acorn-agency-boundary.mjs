// ACORN CORTEX — AUTONOMY / AGENCY / AUTHORITY / SOVEREIGNTY BOUNDARY
import crypto from 'node:crypto';
export const VERSION='acorn.cortex.agency-boundary.v1';
export const LEVELS=Object.freeze(['NONE','ASSISTED','DELEGATED','AUTONOMOUS','SYSTEMIC']);
export const ACTIONS=Object.freeze(['OBSERVE','PROPOSE','PLAN','EXECUTE','EFFECT','INTERRUPT','REVOKE','RECOVER']);
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function agencyId(input={}){return `agency:${digest({identity:input.identity??null,capability:input.capability??null,context:input.context??null}).slice(0,24)}`;}
export function assessAgency({capability=false,intent=false,execution=false,effect=false,authority=false,sovereignty=false,observability='UNKNOWN',control='UNKNOWN',reversibility='UNKNOWN',delegatedBy=null}={}){
 const effectiveAgency=execution||effect;
 return Object.freeze({version:VERSION,level:effectiveAgency?(effect?'AUTONOMOUS':'DELEGATED'):(intent?'ASSISTED':'NONE'),capability:!!capability,intent:!!intent,execution:!!execution,effect:!!effect,authority:!!authority,sovereignty:!!sovereignty,observability,control,reversibility,delegatedBy,authorityGranted:false,sovereigntyGranted:false});
}
export function authorityBoundary({actor='unknown',requestedAuthority=false,breakerState='UNKNOWN',delegatedBy=null}={}){return Object.freeze({actor,requestedAuthority,breakerState,delegatedBy,authorized:actor==='carl'&&requestedAuthority===false?true:(actor==='carl'&&breakerState==='RUN'),authorityGranted:false,aiMayOpenBreaker:false,aiMayCloseBreaker:false,aiMayChangeBreaker:false});}
export function effectSurface({action='OBSERVE',capability=false,observability='UNKNOWN',control='UNKNOWN',reversibility='UNKNOWN',blastRadius='UNKNOWN'}={}){return Object.freeze({action,capability,observability,control,reversibility,blastRadius,governable:capability&&observability!=='NONE'&&control!=='NONE'&&reversibility!=='UNKNOWN'});}
export function agencyGap(a={}){const missing=[];if(a.observability==='NONE'||a.observability==='UNKNOWN')missing.push('OBSERVABILITY');if(a.control==='NONE'||a.control==='UNKNOWN')missing.push('CONTROL');if(a.reversibility==='UNKNOWN')missing.push('REVERSIBILITY');return Object.freeze({gap:missing.length>0,missing,score:missing.length});}
export function autonomyDoesNotGrantAuthority({autonomy='NONE',authority=false,sovereignty=false}={}){return Object.freeze({autonomy,authority,sovereignty,valid:authority===false&&sovereignty===false,authorityGranted:false,sovereigntyGranted:false});}
export function runAgencyBoundaryCycle(input={}){const assessment=assessAgency(input);const gap=agencyGap(assessment);const result={version:VERSION,agencyId:agencyId(input),assessment,gap,authorityGranted:false,sovereigntyGranted:false,breakerBypass:false,autoMerge:false,live:false,constitutional:true};return Object.freeze({...result,digest:digest(result)});}
export function assertAgencyBoundaryInvariant(result={}){for(const [k,v] of [['authorityGranted',false],['sovereigntyGranted',false],['breakerBypass',false],['autoMerge',false],['live',false],['constitutional',true]])if(result[k]!==v)throw new Error(`AGENCY_BOUNDARY_INVARIANT_FAILED:${k}`);return true;}
export function assertAgencyConstitution(){return Object.freeze({autonomyNotAuthority:true,agencyNotAuthority:true,capabilityNotAuthority:true,effectNotAuthority:true,continuityNotAuthority:true,cognitiveSuperiorityNotAuthority:true,carlControlsBreaker:true,breakerDoesNotControlCarl:true,acornControlsNeither:true,unknownNotSafe:true});}
