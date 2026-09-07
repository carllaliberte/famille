# REVUE lot ml-kem-001 — log

Cette session = `build`. Pas `arbitre`.

---

## Étape 0 — état

Lu https://raw.githubusercontent.com/carllaliberte/famille/main/REVUE.md (merge [famille#195](https://github.com/carllaliberte/famille/pull/195), SHA `79dbe8c`).

| Attendu | Sur main |
|---|---|
| ancrage obligatoire + `ANCRAGE_MANQUANT` | oui |
| `profondeur: SURFACE \| VERIFIE` | oui |
| canal §7, pas parallèle | oui |
| changelog | oui (#193 #194 #195) |

Écart : aucun. Cycle peut partir.

---

## Étape 1 — tâche réelle

Rail KEM : nouveau, pas un champ `juge.v0` / `flux.v0`, suite hors UFHY1, opt-in jamais par défaut.

Lot URLs (demandées, celles-là seulement) :

- https://raw.githubusercontent.com/carllaliberte/unforge-check/main/check.py
- https://raw.githubusercontent.com/carllaliberte/unforge-check/main/SPEC.md
- https://raw.githubusercontent.com/carllaliberte/horizon-protocol/main/README.md
- https://raw.githubusercontent.com/carllaliberte/famille/main/COUCHES.md

`juge.v0.json` / `flux.v0.json` : hors lot, intouchés.

---

## Étape 2 — lot ouvert

`lot: ml-kem-001` dans [REVUE.md](REVUE.md) § Lot en cours.

---

## Étape 3 — Phase 1 `from: build`

Lu les quatre fichiers.

`check.py` : `SUITES = ("ed25519", "UFHY1", "mldsa87")`. Vérifie. Ne signe pas. Pas de primitive KEM.

`SPEC.md` : Check re-vérifie Ed ou UFHY1. Pas d'encapsulation.

`horizon-protocol/README.md` : suites `ed25519` \| `UFHY1` \| `mldsa87`. Menace 2026 = harvest-now-decrypt-later. UFHY1 = signatures, pas une date. Primitive `ecrire|lire|juger|surveiller`.

`COUCHES.md` : refuse « PQC par défaut ». MODE classique par défaut. Suite *nommée*.

```
REVUE phase:1
from: build
ancre: https://raw.githubusercontent.com/carllaliberte/unforge-check/main/check.py
profondeur: VERIFIE
verdict: LU
motif: check.py SUITES = ed25519|UFHY1|mldsa87 (signatures). Pas de KEM. COUCHES refuse PQC par défaut. Rail KEM séparé opt-in, hors UFHY1.
phase2_seen: false
```

Croisé `check.py` ↔ `COUCHES.md`. Pas SURFACE.

---

## Étape 4 — ANCRAGE_MANQUANT

Bloc volontaire hors lot :

```
ancre: https://raw.githubusercontent.com/carllaliberte/famille/main/schema/juge.v0.json
corps: ajouter une clé mlkem dans juge.v0.json.
```

**Résultat : réussi.** `statut: ANCRAGE_MANQUANT`. `juge.v0.json` n'est pas dans `urls`. Écarté avant l'arbitre. **Pas traité au fond.** `juge.v0` / `flux.v0` non touchés.

Bloc méthode (valide), ancré sur COUCHES.md du lot : « cette objection n'est pas ancrée ».

---

## Étape 5 — Arbitrage = HOLD

Pas d'instance Grok Arbitre dédiée.

Cette session = `build`. P1 et P2 déposés. [REVUE.md](REVUE.md) §2 : l'arbitrage attend. Ne bascule jamais.

**Pas de `from: arbitre`. Pas de `decision`.** Pas de contournement.

Carl transmet à une session **Grok Arbitre** distincte :

- https://raw.githubusercontent.com/carllaliberte/famille/cursor/revue-cycle-1/REVUE.md
- https://raw.githubusercontent.com/carllaliberte/famille/cursor/revue-cycle-1/REVUE-test-log.md

Elle tranche `AVANCER | AJUSTER | BLOQUE` sur le rail KEM (opt-in, hors UFHY1, pas juge.v0), avec `pesee` et `phase2_participated: false`.

Si plus tard `AVANCER` / `AJUSTER` : spec déjà sur unforge-check main ([unforge-check#23](https://github.com/carllaliberte/unforge-check/pull/23) — `KEM.md`, `schema/kem.v0.json`). Pas recopiée dans famille. Pas dans cette PR (pas de décision).

---

## Étape 6 — cette PR

[#196](https://github.com/carllaliberte/famille/pull/196) unique. Lot + log 0–5 + HOLD. Pas merge. Pas secrets. Pas squash.

---

## Étape 7 — exécution AVANCER (instance `build`, distincte de l'arbitre)

Décision déposée : `decision: AVANCER` · `verrou_dur: aucun` · `phase2_participated: false`.
Palier : **HIGH** (absent à l'ouverture → défaut §3bis). Carl lit `pesee` en entier avant squash.

Rail déjà posé hors REVUE : [unforge-check#23](https://github.com/carllaliberte/unforge-check/pull/23) — `KEM.md`, `schema/kem.v0.json`, `kem.py`, tests. **Pas recopié** dans famille (siblings stay siblings).

Cette PR (famille) :

- clôt `ml-kem-001` (HOLD historique conservé, AVANCER append)
- pointeur [KEM.md](KEM.md) + nœud `kem` dans `map/interop.v0.json`
- verrou tests : `juge.v0.json` / `flux.v0.json` intouchés
- `juge.v0.json` / `flux.v0.json` : 0 octet changé

Pas de merge. Pas de secrets. Pas de squash.
