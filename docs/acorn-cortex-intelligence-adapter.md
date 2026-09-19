# Acorn Cortex — Intelligence Adapter & Capability Routing

Contract: `acorn.cortex-intelligence-adapter.v1`

This fabric gives Cortex a provider-neutral way to discover, qualify and route any intelligence by capability.

## Contract

`intelligenceAdapter()` normalizes an intelligence into a capability-bearing participant without granting authority.

`qualifyIntelligence()` qualifies an intelligence from requested capabilities and available evidence.

`routeByCapability()` discovers all currently qualified candidates for a capability.

`selectRoute()` records a selected candidate but still requires authorization.

`buildAdaptiveIntelligenceGraph()` exposes the current capability graph without a fixed provider allowlist.

## Constitutional boundary

- CAPABILITY ≠ AUTHORITY.
- Provider identity is metadata, not a privileged class.
- Future providers can be represented without code changes to a provider allowlist.
- Routing does not authorize.
- Selection does not execute.
- No Breaker access.
- No automatic consequential execution.
- Evidence remains separate from assertion.
- External effects remain behind the existing governed execution/effect boundary.

This is an adapter and routing fabric, not a second Cortex runtime.
