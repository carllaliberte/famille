// ACORN CORTEX — COGNITIVE CONSEQUENCE / RESPONSIBILITY LEDGER
import crypto from 'node:crypto';

export const VERSION = 'acorn.cortex.cognitive-consequence-ledger.v1';
export const STATES = Object.freeze(['PROPOSED','EXECUTED','OBSERVED','MEASURED','VERIFIED','CONTRADICTED','UNKNOWN','EXPIRED']);
export const RELATIONS = Object.freeze(['INTENT','ACTION','EFFECT','CONSEQUENCE','EVIDENCE','CAUSAL_HYPOTHESIS','CAUSAL_RESULT','RETRACTION']);
export const ATTRIBUTION = Object.freeze(['NONE','TRACEABLE','PARTIAL','CORROBORATED','CAUSAL_HYPOTHESIS','CAUSAL_CONFIRMED','UNKNOWN']);

const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function consequenceId(input = {}) {
  return `consequence:${digest({identity:input.identity??null,action:input.action??null,context:input.context??null,timestamp:input.timestamp??null}).slice(0,24)}`;
}

export function createConsequence(input = {}) {
  return Object.freeze({
    id: consequenceId(input), version: VERSION,
    identity: input.identity ?? null,
    capability: input.capability ?? null,
    intent: input.intent ?? null,
    action: input.action ?? null,
    effect: input.effect ?? null,
    consequence: input.consequence ?? null,
    context: input.context ?? null,
    state: input.state ?? 'PROPOSED',
    attribution: input.attribution ?? 'UNKNOWN',
    observability: input.observability ?? 'UNKNOWN',
    control: input.control ?? 'UNKNOWN',
    reversibility: input.reversibility ?? 'UNKNOWN',
    blastRadius: input.blastRadius ?? 'UNKNOWN',
    evidence: Array.isArray(input.evidence) ? [...input.evidence] : [],
    causalClaim: input.causalClaim ?? null,
    authorityGranted: false,
    breakerBypass: false,
    autoMerge: false,
    live: false
  });
}

export function consequenceChain(records = []) {
  return Object.freeze(records.map((record, index) => Object.freeze({
    index,
    relation: RELATIONS[index] ?? 'EVIDENCE',
    id: record.id ?? null,
    state: record.state ?? 'UNKNOWN',
    attribution: record.attribution ?? 'UNKNOWN',
    evidenceCount: Array.isArray(record.evidence) ? record.evidence.length : 0
  })));
}

export function traceabilityGap(record = {}) {
  const missing = [];
  if (!record.identity) missing.push('IDENTITY');
  if (!record.action) missing.push('ACTION');
  if (!record.effect) missing.push('EFFECT');
  if (!record.consequence) missing.push('CONSEQUENCE');
  if (!Array.isArray(record.evidence) || record.evidence.length === 0) missing.push('EVIDENCE');
  if (record.observability === 'NONE' || record.observability === 'UNKNOWN') missing.push('OBSERVABILITY');
  if (record.control === 'NONE' || record.control === 'UNKNOWN') missing.push('CONTROL');
  return Object.freeze({gap: missing.length > 0, missing, score: missing.length});
}

export function causalAssessment({intervention=false,counterfactual=false,replicated=false,independentEvidence=false} = {}) {
  const confirmed = intervention && counterfactual && replicated && independentEvidence;
  return Object.freeze({
    attribution: confirmed ? 'CAUSAL_CONFIRMED' : (intervention || counterfactual ? 'CAUSAL_HYPOTHESIS' : 'UNKNOWN'),
    intervention, counterfactual, replicated, independentEvidence,
    causalConfirmed: confirmed,
    correlationIsNotCausality: true
  });
}

export function responsibilityEvidence({records=[],actor=null,authority=false} = {}) {
  const relevant = records.filter(Boolean);
  const observed = relevant.filter(r => ['OBSERVED','MEASURED','VERIFIED'].includes(r.state)).length;
  const verified = relevant.filter(r => r.state === 'VERIFIED').length;
  const traceable = relevant.filter(r => r.attribution === 'TRACEABLE' || r.attribution === 'CORROBORATED' || r.attribution === 'CAUSAL_CONFIRMED').length;
  return Object.freeze({
    actor, authority, recordCount: relevant.length, observed, verified, traceable,
    responsibilityEvidence: traceable > 0 && observed > 0,
    legalOrMoralBlameAssigned: false,
    authorityGranted: false
  });
}

export function retractConsequence(record = {}, reason = 'UNKNOWN') {
  return Object.freeze({...record, state:'EXPIRED', retracted:true, retractionReason:reason, historyPreserved:true, live:false});
}

export function runConsequenceLedgerCycle(input = {}) {
  const record = createConsequence(input);
  const gap = traceabilityGap(record);
  const causal = causalAssessment(input.causal ?? {});
  const responsibility = responsibilityEvidence({records:[{...record,attribution:causal.attribution,state:record.state}],actor:record.identity,authority:false});
  const result = {
    version: VERSION, record, gap, causal, responsibility,
    chain: consequenceChain([record]),
    authorityGranted:false, sovereigntyGranted:false, breakerBypass:false,
    autoMerge:false, live:false, constitutional:true
  };
  return Object.freeze({...result,digest:digest(result)});
}

export function assertConsequenceLedgerInvariant(result = {}) {
  for (const [key, expected] of [['authorityGranted',false],['sovereigntyGranted',false],['breakerBypass',false],['autoMerge',false],['live',false],['constitutional',true]]) {
    if (result[key] !== expected) throw new Error(`CONSEQUENCE_LEDGER_INVARIANT_FAILED:${key}`);
  }
  if (result.responsibility?.legalOrMoralBlameAssigned !== false) throw new Error('CONSEQUENCE_LEDGER_BLAME_INVARIANT_FAILED');
  if (result.causal?.correlationIsNotCausality !== true) throw new Error('CONSEQUENCE_LEDGER_CAUSALITY_INVARIANT_FAILED');
  return true;
}

export function assertConsequenceLedgerConstitution() {
  return Object.freeze({
    agencyNotResponsibility:true,
    intentNotEffect:true,
    effectNotConsequence:true,
    correlationNotCausality:true,
    provenanceNotBlame:true,
    traceabilityNotAuthority:true,
    historyPreservedOnRetraction:true,
    unknownNotSafe:true,
    carlControlsBreaker:true,
    breakerDoesNotControlCarl:true,
    acornControlsNeither:true,
    authorityNeverGrantedByEvidence:true
  });
}
