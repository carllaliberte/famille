# ACORN — Continuous Optimization Fabric

## Purpose

Acorn must not merely execute a queue. Its continuous work engine must continuously improve **how it chooses, verifies, measures, recovers, and repeats work**.

This chapter integrates optimization into the existing Continuous Work Engine. It does not create a second Cortex, registry, runtime, authority, or mesh.

## Continuous loop

`OBSERVE → DISCOVER → RANK → RESERVE → EXECUTE → VERIFY → MEASURE → LEARN → RE-RANK → CONTINUE`

A completed recurring task is eligible for a new cycle when it is rediscovered. Successful execution therefore does not silently become the terminal state of continuous development.

## Adaptive work ranking

Priority starts from:

- information gain;
- capability gain;
- risk reduction;
- uncertainty;
- reversibility;
- execution cost.

It is then adjusted by measured execution history:

- observed duration/efficiency;
- recent completion reliability;
- bounded history window.

The resulting optimization record is scheduling evidence, not an intrinsic value judgment about the task.

## Run resilience

Cognitive Run Triage performs bounded retry for explicitly transient infrastructure failures.

- maximum retries are bounded;
- recovered failures are recorded as `RECOVERED`;
- expected/unavailable capabilities remain recorded without escalation;
- human-authority gates remain visible;
- security failures remain visible;
- real regressions remain failing.

This does not disable GitHub notifications. It improves execution-level recovery and prevents known transient conditions from becoming false Acorn incidents.

## Continuous development invariant

The work graph must not converge to:

`COMPLETED → NOTHING LEFT`

when the underlying capability or organism work is inherently recurring.

Instead:

`COMPLETED → OBSERVE AGAIN → RE-MEASURE → RE-RANK → CONTINUE`

## Authority and resource invariants

The optimization fabric preserves:

- `CAPABILITY != AUTHORITY`;
- Carl remains the human authority;
- no auto-merge;
- no automatic external spend;
- no fake LIVE state;
- no unsupported execution claim;
- evidence-backed verification;
- bounded and reversible automation.

## Objective

**Maximize verified capability and information gained per unit of execution cost while minimizing unnecessary human attention and preserving safety, provenance, reversibility, and authority.**

The optimizer may change scheduling and recovery behavior. It may not redefine governance authority.
