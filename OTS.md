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
push sur main  +  SHA du commit  +  calendriers OTS publics
  →  .ots-anchor/latest.sha.ots   (pending, puis complete)
```

Sans merge de Carl : rien. Jamais sur une PR ouverte.

## Vérifier (tierce partie)

```bash
ots verify .ots-anchor/latest.sha.ots
```

Le fichier `.sha` correspondant doit être à côté. Contre un nœud Bitcoin une fois *complete*, ou via les calendriers publics tant que *pending*.

Rien ici n'est un sceau. Un merge n'est pas une inclusion Bitcoin.
