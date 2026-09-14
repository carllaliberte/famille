# Codex → GitHub write (famille)

Mesure 2026-09-14. SHA_MAIN `fa91621`. Carl squash. `auto_merge=false`.

Deux 403 distincts. Ne pas les fusionner.

## 403 GitHub (Codex)

Preuve mesurée ici :

- Installations GitHub du compte `carllaliberte` : **1** app, `grok-by-xai` (contents:write).
- App `chatgpt-codex-connector` : **absente**.
- Message attendu si Codex écrit sans App Write : `403 Resource not accessible by integration`.
- `main` : **pas** de branch protection (API 404). Ce n’est pas le 403 actuel.
- Identité Build de cette session (`carllaliberte` ADMIN) **peut** pousser `feat/*`. Ça ne prouve pas que Codex le peut.

### Install (Carl)

1. [Installer ChatGPT Codex Connector](https://github.com/apps/chatgpt-codex-connector/installations/new) sur le compte **carllaliberte**.
2. Repos : **famille seulement** (pas `*` sans ordre Carl).
3. Permissions min :
   - Contents: **Write**
   - Pull requests: **Write**
   - Metadata: **Read**
4. Workflows: **Read** seulement, sauf ordre Carl.
5. Jamais Contents Admin, jamais `secrets:write` pour Codex.
6. Si org/SSO : Authorize l’installation.

### Après install

- Codex pousse `feat/*` / `docs/*`. Jamais `main`.
- Carl seul squash/merge.
- 403 si Codex vise `main` → **normal**. Ne pas baisser une protection pour ça.
- Premier test : PR docs-only par Codex, Carl close ou merge.

### Check-list 403 GitHub

- [ ] App Codex installée sur `carllaliberte`
- [ ] repo `famille` selected
- [ ] Contents Write + PR Write
- [ ] SSO authorize si demandé
- [ ] pas de PAT collé dans Git / Drive / chat
- [ ] token/app non expirée

## 403 xAI (pas Codex)

Run `34876044826` : canal `grok46` HTTP **403**. Crédit / scope `XAI_API_KEY`.  
**HOLD humain.** Ne pas « corriger » dans `review.mjs`.

## Interdit

PAT, `OPENAI_API_KEY`, `XAI_API_KEY` dans le repo, un workflow, Drive, ou le chat.  
LIVE Codex. Merge par une IA.
