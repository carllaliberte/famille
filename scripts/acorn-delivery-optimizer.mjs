import {buildCompleteDelivery,createImprovementCycle} from "./acorn-complete-optimal-delivery-engine.mjs";
export function buildDeliveryPlan(input){return buildCompleteDelivery(input);}
export function optimizeDeliveredReality(result,alternatives,scope){return createImprovementCycle(result,alternatives,scope);}
