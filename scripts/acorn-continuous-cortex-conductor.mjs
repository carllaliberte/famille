/** ACORN — CONTINUOUS CORTEX CONDUCTOR
 * Unifies knowledge, federation and self-optimization into one continuous cognitive loop.
 * This is coordination, not a second brain/runtime and never grants authority.
 */
import { cortexSnapshot, assertCortexConstitution } from "./acorn-cortex-knowledge-fabric.mjs";
import { assertSelfOptimizationConstitution } from "./acorn-self-optimization.mjs";
import { assertFederationConstitution } from "./acorn-universal-ai-federation.mjs";
export const CONTRACT="acorn.continuous-cortex-conductor.v1";
export const LOOP=Object.freeze(["OBSERVE","INGEST","VALIDATE","CONNECT","ROUTE","COMPOSE","PROPOSE","AUTHORIZE","EXECUTE","MEASURE","COMPARE","LEARN","REUSE","RECOMPOSE"]);
const arr=v=>Array.isArray(v)?v:[];
export function buildCortexCycle({knowledge=[],participants=[],capabilities=[],outcomes=[],objectives=[],measurements=[],goal}={}) {
 const snapshot=cortexSnapshot({knowledge,participants,capabilities,outcomes});
 const cycle={contract:CONTRACT,goal,loop:[...LOOP],snapshot,inputs:{knowledge:arr(knowledge).length,participants:arr(participants).length,capabilities:arr(capabilities).length,outcomes:arr(outcomes).length,objectives:arr(objectives).length,measurements:arr(measurements).length},state:"OBSERVED",authority:false,external_effect:false,requires_authorization:true,breaker_touched:false};
 assertCortexConstitution(cycle); assertSelfOptimizationConstitution(cycle); assertFederationConstitution(cycle);
 return cycle;
}
export function advanceCortexCycle(cycle,{stage,measurement=null,evidence=[]}={}) {
 if(!cycle||cycle.contract!==CONTRACT) throw new Error("CORTEX_CYCLE_REQUIRED");
 if(!LOOP.includes(stage)) throw new Error("CORTEX_STAGE_UNSUPPORTED");
 const next={...cycle,state:stage,measurement,evidence:arr(evidence),authority:false,external_effect:false,breaker_touched:false};
 assertCortexConstitution(next); assertSelfOptimizationConstitution(next); assertFederationConstitution(next);
 return next;
}
export function detectCortexGaps({knowledge=[],participants=[],capabilities=[],outcomes=[],measurements=[]}={}) {
 return {
  missing_evidence:arr(knowledge).filter(k=>!arr(k.evidence).length).map(k=>k.id),
  unmeasured_participants:arr(participants).filter(p=>!["QUALIFIED","AVAILABLE"].includes(p.state)).map(p=>p.id),
  capability_gaps:arr(capabilities).filter(c=>c.state==="GAP").map(c=>c.id),
  unmeasured_outcomes:arr(outcomes).filter(o=>o.state!=="MEASURED"&&o.state!=="VERIFIED").map(o=>o.id),
  measurement_count:arr(measurements).length,
  state:"OBSERVED"
 };
}
export function chooseNextCortexWork({gaps={},opportunities=[],risk=0}={}) {
 const candidates=[
  ...arr(gaps.missing_evidence).map(id=>({kind:"EVIDENCE",id,priority:3})),
  ...arr(gaps.capability_gaps).map(id=>({kind:"CAPABILITY",id,priority:4})),
  ...arr(gaps.unmeasured_outcomes).map(id=>({kind:"OUTCOME_MEASUREMENT",id,priority:5})),
  ...arr(opportunities).map(id=>({kind:"OPPORTUNITY",id,priority:2}))
 ];
 return {risk,state:"PROPOSED",work:candidates.sort((a,b)=>b.priority-a.priority),authority:false,requires_authorization:true,breaker_touched:false};
}
export function cortexHealth({cycle,gaps={}}={}) {
 const total=Object.values(gaps).filter(Array.isArray).reduce((n,x)=>n+x.length,0);
 return {contract:CONTRACT,state:total?"DEGRADED":"HEALTHY",gap_count:total,cycle_state:cycle?.state??"UNKNOWN",authority:false,breaker_touched:false};
}
export function assertContinuousCortexConstitution(s={}) {
 assertCortexConstitution(s); assertSelfOptimizationConstitution(s); assertFederationConstitution(s); return true;
}
