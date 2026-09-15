# ACORN — Recovery Points

## Construction law

**Every verified construction step creates a recovery point.**

A recovery point is the last state that has been measured and accepted as a safe construction baseline.

## Bug law

When a bug or regression is detected:

1. Stop extending the regressed state.
2. Read `.acorn/recovery-point.json`.
3. Start the repair from its `recovery_sha`.
4. Reproduce the bug from that baseline.
5. Apply the smallest necessary correction.
6. Run the relevant tests and measurements.
7. Only after verification is the new state eligible to become the next recovery point.

Do **not** use the broken HEAD as the repair baseline merely because it is newer.

## State rule

A recovery point means **verified construction state**, not merely a commit that exists.

`COMMIT EXISTS ≠ RECOVERY POINT`

A point becomes the next recovery point only after the construction step has been measured and verified.

## Sovereignty

Recovery points do not change Acorn authority:

- Carl Laliberté remains creator, architect and final authority.
- The Global Breaker remains untouched and absolute.
- AI does not merge or self-authorize.
- `auto_merge=false` remains enforced.
- LIVE and production authority remain separate from construction.

## Current point

The current recorded recovery point is the verified main commit stored in `.acorn/recovery-point.json`.

The existing `scripts/recovery-floor.mjs` remains the absolute historical floor. The recovery point is the **latest operational construction baseline** above that floor.
