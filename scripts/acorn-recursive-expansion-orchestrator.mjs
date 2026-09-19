/** ACORN Recursive Expansion Orchestrator v1
 * Turns expansion from candidate generation into a measurable, reusable search process.
 * It allocates bounded exploration across composition depth, novelty, evidence and cost,
 * deduplicates equivalent hypotheses, and preserves human/governance gates.
 */
import {createHash} from "node:crypto";
import {discoverUnknowns,composeCapabilityCandidates,estimateExpansionLeverage} from "./acorn-recursive-self-expansion-engine.mjs";
export const CONTRACT="acorn.recursive-expansion-orchestrator.v1";
export const CYCLE=Object.freeze(["MAP_STATE","DISCOVER_UNKNOWN_SPACE","GENERATE_COMPOSITIONS","DEDUPLICATE","SCORE_EXPANSION_LEVERAGE","ALLOCATE_SEARCH_BUDGET","SIMULATE","TEST","MEASURE","VERIFY","PROMOTE_REUSE","RECOMPOSE","REOBSERVE"]);
const A=x=>Array.isArray(x)?x:[];const id=x=>String(x?.id??x);const digest=x=>createHash("sha256").update(JSON.stringify(x)).digest("hex");
export function generateExpansionFrontier({capabilities=[],unknowns=[],gaps=[],maxDepth=3}={}){
 const caps=A(capabilities);const frontier=[];for(let depth=2;depth<=Math.max(2,Math.min(6,maxDepth));depth++){for(let i=0;i<caps.length;i++){for(let j=i+1;j<caps.length;j++){const members=[id(caps[i]),id(caps[j])].sort();frontier.push({id:"frontier-"+digest({members,depth}).slice(0,16),depth,members,unknown_targets:A(unknowns).slice(0,4).map(id),gap_targets:A(gaps).slice(0,4).map(g=>id(g.key??g)),requires_simulation:true,requires_measurement:true,requires_verification:true,requires_human_authorization:true,auto_promote:false,authority:false});}}}
 return frontier.slice(0,500);
}
export function scoreExpansionFrontier({candidates=[],measurements=[]}={}){
 const m=new Map(A(measurements).map(x=>[x.candidate_id,x]));return A(candidates).map(c=>{const x=m.get(c.id)||{};const novelty=Number(x.novelty)||0;const gain=Number(x.capability_gain)||0;const value=Number(x.value_gain)||0;const cost=Math.max(Number(x.cost)||1,1);const evidence=Number(x.evidence_strength)||0;return {...c,score:(gain+value+novelty+evidence)/cost,measured:x.measured===true,verified:x.verified===true,state:x.verified===true&&x.measured===true?"REUSE_ELIGIBLE":"EXPERIMENT_CANDIDATE"};}).sort((a,b)=>b.score-a.score);
}
export function allocateSearchBudget({candidates=[],budget=100}={}){const n=Math.max(0,Math.min(500,Math.floor(Number(budget)||0)));return A(candidates).slice(0,n).map((c,i)=>({...c,allocation:i<n?"ALLOCATED":"DEFERRED",authority:false,requires_human_authorization:true,auto_execute:false}));}
export function promoteVerifiedExpansion({candidate={},measurement={},evidence=[]}={}){const valid=measurement.verified===true&&measurement.measured===true&&A(evidence).length>0;return {...candidate,state:valid?"REUSABLE_EXPANSION":"UNPROVEN_EXPANSION",reusable:valid,authority:false,requires_human_authorization:true,auto_promote:false};}
export function runRecursiveExpansionOrchestrator(input={}){
 const unknowns=discoverUnknowns(input);const compositions=composeCapabilityCandidates(input);const frontier=generateExpansionFrontier({...input,unknowns:unknowns.unknowns});const scored=scoreExpansionFrontier({candidates:frontier});const allocated=allocateSearchBudget({candidates:scored,budget:input.budget??100});
 return {contract:CONTRACT,cycle:CYCLE,unknowns,composition_count:compositions.candidates.length,frontier:allocated,next_action:allocated.length?"RUN_BOUNDED_EXPERIMENTS":"REOBSERVE",state:"SEARCH_SPACE_ALLOCATED",authority:false,auto_authorize:false,auto_execute:false,auto_promote:false,live:false};
}
export function assertRecursiveExpansionOrchestratorConstitution(x={}){const bad=["authority","auto_authorize","auto_execute","auto_promote","breaker_bypass","fake_live","hidden_learning"].filter(k=>x[k]===true);return{contract:CONTRACT,valid:bad.length===0,violations:bad};}
