# LIVE

LIVE n’est pas un écran. LIVE est une mesure reproduite.

Un thread Python, un `random.uniform`, un hash SHA3, un `print` « tableau de bord » — ce n’est pas un déploiement. C’est du théâtre. Interdit dans ce dépôt.

## Pouls accepté

Lu sur un run GitHub du swarm, pour un canal nommé :

- MODEL
- HTTP
- REAL_RESPONSE (0 ou 1)
- erreur fournisseur si HTTP ≠ 200

Pas de pouls inventé. Pas de « entropy ». Pas de ledger local qui se prend pour un cortex.

## Déploiement accepté

- code sur main, lu, pas un stub
- CI `build-verify` vert
- squash Carl
- ensuite seulement un `workflow_dispatch` identique à la référence

`PRÊT POUR LA PRODUCTION` ne s’écrit pas dans un script. Carl le dit, ou ça n’est pas dit.

## Voir l’état sans mentir

```bash
node scripts/hold-dashboard.mjs
```
