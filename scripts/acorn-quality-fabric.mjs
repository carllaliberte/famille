#!/usr/bin/env node
/**
 * ACORN QUALITY FABRIC
 * Cross-cutting quality, provenance, falsification, maintenance and outcome contract.
 * No new authority layer. Reuses Acorn evidence, measurement, execution and governance.
 */
import crypto from "node:crypto";
import { qualityTrace, validateQualityTrace, ACORN_QUALITY_TRACE_VERSION, ACORN_MARK } from "./acorn-quality-trace.mjs";

export const ACORN_QUALITY_FABRIC_VERSION = "acorn.quality-fabric.v1";
export const QUALITY_STATES = Object.freeze(["UNKNOWN","DISCOVERED","DESIGNED","BUILT","TESTED","MEASURED","VERIFIED","LIVE","DEGRADED","EXPIRED","FALSIFIED","HUMAN_HOLD"]);
export const QUALITY_DIMENSIONS = Object.freeze([
  "truth","customer_outcome","human_experience","product_craft","simplicity","first_principles",
  "real_world_execution","platform_leverage","ecosystem","interoperability","developer_enablement",
  "learning","experimentation","operational_excellence","security","resilience","evidence",
  "provenance","adversarial_quality","economic_durability","long_term_durability","failure_recovery",
  "compatibility","maintainability","customer_validation","value_measurement"
]);
export const QUALITY_LIFECYCLE = Object.freeze([
  "INTAKE","ARCHITECT","COMPOSE","BUILD","TEST","FALSIFY","MEASURE","VERIFY","TRACE","OFFER","ORDER",
  "AUTHORIZE","EXECUTE","OBSERVE","VALIDATE","DELIVER","MEASURE_VALUE","MONITOR","DETECT_DRIFT",
  "REMEASURE","REVERIFY","REUSE","RECOMPOSE","LEARN"
]);
export const QUALITY_INVARIANTS = Object.freeze([
  "NO_UNDATED_ASSURANCE","NO_EXPIRY_FREE_QUALITY","NO_QUALITY_TO_AUTHORITY_ESCALATION",
  "NO_BUILDER_ONLY_VERIFICATION","NO_REUSE_WITHOUT_PROVENANCE","NO_COMPOSITION_WITHOUT_COMPATIBILITY",
  "NO_LIVE_FROM_LOCAL_CODE","NO_CUSTOMER_VALUE_WITHOUT_MEASUREMENT","NO_PAYMENT_AS_EXECUTION_PROOF","NO_SELF_MERGE"
]);
const str = (v) => String(v ?? "").trim();
const iso = (v = Date.now()) => new Date(v).toISOString();
const id = (p) => p + "_" + crypto.randomUUID();
const digest = (v) => crypto.createHash("sha256").update(JSON.stringify(v)).digest("hex");

export function qualityStateFromEvidence({executed=false,measured=false,verified=false,live=false,expired=false,falsified=false}={}) {
  if (falsified) return "FALSIFIED";
  if (expired) return "EXPIRED";
  if (live) return "LIVE";
  if (verified) return "VERIFIED";
  if (measured) return "MEASURED";
  if (executed) return "TESTED";
  return "UNKNOWN";
}

export function evidenceFreshness(evidence=[], now=Date.now()) {
  const rows = Array.isArray(evidence) ? evidence : [];
  const normalized = rows.map((e) => {
    const validUntil = e?.valid_until || e?.validUntil || null;
    const expiresAt = validUntil ? Date.parse(validUntil) : NaN;
    const measuredAt = e?.measured_at || e?.measuredAt || null;
    const parsedMeasured = measuredAt ? Date.parse(measuredAt) : NaN;
    return {
      id:str(e?.id)||null,status:str(e?.status)||"UNKNOWN",measured_at:measuredAt,valid_until:validUntil,
      age_ms:Number.isFinite(parsedMeasured) ? Math.max(0,now-parsedMeasured) : null,
      expired:Number.isFinite(expiresAt) && expiresAt <= now
    };
  });
  const current = normalized.filter((e)=>!e.expired && e.valid_until);
  return {total:normalized.length,current:current.length,expired:normalized.filter(e=>e.expired).length,
    missing_expiry:normalized.filter(e=>!e.valid_until).length,
    freshness_ratio:normalized.length ? current.length/normalized.length : 0,rows:normalized};
}

