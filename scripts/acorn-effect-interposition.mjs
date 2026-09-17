// ACORN — unified external-effect interposition bridge
// Shared low-level choke point for every governed external effect.
import { capabilityFirewall, interpositionEvent } from './acorn-ai-interposition.mjs';

export const EFFECT_INTERPOSITION_VERSION = 'acorn.effect-interposition.v2';
const DECISIONS = new Set(['ALLOW', 'LIMIT', 'DENY', 'QUARANTINE']);
const OBSERVABILITY = new Set(['NONE', 'PARTIAL', 'INDIRECT', 'DIRECT', 'VERIFIED']);
const CONTROL = new Set(['NONE', 'LIMITED', 'CONDITIONAL', 'DIRECT', 'VERIFIED']);
const REVERSIBILITY = new Set(['REVERSIBLE', 'PARTIAL', 'IRREVERSIBLE', 'UNKNOWN']);

export function authorizeEffectCore({ actor='unknown', capability={}, operation='unknown', risk=0, blastRadius=0, controlGap=null, evidence={}, policy={}, at=new Date().toISOString() }={}) {
  const decision = capabilityFirewall({
    capability: { ...capability, kind: capability.kind || operation, actor, effective: true },
    requestedAuthority: capability.requestedAuthority === true,
    risk, blastRadius, controlGap, evidence, policy,
  });
  const event = interpositionEvent({
    actor,
    capability: decision.capability.id,
    decision: decision.decision,
    reason: decision.reasons,
    before: { operation },
    after: null,
    evidence,
    at,
  });
  const result = {
    version: EFFECT_INTERPOSITION_VERSION,
    allowed: decision.decision === 'ALLOW',
    decision: decision.decision,
    reasons: decision.reasons,
    control_gap: decision.control_gap,
    authority_granted: false,
    event,
    live: false,
    capability_id: decision.capability.id,
    operation,
  };
  assertExternalEffectDecision(result);
  return result;
}

export function interposeExternalEffect(input = {}) {
  const {
    capability_id, kind = 'external.effect', resource = 'unknown', operation = 'unknown',
    provider = 'unknown', context = 'runtime', observability = 'NONE', control = 'NONE',
    reversibility = 'UNKNOWN', epistemic = 'UNKNOWN', evidence = {}, risk = {},
  } = input;

  if (!capability_id) return blocked('MISSING_EFFECT_IDENTITY', capability_id, operation);
  if (!OBSERVABILITY.has(observability)) return blocked('INVALID_OBSERVABILITY', capability_id, operation);
  if (!CONTROL.has(control)) return blocked('INVALID_CONTROL', capability_id, operation);
  if (!REVERSIBILITY.has(reversibility)) return blocked('INVALID_REVERSIBILITY', capability_id, operation);

  const result = authorizeEffectCore({
    actor: input.actor || 'acorn.effect-governor',
    capability: { id: capability_id, kind, resource, provider, context, observability, control, reversibility, epistemic },
    operation,
    evidence: { measured: true, ...evidence },
    risk,
  });
  return { ...result, provider, context, authority_granted: false, live: false };
}

function blocked(reason, capability_id, operation) {
  return { version: EFFECT_INTERPOSITION_VERSION, allowed: false, decision: 'DENY', reasons: [reason], capability_id, operation, authority_granted: false, live: false };
}

export function assertExternalEffectDecision(result) {
  if (!result || !DECISIONS.has(result.decision)) throw new Error('INVALID_INTERPOSITION_DECISION');
  if (result.authority_granted !== false) throw new Error('INTERPOSITION_CANNOT_GRANT_AUTHORITY');
  if (result.live !== false) throw new Error('INTERPOSITION_CANNOT_DECLARE_LIVE');
  if (result.decision === 'ALLOW' && result.allowed !== true) throw new Error('ALLOW_MUST_BE_EXECUTABLE');
  if (result.decision !== 'ALLOW' && result.allowed === true) throw new Error('BLOCKED_DECISION_CANNOT_BE_ALLOWED');
  return true;
}

export function interpositionPolicySummary() {
  return {
    version: EFFECT_INTERPOSITION_VERSION,
    invariant: 'NO_UNGOVERNED_CAPABILITY_PATH',
    decisions: [...DECISIONS],
    authority_granted: false,
    auto_merge: false,
    live: false,
  };
}
