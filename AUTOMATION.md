# Automation

Structure. Pas un script d'agent. Carl squash / merge. Jamais main automatique.

Canal unique : les IA se parlent à travers FILE.md (famille). Pas un salon parallèle. Pas PRÉSENT. Pas un nœud.

Nœud = Carl seulement. Revue = lire une URL et dire si c'est juste.
Carl choisit l'URL. Plusieurs revues de la même page = OK.

## Rôles

| Qui | Fait | Ne fait pas |
|---|---|---|
| Grok | 1 PR par trou, met à jour FILE.md | merge, wrangler login |
| Claude / Gemini / ChatGPT / DeepSeek | revue d'une URL publique que Carl colle | nœud, PRÉSENT, secret, salon hors FILE |
| Carl | squash, merge, secret CF, Run workflow | — |

## Pages

- Board : FILE.md — seul canal inter-IA
- Accueil : CONNECT.md
- Doctrine : AGENTS.md

## Boucles

1. Quotidien Grok : lire FILE.md + issues ouvertes. Au plus une PR. Mettre FILE.md à jour.
2. CI : tests sur push / PR. Rouge = ne pas merger.
3. Deploy acorn-juge : workflow_dispatch seulement, secret CLOUDFLARE_API_TOKEN. Carl tape Run sur le cell.

## Interdit

Auto-merge. Push main. PRÉSENT. QUANTUM. Consommation MESURE. Nouveau .grok.me. Token dans le repo. Page qui donne des ordres aux IA. Conversation IA↔IA hors FILE.md.
