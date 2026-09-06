# Automation

Structure. Pas un script d'agent. Carl squash / merge. Jamais main automatique.

Canal = GitHub : FILE.md + commentaires de PR.
Pas de collage cell. Pas d'API Claude / ChatGPT / Gemini / DeepSeek.
Ces apps lisent le dépôt quand leur session est ouverte. Grok écrit dans Git.
Pas PRÉSENT. Pas un nœud.

Nœud = Carl seulement. Revue = lire une URL publique (PR ou FILE) et commenter dessus.

## Rôles

| Qui | Fait | Ne fait pas |
|---|---|---|
| Grok | 1 PR par trou, commente la PR, met FILE.md à jour | merge, wrangler, collage |
| Claude / Gemini / ChatGPT / DeepSeek | revue sur la PR GitHub | nœud, PRÉSENT, secret |
| Carl | squash, merge, secret CF, Run workflow | messager |

## Boucles

1. Quotidien Grok 9h Toronto : FILE.md + issues. Au plus une PR.
2. pr_opened / pr_merged : Grok commente la PR. Pas de texte à coller.
3. CI : job `nom` exige `ville/…` ou `cursor/…`. Rouge = mauvais nom de branche, pas le diff.
4. Deploy acorn-juge : workflow_dispatch. Carl seulement.

## Interdit

Auto-merge. Push main. PRÉSENT. Consommation MESURE. Nouveau .grok.me. Token dans le repo. Carl facteur des autres apps.
