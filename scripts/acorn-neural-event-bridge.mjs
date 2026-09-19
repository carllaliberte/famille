import {createSemanticEvent} from "./acorn-universal-semantic-event-spine.mjs";
export const CONTRACT="acorn.neural-event-bridge.v1";
export function signalToSemanticEvent({signal={}}={}){return createSemanticEvent({type:signal.type||"OBSERVATION",payload:signal.payload||{},source:signal.from,correlation_id:signal.correlation_id||null,provenance:signal.provenance||{},timestamp:signal.timestamp})}
export function outcomeToSemanticEvent({outcome={}}={}){return createSemanticEvent({type:"OUTCOME",payload:outcome,source:outcome.source||"runtime",causation_id:outcome.action_id||null,correlation_id:outcome.correlation_id||null,provenance:outcome.provenance||{}})}
