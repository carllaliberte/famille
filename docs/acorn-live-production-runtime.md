ACORN LIVE — production runtime hardening

The live API now uses PostgreSQL whenever DATABASE_URL is present. SQLite remains a local-development fallback only.

Health/readiness verify the selected database. Request bodies are bounded. Responses include baseline security headers. Authentication and tenant filtering use the durable database abstraction. SIGTERM closes the database cleanly.

Production truth: storage=postgres is the required evidence before treating the live customer runtime as durable.