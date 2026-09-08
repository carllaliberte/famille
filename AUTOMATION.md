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
| Invité sans clé | LU sur la PR | nœud |
| Carl | squash, merge, secrets Actions, coupe cron Cursor | messager |
| ots-bot | commit `.ots-anchor/*.ots` après push `main` | merge, squash, juger, signer, PR |

Secrets (Actions **de ce repo**, pas git) : `ANTHROPIC_API_KEY` `OPENAI_API_KEY` `DEEPSEEK_API_KEY` `GEMINI_API_KEY`.
Absents → swarm skip, silencieux. Pas un collage.

## Boucles

1. Grok `famille-24h-chef` : horaire 24/7 America/Toronto, 1 PR max par run. FILE.md + issues.
2. PR ouverte / synchronize : swarm commente si secrets. Automation `pr-opened-file` note le verdict.
3. Commentaire PR/issue (pas bot, pas soi) : `famille-mesh-comment` — Grok répond sur le fil.
4. PR mergée : `pr-merged-file` aligne FILE.md si le tableau Ouvert est faux.
5. CI : job `nom` exige `ville/…` ou `cursor/…`. Rouge = mauvais nom de branche, pas le diff.
6. `/swarm` `/sonnet` `/chatgpt` `/deepseek` `/gemini` relancent. `/fable` on-demand (coût).
7. `/flux to:chatgpt` ou `FLUX from:… to:…` adresse un pair. Swarm répond en enveloppe nue (LU). 1 hop. `github-actions[bot]` ignoré.

## Exception mécanique — ots-bot

Carl squash / merge reste la règle. Jamais un merge automatique.

Une seule exception, mécanique, **après** le squash de Carl :

Le workflow `.github/workflows/ots-anchor.yml` s'exécute **uniquement** sur `push` vers `main` (jamais sur une PR, jamais sur une branche de travail). Il écrit le SHA mergé dans `.ots-anchor/latest.sha`, le soumet aux calendriers OpenTimestamps publics (`ots stamp`, sans attendre la confirmation), et `ots-bot` (identité git dédiée, pas le compte de Carl) commit `.ots-anchor/latest.sha.ots` avec le message `ots: anchor <sha>`.

Ce commit n'est pas un squash. Ce n'est pas un merge. Ce n'est pas un jugement.

Le cron `.github/workflows/ots-upgrade.yml` tente ensuite de finaliser les preuves pending (`ots upgrade`) et recommit les `.ots` mis à jour, même identité `ots-bot`, message `ots: upgrade`.

Activation : ces workflows n'existent sur `main` qu'après squash **explicite** de Carl. Squasher la PR qui les introduit = lever cette exception. Pas une activation implicite. Pas un secret tiers. Pas le compte de Carl.

Si `main` est protégée : Carl autorise `github-actions[bot]` à pousser (bypass de protection). Pas un secret dans le dépôt.

ots-bot n'est pas un bot FAMILLE. Un bot = un rail. Ici le rail est OpenTimestamps, notaire externe, calendriers publics gratuits. Pas un L1 Famille. Pas de nœud. Pas PRÉSENT.

Spec : [unforge-check/OTS.md](unforge-check/OTS.md).

## Interdit

Auto-merge. Push main. PRÉSENT. Consommation MESURE. Nouveau .grok.me. Token dans le repo. Collage apps. Carl facteur. Boucle swarm.

Exception unique, documentée ci-dessus : `ots-bot` pousse sur `main` les fichiers `.ots-anchor/*` seulement, messages `ots: anchor` / `ots: upgrade`. Pas un merge. Pas un squash.
