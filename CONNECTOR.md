# Connector AI / Flux — informational membrane, not a second brain

Acorn already has a Cortex, a compute fabric, a capability registry, a swarm,
an AI connector, and an effect interposition firewall. This layer is the
**mandatory informational membrane** those pieces already implied.

It is **NOT** [`schema/flux.v0.json`](schema/flux.v0.json) (juge satellite
pipeline). It is **NOT** [FLUX.md](FLUX.md). Those rails stay untouched.

```
EXTERNAL WORLD
      │
      ▼
CONNECTOR AI / FLUX     ← this contract
      │
      ▼
ACORN CORTEX
      ├── Cognitive Runtime
      ├── Global Capability Registry
      ├── Compute Fabric
      └── Swarm
      │
      ▼
CONNECTOR AI / FLUX
      │
      ▼
EXTERNAL WORLD
```

```
NO DIRECT DATA PATH TO ACORN
NO DIRECT ACORN PATH TO THE EXTERNAL WORLD
UNKNOWN ≠ MALICIOUS
UNKNOWN ≠ TRUSTED
CAPABILITY ≠ AUTHORITY
DEFINED ≠ EXECUTED · ADAPTER ≠ CONNECTION ≠ PROVEN
```

CARL → BREAKER (human only) → CONNECTOR → CORTEX → FABRIC / REGISTRY / SWARM

The Breaker is not a capability, not a resource, not a provider. It cannot be
discovered, optimized, replaced, or reassigned by this membrane.

## Honest states

`RECEIVED` `IDENTIFIED` `AUTHENTICATED` `CLASSIFIED` `ADMITTED`
`QUARANTINED` `REJECTED` `BLOCKED` `MEASURED` `VERIFIED` `EXPIRED`
`REVOKED` `HOLD_HUMAN` `FAILED` `UNKNOWN`

Forbidden without proof: `LIVE` `READY` `CERTIFIED` `QUANTUM_READY`.

A known provider, a known cloud, or a known model is never trusted by default.

## Pipeline

Ingress: `RECEIVED → IDENTIFIED → AUTHENTICATED → INTEGRITY → FORMAT →
SIZE/RATE → CLASSIFIED → PROVENANCE → POLICY → THREAT → TRUST →
ADMIT | QUARANTINE | REJECT`

Egress: destination, identity, authorization, data type, sensitivity, policy,
provenance, action, risk, audit. Forbidden outputs are blocked, not logged as
success.

FAST PATH: identity, integrity, session, policy, known provenance, known
classification, limits, authorization.

DEEP PATH: unknown capabilities, anomalies, new sources, threat analysis.
Heavy work runs in parallel. Healthy flux is not punished. Security is never
traded for milliseconds.

Trust, when granted, is **temporary, contextual, revocable, measurable**.
Never permanent by default.

## Reuse

This membrane reuses:

- [`.github/swarm/ai-connector.mjs`](.github/swarm/ai-connector.mjs) — AI ingress
- [`scripts/acorn-effect-interposition.mjs`](scripts/acorn-effect-interposition.mjs) — external-effect choke point
- [`scripts/acorn-compute-fabric.mjs`](scripts/acorn-compute-fabric.mjs) — local proof execution

It does not invent a second registry, a second router, or a second organism.

## Runtime

```bash
node scripts/acorn-connector-flux.mjs
```

Prints an honest Cortex view: local frame admitted, unknown quarantined
(not malicious), bypass denied, secret egress blocked, paid spend held,
breaker denied, local compute measured through the membrane. No LIVE badge.

Schema: [`schema/connector-flux.v0.json`](schema/connector-flux.v0.json).
Contract: [`scripts/acorn-connector-flux.mjs`](scripts/acorn-connector-flux.mjs).

`MERGE = CARL` · `AUTO_MERGE = FALSE` · `MAIN = REALITY`

UN GRAND CHANTIER N'EST PAS TERMINÉ PARCE QUE LE CODE EXISTE.
DEFINED ≠ CODE VERIFIED ≠ TEST VERIFIED ≠ EXECUTED ≠ MEASURED ≠ LIVE VERIFIED.
