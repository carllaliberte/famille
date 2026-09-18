/**
 * Reconstruct useful open work against current MAIN instead of merging stale branches.
 */
export const CONTRACT="acorn.open-work-convergence.v1";
export const ACTIONS=Object.freeze(["AUDIT","CLASSIFY","RECOVER_USEFUL_WORK","RECONSTRUCT_ON_MAIN","TEST","FALSIFY","MEASURE","VERIFY","DEFER","HUMAN_HOLD"]);
export function classifyOpenWork(pr={}){const body=String(pr.body||"");const stale=/must not be merged|divergent|behind|CONFLICTING|DIRTY/i.test(body);const useful=/capability|security|market|runtime|evidence|authority|connector/i.test(body);return{pr:pr.number??null,stale,useful,recommendation:stale&&useful?"RECONSTRUCT_ON_MAIN":stale?"DEFER":"AUDIT_CURRENT"};}
export function buildConvergencePortfolio(prs=[]){const classified=prs.map(classifyOpenWork);return{contract:CONTRACT,actions:ACTIONS,items:classified.filter(x=>x.recommendation==="RECONSTRUCT_ON_MAIN"),defer:classified.filter(x=>x.recommendation==="DEFER"),audit:classified.filter(x=>x.recommendation==="AUDIT_CURRENT"),human_authority:"CARL",auto_merge:false};}
