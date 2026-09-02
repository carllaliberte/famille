# Ville Preview — POST /attest

Hôte : https://acorn-royal-dune-blend.grok.me
Pas QUANTUM. Pas de signature nœud.

```
POST /attest
Content-Type: application/json

{
  "quelle": "os",
  "temoin": "aucun",
  "epsilon": null,
  "horizon": ""
}
```

Réponses :
- 200 `{quantique:false, manques:[...], phrase}` + badge PREVIEW
- 422 si ε=0 ou horizon = UFHY1

Schéma : schema/juge.v0.json
Badge ≠ quittance UNFORGE.
