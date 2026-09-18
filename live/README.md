# ACORN LIVE

Production customer runtime for FAMILLE.

- `GET /healthz` process + database health. Not LIVE proof.
- `GET /readyz` readiness. 503 if the database is unavailable.
- `GET /app` customer portal
- `POST /api/v1/register` account creation (also persists an ORGANIZATION)
- `POST /api/v1/login` session creation
- `POST /api/v1/logout` session revocation
- `POST /api/v1/requests` authenticated customer intake → qualification, project, task graph, capability records, intelligence routes, estimated economics. Stops at human authorization.
- `GET /api/v1/requests` request list
- `GET /api/v1/requests/:id` request + tasks + capabilities + evidence + events
- `POST /api/v1/intelligences/discover` persist an unknown intelligence as DISCOVERED/QUALIFIED, never authorized
- `POST /api/v1/runtime/simulate` simulation realm (does not contaminate reality)
- `POST /api/v1/runtime/dry-run` dry run
- `GET /api/v1/as-of?at=` tenant snapshot at a timestamp
- `GET /api/v1/capabilities` capability catalog for the tenant (exists/available ≠ authorized)
- `GET /api/v1/economy` estimated records only; never BILLED/PAID/LIVE
- `GET /api/v1/future-proof` contract that named futures are not architecturally blocked
- `Idempotency-Key` on authenticated POSTs
- Rate limit (default 180/min/IP; `/healthz` and `/readyz` excluded)

Production durable state is PostgreSQL via `DATABASE_URL`. Schema is applied by `live/migrate.mjs` from `db/migrations/`, not by ad-hoc CREATE TABLE in route handlers. SQLite is an explicit local/test adapter (`ACORN_DB_ADAPTER=sqlite`) and is refused as a silent production fallback.

Passwords use scrypt and sessions use bearer tokens. Tenant isolation is enforced at the data-access boundary.

The runtime uses the existing Acorn customer-service kernel, enterprise state model, evidence registry, and connector execution fabric. It does not invent payment, verification, authority, or LIVE evidence. HTTP availability is not LIVE proof. Requests stop at the existing human/evidence gates until the corresponding real adapter/evidence exists. `POST /api/v1/runtime/external` cannot mint human authorization.

Health layers: PROCESS, DATABASE, APPLICATION, EXTERNAL. Local process health reports at most READY. `RENDER_EXTERNAL_DEPLOYMENT = NOT_MEASURED` unless independently observed.

Node 22.13+ is required for the built-in SQLite local adapter.
