import {buildSystemContext} from "./acorn-continuous-system-context-fabric.mjs";
export const CONTRACT="acorn.continuous-context-bridge.v1";
export function bridgeSystemState({eventLog=[],worldModel=[],reality=[],outcomes=[],resources=[],now}={}){return buildSystemContext({events:eventLog,observations:[...worldModel,...reality,...outcomes,...resources],now})}
