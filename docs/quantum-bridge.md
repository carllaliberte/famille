# Pont optique — plan data hors Git

Le mesh (`schema/mesh.v0.json`, fil `acorn.v0`) est le **plan de contrôle**.
La fibre (`OPTICAL_QUANTUM`) est le **plan de données**. Ils ne se mélangent pas.

QUANTUM-MASTER reste le kernel privé. Hors Git public. Hors grok.me.
Ce fichier ne publie pas un photon. Il trace la couture.

## Deux plans

| Plan | Porte | Transporte | Présence ici |
|---|---|---|---|
| Contrôle | `mesh.v0` / GitHub / LU | sync, certificats classiques, états de canal | CLASSICAL |
| Données | fibre noire / espace photonique | états photoniques | `CHANNEL NOT PRESENT` |

Aucune donnée quantique brute ne transite par une enveloppe mesh.
`body` / `payload` / `qubit` / `qkd` / `qrng` sur le contrôle → refus `PHOTONIC_ON_CONTROL`.

## Canal `OPTICAL_QUANTUM`

Déclaré. Pas CONNECTED. Pas LIVE.

Un bail d’intrication, sur ce dépôt, n’est qu’un **certificat classique** :

- `loss_db_max` — seuil de perte acceptable (documentaire)
- `fidelity_min` — seuil de fidélité (documentaire)
- `certificate` — preuve classique du bail
- `ts` — ISO-8601 UTC

CONNECTED exige une fibre réelle attestée par l’appelant. Ce repo n’en a pas.
LIVE VERIFIED = Carl seulement.

## Isolation

`project_id` cloisonne. `shareAcrossProjects` seulement si `explicit: true`.
Le pont optique n’ouvre pas une fuite inter-projets.

Carl squash. Pas d’auto-merge. Pas wrangler.
