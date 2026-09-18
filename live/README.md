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
- `GET /api/v1/self-build` self-build constitution, howAcornBuilds transfer contract, autonomy ceiling L2, implemented-now, and not-yet-implemented. Never LIVE.
- `POST /api/v1/self-build/observe` detect capability gaps for a task in the BUILD zone. LEARN records observations and does not promote. Does not write production, merge, or authorize.
- `POST /api/v1/self-build/repair` propose a repair. Never deploys, never merges.
- `GET /api/v1/infrastructure` universal primitive relations, architectural answers, honest truth matrix. Never LIVE.
- `POST /api/v1/infrastructure/diagnose` gap + impact + proposed change + risk + test plan. Never applies protected changes.
- `POST /api/v1/infrastructure/admit` admit an unknown intelligence, rail, machine, or market. Never authorized. HTTP `human_authorized` ignored.
- `POST /api/v1/billing/webhook` Stripe webhook. Raw body, signature verification, event-id idempotence. Unknown events are retained. Never grants Acorn authority.
- `GET /pay/success` and `GET /pay/cancel` return pages. Preview ≠ receipt.
- `GET /api/v1/catalog` server-priced catalog. Clients cannot set amounts.
- `POST /api/v1/orders` accept a server offer. Client amount/currency/paid/human_authorized are ignored.
- `POST /api/v1/checkout` Stripe-hosted Checkout. Amount and currency locked server-side. Checkout created ≠ paid.
- `POST /api/v1/billing/portal` Stripe Customer Portal. Portal is not Acorn authority.
- `POST /api/v1/billing/refund` human authority token only (`x-acorn-human-authority`).
- `POST /api/v1/quotes` and `POST /api/v1/invoices` human hold. AI cannot sign.
- `POST /api/v1/usage` usage-based abstraction. Metered billing is not activated.
- `GET /api/v1/ledger` ASSERTED/OBSERVED/MEASURED/VERIFIED. Missing is not 0. Not tax advice.
- `GET /api/v1/usage-rights` explicit sold rights. Perpetual is a versioned commercial right.
- `GET /api/v1/commercial` and `GET /api/v1/developer` commercial truth and developer surface. Never LIVE.
- `Idempotency-Key` on authenticated POSTs
- Rate limit (default 180/min/IP; `/healthz` and `/readyz` excluded)

Stripe is a replaceable financial rail (`scripts/acorn-stripe-adapter.mjs`). Acorn remains the cognitive, operational, and economic brain. Payment observed ≠ execution authorized. Test Stripe ≠ Stripe Live. `sk_live_` present ≠ Acorn LIVE. CAPABILITY ≠ AUTHORITY. Carl remains human authority.

Production durable state is PostgreSQL via `DATABASE_URL`. Schema is applied by `live/migrate.mjs` from `db/migrations/`, not by ad-hoc CREATE TABLE in route handlers. SQLite is an explicit local/test adapter (`ACORN_DB_ADAPTER=sqlite`) and is refused as a silent production fallback.

Passwords use scrypt and sessions use bearer tokens. Tenant isolation is enforced at the data-access boundary.

The runtime uses the existing Acorn customer-service kernel, enterprise state model, evidence registry, and connector execution fabric. It does not invent payment, verification, authority, or LIVE evidence. HTTP availability is not LIVE proof. Requests stop at the existing human/evidence gates until the corresponding real adapter/evidence exists. `POST /api/v1/runtime/external` cannot mint human authorization.

Health layers: PROCESS, DATABASE, APPLICATION, EXTERNAL. Local process health reports at most READY. `RENDER_EXTERNAL_DEPLOYMENT = NOT_MEASURED` unless independently observed.

Node 22.13+ is required for the built-in SQLite local adapter.