export function createQualityPassport({
  subject={},evidence=[],measurements=[],dimensions={},limitations=[],dependencies=[],rights=[],
  authority="human",source_revision=null,valid_until=null,customer_validation=null,outcome=null,economic=null,status=null,now=Date.now()
}={}) {
  const freshness=evidenceFreshness(evidence,now);
  const dimensionRows=Object.fromEntries(QUALITY_DIMENSIONS.map((name)=>[name,{
    status:dimensions[name]?.status||"UNKNOWN",
    evidence:Array.isArray(dimensions[name]?.evidence)?dimensions[name].evidence:[],
    measured_at:dimensions[name]?.measured_at||null,
    valid_until:dimensions[name]?.valid_until||valid_until||null
  }]));
  const passport={
    id:id("qp"),contract:ACORN_QUALITY_FABRIC_VERSION,mark:ACORN_MARK,
    subject:{id:str(subject.id)||null,type:str(subject.type)||"UNKNOWN",name:str(subject.name)||null,version:str(subject.version)||null},
    source_revision:str(source_revision)||null,status:status||"UNKNOWN",dimensions:dimensionRows,
    evidence:Array.isArray(evidence)?evidence:[],measurements:Array.isArray(measurements)?measurements:[],
    limitations:Array.isArray(limitations)?limitations:[],dependencies:Array.isArray(dependencies)?dependencies:[],
    rights:Array.isArray(rights)?rights:[],customer_validation,outcome,economic,evidence_freshness:freshness,
    authority,auto_merge:false,valid_until,generated_at:iso(now)
  };
  return Object.freeze({...passport,passport_hash:digest(passport)});
}

export function validateQualityPassport(passport={},now=Date.now()) {
  if(passport.contract!==ACORN_QUALITY_FABRIC_VERSION) throw new Error("QUALITY_PASSPORT_CONTRACT_MISMATCH");
  if(passport.mark!==ACORN_MARK) throw new Error("QUALITY_PASSPORT_MARK_REQUIRED");
  if(!passport.subject?.id) throw new Error("QUALITY_PASSPORT_SUBJECT_REQUIRED");
  if(!passport.source_revision) throw new Error("QUALITY_PASSPORT_REVISION_REQUIRED");
  if(!passport.generated_at) throw new Error("QUALITY_PASSPORT_GENERATED_AT_REQUIRED");
  if(!passport.valid_until) throw new Error("QUALITY_PASSPORT_EXPIRY_REQUIRED");
  if(passport.authority!=="human") throw new Error("QUALITY_PASSPORT_AUTHORITY_MUST_REMAIN_HUMAN");
  if(passport.auto_merge===true) throw new Error("QUALITY_PASSPORT_AUTO_MERGE_FORBIDDEN");
  if(["VERIFIED","LIVE"].includes(passport.status)) {
    if(Date.parse(passport.valid_until)<=now) throw new Error("QUALITY_PASSPORT_EXPIRED");
    if(!evidenceFreshness(passport.evidence,now).current) throw new Error("QUALITY_PASSPORT_CURRENT_EVIDENCE_REQUIRED");
  }
  return true;
}

export function buildQualityLineage({nodes=[],edges=[]}={}) {
  const ns=(Array.isArray(nodes)?nodes:[]).map(n=>({id:str(n?.id),type:str(n?.type)||"UNKNOWN",revision:str(n?.revision)||null,provenance:n?.provenance||null,quality_state:n?.quality_state||"UNKNOWN"})).filter(n=>n.id);
  const ids=new Set(ns.map(n=>n.id));
  const es=(Array.isArray(edges)?edges:[]).map(e=>({from:str(e?.from),to:str(e?.to),relation:str(e?.relation)||"DEPENDS_ON",evidence:e?.evidence||null})).filter(e=>ids.has(e.from)&&ids.has(e.to));
  return Object.freeze({contract:"acorn.quality-lineage.v1",nodes:ns,edges:es,
    roots:ns.filter(n=>!es.some(e=>e.to===n.id)).map(n=>n.id),
    leaves:ns.filter(n=>!es.some(e=>e.from===n.id)).map(n=>n.id),
    lineage_hash:digest({ns,es})});
}

