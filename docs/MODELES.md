# Inventaire modèles — observé, pas déclaré

Date : 2026-09-14. SHA `c816888`. Aucun appel fournisseur ce tour.
`MODELES.md` (racine) = lecteurs LU. Ici = transport CANALS / Ollama.
Ajout = NON sauf ordre Carl + PR séparée.

Code : `.github/swarm/review.mjs` 27191 o · PLACEHOLDER absent.
`xai.model=grok-2` (gelé) · `grok46.model=grok-4.6` (additif).
XAI_FALLBACK = `grok-2`, `grok-2-mini` (slug fallback, pas un canal).

## Cloud (code seulement)

| id | où | slug | secret-nom | code | mesuré | ajout |
|---|---|---|---|---|---|---|
| sonnet | anthropic | claude-sonnet-5 | ANTHROPIC_API_KEY | O | N | NON |
| fable | anthropic | claude-fable-5 | ANTHROPIC_API_KEY | O | N | NON |
| chatgpt | openai | gpt-5.6-terra | OPENAI_API_KEY | O | N | NON |
| deepseek | deepseek | deepseek-v4-flash | DEEPSEEK_API_KEY | O | N | NON |
| gemini | gemini | gemini-3.8-flash | GEMINI_API_KEY | O | 503 (ancien run) | NON |
| haiku | openrouter | claude-3-haiku | HAIKU_API_KEY | O | N | NON |
| llama | openrouter | meta-llama/llama-3.3-70b-instruct:free | LLAMA_API_KEY | O | N | NON |
| qwen | openrouter | qwen-2.5-72b-instruct | QWEN_API_KEY | O | N | NON |
| xai | xai | grok-2 | XAI_API_KEY | O | 400 | NON |
| grok46 | xai | grok-4.6 | XAI_API_KEY | O | 403/400 | NON |
| openrouter | openrouter | google/gemini-2.5-flash | OPENROUTER_API_KEY | O | 402 | NON |
| *(fallback)* | xai | grok-2-mini | XAI_API_KEY | O (pas un id CANALS) | 400 skip | NON |

Mesures HTTP : run [34876044826](https://github.com/carllaliberte/famille/actions/runs/34876044826), SHA `c23ce6f`, REAL_RESPONSE=0. Pas rejoué (crédits 0).

## Local (cette machine, ce tour)

Daemon : **DOWN** (curl 11434 échoue). Poids disque : `llama3.2`. Pas de pull.

| id | où | slug | secret-nom | code | mesuré ce tour | ajout |
|---|---|---|---|---|---|---|
| local | ollama | llama3.2 | OLLAMA_HOST | O | N (DOWN) | NON |
| *(doc Quantum)* | ollama | gemma2:2b | — | N | N | NON — absent disque ici |
| *(doc Quantum)* | ollama | qwen2.5:1.5b | — | N | N | NON — absent disque ici |

Ne pas confondre `local`/llama3.2 avec canaux `llama` / `qwen` OpenRouter.

## Lanes (unpaid first)

Auto-dispatch : **keyless** (Cortex local, Ollama, GitHub Models / `GITHUB_TOKEN`) → **free** (OpenRouter `:free`) → **paid**. Si un lane unpaid existe, xAI/OpenAI/Anthropic/Gemini ne partent pas tout seuls. `/xai` reste explicite. Clé payante absente = skip, jamais une présence simulée. `ghmodels` = `openai/gpt-4o-mini` via GitHub Models, pas une facture OpenAI.

## NON_AJOUTÉ

Aucun. Crédits 0 · pas d’ordre Carl · grok-2 gelé · grok-2-mini n’est pas un siège à promouvoir.
