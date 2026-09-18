# ACORN Real-World Bridge

The bridge is the boundary between Acorn's measured control plane and external systems.

Les certitudes ont une date de fin.

## Configuration

Set `ACORN_REAL_WORLD_CONNECTORS` to a JSON array of connector descriptors. A descriptor contains `id`, `provider`, `base_url`, `effect`, optional `credential_env`, capabilities and timeout.

Secrets are referenced by environment-variable name only. Raw credentials are never stored in the database, evidence records, logs, plans or API responses. Public HTTP results strip `credential`, `credential_env` and raw `output`.

Unsafe connector bases (`http`, loopback, link-local, metadata, raw IPs, non-443) are filtered at load time.

## Execution contract

- Client `human_authorized`, `authorized`, `authority`, `base_url` and `connector_id` never grant authority or scope. Connector lookup is server allowlist only.
- READ connectors may perform GET/HEAD observation when the resolved URL stays on the configured HTTPS origin and path prefix.
- WRITE/MONEY/PUBLISH/SIGN/DELETE/MERGE stay `BLOCKED` unless `grantServerAuthority({actor:"carl"})` is issued in-process. HTTP never issues that grant.
- UNKNOWN stays locked.
- Absolute paths, protocol-relative hosts, `../` escape, redirects, private DNS answers, timeouts and oversized bodies fail closed.
- Idempotency keys replay the stored public result; they do not re-hit the external system.
- An HTTP 200 is `OBSERVED`, dated, with `margin > 0`. It is not VERIFIED and not LIVE.

This is deliberately provider-neutral: new providers enter through configuration and measured capability rather than a hard-coded AI/vendor allowlist.
