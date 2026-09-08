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
Mode unique : `COLLECTIVE_COGNITION` ([COGNITION.md](COGNITION.md)). Consensus n'est pas la vérité. Aucune IA n'est juge.
`claude` = guest déclaré (LU). `chatgpt` `gemini` `deepseek` `sonnet` = identités keyed : commentent seulement si secret Actions. Déclaré ≠ connecté. Jamais ACTIVE sans canal.
Passe du swarm : chaque identité dépose une enveloppe selon specialty (kind + caps), pas un `if (id)`. Pas une API. Pas LIVE. Carl s'abstient (juge).
Siège locked : pas d'usurpation (`FROM_NOT_ACTOR`). Invité = id sur le fil. LIVE VERIFIED exige l'acteur GitHub `carllaliberte`.
Grok est branché 24/7 : PR ouverte / mergée / commentaire → chef répond. Boucle horaire, toute la nuit, America/Toronto. 1 PR max par heure. Carl merge.
Swarm commente si les secrets Actions **de famille** existent.
Run 34287383767 : waterfall xAI `grok-2`→`grok-2-mini` (400 skip). Gemini natif 503 / OpenRouter 402. `:free` 404. Exit 0. Carl les pose dans Settings → Secrets.
Carl n'est plus le messager.

### Flux sécurisé — toutes les IA, y compris à venir

Même rivière. Même verrou. Une IA nouvelle rejoint par id, pas par un fork.

1. Secrets = GitHub Settings (Repository) de **ce** repo. Jamais git. Jamais ce fichier. Jamais un prompt.
2. Noms : `GEMINI_API_KEY` `OPENROUTER_API_KEY` `XAI_API_KEY` (+ `ANTHROPIC_API_KEY` `OPENAI_API_KEY` `DEEPSEEK_API_KEY` optionnels).
3. Cascade : natif d'abord. OpenRouter si le natif flanche. Skip 400/402/403/404/429/503. Exit 0. Le flux ne s'arrête pas.
4. xAI siège `xai` (pas chef grok) : `grok-2` → `grok-2-mini`.
5. Collège OpenRouter : `google/gemini-2.5-flash` · `deepseek/deepseek-r1:free` · `meta-llama/llama-3.3-70b-instruct:free` · `qwen/qwen-2.5-72b-instruct:free`.
6. Jamais merge automatique. Carl squash. LIVE VERIFIED = Carl.

### Présence — ne pas fusionner

| Mot | Veut dire | Ne veut pas dire |
|---|---|---|
| DECLARED | une ligne dans `schema/agents.json` | une API, une clé, un deploy |
| CONNECTED | canal réellement disponible (secret Actions **en Settings**, ou runtime attesté) | le registre |
| ACTIVE | a déposé dans une session, canal réellement disponible | une inscription |
| AVAILABLE | swarm a pu appeler ce provider dans un run | une inscription |
| TEST VERIFIED | grade CI ou Carl | LIVE |
| LIVE VERIFIED | Carl seulement, acteur `carllaliberte` | un consensus, un test, une IA |

Clés Actions : `GEMINI_API_KEY` `OPENROUTER_API_KEY` `XAI_API_KEY` posées (Settings). Natives Anthropic / OpenAI / DeepSeek encore vides. Gemini a commenté (HTTP 200 antérieur). xAI slugs `grok-2` / `grok-2-mini` = 400. `:free` OpenRouter = 404. Jamais LIVE.

### Pool de cognition

Mode unique : [`COGNITION.md`](COGNITION.md) + [`schema/cognition.v0.json`](schema/cognition.v0.json).
Couche session : [`schema/pool.v0.json`](schema/pool.v0.json) + [`.github/swarm/pool.mjs`](.github/swarm/pool.mjs). Pas un deuxième mesh. Pas un deuxième cerveau. Pas un juge.

Cycle : question gelée → pensée indépendante (isolée) → débat / cross-critique → synthèse (consensus, désaccord, preuves, hypothèses, incertitude) → lesson datée → revalidation.
IDENTITY + CAPABILITIES + CHANNEL + PROVENANCE. Pas `if (id === "claude")`. Une nouvelle IA conforme entre sans refonte.
Majorité ≠ vérité. Les désaccords restent. Une certitude a une date de fin.
Sans credential : **DECLARED — CHANNEL NOT PRESENT**. ACTIVE = a déposé une enveloppe LU dans la session. CONNECTED seulement si le caller atteste un secret. LIVE VERIFIED = Carl.

## Ouvert

FLAG (stood) : Soft FLAGS Carl-only — natives Anthropic/OpenAI/DeepSeek absentes ; crédits OpenRouter 402 ; xAI slugs 400 ; cron Cursor cut ; acorn-juge grok.me 404 HOLD (workers.dev) ; deploy wrangler Carl-only.

| Dépôt | Item | Fait |
|---|---|---|
| famille | clés Actions | GEMINI + OPENROUTER + XAI posées. Natives 3 encore vides. Skip ≠ crash. |
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
