/**
 * ACORN — Universal Cognitive Protocol v1
 * One interoperability contract for state, events, capabilities, evidence,
 * computation, resources, intelligence and governed actions.
 *
 * This is a protocol/adapter layer, not a second runtime.
 */
import { createHash } from "node:crypto";
export const CONTRACT="acorn.universal-cognitive-protocol.v1";
export const SCHEMAS=Object.freeze(["TASK","STATE","EVENT","CAPABILITY","INTELLIGENCE","RESOURCE","EVIDENCE","MEASUREMENT","DECISION","ACTION","OUTCOME","ERROR"]);
export const STATES=Object.freeze(["DECLARED","PROPOSED","QUALIFIED","ACTIVE","DEGRADED","BLOCKED","EXPIRED","REVOKED"]);
const A=v=>Array.isArray(v)?v:[]; const S=v=>String(v??"").trim();
const stable=v=>v===null||typeof v!=="object"?JSON.stringify(v):Array.isArray(v)?"["+v.map(stable).join(",")+"]":"{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+stable(v[k])).join(",")+"}";
export function digest(v){return createHash("sha256").update(stable(v)).digest("hex")}
export function protocolEnvelope({type,payload={},source="unknown",causation_id=null,correlation_id=null,provenance={},timestamp=new Date().toISOString(),schema_version="1"}={}){
 if(!SCHEMAS.includes(type)) throw new Error("UNSUPPORTED_SCHEMA");
 return {protocol:CONTRACT,schema_version,type,event_id:"evt-"+digest({type,payload,source,timestamp}).slice(0,20),payload,source,causation_id,correlation_id,provenance,timestamp,authority:false};
}
export function negotiateProtocol({local={},remote={}}={}){
 const l=A(local.schemas),r=A(remote.schemas), shared=l.filter(x=>r.includes(x));
 const versions=A(local.versions).filter(x=>A(remote.versions).includes(x));
 return {compatible:shared.length>0&&versions.length>0,shared_schemas:shared,shared_versions:versions,preferred_version:versions.sort().at(-1)||null,local_capabilities:A(local.capabilities),remote_capabilities:A(remote.capabilities),authority:false};
}
export function normalizeCapability(c={}){return {id:S(c.id),name:S(c.name),version:S(c.version)||"0",state:c.state||"DECLARED",contract:S(c.contract),inputs:A(c.inputs),outputs:A(c.outputs),evidence:A(c.evidence),measured:c.measured===true,verified:c.verified===true,live:c.live===true,source:S(c.source)||"unknown",authority:false}}
export function validateMessage(m={}){
 const errors=[];
 if(!SCHEMAS.includes(m.type))errors.push("TYPE_INVALID");
 if(!S(m.protocol))errors.push("PROTOCOL_MISSING");
 if(!S(m.schema_version))errors.push("SCHEMA_VERSION_MISSING");
 if(!S(m.source))errors.push("SOURCE_MISSING");
 if(!S(m.event_id))errors.push("EVENT_ID_MISSING");
 if(m.authority===true)errors.push("AUTHORITY_ESCALATION");
 return {valid:errors.length===0,errors,authority:false};
}
export function routeByProtocol({message,adapters=[],required_capability=null}={}){
 const valid=validateMessage(message);
 if(!valid.valid)return {state:"REJECTED",reason:valid.errors,authority:false};
 const candidates=A(adapters).filter(a=>a.enabled!==false&&(!required_capability||A(a.capabilities).includes(required_capability)));
 return {state:candidates.length?"ROUTED":"NO_COMPATIBLE_ADAPTER",adapter_ids:candidates.map(a=>a.id),message_id:message.event_id,authority:false,external_effect:false};
}
export function buildProtocolSnapshot({messages=[],adapters=[],negotiations=[]}={}){
 return {contract:CONTRACT,message_count:A(messages).length,adapter_count:A(adapters).length,negotiations:A(negotiations),invalid_messages:A(messages).filter(m=>!validateMessage(m).valid).length,authority:false,auto_authorize:false,auto_execute:false,live:false};
}
export function assertProtocolConstitution(x={}){
 const violations=[];
 if(x.authority===true)violations.push("AUTHORITY_ESCALATION");
 if(x.auto_authorize===true)violations.push("AUTO_AUTHORIZATION");
 if(x.auto_execute===true)violations.push("AUTO_EXECUTION");
 if(x.breaker_bypass===true)violations.push("BREAKER_BYPASS");
 if(x.fake_live===true)violations.push("FAKE_LIVE");
 return {contract:CONTRACT,valid:!violations.length,violations};
}
