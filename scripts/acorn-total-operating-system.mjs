#!/usr/bin/env node
import crypto from "node:crypto";
import { economicEngineSnapshot, INFINITE_ECONOMIC_POLICY } from "./acorn-infinite-economic-engine.mjs";
import { buildRuntimePlan, verifyRuntimePlan } from "./acorn-runtime-orchestrator.mjs";
import { intelligenceSnapshot, validateIntelligenceParity } from "./acorn-intelligence-fabric.mjs";
import { connectorSnapshot } from "./acorn-connector-registry.mjs";
import { executionLoopSnapshot } from "./acorn-execution-evidence-loop.mjs";
import { buildCommercialCommandCenter } from "./acorn-commercial-control-plane.mjs";
import { universalProjectContract, createUniversalProject, validateUniversalProject, canTransition, projectTruth } from "./acorn-universal-project-contract.mjs";

const ISO=()=>new Date().toISOString();
const uid=p=>p+"_"+crypto.randomUUID();

export const TOTAL_OS_VERSION="acorn.total-operating-system.v1";
export const PYRAMIDS=Object.freeze([
 {id:"SOVEREIGNTY",levels:["HUMAN_INTENT","CONSTITUTION","GOVERNANCE","AUTHORIZATION","DECISION"]},
 {id:"COGNITION",levels:["MEMORY","CONTEXT","REASONING","PLANNING","METACOGNITION"]},
 {id:"INTELLIGENCE",levels:["DISCOVERY","MEASUREMENT","ROUTING","COMPOSITION","REPLACEMENT"]},
 {id:"INFRASTRUCTURE",levels:["COMPUTE","STORAGE","NETWORK","RUNTIME","RESILIENCE"]},
 {id:"CONNECTIVITY",levels:["CONNECTOR","CREDENTIAL_REFERENCE","CAPABILITY","EXECUTION","OBSERVATION"]},
 {id:"PROBLEM",levels:["INTENT","PROBLEM","DECOMPOSITION","ARCHITECTURE","PLAN"]},
 {id:"EXECUTION",levels:["AUTHORIZATION","TASK_GRAPH","EXECUTION","RETRY_RECOVERY","COMPLETION"]},
 {id:"EVIDENCE",levels:["ACTION","OBSERVATION","MEASUREMENT","EVIDENCE","VALIDITY_EXPIRY"]},
 {id:"VALUE",levels:["COST","OUTCOME","MEASURED_VALUE","REALIZED_VALUE","ECONOMIC_PROOF"]},
 {id:"ECONOMY",levels:["SIGNAL","OPPORTUNITY","MODEL","OFFER","REVENUE"]},
 {id:"PRODUCT",levels:["PROJECT","ASSET","PRODUCT","PLATFORM","ECOSYSTEM"]},
 {id:"CUSTOMER",levels:["PROBLEM","QUALIFY","OFFER","DELIVER","EXPAND"]},
 {id:"ENTERPRISE",levels:["CLIENT","PROJECT","OPERATIONS","FINANCE","GROWTH"]},
 {id:"MARKET",levels:["DEMAND","DISCOVERY","MATCHING","DISTRIBUTION","MARKETPLACE"]},
 {id:"EVOLUTION",levels:["MEASURE","COMPARE","LEARN","PROPOSE","HUMAN_ACCEPT"]},
 {id:"CIVILIZATIONAL",levels:["CURRENT","EMERGING","EXPERIMENTAL","UNKNOWN","FUTURE"]}
]);
export const TOTAL_POLICY=Object.freeze({
 capability_is_not_authority:true,human_final_authority:true,evidence_required_for_strong_claims:true,
 live_requires_external_measurement:true,undefined_is_not_executed:true,projected_is_not_realized:true,
 payment_is_not_receipt:true,no_auto_contract:true,no_auto_payment:true,no_auto_spend:true,
 no_auto_publish:true,no_auto_outreach:true,no_auto_sign:true,no_auto_merge:true,
 no_secret_custody:true,no_invented_revenue:true
});
export function buildPyramidMap(){return PYRAMIDS.map(p=>({...p,level_count:p.levels.length,foundation:p.levels[0],summit:p.levels[p.levels.length-1],measured_at:ISO()}));}
export function validatePyramidMap(map=buildPyramidMap()){
 const blockers=[]; const ids=new Set();
 for(const p of Array.isArray(map)?map:[]){
  if(!p?.id)blockers.push("PYRAMID_ID_REQUIRED");
  if(ids.has(p.id))blockers.push("PYRAMID_ID_DUPLICATE:"+p.id);
  ids.add(p.id); if(!Array.isArray(p.levels)||p.levels.length<3)blockers.push("PYRAMID_LEVELS_REQUIRED:"+p?.id);
 }
 for(const id of PYRAMIDS.map(p=>p.id))if(!ids.has(id))blockers.push("PYRAMID_MISSING:"+id);
 return {ready:blockers.length===0,blockers,measured_at:ISO()};
}
export function composeTotalRuntime({requestId,problem,requiredCapabilities=[],intelligences=[],connectors=[],execution={},commercial={},economic={}}={}){
 const plan=buildRuntimePlan({requestId,problem,intelligences,connectors,requiredCapabilities});
 return {id:uid("total"),version:TOTAL_OS_VERSION,state:"COMPOSED",measured_at:ISO(),
  pyramids:buildPyramidMap(),plan,plan_verification:verifyRuntimePlan(plan),
  intelligence:intelligenceSnapshot(intelligences),intelligence_parity:validateIntelligenceParity(intelligences),connector:connectorSnapshot(connectors),
  execution:executionLoopSnapshot(execution),commercial:buildCommercialCommandCenter(commercial),
  economics:economicEngineSnapshot(economic),control:TOTAL_POLICY,
  authority:{acorn:"ANALYZE_PROPOSE_ROUTE_MEASURE",human:"AUTHORIZE_DECIDE_ACCEPT_MERGE"}};
}

