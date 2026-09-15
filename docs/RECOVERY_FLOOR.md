# ACORN — Recovery Floor

## Immutable recovery point

**Recovery commit:** `97d49341ae4ccbd630fe4b88cca1139d40408e66`

**Recovery branch:** `codex/recovery-floor`

This point records the highest verified project state at the moment this recovery floor was established.

## Non-regression law

> **Acorn must never knowingly regress below this recovery floor.**

A future change may increase capability, but it must remain above this floor in Git history and preserve the governing invariants.

The floor protects at minimum:

- human sovereignty;
- Carl Laliberté as creator, architect and final authority;
- Global Breaker as an absolute gate, never bypassed by AI or automation;
- `auto_merge=false`;
- no production writes or LIVE authority without explicit governance;
- provenance and measurable evidence;
- `DEFINED ≠ EXECUTED ≠ SUCCEEDED ≠ VERIFIED ≠ LIVE`;
- the existing architecture is repaired before it is replaced.

## Enforcement

The recovery point is enforced as a Git ancestry floor. A protected worker must refuse to execute from a commit that is not a descendant of the recovery commit.

This is deliberately a **floor, not a ceiling**: Acorn may evolve beyond it. It must not silently fall below it.

If a regression is suspected, compare the current state with the recovery commit before changing architecture.
