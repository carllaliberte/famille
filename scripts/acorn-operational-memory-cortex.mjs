/** ACORN — OPERATIONAL MEMORY CORTEX */
export const CONTRACT="acorn.operational-memory-cortex.v1";
const A=v=>Array.isArray(v)?v:[]; const now=()=>new Date().toISOString();
export function recordEpisode({actor,goal,actions=[],observations=[],outcomes=[],cost=0,duration_ms=0,evidence=[]}={}) {
 if(!actor||!goal) throw new Error("EPISODE_IDENTITY_REQUIRED");
 return {id:`episode:${Date.now()}`,actor,goal,actions:A(actions),observations:A(observations),outcomes:A(outcomes),cost:Number(cost)||0,duration_ms:Number(duration_ms)||0,evidence:A(evidence),state:"RECORDED",created_at:now(),authority:false,breaker_touched:false};
}
export function extractLessons({episode,lessons=[]}={}) {
 return A(lessons).map(lesson=>({lesson,source_episode:episode?.id||null,evidence:episode?.evidence||[],state:"PROVISIONAL",requires_validation:true,authority:false,breaker_touched:false}));
}
export function validateLesson(lesson,{evidence=[]}={}) {
 return {...lesson,evidence:A(evidence).length?A(evidence):lesson.evidence,state:A(evidence).length||A(lesson.evidence).length?"VERIFIED":"PROVISIONAL",validated_at:now(),authority:false,breaker_touched:false};
}
export function recall({episodes=[],lessons=[],goal,actor}={}) {
 const text=String(goal||"").toLowerCase();
 const hits=[...A(lessons).filter(x=>x.state==="VERIFIED"&&(!actor||x.actor===actor)),...A(episodes).filter(x=>String(x.goal).toLowerCase().includes(text)).map(x=>({source_episode:x.id,goal:x.goal,outcomes:x.outcomes,state:x.state}))];
 return {goal,results:hits.slice(0,25),state:"RECALLED",authority:false,breaker_touched:false};
}
export function consolidate({episodes=[],lessons=[]}={}) {
 const verified=A(lessons).filter(x=>x.state==="VERIFIED");
 return {contract:CONTRACT,episodes:A(episodes).length,lessons:A(lessons).length,verified_lessons:verified.length,patterns:[...new Set(verified.map(x=>x.lesson))],state:"CONSOLIDATED",created_at:now(),authority:false,breaker_touched:false};
}
export function forgetExpired(items=[],at=Date.now()) {
 return A(items).map(x=>x.expires_at&&Date.parse(x.expires_at)<=at?{...x,state:"EXPIRED"}:x);
}
export function assertOperationalMemoryConstitution(s={}) {
 if(s.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(s.hidden_memory) throw new Error("MEMORY_MUST_BE_TRACEABLE");
 if(s.authority_transfer) throw new Error("MEMORY_CANNOT_GRANT_AUTHORITY");
 return true;
}
