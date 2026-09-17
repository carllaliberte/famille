#!/usr/bin/env node
/**
 * ACORN — RUNTIME INTERPOSITION BRIDGE
 * Makes the AI interposition firewall a property of real execution paths.
 * This is an internal bridge, not a second runtime or security architecture.
 * NO UNGOVERNED CAPABILITY PATH.
 */
import { capabilityFirewall, interpositionEvent } from "./acorn-ai-interposition.mjs";

export const RUNTIME_INTERPOSITION_VERSION = "acorn.runtime-interposition.v1";

export function authorizeRuntimeEffect({ actor="unknown", capability={}, operation="unknown", risk=0, blastRadius=0, controlGap=null, evidence={}, policy={}, at=new Date().toISOString() }={}) {
  const decision = capabilityFirewall({
    capability:{...capability, kind:capability.kind||operation, actor, effective:true},
    requestedAuthority:capability.requestedAuthority===true,
    risk, blastRadius, controlGap, evidence, policy,
  });
  const event = interpositionEvent({ actor, capability:decision.capability.id, decision:decision.decision, reason:decision.reasons, before:{operation}, after:null, evidence, at });
  return { version:RUNTIME_INTERPOSITION_VERSION, allowed:decision.decision==="ALLOW", decision:decision.decision, reasons:decision.reasons, control_gap:decision.control_gap, authority_granted:false, event, live:false };
}

export function assertRuntimeInterposition(result) {
  if (!result || result.authority_granted===true) throw new Error("RUNTIME_INTERPOSITION_AUTHORITY_VIOLATION");
  if (result.allowed && result.decision!=="ALLOW") throw new Error("RUNTIME_INTERPOSITION_DECISION_VIOLATION");
  return true;
}
