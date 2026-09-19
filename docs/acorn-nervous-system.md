# ACORN Nervous System

Contract: `acorn.nervous-system.v1`

The Nervous System is the transport and feedback organ between the environment and the completed ACORN Brain. It is not a second brain, authority layer, or execution runtime.

## Canonical cycle

WORLD / CONNECTORS → RECEIVE → NORMALIZE → PROVENANCE → ROUTE → DELIVER → BRAIN → OBSERVE → FEEDBACK → MEASURE → RECOVER → REUSE

## Responsibilities

- carry typed signals with provenance and timestamps;
- normalize heterogeneous events before cognition;
- route signals through governed channels;
- keep perception, feedback, observation and action channels distinct;
- require the existing Breaker for consequential action paths;
- expose delivery health, failures and recovery;
- preserve evidence and measurement boundaries;
- keep live/external claims false until physically evidenced by the existing runtime.

## Constitutional boundaries

CAPABILITY ≠ AUTHORITY.

The organ never grants authority, never bypasses the Breaker, never performs hidden learning, and never turns a client-provided `authorized` flag into server authority.

It does not create a second router, second execution runtime, second economy, or second brain.

## Reality boundary

A channel being defined or governed is not proof that an external connector is live. `live:false` remains explicit until the existing connector/runtime path produces dated physical evidence.
