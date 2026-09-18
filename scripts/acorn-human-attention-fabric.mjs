#!/usr/bin/env node
/** ACORN — HUMAN ATTENTION FABRIC
 * Minimize human administration without automating human authority.
 * PRIVATE LIFE != HIDDEN FROM LEGAL DUTY.
 */
export const HUMAN_ATTENTION_VERSION="acorn.human-attention.v1";
export const ATTENTION_LEVELS=Object.freeze(["AUTOMATIC","NOTIFY","APPROVAL_CARL","HOLD_HUMAN","BREAKER"]);
const str=v=>String(v??"").trim();
const bool=v=>v===true;
export function classifyAttention({risk="low",authority_required=false,security=false,financial_irreversible=false,breaker=false}={}){
  if(breaker||security)return "BREAKER";
  if(authority_required||financial_irreversible)return "APPROVAL_CARL";
  if(["high","critical"].includes(str(risk).toLowerCase()))return "NOTIFY";
  return "AUTOMATIC";
}
export function humanAttentionBudget({items=[],budget=3}={}){
  const classified=items.map((item)=>({...item,attention:classifyAttention(item)}));
  const urgent=classified.filter(x=>["BREAKER","APPROVAL_CARL","NOTIFY"].includes(x.attention));
  return {version:HUMAN_ATTENTION_VERSION,budget:Number.isFinite(Number(budget))?Math.max(0,Number(budget)):3,items:classified,urgent_count:urgent.length,automatic_count:classified.filter(x=>x.attention==="AUTOMATIC").length,attention_required:urgent.length>0,authority:"carl",auto_merge:false,auto_spend:false,live:false};
}
export function personalBoundary({identity="carl",public_profile=false,private_data=[]}={}){
  return {identity,public_profile:bool(public_profile),private_data_minimized:Array.isArray(private_data)?private_data.length===0:true,personal_life_is_operational_dependency:false,contact_personal_identity_required:false,legal_compliance_preserved:true};
}
export function notificationDigest({events=[],max=5}={}){
  const actionable=events.filter(e=>e&&e.attention&&e.attention!=="AUTOMATIC").slice(0,Math.max(0,Number(max)||5));
  return {count:actionable.length,events:actionable,collapsed:events.length>actionable.length,authority:"carl"};
}
if(import.meta.url===`file://${process.argv[1]}`)console.log(JSON.stringify(humanAttentionBudget(),null,2));
