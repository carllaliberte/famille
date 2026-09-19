/** ACORN — Expansion Evolution Compiler.
 * Compiles measured expansion candidates into reusable system evolution plans.
 * It is a compiler/planner, never an authority or execution runtime.
 */
import {createHash} from "node:crypto";
export const CONTRACT="acorn.expansion-evolution-compiler.v1";
export const CYCLE=Object.freeze(["INGEST_EVIDENCE","NORMALIZE","BUILD_GRAPH","FIND_REUSE","COMPOSE","COMPILE_PLAN","SIMULATE","TEST","MEASURE","VERIFY","VERSION","PROPOSE_REUSE","REOBSERVE"]);
const A=x=>Array.isArray(x)?x:[]; const s=x=>String(x??""); const hash=x=>createHash("sha256").update(JSON.stringify(x)).digest("hex");
export function buildExpansionGraph({capabilities=[],candidates=[],outcomes=[],nodes=[]}={}){
 const g={nodes:[],edges:[]};for(const x of [...A(capabilities),...A(candidates)]){const id=s(x.id||x);if(id&&!g.nodes.some(n=>n.id===id))g.nodes.push({id,type:"EXPANSION",authority:false});}
 for(const o of A(outcomes)){const from=s(o.candidate_id),to=s(o.capability_id||o.reusable_capability_id);if(from&&to)g.edges.push({from,to,type:o.verified===true&&o.measured===true?"VERIFIED_REUSE":"UNVERIFIED",evidence:A(o.evidence)});}
 return {contract:CONTRACT,nodes:g.nodes,edges:g.edges,state:"GRAPH_BUILT",authority:false,live:false};
}
export function findReusablePaths({graph={},candidates=[]}={}){
 const verified=new Set(A(graph.edges).filter(e=>e.type==="VERIFIED_REUSE"&&A(e.evidence).length).flatMap(e=>[e.from,e.to]));
 return A(candidates).map(c=>({...c,reuse_available:verified.has(s(c.id)),state:verified.has(s(c.id))?"REUSE_PATH_FOUND":"NEW_PATH_REQUIRED",authority:false}));
}
export function compileExpansionPlan({candidate={},dependencies=[],baseline={},target={}}={}){
 const id="plan-"+hash({candidate:candidate.id,dependencies:dependencies.map(s),baseline,target}).slice(0,20);
 return {id,contract:CONTRACT,candidate_id:candidate.id,dependencies:A(dependencies),baseline,target,stages:["BASELINE","COMPOSE","SIMULATE","TEST","MEASURE","VERIFY","VERSION"],requirements:{human_authorization:true,verified_evidence:true,rollback:true},state:"COMPILED_PLAN",authority:false,auto_execute:false,auto_promote:false,live:false};
}
export function versionVerifiedExpansion({plan={},measurement={},evidence=[]}={}){
 const valid=measurement.measured===true&&measurement.verified===true&&A(evidence).length>0;
 return {plan_id:plan.id,state:valid?"VERSION_ELIGIBLE":"VERSION_BLOCKED",version:valid?"verified-expansion-v1":null,evidence:A(evidence),verified:valid,measured:measurement.measured===true,authority:false,auto_promote:false};
}
export function runExpansionCompiler(input={}){
 const graph=buildExpansionGraph(input);const reusable=findReusablePaths({graph,candidates:input.candidates});const plans=reusable.map(c=>compileExpansionPlan({candidate:c,dependencies:c.dependencies||[],baseline:input.baseline||{},target:c.target||{}}));
 return {contract:CONTRACT,cycle:CYCLE,graph,reusable_paths:reusable,plans,next_action:plans.length?"RUN_SIMULATION_AND_TEST":"DISCOVER_MORE_COMPOSITIONS",state:"EVOLUTION_PLANS_COMPILED",authority:false,auto_authorize:false,auto_execute:false,auto_promote:false,live:false};
}
export function assertExpansionCompilerConstitution(x={}){const bad=["authority","auto_authorize","auto_execute","auto_promote","breaker_bypass","fake_live","hidden_learning"].filter(k=>x[k]===true);return{contract:CONTRACT,valid:bad.length===0,violations:bad};}
