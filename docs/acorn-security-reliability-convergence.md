# ACORN — Security & Reliability Convergence

Contract: `acorn.security-reliability-convergence.v1`.

This is a provider-neutral policy fabric over the existing Acorn runtime. It does not create a second authority, execution, evidence, payment, or market engine.

## Fail-closed rules
- consequential effects remain human-gated;
- HTTP/client payloads cannot manufacture authority;
- UNKNOWN effects are blocked;
- external connectors require HTTPS and public origins;
- relative connector paths cannot escape their configured origin/prefix;
- execution, measurement, verification and LIVE remain separate states;
- idempotent replay never implies a new external execution;
- stale RUNNING jobs may be requeued;
- secrets/raw external output are never part of public results.

`CAPABILITY != AUTHORITY` and `DEFINED != EXECUTED != MEASURED != VERIFIED != LIVE` remain constitutional boundaries.