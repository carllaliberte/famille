# Acorn Channel Reality

Acorn never treats a credential, endpoint string, adapter, roster row, mock, or historical success as proof that a channel is executable.

## State contract

`DEFINED → CONFIGURED → PROBING → EXECUTED → OBSERVED → MEASURED → VERIFIED → LIVE`

Negative evidence is first-class:

- `401` → `AUTH_FAILED`
- `403` → `FORBIDDEN`
- `404` → `NOT_FOUND`
- `410` → `RETIRED`
- `408` → `TIMEOUT`
- `425` → `TRANSIENT_FAILURE`
- `429` → `RATE_LIMITED`
- `5xx` → `TRANSIENT_FAILURE`
- DNS/TLS/connection failures → bounded `TRANSIENT_FAILURE` or `TIMEOUT`
- explicit retirement/deprecation language → `RETIRED`
- unknown transport failure → `INCONCLUSIVE`

`404` is intentionally not interpreted as provider death: it may be an endpoint or model mismatch. `5xx` is never sufficient to retire a provider. Retirement requires an explicit lifecycle fact or durable retirement evidence.

## Lifecycle dimensions

Provider lifecycle, model lifecycle, endpoint health, credential state, and execution evidence are separate dimensions. A provider may be healthy while one model is retired; credentials may exist while authorization fails; an adapter may be valid while an endpoint has moved.

GitHub Models is a concrete provider lifecycle fact: GitHub officially retired the service on July 30, 2026. Acorn therefore treats the old `github-models` channel as retired rather than attempting to revive it through `GITHUB_TOKEN`.

## Routing invariant

`credentialPresent ≠ CALLABLE`.

Credentials/configuration yield `CONFIGURED`. Only recent, real transport evidence can produce execution eligibility. Mocked HTTP is regression evidence, never LIVE evidence.

## Evidence invariant

A successful HTTP response is `OBSERVED` transport evidence, not automatically `VERIFIED` semantic inference and never automatically `LIVE`. Execution records must retain provider, channel, timestamp, response observation, and transport evidence.

## Fallback invariant

Fallback must preserve the failed attempt as its own evidence. It must never rewrite the original provider identity or turn a fallback response into evidence that the original provider executed.

## Temporal invariant

Execution evidence expires. After its lease, the channel returns to `PROBING` instead of remaining callable because it once worked.

## Human sovereignty

Channel quarantine and retry policy are runtime mechanisms, not the constitutional Breaker. The channel layer may observe, classify, quarantine, retry within policy, and enter `HOLD_HUMAN`; it cannot control, close, open, delegate, bypass, or simulate the human-controlled Breaker.
