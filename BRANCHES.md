# Branches

```
ville/<quartier>-<piece>
```

Quartiers : `juge` `preview` `conso` `sdk` `rente` `garde`

Titre PR : `Ville <quartier> — <pièce>`

## Validation

GitHub : `.github/workflows/branche.yml` (le mobile n'a pas de hook).
Local :

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-push
```

unforge reste `bloc/<lettre>-<verbe>` — l'usine squash `bloc/*`.
Ne pas renommer l'historique.
