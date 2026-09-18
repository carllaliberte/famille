# ACORN — OPERATIONAL MEMORY CORTEX

Les certitudes ont une date de fin.

This file describes a local rail. It is not a receipt. It is not LIVE. It is not `claim.v0`.

Acorn records what happened, what was observed, what resulted, what it cost and what evidence tokens support it.

## Flow

EPISODE → EVIDENCE → LESSON → VALIDATION → CONSOLIDATION → RECALL → NEW ACTION → OUTCOME.

These are functions. They are not a live run. `validateLesson` is a local gate. It does not execute, spend, merge, or sign.

Memory is operational, not merely archival. Relevant locally gated lessons can be recalled when a future goal shares tokens with a prior episode. Expiry is explicit.

## Evidence gate

`validateLesson` stays `PROVISIONAL` unless evidence tokens and an actor are present. Empty string, empty object, or an empty array throw `EVIDENCE_REQUIRED`. An `EXPIRED` row cannot be re-validated.

A local `VERIFIED` state is still not EXECUTED, not MEASURED, not LIVE VERIFIED.

The object `id` is FNV-1a 32 (`id_algo: fnv1a-32`). That fingerprint is not SHA-256 and not `claim.v0` `evidence_hash`. LU still needs the hash of the content actually read. This rail does not mint that hash. It does not verify a mesure JSON satellite.

## Recall

Recall is token overlap on the goal, not `String.includes`. `"net"` does not hit `"build network"`. Each result copies persisted provenance (`actor`, `source_episode`, `evidence_count`, `id_algo`). Expired rows are skipped.

## Constitutional boundary

The memory cortex does not silently learn or acquire authority. `assertOperationalMemoryConstitution` without a snapshot throws. Flags are not optional. Human governance remains outside the memory mechanism.

## Completeness

DEFINED ≠ CODE VERIFIED ≠ TEST VERIFIED ≠ EXECUTED ≠ MEASURED ≠ LIVE VERIFIED.

Local tests exercise the rail. They are not EXECUTED in production. They are not a live measure. CI is a path-filtered `pull_request` + `workflow_dispatch`. Cron */30 removed. Actions cost is not a LIVE proof. Carl = MERGE.

Carte juge / epsilon / horizon / témoin absents sur ce geste → MODE classique. Pas comblé.

FILE.md daté 2026-09-14 reste périmé. Pas de PR FILE tant que #1009 n'est pas mergée.
