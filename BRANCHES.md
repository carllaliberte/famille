# Branches

```
ville/<quartier>-<piece>
cursor/<piece>
docs/<piece>
schema/<piece>
grok/auto-YYYYMMDD-HHMMSS
grok/optimize-YYYYMMDD-HHMMSS
```

Quartiers : `juge` `preview` `conso` `sdk` `rente` `garde`

Titre PR : `Ville <quartier> — <pièce>`

Cursor Cloud agents use `cursor/<piece>`. Carl still squashes. One PR per repo.

`grok/auto-*` : commits SSH signés via `.github/workflows/grok-signed-commit.yml`. Carl squash-merge seulement — jamais fast-forward. Jamais auto-merge. Jamais main par Grok.

`grok/optimize-*` : scan perf+structure via `.github/workflows/grok-optimize.yml`. Commits SSH signés. Chemins sensibles exclus. Carl squash-merge seulement — jamais fast-forward. Jamais auto-merge. Jamais main par Grok.

## Validation

GitHub : `.github/workflows/branche.yml` (le mobile n'a pas de hook).
Local :

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-push
```

unforge reste `bloc/<lettre>-<verbe>` — l'usine squash `bloc/*`.
Ne pas renommer l'historique.
