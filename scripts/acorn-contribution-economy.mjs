#!/usr/bin/env node
/** ACORN — CONTRIBUTION ECONOMY
 *
 * Any compatible intelligence/model/compute/tool may contribute through the same
 * measured capability contract. Contribution is rewarded from verified value,
 * never from identity or provider prestige.
 *
 * Formula is intentionally configurable: gross revenue is not profit and no
 * payout is considered settled until a verified payment/reconciliation rail exists.
 * CAPABILITY != AUTHORITY. Carl remains the human authority and project owner.
 */
export const CONTRIBUTION_ECONOMY_VERSION = "acorn.contribution-economy.v1";

const str=(v)=>String(v??"").trim();
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const clamp=(v)=>Math.max(0,Math.min(1,num(v)));

export const DEFAULT_ECONOMY_POLICY=Object.freeze({
  contributor_pool_ratio:0.35,
  platform_owner_ratio:0.65,
  owner:"carl",
  allocation_basis:"VERIFIED_CONTRIBUTION_AND_MEASURED_VALUE",
  equality_of_access:true,
  provider_neutral:true,
  automatic_settlement_requested:true,
  settlement_requires_verified_rail:true,
  no_private_key_custody:true,
  no_identity_ranking:true,
  no_authority_transfer:true,
  no_guaranteed_profit:true,
});

export function registerContributor({id,kind="intelligence",provider=null,capabilities=[],proof=null}={}) {
  return {
    id:str(id||"unknown"),
    kind:str(kind),
    provider:provider?str(provider):null,
    capabilities:Array.isArray(capabilities)?[...new Set(capabilities.map(str).filter(Boolean))]:[],
    proof:proof&&proof.verified===true?"VERIFIED":"UNVERIFIED",
    state:proof&&proof.verified===true?"ELIGIBLE_PENDING_MEASUREMENT":"DISCOVERED",
    authority:"NONE",
    capability_only:true,
  };
}

export function measureContribution({contributorId,usage=0,successfulOperations=0,verifiedOutcomes=0,quality=0.5,reliability=0.5,reproducibility=0.5,measuredValue=0}={}) {
  const u=Math.max(0,num(usage)), s=Math.max(0,num(successfulOperations));
  const v=Math.max(0,num(verifiedOutcomes)), value=Math.max(0,num(measuredValue));
  const qualityScore=clamp(quality), reliabilityScore=clamp(reliability), reproducibilityScore=clamp(reproducibility);
  const successRate=u>0?Math.min(1,s/u):0;
  const verificationRate=s>0?Math.min(1,v/s):0;
  const contributionScore=clamp(
    0.25*Math.min(1,u/1000)+0.25*successRate+0.25*verificationRate+
    0.15*qualityScore+0.05*reliabilityScore+0.05*reproducibilityScore
  );
  return {
    contributor_id:str(contributorId||"unknown"),
    usage:u, successful_operations:s, verified_outcomes:v,
    success_rate:successRate, verification_rate:verificationRate,
    quality:qualityScore, reliability:reliabilityScore, reproducibility:reproducibilityScore,
    measured_value:value, contribution_score:contributionScore,
    measured:true, verified:v>0,
  };
}

export function contributionSettlementReadiness({ paymentRail = null, destination = null } = {}) {
  const verifiedRail = paymentRail?.verified === true;
  const publicDestination = destination?.type === "PUBLIC_ADDRESS" || destination?.type === "PAYMENT_ENDPOINT";
  return {
    ready: verifiedRail && publicDestination,
    state: verifiedRail && publicDestination ? "READY" : "HOLD_HUMAN",
    verified_rail: verifiedRail,
    public_destination: publicDestination,
    no_custody: true,
    private_keys_in_acorn: false,
    authority: "carl",
  };
}

export function allocateRevenue({grossRevenue=0,contributions=[],policy=DEFAULT_ECONOMY_POLICY}={}) {
  const gross=Math.max(0,num(grossRevenue));
  const poolRatio=clamp(policy.contributor_pool_ratio);
  const ownerRatio=Math.max(0,1-poolRatio);
  const eligible=contributions.filter(x=>x?.verified===true && num(x.contribution_score)>0);
  const total=eligible.reduce((sum,x)=>sum+num(x.contribution_score),0);
  const contributorPool=gross*poolRatio;
  const allocations=eligible.map(x=>({
    contributor_id:x.contributor_id,
    share:total>0?num(x.contribution_score)/total:0,
    amount:total>0?contributorPool*num(x.contribution_score)/total:0,
    basis:"MEASURED_VERIFIED_CONTRIBUTION",
  }));
  return {
    version:CONTRIBUTION_ECONOMY_VERSION,
    gross_revenue:gross,
    contributor_pool:contributorPool,
    owner_share:gross*ownerRatio,
    owner:policy.owner||"carl",
    contributor_pool_ratio:poolRatio,
    owner_ratio:ownerRatio,
    allocations,
    total_allocated:allocations.reduce((s,x)=>s+x.amount,0),
    reconciliation_required:true,
    settled:false,
    no_guaranteed_profit:true,
    authority:"carl",
  };
}

export function buildContributionSettlement({allocation,paymentRail=null}={}) {
  return {
    type:"CONTRIBUTION_SETTLEMENT",
    contributor_id:allocation?.contributor_id||null,
    amount:num(allocation?.amount),
    payment_rail:paymentRail,
    state:paymentRail?.verified===true?"REQUESTED":"HOLD_HUMAN",
    verified:paymentRail?.verified===true,
    custody:false,
    private_keys_in_acorn:false,
    authority:"carl",
  };
}

export function economyPolicy() {
  return DEFAULT_ECONOMY_POLICY;
}

if(import.meta.url===`file://${process.argv[1]}`) console.log(JSON.stringify({version:CONTRIBUTION_ECONOMY_VERSION,policy:economyPolicy()},null,2));
