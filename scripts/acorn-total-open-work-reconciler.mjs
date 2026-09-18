export const CONTRACT="acorn.total-open-work-reconciler.v1";
export const ACTIONS=Object.freeze(["AUDIT","RECOVER","RECONSTRUCT_ON_MAIN","CONSOLIDATE","TEST","FALSIFY","MEASURE","VERIFY","HUMAN_HOLD"]);
export function reconcileOpenWork(prs=[]){return{contract:CONTRACT,actions:ACTIONS,items:prs.map(pr=>({number:pr.number??null,state:pr.state??"UNKNOWN",mergeable:pr.mergeable??"UNKNOWN",action:pr.mergeable===true?"AUDIT_CURRENT":"RECONSTRUCT_ON_MAIN"})),auto_merge:false,human_authority:"CARL"};}
