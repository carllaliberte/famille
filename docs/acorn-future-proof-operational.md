ACORN — future-proof operationalization (measured)

This document records what this chantier implemented and what it did not claim.

CODE_PRESENT ≠ TESTED ≠ EXECUTED ≠ MEASURED ≠ VERIFIED ≠ LIVE.
CAPABILITY ≠ AUTHORITY. CARL = MERGE.

Implemented now (wired into live runtime, tested locally):
- PostgreSQL production / explicit sqlite adapter (sqlite refused in production unless ACORN_ALLOW_SQLITE_IN_PRODUCTION=1)
- Tenant isolation at the data-access boundary
- Organization persisted on register (acorn_state ORGANIZATION)
- Problem engine: qualify → project → task graph → capability records → intelligence routes → PLAN
- Capability phases: exists / available / authorized / executed / verified (authorized never set by HTTP)
- Intelligence lifecycle: DISCOVERED → QUALIFIED → READY → SELECTABLE, never auto AUTHORIZED
- Unknown intelligence discovery without an allowlist
- Connector lifecycle includes CONFIGURED and DISCONNECTED; configured ≠ connected
- Execution modes PLAN / DRY_RUN / SIMULATION / EXECUTION; simulation does not contaminate reality
- Temporal as-of query; expired evidence is expired, not false
- Economic estimates that refuse PAID/BILLED/LIVE without independent evidence
- Idempotency-Key, rate limit, request/tenant ids in logs
- Customer portal that shows the real state without fake LIVE/CERTIFIED/PAYMENT
- HTTP cannot mint human authorization; WRITE/MONEY/PUBLISH/SIGN/DELETE/MERGE stay BLOCKED on `/api/v1/runtime/external`
- Public-HTTPS same-origin path guard (absolute / private / metadata = URL_OUT_OF_SCOPE)
- Worker requeues stale RUNNING jobs

Foundation only (contract present, full product not shipped):
- Webhooks, M2M auth, marketplace listings, full digital twin, i18n packs in the portal, SDK packaging, learning that changes routing, billing adapters

Future / not claimed:
- Payment capture, LIVE, QKD, quantum, Render receipt

Human hold:
- Merge, secret custody, authorized external effect, auto-merge

RENDER_EXTERNAL_DEPLOYMENT = NOT_MEASURED
EXTERNAL_DEPLOYMENT_EVIDENCE = NOT_OBSERVED
DOCKER_CONTAINER_TEST = NOT_MEASURED unless independently run
