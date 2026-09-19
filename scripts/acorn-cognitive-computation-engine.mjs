/**
 * ACORN — COGNITIVE COMPUTATION ENGINE v1
 *
 * Unified state-space computation over the existing Cortex ecosystem.
 * Quantum-inspired abstractions are computational only:
 * SUPERPOSITION != PHYSICAL QUANTUM
 * INTERFERENCE != PHYSICAL INTERFERENCE
 * COLLAPSE = measured hypothesis-space reduction
 * QPU != INTELLIGENCE
 * CAPABILITY != AUTHORITY
 */
import { createHash } from "node:crypto";

export const CONTRACT = "acorn.cognitive-computation-engine.v1";
export const PARADIGMS = Object.freeze([
  "CLASSICAL","PROBABILISTIC","PARALLEL","EVOLUTIONARY",
  "QUANTUM_INSPIRED","SIMULATION","MULTI_INTELLIGENCE","HYBRID"
]);
export const STATES = Object.freeze([
  "PROPOSED","ACTIVE","OBSERVED","MEASURED","VERIFIED","COLLAPSED","EXPIRED"
]);

const A = v => Array.isArray(v) ? v : [];
const N = v => Number.isFinite(Number(v)) ? Number(v) : null;
const S = v => String(v ?? "").trim();

function stable(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
  return "{" + Object.keys(v).sort().map(k => JSON.stringify(k)+":"+stable(v[k])).join(",") + "}";
}
export function digest(v) { return createHash("sha256").update(stable(v)).digest("hex"); }

export function computationConstitution() {
  return Object.freeze({
    version: CONTRACT,
    quantum_inspired_only: true,
    physical_quantum_claim: false,
    prediction_is_fact: false,
    simulation_is_reality: false,
    probability_is_truth: false,
    capability_is_authority: false,
    human_authority: "carl",
    auto_authorize: false,
    auto_execute: false,
    auto_merge: false,
    auto_spend: false,
    breaker_bypass: false,
  });
}

export function entropy(states = []) {
  const rows = A(states).filter(x => N(x.probability) > 0);
  const total = rows.reduce((a,x)=>a+Number(x.probability),0);
  if (!total) return 0;
  return -rows.reduce((a,x)=>{const p=Number(x.probability)/total; return a+p*Math.log2(p)},0);
}

export function normalizeProbabilities(states = []) {
  const rows=A(states); const total=rows.reduce((a,x)=>a+Math.max(0,N(x.probability)??0),0);
  if (!total) return rows.map(x=>({...x,probability:rows.length?1/rows.length:0}));
  return rows.map(x=>({...x,probability:Math.max(0,N(x.probability)??0)/total}));
}

export function createHypothesis({id,label,prior=0.5,context={},evidence=[],cost=0,risk=0}={}) {
  return {
    id:S(id)||"hypothesis-"+digest({label,context}).slice(0,16),
    label:S(label)||"UNKNOWN",
    prior:Math.max(0,Number(prior)||0),
    probability:Math.max(0,Number(prior)||0),
    context,evidence:A(evidence),cost:N(cost)??0,risk:N(risk)??0,
    state:"PROPOSED", authority:false
  };
}

export function createStateSpace({hypotheses=[],context={},task=null}={}) {
  const states=normalizeProbabilities(A(hypotheses));
  return {
    contract:CONTRACT, task, context, states,
    entropy:entropy(states),
    state_count:states.length,
    measured:false, verified:false, collapsed:false,
    evidence:[], provenance:{task_digest:digest(task),context_digest:digest(context)},
    authority:false, live:false
  };
}

/** Bayesian-style likelihood update. Inputs are likelihoods, not assertions of truth. */
export function updateBeliefs({space={},likelihoods={},evidence={}}={}) {
  const updated=A(space.states).map(h=>{
    const likelihood=N(likelihoods[h.id]);
    return {...h, probability:Math.max(0,(N(h.probability)??0)*(likelihood==null?1:Math.max(0,likelihood)))};
  });
  const states=normalizeProbabilities(updated);
  return {
    ...space, states, entropy:entropy(states),
    evidence:[...A(space.evidence),evidence],
    measured:true, collapsed:false, authority:false
  };
}

/**
 * Quantum-inspired interference: compatible support reinforces; contradiction
 * reduces weight. This is a scoring transform, never physical interference.
 */
