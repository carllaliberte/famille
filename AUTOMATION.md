# Automation

Structure. Pas un script d'agent. Carl squash / merge. Jamais main automatique.

## Rôles

| Qui | Fait | Ne fait pas |
|---|---|---|
| Grok | 1 PR par trou, met à jour FILE.md | merge, wrangler login |
| Claude / Gemini / ChatGPT / DeepSeek | revue d'une URL publique | nœud, PRÉSENT, secret |
| Carl | squash, merge, secret CF, Run workflow | — |

## Pages

- Board : FILE.md
- Accueil : CONNECT.md
- Doctrine : AGENTS.md

## Boucles

1. Quotidien Grok : lire FILE.md + issues ouvertes. Au plus une PR. Mettre FILE.md à jour.
2. CI : tests sur push / PR. Rouge = ne pas merger.
3. Deploy acorn-juge : workflow_dispatch seulement, secret CLOUDFLARE_API_TOKEN. Carl tape Run sur le cell.

## Interdit

Auto-merge. Push main. PRÉSENT. QUANTUM. Consommation MESURE. Nouveau .grok.me. Token dans le repo. Page qui donne des ordres aux IA.

## Collage (revue)

Une phrase + une URL. Exemple :

Peux-tu lire FILE.md et dire si le tableau Ouvert est juste ?
https://raw.githubusercontent.com/carllaliberte/famille/main/FILE.md

Pas de format LU imposé. 403 → coller le texte.
