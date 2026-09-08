# Automation

Structure. Pas un script d'agent. Carl squash / merge. Jamais main automatique.

Canal = commentaires de PR + FILE.md.
FILE.md = état lisible. Pas un canal d'instruction. Vérité structurée machine-à-machine = enveloppe `acorn.v0` (`schema/mesh.v0.json`) + n° de PR + SHA. Commentaires = append-only. Un `from` par enveloppe.
Grok ouvre la PR. `.github/workflows/swarm.yml` commente SI les secrets Actions existent.
Grok répond aussi aux commentaires (automation `famille-mesh-comment`).
Carl n'est plus le messager. Plus aucun texte à porter dans Claude, ChatGPT, Gemini ou DeepSeek.

Pas PRÉSENT. Pas un nœud. Jamais wrangler ici. Jamais merge automatique.
Nœud = Carl seulement.

Contrat IA : [INTEROP-IA.md](INTEROP-IA.md) — carte juge ≠ mesh `acorn.v0`.

## Rôles

| Qui | Fait | Ne fait pas |
|---|---|---|
| Grok | 1 PR par trou, FILE.md, ouvre la PR, répond au mesh | merge, wrangler, collage, messager |
| swarm | enveloppe nue `acorn.v0` si secrets ; 1 hop | merge, wrangler, secret dans git, se relancer |
| Claude / Gemini / ChatGPT / DeepSeek | revue / `/flux` sur la PR | nœud, PRÉSENT, collage |
| invité sans clé | LU sur la PR | nœud |
| Carl | squash, merge, secrets Actions, coupe cron Cursor | messager |
| ots-bot | commit `.ots-anchor/**` + bloc `ots-status` dans `unforge-check/OTS.md` après push `main` | merge, squash, juger, signer, PR, FILE.md |
| grok-sign | `workflow_dispatch` → branche `grok/auto-*`, commit SSH signé, PR | merge, squash, push `main`, tampon à vide |
| grok-optimize | `workflow_dispatch` → scan perf+structure, HOLD chemins sensibles, branche `grok/optimize-*`, commit SSH signé, PR | merge, squash, push `main`, tampon à vide, toucher `unforge-check/` `schema/` `mesure-protocol/` `action.yml` |

Secrets (Actions **de ce repo**, pas git) : `ANTHROPIC_API_KEY` `OPENAI_API_KEY` `DEEPSEEK_API_KEY` `GEMINI_API_KEY`.
Absents → swarm skip, silencieux. Pas un collage.

Secrets signature Grok (Actions, pas git) : `GROK_SIGNING_KEY` `GROK_SIGNING_KEY_PUB` `GROK_GIT_NAME` `GROK_GIT_EMAIL`.
Absents → `grok-signed-commit.yml` / `grok-optimize.yml` rouge. Pas de PR vide. Clé publique aussi : GitHub → Settings → SSH and GPG keys → Signing Key.

## Boucles

1. Grok `famille-24h-chef` : horaire 24/7 America/Toronto, 1 PR max par run. FILE.md + issues.
2. PR ouverte / synchronize : swarm commente si secrets. Automation `pr-opened-file` note le verdict.
3. Commentaire PR/issue (pas bot, pas soi) : `famille-mesh-comment` — Grok répond sur le fil.
4. PR mergée : `pr-merged-file` aligne FILE.md si le tableau Ouvert est faux.
5. CI : job `nom` exige `ville/…` ou `cursor/…` ou `docs/…` ou `schema/…` ou `grok/auto-YYYYMMDD-HHMMSS` ou `grok/optimize-YYYYMMDD-HHMMSS`. Rouge = mauvais nom de branche, pas le diff.
6. `/swarm` `/sonnet` `/chatgpt` `/deepseek` `/gemini` relancent. `/fable` on-demand (coût).
7. `/flux to:chatgpt` ou `FLUX from:… to:…` adresse un pair. Swarm répond en enveloppe nue (LU). 1 hop. `github-actions[bot]` ignoré.
8. Carl `workflow_dispatch` `grok-optimize.yml` : scan, rapport, HOLD si vide ou sensible, PR `grok/optimize-*`.

## Branche `grok/auto-*` — commit SSH signé, jamais main

