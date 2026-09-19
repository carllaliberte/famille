/** ACORN — ENVIRONMENTAL PERCEPTION & WORLD MODEL
 * Canonical environmental sensing boundary after Cortex closure.
 * Signal -> observation -> state -> world entity -> relation -> evidence.
 * This module normalizes perception; it never grants authority or invents LIVE truth.
 */
import crypto from "node:crypto";
import { createStateRecord, detectStateConflicts } from "./acorn-cortex-state-memory-fabric.mjs";

export const CONTRACT="acorn.environmental-perception-world-model.v1";
export const PERCEPTION_STATES=Object.freeze(["RECEIVED","NORMALIZED","CONFLICT","EXPIRED","REJECTED"]);
export const ENTITY_TYPES=Object.freeze(["PERSON","ORGANIZATION","PROJECT","SERVICE","INTELLIGENCE","CAPABILITY","RESOURCE","EVENT","DOCUMENT","MACHINE","UNKNOWN"]);
const A=v=>Array.isArray(v)?v:[];
const now=()=>new Date().toISOString();
const hash=v=>crypto.createHash("sha256").update(typeof v==="string"?v:JSON.stringify(v)).digest("hex");
const uid=p=>`${p}_${crypto.randomUUID()}`;

function finiteDate(value,fallback=now()){ const d=value?new Date(value):new Date(fallback); return Number.isNaN(d.getTime())?new Date(fallback).toISOString():d.toISOString(); }

export function normalizeSignal(signal={},observed_at=now()){
  if(!signal||typeof signal!=="object") return {state:"REJECTED",reason:"SIGNAL_OBJECT_REQUIRED",authority:false};
  const source=String(signal.source||"UNKNOWN");
  const id=String(signal.id||uid("signal"));
  const kind=String(signal.kind||"ENVIRONMENT_SIGNAL");
  const observed=finiteDate(signal.observed_at,observed_at);
  const evidence=A(signal.evidence);
  const record=createStateRecord({
    id,kind,value:signal.value??null,source,observed_at:observed,
    valid_until:signal.valid_until??null,evidence,measured:signal.measured===true,
    verified:signal.verified===true,version:signal.version??1
  });
  return {contract:CONTRACT,state:"NORMALIZED",record,provenance:{signal_hash:hash(signal),source,observed_at:observed},authority:false,live:false};
}

export function perceiveEnvironment(signals=[],{observed_at=now()}={}){
  const normalized=A(signals).map(s=>normalizeSignal(s,observed_at));
  const accepted=normalized.filter(x=>x.state==="NORMALIZED").map(x=>x.record);
  const conflicts=detectStateConflicts(accepted);
  return {contract:CONTRACT,state:conflicts.conflicts.length?"CONFLICT":"NORMALIZED",observed_at,records:accepted,conflicts,authority:false,live:false};
}

export function createWorldEntity({id,type="UNKNOWN",name=null,attributes={},source="UNKNOWN",observed_at=now(),valid_until=null,evidence=[]}={}){
  if(!id) throw new Error("ENTITY_ID_REQUIRED");
  if(!ENTITY_TYPES.includes(type)) throw new Error("ENTITY_TYPE_UNSUPPORTED");
  return Object.freeze({id:String(id),type,name:name===null?null:String(name),attributes:{...attributes},
    source:String(source),observed_at:finiteDate(observed_at),valid_until:valid_until?finiteDate(valid_until):null,
    evidence:A(evidence),authority:false,live:false});
}

export function buildWorldModel({signals=[],entities=[],relations=[],observed_at=now()}={}){
  const perception=perceiveEnvironment(signals,{observed_at});
  const entityList=A(entities).map(e=>createWorldEntity(e));
  const entityIds=new Set(entityList.map(e=>e.id));
  const relationList=A(relations).filter(r=>entityIds.has(r.from)&&entityIds.has(r.to)).map(r=>({
    id:String(r.id||uid("relation")),from:String(r.from),to:String(r.to),
    type:String(r.type||"RELATED_TO"),confidence:Number.isFinite(r.confidence)?r.confidence:null,
    observed_at:finiteDate(r.observed_at,observed_at),evidence:A(r.evidence),authority:false
  }));
  return {contract:CONTRACT,state:perception.state==="CONFLICT"?"CONFLICT":"READY",
    perception,entities:entityList,relations:relationList,
    coverage:{signals:perception.records.length,entities:entityList.length,relations:relationList.length},
    authority:false,live:false,measured_at:now()};
}

export function mergeWorldObservations(previous={},incoming={}){
  const entities=new Map(A(previous.entities).map(e=>[e.id,e]));
  for(const e of A(incoming.entities)) entities.set(e.id,e);
  const relations=new Map(A(previous.relations).map(r=>[r.id,r]));
  for(const r of A(incoming.relations)) relations.set(r.id,r);
  const signals=[...A(previous.perception?.records),...A(incoming.perception?.records)];
  const conflicts=detectStateConflicts(signals);
  return {contract:CONTRACT,state:conflicts.conflicts.length?"CONFLICT":"MERGED",
    perception:{records:signals,conflicts},entities:[...entities.values()],relations:[...relations.values()],
    authority:false,live:false,merged_at:now()};
}

export function worldModelGaps(model={}){
  const gaps=[];
  if(!model?.perception?.records?.length) gaps.push("NO_ENVIRONMENT_OBSERVATIONS");
  if(!model?.entities?.length) gaps.push("NO_WORLD_ENTITIES");
  if(model?.perception?.conflicts?.conflicts?.length) gaps.push("UNRESOLVED_OBSERVATION_CONFLICTS");
  return {state:gaps.length?"GAPS_FOUND":"COVERAGE_SUFFICIENT",gaps,authority:false};
}

export function assertEnvironmentalPerceptionConstitution(snapshot={}){
  if(snapshot.authority===true) throw new Error("PERCEPTION_CANNOT_GRANT_AUTHORITY");
  if(snapshot.live===true) throw new Error("PERCEPTION_CANNOT_CLAIM_LIVE");
  if(snapshot.auto_authorize===true) throw new Error("PERCEPTION_CANNOT_AUTHORIZE");
  if(snapshot.external_effect===true) throw new Error("PERCEPTION_CANNOT_EXECUTE_EXTERNAL_EFFECT");
  return true;
}
