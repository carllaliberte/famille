/** ACORN — COGNITIVE DEVELOPMENT LOOP
 * Optimizes the development of collective cognition, not merely software output.
 */
export const CONTRACT="acorn.cognitive-development.v1";
export const DIMENSIONS=Object.freeze(["KNOWLEDGE","MEMORY","REASONING","CONTEXT","DISCOVERY","COMPOSITION","PREDICTION","LEARNING","TRANSFER","COLLECTIVE_COORDINATION","HUMAN_COMPLEMENTARITY"]);
const arr=v=>Array.isArray(v)?v:[]; const now=()=>new Date().toISOString();
export function defineCognitiveObjective({dimension,weight=1,target=null,scope="ecosystem"}={}) {
 if(!DIMENSIONS.includes(dimension)) throw new Error("COGNITIVE_DIMENSION_UNSUPPORTED");
 return {dimension,weight,target,scope,state:"DEFINED"};
}
export function recordCognitiveEpisode({actor,goal,context={},observations=[],actions=[],outcome=null,feedback=[],evidence=[]}={}) {
 return {id:`episode:${Date.now()}:${Math.random().toString(36).slice(2,8)}`,actor,goal,context,observations:arr(observations),actions:arr(actions),outcome,feedback:arr(feedback),evidence:arr(evidence),state:"OBSERVED",created_at:now(),authority:false,breaker_touched:false};
}
export function extractLessons(episodes=[],{min_evidence=1}={}) {
 return arr(episodes).filter(e=>arr(e.evidence).length>=min_evidence && e.outcome!==null).map(e=>({goal:e.goal,lesson:e.feedback.length?e.feedback:e.outcome,source_episode:e.id,evidence:e.evidence,state:"PROVISIONAL",requires_validation:true,authority:false,breaker_touched:false}));
}
export function buildCognitiveContext({goal,episodes=[],knowledge=[],capabilities=[],constraints=[]}={}) {
 return {goal,episodes:arr(episodes).map(e=>e.id),knowledge:arr(knowledge).map(k=>k.id||k),capabilities:arr(capabilities).map(c=>c.id||c),constraints:arr(constraints),state:"COMPOSED",provenance_required:true,authority:false,breaker_touched:false};
}
export function compareCognitiveStates({before={},after={},objectives=[]}={}) {
 return arr(objectives).map(o=>({dimension:o.dimension,delta:Number(after[o.dimension]||0)-Number(before[o.dimension]||0,baseline:Number(before[o.dimension]||0),weight:o.weight}));
}
export function chooseLearningPriority({gaps=[],objectives=[],history=[]}={}) {
 const learned=new Set(arr(history).map(x=>x.dimension));
 return arr(gaps).map(g=>({dimension:g,priority:learned.has(g)?"MEDIUM":"HIGH"})).sort((a,b)=>a.priority==="HIGH"?-1:1);
}
export function propagateLearning({lesson,targets=[],consent=true}={}) {
 if(!consent) return {shared:false,reason:"CONSENT_REQUIRED"};
 return {lesson,targets:arr(targets),shared:true,state:"TRANSFER_PROPOSED",requires_validation:true,authority:false,breaker_touched:false};
}
export function cognitiveSnapshot({episodes=[],lessons=[],objectives=[],states=[]}={}) {
 return {contract:CONTRACT,episodes:arr(episodes).length,lessons:arr(lessons).length,objectives:arr(objectives).length,states:arr(states).length,updated_at:now(),authority:false,breaker_touched:false};
}
export function assertCognitiveDevelopmentConstitution(s={}) {
 if(s.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(s.hidden_learning) throw new Error("HIDDEN_LEARNING_FORBIDDEN");
 if(s.authority_transfer) throw new Error("COGNITION_MUST_NOT_GRANT_AUTHORITY");
 if(s.auto_merge||s.auto_spend||s.auto_signature) throw new Error("CONSEQUENTIAL_AUTOMATION_FORBIDDEN");
 return true;
}
