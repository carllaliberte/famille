# Cognitive fabric v0

SHA de pose : `origin/main` au moment de la PR. Carl squash. `auto_merge=false`.

Couche **work object** sur le mesh existant. Pas un deuxième roster, pas un deuxième routing.

## Existe (DEFINED + code)

- `.github/swarm/fabric.mjs` + `schema/fabric.v0.json`
- États : PROPOSED → READY → WORKING → REVIEWING → DECISION → DONE | REJECTED
- Branches parallèles, synapses (grade PROPOSED), observations, evidence, objections, mesures, synthèse
- DECISION = `PENDING_HUMAN` · authority carl · `human_required: true`
- `readyOf()` : objectif, capacités couvertes par une branche, pas d’objection BLOCKING ouverte
- `discoverCapabilities()` via `workforce.pool` — declared ≠ available ≠ LIVE
- `transferContext()` — INSUFFICIENT si vide ; synapse TRANSFER grade PROPOSED
- `counters()` — chiffres tirés de l’objet, `loop: DEFINED` pas EXECUTED
- `cannotMerge()` toujours false

## Proposé, pas exécuté

La boucle observe → synthesize → human → next n’est **pas** un workflow GitHub. `executed: false`. Cadence / swarm inchangés.

## Mesuré

Rien dans ce module n’appelle un fournisseur. `live: false`. Une evidence n’est `measured: true` que si l’appelant le dit.

## N’est pas

OMNI-CORE. LIVE. READY réseau. Un juge. Un remplacement de `cognition.mjs` / `workforce.mjs`.