Grok ne pousse plus sur `main`. Il prépare le geste sur une branche `ville/*` / `docs/*` / `cursor/*` / `schema/*`, puis déclenche `.github/workflows/grok-signed-commit.yml` (`workflow_dispatch`, `source_ref` + `commit_message`).

Le job crée `grok/auto-YYYYMMDD-HHMMSS`, recommit le diff contre `main` **signé SSH**, pousse, ouvre la PR. Carl squash-merge. **Jamais fast-forward.** Jamais auto-merge. Jamais un tampon à vide (`source_ref` vide ou diff vide → HOLD, pas de PR).

OTS pré-merge : **pending seulement**. Confirmation pas instantanée (délai Bitcoin). Le `.ots` n'entre **pas** dans l'arbre (ne pollue pas le squash). Artefact + commentaire de PR. L'ancrage **canonique** reste `ots-bot` **après** squash sur `main`.

Activation : squash **explicite** de Carl de la PR qui introduit le YAML **et** secrets posés. Pas implicite.

## Branche `grok/optimize-*` — scan, commit SSH signé, jamais main

Grok ne pousse pas sur `main`. Carl déclenche `.github/workflows/grok-optimize.yml` (`workflow_dispatch`, `scope` + `commit_message`).

Le job exige les secrets de signature, lance `scripts/optimize-scan.mjs` (déterministe, pas un LLM), refuse tout diff sur `unforge-check/` `schema/` `mesure-protocol/` `action.yml` (HOLD, REVUE.md obligatoire), refuse un diff vide (pas de tampon à vide), crée `grok/optimize-YYYYMMDD-HHMMSS`, commit **signé SSH**, pousse, ouvre la PR. Carl squash-merge. **Jamais fast-forward.** Jamais auto-merge.

Application mécanique : seulement `scripts/` et `test/`. Doctrine, schémas, workflows : rapport seulement.

Activation : squash **explicite** de Carl de la PR qui introduit le YAML **et** secrets posés. Pas implicite.

## Exception mécanique — ots-bot

Carl squash / merge reste la règle. Jamais un merge automatique.

Une seule exception, mécanique, **après** le squash de Carl :

Le workflow `.github/workflows/ots-anchor.yml` s'exécute **uniquement** sur `push` vers `main` (jamais sur une PR, jamais sur une branche de travail). Il écrit le SHA mergé dans `.ots-anchor/latest.sha`, le soumet aux calendriers OpenTimestamps **pinnés dans le YAML** (`ots stamp -c …`, sans attendre la confirmation), et `ots-bot` (identité git dédiée, pas le compte de Carl) commit `.ots-anchor/latest.sha.ots` avec le message `ots: anchor <sha>`.

Ce commit n'est pas un squash. Ce n'est pas un merge. Ce n'est pas un jugement.

Le cron `.github/workflows/ots-upgrade.yml` tente ensuite de finaliser les preuves pending (`ots upgrade`) et recommit les `.ots` mis à jour **et** le bloc `<!-- ots-status:start -->` / `<!-- ots-status:end -->` en tête de `unforge-check/OTS.md`, même identité `ots-bot`, message `ots: upgrade`.

Si les 3 tentatives de `ots stamp` échouent : le job est rouge **et** une étape `if: failure()` ouvre ou commente l'issue `ots-anchor-status` (SHA manqué + lien du run + ligne FILE.md au format `pr-merged-file`). Pas d'email. Pas de Slack. `ots-bot` ne commit pas FILE.md.

Activation : ces workflows n'existent sur `main` qu'après squash **explicite** de Carl. Squasher la PR qui les introduit = lever cette exception. Pas une activation implicite. Pas un secret tiers. Pas le compte de Carl.

Si `main` est protégée : Carl autorise `github-actions[bot]` à pousser (bypass de protection). Pas un secret dans le dépôt. Voir inventaire ci-dessous.

ots-bot n'est pas un bot FAMILLE. Un bot = un rail. Ici le rail est OpenTimestamps, notaire externe, calendriers publics gratuits. Pas un L1 Famille. Pas de nœud. Pas PRÉSENT.

Spec : [unforge-check/OTS.md](unforge-check/OTS.md).

## Identité github-actions[bot] — inventaire

Un bypass de branch protection GitHub s'applique à l'**identité** (`github-actions[bot]`), pas à un chemin de fichier. Tout workflow qui tourne sous cette identité **et** pousse sur `main` hérite du même droit.

