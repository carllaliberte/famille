# ACORN Cortex Mission Conductor

Contract: `acorn.cortex-mission-conductor.v1`

The Mission Conductor is the integration point for the current Cortex primitives:

1. normalize and qualify available intelligences;
2. build the provider-neutral intelligence graph;
3. compose a team from required capabilities;
4. build a cognitive plan;
5. optionally create a bounded action request and execution trace;
6. keep authority, Breaker access, and consequential external effects outside the conductor.

The conductor does not execute consequential actions. Authorization remains explicit and human-governed.

### Truth boundary

- discovery is not availability;
- qualification is not authority;
- composition is not execution;
- a plan is not a result;
- observation is not measurement;
- measurement without verification is not learning;
- learning never changes authority.

### Provider neutrality

Participants are normalized through the Intelligence Adapter. No fixed provider allowlist is introduced. New intelligences can participate when they expose capabilities and sufficient evidence.

### Integration contract

`conductMission()` returns a complete traceable proposal containing the intelligence graph, capability composition, selected team, cognitive plan, and optional action/execution trace.

All returned structures explicitly preserve:

- `authority:false`
- `breaker_touched:false`
- `external_effect:false`
- explicit authorization requirement.

This is the Cortex integration seam; it does not claim that external-world connectivity is LIVE merely because a plan exists.
