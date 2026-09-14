# Husky

Couche locale. Ne remplace pas le CI ni le squash Carl.

Après clone : `npm install` (script `prepare` pose les hooks).

`pre-commit` refuse :
- marqueurs `<<<<<<<` / `=======` / `>>>>>>>`
- `.github/swarm/review.mjs` < 1000 o
- `PLACEHOLDER` ou `SEE_ARTIFACT` dans ce fichier

Pas de `npm test` ici : déjà `build-verify`.
Contournement : `git commit --no-verify` — donc rampe, pas loi.
