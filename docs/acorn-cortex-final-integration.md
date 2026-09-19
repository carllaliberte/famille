# ACORN — Cortex Final Integration

## Purpose

This is the canonical orchestration boundary for the Cortex. It composes the existing intelligence, capability, mission, state/memory, action/outcome and learning fabrics into one bounded cognitive cycle.

It does **not** create a second runtime, second authority layer, second Breaker, or second learning system.

## Canonical cycle

PERCEIVE → CONTEXTUALIZE → REMEMBER → DISCOVER → COMPOSE → PLAN → AUTHORIZE → ACT → OBSERVE → MEASURE → VERIFY → LEARN → OPTIMIZE → REUSE → REOBSERVE

### Perceive
External or internal signals become dated, provenance-bearing state records.

### Contextualize
State is combined with mission context and constraints. Conflicts remain explicit; Cortex does not silently select a winner.

### Remember
The existing State & Memory Fabric stores a temporal snapshot. Memory never grants authority or LIVE status.

### Discover / Compose / Plan
The existing Intelligence Adapter, Capability Composition and Mission Conductor select provider-neutral capabilities and form a bounded plan.

### Authorize / Act
Authorization remains an explicit human-controlled boundary. The integration can trace authorization and execution intent, but it cannot grant authority or perform consequential external effects by itself.

### Observe / Measure / Verify
Outcomes require evidence. Measurement and verification are distinct. Unverified observations cannot become learning.

### Learn / Optimize / Reuse
The existing Universal Outcome Learning Fabric produces candidate capability/route/project updates only from measured, verified evidence. Optimization changes candidates and routing, never authority.

### Reobserve
Reuse feeds the next observation cycle rather than becoming permanent truth.

## Closure criteria

The Cortex integration is considered architecturally complete when this contract is present on main, its targeted tests pass in CI, and the remaining required world-facing execution paths are connected through the existing governed execution/effect fabrics rather than invented inside Cortex.

A passing unit test is not LIVE proof.

## Non-goals

- no automatic consequential execution;
- no automatic merge;
- no automatic spending/signing/contracting/custody;
- no Breaker bypass;
- no provider allowlist;
- no hidden memory;
- no silent conflict resolution;
- no claim of LIVE connectivity without physical evidence.

## Extension rule

Future intelligences, tools, connectors and organs plug into the canonical cycle through capability/provenance contracts. They do not create parallel Cortex loops.
