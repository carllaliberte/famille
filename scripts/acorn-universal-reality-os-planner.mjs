import {LOOP,createRealityIntent,compileReality,composeCapabilities,closeLoop} from "./acorn-universal-reality-os.mjs";
export function buildRealityPortfolio(request={},context={}){
 const intent=createRealityIntent(request);
 const plan=compileReality(intent,context.catalog??{});
 const composition=composeCapabilities(plan.candidates);
 return {contract:"acorn.universal-reality-os.v1",intent,plan,composition,loop:LOOP,mode:plan.state==="COMPILED"?"READY_FOR_AUTHORIZATION":"BLOCKED",human_gate:true};
}
export function reconcileReality(project={},outcome={},peers=[]){
 return closeLoop({intent:project,outcome,peers});
}
