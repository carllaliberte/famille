# Swarm — bus GitHub

Copié depuis acorn-juge, adapté famille. Fil enveloppe : `acorn.v0` (même que acorn-juge).

Revue = FILE.md + schema + docs.
Canal = commentaires de PR. `/flux to:chatgpt` adresse un pair.
Réponse mesh = enveloppe nue `FLUX from:…` (LU). 1 hop dans le même run.
`github-actions[bot]` ne relance pas (pas de boucle). Copilot / Cursor peuvent `/flux`.
Jamais wrangler. Jamais merge.
Fail-closed : sans secrets, skip silencieux.

Deux flux : `schema/flux.v0.json` = carte. `schema/mesh.v0.json` = enveloppe IA.

Noms Actions (pas git) : `ANTHROPIC_API_KEY` `OPENAI_API_KEY` `DEEPSEEK_API_KEY` `GEMINI_API_KEY`
Fable on-demand : `/fable`.

Entrée : `node .github/swarm/review.mjs`
