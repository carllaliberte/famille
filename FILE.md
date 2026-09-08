# File — 2026-09-08

Tableau de chantier. Pas un script. Pas un nœud. Carl squash / merge.

## Live

Juge : https://acorn-juge.laliberte22.workers.dev/juge
ε=0 → 400 JSON `Error margin zero is a lie`.
Deploy Actions : vert (run 13).
Garde landing : docs/index.html sur main (#16).

OTS : [PR #218](https://github.com/carllaliberte/famille/pull/218) + [#221](https://github.com/carllaliberte/famille/pull/221) mergées. Dernière preuve `.ots-anchor/` — OTS actif pending (upgrade). Échec de stamp → issue `ots-anchor-status`.

## Canal

Collage apps = mort.
Canal = commentaires de PR + FILE.md.
FILE.md est un état, pas un canal. Source structurée = `schema/mesh.v0.json` (`acorn.v0`) + n° de PR + SHA. Pas un journal stigmergique. Pas d'instruction.
Mesh IA = enveloppe `acorn.v0` (même fil qu'acorn-juge). Pas `schema/flux.v0.json`.
Identités mesh : [schema/agents.json](schema/agents.json). Id ouvert, pas un enum. Une IA rejoint par son identifiant. LIVE VERIFIED = Carl seulement.
Roster élargi : généralistes + spécialistes, même geste. Astra / Codex restent guests. Pas de juge IA.
`claude` = guest déclaré (LU). `chatgpt` `gemini` `deepseek` `sonnet` = identités keyed : commentent seulement si secret Actions. Déclaré ≠ connecté.
Siège locked : pas d'usurpation (`FROM_NOT_ACTOR`). Invité = id sur le fil. LIVE VERIFIED exige l'acteur GitHub `carllaliberte`.
Grok est branché 24/7 : PR ouverte / mergée / commentaire → chef répond. Boucle horaire, toute la nuit, America/Toronto. 1 PR max par heure. Carl merge.
Swarm commente si les secrets Actions **de famille** existent.
Run 34011475204 : skip (clés vides). Carl les pose dans Settings → Secrets.
Carl n'est plus le messager.

### Présence — ne pas fusionner

| Mot | Veut dire | Ne veut pas dire |
|---|---|---|
| DECLARED | une ligne dans `schema/agents.json` | une API, une clé, un deploy |
| CONNECTED | `connectAgent` runtime, ou secret Actions présent **en Settings** | le registre |
| AVAILABLE | swarm a pu appeler ce provider dans un run | une inscription |
| TEST VERIFIED | grade CI ou Carl | LIVE |
| LIVE VERIFIED | Carl seulement, acteur `carllaliberte` | un test, un comment, une IA |

Clés Actions : absentes. Donc chatgpt / gemini / deepseek / sonnet sont **déclarés / keyed**, pas connectés, pas available. `claude` est **déclaré** guest. Jamais LIVE.

## Ouvert

FLAG (stood) : Soft FLAGS Carl-only — clés Actions absentes ; cron Cursor cut ; acorn-juge grok.me 404 HOLD (workers.dev) ; deploy wrangler Carl-only.

| Dépôt | Item | Fait |
|---|---|---|
| famille | clés Actions | absentes. Sans elles sonnet/chatgpt/deepseek/gemini ne commentent pas. |
| famille | cron Cursor | legal-hourly / quantum-daily = Cursor cloud agents. Carl coupe le cron côté Cursor. |
| acorn-juge | issue #3 grok.me | 404 HOLD. Pas la zone de Carl. Canal = workers.dev. |
| acorn-juge | deploy wrangler | Carl-only. |

## Fermé

garde #15 offre, #16 landing a11y. Token deploy Run 13. famille#143/#149/#158/#162.
26 issues bruit not_planned (legal-hourly / quantum-daily). #89 bots-cold-start déjà sur main.
ancrage #7. mesure#4.
acorn-juge #9 SDK isCalendarDay (famille#168).
unforge-check #1 / #22 share sheet Web Share + copy fallback (f2456aa).
HORIZONS Moyen 2026-09-06 : unforge-check #24 CI VERT/ROUGE badge (4003c8c).
unforge-press #30 MESURE kit (96bf1cf) ; #31 ANCRAGE re-press (6d7730c) ; #32 carte de poche (a12ae1f).
garde #19 listed attacks refuse (9f0414e).
formal-layer #8 obligations only (3f58284).
unforge-retract #19 Loi 25 retract documenté (2aa43a3).
Jalon 1 MERGED / Carl squash : unforge-retract #20 (995dc1b) ; mesure-protocol #5 (4b71a04) ; unforge-press #33 (35cedfa) ; unforge-check #25 (500158a) ; unforge-press #34 (fc665ce).
Jalon 2 : unforge-check #26 MERGED (4e4e597).
Jalon 3 : famille#186 mesh forbid next/instruction (e7dc1d2). FORBIDDEN_NEXT + schema.
Jalon 4 : acorn-juge#22 Worker validation matrix + tests MERGED (74733d2).
Jalon 5 : horizon-protocol#7 Horizon Watch surveiller MERGED (37eaf56).
famille#239 expanded swarm MERGED. Roster générique, `ai/` prefix.
famille#224 plagiat-watch canaris MERGED (259f1fc). dispatch Carl, PR pas main.
famille#218 ots-anchor MERGED ; famille#221 ots-hardening MERGED (313215a). Spec `unforge-check/OTS.md`. Exception `ots-bot`. Preuve ACTIF pending upgrade.
famille#222 license-options MERGED. Deux candidats `LICENSE.option-open` (MIT) / `LICENSE.option-closed` (ARR). Pas de rename en `LICENSE`. NOTICE.md = provenance, pas une position juridique.
famille#227 offre non daté MERGED (49b27e1). On n'enlève pas le juge. On enlève le tampon à vide.

## Licence (nouveautés)

MIT sur le code public (LICENSE). © 2026 Carl Laliberté, Québec. Marques GARDE / FAMILLE réservées. Nœud interne : hors Git, pas MIT.

Pas d'ordre dans cette page. L'état seulement.
