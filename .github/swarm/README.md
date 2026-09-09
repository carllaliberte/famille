# Swarm — bus GitHub

Copié depuis acorn-juge, adapté famille. Fil enveloppe : `acorn.v0` (même que acorn-juge).

Revue = FILE.md + schema + docs.
Canal = commentaires de PR. `/flux to:chatgpt` adresse un pair.
Réponse mesh = enveloppe nue `FLUX from:…` (LU). 1 hop dans le même run.
`github-actions[bot]` ne relance pas (pas de boucle). Copilot / Cursor peuvent `/flux`.
Jamais wrangler. Jamais merge.
Fail-closed : sans secrets, skip silencieux.

Flux sécurisé (toutes les IA, y compris à venir) — **Carl opère le verrou**. Les IA le traversent. Elles ne le tiennent pas.
1. Secrets = Settings de **ce** repo. Carl les pose. Jamais git. Jamais le fil.
2. Noms : `GEMINI_API_KEY` `OPENROUTER_API_KEY` `XAI_API_KEY` (+ natives optionnelles).
3. Cadence $0 : `/swarm` = Gemini natif. Skip 400/402/403/404/429/503. Pas d'attente `:free` / xAI auto. Exit 0.
4. xAI id `xai` (pas chef grok) : `grok-2` → `grok-2-mini`.
5. Jamais merge. Jamais rotation de secret par une IA. Carl squash. LIVE = Carl.

Noms Actions (pas git) : `ANTHROPIC_API_KEY` `OPENAI_API_KEY` `DEEPSEEK_API_KEY` `GEMINI_API_KEY` `OPENROUTER_API_KEY` `XAI_API_KEY`
Fable on-demand : `/fable`.

Deux flux : `schema/flux.v0.json` = carte. `schema/mesh.v0.json` = enveloppe IA.
Roster : `schema/agents.json` (schéma `schema/agents.v0.json`). Ajouter une IA = une entrée, pas un fork de `mesh.v0`.

Mode unique : `cognition.mjs` + `schema/cognition.v0.json` + `COGNITION.md`. COLLECTIVE_COGNITION.
Pool de session : `pool.mjs` + `schema/pool.v0.json`. Couche session sur `acorn.v0`.
Pas un deuxième mesh. DECLARED ≠ CONNECTED ≠ LIVE.
`claim.mjs` · `cadence.mjs` · `workforce.mjs` — claim expire ; 1 PR / repo (`cursorGate` READY ou RAS) ; IDLE avant recruter. IDLE ≠ extinction. Jamais merge.

Entrée : `node .github/swarm/review.mjs`
