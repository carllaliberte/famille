# ACORN API HARVEST v0

Nouvelle façon d'intégrer les API AI du réseau en mode Developer.
Automatique jusqu'au merge. Carl squash. Jamais main.

## Loi

```text
DISCOVERED ≠ CONNECTED ≠ AUTHORIZED ≠ EXECUTED ≠ MEASURED ≠ LIVE
CAPABILITY ≠ AUTHORITY
ADAPTER ≠ CONNECTION ≠ PROVEN
skip mesuré ≠ stall
AUTO_MERGE = FALSE
MERGE = CARL
```

Harvest ne pose pas de secret. Harvest ne mute pas `schema/agents.json`.
Harvest écrit un snapshot et une proposition.

## Cycle

```text
OBSERVE seed AI
  ↓
PROBE keyless → free → paid
  ↓
DIFF roster / catalogue
  ↓
PROPOSE .acorn/api-harvest.json + proposals/agents-delta.json
  ↓
PR draft (jamais main)
  ↓
CARL MERGE
  ↓
canal présent → CONNECTED
canal absent → CHANNEL_NOT_PRESENT
```

## Lanes

1. keyless — catalogue local, Cortex, Ollama/Filon, GitHub Models si `GITHUB_TOKEN`
2. free — OpenRouter `:free` seulement si `OPENROUTER_API_KEY`
3. paid — natif seulement si clé Carl déjà posée

`OPENROUTER_API_KEY` absent = skip mesuré, exit 0, pas FRICTION, pas stall.
HTTP 401/402/403/404/429/503 = skip mesuré.

## Mapping secrets (id roster ≠ nom secret)

| ids | secret |
|---|---|
| chatgpt, openai | `OPENAI_API_KEY` |
| sonnet, fable, claude, opus, anthropic | `ANTHROPIC_API_KEY` |
| haiku | `HAIKU_API_KEY` |
| gemini, google | `GEMINI_API_KEY` |
| xai, grok, heavy, build | `XAI_API_KEY` |
| deepseek | `DEEPSEEK_API_KEY` |
| orfree + gemma* + nemotron* + gptoss* + qwen3c + … | `OPENROUTER_API_KEY` |
| groq / cerebras / together / … | natif ou skip |

Jamais `keyName(id)` naïf (`CHATGPT_API_KEY`).

## xAI

Slugs live 2026-09-18 : `grok-4.6` `grok-4.5` `grok-4.3` `grok-build-0.1` `grok-4.1-fast` `imagine` `voice`.
Stale FILE.md : `grok-2` `grok-2-mini`. Harvest les nomme. Il ne réécrit pas FILE.md.

## Écritures autorisées

- `.acorn/api-harvest.json` — snapshot mesuré
- `proposals/agents-delta.json` — proposition DECLARED
- ce document, le script, le test, le workflow

Écriture interdite sans REVUE : `schema/agents.json` `schema/` `unforge-check/` `mesure-protocol/` `action.yml` `main`.

## Runtime

```bash
node --test test/acorn-api-harvest.test.js
node scripts/acorn-api-harvest.mjs
```

Workflow : `.github/workflows/acorn-api-harvest.yml`
Cron + dispatch. PR seulement si delta + secrets de signature. Sinon issue ou HOLD mesuré.

UN GRAND CHANTIER N'EST PAS TERMINÉ PARCE QUE LE CODE EXISTE.
