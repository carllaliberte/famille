/** ACORN — SELF OPTIMIZATION ENGINE
 * Self-optimization means measured improvement toward explicit objectives.
 * It never grants authority, spends money, signs contracts, merges, or touches Breaker.
 */
export const CONTRACT="acorn.self-optimization.v1";
export const OBJECTIVES=Object.freeze(["CUSTOMER_VALUE","RELIABILITY","QUALITY","LATENCY","COST_EFFICIENCY","REUSE","REVENUE","RISK_REDUCTION","LEARNING_RATE"]);
const arr=v=>Array.isArray(v)?v:[];
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
export function defineObjective({name,weight=1,direction="MAX",target=null,scope="acorn"}={}) {
 if(!OBJECTIVES.includes(name)) throw new Error("OBJECTIVE_UNSUPPORTED");
 if(weight<=0) throw new Error("OBJECTIVE_WEIGHT_INVALID");
 if(!["MAX","MIN"].includes(direction)) throw new Error("OBJECTIVE_DIRECTION_INVALID");
 return {name,weight,direction,target,scope,state:"DEFINED"};
}
export function observePerformance({objective,baseline,current,evidence=[],cost=0,risk=0}={}) {
 const delta=num(current)-num(baseline);
 return {objective,baseline:num(baseline),current:num(current),delta,evidence:arr(evidence),cost:num(cost),risk:num(risk),state:"MEASURED",measured_at:new Date().toISOString()};
}
export function scoreOptimization({objectives=[],measurements=[]}={}) {
 const by=new Map(arr(measurements).map(m=>[m.objective,m]));
 let total=0;
 for(const o of objectives){const m=by.get(o.name);if(!m)continue;const improvement=o.direction==="MAX"?m.delta:-m.delta;total+=o.weight*improvement;}
 return {score:total,objectives:arr(objectives).map(o=>o.name),measurements:arr(measurements).length,state:"MEASURED"};
}
export function proposeOptimization({current_state,objectives=[],measurements=[],candidate,expected_gain=0,expected_cost=0,risk="UNKNOWN",evidence=[]}={}) {
 const score=scoreOptimization({objectives,measurements});
 return {contract:CONTRACT,current_state,candidate,expected_gain:num(expected_gain),expected_cost:num(expected_cost),expected_net:num(expected_gain)-num(expected_cost),risk,evidence:arr(evidence),baseline_score:score.score,state:"PROPOSED",requires_measurement:true,requires_human_authorization:true,authority:false,auto_merge:false,auto_spend:false,auto_signature:false,breaker_touched:false,created_at:new Date().toISOString()};
}
export function compareOutcomes({before,after,objectives=[]}={}) {
 const measurements=arr(objectives).map(o=>({objective:o.name,baseline:before?.[o.name],current:after?.[o.name],evidence:["OBSERVED_OUTCOME"]}));
 return scoreOptimization({objectives,measurements});
}
export function acceptOptimization({proposal,measured_gain,minimum_gain=0}={}) {
 if(!proposal||proposal.state!=="PROPOSED") throw new Error("PROPOSAL_REQUIRED");
 return {...proposal,measured_gain:num(measured_gain),accepted:num(measured_gain)>num(minimum_gain),state:"MEASURED_OUTCOME",authority:false,breaker_touched:false};
}
export function learnOptimization({history=[]}={}) {
 const successful=arr(history).filter(x=>x.accepted);
 return {successful_count:successful.length,patterns:[...new Set(successful.map(x=>x.candidate).filter(Boolean))],state:"LEARNED",authority:false,breaker_touched:false};
}
export function assertSelfOptimizationConstitution(snapshot={}) {
 if(snapshot.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(snapshot.authority_transfer) throw new Error("SELF_OPTIMIZATION_CANNOT_GRANT_AUTHORITY");
 if(snapshot.auto_merge) throw new Error("AUTO_MERGE_FORBIDDEN");
 if(snapshot.auto_spend) throw new Error("AUTO_SPEND_FORBIDDEN");
 if(snapshot.auto_signature) throw new Error("AUTO_SIGNATURE_FORBIDDEN");
 return true;
}
