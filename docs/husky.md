# Husky

Couche locale. Ne remplace pas le CI ni le squash Carl.

Après clone : `npm install` (script `prepare` pose les hooks).

## Hooks

**pre-commit** — refuse :
- marqueurs `<<<<<<<` / `=======` / `>>>>>>>`
- `.github/swarm/review.mjs` < 1000 o
- `PLACEHOLDER` ou `SEE_ARTIFACT` dans ce fichier

**pre-push** — refuse de pousser la branche `main`.

**commit-msg** — refuse un sujet vide ou `wip` / `fix all` / `update`.

Pas de `npm test` ici : déjà `build-verify`.
Pas de lint-staged, pas de commitlint.
Contournement : `--no-verify` — donc rampe, pas loi.
