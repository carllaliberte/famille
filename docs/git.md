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

## Conflits

Un conflit est deux intentions superposées, pas un puzzle.

1. Ne pas merger.
2. Lire les deux côtés.
3. Un côté stub (PLACEHOLDER, 12 o, SEE_ARTIFACT) → fermer la branche. On ne résout pas un stub.
4. Deux vrais travaux → garder le fichier de main, rejouer à la main le petit geste.
5. Tests. Vert ≠ bien fusionné. Relire le diff.

Interdit : theirs sur review.mjs entier ; Contents API pour « réparer » ; un troisième fichier de merge ; laisser des marqueurs <<<<<<<.

Après : PR neuve depuis main. Pas de --force sur une tête sale.

Conflit moteur (review.mjs, swarm) → STOP, repartir de main.
Conflit site/ ou md → même discipline, un sujet.

Mieux vaut une PR morte qu’un main résolu à la va-vite.
