# ACORN — SELF OPTIMIZATION

Les certitudes ont une date de fin.

Acorn must be able to determine whether a change is good **for Acorn's declared objectives**, rather than optimizing blindly. This file describes a rail. It is not a receipt. It is not LIVE.

## Closed learning loop

OBSERVE → MEASURE → SCORE → PROPOSE → AUTHORIZE → CHANGE → MEASURE → COMPARE → LEARN → REUSE.

These are functions. They are not a live run. `authorizeOptimization` reads `requires_human_authorization`. `applyOptimization` poses `APPLIED_IN_MEMORY` only after a human authorize. It does not execute, spend, merge, or sign.

"Good" is explicit and multi-objective: customer value, reliability, quality, latency, cost efficiency, reuse, revenue, risk reduction and learning rate.

Acorn does not infer that a change is good merely because it is newer, larger, cheaper, faster, or more autonomous. It requires evidence against declared objectives and records the outcome.

`compareOutcomes` writes `delta` from observed before/after. `scoreOptimization` reads that `delta`. A missing value stays DEFINED. It does not become MEASURED with score 0 or NaN.

## Constitutional boundary

Self-optimization is not self-authority. The engine cannot merge, spend, sign, transfer authority, or touch the Breaker. Proposals remain proposals until a human authorizes. `assertSelfOptimizationConstitution` without a snapshot throws. Flags are not optional.

## Completeness

DEFINED ≠ CODE VERIFIED ≠ TEST VERIFIED ≠ EXECUTED ≠ MEASURED ≠ LIVE VERIFIED.

Local tests exercise the rail. They are not EXECUTED in production. They are not a live measure. Carl = MERGE.

Carte juge / epsilon / horizon absents sur ce geste → MODE classique. Pas comblé.

FILE.md daté 2026-09-14 reste périmé. Pas de PR FILE tant que #1003 n'est pas mergée.

## Parabolic effect

Successful measured improvements become reusable hypotheses. Reuse is not truth. It still requires measurement. An unmeasured hypothesis is not LIVE VERIFIED.
