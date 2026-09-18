# ACORN Cognitive Run Triage

The Continuous Work Engine may execute automatically on GitHub Actions. A red run is not automatically a human incident.

## Policy

- SUCCESS: record only.
- EXPECTED_FAILURE: record only.
- TRANSIENT_FAILURE: retry/recover, then record.
- RECOVERED: record only.
- REAL_REGRESSION: escalate.
- WAITING_HUMAN: escalate.
- SECURITY: escalate.

This does **not** disable GitHub notifications. It changes which automation outcomes are allowed to fail the workflow. Genuine regressions, authority gates, and security events remain visible.

The CLI and both continuous-work steps (`Verify continuous engine contracts`, `Run continuous organism work engine`) exit non-zero when `notify` is true: `REAL_REGRESSION`, `WAITING_HUMAN`, and `SECURITY`. A bare `HOLD` is a human gate, not an expected failure. `HOLD_HUMAN` stays `WAITING_HUMAN`.

Evidence is preserved in the existing continuous-work state/history. No second Cortex, registry, runtime, or authority is introduced.
