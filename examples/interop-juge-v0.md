# Interop juge.v0 — un inconnu consomme le contrat

Les certitudes ont une date de fin.

Pas un 7e chantier. Pas un nouveau schéma. Même carte : [`schema/juge.v0.json`](../schema/juge.v0.json).

Cursor *appelle* `peut-dire`. Cursor n'est pas le juge.

## Chemin

1. Lire `schema/juge.v0.json`. Requis : `quelle` · `temoin` · `epsilon` · `horizon`.
2. Remplir une carte. Champ manquant → MODE classique. Ne pas inventer le champ.
3. Packs lieu : `fr-CA` · `en-CA` · `es-MX` · `en-NG` · `pt-BR` · `de-DE` — même schéma, phrases locales. Tag inconnu → spoken en / classique.
4. Juger (Unforge, 0 réseau) :

```bash
node sdk/cli.js <carte.json>
# hors repo (même contrat) :
python -m quantum peut-dire --fichier carte.json
```

exit 0 = les quatre tiennent (preview). exit 2 = classique.

Exemple honnête (téléphone, classique) : [`attest-os.json`](attest-os.json).

## Verrous

- Jamais ε = 0 / `"0"` / `none` / `iid`
- UFHY1 est un nom de suite, pas une date
- Preview ≠ quittance. Unforge ne signe pas.
- Hôte seul : https://acorn-royal-dune-blend.grok.me
- Cursor *appelle* le juge. Cursor n'est pas le juge.
- Pas de QPU sur Git. Pas de hub OpenAI / Anthropic / Google dans le navigateur.

## Optionnel

MESURE `consulter` / ANCRAGE re-mesure : déjà dans [FLUX.md](../FLUX.md). Ici on ne les réimplémente pas.
