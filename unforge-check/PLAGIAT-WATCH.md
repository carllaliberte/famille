# Plagiat-watch — détection, pas prévention

Le public se copie. Rien ici n'empêche une copie.
OTS date un SHA (notaire). Ce rail détecte une copie quasi-verbatim (radar).
Pas de DRM. Pas d'obfuscation. Pas de watermark caché. Pas de scan privé.
Pas de Copyleaks. Pas de cron. Pas de DMCA automatique.
Pas une 2e exception AUTOMATION.md. `ots-bot` ne touche pas ce rail.

Carl déclenche. `workflow_dispatch` seulement. Une PR, pas `main`.
Identité : `github-actions[bot]`, jamais `ots-bot`.

Branche : `docs/plagiat-watch`. `bloc/` est le nom unforge ;
CI famille `nom` n'accepte que `ville/…|cursor/…|docs/…|schema/…`.

Canaris = chaînes déjà publiques et rares, en clair. On n'invente pas de secret.

## Canaris

| # | Chaîne | Où |
|---|---|---|
| 1 | `famille.juge.v0` | `schema/juge.v0.json` titre |
| 2 | `Error margin zero is a lie` | canal / FILE.md |
| 3 | `const id = "preview00001"` | `canal/worker.js` (`preview00001` nu = bruit NuGet) |
| 4 | `Les certitudes ont une date de fin.` | README / packs |
| 5 | `Ancrage, pas coffre magique` | PHILOSOPHIE.md |

Requête : `"<chaîne>" NOT user:carllaliberte`. Public seulement.

## Dernier scan

Premier scan : Grok (`gh search code`), 2026-09-08T13:04Z.
GitHub n'expose `workflow_dispatch` qu'une fois le YAML sur `main` (limitation plateforme, pas un cron). Carl squash, puis Run workflow.

<!-- plagiat-watch:start -->
Date UTC : `2026-09-08T13:04Z`
Source : Grok (`gh search code`). Actions rejoue au dispatch Carl.

| Date UTC | Canari | Requête | Hors `user:carllaliberte` | URL |
|---|---|---|---|---|
| 2026-09-08T13:04Z | `famille.juge.v0` | `"famille.juge.v0" NOT user:carllaliberte` | RAS | — |
| 2026-09-08T13:04Z | `Error margin zero is a lie` | `"Error margin zero is a lie" NOT user:carllaliberte` | RAS | — |
| 2026-09-08T13:04Z | `const id = "preview00001"` | `"const id = \"preview00001\"" NOT user:carllaliberte` | RAS | — |
| 2026-09-08T13:04Z | `Les certitudes ont une date de fin.` | `"Les certitudes ont une date de fin." NOT user:carllaliberte` | RAS | — |
| 2026-09-08T13:04Z | `Ancrage, pas coffre magique` | `"Ancrage, pas coffre magique" NOT user:carllaliberte` | RAS | — |

**RAS — aucun hit hors user:carllaliberte**
<!-- plagiat-watch:end -->

Un 403 search n'est pas un RAS. Le job échoue. Il n'écrit pas d'absence fictive.
