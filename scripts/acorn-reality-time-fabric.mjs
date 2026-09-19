/** ACORN MEGA 001 — Reality Time Fabric. Temporal observation is evidence, never authority or LIVE proof. */
export const CONTRACT='acorn.reality-time-fabric.v1';
const S=v=>String(v??'').trim();
export function observeTime({timestamp=new Date().toISOString(),source='system',evidence=[]}={}){return {contract:CONTRACT,timestamp,source:S(source)||'unknown',evidence:Array.isArray(evidence)?evidence:[],observed:true,measured:true,verified:false,live:false,authority:false};}
export function compareTime(a,b){return {delta_ms:Date.parse(b.timestamp)-Date.parse(a.timestamp),ordered:Date.parse(a.timestamp)<=Date.parse(b.timestamp),authority:false};}
export function buildTemporalContext(observations=[]){const rows=Array.isArray(observations)?observations.filter(x=>x&&x.observed):[];return {contract:CONTRACT,observations:rows,current:rows.at(-1)||null,stale_count:rows.filter(x=>Date.now()-Date.parse(x.timestamp)>86400000).length,authority:false,live:false};}
export function assertRealityTime(x={}){const violations=[];if(x.authority===true)violations.push('AUTHORITY_ESCALATION');if(x.fake_live===true)violations.push('FAKE_LIVE');return {valid:!violations.length,violations};}
