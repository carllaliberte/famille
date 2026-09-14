# Reliability fabric

Infrastructure de fiabilité cognitive. Pas une super-intelligence. `auto_merge=false`. Authority = carl.

Étend `.github/swarm/fabric.mjs`. Pas un second moteur.

## Vérifié (par tests)

- `DEFINED ≠ EXECUTED ≠ VERIFIED ≠ LIVE`
- `verifyOp` : succès + readback = VERIFIED ; succès + readback raté = EXECUTED UNVERIFIED ; contradiction = CONFLICT
- `makeClaim` refuse VERIFIED sans readback, EXECUTED sans `executed=true`, LIVE toujours
- `assertOperational` refuse connected/available/live/executed/verified/certified/written/merged sans preuve
- 403 GitHub reste 403 · jamais `GitHub=OK`
- contradiction → objection BLOCKING → `correctConflict` mesure
- score décomposable (execution, readback, provenance, independent_verification, consistency, objections)

## Non vérifié / non exécuté

- Le cycle observe→…→human_decision est **DEFINED**, pas EXECUTED comme workflow GitHub.
- LIVE : jamais minté ici.
- MERGE : Carl seulement.

## Provenance

Chaque claim : what, state, source, actor, when, method, evidence, measure, confidence, objections. Champ manquant → confidence `low` ou état INSUFFICIENT.

## Frontière humaine

DECISION = PENDING_HUMAN · authority carl · `humanDecide` refuse tout autre acteur.
