# Cerveau-mémoire (backup) — spec P0

2026-09-14. SHA_MAIN `d340bbf` (post-#474 identify). Carl squash. `auto_merge=false`.

Ce n’est **pas** un second `fabric.mjs`. C’est un **plan mémoire** : tout le projet, daté, rejouable. Le fabric pense. Ici on **retient** et on **restaure**.

∞ = chaque cycle *peut* produire un `next`. Ce n’est pas un daemon LIVE.

## Ce que c’est

Un cerveau de mémoire pour FAMILLE :

OBSERVE (git, SHA, artefacts Drive) → IDENTIFY (id roster) → MEASURE → OBJECT (trou) → CORRECT (restore test) → HUMAN DECISION → NEXT

## Ce que ce n’est pas

- pas fabric2 / roster2 / cognition2
- pas un juge, pas LIVE
- pas des secrets dans Git
- pas les poids Ollama (Drive = install + catalogues)
- pas Codex qui merge
- pas 127.0.0.1 dans Actions

## Périmètre

| Inclus | Exclus |
|---|---|
| `carllaliberte/famille` (git, historique) | PAT, `*_API_KEY`, `OLLAMA_HOST` valeurs |
| Drive catalogues / `install.sh` (déjà là) | poids modèles |
| SHA + provenance `identify.v0` | Contents API qui tronque `review.mjs` |
| 1 restore **mesuré** avant `EXECUTED` | « on a git donc c’est backé » |

## États

`DEFINED` = cette spec.  
`EXECUTED` = un restore test a réellement relus un SHA / un fichier et comparé.  
`VERIFIED` = readback indépendant (Carl ou CI lecture).  
`LIVE` = jamais minté ici.

## File

| Phase | Quoi | Qui | État |
|---|---|---|---|
| P0 | cette spec | Build | **ce PR** |
| P1 | primitive `restore` fail-closed + tests (pas de 2ᵉ moteur) | Build ou Codex **après merge P0**, une tête | PROPOSED |
| P2 | mirror remote (2ᵉ remote, pas wildcard `*`) | Carl décide l’URL | PROPOSED |
| P3 | boucle `next` documentée, pas un cron infini auto-merge | — | PROPOSED |

## Codex

Ne pars pas dans le vide. Attends le squash P0. Puis **une** branche `feat/backup-restore`, tests, PR draft. Même interdits : pas `main`, pas secrets, pas `review.mjs` stub, `MERGED=NO`.

Erreur → `NOTIFY` l’IA qui a signé (`docs/IDENTIFY.md`).

## Restore (définition, pas le code)

1. Choisir un SHA connu.
2. Lire un fichier à ce SHA.
3. Comparer octets / hash.
4. Match → mesure. Mismatch → CONFLICT + NOTIFY. Pas de secret dans la preuve.

Sans l’étape 2–3 : `UNMEASURED`, pas EXECUTED.

## Frontière

DECISION = Carl. MERGE = Carl. Mirror = Carl.  
Build/Codex/Astra préparent. Ils n’allument pas ∞.
