# Automation

Structure. Pas un script d'agent. Carl squash / merge. Jamais main automatique.

Canal = commentaires de PR + FILE.md.
Grok ouvre la PR. `.github/workflows/swarm.yml` commente SI les secrets Actions existent.
Carl n'est plus le messager. Plus aucun texte à porter dans Claude, ChatGPT, Gemini ou DeepSeek.

Pas PRÉSENT. Pas un nœud. Jamais wrangler ici. Jamais merge automatique.
Nœud = Carl seulement.

## Rôles

| Qui | Fait | Ne fait pas |
|---|---|---|
| Grok | 1 PR par trou, FILE.md, ouvre la PR | merge, wrangler, collage, messager |
| swarm | commente la PR si secrets présents | merge, wrangler, secret dans git |
| Claude / Gemini / ChatGPT / DeepSeek | revue via commentaire de PR | nœud, PRÉSENT, collage |
| Carl | squash, merge, secrets Actions | messager |

Secrets (Actions, pas git) : `ANTHROPIC_API_KEY` `OPENAI_API_KEY` `DEEPSEEK_API_KEY` `GEMINI_API_KEY`.
Absents → swarm skip, silencieux. Pas un collage.

## Boucles

1. Quotidien Grok 9h Toronto : FILE.md + issues. Au plus une PR.
2. PR ouverte / synchronize : swarm commente si secrets. Pas de texte à coller.
3. CI : job `nom` exige `ville/…` ou `cursor/…`. Rouge = mauvais nom de branche, pas le diff.
4. `/swarm` `/sonnet` `/chatgpt` `/deepseek` `/gemini` relancent. `/fable` on-demand (coût).

## Interdit

Auto-merge. Push main. PRÉSENT. Consommation MESURE. Nouveau .grok.me. Token dans le repo. Collage apps. Carl facteur.
