import crypto from "node:crypto";
export const SYSTEM_INTELLIGENCE_VERSION = "acorn.system-intelligence-layer.v1";
export const TRUTH = "MEASURED_SYSTEM_INTELLIGENCE_NOT_AUTONOMOUS_AUTHORITY";

const stableHash = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const arr = value => Array.isArray(value) ? value : [];
const measured = x => x?.measured === true;
const verified = x => x?.verified === true;
const validEvidence = x => measured(x) && verified(x) && Array.isArray(x.evidence) && x.evidence.length > 0;

export function buildDependencyGraph({nodes=[], edges=[]}={}) {
  const out = new Map(arr(nodes).map(n=>[n.id,{...n,depends_on:[]}]));
  for (const e of arr(edges)) {
    if (!out.has(e.from) || !out.has(e.to)) continue;
    out.get(e.from).depends_on.push(e.to);
  }
  return [...out.values()].map(n=>({...n,depends_on:[...new Set(n.depends_on)]}));
}

export function analyzeCriticalPaths({nodes=[],edges=[]}={}) {
  const incoming=new Map(arr(nodes).map(n=>[n.id,0]));
  const outgoing=new Map(arr(nodes).map(n=>[n.id,[]]));
  for(const e of arr(edges)){
    if(!incoming.has(e.to)||!outgoing.has(e.from)) continue;
    incoming.set(e.to,incoming.get(e.to)+1); outgoing.get(e.from).push(e.to);
  }
  const queue=[...incoming].filter(([,d])=>d===0).map(([id])=>id), depth=new Map(queue.map(id=>[id,1]));
  for(let i=0;i<queue.length;i++){const id=queue[i];for(const next of outgoing.get(id)||[]){depth.set(next,Math.max(depth.get(next)||1,(depth.get(id)||1)+1));if((incoming.get(next)-=1)===0)queue.push(next);}}
  const max=Math.max(0,...depth.values());
  return {max_depth:max,critical_nodes:[...depth].filter(([,d])=>d===max).map(([id])=>id),cycle_detected:queue.length!==incoming.size};
}

export function calculateBlastRadius({node_id,nodes=[],edges=[]}={}) {
  const adjacency=new Map(arr(nodes).map(n=>[n.id,[]]));
  for(const e of arr(edges)){if(adjacency.has(e.from)&&adjacency.has(e.to))adjacency.get(e.from).push(e.to);}
  const seen=new Set(), q=[node_id]; while(q.length){const id=q.shift();if(seen.has(id))continue;seen.add(id);for(const x of adjacency.get(id)||[])q.push(x);}
  seen.delete(node_id); return {node_id,affected_nodes:[...seen],blast_radius:seen.size};
}

export function analyzeCapabilityReuse({capabilities=[],routes=[]}={}) {
  const use=new Map(arr(capabilities).map(c=>[c.id,{id:c.id,uses:0,consumers:[]}]));
  for(const r of arr(routes)) for(const c of arr(r.capabilities)) if(use.has(c)){use.get(c).uses++;use.get(c).consumers.push(r.consumer_id||r.id||"unknown");}
  return [...use.values()].map(x=>({...x,underused:x.uses===0,reused:x.uses>1}));
}

export function analyzeResourceBottlenecks({resources=[],observations=[]}={}) {
  const stats=new Map(arr(resources).map(r=>[r.id,{id:r.id,observations:0,failures:0,total_cost:0,total_latency:0}]));
  for(const o of arr(observations)){const s=stats.get(o.resource_id);if(!s)continue;s.observations++;if(o.success===false)s.failures++;s.total_cost+=Number(o.cost||0);s.total_latency+=Number(o.latency_ms||0);}
  return [...stats.values()].map(s=>({...s,success_rate:s.observations?s.observations-s.failures/s.observations:0,avg_cost:s.observations?s.total_cost/s.observations:0,avg_latency_ms:s.observations?s.total_latency/s.observations:0}));
}

export function identifyEvidenceGaps({claims=[],evidence=[]}={}) {
  const ids=new Set(arr(evidence).filter(validEvidence).map(e=>e.id));
  return arr(claims).filter(c=>!arr(c.evidence_ids).some(id=>ids.has(id))).map(c=>({claim_id:c.id,type:"UNSUPPORTED_CLAIM",severity:"HIGH"}));
}

export function prioritizeNextObservations({gaps=[],candidates=[]}={}) {
  const gapIds=new Set(arr(gaps).map(g=>g.id||g.claim_id));
  return arr(candidates).map(c=>({...c,priority_score:Number(c.information_gain||0)-Number(c.cost||0)-Number(c.risk||0)+(gapIds.has(c.gap_id)?100:0)})).sort((a,b)=>b.priority_score-a.priority_score);
}

export function buildSystemIntelligence({forest={},proof={},reliability={},capabilities=[],routes=[],resources=[],observations=[],claims=[],evidence=[],observation_candidates=[]}={}) {
  const nodes=arr(forest.nodes), edges=arr(forest.edges);
  const critical=analyzeCriticalPaths({nodes,edges});
  const gaps=[
    ...arr(forest.gaps).map(g=>({...g,type:g.type||"STRUCTURAL_GAP"})),
    ...identifyEvidenceGaps({claims,evidence})
  ];
  const reuse=analyzeCapabilityReuse({capabilities,routes});
  const resource_stats=analyzeResourceBottlenecks({resources,observations});
  const next=prioritizeNextObservations({gaps,candidates:observation_candidates});
  const snapshot={
    version:SYSTEM_INTELLIGENCE_VERSION,
    state:gaps.length?"INTELLIGENCE_GAPS_MEASURED":"SYSTEM_REOBSERVATION_REQUIRED",
    truth:TRUTH,
    structure:{nodes:nodes.length,edges:edges.length,critical},
    capability_reuse:reuse,
    resource_bottlenecks:resource_stats,
    evidence_gaps:gaps,
    reliability:reliability,
    next_observations:next.slice(0,50),
    proof_health:proof,
    authority:"carl",
    auto_authorize:false,
    auto_execute:false,
    external_effect:false,
    live:false
  };
  return {...snapshot,fingerprint:stableHash(snapshot)};
}

export function buildIntelligenceActions(snapshot={}) {
  return [
    ...(snapshot.evidence_gaps||[]).map(g=>({type:"CLOSE_EVIDENCE_GAP",target:g.claim_id||g.id,requires_human_authorization:true,auto_execute:false})),
    ...(snapshot.next_observations||[]).map(o=>({type:"OBSERVE",target:o.gap_id||o.id,requires_human_authorization:true,auto_execute:false}))
  ];
}

export function assertSystemIntelligenceConstitution(snapshot={}) {
  if(snapshot.authority!=="carl") throw new Error("AUTHORITY_ESCALATION");
  if(snapshot.auto_authorize===true||snapshot.auto_execute===true) throw new Error("AUTOMATION_AUTHORITY_ESCALATION");
  if(snapshot.external_effect===true) throw new Error("EXTERNAL_EFFECT_ESCALATION");
  if(snapshot.live===true) throw new Error("FAKE_LIVE");
  return true;
}
