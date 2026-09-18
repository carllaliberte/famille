# ACORN Real-World Bridge

The bridge is the boundary between Acorn's measured control plane and external systems.

## Configuration

Set `ACORN_REAL_WORLD_CONNECTORS` to a JSON array of connector descriptors. A descriptor contains `id`, `provider`, `base_url`, `effect`, optional `credential_env`, capabilities and timeout.

Secrets are referenced by environment-variable name only. Raw credentials are never stored in the database, evidence records, logs, plans or API responses. Public HTTP results strip `credential`, `credential_env` and raw `output`.

Unsafe connector bases (`http`, loopback, link-local, metadata, non-443) are filtered at load time.

## Execution contract

- READ connectors may perform read-only external observation when configured. HTTP methods for READ are GET/HEAD only.
- WRITE/MONEY/PUBLISH/SIGN/DELETE/MERGE stay locked unless `human_authorized` is granted in-process. A client payload cannot authorize them. `source==="http"` never grants that flag.
- UNKNOWN stays locked.
- `POST /api/v1/runtime/external` ignores client `human_authorized`, `authorized`, `authority`, `base_url`, `path` as routing, and `method` for consequential effects. HTTP remains untrusted.
- Paths must stay on the connector's public HTTPS origin and prefix. Absolute URLs, protocol-relative URLs, `../` escape, private/loopback/link-local hosts, metadata addresses, private DNS answers, redirects, timeouts and oversized bodies stay fail-closed.
- Every call gets an execution ID and idempotency key. Matching keys replay the stored public result; they do not re-hit the external system.
- External status, output hash and timestamp become dated evidence. HTTP 200 is OBSERVED, not VERIFIED, not LIVE.
- Failed or missing credentials remain `BLOCKED` / `CREDENTIAL_NOT_CONFIGURED`.
- The bridge never claims an external system is LIVE until a real call is independently measured.

This is deliberately provider-neutral: new providers enter through configuration and measured capability rather than a hard-coded AI/vendor allowlist.
