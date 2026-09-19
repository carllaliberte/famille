import { buildSystemContext } from "./acorn-continuous-system-context-fabric.mjs";
import { buildInteroperabilitySnapshot } from "./acorn-neural-interoperability-fabric.mjs";
import { measureArchitecture } from "./acorn-measured-global-convergence.mjs";
export const CONTRACT="acorn.system-evolution-conductor.v1";
export const CYCLE=Object.freeze(["INGEST","CONTEXTUALIZE","MEASURE","RECONCILE","DETECT_GAPS","GENERATE_CANDIDATES","SIMULATE","REQUEST_HUMAN_AUTHORIZATION","ADOPT_THROUGH_GOVERNANCE","OBSERVE","VERIFY","LEARN","REOBSERVE"]);
const A=v=>Array.isArray(v)?v:[];
export function measureSystem({root=process.cwd(),events=[],observations=[],nodes=[],edges=[],evidence=[],contracts=[],runtime=[],now=new Date().toISOString()}={}){
 const context=buildSystemContext({events,observations,nodes,now});
 const interop=buildInteroperabilitySnapshot({nodes,edges});
 const architecture=measureArchitecture({root,contracts,runtime,evidence});
 const gaps=[
  ...context.contradictions.map(x=>({kind:"CONTRADICTION",key:x.key})),
  ...context.current.filter(x=>x.fresh===false).map(x=>({kind:"STALE_CONTEXT",key:x.entity_id||x.subject||x.id})),
  ...interop.unconnected.map(x=>({kind:"UNCONNECTED_NODE",key:x})),
  ...architecture.missing.map(x=>({kind:x.kind,key:x.key,id:x.id}))
 ];
 return {contract:CONTRACT,context,interoperability:interop,architecture,gaps,state:gaps.length?"GAPS_MEASURED":"REOBSERVE_REQUIRED",truth:"SYSTEM_EVOLUTION_IS_MEASURED_NOT_SELF_AUTHORIZING",authority:false,auto_authorize:false,auto_execute:false,live:false};
}
export function generateEvolutionCandidates(snapshot={}){const seen=new Set();return A(snapshot.gaps).filter(g=>{const k=g.kind+":"+g.key;if(seen.has(k))return false;seen.add(k);return true}).slice(0,100).map((g,i)=>({id:"evolution-"+i,trigger:g,steps:["BASELINE","HYPOTHESIS","SIMULATE","TEST","MEASURE","VERIFY"],requires_human_authorization:true,auto_adopt:false,governance_required:true,authority:false}));}
export function runSystemEvolution(input={}){const measured=measureSystem(input);return {...measured,candidates:generateEvolutionCandidates(measured),next_action:measured.gaps.length?"CLOSE_MEASURED_GAPS":"REOBSERVE_SYSTEM"};}
export function assertSystemEvolutionConstitution(x={}){const v=[];if(x.authority===true)v.push("AUTHORITY_ESCALATION");if(x.auto_authorize===true)v.push("AUTO_AUTHORIZATION");if(x.auto_execute===true)v.push("AUTO_EXECUTION");if(x.auto_adopt===true)v.push("AUTO_ADOPTION");if(x.breaker_bypass===true)v.push("BREAKER_BYPASS");if(x.fake_live===true)v.push("FAKE_LIVE");return {contract:CONTRACT,valid:!v.length,violations:v};}
