/** ACORN — CONTEXTUAL CORTEX
 * Build the smallest useful context from distributed knowledge, capabilities and outcomes.
 * Context improves cognition; it never grants authority.
 */
export const CONTRACT="acorn.contextual-cortex.v1";
export const CONTEXT_TYPES=Object.freeze(["TASK","PROJECT","CUSTOMER","ENVIRONMENT","CAPABILITY","RISK","ECONOMY","TEMPORAL"]);
const arr=v=>Array.isArray(v)?v:[]; const n=v=>Number.isFinite(Number(v))?Number(v):0;
export function createContext({goal,scope="ecosystem",time=null,constraints=[],signals=[],knowledge=[],capabilities=[],participants=[],outcomes=[]}={}) {
 if(!goal) throw new Error("GOAL_REQUIRED");
 return {contract:CONTRACT,goal,scope,time,constraints:arr(constraints),signals:arr(signals),knowledge:arr(knowledge),capabilities:arr(capabilities),participants:arr(participants),outcomes:arr(outcomes),state:"ASSEMBLED",authority:false,breaker_touched:false};
}
export function rankContext({context,need,now=Date.now()}={}) {
 const items=[...arr(context.knowledge),...arr(context.capabilities),...arr(context.signals),...arr(context.outcomes)];
 return items.map((x,i)=>({item:x,score:(x.confidence??0)*2+(x.reliability??0)+(x.relevance??0)+(x.expires_at&&Date.parse(x.expires_at)>now?1:0)-n(x.risk),index:i})).sort((a,b)=>b.score-a.score);
}
export function compressContext({context,max_items=20}={}) {
 const ranked=rankContext({context});
 return {...context,selected_context:ranked.slice(0,max_items),dropped_count:Math.max(0,ranked.length-max_items),state:"READY",authority:false,breaker_touched:false};
}
export function detectContextGaps({context,required=[]}={}) {
 const text=JSON.stringify(context);
 return arr(required).filter(r=>!text.includes(String(r))).map(g=>({gap:g,state:"UNKNOWN",requires_discovery:true}));
}
export function updateContext({context,observations=[],measurements=[],new_knowledge=[]}={}) {
 return {...context,signals:[...arr(context.signals),...arr(observations)],outcomes:[...arr(context.outcomes),...arr(measurements)],knowledge:[...arr(context.knowledge),...arr(new_knowledge)],state:"UPDATED",updated_at:new Date().toISOString(),authority:false,breaker_touched:false};
}
export function contextHandoff({context,target="NEXT_AGENT"}={}) {
 return {contract:"acorn.context-handoff.v1",target,goal:context.goal,scope:context.scope,selected_context:arr(context.selected_context),constraints:context.constraints,gaps:detectContextGaps({context,required:context.required??[]}),state:"HANDOFF_READY",authority:false,breaker_touched:false};
}
export function assertContextConstitution(s={}) {
 if(s.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(s.authority_transfer) throw new Error("CONTEXT_CANNOT_GRANT_AUTHORITY");
 if(s.hidden_context) throw new Error("CONTEXT_MUST_BE_TRACEABLE");
 return true;
}
