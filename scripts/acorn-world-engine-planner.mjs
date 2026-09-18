import {buildWorldPortfolio,closeWorldCycle} from "./acorn-universal-world-engine.mjs";
export function planWorld(intent,context={}){return buildWorldPortfolio({intent,...context});}
export function settleWorld(outcome){return closeWorldCycle(outcome);}
