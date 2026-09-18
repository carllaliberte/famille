/**
 * ACORN — Universal Intent → Reality Commerce OS
 * Customer-facing convergence: human intent becomes a qualified project,
 * a measured offer, an authorized execution, a delivered outcome and a reusable asset.
 */
export const CONTRACT="acorn.universal-intent-to-reality-commerce-os.v1";
export const LIFECYCLE=Object.freeze([
"DISCOVER","INTAKE","UNDERSTAND","QUALIFY","DECOMPOSE","DISCOVER_CAPABILITIES",
"DISCOVER_RESOURCES","COMPOSE","SIMULATE","ESTIMATE","BENCHMARK","PACKAGE",
"OFFER","CHECKOUT","ORDER","PAYMENT_OBSERVED","AUTHORIZE","EXECUTE","OBSERVE",
"VERIFY","DELIVER","MEASURE_VALUE","RENEW","EXPAND","LEARN","REUSE","RECOMPOSE"
]);
export const DOMAINS=Object.freeze([
"CX","INTENT","PROJECT","PRODUCT","SERVICE","MARKET","CAPABILITY","INTELLIGENCE",
"CONNECTOR","RESOURCE","COMPUTE","DATA","SOFTWARE","PHYSICAL","ROBOTICS","INDUSTRIAL",
"ENERGY","SECURITY","IDENTITY","QUALITY","EVIDENCE","ECONOMICS","OPERATIONS",
"RENEWAL","FEDERATION"
]);
export const COMMERCIAL_TRUTH=Object.freeze([
"OFFER","ORDER","PAYMENT_OBSERVED","EXECUTION_AUTHORIZED","EXECUTION","DELIVERY","CUSTOMER_VALUE"
]);
const arr=v=>Array.isArray(v)?v:[];
const verified=x=>x?.verified===true&&x?.measured===true&&x?.expired!==true&&arr(x?.evidence).length>0;
const humanEffects=new Set(["PAYMENT","CONTRACT","PRICE_CHANGE","REFUND","PAYOUT","SIGN","DELETE","PUBLISH","MERGE","PRODUCTION"]);
export function createCustomerIntent(input={}){return{contract:CONTRACT,id:input.id??null,customer:input.customer??null,objective:input.objective??null,requirements:arr(input.requirements),constraints:arr(input.constraints),deadline:input.deadline??null,budget:input.budget??null,quality:arr(input.quality),success:arr(input.success),jurisdiction:input.jurisdiction??null,state:"INTAKE",evidence:arr(input.evidence)};}
export function qualifyIntent(intent={}){const complete=Boolean(intent.objective)&&arr(intent.success).length>0;return{state:complete?"QUALIFIED":"NEEDS_CLARIFICATION",missing:[!intent.objective?"objective":null,!arr(intent.success).length?"success_criteria":null].filter(Boolean),customer_value_target:intent.objective??null};}
export function compileProject(intent={},capabilities=[],resources=[]){const q=qualifyIntent(intent);return{state:q.state==="QUALIFIED"?"COMPILED":"BLOCKED",objective:intent.objective??null,tasks:arr(intent.requirements).map((r,i)=>({id:`task-${i+1}`,requirement:r})),capabilities:arr(capabilities).filter(x=>x?.state==="VERIFIED"&&!x?.expired),resources:arr(resources),success:arr(intent.success),missing_capabilities:arr(intent.requirements).filter(r=>!arr(capabilities).some(c=>arr(c.capabilities).includes(r)&&c.state==="VERIFIED"))};}
export function buildOffer(project={},benchmarks=[]){const b=arr(benchmarks).filter(verified);return{state:project.state==="COMPILED"&&b.length?"OFFER_READY":"OFFER_BLOCKED",project:project.objective??null,benchmark_count:b.length,price_basis:"MEASURED_SCOPE",execution_authority:"HUMAN_SERVER"};}
export function observePayment(payment={}){return{state:payment.observed===true?"PAYMENT_OBSERVED":"PAYMENT_NOT_OBSERVED",provider:payment.provider??null,reference:payment.reference??null};}
export function authorizeEffect(effect,context={}){const e=String(effect||"UNKNOWN").toUpperCase();if(humanEffects.has(e))return{authorized:false,state:"WAITING_HUMAN",effect:e};return context.server_authorized===true?{authorized:true,state:"AUTHORIZED",effect:e}:{authorized:false,state:"WAITING_AUTHORITY",effect:e};}
export function verifyDelivery(delivery={}){const ok=verified(delivery)&&delivery.accepted===true;return{state:ok?"DELIVERED_VERIFIED":"DELIVERY_NOT_VERIFIED",customer_value:ok&&delivery.customer_value_measured===true,evidence:arr(delivery.evidence)};}
export function createRenewalOpportunity(delivery={},intent={}){const v=verifyDelivery(delivery);return{state:v.state==="DELIVERED_VERIFIED"&&v.customer_value===true?"EXPANSION_CANDIDATE":"NOT_READY",reason:v.state==="DELIVERED_VERIFIED"&&v.customer_value===true?"MEASURED_CUSTOMER_VALUE":"VALUE_NOT_MEASURED",customer:intent.customer??null};}
export function closeCommerceLoop(input={}){const intent=createCustomerIntent(input.intent||{}),qualification=qualifyIntent(intent),project=compileProject(intent,input.capabilities||[],input.resources||[]),offer=buildOffer(project,input.benchmarks||[]),payment=observePayment(input.payment||{}),delivery=verifyDelivery(input.delivery||{});return{contract:CONTRACT,lifecycle:LIFECYCLE,domains:DOMAINS,intent,qualification,project,offer,payment,delivery,renewal:createRenewalOpportunity(input.delivery||{},intent),commercial_truth:COMMERCIAL_TRUTH,authority:"HUMAN_SERVER",auto_merge:false,auto_spend:false,auto_contract:false,truth:"OFFER != ORDER != PAYMENT_OBSERVED != EXECUTION != VALUE"};}
export function assertCommerceConstitution(){if(LIFECYCLE.length<25||DOMAINS.length<20)throw new Error("COMMERCE_OS_SCOPE_INCOMPLETE");if(!COMMERCIAL_TRUTH.includes("CUSTOMER_VALUE"))throw new Error("VALUE_TRUTH_MISSING");return true;}
