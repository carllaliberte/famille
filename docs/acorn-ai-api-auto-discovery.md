# ACORN — AI API AUTO-DISCOVERY
Developer Mode continuously discovers AI API surfaces without hard-coding the future.

## Mechanism
1. Query a public model catalog (currently OpenRouter's public models endpoint).
2. Reconcile discovered providers/models with Acorn's direct-provider metadata.
3. Detect locally configured credentials without reading or storing their values.
4. Produce a developer access plan.
5. Credentialed probes may promote a provider only after real execution evidence.
6. Feed measurements back into routing, benchmarking, cost and capability learning.

OpenRouter currently advertises one OpenAI-compatible API covering 500+ models across 80+ providers and automatic fallback; this makes it a useful discovery rail, not proof that Acorn is authenticated to every provider.

## Rule
DISCOVERED != CONFIGURED != CONNECTED != EXECUTED != MEASURED != VERIFIED != LIVE.

No provider is declared connected merely because its model appears in a public catalog.

## Automatic operation
The catalog is replaceable. Future providers can enter through public catalog discovery or runtime environment discovery without a code change. The direct provider list is not closed-world. Provider-specific adapters are optional; OpenAI-compatible surfaces can use a common transport contract.

## Secrets
API keys never enter source, commits, logs, catalog output, or PR bodies. Only environment-variable presence is detected.

## Human intervention
Normal path: discovery → test → measurement → PR → Carl MERGE. No human intervention is required per provider beyond supplying credentials where legally/operationally required.

## Breaker
This fabric does not modify, bypass, replace or control Breaker.