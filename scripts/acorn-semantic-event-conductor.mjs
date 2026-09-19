import {createSemanticEvent,appendEvent,replayEvents,summarizeEventSpine} from "./acorn-universal-semantic-event-spine.mjs";
export const CONTRACT="acorn.semantic-event-conductor.v1";
export function runSemanticEventSpine({log=[],events=[]}={}){let current=log;const results=[];for(const event of events){const r=appendEvent({log:current,event});current=r.log;results.push(r)}return {contract:CONTRACT,results,summary:summarizeEventSpine({log:current}),replayable:true,human_gate:true,authority:false,auto_execute:false,live:false}}
export {createSemanticEvent,replayEvents};
