# xAI surface — surveillance du noyau Acorn

Carte datée. Pas LIVE. Pas une étiquette éternelle.

- Catalogue : [`schema/xai-surface.json`](../schema/xai-surface.json)
- Schéma : [`schema/xai-surface.v0.json`](../schema/xai-surface.v0.json)
- Sonde : [`scripts/xai-surface-monitor.mjs`](../scripts/xai-surface-monitor.mjs)
- Noyau inchangé : [`schema/kernel.v0.json`](../schema/kernel.v0.json) — `SOVEREIGN_KERNEL`, `auto_merge=false`

## Indissociable ≠ obligatoire

Le chef Grok (`grok` → `grok-4.6`) est déclaré dans le roster noyau.
La clé `XAI_API_KEY` n’est **pas** requise pour `RUN`.
Clé absente = `CONFIGURATION_ERROR` sur les slugs, pas « xAI absent ».

## Continu / éternité

Acorn refuse l’étiquette sans date.
`measured_on` + `horizon` : le catalogue périme. Il faut le re-mesurer (PR Carl), pas le sceller.
Le monitor ne met pas à jour les slugs tout seul. Pas d’auto-merge.

## Interdit comme canal runtime

Tesla FSD / Optimus / Dojo · Neuralink · Colossus · Government · slugs inventés (`grok-5`, `grok-heavy`, `grok-expert`).

## Mesure

```bash
node scripts/xai-surface-monitor.mjs
node --test test/xai-surface-monitor.test.js
```
