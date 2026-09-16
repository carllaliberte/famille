# Acorn Channel Reality

Acorn never treats a credential, endpoint string, adapter, roster row, mock, or historical success as proof that a channel is executable.

## State contract

`DEFINED → CONFIGURED → PROBING → EXECUTED → OBSERVED → MEASURED → VERIFIED → LIVE`

Negative evidence is first-class:

- `401` → `AUTH_FAILED`
- `403` → `FORBIDDEN`
- `404` → `NOT_FOUND` (endpoint or model unavailable)
- `410` → `RETIRED`
- `408/425/429` → `RATE_LIMITED`
- `5xx` → `TRANSIENT_FAILURE`
- explicit retirement/deprecation language → `RETIRED`
- unknown transport failure → `INCONCLUSIVE`

A negative state is not a generic error. It becomes evidence attached to the provider/channel/model and prevents repeated false claims until a bounded re-probe is warranted.

## Provider lifecycle

A provider can disappear while source code remains perfectly valid. A model can be retired while its credentials remain valid. An endpoint can move while an adapter remains unchanged.

Therefore provider lifecycle and channel health are separate from credentials.

GitHub Models is a concrete example: GitHub officially retired the service on July 30, 2026, including the inference API and BYOK. Acorn must therefore treat the old `github-models` channel as retired rather than attempting to revive it through `GITHUB_TOKEN`.

## Routing invariant

`credentialPresent ≠ CALLABLE`.

Only recent, real transport evidence can produce execution eligibility. Tests using mocked HTTP are regression tests; they are never LIVE evidence.

## Fallback invariant

Fallback must preserve the failed attempt as evidence. It must never rewrite the provider identity of the original attempt or turn a fallback response into evidence that the original provider executed.

## Temporal invariant

Execution evidence expires. After its lease, the channel returns to probing rather than remaining permanently callable because it once worked.

## Human sovereignty

The channel layer can observe, classify, quarantine, retry within policy, and enter `HOLD_HUMAN`. It cannot control the Breaker and cannot grant itself authority.
