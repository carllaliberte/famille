#!/usr/bin/env node
/**
 * ACORN — RUNTIME INTERPOSITION BRIDGE
 * The real execution path delegates to the same unified effect choke point used by the governor.
 * This is an internal bridge, not a second runtime or security architecture.
 * NO UNGOVERNED CAPABILITY PATH.
 */
import { authorizeEffectCore } from './acorn-effect-interposition.mjs';

export const RUNTIME_INTERPOSITION_VERSION = "acorn.runtime-interposition.v2";

export function authorizeRuntimeEffect({ actor="unknown", capability={}, operation="unknown", risk=0, blastRadius=0, controlGap=null, evidence={}, policy={}, at=new Date().toISOString() }={}) {
  const result = authorizeEffectCore({ actor, capability, operation, risk, blastRadius, controlGap, evidence, policy, at });
  return { ...result, version: RUNTIME_INTERPOSITION_VERSION, authority_granted:false, live:false };
}

export function assertRuntimeInterposition(result) {
  if (!result || result.authority_granted===true) throw new Error("RUNTIME_INTERPOSITION_AUTHORITY_VIOLATION");
  if (result.allowed && result.decision!=="ALLOW") throw new Error("RUNTIME_INTERPOSITION_DECISION_VIOLATION");
  return true;
}
