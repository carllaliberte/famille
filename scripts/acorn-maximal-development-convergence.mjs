/**
 * ACORN — Maximal Development Convergence
 * Development policy encoded as a measurable planning contract.
 * Goal: maximize coherent scope, integration depth, reuse and verified value
 * while minimizing unnecessary fragmentation.
 */
export const CONTRACT="acorn.maximal-development-convergence.v1";
export const PRINCIPLES=Object.freeze([
  "MAXIMIZE_COHERENT_SCOPE","MINIMIZE_FRAGMENTATION","MAXIMIZE_INTEGRATION",
  "MAXIMIZE_REUSE","MAXIMIZE_VERIFIED_VALUE","MINIMIZE_DUPLICATION",
  "PRESERVE_TRUTH","PRESERVE_HUMAN_AUTHORITY"
]);
export const SURFACES=Object.freeze([
  "BUGS","REGRESSIONS","OPEN_PR_WORK","ARCHITECTURE","RUNTIME","CUSTOMER",
  "PRODUCT","MARKET","CAPABILITY","INTELLIGENCE","CONNECTIVITY","ENVIRONMENT",
  "SECURITY","EVIDENCE","MEASUREMENT","PERFORMANCE","ECONOMICS","OPERATIONS",
  "REAL_WORLD","PHYSICAL","EVOLUTION","FEDERATION","FUTURE"
]);
export const PIPELINE=Object.freeze([
  "OBSERVE_MAIN","AUDIT_ALL_OPEN_WORK","DISCOVER_GAPS","GROUP_BY_COHERENCE",
  "DEPENDENCY_ANALYSIS","COMPOSE_GRAND_SCOPE","DESIGN_MINIMAL_SHARED_PRIMITIVES",
  "BUILD","TEST","FALSIFY","MEASURE","VERIFY","RECHECK_MAIN","DELIVER",
  "REOBSERVE","RECOMPOSE"
]);
const arr=v=>Array.isArray(v)?v:[];
const num=v=>Number.isFinite(Number(v))?Number(v):0;
export function scoreWork(item={},weights={}) {
  const coherence=num(item.coherence),reuse=num(item.reuse),value=num(item.value);
  const integration=num(item.integration),dependencies=num(item.dependencies);
  const risk=num(item.risk),fragmentation=num(item.fragmentation);
  return coherence*(weights.coherence??1)+reuse*(weights.reuse??1)+value*(weights.value??1)+
    integration*(weights.integration??1)+dependencies*(weights.dependencies??0.5)-
    risk*(weights.risk??1)-fragmentation*(weights.fragmentation??1);
}
export function groupCoherentWork(items=[],threshold=0) {
  const eligible=arr(items).filter(x=>x && x.blocked!==true && scoreWork(x,x.weights||{})>=threshold);
  return eligible.sort((a,b)=>scoreWork(b,b.weights||{})-scoreWork(a,a.weights||{}));
}
export function buildGrandScope(items=[],context={}) {
  const ranked=groupCoherentWork(items,context.threshold??0);
  const included=ranked.filter(x=>x.coherent===true||x.sharedPrimitive===true||x.unblocks===true);
  const deferred=ranked.filter(x=>!included.includes(x));
  return {
    contract:CONTRACT,
    strategy:"ONE_LARGEST_COHERENT_CHANTIER",
    included,
    deferred,
    surfaces:[...new Set(included.flatMap(x=>arr(x.surfaces)))],
    shared_primitives:[...new Set(included.flatMap(x=>arr(x.shared_primitives)))],
    fragmentation_before:arr(items).length,
    fragmentation_after:Math.max(1,included.length?1:0),
    max_coherent_scope:included.length>=Math.min(ranked.length,context.minimumScope??1),
    human_authority_required:true,
    auto_merge:false
  };
}
export function detectFragmentation(items=[]) {
  const xs=arr(items), duplicated=new Map();
  for(const x of xs) for(const p of arr(x.shared_primitives)) duplicated.set(p,(duplicated.get(p)||0)+1);
  return [...duplicated.entries()].filter(([,n])=>n>1).map(([primitive,count])=>({primitive,count}));
}
export function convergenceDecision(items=[],context={}) {
  const scope=buildGrandScope(items,context);
  const fragmentation=detectFragmentation(items);
  return {
    action:scope.included.length>1?"CONSOLIDATE":"SINGLE_COHERENT_CHANGE",
    scope,
    fragmentation,
    reason:fragmentation.length?"SHARED_PRIMITIVES_FAVOR_CONVERGENCE":"MAXIMIZE_COHERENT_SCOPE",
    truth:"DEFINED != CODE_PRESENT != TESTED != EXECUTED != MEASURED != VERIFIED != LIVE"
  };
}
export function assertDevelopmentConstitution() {
  if(!PRINCIPLES.includes("MAXIMIZE_COHERENT_SCOPE")) throw new Error("SCOPE_PRINCIPLE_MISSING");
  if(!PRINCIPLES.includes("PRESERVE_TRUTH")) throw new Error("TRUTH_BOUNDARY_MISSING");
  if(!PIPELINE.includes("FALSIFY")||!PIPELINE.includes("VERIFY")) throw new Error("VERIFICATION_PIPELINE_MISSING");
  return true;
}
