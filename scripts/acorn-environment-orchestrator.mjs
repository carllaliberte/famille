import {createEnvironment,deploymentPlan,promotionDecision,recoveryPlan,truthState} from "./acorn-universal-environment-fabric.mjs";
export function buildEnvironmentPortfolio(input={}){return deploymentPlan((input.environments||[]).map(createEnvironment));}
export function promoteEnvironment(input={}){return promotionDecision(input);}
export function recoverEnvironment(input={}){return recoveryPlan(input.environment||{});}
export function observeEnvironment(input={}){return truthState(input.environment||{},input.runtime||{});}
export function reconcileEnvironments(environments=[]){
 const xs=environments.map(createEnvironment);
 return {count:xs.length,duplicates:xs.filter((x,i)=>xs.findIndex(y=>y.id===x.id)!==i).map(x=>x.id),unknown:xs.filter(x=>x.kind==="UNKNOWN"||x.state==="UNKNOWN").map(x=>x.id)};
}