export function applyInterference({space={},relations=[]}={}) {
  const rel=A(relations); const delta=new Map();
  for(const r of rel){
    const a=S(r.from),b=S(r.to), strength=Math.max(0,Math.min(1,N(r.strength)??0));
    if(!a||!b||a===b) continue;
    const sign=r.kind==="CONTRADICTION"?-1:1;
    delta.set(a,(delta.get(a)||0)+sign*strength);
    delta.set(b,(delta.get(b)||0)+sign*strength);
  }
  const states=normalizeProbabilities(A(space.states).map(h=>{
    const d=delta.get(h.id)||0;
    return {...h,probability:Math.max(0,(N(h.probability)??0)*(1+d))};
  }));
  return {...space,states,entropy:entropy(states),interference_applied:rel.length,authority:false};
}

export function scoreComputationStrategy({task={},strategy={},benchmark={}}={}) {
  const quality=N(benchmark.quality)??0;
  const reliability=N(benchmark.reliability)??0;
  const latency=N(benchmark.latency_ms);
  const cost=N(benchmark.cost);
  const information=N(strategy.information_gain)??0;
  const penalty=(latency==null?0:Math.min(1,latency/10000))+(cost==null?0:Math.min(1,cost/100));
  return {
    paradigm:S(strategy.paradigm)||"CLASSICAL",
    score:Number((quality*.35+reliability*.30+information*.20+(1-penalty)*.15).toFixed(6)),
    benchmarked:quality>0||reliability>0||latency!=null||cost!=null,
    task_digest:digest(task), authority:false
  };
}

export function routeComputation({task={},strategies=[],benchmarks={}}={}) {
  const scored=A(strategies).map(s=>scoreComputationStrategy({task,strategy:s,benchmark:benchmarks[s.id]||{}}));
  scored.sort((a,b)=>b.score-a.score||a.paradigm.localeCompare(b.paradigm));
  const selected=scored.find(x=>x.benchmarked)||scored[0]||null;
  return {
    contract:CONTRACT, candidates:scored, selected,
    selection:"MEASURED_OR_BOUNDED_CANDIDATE",
    requires_governance:true, authority:false, auto_execute:false
  };
}

export function simulateStateSpace({space={},transition,steps=8}={}) {
  let current=space; const trace=[];
  for(let i=0;i<Math.max(0,Math.min(100,Number(steps)||0));i++){
    const next=typeof transition==="function"?transition(current,i):current;
    trace.push({step:i,state_digest:digest(next),entropy:entropy(next.states)});
    current=next;
  }
  return {
    simulation_id:"sim-"+digest({space,steps,trace}).slice(0,20),
    initial_digest:digest(space), final_digest:digest(current),
    trace, result:current, simulated:true, observed:false, verified:false,
    reality:false, authority:false
  };
}

export function collapseStateSpace({space={},observation={},verification=false}={}) {
  const states=A(space.states);
  if(!states.length) return {...space,collapsed:false,collapse_reason:"NO_STATES"};
  const selected=states.reduce((a,b)=>(b.probability>a.probability?b:a));
  const posterior=states.map(x=>({...x,probability:x.id===selected.id?1:0,state:x.id===selected.id?"COLLAPSED":"EXPIRED"}));
  return {
    ...space, states:posterior, entropy:0, collapsed:true, measured:true,
    verified:verification===true, selected:selected.id,
    collapse:{observation,evidence_present:Object.keys(observation||{}).length>0},
    authority:false, live:false
  };
}

export function informationGain(before={},after={}) {
  return Number((Math.max(0,entropy(before.states)-entropy(after.states))).toFixed(6));
}

export function buildComputationSnapshot({spaces=[],routes=[],simulations=[],measurements=[]}={}) {
  return {
    contract:CONTRACT,
    spaces:A(spaces).map(s=>({state_count:s.state_count??A(s.states).length,entropy:entropy(s.states),collapsed:s.collapsed===true,verified:s.verified===true})),
    routes:A(routes), simulations:A(simulations).map(x=>({simulation_id:x.simulation_id,simulated:x.simulated===true,verified:x.verified===true})),
    measurements:A(measurements),
    quantum_inspired:true, physical_quantum:false,
    authority:false,auto_authorize:false,auto_execute:false,live:false
  };
}

export function assertComputationConstitution(x={}) {
  const v=[];
  if(x.authority===true)v.push("AUTHORITY_ESCALATION");
  if(x.auto_authorize===true)v.push("AUTO_AUTHORIZATION");
  if(x.auto_execute===true)v.push("AUTO_EXECUTION");
  if(x.fake_live===true)v.push("FAKE_LIVE");
  if(x.physical_quantum_claim===true)v.push("UNPROVEN_PHYSICAL_QUANTUM");
  if(x.simulation_is_reality===true)v.push("SIMULATION_REALITY_CONFUSION");
  if(x.probability_is_truth===true)v.push("PROBABILITY_TRUTH_CONFUSION");
  return {contract:CONTRACT,valid:!v.length,violations:v};
}