export function assessCompositionQuality({components=[],compatibility=[],evidence=[]}={}) {
  const rows=Array.isArray(components)?components:[], cs=Array.isArray(compatibility)?compatibility:[];
  const componentQuality=rows.length>0&&rows.every(c=>["MEASURED","VERIFIED","LIVE"].includes(c?.quality_state));
  const compatible=cs.length>0&&cs.every(c=>c?.compatible===true);
  const provenanceComplete=rows.length>0&&rows.every(c=>c?.provenance);
  const current=evidenceFreshness(evidence).current>0;
  const quality_assured=componentQuality&&compatible&&provenanceComplete&&current;
  const result={contract:"acorn.quality-composition.v1",component_count:rows.length,component_quality:componentQuality,
    compatibility:compatible,provenance_complete:provenanceComplete,current_evidence:current,quality_assured,
    state:quality_assured?"VERIFIED":"HUMAN_HOLD",auto_merge:false,authority:"human"};
  return Object.freeze({...result,composition_hash:digest(result)});
}

export function createFalsificationPlan({claim,builder="unknown",verifier="independent",attack_vectors=[]}={}) {
  return Object.freeze({id:id("falsify"),contract:"acorn.falsification.v1",claim:str(claim)||"UNKNOWN",builder,verifier,
    separation_required:builder!==verifier,
    attack_vectors:Array.isArray(attack_vectors)&&attack_vectors.length?attack_vectors:[
      "invalid-input","boundary-condition","dependency-failure","stale-evidence","authorization-bypass",
      "tenant-isolation","replay","cost-overrun","provider-substitution","real-world-disconnect"
    ],
    sequence:["CLAIM","FALSIFICATION","ATTACK","FAILURE","PATCH","TEST","RETEST","VERIFY"],status:"PROPOSED",authority:"human",auto_merge:false});
}

export function evaluateFalsification({tests=[],failures=[],retests=[]}={}) {
  if(!Array.isArray(tests)||!tests.some(t=>t?.executed===true)) return {status:"INSUFFICIENT_EVIDENCE",verified:false,auto_merge:false,authority:"human"};
  const unresolved=(Array.isArray(failures)?failures:[]).filter(f=>f?.resolved!==true);
  if(unresolved.length) return {status:"FALSIFIED",verified:false,unresolved:unresolved.length,auto_merge:false,authority:"human"};
  if(!Array.isArray(retests)||!retests.length||!retests.every(t=>t?.passed===true)) return {status:"RETEST_REQUIRED",verified:false,auto_merge:false,authority:"human"};
  return {status:"VERIFIED",verified:true,auto_merge:false,authority:"human"};
}

export function assessProviderQuality({samples=[],now=Date.now()}={}) {
  const rows=Array.isArray(samples)?samples:[]; if(!rows.length) return {status:"NOT_MEASURED",sample_count:0,authority:"human",auto_merge:false};
  const success=rows.filter(r=>r?.success===true).length;
  const latency=rows.map(r=>Number(r?.latency_ms)).filter(Number.isFinite).sort((a,b)=>a-b);
  const costs=rows.map(r=>Number(r?.cost)).filter(Number.isFinite);
  return {status:"MEASURED",sample_count:rows.length,success_rate:success/rows.length,failure_rate:1-success/rows.length,
    latency_ms_p50:latency.length?latency[Math.floor((latency.length-1)/2)]:null,cost_total:costs.length?costs.reduce((a,b)=>a+b,0):null,
    capability_match_rate:rows.filter(r=>r?.capability_match===true).length/rows.length,
    evidence_freshness:evidenceFreshness(rows,now).freshness_ratio,authority:"human",auto_merge:false};
}

export function assessCustomerOutcome({objectives=[],measurements=[],validation=null}={}) {
  const obj=Array.isArray(objectives)?objectives:[], ms=Array.isArray(measurements)?measurements:[];
  const measuredCount=obj.filter(o=>ms.some(m=>m?.objective_id===o?.id&&m?.observed===true)).length;
  const validated=validation?.validated===true;
  return {status:obj.length>0&&measuredCount===obj.length&&validated?"VERIFIED":"INSUFFICIENT_EVIDENCE",
    objectives_count:obj.length,objectives_measured:measuredCount,customer_validated:validated,value_measurement_present:ms.length>0,
    authority:"human",auto_merge:false};
}

