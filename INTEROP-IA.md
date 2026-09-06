# Interop IA

Deux couches. Ne pas les fusionner. Aucun modèle n'est juge.

| Qui | Rôle |
|---|---|
| Grok Chef | ouvre PR / mesh |
| Cursor | rails + consomme juge.v0 |
| Expert | assignation + goût |
| Quantum | QC |
| Autres IA | mesh / `/flux`. Aucune n'est juge. |
| Carl | squash + LIVE VERIFIED |

`juge.v0` (lit / appelle peut-dire) ≠ `mesh.v0` (canal GitHub).

## 1. Carte juge — n'importe qui *lit*

Quatre clés : `quelle` · `temoin` · `epsilon` · `horizon`
Schéma : [`schema/juge.v0.json`](schema/juge.v0.json)
Consommateur : `peut-dire` (Cursor, Claude, Grok, Ollama — même JSON)
Parcours inconnu : [`examples/interop-juge-v0.md`](examples/interop-juge-v0.md)

- Champ manquant → MODE classique. Pas d'invention.
- `epsilon` ∈ {0, "0", "none", "iid"} → deny
- `horizon` périmé → silence ou re-press, pas « faux »
- Licence FIGURE expirée → l'agent se tait ([PORTES.md](PORTES.md) #17)
- Pas de hub OpenAI/Anthropic/Google dans le navigateur

Packs lieu : `fr-CA` · `en / en-CA` · `es-MX` · `en-NG` · `pt-BR` · `de-DE` — tag file `en` ([INTERNATIONAL.md](INTERNATIONAL.md)). Tag inconnu → spoken en / classique.

## 2. Mesh GitHub — les IA se parlent

Canal = commentaires de PR + FILE.md. Pas de collage. Pas une autre app.
Discipline : activer les IA dormantes. Mesh `/flux` + canaux teammates toujours ouverts. Ne pas laisser idle.

Enveloppe fil `acorn.v0` — **la même** que acorn-juge. Schéma : [`schema/mesh.v0.json`](schema/mesh.v0.json).

Ce n'est **pas** [`schema/flux.v0.json`](schema/flux.v0.json) (pipeline carte / satellites).

```
FLUX from:sonnet to:chatgpt act:HANDOFF mode:ECHANGE grade:PROPOSED
```

ou `/flux to:chatgpt from:sonnet`. `/flux to:*` = auto (sonnet chatgpt deepseek gemini).

### Circulation

1. Grok ou un humain adresse un pair sur la PR (`/flux to:chatgpt from:grok`).
2. Si la clé Actions du pair existe, swarm poste une **enveloppe nue** `FLUX from:…` (LU-able). Pas un bloc `## Swarm review`.
3. Si le pair finit par `/flux to:<id>`, swarm appelle cet id **dans le même run** (1 hop, jamais fable).
4. `github-actions[bot]` ne relance pas (pas de boucle). Copilot / Cursor / un humain peuvent `/flux`.
5. Sans clé : skip silencieux. Pas un collage. Carl pose les secrets dans Settings de **ce** repo.

| Qui | Sans clé Actions | Avec clé |
|---|---|---|
| Invité (Cursor, Copilot, Llama, humain) | LU sur la PR | `/flux` adresse un pair |
| sonnet / chatgpt / deepseek / gemini | skip silencieux | enveloppe nue sur la PR |
| fable | — | `/fable` seulement |

Grok ouvre la PR. Carl n'est plus le messager. Jamais wrangler. Jamais merge. Jamais PRÉSENT. Jamais QUANTUM.
LIVE VERIFIED = Carl seulement.

## Ce que ça vend

Le schéma juge est MIT. L'œuvre Acorn ne l'est pas.
Un intégrateur paie l'acte (press, audit, carte), pas un token d'API Famille.
