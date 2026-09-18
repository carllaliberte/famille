# ACORN self-build

Coordinator over the existing inventory, tool-resolve protocol, evidence
registry, and constitution. Not a second Cortex, registry, runtime, or
authority.

```
TASK → REQUIRED CAPABILITY → MISSING → GAP DETECTED
     → PROPOSE → DESIGN → BUILD → TEST → FALSIFY
     → MEASURE → VERIFY → REGISTER → USE
```

GAP DETECTED is not CAPABILITY EXISTS.
TEST GENERATED is not TEST PASSED.
READY is not AUTHORIZED.
VERIFIED is not LIVE.
UNKNOWN is first-class.

## What is built now

- First-class `CAPABILITY_GAP`
- Generic self-build loop reusable for code, connectors, capabilities,
  workflows, adapters, tools, models, interfaces, data transforms, projects,
  products, intelligences
- Safe zones: BUILD / TEST / EXPERIMENT / STAGING. PRODUCTION writes are
  HUMAN_HOLD
- Lifecycle without silent skips
- Falsification that may conclude `INSUFFICIENT_EVIDENCE`
- Measurement from observations only
- Qualified registration that still does not grant authority
- Dependency cycle / depth / timeout / resource limits
- Extension admission (`admitExtension`) so a future intelligence, capability,
  connector, or workflow can enter through the existing contract without
  modifying the core
- Customer intake no longer marks a named capability as existing merely because
  it was proposed

## What can now self-build

Acorn can detect a missing capability for a task, propose a design in the BUILD
zone, run a supplied builder/tester if one is provided, falsify, measure, and
register a qualified record. Use still requires human authorization.

A newly admitted extension stays DISCOVERED until it is tested, measured, and
authorized by Carl.

## What is not implemented

- Self-merge
- Self-authorization of critical capabilities
- Automatic production writes
- Invented commercial value or real transactions
- LIVE from local construction
- Connector execution from a newly built adapter without human authorization
- Unbounded recursive builds
- Secret custody
- Constitutional modification

`node scripts/acorn-self-build.mjs` prints an honest snapshot. `live: false`.
`auto_merge: false`. `authority: carl`.

Schema: [`schema/acorn-self-build.v0.json`](../schema/acorn-self-build.v0.json).
Runtime: [`scripts/acorn-self-build.mjs`](../scripts/acorn-self-build.mjs).
