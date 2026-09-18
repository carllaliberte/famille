import {discoverDemand,discoverCapabilities,compareCapabilities,createOpportunity} from "./acorn-universal-world-engine.mjs";
export function buildMarketReality({demands=[],capabilities=[],criteria={}}={}){
 const qualified=discoverDemand(demands).filter(d=>d.demand_state==="QUALIFIED");
 const ranked=compareCapabilities(capabilities,criteria);
 const matches=qualified.flatMap(d=>ranked.map(c=>createOpportunity(c,{...d,verified:true})).filter(x=>x.verified));
 return {state:"MEASURED_MARKET_GRAPH",demands:qualified,capabilities:ranked,matches};
}
