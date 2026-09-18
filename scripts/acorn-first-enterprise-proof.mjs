/** ACORN — FIRST ENTERPRISE PROOF
 * Deterministic synthetic customer journey. It never claims an external sale/payment/delivery.
 */
import {createEnterpriseCycle,authorizeOffer,recordExternalSettlement,createEvidence,verifyDelivery,measureValue,captureAsset,productizeAsset} from "./acorn-real-world-enterprise-os.mjs";
import {buildExecutionPlan,createTask,taskGraph,startTask,completeTask,executionSnapshot} from "./acorn-execution-fabric.mjs";
export function runFirstEnterpriseProof({humanAuthorized=false,externalSettlement=false,repeatDemand=false}={}){
 const cycle=createEnterpriseCycle({customer:"synthetic-customer",problem:"complex business workflow",qualification:{missing:[],complexity:"high",capabilities:["analysis","design","verification"]},offer:{deliverables:["solution","documentation"],amount:1000,currency:"CAD"}});
 const offer=authorizeOffer(cycle.offer,{authorizedBy:humanAuthorized?"human":null,authorizationReference:humanAuthorized?"synthetic-human-authorization":null});
 let evidence=[createEvidence({kind:"TEST",source:"synthetic",claim:"delivery tests pass",strength:1,margin:.5})];
 const project=cycle.project;
 const a=createTask({projectId:project.id,kind:"ANALYZE",title:"Analyze",requiredCapabilities:["analysis"]});
 const b=createTask({projectId:project.id,kind:"DELIVER",title:"Deliver",dependsOn:[a.id],requiredCapabilities:["delivery"]});
 let tasks=taskGraph([a,b]);
 for(let n=0;n<2&&humanAuthorized;n++){const i=tasks.findIndex(t=>t.state==="READY");if(i<0)break;tasks[i]=completeTask(startTask(tasks[i],{authorized:true}),{success:true,output:{synthetic:true},evidenceIds:["synthetic-evidence"]});tasks=taskGraph(tasks)}
 const execution=buildExecutionPlan({projectId:project.id,tasks,authorized:humanAuthorized});
 const verification=verifyDelivery({project,deliverables:project.success_criteria?.length?[...project.success_criteria]:["solution","documentation"],evidence,tests:[{passed:humanAuthorized}]});
 const value=measureValue({projectId:project.id,expectedValue:1000,realizedValue:humanAuthorized?1000:null,currency:"CAD",evidenceId:humanAuthorized?evidence[0].id:null});
 const asset=captureAsset({projectId:project.id,assetType:"workflow-solution",reusable:humanAuthorized,evidenceId:humanAuthorized?evidence[0].id:null,rights:["PENDING_HUMAN_RIGHTS"]});
 const product=productizeAsset(asset,{repeatDemand});
 return {proof_id:"FIRST_ENTERPRISE_PROOF",cycle:{...cycle,offer},execution,snapshot:executionSnapshot(execution),verification,value,asset,product,external_settlement_measured:externalSettlement,live_external_claim:false};
}