Inventaire des workflows sous `.github/workflows/` (HEAD `dced246`, 2026-09-08). Table = YAML qui touchent squash / bypass / tests. Tout autre YAML hors `push` `main` ne pousse pas.

| Fichier | Déclencheur | `permissions` | Acteur | Écrit `main` ? |
|---|---|---|---|---|
| `ots-anchor.yml` | `push` → `main` | `contents: write` + `issues: write` | `github-actions[bot]` (commit git `ots-bot`) | **oui** — `.ots-anchor/**` |
| `ots-upgrade.yml` | cron `17 11 * * *` + `workflow_dispatch` | `contents: write` | `github-actions[bot]` (commit git `ots-bot`) | **oui** — `.ots-anchor/*.ots` + bloc `ots-status` |
| `swarm.yml` | `pull_request` + `issue_comment` | `contents: read`, `pull-requests: write`, `issues: write` | `github-actions[bot]` | **non** — commentaires PR seulement |
| `branche.yml` | `pull_request` | défaut (lecture) | `github-actions[bot]` | **non** — valide le nom de branche |
| `carte.yml` | `pull_request` + `push` `main` | défaut, `npm test` | `github-actions[bot]` | **non** — tests, pas de `git push` |
| `grok-signed-commit.yml` | `workflow_dispatch` | `contents: write` + `pull-requests: write` | `github-actions[bot]` (commit git `GROK_GIT_NAME`) | **non** — pousse `grok/auto-*` seulement |
| `grok-optimize.yml` | `workflow_dispatch` | `contents: write` + `pull-requests: write` | `github-actions[bot]` (commit git `GROK_GIT_NAME`) | **non** — pousse `grok/optimize-*` seulement |
| *(autre YAML, hors `push` `main`)* | `workflow_dispatch` / PR | — | `github-actions[bot]` | **non** — pas de `git push` sur `main` |

`pr-merged-file` n'est **pas** un workflow Actions. C'est une automation Grok. Pas cette identité.

**Seuls** `ots-anchor.yml` et `ots-upgrade.yml` poussent sur `main`.

### Limite réelle — pas résolue par un PAT

GitHub permet de restreindre un PAT fine-grained **par repo**, pas nativement **par path**. Un PAT dédié `ots-bot` ne ferait pas mieux que le YAML actuel tant que l'inventaire ci-dessus tient : le bypass resterait une identité, pas un glob `.ots-anchor/**`.

Donc : **pas de PAT créé**. Mitigation = cet inventaire, versionné, plus une revue manuelle périodique de `.github/workflows/**`. Tout nouveau `contents: write` + `git push` sur `main` hérite du bypass. C'est un geste de PR, pas un oubli silencieux.

Chemins que `ots-bot` a le droit de committer, noir sur blanc :

- `.ots-anchor/**` (preuves)
- bloc délimité dans `unforge-check/OTS.md` (point 4 — statut pending/complete)

Pas FILE.md. Pas `juge.v0.json`. Pas `flux.v0.json`. Pas un autre workflow.

## Permission nouvelle — `issues: write`

Documentée **avant** activation (squash de cette PR).

`ots-anchor.yml` seulement : `issues: write` pour `gh issue create` / `gh issue comment` / `gh issue reopen` sur l'issue dédiée `ots-anchor-status`. Jeton = `github.token` (pas un secret dans le dépôt, pas une clé tierce). Swarm a déjà `issues: write` pour commenter les PR — pas une extension de swarm.

## Interdit

Auto-merge. Push main. PRÉSENT. Consommation MESURE. Nouveau .grok.me. Token dans le repo. Collage apps. Carl facteur. Boucle swarm.

Exception unique, documentée ci-dessus : `ots-bot` pousse sur `main` les fichiers `.ots-anchor/*` et le bloc `ots-status`, messages `ots: anchor` / `ots: upgrade`. Pas un merge. Pas un squash.

`grok-signed-commit.yml` pousse **uniquement** `grok/auto-*`. Pas `main`. Carl squash-merge. Jamais fast-forward.

`grok-optimize.yml` pousse **uniquement** `grok/optimize-*`. Pas `main`. Carl squash-merge. Jamais fast-forward.
