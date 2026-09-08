# OTS — pointeur, pas une 5e carte

Rail **séparé**. Preuve d'antériorité, pas un sceau FAMILLE. Pas Check. Pas HORIZON. Pas `juge.v0`. Pas `flux.v0`.

Famille est la carte. OpenTimestamps notarie un SHA **après** le merge de Carl, indépendamment de GitHub.

| | |
|---|---|
| Spec | [unforge-check/OTS.md](unforge-check/OTS.md) |
| Stamp | [.github/workflows/ots-anchor.yml](.github/workflows/ots-anchor.yml) |
| Upgrade | [.github/workflows/ots-upgrade.yml](.github/workflows/ots-upgrade.yml) |
| Exception | [AUTOMATION.md](AUTOMATION.md) |

## Pourquoi pas ici comme carte

Copier un notaire externe dans `juge.v0.json` fusionnerait un calendrier avec le juge. Interdit.

`UFHY1` reste **signatures**. Ce rail n'encapsule pas, ne signe pas, n'active pas de PQC.

## Primitive (chez ce dépôt, après squash)

```
push sur main  +  SHA du commit  +  calendriers OTS pinnés dans le YAML
  →  .ots-anchor/latest.sha.ots   (pending, puis complete)
```

Sans merge de Carl : rien. Jamais sur une PR ouverte.

Les notaires sont **fixés en dur** dans `ots-anchor.yml` (alice, bob, finney, catallaxy), versionnés. Un changement de calendrier passe par une PR auditable — pas une mise à jour silencieuse du client.

## Vérifier (tierce partie)

```bash
ots verify .ots-anchor/latest.sha.ots
```

Le fichier `.sha` correspondant doit être à côté. Contre un nœud Bitcoin une fois *complete*, ou via les calendriers publics tant que *pending*.

État lisible (pending / complete, SHA, date) : bloc `ots-status` en tête de [unforge-check/OTS.md](unforge-check/OTS.md), réécrit par le cron quotidien.

Rien ici n'est un sceau. Un merge n'est pas une inclusion Bitcoin.

## Watch ≠ notaire

OTS date un SHA. Il ne détecte pas une copie.
Le radar : [unforge-check/PLAGIAT-WATCH.md](unforge-check/PLAGIAT-WATCH.md) —
canaris publics, `workflow_dispatch` seulement, une PR `docs/plagiat-watch`, pas `main`.
