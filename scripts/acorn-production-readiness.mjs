import {gate,verifyWork,benchmark} from "./acorn-total-open-work-convergence.mjs";
export function readiness({requirements=[],results=[],weights={}}={}){const verification=verifyWork(results);const bench=benchmark(results,weights);return{requirements,verification,benchmark:bench,state:verification.verified?"MEASURED_CANDIDATE":"NOT_READY",next:verification.verified?"DELIVER_AND_REOBSERVE":"REPAIR_AND_MEASURE"};}
export function authorizeProduction(effect,ctx={}){return gate(effect,ctx);}
