ACORN LIVE EXECUTION WORKER

PostgreSQL-backed asynchronous execution loop. Requests become durable jobs, workers claim with row locks, bounded retries are explicit, and SIGTERM requeues in-flight work. Tenant identity is enforced on every request lookup/update. The worker performs only the safe intake/qualification cycle; it never grants authority or claims external effects.
