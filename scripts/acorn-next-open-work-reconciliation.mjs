export const CONTRACT="acorn.next-open-work-reconciliation.v1";
export const SOURCES=Object.freeze([971,941,917,914,912,873,793]);
const A=v=>Array.isArray(v)?v:[];const verified=x=>x?.verified===true&&x?.measured===true&&x?.expired!==true&&A(x?.evidence).length>0;
export function classifyOpenWork(prs=[]){return A(prs).map(p=>({number:p.number,state:p.state??"UNKNOWN",mergeable:p.mergeable??null,action:p.mergeable===true?"AUDIT_AND_TEST":"RECONSTRUCT_ON_MAIN"}));}
export function reconcileFindings(findings=[]){return{strategy:"RECOVER_USEFUL_WORK_ONLY",findings:A(findings),direct_stale_merge:false};}
export function buildLearning(outcomes=[]){const good=A(outcomes).filter(verified);return{state:good.length?"LEARNED_CANDIDATES":"NOT_MEASURED",count:good.length,assets:["CAPABILITY","ROUTE","TEMPLATE","KNOWLEDGE","PRODUCT_CANDIDATE","OPPORTUNITY_CANDIDATE"],authority:false};}
export function truthGate(state={}){return{code_present:!!state.code_present,tested:!!state.tested,executed:!!state.executed,measured:!!state.measured,verified:!!state.verified,live:!!state.live,truth:"STATES_MUST_NOT_BE_COLLAPSED"};}
export function assertReconciliation(){if(SOURCES.length<7)throw new Error("SOURCE_COVERAGE_INCOMPLETE");return true;}