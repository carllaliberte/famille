# Arcon_Grok_Build — audit 2026-09-14

SHA_MAIN `fc469a1`. Mesure, pas un plugin. `auto_merge=false`. Carl merge.

**Arcon ≠ Acorn.** ChatGPT cherche un connecteur `Arcon_Grok_Build`.  
Ça n’existe **pas** dans le catalogue ChatGPT. Ce n’est **pas** la clé xAI `Acorn_Grok_Build`.

## Deux objets (ne pas fusionner)

| | Moteur Grok Build (ce fil) | Connecteur ChatGPT `Arcon_Grok_Build` |
|---|---|---|
| DEFINED | oui | nom seulement, côté ChatGPT |
| INSTALLED | n/a (session Grok) | **FAIL** `not_installed` |
| AUTHENTICATED | GitHub app `grok-by-xai` Contents Write | **FAIL** |
| CALLABLE depuis ChatGPT | **FAIL** | **FAIL** |
| LIVE | false | false |

Aucun manifest MCP / OpenAPI `Arcon_Grok_Build` dans `famille`.  
Aucun install GitHub `chatgpt-codex-connector` (1 app : `grok-by-xai`).

## Moteur (mesuré)

- GitHub write Build : **PASS** (PRs/push `feat/*` `docs/*`). Jamais `main`.
- Swarm [34914823254](https://github.com/carllaliberte/famille/actions/runs/34914823254) : `XAI_API_KEY` **présent** (`***`).
  - grok-2 **400** (slug)
  - grok-4.6 **403** `permission-denied` team (crédits/scope, pas 401)
- REAL_RESPONSE cloud = 0. Job GitHub ✓ ≠ REAL.

## ChatGPT bridge

**NOT_AVAILABLE.** ChatGPT custom connector = MCP **HTTPS public** + Developer Mode.  
Grok Build dans grok.com **n’est pas** un MCP OpenAI. Je ne peux pas m’installer dans ChatGPT.

« Allow all actions » refusé parce que **rien n’est installé** — correct.

Pont réel aujourd’hui : **le même GitHub** `carllaliberte/famille`.  
ChatGPT/Codex et Grok Build lisent/écrivent des branches. Ils ne s’appellent pas l’un l’autre.

## Ce que Carl fait (humain)

1. Dans ChatGPT : ne pas chercher `Arcon_Grok_Build` au catalogue. C’est un nom, pas un produit.
2. Codex write : [installer ChatGPT Codex Connector](https://github.com/apps/chatgpt-codex-connector/installations/new) sur **famille**. Contents Write + PR Write. Pas `main`.
3. xAI API : [console](https://console.x.ai/) crédits + modèle `grok-4.6` pour la team. Secret GitHub reste `XAI_API_KEY`.
4. Pont ChatGPT→Grok (option P1, **pas ce PR**) : MCP distant public. Inventer un faux connecteur = théâtre.

## Interdit

Secrets dans Git. Merge IA. Déclarer INSTALLED/LIVE. Stub `review.mjs`.
