# Git — squash, rebase et conflits

Carl seul squash. Jamais merge commit. Jamais auto-merge. Jamais une branche stub.

## Stratégie

Une intention par branche. Rejouer sur le main du matin.

Ordre type : CI mince → pièce visible → geste moteur minuscule → ménage racine.
Ne pas empiler grok46 + site + ménage sur la même tête.

Avant squash : base = main, un sujet, pas de PLACEHOLDER / SEE_ARTIFACT, lecture humaine du diff.
Après squash : relire main, pas la PR. cadence n’est pas un verdict.

Une branche stub se supprime. Elle ne se merge pas.

## rebase

Rejouer tes commits par-dessus une autre base, au lieu de les fusionner.

Merge : deux histoires qui se rejoignent.
Rebase : une seule ligne. Tes commits sont recopiés au bout du nouveau main. Les anciens SHA meurent.

Chez Acorn : c’est « rejouer sur le main du matin ». Branche courte, avant squash. On ne rebase pas main.

```bash
git fetch origin
git checkout ma-branche
git rebase origin/main
```

Conflit : un commit à la fois, `git add`, `git rebase --continue`.
Tout lâcher : `git rebase --abort`.

Après rebase, l’historique local a changé :

```bash
git push --force-with-lease
```

`--force-with-lease` seulement si toi seul touches la branche.

Ne pas rebase : main ; une branche déjà squash-mergée ; une branche partagée dont tu n’es pas sûr.

Rebase ≠ squash Carl. Rebase = ligne propre avant la PR. Squash = toi, sur GitHub, après lecture.

## Conflits de fusion

Git n’arrive pas à superposer deux versions du même bout. Il pose des marqueurs et s’arrête.

```
<<<<<<< HEAD
ce que tu as déjà
=======
ce qui arrive (l’autre branche / main)
>>>>>>> l-autre
```

Geste :

```bash
git status
# éditer : enlever les marqueurs, garder UNE version juste
git add le-fichier
git rebase --continue    # si rebase
# ou git commit          # si merge
```

Tout lâcher : `git rebase --abort` ou `git merge --abort`.

Chez Acorn on est presque toujours en rebase sur origin/main, pas en git merge.
HEAD = ta branche. L’autre côté = le main du matin.

Un côté stub (PLACEHOLDER, 12 o, SEE_ARTIFACT) → abort + fermer la branche.
review.mjs → ne pas prendre theirs en bloc. Garder main, rejouer à la main le petit geste.
Relire le fichier sans <<<<<<<. Puis tests. Puis PR neuve si la tête est sale.

| Commande | Ici |
|---|---|
| `git checkout --ours` | Ta version seule. Souvent trop. |
| `git checkout --theirs` | L’autre seule. Dangereux sur le moteur. |
| Accepter les deux blocs | Doublons. Interdit. |
| Committer avec les marqueurs | Main cassé. Interdit. |

Un conflit se décide, il ne se moyenne pas. Un humain tranche, ou on abort.

## Conflits (doctrine)

1. Ne pas merger.
2. Lire les deux côtés.
3. Stub → fermer la branche.
4. Deux vrais travaux → fichier de main + geste rejoué à la main.
5. Tests. Vert ≠ bien fusionné. Relire le diff.

Interdit : theirs sur review.mjs entier ; Contents API pour réparer ; un troisième fichier de merge ; laisser des marqueurs.

Après : PR neuve depuis main. Pas de --force sur une tête sale.

Conflit moteur (review.mjs, swarm) → STOP, repartir de main.
Conflit site/ ou md → même discipline, un sujet.

Mieux vaut une PR morte qu’un main résolu à la va-vite.
