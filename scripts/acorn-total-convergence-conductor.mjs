import{buildTotalConvergence,assertTotalConvergence}from"./acorn-total-world-convergence.mjs";
export function conductTotalConvergence(input={}){return buildTotalConvergence(input);}
export function assertTotalConvergenceConstitution(){return assertTotalConvergence();}
export function buildAllAtOncePortfolio(input={}){return{strategy:"ALL_COHERENT_DOMAINS_AT_ONCE",convergence:buildTotalConvergence(input),human_merge_required:true};}
