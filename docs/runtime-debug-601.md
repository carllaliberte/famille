# Runtime debug #601

Audit marker for the continuous-runtime repair after #600.

The measured failure is that the `Continue autonomous runtime` step was skipped after a successful Codex worker run. This marker is intentionally minimal; the repair must modify the existing execution path rather than add a parallel orchestrator.

Success criteria:
- the continuation decision is observable;
- a successful worker does not silently skip continuation when continuation is authorized;
- HOLD_HUMAN and breaker boundaries remain intact;
- no secrets are created or changed;
- an actual workflow run demonstrates the behavior.
