/** ACORN — CORTEX STATE & MEMORY FABRIC
 * Temporal, provenance-first memory for the Cortex mission cycle.
 * Memory records observations; it never becomes authority.
 */
import { conductMission, assertMissionConstitution } from "./acorn-cortex-mission-conductor.mjs";
import { measureOutcome, learnFromOutcome } from "./acorn-universal-outcome-learning-fabric.mjs";

export const CONTRACT="acorn.cortex-state-memory-fabric.v1";
const arr=v=>Array.isArray(v)?v:[];
const now=()=>new Date().toISOString();

export function createStateRecord(input={}){
  if(!input.id) throw new Error("STATE_ID_REQUIRED");
  if(!input.kind) throw new Error("STATE_KIND_REQUIRED");
  return Object.freeze({
    id:String(input.id),
    kind:String(input.kind),
    value:input.value??null,
    source:input.source??"UNKNOWN",
    observed_at:input.observed_at??now(),
    valid_until:input.valid_until??null,
    evidence:arr(input.evidence),
    measured:input.measured===true,
    verified:input.verified===true,
    version:Number.isFinite(input.version)?input.version:1,
    authority:false
  });
}

export function isCurrentState(record,at=Date.now()){
  if(!record||record.authority===true) return false;
  if(record.valid_until && Date.parse(record.valid_until)<at) return false;
  return true;
}

export function buildStateSnapshot(records=[],at=Date.now()){
  const current=arr(records).filter(r=>isCurrentState(r,at));
  const byKind={};
  for(const record of current){
    (byKind[record.kind]??=[]).push(record);
  }
  return {
    contract:CONTRACT,
    captured_at:new Date(at).toISOString(),
    state:"SNAPSHOT",
    records:current,
    by_kind:byKind,
    authority:false
  };
}

export function detectStateConflicts(records=[]){
  const groups=new Map();
  for(const r of arr(records)){
    const key=r.kind+":"+r.id;
    const list=groups.get(key)??[];
    list.push(r); groups.set(key,list);
  }
  const conflicts=[];
  for(const [key,list] of groups){
    const values=new Set(list.map(x=>JSON.stringify(x.value)));
    if(values.size>1) conflicts.push({key,records:list.map(x=>x.id),state:"CONFLICT"});
  }
  return {state:conflicts.length?"CONFLICTS_FOUND":"CONSISTENT",conflicts};
}

export function rememberMission(mission={},records=[]){
  assertMissionConstitution(mission);
  const snapshot=buildStateSnapshot(records);
  return {
    contract:CONTRACT,
    mission_id:mission.goal?String(mission.goal):null,
    remembered_at:now(),
    mission_state:mission.state??"UNKNOWN",
    snapshot,
    provenance:{source:"CORTEX_MISSION_CONDUCTOR",record_count:snapshot.records.length},
    authority:false,
    live:false
  };
}

export function createOutcomeMemory(outcome={},baseline={},outcomes=[]){
  const measurement=measureOutcome(outcome,baseline);
  const learning=learnFromOutcome(outcome);
  return {
    contract:CONTRACT,
    outcome_id:outcome.id??null,
    measurement,
    learning,
    reusable:learning.state==="LEARNED",
    authority:false,
    live:false
  };
}

export function buildCortexMemoryCycle({mission,records=[],outcome=null,baseline={},outcomes=[]}={}){
  if(!mission) throw new Error("MISSION_REQUIRED");
  const conducted=conductMission(mission);
  assertMissionConstitution(conducted);
  const memory=rememberMission(conducted,records);
  const outcome_memory=outcome?createOutcomeMemory(outcome,baseline,outcomes):null;
  return {
    contract:CONTRACT,
    mission:conducted,
    memory,
    outcome_memory,
    next_state:outcome_memory?.reusable?"REUSE_ELIGIBLE":"OBSERVE_OR_MEASURE",
    truth:"MEMORY != AUTHORITY != LIVE",
    created_at:now()
  };
}

export function assertStateMemoryConstitution(snapshot={}){
  if(snapshot.authority===true) throw new Error("MEMORY_CANNOT_GRANT_AUTHORITY");
  if(snapshot.live===true) throw new Error("MEMORY_CANNOT_CLAIM_LIVE");
  return true;
}
