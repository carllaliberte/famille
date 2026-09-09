# Revue — schémas de projection (NS incompressible)

Revue. Pas une carte juge. Pas un satellite MESURE. Pas un MODE.
Champs `quelle` / `témoin` / `epsilon` / `horizon` absents → MODE classique si quelqu’un étiquette.
Hors architecture FAMILLE (doctrine / LU / juge). Fichier isolé, un geste.

Réf. : Guermond–Minev–Shen, *An overview of projection methods for incompressible flows*, CMAME 2006.

## Quoi

Splitting : vitesse intermédiaire sans `div u = 0`, puis projection L² sur les champs à divergence nulle. Poisson de pression. Chorin 1968 / Temam 1969.

Trois classes : correction de pression, correction de vitesse, splitting consistant (≈ jauge E–Liu).

## Ordres (semi-discret, solution assez régulière)

| Schéma | `\|u\| L2` | `\|u\| H1` et `\|p\| L2` |
|---|---|---|
| Non incrémental (Chorin) | O(Δt) | O(Δt^{1/2}) |
| Incrémental standard (van Kan) | O(Δt²) | O(Δt) |
| Incrémental rotationnel (Timmermans–Minev–VdV) | O(Δt²) | O(Δt^{3/2}) |
| Correction de vitesse / splitting consistant (forme rotationnelle) | O(Δt²) | O(Δt^{3/2}) |

Ordre 2 sur `p` : pas prouvé en domaine général. Parfois vu numériquement si le bord est simple.

## Rotationnel — correction typique (BDF2)

`p^{n+1} = p^n + φ − ν div ũ`

Identité utilisée : `Δu = ∇(div u) − ∇×∇×u`.

## Trous (nommés, pas comblés)

- CL pression : le vrai `∂n p = ν n·Δu + n·f` n’est pas le Neumann homogène du Poisson.
- Sortie ouverte : `∂n φ = 0` réfléchit.
- Inf-sup : P1/P1 sans stab = instable. Taylor–Hood, P2/P1, CR, spectrale.
- Init : premier pas souvent ordre 1 ; rotationnel + BDF2 ok si init compatible.
- Coût : Helmholtz (ou visqueux) + Poisson par pas. Moins cher qu’un Stokes couplé ; erreur de splitting en plus.
- Compressible / Mach bas : autre famille (pas SIMPLE, pas RMIL).

## Interdit ici

Pas de code solveur. Pas de schema JSON. Pas de check.py. Pas de photon. Pas de QPU. Pas de « quantum-safe ». Pas de preuve Clay.

Clay NS existence/smoothness : pas homologué. Claim OpenAI 2026-09-08 = annoncé, contesté, pas LIVE VERIFIED Carl.

LU 2026-09-09 — Grok opérateur. Carl merge.