export function universalProjectRuntime(input = {}) {
  const project = createUniversalProject({
    id: input.projectId || uid("project"),
    tenantId: input.tenantId || null,
    problem: input.problem || "UNSPECIFIED_PROJECT",
    requirements: input.requirements || [],
    constraints: input.constraints || [],
    objectives: input.objectives || [],
    capabilities: input.requiredCapabilities || [],
    intelligences: input.intelligences || [],
    connectors: input.connectors || [],
    tasks: input.tasks || []
  });
  return {
    contract: universalProjectContract(),
    project,
    validation: validateUniversalProject(project),
    truth: projectTruth(project),
    transition: canTransition(project.execution_state, input.nextState || project.execution_state, input.transitionContext || {}),
    composed_with_existing_runtime: true,
    second_runtime: false,
    second_graph: false,
    second_market_engine: false,
    second_execution_fabric: false,
    authority: "carl",
    live: false,
    measured_at: ISO()
  };
}

export function totalOperatingSnapshot(input={}){
 const map=buildPyramidMap(), validation=validatePyramidMap(map);
 return {version:TOTAL_OS_VERSION,state:validation.ready?"READY_FOR_MEASURED_INPUT":"BLOCKED",measured_at:ISO(),
  pyramid_count:map.length,pyramid_validation:validation,
  system:{cognition:"COMPOSABLE",intelligence:"ADAPTIVE",infrastructure:"COMPOSABLE",execution:"BOUNDED",evidence:"DATED",economy:"EXTENSIBLE",product:"REUSABLE",customer:"END_TO_END",enterprise:"INTEGRATED",evolution:"MEASURED",future:"OPEN"},
  composed:composeTotalRuntime(input),policy:TOTAL_POLICY,economic_policy:INFINITE_ECONOMIC_POLICY};
}
if(import.meta.url===`file://${process.argv[1]}`)console.log(JSON.stringify(totalOperatingSnapshot(),null,2));
