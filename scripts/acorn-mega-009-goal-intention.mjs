/** ACORN MEGA 009 — Goal Intention Fabric. goal substrate. */
export const CONTRACT='acorn.mega.goal-intention.v1';
const A=v=>Array.isArray(v)?v:[]; const N=v=>Number.isFinite(Number(v))?Number(v):0;
export function createGoal({id,label,alignment=0,evidence=[],source='unknown'}={}){return {contract:CONTRACT,id:String(id||'goal-'+Date.now()),label:String(label||'UNKNOWN'),alignment:N(alignment),evidence:A(evidence),source:String(source),measured:false,verified:false,state:'PROPOSED',authority:false,live:false};}
export function measureGoal(rows=[]){const r=A(rows).map(x=>({...x,measured:true,measurement:{alignment:N(x.alignment)},authority:false,live:false}));return {contract:CONTRACT,records:r,count:r.length,measured_count:r.filter(x=>x.measured).length,verified_count:r.filter(x=>x.verified&&x.evidence.length).length,authority:false,live:false};}
export function selectGoal(rows=[]){return A(rows).filter(x=>x.state!=='REVOKED'&&x.state!=='EXPIRED').sort((a,b)=>N(b.alignment)-N(a.alignment))[0]||null;}
export function evolveGoal(row,{delta=0,verified=false}={}){return verified===true?{...row,alignment:N(row.alignment)+N(delta),evolution:'MEASURED_CANDIDATE',authority:false}:{...row,evolution:'HUMAN_REVIEW_REQUIRED',authority:false};}
export function assertConstitution(x={}){const v=[];if(x.authority===true)v.push('AUTHORITY_ESCALATION');if(x.auto_authorize===true)v.push('AUTO_AUTHORIZATION');if(x.auto_execute===true)v.push('AUTO_EXECUTION');if(x.fake_live===true)v.push('FAKE_LIVE');return {contract:CONTRACT,valid:v.length===0,violations:v};}
export function selfTest(){const a=createGoal({id:'a',label:'A',alignment:1,evidence:['e'],source:'test'});const s=measureGoal([a]);return s.count===1&&assertConstitution(s).valid;}
