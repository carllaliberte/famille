/** ACORN — BUSINESS PRODUCT FACTORY
 * Turns repeated verified customer outcomes into commercial product candidates.
 * No autonomous publication, contracting, payment, spending, outreach or merge.
 */
import crypto from "node:crypto";
const ISO=()=>new Date().toISOString(),id=p=>p+"_"+crypto.randomUUID();
const n=x=>Number.isFinite(Number(x))?Number(x):0;
export const PRODUCT_POLICY=Object.freeze({
  measured_only:true,projected_is_not_realized:true,payment_is_not_receipt:true,
  human_publish:true,human_contract:true,human_payment:true,human_merge:true,
  auto_outreach:false,auto_publish:false,auto_contract:false,auto_spend:false
});
export function normalizeOutcome({customer,problem,solution,delivery,value,evidence=[]}={}){
  const verified=evidence.length>0&&evidence.every(e=>e.status==="MEASURED");
  return {id:id("outcome"),customer,problem,solution_id:solution?.id||null,
    delivery_state:delivery?.state||"UNKNOWN",value_status:value?.status||"UNKNOWN",
    evidence_count:evidence.length,verified,measured_at:ISO()};
}
export function scoreProductCandidate({outcomes=[],reuseRate=0,deliveryTimeReduction=0,
  grossMargin=0,demandSignals=0,standardization=0}={}){
  const verified=outcomes.filter(o=>o.verified).length;
  const score=verified*20+n(reuseRate)*20+n(deliveryTimeReduction)*20+
    n(grossMargin)*20+n(demandSignals)*10+n(standardization)*10;
  return {score,verified_outcomes:verified,signals:{
    reuse_rate:n(reuseRate),delivery_time_reduction:n(deliveryTimeReduction),
    gross_margin:n(grossMargin),demand_signals:n(demandSignals),standardization:n(standardization)
  },measured_at:ISO()};
}
export function buildProductCandidate({name,problemClass,outcomes=[],deliverables=[],
  priceBasis="HUMAN_SET",usageRights=["PERPETUAL_USE"],supportModel="STANDARD",
  score=null}={}){
  const verified=outcomes.filter(o=>o.verified);
  return {id:id("product"),name,problem_class:problemClass,outcome_count:outcomes.length,
    verified_outcomes:verified.length,deliverables,price_basis:priceBasis,
    usage_rights: usageRights, support_model:supportModel,score, state:verified.length?"CANDIDATE":"INSUFFICIENT_EVIDENCE",
    publication:"HUMAN_REQUIRED",created_at:ISO()};
}
export function createOfferTemplate(product,{price,currency="CAD",scope=[],acceptanceCriteria=[],
  deliveryWindow="HUMAN_SET",support="STANDARD"}={}){
  if(product?.state!=="CANDIDATE")return{state:"BLOCKED",reason:"VERIFIED_PRODUCT_EVIDENCE_REQUIRED"};
  if(!(n(price)>0)||!scope.length||!acceptanceCriteria.length)return{state:"BLOCKED",reason:"PRICE_SCOPE_ACCEPTANCE_REQUIRED"};
  return{id:id("offer_template"),product_id:product.id,price:n(price),currency,scope,
    acceptance_criteria:acceptanceCriteria,delivery_window:deliveryWindow,support,
    state:"HUMAN_REVIEW_REQUIRED",publish:false,created_at:ISO()};
}
export function buildCatalogEntry({product,offerTemplate,proofs=[]}={}){
  const ready=product?.state==="CANDIDATE"&&offerTemplate?.state==="HUMAN_REVIEW_REQUIRED"&&proofs.length>0;
  return {id:id("catalog"),product_id:product?.id||null,offer_template_id:offerTemplate?.id||null,
    proof_count:proofs.length,state:ready?"READY_FOR_HUMAN_PUBLISH":"NOT_READY",
    human_publish_required:true,created_at:ISO()};
}
export function buildSalesAsset({catalogEntry,customerLanguage="FR",problemStatement,
  outcomeStatement,proofSummary,cta="REQUEST_REVIEW"}={}){
  if(catalogEntry?.state!=="READY_FOR_HUMAN_PUBLISH")return{state:"BLOCKED",reason:"CATALOG_NOT_READY"};
  return{id:id("sales_asset"),catalog_id:catalogEntry.id,language:customerLanguage,
    problem_statement:problemStatement,outcome_statement:outcomeStatement,proof_summary:proofSummary,
    cta,human_publish_required:true,published:false,created_at:ISO()};
}
export function buildPortfolio({outcomes=[],products=[],offers=[],catalog=[],salesAssets=[]}={}){
  return {system:"ACORN_BUSINESS_PRODUCT_FACTORY",measured_at:ISO(),
    outcomes:{total:outcomes.length,verified:outcomes.filter(x=>x.verified).length},
    products:{candidates:products.filter(x=>x.state==="CANDIDATE").length},
    offers:{ready:offers.filter(x=>x.state==="HUMAN_REVIEW_REQUIRED").length},
    catalog:{ready:catalog.filter(x=>x.state==="READY_FOR_HUMAN_PUBLISH").length},
    sales_assets:{ready:salesAssets.filter(x=>x.human_publish_required&&!x.published).length},
    policy:PRODUCT_POLICY};
}
