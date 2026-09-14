# Remplacement Build

Date : 2026-09-14. SHA_MAIN `b3fe0cf`.
Le sandbox Grok Build ne porte plus la table locale. Le contrat vit dans Git.

Carl squash/merge. Les trois préparent des PR **draft**. Aucun ne merge.
DISPATCH=NO. Crédits cloud = 0. Pas de LIVE.

| | Cursor | Codex | Quantum | Carl |
|---|---|---|---|---|
| Siège | IDE Cursor | IDE/CLI OpenAI, clone authentifié | machine bot + Ollama | juge |
| Merge | jamais | jamais · `gh pr --draft` | jamais | squash seulement |
| P0 | [prompts/P0.md](prompts/P0.md) | [prompts/CODEX.md](prompts/CODEX.md) | P0 + `/api/tags` ici | relit main |
| P1 | **pas maintenant** | **pas maintenant** | pas de tests morts sur le bot | merge si CI verte |
| Cloud | aucun appel payant | aucun | aucun | crédits, secrets, dispatch |
| `review.mjs` | ne pas stub | ne pas stub (sauf ordre +6 grok46) | ne pas stub | seul squash |
| PAT / secrets | jamais dans Git | jamais dans Git | jamais dans Git | Settings |
| 127.0.0.1 | jamais Actions | jamais Actions | bot ≠ runner | URL publique s’il en existe une |

MIT = protocoles listés dans ce dépôt. Acorn / UNFORGE / nœuds QUANTUM hors MIT.
VERT ≠ CORRECT. DEFINED ≠ EXECUTED. Job ✓ ≠ REAL_RESPONSE.
