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

State is persisted in SQLite. Passwords use scrypt and sessions use bearer tokens.

The runtime uses the existing Acorn customer-service kernel. It does not invent payment, verification, authority, or LIVE evidence. Requests stop at the existing human/evidence gates until the corresponding real adapter/evidence exists.

Node 22.13+ is required for the built-in SQLite runtime.
