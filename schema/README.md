# Schéma juge v0

Mêmes clés que `peutDire` / `peut_dire_quantique`.

```bash
node sdk/cli.js examples/attest-os.json
# exit 2 = classique. Correct.
```

Référence hors de ce repo (unforge, 0 réseau) :

```bash
python -m quantum peut-dire --fichier carte.json
```

exit 0 = les quatre tiennent (preview). exit 2 = classique.
Hôte : https://acorn-royal-dune-blend.grok.me — vitrine, ne signe pas.

Deux schémas. Ne pas les fusionner :

- [`juge.v0.json`](juge.v0.json) — quatre cartes. Consommateur `peut-dire`.
- [`flux.v0.json`](flux.v0.json) — pipeline carte / satellites (`famille.flux.v0`).
- [`mesh.v0.json`](mesh.v0.json) — enveloppe commentaires PR, fil `acorn.v0` (même que acorn-juge). `from` + `ts` + `sha` + `pr`. Pas le pipeline. FILE.md n'est pas ce schéma.

