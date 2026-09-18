import {convergenceDecision,assertDevelopmentConstitution} from "./acorn-maximal-development-convergence.mjs";
export function planGrandChantier(work=[],context={}){return convergenceDecision(work,context);}
export function assertGrandChantierConstitution(){return assertDevelopmentConstitution();}
export function recommendScope(work=[],context={}){return planGrandChantier(work,context).scope;}
