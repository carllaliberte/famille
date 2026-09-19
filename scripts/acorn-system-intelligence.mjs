import { buildSemanticForest } from "./acorn-semantic-forest.mjs";
import { buildProofGraph } from "./acorn-proof-observability-fabric.mjs";
import { summarizeReliability } from "./acorn-observability-reliability-fabric.mjs";
import { buildSystemGenome } from "./acorn-system-genome.mjs";
export const CONTRACT="acorn.system-intelligence.v1";
const uniq=a=>[...new Set(a)];
const num=v=>Number.isFinite(Number(v))?Number(v):0;
export function buildSystemIntelligence({semanticForest={},proofGraph={},reliability={},genome={},outcomes=[],resources=[],capabilities=[]}={}){
  const nodes=semanticForest.nodes||[], edges=semanticForest.edges||[];
  const degree=new Map(); for(const e of edges){degree.set(e.from,(degree.get(e.from)||0)+1);degree.set(e.to,(degree.get(e.to)||0)+1)}
  const isolated=nodes.map(n=>n.id).filter(id=>!degree.has(id));
  const critical=nodes.map(n=>({id:n.id,degree:degree.get(n.id)||0})).sort((a,b)=>b.degree-a.degree).slice(0,20);
  const unsupported=proofGraph.summary?.unsupported_claims||[];
  const gaps=uniq([...(semanticForest.gaps?.orphan_runtime||[]),...(semanticForest.gaps?.disconnected_nodes||[]),...unsupported]);
  const verifiedOutcomes=outcomes.filter(o=>o?.measured===true&&o?.verified===true&&o?.evidence);
  const resourcePressure=resources.filter(r=>["EXHAUSTED","BLOCKED"].includes(r?.state));
  const weakCapabilities=capabilities.filter(c=>c?.qualified!==true||c?.verified!==true);
  return {contract:CONTRACT,generated_at:new Date().toISOString(),state:gaps.length||resourcePressure.length||weakCapabilities.length?"GAPS_PRESENT":"OBSERVE_AGAIN",structure:{nodes:nodes.length,edges:edges.length,isolated,critical_paths:critical},proof:{unsupported_claims:unsupported},reliability:reliability,performance:{verified_outcomes:verifiedOutcomes.length},resources:{pressured:resourcePressure.length},capabilities:{weak:weakCapabilities.length},gaps:{count:gaps.length,items:gaps.slice(0,100)},next_observations:rankObservations({gaps,isolated,resourcePressure,weakCapabilities}),authority:false,auto_authorize:false,auto_execute:false,live:false}}
export function rankObservations({gaps=[],isolated=[],resourcePressure=[],weakCapabilities=[]}={}){
  const all=[...gaps.map(id=>({kind:"CLOSE_GAP",target:id,information_gain:5,cost:1,risk:0})),...isolated.map(id=>({kind:"CONNECT_OR_INSPECT",target:id,information_gain:4,cost:1,risk:0})),...resourcePressure.map(r=>({kind:"MEASURE_RESOURCE_PRESSURE",target:r.id||"resource",information_gain:4,cost:1,risk:1})),...weakCapabilities.map(c=>({kind:"REQUALIFY_CAPABILITY",target:c.id||"capability",information_gain:3,cost:1,risk:0}))];
  return all.sort((a,b)=>(b.information_gain/(1+b.cost+b.risk))-(a.information_gain/(1+a.cost+a.risk))).slice(0,25)
}
export function explainSystemState(x={}){return {contract:CONTRACT,state:x.state||"UNKNOWN",facts:{nodes:num(x.structure?.nodes),edges:num(x.structure?.edges),isolated:num(x.structure?.isolated?.length),unsupported_claims:num(x.proof?.unsupported_claims?.length),pressured_resources:num(x.resources?.pressured),weak_capabilities:num(x.capabilities?.weak)},truth:"MEASURED_SYSTEM_INTELLIGENCE_NOT_WORLD_TRUTH"}}
export function assertSystemIntelligenceConstitution(x={}){const v=[];if(x.authority===true)v.push("AUTHORITY_ESCALATION");if(x.auto_authorize===true)v.push("AUTO_AUTHORIZATION");if(x.auto_execute===true)v.push("AUTO_EXECUTION");if(x.live===true)v.push("FAKE_LIVE");return {contract:CONTRACT,valid:!v.length,violations:v}}
export function runSystemIntelligence({root=process.cwd(),claims=[],evidence=[],observations=[],outcomes=[],resources=[],capabilities=[],version="unknown"}={}){const semanticForest=buildSemanticForest({root,evidence}),proofGraph=buildProofGraph({claims,evidence}),reliability=summarizeReliability({observations}),genome=buildSystemGenome({semanticForest,proofGraph,reliability,version});return buildSystemIntelligence({semanticForest,proofGraph,reliability,genome,outcomes,resources,capabilities})}
