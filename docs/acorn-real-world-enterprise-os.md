# ACORN — REAL-WORLD ENTERPRISE OPERATING SYSTEM

This runtime is the operational bridge between the existing Acorn cognitive fabric and a real-world enterprise.

## One loop

`INTAKE → UNDERSTAND → DISCOVER → QUALIFY → DESIGN → OFFER → HUMAN AUTHORIZATION → FUNDING EVIDENCE → PLAN → EXECUTE → VERIFY → DELIVER → ACCEPT → SUPPORT → MEASURE VALUE → ASSET → PRODUCT → OFFER → DISTRIBUTION`

The system is provider-neutral and capability-first. Intelligences, tools and connectors are discovered and routed by capability rather than being granted authority.

## Immediate connection model

The live runtime can expose connection and intelligence descriptors through:

- `GET /api/v1/connections`
- `POST /api/v1/connections/measure`
- `GET /api/v1/intelligences`
- `GET /api/v1/enterprise`
- `POST /api/v1/enterprise/cycle`

Render environment variables may provide non-secret descriptors:

- `ACORN_CONNECTIONS` — JSON array of connection descriptors
- `ACORN_INTELLIGENCES` — JSON array of intelligence descriptors

Credentials, API keys and private keys are never stored in these descriptors.

## Money

The OS includes an internal commercial ledger for:

- customer obligations;
- reservations;
- human authorization;
- externally evidenced settlement.

This ledger is **not a wallet, bank account or custody system**. It never moves or holds real funds. Until a real payment rail is connected, monetary records remain internal commercial claims.

A crypto rail adapter is included as a future payment interface. It is deliberately non-custodial and does not hold private keys or transfer assets.

This allows Acorn's economic architecture to be built now without prematurely choosing Stripe, a bank, a blockchain or a token.

## Evidence

No value, payment, delivery or LIVE state is promoted merely because a record exists. External settlement requires provider evidence; delivery requires measured evidence and passing tests.

## Authority

`CAPABILITY !== AUTHORITY`

The runtime may discover, route, plan, measure and execute authorized work. It does not automatically:

- sign contracts;
- spend money;
- transfer funds;
- custody crypto;
- publish commercial offers;
- contact customers;
- merge code.

Carl remains the final human authority.

## Production note

The current Render deployment still uses ephemeral `/tmp` storage until a durable datastore is connected. Render documents that service filesystems are ephemeral by default; managed Postgres, Key Value or a persistent disk are the durable options. See Render documentation before treating the current instance as a permanent production datastore.
