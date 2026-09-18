# ACORN self-build

Coordinator over the existing inventory, tool-resolve protocol, evidence
registry, and constitution. Not a second Cortex, registry, runtime, or
authority.

```
OBSERVE → UNDERSTAND → DETECT_GAP → PROPOSE → DESIGN
       → BUILD → TEST → FALSIFY → MEASURE → VERIFY
       → REGISTER → USE → LEARN
```

GAP DETECTED is not CAPABILITY EXISTS.
TEST GENERATED is not TEST PASSED.
READY is not AUTHORIZED.
VERIFIED is not LIVE.
LEARN is not PROMOTE.
PRODUCT CANDIDATE is not PRODUCT.
UNKNOWN is first-class.

Autonomy:

```
L0 OBSERVE
L1 PROPOSE
L2 BUILD IN SANDBOX     ← ceiling without Carl
L3 TEST
L4 MEASURE
L5 PREPARE DEPLOYMENT   ← HUMAN_HOLD
L6 EXECUTE AUTHORIZED   ← HUMAN_HOLD
L7 HUMAN APPROVAL       ← Carl
```

Operational autonomy may rise inside the sandbox. Authority never
self-increases. `escalateAutonomy` without Carl returns HUMAN_HOLD.

## How Acorn builds (transfer contract)

A future intelligence continues by calling explicit functions, not by
imitating this environment.

1. understand — `selfBuildConstitution`, `howAcornBuilds`
2. discover — `catalogTools`, `capabilityGap`, `admitExtension`
3. detect gap — `detectGaps`
4. design — `proposeBuild`
5. build — `runSelfBuildLoop` with a builder in the BUILD zone
6. test — supplied tester
7. falsify — `falsifyCapability` (INSUFFICIENT_EVIDENCE is valid)
8. measure — `measureCapability` (observations only)
9. evidence — existing `registerEvidence`
10. register — `registerQualified` (still unauthorized)
11. use — only after Carl; READY ≠ AUTHORIZED
12. limits — `shouldStop`, `assertAutonomy`, `notYetImplemented`
13. again — `learnFromLoop` records, never promotes

Copy [`examples/self-build-extension.mjs`](../examples/self-build-extension.mjs)
to admit a new intelligence, capability, connector, or workflow without
editing the core.

HTTP: `GET /api/v1/self-build`, `POST /api/v1/self-build/observe`,
`POST /api/v1/self-build/repair` (propose only, never deploy).

## What is built now

- First-class `CAPABILITY_GAP`
- Generic self-build loop, including LEARN
- Safe zones: BUILD / TEST / EXPERIMENT / STAGING. PRODUCTION writes are
  HUMAN_HOLD
- Lifecycle without silent skips
- Falsification that may conclude `INSUFFICIENT_EVIDENCE`
- Measurement from observations only
- Qualified registration that still does not grant authority
- Dependency cycle / depth / timeout / resource limits
- Extension admission without modifying the core
- Autonomy levels L0–L7 with no self-escalation
- Repair and improvement proposals that cannot deploy or silently replace
- Product candidate records that are not products
- Customer intake no longer marks a named capability as existing merely
  because it was proposed

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
- L6/L7 remaining Carl

`node scripts/acorn-self-build.mjs` prints an honest snapshot. `live: false`.
`auto_merge: false`. `authority: carl`.

Schema: [`schema/acorn-self-build.v0.json`](../schema/acorn-self-build.v0.json).
Runtime: [`scripts/acorn-self-build.mjs`](../scripts/acorn-self-build.mjs).
