export const CONTRACT="acorn.causal-dependency-fabric.v1";
const key=x=>x.id||x;
export function buildCausalDependencyGraph({nodes=[],edges=[],observations=[]}={}){
  const by=new Map(nodes.map(n=>[key(n),n])); const causal=[];
  for(const e of edges){if(e.type==="IMPORTS"||e.type==="STRUCTURAL"||e.type==="SHARED_CONTRACT")causal.push({...e,causal:false,evidence:e.evidence||"STRUCTURAL"})}
  for(const o of observations){if(o?.cause&&o?.effect&&by.has(o.cause)&&by.has(o.effect))causal.push({from:o.cause,to:o.effect,type:"OBSERVED_CAUSAL",causal:true,evidence:o.evidence})}
  const incoming=new Map(),outgoing=new Map(); for(const e of causal){outgoing.set(e.from,(outgoing.get(e.from)||0)+1);incoming.set(e.to,(incoming.get(e.to)||0)+1)}
  return {contract:CONTRACT,nodes,edges:causal,summary:{observed_causal_edges:causal.filter(e=>e.causal).length,sources:[...outgoing].sort((a,b)=>b[1]-a[1]).slice(0,20),sinks:[...incoming].sort((a,b)=>b[1]-a[1]).slice(0,20)},truth:"OBSERVED_CAUSALITY_IS_NOT_GUARANTEED_CAUSATION",authority:false,auto_execute:false,live:false}
}
export function blastRadius({graph={},start=[]}={}){const adj=new Map();for(const e of graph.edges||[]){if(!adj.has(e.from))adj.set(e.from,[]);adj.get(e.from).push(e.to)}const seen=new Set(start),q=[...start];while(q.length){for(const n of adj.get(q.shift())||[])if(!seen.has(n)){seen.add(n);q.push(n)}}return {targets:[...seen],size:seen.size,truth:"GRAPH_REACHABILITY_ONLY"}}
export function assertCausalConstitution(x={}){const v=[];if(x.authority===true)v.push("AUTHORITY_ESCALATION");if(x.auto_execute===true)v.push("AUTO_EXECUTION");if(x.live===true)v.push("FAKE_LIVE");return {contract:CONTRACT,valid:!v.length,violations:v}}
