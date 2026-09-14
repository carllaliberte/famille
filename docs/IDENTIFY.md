# Identifier le travail, aviser l’IA

Contrat Carl 2026-09-14. `auto_merge=false`.

Chaque artefact (commit, branche, observation, review) porte un **id roster** (`schema/agents.json`) : `astra`, `codex`, `build`, `cursor`, …

## Erreur

Jamais silencieuse. `reportError` nomme l’IA impliquée et produit un `NOTIFY @id` (optimisation).  
`delivered=true` seulement si un canal réel a posté (commentaire, flux). Sinon `PROPOSED`.

Pas LIVE. Pas merge. Carl reste le juge.

Code : `.github/swarm/identify.mjs`
