# Attest — aperçu

Tampon preview. Pas une quittance. Pas QUANTUM.
Hôte : https://acorn-royal-dune-blend.grok.me

## Requête

```http
POST /attest
Content-Type: application/json

{
  "quelle": "os",
  "temoin": "aucun",
  "epsilon": null,
  "horizon": ""
}
```

## 200 — classique (correct)

```json
{
  "quantique": false,
  "manques": ["epsilon", "horizon"],
  "phrase": "Ça ne tient pas. Classique."
}
```

Badge : PREVIEW · classique

## 200 — les quatre tiennent

`quantique: true` seulement si quelle ∈ {qkd,qrng} + témoin + ε>0 + date future + transcript si di + pas simulé.
Badge : PREVIEW — encore pas une quittance UNFORGE.

## 422 — refus

| Corps | Pourquoi |
|---|---|
| `epsilon: 0` | marge d'erreur zéro = mensonge |
| `epsilon: "iid"` | pas un nombre |
| `horizon: "UFHY1"` | ce n'est pas une date |
| `horizon` passée | garantie périmée |

## Qualité

Flux : source → canal → borne → sceau → lecture.
Rente plus tard : org paie le tampon *nommé* si les quatre tiennent.
Gratuit = aperçu classique.
