# xAI surface — noyau Acorn

LU 2026-09-15. Indissociable du kernel `SOVEREIGN_KERNEL` / flux `acorn.v0`.

- Catalogue daté : `schema/xai-surface.json`
- Schéma : `schema/xai-surface.v0.json`
- Mesure : `node scripts/xai-surface-monitor.mjs`
- Workflow : `.github/workflows/xai-surface.yml` (`workflow_dispatch`)
- Secret Actions : `XAI_API_KEY` (valeur jamais dans git, jamais dans les logs)

`XAI_API_KEY` absente = `CONFIGURATION_ERROR`. Jamais une présence simulée.
Slug sans API = `CHANNEL_NOT_PRESENT`.
Tesla / Neuralink / Colossus / Government = `OUT_OF_RUNTIME` / `NOT_CANAL`.

Déjà injecté (nom seulement) dans :
- `.github/workflows/grok-build-bridge.yml`
- `.github/workflows/swarm.yml`
- `.github/workflows/prove-all-models.yml`
- `.github/workflows/xai-surface.yml`
- `.github/workflows/acorn-autopilot.yml` (présence pour le worker)

Continu = réévaluation mesurée + PR humaine quand docs.x.ai change un slug.
`auto_merge=false`. `live=false`. Carl merge.
