/** ACORN MEGA 006 — Causal Reasoning Fabric. causal substrate. */
export const CONTRACT='acorn.mega.causal-reasoning.v1';
const A=v=>Array.isArray(v)?v:[]; const N=v=>Number.isFinite(Number(v))?Number(v):0;
export function createCausal({id,label,support=0,evidence=[],source='unknown'}={}){return {contract:CONTRACT,id:String(id||'causal-'+Date.now()),label:String(label||'UNKNOWN'),support:N(support),evidence:A(evidence),source:String(source),measured:false,verified:false,state:'PROPOSED',authority:false,live:false};}
export function measureCausal(rows=[]){const r=A(rows).map(x=>({...x,measured:true,measurement:{support:N(x.support)},authority:false,live:false}));return {contract:CONTRACT,records:r,count:r.length,measured_count:r.filter(x=>x.measured).length,verified_count:r.filter(x=>x.verified&&x.evidence.length).length,authority:false,live:false};}
export function selectCausal(rows=[]){return A(rows).filter(x=>x.state!=='REVOKED'&&x.state!=='EXPIRED').sort((a,b)=>N(b.support)-N(a.support))[0]||null;}
export function evolveCausal(row,{delta=0,verified=false}={}){return verified===true?{...row,support:N(row.support)+N(delta),evolution:'MEASURED_CANDIDATE',authority:false}:{...row,evolution:'HUMAN_REVIEW_REQUIRED',authority:false};}
export function assertConstitution(x={}){const v=[];if(x.authority===true)v.push('AUTHORITY_ESCALATION');if(x.auto_authorize===true)v.push('AUTO_AUTHORIZATION');if(x.auto_execute===true)v.push('AUTO_EXECUTION');if(x.fake_live===true)v.push('FAKE_LIVE');return {contract:CONTRACT,valid:v.length===0,violations:v};}
export function selfTest(){const a=createCausal({id:'a',label:'A',support:1,evidence:['e'],source:'test'});const s=measureCausal([a]);return s.count===1&&assertConstitution(s).valid;}
