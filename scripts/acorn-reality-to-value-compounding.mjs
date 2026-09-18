/**
 * ACORN — Reality → Value → Capability Compounding Fabric
 * Converts verified outcomes into reusable economic/technical assets and new opportunities.
 */
export const CONTRACT="acorn.reality-to-value-compounding.v1";
export const STAGES=Object.freeze(["INTENT","DEMAND","CAPABILITY","COMPOSITION","PROJECT","OFFER","ORDER","AUTHORIZATION","EXECUTION","EVIDENCE","OUTCOME","VALUE","BENCHMARK","CAPABILITY_ASSET","PRODUCT","OPPORTUNITY","REUSE","RECOMPOSITION"]);
export const ASSETS=Object.freeze(["KNOWLEDGE","CAPABILITY","WORKFLOW","CONNECTOR","DATASET","MODEL","PROJECT_TEMPLATE","PRODUCT","EVIDENCE_BUNDLE","BENCHMARK","PLAYBOOK"]);
const arr=v=>Array.isArray(v)?v:[];
const verified=x=>x?.verified===true&&x?.measured===true&&x?.expired!==true&&arr(x?.evidence).length>0;
export function qualifyReality(outcome={}){return{state:verified(outcome)?"QUALIFIED_REALITY":"NOT_QUALIFIED",reason:verified(outcome)?"MEASURED_VERIFIED_EVIDENCE":"MISSING_MEASURED_VERIFIED_EVIDENCE",source:outcome.id??null};}
export function deriveAssets(outcome={}){if(!verified(outcome))return{state:"NO_ASSET",assets:[]};return{state:"REUSABLE_ASSETS",assets:arr(outcome.asset_types).filter(x=>ASSETS.includes(x)).length?arr(outcome.asset_types).filter(x=>ASSETS.includes(x)):["CAPABILITY","EVIDENCE_BUNDLE","BENCHMARK"],provenance:outcome.id??null,valid_until:outcome.valid_until??null};}
export function createOpportunity(asset={},demand={}){return{state:asset.state==="REUSABLE_ASSETS"&&demand.verified===true?"EVIDENCE_BACKED":"EXPLORATORY",asset:asset.provenance??null,demand:demand.id??null,verified:asset.state==="REUSABLE_ASSETS"&&demand.verified===true};}
export function composeNextUse(assets=[],requirements=[]){const names=new Set(arr(assets).flatMap(a=>arr(a.capabilities)));return{state:arr(requirements).every(r=>names.has(r))?"COMPOSABLE":"GAP_DETECTED",missing:arr(requirements).filter(r=>!names.has(r))};}
export function benchmarkCompounding(candidates=[],weights={}){const eligible=arr(candidates).filter(verified);const score=x=>Object.entries(weights).reduce((s,[k,w])=>s+Number(x[k]??0)*Number(w??0),0);const ranked=eligible.map(x=>({...x,score:score(x)})).sort((a,b)=>b.score-a.score);return{state:ranked.length?"BEST_KNOWN_IN_SCOPE":"NOT_MEASURED",best:ranked[0]??null,candidates:ranked,global_optimum:false};}
export function closeCompoundingLoop(input={}){const q=qualifyReality(input.outcome||{}),a=deriveAssets(input.outcome||{}),o=createOpportunity(a,input.demand||{});return{contract:CONTRACT,stages:STAGES,qualification:q,assets:a,opportunity:o,next:composeNextUse(input.assets||[],input.requirements||[]),benchmark:benchmarkCompounding(input.candidates||[],input.weights||{}),authority:"HUMAN",auto_spend:false,auto_contract:false,auto_merge:false,truth:"OUTCOME != VALUE != CAPABILITY != AUTHORITY"};}
export function assertCompoundingConstitution(){if(STAGES.length<15||ASSETS.length<8)throw new Error("COMPOUNDING_SCOPE_INCOMPLETE");if(!STAGES.includes("OUTCOME")||!STAGES.includes("OPPORTUNITY"))throw new Error("LOOP_INCOMPLETE");return true;}
