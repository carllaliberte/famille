# ACORN SELF-AUDITING SYSTEM

Contract: `acorn.self-auditing-system.v1`

## Purpose

This is the runtime audit organ for Acorn. It inventories the repository as it actually exists and turns structural observations into explicit, re-auditable gaps.

It does **not** infer that an architecture declaration is implemented, does **not** convert tests into LIVE proof, and does **not** decide that Acorn is complete.

## Audit chain

`INVENTORY → CORRELATE → CHECK TESTS → CHECK GOVERNANCE → COMPOSE MEASURED CONVERGENCE → CLASSIFY GAPS → REAUDIT`

The audit reads:

- architecture declarations under `docs/architecture`;
- Acorn runtime modules under `scripts/`;
- test files under `test/` and `tests/`;
- GitHub Actions workflows under `.github/workflows/`;
- versioned Acorn contracts and detectable constitution boundaries.

## What it can establish

The result is a **structural repository audit**. It can establish that files, contracts, test references, workflows and governance signals are present or absent at audit time.

It cannot establish:

- physical external connectivity;
- LIVE reality;
- deployment execution;
- real customer usage;
- economic success;
- universal optimality;
- correctness beyond the evidence actually supplied.

Those remain explicit gaps.

## Gap classes

- `IMPLEMENTATION`
- `INTEGRATION`
- `CONTRACT`
- `TESTS`
- `GOVERNANCE`
- `CI`
- `TEST_DISCOVERY`

Actions are generated from observed gap classes. No arbitrary completion percentage or global optimum is invented.

## Constitutional boundary

The audit is read-only with respect to the repository. It returns:

- `authority:false`
- `auto_authorize:false`
- `auto_execute:false`
- `live:false`

Any future action must pass through the existing governance, Breaker and human authorization paths.

## Relationship to measured convergence

`acorn-self-auditing-system.v1` composes `acorn.measured-global-convergence.v1`.

Measured convergence answers “which declared dimensions have evidence?”. Self-auditing adds repository-level correlation: architecture ↔ runtime ↔ tests ↔ workflows ↔ governance.

The output is deliberately open-ended: `CLOSE_MEASURED_GAPS` or `REOBSERVE_SYSTEM`, never “finished forever”.
