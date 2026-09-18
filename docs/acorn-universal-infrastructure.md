# Acorn — infrastructure universelle (état réel)

Les certitudes ont une date de fin.

Ce fichier décrit l’état **observé** du noyau `acorn.universal-infrastructure.v1` sur la branche de ce PR. Ce n’est pas LIVE. Ce n’est pas une deuxième architecture.

Cursor consomme le juge. Carl merge. MODE classique : `examples/attest-os.json` n’a ni epsilon ni horizon.

## Réalité de base

- `origin/main` : `b60c30f9` (#868 + #866)
- PR matière : #793 (DIRTY / CONFLICTING, SHA `84b5217`) — lu, pas mergé tel quel
- PR propres déjà ouvertes : #873 (cette tête) · #872 · #875 · #454
- Hôte vitrine : https://acorn-royal-dune-blend.grok.me — GET `/juge` = 404 HTML. 404 ≠ carte juge.
- Canal workers.dev `/juge` : preview, epsilon manquant. Un 200 n’est pas un sceau.

## Ce qui est réutilisé (pas un 2e cerveau)

| Contrat | Module existant |
|---|---|
| Objets / registry | `scripts/acorn-capability-registry.mjs` |
| Adapter + route | `sdk/open-intelligence.js` (étendu, provider-neutral) |
| Exécution graphe | `scripts/acorn-execution-fabric.mjs` |
| Preuves datées | `scripts/acorn-evidence-registry.mjs` |
| Connecteurs | `scripts/acorn-connector-flux.mjs` |
| Marché / Stripe | `scripts/acorn-market-engine.mjs` + `acorn-commercial-runtime.mjs` + `acorn-stripe-adapter.mjs` |
| Constitution | `scripts/acorn-constitution.mjs` |
| Work engine | `scripts/acorn-work-engine.mjs` |
| HTTP live | `live/server.mjs` |

Le noyau `scripts/acorn-universal-infrastructure.mjs` **compose** ces rails. Il n’ouvre pas un 15e service.

## Distinctions tenues

IDENTITY ≠ CAPABILITY ≠ AUTHORITY ≠ PROVENANCE ≠ TRUST  
CAPABILITY ≠ AUTHORITY  
SELF-BUILD ≠ SELF-AUTHORITY  
SIMULATED ≠ EXECUTED  
CONSENSUS ≠ VÉRITÉ  
HTTP ne donne jamais l’autorité.

## Matrice — aucune case par supposition

| Capability | CODE_PRESENT | TESTED | EXECUTED | MEASURED | VERIFIED | LIVE |
|---|---|---|---|---|---|---|
| Contrat d’objet générique | YES | YES local | YES local | YES local | NO | NO |
| Adapter intelligence provider-neutral | YES | YES local | YES local | YES local | NO | NO |
| Composition + graphe + fallback | YES | YES local | YES local (arith) | YES local | NO | NO |
| Capacité absente ≠ équivalent inventé | YES | YES local | YES local | YES local | NO | NO |
| Exécution durable / idempotente | YES | YES local | YES local (mémoire process) | YES local | NO | NO |
| SIMULATION ≠ EXECUTED | YES | YES local | YES local | YES local | NO | NO |
| États de vérité + expiration | YES | YES local | YES local | YES local | NO | NO |
| Valeur / coûts NOT_MEASURED | YES | YES local | YES local | YES (absence mesurée) | NO | NO |
| Mémoire tenant-safe | YES | YES local | YES local | YES local | NO | NO |
| Cognition adversariale | YES | YES local | YES local | YES local | NO | NO |
| Marché + Stripe adapter | YES (#873) | YES local | NO Render | NOT_MEASURED Live | NO | NO |
| API `/api/v1/capabilities` `/compose` | YES | YES local HTTP | YES local | YES local | NO | NO |
| Worker Postgres / Render | CODE_PRESENT | contract | NO | NOT_OBSERVED | NO | NO |
| Inter-organism network | FOUNDATION_ONLY | NO | NO | NOT_OBSERVED | NO | NO |
| Digital twin complet | CONTRAT | YES (flag) | NO monde réel | NOT_MEASURED | NO | NO |
| Carte juge ε+horizon | NO (attest-os trou) | — | — | — | — | NO |

CODE_PRESENT + TEST local ≠ CI TEST VERIFIED ≠ EXECUTED Render ≠ MEASURED carte ≠ LIVE VERIFIED.

## HOLD_HUMAN

Merge / squash · secrets Stripe · produits Live · wrangler / hôte grok.me · Render receipt · FILE.md périmé · fermeture #793/#454/#872/#875.

## Interdit tenu

Pas main. Pas squash. Pas PRÉSENT. Pas photon inventé. Pas 2e slug. `juge.v0.json` / `flux.v0.json` / `ots-anchor.yml` intacts.
