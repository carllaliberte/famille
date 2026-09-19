# Mega 002 — Universal Identity Fabric

Les certitudes ont une date de fin.

Substrat d'identité mesuré, borné. Pas une autorité. Pas LIVE. Pas une carte juge.

Contract: `acorn.mega.universal-identity.v1`.

## Frontières

- `createRecord` propose un enregistrement. Un argument `verified:true` ou `measured:true` est refusé : création ≠ tampon. `verified` et `measured` restent `false`.
- `measureRecords` peut passer `measured:true`. Ce n'est pas une vérification. `verified` n'est pas inventé.
- `buildIdentityState` agrège l'état. Ce n'est pas `buildIdentity` : pas de grant d'identité.
- `authority` et `live` restent `false`. Pas d'escalade.

## Juge — MODE classique

Quelle, témoin, epsilon, horizon : absents de ce rail. Un champ manquant → MODE classique. On ne comble pas. ε=0 serait un mensonge. Preview ≠ quittance.

Ce module n'est pas `juge.v0`. Il ne ment pas une couleur VERT.

## Pas dans ce geste

FILE.md (2026-09-14) est périmé (« PR famille open : 0 »). Pas de PR FILE tant que #1200 n'est pas mergée. Carl = merge.
