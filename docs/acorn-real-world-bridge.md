# ACORN Real-World Bridge

The bridge is the boundary between Acorn's measured control plane and external systems.

## Configuration

Set `ACORN_REAL_WORLD_CONNECTORS` to a JSON array of connector descriptors. A descriptor contains `id`, `provider`, `base_url`, `effect`, optional `credential_env`, capabilities and timeout.

Secrets are referenced by environment-variable name only. Raw credentials are never stored in the database, evidence records, logs, plans or API responses.

## Execution contract

- READ connectors may perform read-only external observation when configured.
- WRITE/MONEY/PUBLISH/SIGN/DELETE/MERGE and other consequential effects require explicit human authorization.
- Every call gets an execution ID and idempotency key.
- External status, output hash and timestamp become dated evidence.
- Failed or missing credentials remain `BLOCKED` / `CREDENTIAL_NOT_CONFIGURED`.
- The bridge never claims an external system is LIVE until a real call is measured.

This is deliberately provider-neutral: new providers enter through configuration and measured capability rather than a hard-coded AI/vendor allowlist.
