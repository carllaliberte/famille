/**
 * ACORN — Total Open Work Convergence
 * One recovery/repair/verification portfolio for every open PR.
 */
export const CONTRACT="acorn.total-open-work-convergence.v1";
export const SOURCES=Object.freeze([941,917,914,912,873,793]);
export const DOMAINS=Object.freeze(["WORLD","EVOLUTION","SECURITY","RUNTIME","MARKET","DEVELOPER","REAL_WORLD","VALUE","QUALITY","CUSTOMER","CONNECTIVITY","ECONOMICS","EVIDENCE","OPERATIONS"]);
export const LOOP=Object.freeze(["AUDIT_MAIN","AUDIT_ALL_OPEN","MAP_USEFUL_WORK","RECONSTRUCT","INTEGRATE","TEST","FALSIFY","MEASURE","VERIFY","DELIVER","BENCHMARK","OPTIMIZE","CLOSE_OR_HOLD","REOBSERVE"]);
const a=v=>Array.isArray(v)?v:[];
const dangerous=new Set(["MONEY","REFUND","PAYOUT","PRICE_CHANGE","CONTRACT","SIGN","DELETE","PUBLISH","WRITE_PROTECTED","MERGE"]);
export function audit(main={},prs=[]){return{contract:CONTRACT,main_sha:main.sha??null,open_pr_count:a(prs).length,prs:a(prs).map(p=>({number:p.number,title:p.title,state:p.state,merged:p.merged,base:p.base_sha,head:p.head_sha,mergeable:p.mergeable??"UNKNOWN"})),sources:SOURCES};}
export function mapWork(pr={}){const t=String(pr.title??"").toLowerCase();return{number:pr.number,domains:[t.includes("security")||t.includes("bridge")?"SECURITY":null,t.includes("market")||t.includes("revenue")?"MARKET":null,t.includes("evolution")?"EVOLUTION":null,t.includes("real-world")||t.includes("runtime")?"REAL_WORLD":null].filter(Boolean),action:pr.merged?"RETAIN_MAIN":"RECONSTRUCT_ON_CURRENT_MAIN"};}
export function recover(prs=[]){return a(prs).map(mapWork);}
export function gate(effect,ctx={}){const e=String(effect??"UNKNOWN").toUpperCase();if(dangerous.has(e))return{authorized:false,state:"WAITING_HUMAN"};if(e==="UNKNOWN")return{authorized:false,state:"BLOCKED"};return ctx.human_authorized===true&&ctx.server_authorized===true?{authorized:true,state:"AUTHORIZED"}:{authorized:false,state:"WAITING_HUMAN"};}
export function verifyWork(items=[]){const x=a(items);const ok=x.length>0&&x.every(i=>i.measured===true&&i.verified===true&&a(i.evidence).length>0);return{verified:ok,state:ok?"VERIFIED":"NOT_VERIFIED",count:x.length};}
export function benchmark(items=[],weights={}){const eligible=a(items).filter(i=>i.measured===true&&i.verified===true&&i.expired!==true);const score=i=>Object.entries(weights).reduce((s,[k,w])=>s+Number(i[k]??0)*Number(w??1),0);const ranked=eligible.map(i=>({...i,score:score(i)})).sort((a,b)=>b.score-a.score);return{state:ranked.length?"BENCHMARKED":"NOT_MEASURED",best_known:ranked[0]??null,candidates:ranked,global_optimum:false};}
export function buildPortfolio(input={}){const audited=audit(input.main,input.prs);return{contract:CONTRACT,loop:LOOP,domains:DOMAINS,audit:audited,recovery:recover(input.prs),verification:verifyWork(input.results),benchmark:benchmark(input.results,input.weights),authority:"CARL",auto_merge:false,auto_spend:false,auto_contract:false,truth:"DEFINED != CODE_PRESENT != TESTED != EXECUTED != MEASURED != VERIFIED != LIVE"};}
export function assertConstitution(){if(SOURCES.length!==6||LOOP.at(-1)!=="REOBSERVE"||DOMAINS.length<10)throw new Error("CONVERGENCE_INCOMPLETE");if(!dangerous.has("MERGE"))throw new Error("AUTHORITY_BROKEN");return true;}
