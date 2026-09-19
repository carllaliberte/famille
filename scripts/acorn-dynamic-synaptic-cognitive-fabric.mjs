/** ACORN — DYNAMIC SYNAPTIC COGNITIVE FABRIC
 * Canonical dynamic graph between world state, capabilities, intelligences,
 * resources and outcomes. Synapses route cognition; they never grant authority.
 */
import crypto from "node:crypto";
export const CONTRACT="acorn.dynamic-synaptic-cognitive-fabric.v1";
export const NODE_TYPES=Object.freeze(["ENTITY","CAPABILITY","INTELLIGENCE","TOOL","MEMORY","RESOURCE","OUTCOME"]);
export const EDGE_STATES=Object.freeze(["PROPOSED","QUALIFIED","ACTIVE","DEGRADED","EXPIRED","REVOKED"]);
const A=v=>Array.isArray(v)?v:[]; const now=()=>new Date().toISOString();
const uid=p=>`${p}_${crypto.randomUUID()}`;
const finite=n=>Number.isFinite(Number(n))?Number(n):null;

export function createSynapticNode({id,type,label=null,capabilities=[],evidence=[],state="QUALIFIED",cost=null,latency_ms=null,reliability=null}={}){
 if(!id) throw new Error("NODE_ID_REQUIRED"); if(!NODE_TYPES.includes(type)) throw new Error("NODE_TYPE_UNSUPPORTED");
 return Object.freeze({id:String(id),type,label:label===null?null:String(label),capabilities:[...new Set(A(capabilities).map(String))],
   evidence:A(evidence),state,cost:finite(cost),latency_ms:finite(latency_ms),reliability:finite(reliability),
   authority:false,created_at:now()});
}
export function createSynapse({from,to,capability,context={},evidence=[],weight=0.5,state="PROPOSED",cost=null,latency_ms=null,reliability=null}={}){
 if(!from||!to) throw new Error("SYNAPSE_ENDPOINTS_REQUIRED"); if(!capability) throw new Error("SYNAPSE_CAPABILITY_REQUIRED");
 return {id:uid("syn"),from:String(from),to:String(to),capability:String(capability),context:{...context},
   evidence:A(evidence),weight:Math.min(1,Math.max(0,Number(weight))),state,
   cost:finite(cost),latency_ms:finite(latency_ms),reliability:finite(reliability),
   authority:false,breaker_touched:false,created_at:now()};
}
export function qualifySynapse(synapse,{required_evidence=1,min_reliability=0}={}){
 const evidence=A(synapse?.evidence); const reliability=finite(synapse?.reliability);
 const qualified=evidence.length>=required_evidence && (reliability===null||reliability>=min_reliability);
 return {...synapse,state:qualified?"QUALIFIED":"PROPOSED",qualified_at:now(),authority:false};
}
export function scoreSynapse(synapse,{weights={evidence:0.3,reliability:0.3,cost:0.15,latency:0.1,weight:0.15}}={}){
 const e=Math.min(1,A(synapse?.evidence).length>0?1:0);
 const r=finite(synapse?.reliability)===null?0.5:Math.max(0,Math.min(1,finite(synapse.reliability)));
 const c=finite(synapse?.cost)===null?0.5:1/(1+Math.max(0,finite(synapse.cost)));
 const l=finite(synapse?.latency_ms)===null?0.5:1/(1+Math.max(0,finite(synapse.latency_ms)/1000));
 const w=Math.max(0,Math.min(1,finite(synapse?.weight)??0));
 const total=weights.evidence*e+weights.reliability*r+weights.cost*c+weights.latency*l+weights.weight*w;
 return {score:total,components:{evidence:e,reliability:r,cost:c,latency:l,weight:w},measured_at:now(),authority:false};
}
export function routeSynapses({from,required_capability,synapses=[],nodes=[],context={},max_results=5}={}){
 const nodeIds=new Set(A(nodes).map(n=>n.id));
 const candidates=A(synapses).filter(s=>s.from===from&&s.capability===required_capability&&nodeIds.has(s.to)&&["QUALIFIED","ACTIVE"].includes(s.state));
 const ranked=candidates.map(s=>({...s,score:scoreSynapse(s,{})})).sort((a,b)=>b.score.score-a.score.score);
 return {contract:CONTRACT,from,required_capability,context,candidates:ranked.slice(0,Math.max(1,max_results)),authority:false,breaker_touched:false};
}
export function learnSynapse({synapse,outcome={}}={}){
 const success=outcome.verified===true&&outcome.measured===true&&outcome.valid!==false;
 const delta=success?0.05:-0.02;
 return {...synapse,weight:Math.max(0,Math.min(1,(Number(synapse.weight)||0)+delta)),
   learning:{state:success?"LEARNED":"NO_LEARNING",delta,measured:outcome.measured===true,verified:outcome.verified===true},
   authority:false};
}
export function optimizeSynapticGraph({synapses=[],outcomes=[],weights={}}={}){
 const learnedById=new Map(A(outcomes).map(o=>[o.synapse_id,o]));
 const updated=A(synapses).map(s=>learnedById.has(s.id)?learnSynapse({synapse:s,outcome:learnedById.get(s.id)}):s);
 const ranked=updated.map(s=>({...s,score:scoreSynapse(s,{weights})})).sort((a,b)=>b.score.score-a.score.score);
 return {contract:CONTRACT,state:"OPTIMIZATION_CANDIDATE",synapses:ranked,learning_requires_measured_verified:true,authority:false,breaker_touched:false,optimized_at:now()};
}
export function buildSynapticSnapshot({nodes=[],synapses=[],at=Date.now()}={}){
 const cutoff=new Date(at).toISOString();
 return {contract:CONTRACT,captured_at:cutoff,nodes:A(nodes),synapses:A(synapses),
   active_synapses:A(synapses).filter(s=>["QUALIFIED","ACTIVE"].includes(s.state)),authority:false};
}
export function assertSynapticConstitution(snapshot={}){
 if(snapshot.authority===true) throw new Error("SYNAPSES_CANNOT_GRANT_AUTHORITY");
 if(snapshot.breaker_touched===true) throw new Error("SYNAPSES_CANNOT_TOUCH_BREAKER");
 if(snapshot.auto_authorize===true) throw new Error("SYNAPSES_CANNOT_AUTHORIZE");
 if(snapshot.external_effect===true) throw new Error("SYNAPSES_CANNOT_EXECUTE");
 if(snapshot.hidden_learning===true) throw new Error("SYNAPTIC_LEARNING_MUST_BE_EXPLICIT");
 return true;
}
