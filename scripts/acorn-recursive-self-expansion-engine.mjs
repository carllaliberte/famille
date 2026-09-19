/** ACORN — Recursive Self-Expansion Engine.
 * One system-level engine: discover measured gaps, compose existing capabilities,
 * generate bounded experiments, evaluate leverage, learn only from verified outcomes,
 * and propose the next expansion. It never self-authorizes consequential effects.
 */
import {createHash} from "node:crypto";
import {measureSystem,generateEvolutionCandidates} from "./acorn-system-evolution-conductor.mjs";
export const CONTRACT="acorn.recursive-self-expansion-engine.v1";
export const CYCLE=Object.freeze(["OBSERVE","MODEL","MEASURE","FIND_GAPS","DISCOVER_CAPABILITIES","COMPOSE","GENERATE_HYPOTHESES","SIMULATE","TEST","MEASURE_OUTCOME","VERIFY","ESTIMATE_LEVERAGE","PROPOSE_EXPANSION","REOBSERVE"]);
const A=v=>Array.isArray(v)?v:[];const S=v=>String(v??"");const finite=v=>Number.isFinite(Number(v));
const hash=v=>createHash("sha256").update(JSON.stringify(v,Object.keys(v||{}).sort())).digest("hex");
export function discoverUnknowns({system={},signals=[],knownCapabilities=[],knownConnections=[]}={}){
 const known=new Set([...A(knownCapabilities).map(S),...A(knownConnections).map(S)]);
 const candidates=A(signals).map((s,i)=>({id:"unknown-"+i,signal:s,known:known.has(S(s?.id??s)),reason:"UNCLASSIFIED_SIGNAL"})).filter(x=>!x.known);
 return {contract:CONTRACT,unknowns:candidates.slice(0,200),state:candidates.length?"UNKNOWN_SPACE_IDENTIFIED":"NO_UNKNOWN_SIGNALS",authority:false,live:false};
}
export function composeCapabilityCandidates({capabilities=[],nodes=[],gaps=[],outcomes=[]}={}){
 const caps=A(capabilities);const gapKeys=new Set(A(gaps).map(g=>S(g.key)));
 const pairs=[];for(let i=0;i<caps.length;i++)for(let j=i+1;j<caps.length;j++){const a=caps[i],b=caps[j];pairs.push({id:"composition-"+hash({a:a.id||a,b:b.id||b}).slice(0,16),capabilities:[a,b],target_gaps:[...gapKeys].slice(0,8),hypothesis:"COMPOSITION_MAY_INCREASE_SYSTEM_CAPABILITY",requires_simulation:true,requires_test:true,requires_measurement:true,requires_verification:true,requires_human_authorization:true,auto_adopt:false,authority:false});}
 return {contract:CONTRACT,candidates:pairs.slice(0,100),source_counts:{capabilities:caps.length,nodes:A(nodes).length,outcomes:A(outcomes).length},state:pairs.length?"COMPOSITION_CANDIDATES":"NO_COMPOSITION_CANDIDATES",authority:false,live:false};
}
export function estimateExpansionLeverage({candidate={},baseline={},outcome={}}={}){
 const gain=finite(outcome.capability_gain)?Number(outcome.capability_gain):0;
 const value=finite(outcome.value_gain)?Number(outcome.value_gain):0;
 const cost=finite(outcome.cost)?Number(outcome.cost):null;
 const reliability=finite(outcome.reliability)?Number(outcome.reliability):null;
 if(!finite(gain)&&!finite(value))return {state:"INSUFFICIENT_MEASURED_OUTCOME",candidate,authority:false};
 const denominator=cost!==null&&cost>0?cost:1;
 return {candidate_id:candidate.id,leverage:(gain+value)/denominator,capability_gain:gain,value_gain:value,cost,reliability,state:"MEASURED_CANDIDATE",authority:false,live:false};
}
export function selectExpansionCandidates({candidates=[],measurements=[]}={}){
 const byId=new Map(A(measurements).map(m=>[m.candidate_id,m]));return A(candidates).map(c=>({...c,leverage:byId.get(c.id)?.leverage??null})).filter(c=>c.leverage!==null).sort((a,b)=>b.leverage-a.leverage).slice(0,20).map(c=>({...c,state:"HUMAN_REVIEW_REQUIRED",requires_human_authorization:true,auto_adopt:false,authority:false}));
}
export function recordVerifiedExpansion({candidate={},baseline={},after={},evidence=[],verified=false,measured=false}={}){
 const valid=verified===true&&measured===true&&A(evidence).length>0;
 return {contract:CONTRACT,candidate_id:candidate.id,baseline,after,evidence:A(evidence),verified:valid,measured:measured===true,state:valid?"EXPANSION_LEARNED":"EXPANSION_UNPROVEN",learning:valid?"ELIGIBLE_FOR_REUSE":"REQUIRES_REOBSERVATION",authority:false,live:false};
}
export function runRecursiveExpansion({root=process.cwd(),system={},signals=[],knownCapabilities=[],knownConnections=[],capabilities=[],nodes=[],gaps=[],outcomes=[],contracts=[],runtime=[],evidence=[]}={}){
 const measured=measureSystem({root,nodes,contracts,runtime,evidence});
 const unknowns=discoverUnknowns({system,signals,knownCapabilities,knownConnections});
 const evolutions=generateEvolutionCandidates(measured);
 const compositions=composeCapabilityCandidates({capabilities,nodes,gaps:measured.gaps,outcomes});
 return {contract:CONTRACT,cycle:CYCLE,measured,unknowns,evolution_candidates:evolutions,composition_candidates:compositions,next_actions:[...evolutions,...compositions.candidates].slice(0,100),state:"EXPANSION_CANDIDATES_MEASURED",authority:false,auto_authorize:false,auto_execute:false,auto_adopt:false,live:false};
}
export function assertRecursiveExpansionConstitution(x={}){const v=[];for(const[k,msg]of[["authority","AUTHORITY_ESCALATION"],["auto_authorize","AUTO_AUTHORIZATION"],["auto_execute","AUTO_EXECUTION"],["auto_adopt","AUTO_ADOPTION"],["auto_spend","AUTO_SPEND"],["breaker_bypass","BREAKER_BYPASS"],["fake_live","FAKE_LIVE"],["hidden_learning","HIDDEN_LEARNING"]])if(x[k]===true)v.push(msg);return{contract:CONTRACT,valid:!v.length,violations:v};}
export function selfTest(){const r=runRecursiveExpansion({signals:["x"],capabilities:[{id:"a"},{id:"b"}]});return r.unknowns.unknowns.length===1&&r.composition_candidates.candidates.length===1&&r.authority===false&&assertRecursiveExpansionConstitution({}).valid;}
