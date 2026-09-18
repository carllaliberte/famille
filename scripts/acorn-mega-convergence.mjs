/**
 * ACORN — Mega Convergence
 * Consolidates useful intent from all currently open work onto current MAIN.
 */
export const CONTRACT="acorn.mega-convergence.v1";
export const SOURCES=Object.freeze([941,917,914,912,873,793]);
export const LOOP=Object.freeze(["AUDIT_MAIN","AUDIT_OPEN_WORK","RECOVER_USEFUL_WORK","RECONCILE","SECURE","MEASURE","VERIFY","DELIVER","BENCHMARK","OPTIMIZE","REOBSERVE"]);
export const DOMAINS=Object.freeze(["EVOLUTION","SECURITY","RUNTIME","MARKET","DEVELOPER_ACCESS","REAL_WORLD","VALUE","QUALITY","CUSTOMER","CONNECTIVITY","ECONOMICS","EVIDENCE"]);
const a=v=>Array.isArray(v)?v:[];
const dangerous=new Set(["MONEY","REFUND","PAYOUT","PRICE_CHANGE","CONTRACT","SIGN","DELETE","PUBLISH","WRITE_PROTECTED","MERGE"]);
export function auditOpenWork(main={},prs=[]){
 return {contract:CONTRACT,base:main.sha??null,source_prs:SOURCES,
  prs:a(prs).map(p=>({number:p.number,state:p.state,merged:p.merged,base:p.base_sha,head:p.head_sha,mergeable:p.mergeable??"UNKNOWN"})),
  rule:"RECONSTRUCT_USEFUL_WORK_ON_CURRENT_MAIN_NOT_DIRECT_MERGE"};
}
export function classifyWork(pr={}){
 const title=String(pr.title??"").toLowerCase();
 if(pr.merged===true)return"ALREADY_IN_MAIN";
 if(title.includes("security")||title.includes("bridge"))return"SECURITY_RELIABILITY";
 if(title.includes("market")||title.includes("revenue"))return"MARKET_VALUE";
 if(title.includes("evolution"))return"CONTINUOUS_EVOLUTION";
 return"LEGACY_WORK";
}
export function recoverPlan(prs=[]){
 return a(prs).map(p=>({number:p.number,class:classifyWork(p),action:p.merged?"RETAIN_MAIN":"RECOVER_USEFUL_INTENT"}));
}
export function gateAction(effect,ctx={}){
 const e=String(effect??"UNKNOWN").toUpperCase();
 if(dangerous.has(e))return{state:"WAITING_HUMAN",authorized:false,reason:"CONSEQUENTIAL_HUMAN_GATE"};
 if(e==="UNKNOWN")return{state:"BLOCKED",authorized:false,reason:"UNKNOWN_EFFECT"};
 return ctx.human_authorized===true&&ctx.server_authorized===true?{state:"AUTHORIZED",authorized:true}:{state:"WAITING_HUMAN",authorized:false};
}
export function reconcile(findings=[]){
 return {state:"RECONCILED",findings:a(findings),unknowns:a(findings).filter(x=>x.state==="UNKNOWN"),truth:"NO_INVENTED_LIVE_OR_VERIFIED"};
}
export function buildMegaPortfolio(input={}){
 const audit=auditOpenWork(input.main,input.prs);
 return {contract:CONTRACT,loop:LOOP,domains:DOMAINS,audit,
  recovery:recoverPlan(input.prs),reconciliation:reconcile(input.findings),
  authority:"CARL",auto_merge:false,auto_spend:false,auto_contract:false,next:"TEST_FALSIFY_MEASURE_VERIFY"};
}
export function assertMegaConstitution(){
 if(SOURCES.length<6||LOOP[0]!=="AUDIT_MAIN"||LOOP.at(-1)!=="REOBSERVE")throw new Error("MEGA_CONVERGENCE_BROKEN");
 if(!dangerous.has("MERGE"))throw new Error("AUTHORITY_BOUNDARY_BROKEN");
 return true;
}
