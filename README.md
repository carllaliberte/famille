# FAMILLE

**Not fourteen scripts. One framework.**

A cadastre of typed evidence for post-quantum cybersecurity
and composable proof.

QUANTUM signs. MODE judges. DOSSIER composes.
Keys stay off Git. Physics enters as source and as bound. Never as décor.

© 2026 Carl Laliberté. MIT for listed protocols. Estoc stays off the file. QUANTUM stays off Git.

## What this is

FAMILLE is not a bot and not a rail.
It is the index of a single claim lattice.

Each rail is a typed evidence object: a schema, a judge, an INTERDIT.
Refusal is the type error of the framework.
`mode: quantique` is a verdict, not a mood.

## Formal layer (honest)

This is not Coq, Lean, or Isabelle unless a mechanized theory is added later.
What ships today, and is already formal enough to compose:

| Primitive | Role |
|---|---|
| JSON schema | contract of the claim |
| judge (`juger`) | total decision procedure |
| INTERDIT | negative specification |
| CHSH / Tsirelson | physical gates on TÉMOIN |
| ε-budget | composable security, `ε = 0` refused |
| leftover-hash | written, not extracted in v0 |
| freshness registry | replay is a type error |
| monogamy | one Bell transcript → one FIGURE |
| MODE | classical by default; quantum only if every bound holds |
| DOSSIER | composition root |

## Post-quantum layer (named)

Do not write « quantum-safe ». Name the suite and the date.

| Suite | Claim |
|---|---|
| `ed25519` | Shor is not yet assumed at this size |
| `UFHY1` | Ed25519 + ML-DSA-65 — at least one survives |
| `mldsa87` | elliptic is no longer trusted |

Threat model: harvest-now-decrypt-later.
HORIZON expires the cryptographic hypothesis.
ANCRAGE expires the physical run.

## The lattice

```
QUANTUM     kernel that signs          (private, off Git)
    |
FIGURE      who
SITUS       where                      + CLÔTURE (when)
UNFORGE     what                       + OUBLI  (forget)
QUELLE      origin of the bit          os | qrng | qkd
TÉMOIN      force of the bit           aucun | stat | fabricant | di
BRUIT       channel / loopholes        default open
EPSILON     composable ε + Hmin
HORIZON     PQC suite + reseal date
ANCRAGE     re-measure date
MESURE      reading consumes
MODE        judge: classical | quantum
DOSSIER     composition root
FAMILLE     the map — not a rail
```

## Rails

| Rail | Question | State |
|---|---|---|
| [FIGURE](https://github.com/carllaliberte/figure-protocol) | who | live |
| [SITUS](https://github.com/carllaliberte/situs-protocol) | where | live |
| CLÔTURE (on SITUS) | when | PR / zip |
| [UNFORGE](https://github.com/carllaliberte/unforge-check) | what | live |
| OUBLI (on UNFORGE) | forget | issue / zip |
| [QUELLE](https://github.com/carllaliberte/quelle) | where the bit comes from | live |
| [TÉMOIN](https://github.com/carllaliberte/temoin-protocol) | with what force | live |
| [HORIZON](https://github.com/carllaliberte/horizon-protocol) | until when the seal holds | live |
| [EPSILON](https://github.com/carllaliberte/epsilon-protocol) | with what ε | live |
| [MODE](https://github.com/carllaliberte/mode-protocol) | classical or quantum | live |
| [DOSSIER](https://github.com/carllaliberte/dossier-protocol) | the envelope | live |
| MESURE | reading consumes | zip |
| [BRUIT](https://github.com/carllaliberte/bruit-protocol) | through which channel | live |
| ANCRAGE | when to re-measure | zip |
| [Filon](https://github.com/carllaliberte/filon-spec) | the node that speaks | live |
| QUANTUM | the sas that signs | private, off Git |
| Estoc | the ritual | off file |

## Doctrine in one line

The only bug is a lying label.

Phone first. Zero token. Zero L1. Zero entropy cloud.
A missing card keeps the label honest.

See [INTERDIT.md](INTERDIT.md).
