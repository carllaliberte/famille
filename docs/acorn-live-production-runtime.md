ACORN LIVE — production runtime hardening

The live API uses PostgreSQL whenever DATABASE_URL is present. SQLite is an explicit local-development/test adapter (`ACORN_DB_ADAPTER=sqlite`). Production (`NODE_ENV=production`) without DATABASE_URL fails closed; it does not silently fall back to SQLite. Production + `ACORN_DB_ADAPTER=sqlite` also fails closed unless `ACORN_ALLOW_SQLITE_IN_PRODUCTION=1` is set for an explicit local proof.

Schema is applied by live/migrate.mjs from db/migrations. The HTTP server does not own ad-hoc CREATE TABLE statements.

Health/readiness distinguish PROCESS / DATABASE / APPLICATION / EXTERNAL. Request bodies are bounded. Responses include baseline security headers and an x-request-id. Authentication, logout, and tenant filtering use the durable database abstraction. Related writes use transactions. SIGTERM closes the database cleanly.

Customer requests persist as the same identity in `requests` and enterprise `acorn_state` (PROJECT). Evidence goes through the existing evidence registry. Connector execution remains BLOCKED without human authorization. HTTP availability is not LIVE proof.

Truth states: CODE_PRESENT, LOCAL_RUNNING, READY, EXTERNALLY_REACHABLE, LIVE_MEASURED, VERIFIED. A local process may report READY. LIVE_MEASURED and VERIFIED require independent current evidence.

Production truth: storage=postgres is required before treating the live customer runtime as durable.
RENDER_EXTERNAL_DEPLOYMENT = NOT_MEASURED from this runtime. render.yaml existence is not a receipt.

Worker: persisted `requests` are ingested into `acorn_jobs`. Stale `RUNNING` rows are requeued. Exhausted retries become `FAILED`. Execute writes run in one transaction. Importing `live/worker.mjs` without `DATABASE_URL` remains fail-closed. This is CODE_PRESENT + local TEST coverage, not a Render EXECUTED proof.
