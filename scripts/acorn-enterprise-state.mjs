/** ACORN — DURABLE ENTERPRISE STATE MODEL
 * Provider-neutral records designed for SQLite/Postgres persistence.
 */
const ISO=()=>new Date().toISOString();
const uid=p=>`${p}_${crypto.randomUUID?.()||Math.random().toString(36).slice(2)}`;
export const STATE_ENTITIES=Object.freeze([
  "CUSTOMER","ORGANIZATION","PROJECT","OFFER","TASK","EXECUTION","CONNECTION","INTELLIGENCE",
  "CAPABILITY","EVIDENCE","MONEY_CLAIM","ASSET","PRODUCT","EVENT","TEMPORAL",
  "DELIVERY","VALUE","RENEWAL","EXPANSION","IDENTITY","GRAPH","RELATION","POLICY",
  "DECISION","CONTRACT","DATA","TOOL","MEMORY","MEASUREMENT","AUTHORITY","RIGHT",
  "COMPOSITION","PATTERN","DERIVATION","OPPORTUNITY"
]);
export function stateRecord(entity,data={}){
 if(!STATE_ENTITIES.includes(entity)) throw new Error("UNKNOWN_STATE_ENTITY");
 return {id:data.id||uid(entity.toLowerCase()),entity,version:Number(data.version||1),state:data.state||"PROPOSED",tenant_id:data.tenant_id||null,provenance:data.provenance||"acorn",data,created_at:data.created_at||ISO(),updated_at:ISO()};
}
export function eventRecord({tenantId,entityId,type,payload={},actor="system",authority="none"}={}){
 return {id:uid("event"),tenant_id:tenantId||null,entity_id:entityId||null,type,payload,actor,authority,measured_at:ISO()};
}
export function evidenceRecord({tenantId,claim,source,kind="OBSERVATION",strength=0,margin=0,validUntil=null,epistemic="OBSERVED",version=1,context=null,dependencies=[]}={}){
 const measured=Number.isFinite(strength)&&strength>0&&Number.isFinite(margin)&&margin>0;
 return {
   id:uid("evidence"),tenant_id:tenantId||null,claim,source,kind,strength,margin,valid_until:validUntil,
   status:measured?"MEASURED":"INSUFFICIENT",measured_at:ISO(),
   epistemic:epistemic||"OBSERVED",version:Number(version||1),context:context||null,
   dependencies:Array.isArray(dependencies)?dependencies:[],
   payload:{epistemic:epistemic||"OBSERVED",version:Number(version||1),context:context||null,dependencies:Array.isArray(dependencies)?dependencies:[]}
 };
}
export function assertTenantAccess(record,tenantId){
 if(record.tenant_id!==tenantId) throw new Error("TENANT_ISOLATION_VIOLATION");
 return true;
}
export function stateSnapshot(records=[]){
 return {count:records.length,by_entity:Object.fromEntries(STATE_ENTITIES.map(e=>[e,records.filter(r=>r.entity===e).length])),measured_at:ISO()};
}
