/** ACORN MEGA 008 — Attention Priority Fabric. attention substrate. */
export const CONTRACT='acorn.mega.attention-priority.v1';
const A=v=>Array.isArray(v)?v:[]; const N=v=>Number.isFinite(Number(v))?Number(v):0;
export function createAttention({id,label,urgency=0,evidence=[],source='unknown'}={}){return {contract:CONTRACT,id:String(id||'attention-'+Date.now()),label:String(label||'UNKNOWN'),urgency:N(urgency),evidence:A(evidence),source:String(source),measured:false,verified:false,state:'PROPOSED',authority:false,live:false};}
export function measureAttention(rows=[]){const r=A(rows).map(x=>({...x,measured:true,measurement:{urgency:N(x.urgency)},authority:false,live:false}));return {contract:CONTRACT,records:r,count:r.length,measured_count:r.filter(x=>x.measured).length,verified_count:r.filter(x=>x.verified&&x.evidence.length).length,authority:false,live:false};}
export function selectAttention(rows=[]){return A(rows).filter(x=>x.state!=='REVOKED'&&x.state!=='EXPIRED').sort((a,b)=>N(b.urgency)-N(a.urgency))[0]||null;}
export function evolveAttention(row,{delta=0,verified=false}={}){return verified===true?{...row,urgency:N(row.urgency)+N(delta),evolution:'MEASURED_CANDIDATE',authority:false}:{...row,evolution:'HUMAN_REVIEW_REQUIRED',authority:false};}
export function assertConstitution(x={}){const v=[];if(x.authority===true)v.push('AUTHORITY_ESCALATION');if(x.auto_authorize===true)v.push('AUTO_AUTHORIZATION');if(x.auto_execute===true)v.push('AUTO_EXECUTION');if(x.fake_live===true)v.push('FAKE_LIVE');return {contract:CONTRACT,valid:v.length===0,violations:v};}
export function selfTest(){const a=createAttention({id:'a',label:'A',urgency:1,evidence:['e'],source:'test'});const s=measureAttention([a]);return s.count===1&&assertConstitution(s).valid;}
