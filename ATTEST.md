# Attestation publique — preview, pas le sas

Route kit : `#/attest` `#/docs` `#/public`
Hôte : remix yarrow / carte acorn. Pas un nouveau slug.

QUANTUM signe. Cet hôte juge.
Unforge vérifie, ne signe pas.
Le badge n’est pas un sceau de paiement. cents ≤ 0 — deny.

## Contrat POST /attest

```
POST /attest
Content-Type: application/json

{
  "source":  "os | qrng | qkd",
  "witness": "aucun | stat | fabricant | di",
  "epsilon": "none | asymptotic | iid | composable",
  "horizon": "ed25519 | UFHY1 | mldsa87",
  "until":   "2027-12-31"
}
```

Réponse 200 — preview seulement :

```
{
  "mode":    "classique",
  "verdict": "allow | deny",
  "epsilon": "2^-10",
  "horizon": "CNSA-2027",
  "sig":     "preview",
  "why":     "host does not sign. QUANTUM off Git.",
  "badge":   "/attest/badge.svg?v=allow"
}
```

Deny obligatoire :
- epsilon absent ou `0` → « ε = 0 est un mensonge »
- cents > 0 → deny
- source `qkd` sans témoin `di` → classique, pas quantique
- horizon expiré → allow fichier, deny sceau (re-press)

Pas de chaîne. Pas de consensus. Pas de mint.

## Badge SVG

Texte : `famille | preview | allow` ou `famille | preview | deny`
Fond `#0a0a0a`. Filet or. Vert seulement sur `allow` (verdict), jamais néon.
Sous-titre : `not a chain · not money`.

## SDK — 3 lignes (contrat npm, pas un 2e produit)

```js
import { attest } from '@famille/attest'
const r = await attest({ source:'os', witness:'aucun', epsilon:'iid', horizon:'UFHY1' })
document.body.insertAdjacentHTML('beforeend', r.svg)
```

Paquet : spec ici. Publication npm plus tard.
Vérité fichier : `uses: carllaliberte/unforge-check@main`.

## Grand public

| Rail | Public |
|---|---|
| QUELLE | d’où vient le bit |
| TÉMOIN | avec quelle force |
| EPSILON | marge d’erreur |
| HORIZON | fin de garantie du sceau |
| MODE | classique par défaut |
| RECU | reçu, pas un paiement |

« Marge d’erreur zéro » = deny. C’est le même type error.
