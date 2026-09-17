# Compute fabric — Cortex resource, not a second brain

Acorn Cortex already routes **intelligences**. This layer routes **compute**.

```
ACORN CORTEX
    ↓
CAPABILITY ROUTER
    ↓
COMPUTE FABRIC
    ↓
CPU · GPU · HPC · QPU · future accelerator
```

CAPABILITY ≠ AUTHORITY. A machine that is powerful is not thereby in charge.
Carl remains human authority. Secrets stay in the environment. No arbitrary
external write. No auto-spend. No auto-merge. LIVE remains Carl.

This is **not** a 7th chantier, a second Cortex, a new mesh, or a new AI.
Adapters plug into the existing Cortex. A new provider is added by implementing
the adapter contract — the cognitive core does not change.

## Honest states

`DEFINED ≠ DISCOVERED ≠ CONNECTED ≠ MEASURED ≠ EXECUTABLE ≠ VERIFIED ≠ LIVE`

Unmeasured = `UNKNOWN`. Never `READY` / `LIVE` / `AVAILABLE` / `CERTIFIED`
without proof. Adapter exists ≠ provider connected ≠ QPU execution verified.

QPU is a compute resource. Forbidden without a specific measurement:

- quantum advantage
- quantum supremacy
- quantum intelligence
- quantum consciousness

## Simulator-first

When the task allows it:

```
local simulator → managed simulator → real QPU
```

A paid QPU is never called “to test”. Missing credentials, payment, or human
authorization = `HOLD_HUMAN`. Nothing is simulated in place of that hold.

## Runtime

```bash
node scripts/acorn-compute-fabric.mjs
```

Prints the Cortex view of what is actually connected. CPU / local simulator
can execute here. GPU, Braket, IBM stay `DEFINED` / `HOLD_HUMAN` until Carl
puts real credentials in the environment and a measurement succeeds.

Schema: [`schema/compute-fabric.v0.json`](schema/compute-fabric.v0.json).
Adapters: [`scripts/compute-provider-adapters.mjs`](scripts/compute-provider-adapters.mjs).
Fabric: [`scripts/acorn-compute-fabric.mjs`](scripts/acorn-compute-fabric.mjs).

UN GRAND CHANTIER N'EST PAS TERMINÉ PARCE QUE LE CODE EXISTE.
DEFINED ≠ CODE VERIFIED ≠ TEST VERIFIED ≠ EXECUTED ≠ MEASURED ≠ LIVE VERIFIED.
