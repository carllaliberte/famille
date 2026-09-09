# Pont optique — plan data hors Git

Le mesh (`schema/mesh.v0.json`, fil `acorn.v0`) est le **plan de contrôle**.
La fibre (`OPTICAL_QUANTUM`) est le **plan de données**. Ils ne se mélangent pas.

QUANTUM-MASTER reste le kernel privé. Hors Git public. Hors grok.me.
Ce fichier ne publie pas un photon. Il trace la couture.

Runtime : [`.github/swarm/lease.mjs`](../.github/swarm/lease.mjs) + [`.github/swarm/kernel.mjs`](../.github/swarm/kernel.mjs) — SHA-256 + Ed25519 (`node:crypto`). Enveloppe anti-rejeu (nonce + ts). Pas de chaîne externe. Pas wrangler.

## Invitation Carl

Seul Carl invite. Le handshake ouvre cette enveloppe (nonce + ISO, anti-rejeu). Pas mTLS matériel. Pas un photon.
Sans fibre réelle attestée hors Git : `CHANNEL NOT PRESENT`. LIVE VERIFIED = Carl seulement.

## Deux plans

| Plan | Porte | Transporte | Présence ici |
|---|---|---|---|
| Contrôle | `mesh.v0` / GitHub / LU | sync, certificats classiques, états de canal | CLASSICAL |
| Données | fibre noire / espace photonique | états photoniques | `CHANNEL NOT PRESENT` |

Aucune donnée quantique brute ne transite par une enveloppe mesh.
`body` / `payload` / `qubit` / `qkd` / `qrng` sur le contrôle → refus `PHOTONIC_ON_CONTROL`.

## Canal `OPTICAL_QUANTUM`

Déclaré. Pas CONNECTED. Pas LIVE.

Un bail d’intrication, sur ce dépôt, n’est qu’un **certificat classique signé** (proof-of-lease) :

- `loss_db_max` — seuil de perte acceptable
- `fidelity_min` — seuil de fidélité
- `certificate` — preuve classique du bail
- Ed25519 éphémère — le corps n’est pas une variable libre
- `ts` — ISO-8601 UTC

Sans bail signé + fibre réelle attestée : `CHANNEL NOT PRESENT`.
LIVE VERIFIED = Carl seulement.

## Époques Merkle

Chaque fenêtre agrège les baux et révocations dans un arbre SHA-256.
L’époque N ancre `prevRoot` = racine N-1. Signature Ed25519 de la racine.
Pas un ledger public. Pas un replay.

## Kill-switch

Watchdog : chaîne cassée, bail forgé, perte / fidélité hors seuil → isolation.
Canaux → `CHANNEL NOT PRESENT`. Révocation signée. **Pas de reprise automatique.**
Seul Carl (`carllaliberte`) réinitialise.

## Isolation projet

`project_id` cloisonne. `shareAcrossProjects` seulement si `explicit: true`.
Le pont optique n’ouvre pas une fuite inter-projets.

Carl squash. Pas d’auto-merge. Pas wrangler.
