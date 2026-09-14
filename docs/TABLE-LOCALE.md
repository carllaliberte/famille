# Table locale — trace P0

Date : 2026-09-14. Provenance : SHA `5da51a8` (origin/main, merge #429).

Carl squash/merge. DISPATCH=NO. Crédits cloud = 0.

## État mesuré

- SHA_MAIN = `5da51a8`
- `.github/swarm/review.mjs` : 27191 octets, pas PLACEHOLDER, pas stub 12 o
- `xai.model` = `grok-2` · `grok46.model` = `grok-4.6` · `local.model` = `llama3.2`
- cloud = **PAUSE crédits** · REAL_RESPONSE=0 (dernière course swarm [34876044826](https://github.com/carllaliberte/famille/actions/runs/34876044826), SHA `c23ce6f`, plus vieux que ce main)
- parallèle Ollama ×3 = **interdit**
- table visée = séquentiel A→B→C (texte de A dans B)
- VERT ≠ CORRECT · DEFINED ≠ EXECUTED · Job GitHub ✓ ≠ REAL

## Machine de ce tour (Build, pas Quantum)

- daemon `127.0.0.1:11434` : HTTP 200
- modèles **vus** : `llama3.2:latest`
- modèles **non vus ici** : gemma2:2b, qwen2.5:1.5b (ne pas les inventer)

## File du chantier

1. **P0** — cette trace
2. **P1** — contrat/tests `siege()` : déjà sur main (#429). REAL=1 ssi HTTP 2xx + texte
3. **P2** — `node scripts/warm-one.mjs` — séquentiel, N présents (pas ×3)
4. **P3** — UX README (chemin 30 s déjà ; recette locale pas encore)

## Essayer en 3 commandes

```bash
npm test
node scripts/warm-one.mjs --ci    # skip si daemon DOWN (CI verte)
node scripts/warm-one.mjs         # 1 modèle à la fois ; exit 1 si DOWN
```

Pas LIVE. Pas de pont public. Pas de 127.0.0.1 dans Secrets GitHub.
review.mjs n’est pas modifié par cette trace.
