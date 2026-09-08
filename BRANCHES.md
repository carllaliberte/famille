# Branches

```
ville/<quartier>-<piece>
cursor/<piece>
docs/<piece>
schema/<piece>
ai/<piece>
grok/auto-YYYYMMDD-HHMMSS
grok/optimize-YYYYMMDD-HHMMSS
```

Quartiers : `juge` `preview` `conso` `sdk` `rente` `garde`

Titre PR : `Ville <quartier> — <pièce>`

Cursor Cloud agents use `cursor/<piece>`. Carl still squashes. One PR per repo.

`ai/<piece>` : roster / swarm identity. Une entrée dans `schema/agents.json`, pas un fork de `mesh.v0`. Carl squash-merge seulement — jamais fast-forward. Jamais auto-merge. Jamais main par une IA.

`grok/auto-*` : commits SSH signés via `.github/workflows/grok-signed-commit.yml`. Carl squash-merge seulement — jamais fast-forward. Jamais auto-merge. Jamais main par Grok.

`grok/optimize-*` : scan perf+structure via `.github/workflows/grok-optimize.yml` (dispatch **et** cron nocturne America/Toronto). Commits SSH signés. Chemins sensibles exclus. Vide → pas de PR. Carl squash-merge seulement — jamais fast-forward. Jamais auto-merge. Jamais main par Grok.

## Validation

GitHub : `.github/workflows/branche.yml` (le mobile n'a pas de hook).
Local :

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-push
```

unforge reste `bloc/<lettre>-<verbe>` — l'usine squash `bloc/*`.
Ne pas renommer l'historique.
