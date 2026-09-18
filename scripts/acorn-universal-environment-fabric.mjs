/**
 * ACORN — Universal Environment Fabric
 * One provider-neutral contract for every lifecycle environment.
 *
 * Environment is a governed execution boundary, not a machine.
 * DEV/TEST/STAGING/PROD are separated; ephemeral, research, customer,
 * recovery and physical environments use the same contract.
 */
export const CONTRACT="acorn.universal-environment-fabric.v1";
export const ENVIRONMENTS=Object.freeze([
 "RESEARCH","SANDBOX","DEVELOPMENT","FEATURE","UNIT_TEST","INTEGRATION_TEST",
 "SYSTEM_TEST","SECURITY_TEST","PERFORMANCE_TEST","UAT","PREVIEW","STAGING",
 "PRODUCTION","DISASTER_RECOVERY","BACKUP_RESTORE","CUSTOMER","DEMO",
 "EDGE","IOT","ROBOTICS","INDUSTRIAL","ENERGY","FEDERATION"
]);
export const STATES=Object.freeze(["PLANNED","PROVISIONING","READY","ACTIVE","DEGRADED","FROZEN","DRAINING","RECOVERING","RETIRED","UNKNOWN"]);
export const DATA_CLASSES=Object.freeze(["PUBLIC","INTERNAL","CONFIDENTIAL","RESTRICTED","SECRET"]);
export const GATES=Object.freeze(["IDENTITY","DATA","NETWORK","DEPENDENCY","SECURITY","TEST","PERFORMANCE","OBSERVABILITY","COST","BACKUP","RECOVERY","APPROVAL","TRUTH"]);
export const PROMOTION=Object.freeze(["DISCOVERED","PROVISIONED","TESTED","SECURITY_VERIFIED","PERFORMANCE_MEASURED","UAT_ACCEPTED","STAGED","PRODUCTION_AUTHORIZED","LIVE_MEASURED"]);
const a=v=>Array.isArray(v)?v:[];
const s=v=>typeof v==="string"&&v.length>0?v:null;

export function createEnvironment(input={}){
 const kind=s(input.kind)||"UNKNOWN";
 return {
  contract:CONTRACT,id:s(input.id),kind,
  state:input.state||"PLANNED",
  owner:s(input.owner),region:s(input.region),provider:s(input.provider),
  version:s(input.version),data_class:input.data_class||"INTERNAL",
  ephemeral:input.ephemeral===true,
  production:kind==="PRODUCTION",
  isolated:input.isolated!==false,
  secrets_required:a(input.secrets_required),
  dependencies:a(input.dependencies),
  capabilities:a(input.capabilities),
  evidence:a(input.evidence),
  measurements:a(input.measurements),
  valid_until:s(input.valid_until),
  cost_center:s(input.cost_center)
 };
}
export function environmentBoundary(env={}){
 const e=createEnvironment(env);
 return {
  isolated:e.isolated===true,
  production:e.production,
  data_class:e.data_class,
  secrets_exposed:false,
  direct_prod_from_nonprod:false,
  status:e.state
 };
}
export function dataPolicy(source={},target={}){
 const sClass=DATA_CLASSES.indexOf(source.data_class||"INTERNAL");
 const tClass=DATA_CLASSES.indexOf(target.data_class||"INTERNAL");
 const prod=source.kind==="PRODUCTION";
 const protectedTarget=tClass>=DATA_CLASSES.indexOf("CONFIDENTIAL");
 return {
  allowed:!(prod&&tClass<DATA_CLASSES.indexOf("INTERNAL")) && (!protectedTarget||sClass>=tClass),
  production_source_requires_equal_or_stronger_target:prod,
  sanitized_required:prod&&sClass>tClass,
  reason:prod&&sClass<tClass?"TARGET_PROTECTION_INSUFFICIENT":"POLICY_EVALUATED"
 };
}
export function gateEnvironment(env={},gates={}){
 const required=a(gates.required||GATES);
 const results=required.map(name=>({gate:name,passed:gates[name]===true}));
 return {passed:results.every(x=>x.passed),results};
}
export function promotionDecision(input={}){
 const from=input.from?.kind||"UNKNOWN", to=input.to?.kind||"UNKNOWN";
 const sameFamily=from!=="UNKNOWN"&&to!=="UNKNOWN";
 const gates=gateEnvironment(input.to,input.gates||{});
 const approval=input.human_authorized===true;
 const production=to==="PRODUCTION";
 return {
  allowed:sameFamily&&gates.passed&&(!production||approval),
  state:production?(approval&&gates.passed?"PRODUCTION_AUTHORIZED":"WAITING_HUMAN"):(gates.passed?"PROMOTABLE":"BLOCKED"),
  from,to,gates:gates.results,requires_human_for_production:production
 };
}
export function deploymentPlan(envs=[]){
 const known=a(envs).map(createEnvironment);
 return {
  contract:CONTRACT,
  environments:known,
  isolation:known.every(e=>e.isolated),
  production_separated:known.filter(e=>e.kind==="PRODUCTION").every(e=>e.isolated),
  stages:PROMOTION,
  no_auto_production:true
 };
}
export function recoveryPlan(env={}){
 const e=createEnvironment(env);
 return {
  environment:e.id,
  strategy:e.kind==="PRODUCTION"?"ROLLBACK_OR_RESTORE":"REBUILD_EPHEMERAL",
  backup_required:e.kind==="PRODUCTION",
  fail_closed:true,
  next:["DRAIN","SNAPSHOT","RESTORE_OR_REBUILD","VERIFY","REOBSERVE"]
 };
}
export function optimizationVector(measurements={}){
 const keys=["CUSTOMER_VALUE","QUALITY","RELIABILITY","LATENCY","COST","SECURITY","PRIVACY","FRESHNESS","RECOVERABILITY","OBSERVABILITY","MAINTAINABILITY","REUSABILITY","TIME_TO_VALUE","ENERGY"];
 return Object.fromEntries(keys.map(k=>[k,Number(measurements[k]??0)]));
}
export function chooseEnvironment(candidates=[],constraints={}){
 const eligible=a(candidates).filter(e=>e.state!=="RETIRED"&&e.state!=="UNKNOWN");
 const score=e=>Object.entries(constraints.weights||{}).reduce((n,[k,w])=>n+Number(e[k]??0)*Number(w||0),0);
 return eligible.map(e=>({...e,score:score(e)})).sort((x,y)=>y.score-x.score)[0]||null;
}
export function truthState(env={},runtime={}){
 const e=createEnvironment(env);
 return {
  code_present:true,
  configured:e.state!=="PLANNED",
  executed:runtime.executed===true,
  measured:runtime.measured===true,
  verified:runtime.verified===true,
  live:runtime.live===true&&runtime.verified===true,
  unknown_if_unmeasured:runtime.measured!==true
 };
}
export function assertEnvironmentConstitution(){
 if(ENVIRONMENTS.length<20)throw new Error("ENVIRONMENT_COVERAGE_INCOMPLETE");
 if(!ENVIRONMENTS.includes("PRODUCTION")||!ENVIRONMENTS.includes("DISASTER_RECOVERY"))throw new Error("PRODUCTION_RECOVERY_MISSING");
 if(!GATES.includes("TRUTH")||!GATES.includes("SECURITY"))throw new Error("GATES_INCOMPLETE");
 if(PROMOTION.includes("AUTO_MERGE"))throw new Error("AUTHORITY_BROKEN");
 return true;
}