export function assessEconomicQuality({estimate={},actual={},value={}}={}) {
  const ec=Number(estimate.cost),ac=Number(actual.cost),rv=Number(value.realized);
  const costKnown=Number.isFinite(ec)&&Number.isFinite(ac),valueKnown=Number.isFinite(rv);
  return {status:costKnown&&valueKnown?"MEASURED":"INSUFFICIENT_EVIDENCE",estimated_cost:costKnown?ec:null,actual_cost:costKnown?ac:null,
    realized_value:valueKnown?rv:null,variance:costKnown?ac-ec:null,value_minus_cost:costKnown&&valueKnown?rv-ac:null,authority:"human",auto_merge:false};
}

export function detectQualityDrift({passport,current_revision,current_evidence=[],now=Date.now()}={}) {
  const reasons=[];
  if(!passport) reasons.push("PASSPORT_MISSING");
  if(passport?.source_revision&&current_revision&&passport.source_revision!==current_revision) reasons.push("SOURCE_REVISION_CHANGED");
  const f=evidenceFreshness(current_evidence,now);
  if(f.expired>0) reasons.push("EVIDENCE_EXPIRED");
  if(f.missing_expiry>0) reasons.push("EVIDENCE_EXPIRY_MISSING");
  return {drift:reasons.length>0,reasons,state:reasons.length?"DEGRADED":"CURRENT",
    next:reasons.length?"REMEASURE_REVERIFY":"CONTINUE_MONITORING",auto_merge:false,authority:"human"};
}

export function proposeSelfRepair({drift,alternatives=[],simulation=null}={}) {
  if(!drift?.drift) return {status:"NO_REPAIR_REQUIRED",authority:"human",auto_merge:false};
  const candidate=Array.isArray(alternatives)?alternatives.find(a=>a?.compatible===true&&a?.quality_state!=="FALSIFIED"):null;
  if(!candidate) return {status:"HUMAN_HOLD",reason:"NO_VERIFIED_ALTERNATIVE",authority:"human",auto_merge:false};
  if(simulation?.passed!==true) return {status:"HUMAN_HOLD",reason:"SIMULATION_REQUIRED",candidate:candidate.id,authority:"human",auto_merge:false};
  return {status:"REPAIR_PROPOSED",candidate:candidate.id,
    sequence:["DIAGNOSE","SELECT_ALTERNATIVE","SIMULATE","TEST","FALSIFY","MEASURE","VERIFY","HUMAN_AUTHORIZE"],
    authority:"human",auto_merge:false};
}

export function createQualityEvent({subject_id,event,before=null,after=null,evidence=[],actor="acorn"}={}) {
  const payload={id:id("qe"),contract:"acorn.quality-event.v1",subject_id:str(subject_id)||null,event:str(event)||"UNKNOWN",actor,before,after,evidence,
    measured_at:iso(),authority:"human",auto_merge:false};
  return Object.freeze({...payload,event_hash:digest(payload)});
}

export function createQualityAssessment(input={}) {
  const passport=createQualityPassport(input);
  const trace=qualityTrace({
    project_id:input.subject?.id,project_name:input.subject?.name,project_version:input.subject?.version,
    source_revision:input.source_revision,valid_until:input.valid_until,
    gates:{truth_contract:input.dimensions?.truth?.status==="VERIFIED",tests:input.tests_passed===true,
      security:input.security_verified===true,provenance:Boolean(input.source_revision),human_authority:input.authority==="human"||input.authority==null},
    evidence:input.evidence
  });
  validateQualityTrace(trace); validateQualityPassport(passport);
  return Object.freeze({contract:ACORN_QUALITY_FABRIC_VERSION,passport,trace,
    quality_assured:QUALITY_DIMENSIONS.every(d=>["MEASURED","VERIFIED"].includes(passport.dimensions[d].status)),
    mark:ACORN_MARK,authority:"human",auto_merge:false});
}

if(import.meta.url==="file://"+process.argv[1]) console.log(JSON.stringify({
  version:ACORN_QUALITY_FABRIC_VERSION,dimensions:QUALITY_DIMENSIONS,lifecycle:QUALITY_LIFECYCLE,invariants:QUALITY_INVARIANTS,
  trace_contract:ACORN_QUALITY_TRACE_VERSION
},null,2));
