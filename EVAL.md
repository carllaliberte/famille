<!-- Copyright (c) 2026 Carl Laliberté. Tous droits réservés sauf mention contraire dans LICENSE. -->
<!-- En-tête mécanique. Pas un choix de licence. -->

# EVAL — lecture et challenge

Boussole pour un spécialiste externe. Pas un pitch. Pas une étiquette marketing.

Carl Laliberté merge. Les IA proposent. Une signature n’est pas une vérité.

## Ce qui tourne

| Quoi | Où | Note |
|---|---|---|
| Quatre champs du juge | [schema/juge.v0.json](schema/juge.v0.json) | `quelle` · `temoin` · `epsilon` · `horizon` |
| Fil mesh | [schema/mesh.v0.json](schema/mesh.v0.json) | `acorn.v0` — commentaires PR |
| Roster | [schema/agents.json](schema/agents.json) | join des IA, personne n’est juge |
| Flux | [schema/flux.v0.json](schema/flux.v0.json) | pipeline carte / satellites |
| Contrats | [schema/README.md](schema/README.md) | frontières. Pas de secrets ici |
| KEM (opt-in, sibling) | [KEM.md](KEM.md) | spec et schéma chez [unforge-check](https://github.com/carllaliberte/unforge-check) |
| UFHY1 | signatures (Ed25519 + ML-DSA-65) | **pas** une date, **pas** une encapsulation |
| Kernel local | `.github/swarm/*.mjs` | `npm test` / `make pulse` |
| Preuves | `.github/swarm/claim.mjs` | une preuve expire ; LU exige `evidence_hash` |

`schema/` = contrats d’interface. Pas de clés API. Pas de CI interne comme spec.

## Règle du jeu

- Interdit : étiquette marketing PQC, ε = 0, QPU sur Git, merge automatique.
- `CHANNEL NOT PRESENT` pour l’optique tant qu’il n’y a pas de fibre attestée.
- Crypto = hash et signature. Ça ne prouve pas le monde.
- `LU` sans hash du contenu lu = rejeté.
- HOLD n’est pas un échec. HOLD > faux vert.

## Lecture / challenge

1. Lire ce fichier, [KEM.md](KEM.md), [schema/README.md](schema/README.md).
2. Tourner les tests : `npm test` (zéro réseau).
3. Observation : une **issue** datée, avec citation (fichier + extrait). Pas une opinion.
4. Challenge code : **une PR**, une tête, branche `cursor/…`. Pas `main`.
5. Un dépôt = une PR ouverte max. Carl squash.

Verdicts utiles : `LU` (lu, hash fourni) · `HOLD` · `REJECT` · jamais un badge multi-IA comme preuve de contenu.

Contact : issues de ce dépôt. Mail : `Laliberte22@gmail.com` (inchangé).
