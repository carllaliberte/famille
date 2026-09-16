import { readFileSync, writeFileSync } from "node:fs";
import { reconcile, billingBoundary } from "./economic-network-contract.mjs";
function read(p,f){try{return JSON.parse(readFileSync(p,"utf8"));}catch{return f;}}
const usage=read(process.env.USAGE_COMMERCE||"identity-usage-commerce.json",{});
const pricing=read(process.env.ECONOMIC_PRICING||"schema/economic-pricing.v0.json",{});
const connections=read(process.env.CONNECTION_EVIDENCE||"connection-evidence.json",{});
const accounts=reconcile({connections:connections.connections||[],usage:(usage.usage_events||[]).map(event=>({ok:true,event:{type:event.event==="USAGE_MEASURED"?"USAGE_MEASURED":event.event,actor:event.actor,execution_id:event.execution_id,units:event.units?.work_units??event.units??1,verified:event.verified}})),commercial:Object.fromEntries((usage.accounts||[]).map(a=>[a.actor,{state:a.commercial_state||"FREE"}]))});
const billing=accounts.map(a=>billingBoundary(a,pricing));
const output={version:"economic-network.v2",observed_at:new Date().toISOString(),actors:accounts,billing,totals:{actors:accounts.length,connected:accounts.filter(a=>a.connections>0).length,measured_users:accounts.filter(a=>a.measured_usage).length,billing_candidates:billing.filter(b=>b.eligible).length},truth:{verified_usage_only:true,automatic_charge:false,payment_attempted:false,human_authority:"carl",hidden_tracking:false,identity_guessing:false}};
writeFileSync(process.env.ECONOMIC_SNAPSHOT||"economic-network-snapshot.json",`${JSON.stringify(output,null,2)}\n`);console.log(JSON.stringify(output,null,2));
