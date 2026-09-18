# ACORN × OPENAI DEVELOPER — Developer Tribute

**Status:** CODE PRESENT — TESTED by the dedicated contract suite when CI executes it.  
**Contract:** `acorn.openai-developer-tribute.v1`

This is Acorn's developer-facing tribute experience for developers who bring an OpenAI API capability into Acorn.

It is intentionally **not** an OpenAI product, endorsement, sponsorship, partnership claim, or official integration.

## The experience

A developer supplies their own OpenAI API credential to a backend/runtime they control. Acorn:

1. detects whether a credential is present;
2. derives a short one-way fingerprint for correlation;
3. calls `GET /v1/models` only when the developer explicitly supplies a key;
4. records observed HTTP facts such as status and model count;
5. never persists, prints, or renders the secret;
6. produces a human-readable **DEVELOPER THANK YOU** artifact;
7. feeds the observed capability into Acorn's existing provider-neutral capability/evidence model.

The key itself is never an Acorn authority credential.

## Why this is spectacular

The visible experience can turn a developer key into a live capability ceremony:

`DEVELOPER → KEY PRESENT → CAPABILITY DISCOVERED → REAL API OBSERVED → EVIDENCE → THANK YOU → COMPOSITION`

The thank-you is not a badge claiming OpenAI endorsement. It is Acorn thanking the developer for making the capability available to an ecosystem.

The long-term experience can become:

**Bring a capability. Watch it become useful. Watch the useful result become reusable.**

## Security

OpenAI currently recommends unique keys, expiration/rotation, secure storage, no client-side exposure, and never committing keys to source control. Acorn follows the same direction: credentials remain at the external boundary and are never written to the repository.

The implementation deliberately distinguishes:

- credential presence ≠ authenticated identity;
- connected ≠ verified;
- model discovery ≠ model quality;
- API capability ≠ authority;
- API access ≠ customer value;
- payment ≠ execution;
- execution ≠ successful outcome.

## Runtime

With a backend environment variable:

`OPENAI_API_KEY=...`

run:

`node scripts/acorn-openai-developer-tribute.mjs`

Without a key, the runtime returns `WAITING_HUMAN` rather than fabricating a connection.

## Acorn principle

> **Thank the developer. Prove the capability. Never steal the secret. Never invent the relationship. Turn capability into measurable reality.**

This uses the existing Developer Gateway rather than creating a second gateway, second market, or second authority system.
