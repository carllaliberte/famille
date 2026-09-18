import {buildPortfolio,closeEvolution} from "./acorn-continuous-evolution-reality-fabric.mjs";
export function conductEvolution(snapshot={},candidates=[]){return buildPortfolio(snapshot,candidates);}
export function registerEvolutionOutcome(outcome={}){return closeEvolution(outcome);}
