import {optimizeDelivery} from "./acorn-complete-optimal-delivery-engine.mjs";
export function improveForever(current,alternatives=[],scope={}) {
 const x=optimizeDelivery(current,alternatives,scope);
 return {...x,continuation:"NO_FINAL_STATE",next_cycle:"OBSERVE→MEASURE→BENCHMARK→IMPROVE"};
}
