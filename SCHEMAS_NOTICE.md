# SCHEMAS_NOTICE — copyright des schémas JSON

Copyright (c) 2026 Carl Laliberté.
Tous droits réservés sauf mention contraire dans LICENSE.

Les artefacts suivants sont des œuvres distinctives du dépôt. Le format JSON
n'admet pas de commentaire de tête sans casser `JSON.parse`. Ce fichier porte
la mention à leur place. **Les fichiers JSON eux-mêmes ne sont pas modifiés.**

| Fichier | Dépôt | Note |
|---|---|---|
| `schema/mesh.v0.json` | famille | enveloppe `acorn.v0`. Pas le pipeline. |
| `schema/agents.v0.json` | famille | roster mesh. Pas un juge. |
| `schema/agents.json` | famille | instance du roster. Une entrée = une IA. |
| `schema/juge.v0.json` | famille | contrat public. **intouché** (verrou [REVUE.md](REVUE.md) §4bis). |
| `schema/flux.v0.json` | famille | pipeline carte / satellites. **intouché** (verrou §4bis). |
| `schema/kem.v0.json` | [unforge-check](https://github.com/carllaliberte/unforge-check) | sibling. Jamais fusionné ici. |

`unforge-check/check.py` et `unforge-check/oubli.py` vivent chez le sibling
[unforge-check](https://github.com/carllaliberte/unforge-check). Ils ne sont
pas vendored dans famille. Pas une 5e carte. Pas un changement de comportement.

Cette notice n'est pas un choix de licence. Voir `LICENSE.option-open` et
`LICENSE.option-closed`. Voir [NOTICE.md](NOTICE.md) pour la provenance.
