# Table locale — trace P0

Date : 2026-09-14. Provenance : SHA `b3fe0cf` (origin/main, merge #432).

Carl squash/merge. DISPATCH=NO. Crédits cloud = 0.
Build (Grok sandbox) **n’est plus le siège** : Cursor, Codex et Quantum reprennent ce contrat.

## État mesuré

- SHA_MAIN = `b3fe0cf`
- `.github/swarm/review.mjs` : 27191 octets, pas PLACEHOLDER, pas stub 12 o
- `xai.model` = `grok-2` · `grok46.model` = `grok-4.6` · `local.model` = `llama3.2`
- cloud = **PAUSE crédits** · DISPATCH=NO · REAL_RESPONSE=0 (swarm [34876044826](https://github.com/carllaliberte/famille/actions/runs/34876044826), SHA `c23ce6f`)
- parallèle Ollama ×3 = **interdit**
- table visée = séquentiel A→B→C (texte de A dans B)
- VERT ≠ CORRECT · DEFINED ≠ EXECUTED · Job GitHub ✓ ≠ REAL

## Machine de ce tour

non exécuté (pack docs). Dernière vue Build, ne pas la fusionner avec Quantum : `llama3.2` ● · gemma2 / qwen2.5 non vus sur Build.

## File du chantier

1. **P0** — cette trace + pack remplacement Build
2. **P1** — contrat/tests morts `siege()` — déjà sur main (#429) — **ne pas ré-exécuter maintenant**
3. **P2** — `warm-one.mjs` séquentiel — déjà sur main (#431)
4. **P3** — UX recette README — pas encore

Prompts : [P0.md](prompts/P0.md) · [P1.md](prompts/P1.md) (ne pas exécuter maintenant) · [CODEX.md](prompts/CODEX.md).
Rôles : [BUILD-REPLACEMENT.md](BUILD-REPLACEMENT.md).

Pas LIVE. Pas de pont public. Pas de `127.0.0.1` dans Secrets GitHub.
`review.mjs` n’est pas modifié par cette trace.
