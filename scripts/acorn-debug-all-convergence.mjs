/** ACORN — DEBUG ALL CONVERGENCE */
export const CONTRACT="acorn.debug-all-convergence.v1";
const arr=v=>Array.isArray(v)?v:[];
export function classifyOpenWork(items=[]){
 return arr(items).map(x=>({...x,classification:x.base_sha===x.main_sha?"CURRENT_BASE":"DIVERGED",action:x.blocked?"WAITING_HUMAN":x.base_sha===x.main_sha?"TEST":"RECOVER_OR_REBASE"}));
}
export function buildConvergencePlan({main_sha,open_prs=[]}={}){
 return {contract:CONTRACT,main_sha,items:classifyOpenWork(open_prs),rules:["MAIN_IS_REALITY","RECOVER_USEFUL_WORK","TEST_BEFORE_MERGE","NO_AUTO_MERGE","NO_BREAKER_ACCESS"],created_at:new Date().toISOString()};
}
export function assertDebugConstitution(s={}){
 if(s.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(s.auto_merge) throw new Error("AUTO_MERGE_FORBIDDEN");
 if(s.main_overridden) throw new Error("MAIN_IS_REALITY");
 return true;
}
