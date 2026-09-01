# BUILD — publier sans inventer d’hôte

On ne crée pas onze `*.grok.me`.
FAMILLE est la carte. Les pages manquantes se servent **sur l’hôte déjà live**.

Hôte : https://acorn-royal-dune-blend.grok.me

## Ce que ce kit publie

Sur le même hôte, en hash routes (téléphone, pas de serveur) :

| Route | Nature |
|---|---|
| `#/` ou `#/carte` | carte Delft — déjà l’esprit de l’app live |
| `#/film` | page Famille |
| `#/compose` | page Famille |
| `#/garde` | page Famille |
| `#/mode` `#/recu` `#/dossier` | juges, slug cible annoncé, pas d’URL fantôme |
| `#/quelle` `#/temoin` `#/epsilon` `#/horizon` `#/bruit` | quatre cartes + canal |
| `#/figure` `#/situs` `#/unforge` | qui / où / quoi · Unforge = onglets, pas trois apps |

Hors lattice : QUANTUM, Estoc, CreatorFlow, Filon-nœud, unforge sas, formal-layer.

## Comment ça arrive sur grok.me

Grok Build possède le bouton Publish. Ce dépôt ne l’a pas.

1. Ouvrir l’app live → **Remix**.
2. Coller le prompt ci-dessous.
3. Republish **sur le même hôte**. Ne pas créer un nouveau slug.
4. Vérifier `/#/garde` `/#/film` `/#/compose`. Les slugs `mode.grok.me` etc. restent cibles jusqu’à un domaine perso.

## Prompt Remix (chat Build existant)

```
Remix Famille. Same host. Do not create a new grok.me.

Replace missing routes with the kit in github.com/carllaliberte/famille/site/index.html
Keep the live chrome: #0a0a0a, brushed gold, grain, Cormorant italic title, no neon, no qubit, no coin.

Serve these views on THIS app only:
- Carte (default) — Delft map + dossier panel
- Film, Compose, Garde as pages, not new apps
- Mode, Reçu, Dossier, Quelle, Témoin, Epsilon, Horizon, Bruit, Figure, Situs, Unforge as judges on the map
- Hash routes: #/film #/garde #/compose #/mode #/recu …

Doctrine:
- classique by default
- ε = 0 denied
- loopholes default open
- S = 2.420 only on Témoin / Delft
- no invented photon, no webcam as qrng
- Unforge checks, never signs
- Garde: every attack DENY
- banners must say slug cible is not live

Do not publish QUANTUM, Estoc, CreatorFlow, Filon, unforge sas.
Do not move Famille off acorn-royal-dune-blend.grok.me.
```

## Slugs séparés — plus tard

Un slug, une app, un juge. Seulement après que la carte serve les pages.
Quand Grok Build rend un hôte réel, on remplit la colonne « publié » dans GROKME.md.
On ne prétend pas que `mode.grok.me` existe avant.
