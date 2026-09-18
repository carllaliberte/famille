ACORN Durable Job Queue

Provider-neutral asynchronous job semantics: QUEUED -> RUNNING -> SUCCEEDED | FAILED | BLOCKED | CANCELLED.

Tenant identity and worker identity are explicit. Retries are bounded. Evidence is carried with completion. Queue state never grants authority and never implies an external effect.

This is the execution substrate for the next live worker integration.