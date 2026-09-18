# ACORN — OPENAI DEVELOPER BRIDGE

Acorn treats OpenAI as a first-class **capability provider**, never as an authority.

The bridge covers the current documented developer surfaces that matter to Acorn: Responses, Agents, MCP, built-in tools, tool discovery and future/unknown surfaces. OpenAI documents MCP as a way to connect models to external tools and data, and its developer tooling includes web search, file search, computer use, shell, code interpreter, image generation, function calling, tool search and programmatic tool calling.

## Contract

`HUMAN INTENT → ACORN → OPENAI DEVELOPER BRIDGE → CAPABILITY → EXECUTION → EVIDENCE → MEASUREMENT → VALUE`

The adapter does not claim that a key exists, authentication succeeded, a connection is live, a model executed, a tool executed, or an outcome was verified. Those states require evidence.

## Credential boundary

Use `OPENAI_API_KEY` with optional project/organization environment variables. Never commit, print, persist, or return the secret.

A developer API key is a credential. It is **not** human authority.

## MCP

MCP is a strategic bridge for Acorn because OpenAI supports remote MCP servers and controlled tool access. Acorn defaults consequential MCP calls to explicit approval and keeps effect authorization in Acorn's existing human-controlled governance. OpenAI's documentation likewise distinguishes tool access from authorization and recommends approval for consequential actions.

## Future

Unknown OpenAI surfaces are represented as `DISCOVERED` / `future_compatible`, rather than forcing Acorn to maintain a brittle model allowlist. A new model or capability can therefore become a candidate capability without silently becoming executable or authoritative.

## Spectacular developer recognition — next chantier

After the bridge is proven, build a **Developer Hall of Capability**: a living showcase inside Acorn that credits developer ecosystems, displays only measured integrations, links each capability to provenance and evidence, demonstrates real workflows, and celebrates the people/tools behind them.

No invented partnership, endorsement, sponsorship, usage, revenue, or certification.

OpenAI's official developer documentation remains the source of truth for OpenAI surface details.

## Invariants

- CAPABILITY ≠ AUTHORITY
- API_KEY ≠ HUMAN_AUTHORITY
- CONFIGURED ≠ AUTHENTICATED
- AUTHENTICATED ≠ CONNECTED
- CONNECTED ≠ EXECUTED
- EXECUTED ≠ VERIFIED
- PAYMENT ≠ EXECUTION
- BUILD ≠ MERGE
