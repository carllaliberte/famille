# Acorn Cortex — State & Memory Fabric

## Purpose
This block gives the Cortex a temporal, provenance-first memory surface around the current mission conductor.

It does four things:
1. records dated state observations with validity windows;
2. builds snapshots without silently promoting stale state;
3. exposes contradictions instead of resolving them by assertion;
4. converts measured + verified outcomes into explicitly reusable memory.

## Contract
`acorn.cortex-state-memory-fabric.v1`

## Truth boundaries
- observation != truth forever
- current != permanent
- memory != authority
- memory != LIVE
- measurement != verification
- verification is required before outcome reuse
- conflict is surfaced, not silently overwritten

The fabric does not grant authority, touch the Breaker, perform consequential effects, or claim external-world LIVE state.

## Integration
The memory cycle consumes the current Cortex Mission Conductor and Universal Outcome Learning Fabric. It is therefore a continuation of the existing Cortex architecture, not a second runtime.

## Next physical boundary
This module is deliberately an explicit memory contract first. Durable external persistence remains a separate execution/infrastructure concern and must not be inferred from this in-memory fabric.
