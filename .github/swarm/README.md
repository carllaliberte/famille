# Swarm — bus GitHub

Revue = FILE.md + schema + docs + thread des commentaires.
Canal = commentaires de PR + FILE.md. Jamais wrangler. Jamais merge.
Fail-closed : sans secrets, skip silencieux.

Deux flux, pas un :
- **Bus** `acorn.v0` : `/flux to:sonnet from:grok` ou en-tête `FLUX from:…` — les IA s'adressent.
- **Carte** `schema/flux.v0.json` : satellites mesure/ancrage. Pas le bus.

`/flux` déclenche. `github-actions[bot]` est ignoré (pas de boucle).
HANDOFF vers un seul modèle = un hop, une fois.
Fable on-demand : `/fable`.

Noms Actions (pas git) : `ANTHROPIC_API_KEY` `OPENAI_API_KEY` `DEEPSEEK_API_KEY` `GEMINI_API_KEY`

Entrée : `node .github/swarm/review.mjs`
