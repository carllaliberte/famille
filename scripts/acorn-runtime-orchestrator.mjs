/** ACORN — LIVE ORCHESTRATION GATE
 * Turns an authenticated customer request into a measured, auditable plan.
 * Planning may be automatic; consequential execution never is.
 */
import {routeIntelligence} from "./acorn-intelligence-fabric.mjs";
import {connectorSnapshot} from "./acorn-connector-registry.mjs";
const ISO=()=>new Date().toISOString();
export function buildRuntimePlan({requestId,problem,intelligences=[],connectors=[],requiredCapabilities=[]}={}){
 const task={id:"task_"+requestId,required_capabilities:requiredCapabilities};
 const intelligenceRoutes=routeIntelligence(task,{intelligences,connections:connectors});
 return {id:"plan_"+requestId,request_id:requestId,state:"PLANNED",problem,required_capabilities:requiredCapabilities,
   routes:{intelligences:intelligenceRoutes.filter(r=>r.kind==="intelligence"),connectors:intelligenceRoutes.filter(r=>r.kind==="connection")},
   snapshots:{intelligence_count:intelligences.length,connector:connectorSnapshot(connectors)},
   authority:{human_required:true,auto_contract:false,auto_payment:false,auto_spend:false,auto_publish:false,auto_merge:false},
   measured_at:ISO()};
}
export function verifyRuntimePlan(plan){
 const blockers=[];
 if(!plan?.request_id) blockers.push("REQUEST_ID_REQUIRED");
 if(!Array.isArray(plan?.required_capabilities)) blockers.push("CAPABILITIES_REQUIRED");
 if(!plan?.authority?.human_required) blockers.push("HUMAN_AUTHORIZATION_POLICY_REQUIRED");
 return {ready:blockers.length===0,blockers,measured_at:ISO()};
}
