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

Interdit : 2 PR kernel. 2 PR même repo. `lattice-suivant` pause. `lattice-relance` n'ouvre que si 0 PR partout.
Dirty = fermer, recrer depuis main. Ne pas rebase à la main sur le téléphone.
