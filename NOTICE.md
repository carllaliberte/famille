# NOTICE — provenance de production

Ce document est distinct d'[AUTOMATION.md](AUTOMATION.md) (rôles opérationnels).
Il documente la paternité *de fait* pour fins de lecture, pas une stratégie juridique.

## Qui a produit quoi

Le dépôt `carllaliberte/famille` contient :

- des **contributions humaines** de Carl Laliberté — décision, squash, merge, arrêt ;
- des **contributions générées ou co-produites par des systèmes d'IA** :
  - Grok (code et Git — rôle `build`) ;
  - Claude, Gemini, ChatGPT, DeepSeek (revue, via le protocole [REVUE.md](REVUE.md)).

Carl reste le seul point de merge humain. Aucune IA n'obtient l'écriture sur `main`.

## Traçabilité

Le protocole de revue [REVUE.md](REVUE.md) est le mécanisme de traçabilité.
Chaque PR porte l'historique de qui / quoi a écrit vs révisé, via :

- les commentaires GitHub, append-only ;
- l'enveloppe `acorn.v0` ([schema/mesh.v0.json](schema/mesh.v0.json)).

Un commentaire de PR n'est pas un sceau. Un squash de Carl n'est pas une
décision de licence.

## Portée — pas une position juridique

Ce document décrit le processus de production, il ne constitue pas une position juridique sur la titularité des droits.

Les options de licence en clair sont `LICENSE.option-open` (MIT) et
`LICENSE.option-closed` (tous droits réservés). Aucun des deux n'est renommé
`LICENSE` par cette mécanique. Carl tranche, probablement avec un avocat.
Le fichier `LICENSE` déjà présent sur `main`, s'il existe, n'est pas modifié
par cette préparation.

Marques (FAMILLE, GARDE, UNFORGE) : hors de ce notice. QUANTUM : hors Git.
