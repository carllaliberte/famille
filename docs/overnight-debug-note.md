# Overnight workflow debug note

Measured run: `34927054028` on 2026-09-15.

- The Global Breaker gate reported `OFF`.
- `overnight-orchestrator.mjs` correctly refused execution with `GLOBAL_BREAKER_OFF`.
- The workflow then launched all eight slots because slots 2–8 used `always()`, creating eight duplicate failures from one blocked authorization state.
- The Breaker is intentionally untouched: it remains human-controlled by Carl.

Fix: remove the downstream `always()` conditions so a failed/blocked slot stops the chain instead of cascading identical failures.
