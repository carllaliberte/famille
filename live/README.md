# ACORN LIVE

Production customer runtime for FAMILLE.

- `GET /healthz` liveness
- `GET /readyz` readiness
- `GET /app` customer portal
- `POST /api/v1/register` account creation
- `POST /api/v1/login` session creation
- `POST /api/v1/requests` authenticated customer intake
- `GET /api/v1/requests` request list
- `GET /api/v1/requests/:id` request + event timeline

Production durable state is PostgreSQL via `DATABASE_URL`. SQLite is an explicit local/test adapter (`ACORN_DB_ADAPTER=sqlite`) and is refused as a silent production fallback.

Passwords use scrypt and sessions use bearer tokens. Tenant isolation is enforced on request, enterprise, and evidence reads.

The runtime uses the existing Acorn customer-service kernel, enterprise state model, evidence registry, and connector execution fabric. It does not invent payment, verification, authority, or LIVE evidence. HTTP availability is not LIVE proof. Requests stop at the existing human/evidence gates until the corresponding real adapter/evidence exists.

Truth states: `CODE_PRESENT` → `LOCAL_RUNNING` → `READY` → `EXTERNALLY_REACHABLE` → `LIVE_MEASURED` → `VERIFIED`. Local process health reports at most `READY`.

Node 22.13+ is required for the built-in SQLite local adapter.
