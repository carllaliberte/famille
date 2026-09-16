/** ACORN ECONOMIC NETWORK — real connection, verified usage, commercial boundary. */
export const VERSION = "economic-network.v2";
export const COMMERCIAL_STATES = Object.freeze(["FREE","TRIAL","PAYABLE","PAID","EXEMPT","DISPUTED"]);

export function connectionEvent({ actor, channel="unknown", authenticated=false, authorized=false, at=new Date().toISOString(), source="runtime" }={}) {
  const id=String(actor||"").trim().toLowerCase();
  if(!id) return {ok:false,code:"IDENTITY_MISSING"};
  return {ok:true,event:{version:VERSION,type:"CONNECTION_OBSERVED",actor:id,channel,authenticated:authenticated===true,authorized:authorized===true,state:authorized?"AUTHORIZED":authenticated?"AUTHENTICATED":"CONNECTED",at,source,privacy:{fingerprinting:false,hidden_tracking:false,identity_inference:false}}};
}

export function admission(event) {
  if(!event?.ok) return {ok:false,decision:"DENY",reason:"INVALID_CONNECTION"};
  if(event.event.authorized===true) return {ok:true,decision:"ADMIT",reason:"AUTHORIZED",human_alert:false};
  if(event.event.authenticated!==true) return {ok:true,decision:"AUTH_REQUIRED",reason:"NOT_AUTHENTICATED",human_alert:false};
  return {ok:true,decision:"DENY",reason:"NOT_AUTHORIZED",human_alert:false};
}

export function verifiedUsage({actor,execution_id,executed,verified,capability="unknown",units=1,at=new Date().toISOString(),source="verified-runtime"}={}) {
  if(!actor||!execution_id||executed!==true||verified!==true) return {ok:false,code:"USAGE_NOT_VERIFIED"};
  const n=Number(units);
  return {ok:true,event:{version:VERSION,type:"USAGE_MEASURED",actor:String(actor).toLowerCase(),execution_id:String(execution_id),capability,units:Number.isFinite(n)&&n>=0?n:1,at,verified:true,source}};
}

export function reconcile({connections=[],usage=[],commercial={}}={}) {
  const map=new Map(),seen=new Set();
  for(const row of connections){const e=row?.event||row;if(e?.type!=="CONNECTION_OBSERVED")continue;const a=map.get(e.actor)||{actor:e.actor,connections:0,executions:0,usage_units:0};a.connections++;a.last_connection=e.at;map.set(e.actor,a);}
  for(const row of usage){const e=row?.event||row;if(e?.type!=="USAGE_MEASURED"||e.verified!==true||seen.has(e.execution_id))continue;seen.add(e.execution_id);const a=map.get(e.actor)||{actor:e.actor,connections:0,executions:0,usage_units:0};a.executions++;a.usage_units+=Number(e.units)||0;map.set(e.actor,a);}
  return [...map.values()].map(a=>({...a,commercial_state:COMMERCIAL_STATES.includes(commercial[a.actor]?.state)?commercial[a.actor].state:"FREE",measured_usage:a.executions>0}));
}

export function billingBoundary(account,pricing={}) {
  const eligible=account?.commercial_state==="PAYABLE"&&account.measured_usage&&pricing.enabled===true&&Number(pricing.per_unit)>0;
  return {actor:account?.actor||null,eligible,amount:eligible?Number((account.usage_units*Number(pricing.per_unit)).toFixed(6)):null,currency:pricing.currency||null,boundary:eligible?"HUMAN_REVIEW":"NONE",charged:false,payment_attempted:false};
}
