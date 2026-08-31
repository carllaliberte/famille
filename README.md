# FAMILLE

**Not fourteen scripts. One framework.**

A cadastre of typed evidence for post-quantum cybersecurity
and composable proof.

QUANTUM signs. MODE judges. DOSSIER composes. RECU attests a payment
that moved somewhere else.
Keys stay off Git. Physics enters as source and as bound. Never as décor.

© 2026 Carl Laliberté. MIT for listed protocols. Estoc stays off the file. QUANTUM stays off Git.

## What this is

FAMILLE is not a bot, not a rail, not a bank, not a coin.
It is the index of a single claim lattice.

Each rail is a typed evidence object: a schema, a judge, an INTERDIT.
Refusal is the type error of the framework.
`mode: quantique` is a verdict, not a mood.

## Money (named rail, not a mint)

X Money, Visa, Interac, ACH, cash — those rails exist.
FAMILLE does not hold the dollar. It signs the receipt.

See [RECU](https://github.com/carllaliberte/recu-protocol).
Do not invent a « quantum payment ». That label is a type error.

X is a publication surface (posts, ads). It is not a backend we patch.

## Formal layer (honest)

Theories live in [formal-layer](https://github.com/carllaliberte/formal-layer).
Every lemma there is `admitted` until a CI log says otherwise.
This is not Coq. This is not a completed EasyCrypt proof.
See [FORMAL.md](FORMAL.md).

| Primitive | Role |
|---|---|
| JSON schema | contract of the claim |
| judge (`juger`) | total decision procedure |
| INTERDIT | negative specification |
| UFHY1 AND | both signatures verify today |
| ε-budget | composable security, `ε = 0` refused |
| MODE | classical by default |
| RECU | receipt on a named rail |
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
RECU        receipt                    rail named, no mint
MODE        judge: classical | quantum
DOSSIER     composition root
FAMILLE     the map — not a rail
```

## Rails

| Rail | Question | State |
|---|---|---|
| [FIGURE](https://github.com/carllaliberte/figure-protocol) | who | live |
| [SITUS](https://github.com/carllaliberte/situs-protocol) | where | live |
| [UNFORGE](https://github.com/carllaliberte/unforge-check) | what | live |
| [QUELLE](https://github.com/carllaliberte/quelle) | where the bit comes from | live |
| [TÉMOIN](https://github.com/carllaliberte/temoin-protocol) | with what force | live |
| [HORIZON](https://github.com/carllaliberte/horizon-protocol) | until when the seal holds | live |
| [EPSILON](https://github.com/carllaliberte/epsilon-protocol) | with what ε | live |
| [MODE](https://github.com/carllaliberte/mode-protocol) | classical or quantum | live |
| [DOSSIER](https://github.com/carllaliberte/dossier-protocol) | the envelope | live |
| [BRUIT](https://github.com/carllaliberte/bruit-protocol) | through which channel | live |
| [RECU](https://github.com/carllaliberte/recu-protocol) | did money move, on which rail | live |
| [formal-layer](https://github.com/carllaliberte/formal-layer) | EasyCrypt obligations | admitted |
| [Filon](https://github.com/carllaliberte/filon-spec) | the node that speaks | live |
| QUANTUM | the sas that signs | private, off Git |
| Estoc | the ritual | off file |

## Doctrine in one line

The only bug is a lying label.

Phone first. Zero token. Zero L1. Zero entropy cloud. Zero quantum coin.
A missing card keeps the label honest.

See [INTERDIT.md](INTERDIT.md).
