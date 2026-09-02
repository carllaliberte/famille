# Alimentation — tous les rails publics

Date : 2026-09-01. Chef : QUANTUM-MASTER.
Le sas reste fermé. Pas de `data/`. Pas de nouveau slug. Bus contract parké.
Hôte cité : `https://acorn-royal-dune-blend.grok.me`. Yarrow = remix.

Flux :

```
QUELLE → BRUIT → TÉMOIN → EPSILON → HORIZON → MESURE
FIGURE + SITUS + UNFORGE portent qui / où / quoi
MODE juge. RECU nomme un rail d'argent. DOSSIER enveloppe.
FAMILLE indexe. QUANTUM signe ailleurs.
```

## Juge (privé unforge, code only)

`peut_dire_quantique(carte)` — False si source ∉ {qrng,qkd}, pas d'appareil,
simule, témoin faible, qkd sans di, di sans transcript, di+simule,
ε absent / ≤ 0 / `iid`, pas d'horizon.

CLI : `python -m quantum peut-dire --quelle … --transcript … --horizon 2027-12-31`
Horizon ISO → `horizon_date`. UFHY1 reste une étiquette. N'ouvre pas le nœud.

## Ration du soir — défaut honnête (téléphone, pas de dongle)

| Rail | Valeur nourrie | Refuse |
|---|---|---|
| QUELLE | `os` | `qrng`/`qkd` sans appareil nommé |
| BRUIT | `trous: ouverts` | `fermes` + `simule: true` |
| TÉMOIN | `aucun` (ou `stat` sur octets) | `di` sans transcript ; `di` + `simule` |
| EPSILON | `none` / ε `null` | `ε = 0` ; `iid` n'est pas un nombre |
| HORIZON | suite nommée + date future (`UFHY1` · 2027-12-31) | date passée ; « quantum-safe » |
| MODE | `classique` | `quantique` si une carte manque |
| FIGURE | qui, licence, silence si expirée | bot FAMILLE |
| SITUS | lieu pack BCP 47, pas une adresse civique | splat / owner.txt |
| UNFORGE | vérifie le fichier | signer |
| RECU | rail nommé, cents ≤ 0 ici | mint, quantum payment |
| DOSSIER | enveloppe + `kind` | onze hôtes |
| MESURE | lire consomme | relire comme si neuf |
| QUANTUM | off Git, off hôte | publish, grok.me Quantum |

## Trois nourritures concrètes

### 1. QUELLE — spec tenue
`os` = urandom. Toujours vrai sur un cellulaire.
`simule: true` sur tout BB84/CHSH logiciel. Ça reste classique.

### 2. Exemple `os` (preview, pas un sceau)

```json
{
  "kind": "famille.flux.os",
  "quelle": "os",
  "temoin": "aucun",
  "bruit": "ouverts",
  "epsilon": { "modele": "none", "valeur": null },
  "horizon": { "suite": "UFHY1", "until": "2027-12-31" },
  "mode": "classique",
  "sig": "preview",
  "why": "host does not sign. QUANTUM off Git."
}
```

### 3. Revue `simule`
- Logiciel + étiquette `qkd` sans `simule` = label menteur.
- `di` + `simule: true` = refus TÉMOIN.
- S = 2.420 = Hensen et al. 2015, citation. Pas un run dans le navigateur.

## Ce qui n'a pas été alimenté

Nœud `127.0.0.1:8765`, `quantum.db`, transcripts, bus Quantum—* contract,
nouveau `*.grok.me`, merge, PyPI.

Repos déjà v0 : quelle · temoin-protocol · bruit-protocol · epsilon-protocol · horizon-protocol · mode-protocol · unforge-check · figure · situs · recu · dossier · garde.
