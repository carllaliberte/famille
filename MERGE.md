# Fusion

Carl squash. L'usine ouvre **une** suivante. Jamais deux.

```
PR ouverte → CI verte → Carl squash
                 → pr_merged
                      → SI déjà 1 PR ouverte sur CET immeuble : stop
                      → SINON ouvrir 1 PR
```

| Immeuble | Branche | Qui merge | Qui ouvre la suivante |
|---|---|---|---|
| unforge | `bloc/*` | Carl | `unforge-bloc-suivant` seulement |
| famille + rails | `ville/*` | Carl | `lattice-merge` seulement |
| Dependabot | n'importe | workflow | — |

## Fichiers froids (kernel)

Ne plus réécrire à chaque lettre :
- `BLOC.md`
- `FEED.md`

Nouvelle commande CLI = `quantum/cli_<nom>.py` + 2 lignes dans `__main__.py`.
Dirty = fermer, recrer depuis main. Pas de rebase téléphone.

Interdit : 2 PR kernel. 2 PR même repo. `lattice-suivant` pause.
