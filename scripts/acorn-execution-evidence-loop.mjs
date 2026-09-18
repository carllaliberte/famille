/** ACORN — END-TO-END EXECUTION → EVIDENCE → VALUE LOOP
 * Automatic orchestration of plans; consequential effects remain human-authorized.
 */
import crypto from "node:crypto";
import { invokeAdapter } from "./acorn-intelligence-fabric.mjs";
import { executeRegisteredConnector } from "./acorn-connector-registry.mjs";
import { proofGate } from "./acorn-evidence-registry.mjs";
import { buildProjectValueLedger } from "./acorn-project-value-ledger.mjs";
const ISO=()=>new Date().toISOString();
const uid=p=>`${p}_${crypto.randomUUID()}`;

export function createExecutionRun({requestId,plan,authorized=false}={}){
 if(!requestId||!plan) throw new Error("REQUEST_AND_PLAN_REQUIRED");
 return {id:uid("run"),request_id:requestId,plan_id:plan.id,plan,state:"PLANNED",
   human_authorized:Boolean(authorized),authority:false,external_effect:false,
   steps:[],evidence:[],value:null,created_at:ISO()};
}
export async function executeRun(run,{intelligenceAdapters={},connectorAdapters={}}={}){
 const out={...run,steps:[],evidence:[...(run.evidence||[])]};
 if(!run.human_authorized) return {...out,state:"BLOCKED",blockers:["HUMAN_AUTHORIZATION_REQUIRED"],measured_at:ISO()};
 out.state="RUNNING";
 for(const route of run.plan?.routes?.intelligences||[]){
   const adapter=intelligenceAdapters[route.id];
   const result=await invokeAdapter({id:uid("inv"),task_id:run.plan.request_id,intelligence_id:route.id,human_authorized:true},{adapter});
   out.steps.push({kind:"intelligence",route,result});
   if(result.state==="SUCCEEDED") out.evidence.push({id:uid("ev"),kind:"INTELLIGENCE_EXECUTION",status:"MEASURED",origin:route.id,strength:1,margin:1,measured_at:ISO(),payload:{external_effect:false}});
 }
 for(const route of run.plan?.routes?.connectors||[]){
   const adapter=connectorAdapters[route.id];
   const result=await executeRegisteredConnector({id:uid("cx"),task_id:run.plan.request_id,connector_id:route.id,human_authorized:true},{adapter});
   out.steps.push({kind:"connector",route,result});
   if(result.state==="SUCCEEDED") out.evidence.push({id:uid("ev"),kind:"CONNECTOR_EXECUTION",status:"MEASURED",origin:route.id,strength:1,margin:1,measured_at:ISO(),payload:{external_effect:false}});
 }
 const gate=proofGate({evidence:out.evidence,required:1});
 out.state=gate.ready?"VERIFYING":"FAILED";
 out.verification={ready:gate.ready,gate};
 out.measured_at=ISO();
 return out;
}
export function closeExecutionRun(run,{project_id=run.request_id,realized_revenue=0,delivery_cost=0,measured_value=0,currency="CAD"}={}){
 const gate=proofGate({evidence:run.evidence||[],required:1});
 const value=buildProjectValueLedger({project_id,records:[],realized_revenue,delivery_cost,measured_value,evidence_verified:gate.ready,currency});
 return {...run,state:gate.ready?"COMPLETED":"EVIDENCE_BLOCKED",value,closed_at:ISO(),
   proof:{evidence_ready:gate.ready,external_effect:false,no_payment_claim:true,no_contract_claim:true}};
}
export function executionLoopSnapshot(run){
 return {run_id:run.id,request_id:run.request_id,state:run.state,steps:run.steps?.length||0,
   measured_evidence:run.evidence?.filter(e=>e.status==="MEASURED").length||0,
   value_status:run.value?.evidence_verified?"EVIDENCED":"UNVERIFIED",
   human_authorized:run.human_authorized===true,authority:false,measured_at:ISO()};
}
