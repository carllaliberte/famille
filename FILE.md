# File — 2026-09-05

Tableau de chantier. Pas un script. Pas un nœud. Carl squash / merge.

Carl n'a que le cell. Wrangler login n'est pas possible ici.
Secret Cloudflare : pas encore posé. Donc pas de deploy.

## Ouvert

| Dépôt | Item | Fait |
|---|---|---|
| ancrage-protocol | issue #5 — test sidecar ≠ flock LOCK_EX | `#6` mergée mais le test n'est pas dans `tests/` sur main. `test_ecrire_sidecar_lock` vérifie encore `.lock` existe. |
| acorn-juge | issue #3 — GET /juge STATUS | Worker code = 400 lie. Vitrine grok.me = 404 HTML. Manque deploy + bind. |
| acorn-juge | deploy depuis le cell | PR à ouvrir : workflow_dispatch + secret `CLOUDFLARE_API_TOKEN`. Pas de token dans le repo. |

## Fermé (code)

mesure-protocol#4 sha_sur. ancrage#4 flock ecrire. unforge-check oubli flock + jail + lock carte.
Porte 60s déjà sur unforge-check main.

## Qui peut aider (revue, pas signature)

| Sujet | URL |
|---|---|
| Trou test ancrage | https://github.com/carllaliberte/ancrage-protocol/issues/5 |
| Tests sur main | https://github.com/carllaliberte/ancrage-protocol/blob/main/tests/test_physics_locks.py |
| /juge | https://github.com/carllaliberte/acorn-juge/issues/3 |
| oubli | https://raw.githubusercontent.com/carllaliberte/unforge-check/main/oubli.py |
| press | https://raw.githubusercontent.com/carllaliberte/unforge-check/main/press.py |

Une revue = citer le fichier et dire si le trou est encore là. Pas d'ordre caché dans cette page.
