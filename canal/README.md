# Canal Acorn — GET /juge

Face (vitrine, pas le juge) : https://acorn-royal-dune-blend.grok.me

Grok.me n’exécute pas /juge (404 HTML). Le canal vit ici.
Ce n’est pas un second *.grok.me.

## Déployer (compte Cloudflare gratuit)

```bash
cd canal
npm i -g wrangler
npx wrangler login
npx wrangler deploy
```

Wrangler affiche `https://acorn-juge.<compte>.workers.dev`.
Colle cette URL à Heavy. Mesure :

```bash
curl -sS -w '%{http_code}\n' \
  'https://acorn-juge.<compte>.workers.dev/juge?quelle=os&temoin=aucun&epsilon=0&horizon=2027-12-31'
```

400 + `Error margin zero is a lie` = canal ouvert.

## Contrat

- ε manquant / 0 / non fini → 400 lie
- cartes inconnues → 400 cards
- horizon pas YYYY-MM-DD futur → 400 horizon
- di sans transcript → 400 transcript
- os + ε>0 → 200 preview CLASSIQUE
- le reste → proxy vers Acorn
