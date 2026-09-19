export const CONTRACT="acorn.continuous-system-context-fabric.v2";
const A=v=>Array.isArray(v)?v:[];
function ts(x){const n=Date.parse(x?.timestamp||0);return Number.isFinite(n)?n:-Infinity}
function age(x,now){const a=ts(x),n=Date.parse(now||new Date().toISOString());return Number.isFinite(n)&&a>-Infinity?Math.max(0,n-a):Infinity}
function key(x){return x?.entity_id||x?.subject||x?.id||null}
export function buildSystemContext({events=[],observations=[],nodes=[],now=new Date().toISOString(),freshnessMs=300000}={}){
 const all=[...A(events),...A(observations)].filter(x=>key(x));
 const byKey=new Map(); for(const x of all){const k=key(x);const arr=byKey.get(k)||[];arr.push(x);byKey.set(k,arr)}
 const contradictions=[]; const current=[];
 for(const [k,arr] of byKey){arr.sort((a,b)=>ts(b)-ts(a)); const latest=arr[0]; const values=new Set(arr.map(x=>JSON.stringify(x.value))); if(values.size>1&&arr.length>1) contradictions.push({key:k,count:arr.length,conflicting_values:[...values]}); current.push({...latest,freshness_ms:age(latest,now),fresh:age(latest,now)<=freshnessMs,observation_count:arr.length})}
 current.sort((a,b)=>String(key(a)).localeCompare(String(key(b))));
 return {contract:CONTRACT,current,contradictions,node_count:A(nodes).length,event_count:A(events).length,observation_count:A(observations).length,state:contradictions.length?"CONTRADICTIONS_PRESENT":current.length?"CONTEXT_AVAILABLE":"CONTEXT_GAP",truth:"CURRENT_CONTEXT_IS_TIME_BOUNDED_AND_RECONCILABLE",authority:false,auto_authorize:false,auto_execute:false,live:false};
}
export function selectContextForTask({context={},task={}}={}){
 const required=A(task.required_entities); const selected=(context.current||[]).filter(x=>!required.length||required.includes(key(x)));
 return {task,selected,missing:required.filter(k=>!selected.some(x=>key(x)===k)),stale:selected.filter(x=>x.fresh===false).map(key),contradictions:context.contradictions||[],authority:false,live:false};
}
export function reconcileContext({current=[],newEvidence=[],now=new Date().toISOString(),freshnessMs=300000}={}){
 const merged=[...A(current)]; for(const e of A(newEvidence)){const k=key(e);const i=merged.findIndex(x=>key(x)===k);if(i<0)merged.push(e);else if(ts(e)>=ts(merged[i]))merged[i]=e}
 const refreshed=buildSystemContext({observations:merged,now,freshnessMs}); return {...refreshed,state:"RECONCILED"};
}
export function buildContextDelta({before={},after={}}={}){
 const a=new Map(A(before.current).map(x=>[key(x),x])),b=new Map(A(after.current).map(x=>[key(x),x]));
 return {changed:[...b.keys()].filter(k=>a.has(k)&&JSON.stringify(b.get(k))!==JSON.stringify(a.get(k))),added:[...b.keys()].filter(k=>!a.has(k)),removed:[...a.keys()].filter(k=>!b.has(k)),authority:false};
}
export function assertContextConstitution(x={}){const v=[];if(x.authority===true)v.push("AUTHORITY_ESCALATION");if(x.auto_authorize===true)v.push("AUTO_AUTHORIZATION");if(x.auto_execute===true)v.push("AUTO_EXECUTION");if(x.fake_live===true)v.push("FAKE_LIVE");if(x.hidden_context===true)v.push("HIDDEN_CONTEXT");return {contract:CONTRACT,valid:!v.length,violations:v};}
