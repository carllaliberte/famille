# KEM — pointeur, pas une 5e carte

Rail **séparé**, opt-in, jamais par défaut. Pas Check. Pas HORIZON. Pas `juge.v0`. Pas `flux.v0`.

Famille est la carte. Le rail vit chez le sibling qui vérifie, pas ici.

| | |
|---|---|
| Spec | [unforge-check/KEM.md](https://github.com/carllaliberte/unforge-check/blob/main/KEM.md) |
| Schéma | [unforge-check/schema/kem.v0.json](https://github.com/carllaliberte/unforge-check/blob/main/schema/kem.v0.json) |
| Pose | [unforge-check#23](https://github.com/carllaliberte/unforge-check/pull/23) |

## Pourquoi pas ici

Copier `KEM.md` / `kem.v0.json` dans `schema/` fusionnerait un rail d'encapsulation avec le juge. Interdit par le lot ml-kem-001 et par [REVUE.md](REVUE.md) §4bis (`juge.v0.json`, `flux.v0.json` intouchés).

`UFHY1` reste **signatures** : Ed25519 + ML-DSA-65. [unforge-check/AGENTS.md](https://github.com/carllaliberte/unforge-check/blob/main/AGENTS.md) interdit d'écrire UFHY1 pour autre chose.

## Primitive (chez unforge-check)

```
opt-in explicite  +  suite KEM  +  menace harvest-now-decrypt-later  →  fiche .kem.json
```

Sans `--opt-in` : refus. [COUCHES.md](COUCHES.md) : « PQC par défaut » = interdit.

Suites v0 (déclarées, `ciphertext` = `null`) : `x25519` | `mlkem768` | `x25519mlkem768`.

```bash
python3 kem.py ecrire --opt-in --suite x25519mlkem768 --vers examples/opt-in.kem.json
python3 kem.py lire examples/opt-in.kem.json
python3 kem.py juger examples/opt-in.kem.json
```

v0 **déclare**. N'encapsule pas. Pas de clé dans Git. Check ne lit pas `.kem.json`.

Menace utile 2026 = harvest-now-decrypt-later ([epsilon-protocol/PHYSIQUE.md](https://github.com/carllaliberte/epsilon-protocol/blob/main/PHYSIQUE.md)) — un modèle, pas un nom de produit. Garde : [deny-horizon-slogan.json](https://github.com/carllaliberte/garde).

Rien ici n'est un sceau. Un merge n'est pas un encapsulage.
