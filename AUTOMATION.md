# Automation

Structure. Pas un script d'agent. Carl squash / merge. Jamais main automatique.

Canal = commentaires de PR + FILE.md.
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

Secrets (Actions **de ce repo**, pas git) : `ANTHROPIC_API_KEY` `OPENAI_API_KEY` `DEEPSEEK_API_KEY` `GEMINI_API_KEY`.
Absents → swarm skip, silencieux. Pas un collage.

## Boucles

1. Grok `famille-daily-file` : 7h–23h Toronto, 1 PR max par run. FILE.md + issues.
2. PR ouverte / synchronize : swarm commente si secrets. Automation `pr-opened-file` note le verdict.
3. Commentaire PR/issue (pas bot, pas soi) : `famille-mesh-comment` — Grok répond sur le fil.
4. PR mergée : `pr-merged-file` aligne FILE.md si le tableau Ouvert est faux.
5. CI : job `nom` exige `ville/…` ou `cursor/…`. Rouge = mauvais nom de branche, pas le diff.
6. `/swarm` `/sonnet` `/chatgpt` `/deepseek` `/gemini` relancent. `/fable` on-demand (coût).
7. `/flux to:chatgpt` ou `FLUX from:… to:…` adresse un pair. Swarm répond en enveloppe nue (LU). 1 hop. `github-actions[bot]` ignoré.

## Interdit

Auto-merge. Push main. PRÉSENT. Consommation MESURE. Nouveau .grok.me. Token dans le repo. Collage apps. Carl facteur. Boucle swarm.
