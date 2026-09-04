# Interop IA

Un contrat. N'importe quel modèle *lit*. Aucun n'est juge.

## Carte minimale

Quatre clés : `quelle` · `temoin` · `epsilon` · `horizon`
Schéma : `schema/juge.v0.json`
Consommateur : `peut-dire` (Cursor, Claude, Grok, Ollama — même JSON)
Parcours inconnu (Cursor) : [`examples/interop-juge-v0.md`](examples/interop-juge-v0.md)

## Règles machine

- Champ manquant → MODE classique. Pas d'invention.
- `epsilon` ∈ {0, "0", "none", "iid"} → deny
- `horizon` périmé → silence ou re-press, pas « faux »
- Licence FIGURE expirée → l'agent se tait ([PORTES.md](PORTES.md) #17)
- Pas de hub OpenAI/Anthropic/Google dans le navigateur

## Packs lieu

BCP 47 : `fr-CA` · `en-CA` · `es-MX` · `en-NG` · `pt-BR` · `de-DE` — même schéma, phrases locales.
Tag inconnu → spoken en / classique.

## Ce que ça vend

Le schéma est MIT. L'œuvre Acorn ne l'est pas.
Un intégrateur paie l'acte (press, audit, carte), pas un token d'API Famille.
