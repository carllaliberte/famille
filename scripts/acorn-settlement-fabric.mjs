#!/usr/bin/env node
/** ACORN — SETTLEMENT FABRIC
 * Payment is a capability/rail, never authority or identity.
 * Public receiving destinations only. No private keys, seeds, custody or automatic spending.
 */
import {createHash} from "node:crypto";
export const SETTLEMENT_VERSION="acorn.settlement.v1";
export const DESTINATION_TYPES=Object.freeze(["PUBLIC_ADDRESS","PAYMENT_ENDPOINT"]);
export const SETTLEMENT_STATES=Object.freeze(["DISCOVERED","VERIFIED","REQUESTED","PENDING","SETTLED","RECONCILED","EXPIRED","REJECTED","HOLD_HUMAN"]);
const str=v=>String(v??"").trim();
const digest=v=>createHash("sha256").update(JSON.stringify(v)).digest("hex");
const secretKey=/private.?key|seed|mnemonic|secret|passphrase/i;
export function normalizeDestination(input={}){
  const address=str(input.address),type=str(input.destination_type||"PUBLIC_ADDRESS").toUpperCase();
  if(!DESTINATION_TYPES.includes(type))return {status:"REJECTED",reason:"DESTINATION_TYPE_UNSUPPORTED"};
  if(!address)return {status:"DISCOVERED",verified:false,reason:"PUBLIC_DESTINATION_REQUIRED"};
  if(secretKey.test(address))return {status:"REJECTED",verified:false,reason:"PRIVATE_CREDENTIAL_FORBIDDEN"};
  return {status:"DISCOVERED",verified:false,destination_type:type,provider:str(input.provider||"unknown"),chain:str(input.chain||"unknown"),asset:str(input.asset||"unknown"),address,confirmation_policy:input.confirmation_policy||null,expires_at:input.expires_at||null,refund_policy:input.refund_policy||"HOLD_HUMAN"};
}
export function verifyDestination(destination,{method="human_or_provider_proof",evidence=null}={}){
  if(!destination||destination.status==="REJECTED")return {status:"REJECTED",verified:false};
  if(!evidence)return {...destination,status:"DISCOVERED",verified:false,verification_method:method};
  return {...destination,status:"VERIFIED",verified:true,verification_method:method,evidence:evidence};
}
export function createSettlementRequest({billing_event,destination,amount=null}={}){
  const commercial=Number(billing_event?.amount_due||0)>0;
  if(!commercial)return {status:"REJECTED",reason:"NOT_BILLABLE",authority:"carl"};
  if(!destination?.verified)return {status:"HOLD_HUMAN",reason:"PAYMENT_DESTINATION_NOT_VERIFIED",authority:"carl"};
  const requested=amount??billing_event.amount_due;
  return {version:SETTLEMENT_VERSION,type:"SETTLEMENT_REQUEST",id:"settle:"+digest({billing_event,destination,requested}).slice(0,24),billing_event_id:billing_event.opportunity_id||null,amount:Number(requested),currency:billing_event.currency||"USD",destination:{provider:destination.provider,chain:destination.chain,asset:destination.asset,address:destination.address},status:"REQUESTED",automatic_collection:true,auto_spend:false,authority:"carl"};
}
export function recordSettlementProof({request,transaction={}}={}){
  if(!request||request.status!=="REQUESTED")return {status:"REJECTED",verified:false};
  if(!transaction.tx_id)return {status:"PENDING",verified:false,reason:"TRANSACTION_PROOF_REQUIRED"};
  return {...request,status:"RECONCILED",verified:true,settlement:{tx_id:str(transaction.tx_id),confirmed:transaction.confirmed===true,observed_at:transaction.observed_at||new Date().toISOString()},evidence_digest:digest(transaction)};
}
export function settlementPolicy(){return {version:SETTLEMENT_VERSION,public_destination_only:true,no_private_keys:true,no_custody:true,no_auto_spend:true,automatic_collection:true,provider_neutral:true,unknown_asset_requires_verification:true,refunds_require_human_authority:true,authority:"carl"};}
if(import.meta.url===`file://${process.argv[1]}`)console.log(JSON.stringify(settlementPolicy(),null,2));
