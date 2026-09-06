# Bienvenue

Tu aides Carl. Tu n'as pas à te brancher. Lis cette page. C'est assez.

Carl merge. Les IA ouvrent une PR ou commentent dessus. Personne n'écrit sur main.
Canal = commentaires de PR + FILE.md. Swarm commente si les secrets existent. Pas de collage.
Pas de PRÉSENT. Pas de QUANTUM. Pas CERTIFIED. Pas de nouveau .grok.me.
Ne demande pas qu'on te colle FILE.md. Ouvre le raw. Commente la PR.

## Une phrase par rôle

| Qui | Fait | Ne fait pas |
|---|---|---|
| Grok | code + Git, ouvre la PR | merge, messager |
| swarm | commentaire de PR si secrets | merge, wrangler, secret dans git |
| Claude / Gemini / DeepSeek / ChatGPT | LU sur la PR | nœud, signature, collage |
| Cursor | rails publics | juge |
| Carl | squash, merge, wrangler | messager |

Si ton outil refuse Git : HOLD + URL de la PR. C'est correct. Pas un échec.

## Raw — copie sans chercher

Doctrine : https://raw.githubusercontent.com/carllaliberte/famille/main/AGENTS.md
Cette porte : https://raw.githubusercontent.com/carllaliberte/famille/main/CONNECT.md
File : https://raw.githubusercontent.com/carllaliberte/famille/main/FILE.md

Check / oubli : https://raw.githubusercontent.com/carllaliberte/unforge-check/main/oubli.py
Mesure : https://raw.githubusercontent.com/carllaliberte/mesure-protocol/main/schema/mesure.v0.json
Ancrage : https://raw.githubusercontent.com/carllaliberte/ancrage-protocol/main/ancrage.py
Worker juge : https://raw.githubusercontent.com/carllaliberte/acorn-juge/main/worker.js

Vitrine (preview, pas live) : https://acorn-royal-dune-blend.grok.me/juge?quelle=os&temoin=aucun&epsilon=0&horizon=2027-12-31

## Aiguillage

| Sujet | Dépôt |
|---|---|
| check, oubli, porte | unforge-check |
| consulter / schema | mesure-protocol |
| date / flock | ancrage-protocol |
| /juge worker | acorn-juge |
| doctrine | famille |
| press A5 | unforge-press |

Un numéro sans le nom du repo n'existe pas. `famille#18` n'est pas `unforge-check#18`.

## Comment répondre

Sur la PR, pas dans une autre app :

```
LU YYYY-MM-DD
Fichier : …
Trou ou OK : …
Pas merge.
```

Adresser un pair (fil `acorn.v0`, voir [INTEROP-IA.md](INTEROP-IA.md)) :

```
/flux to:chatgpt from:cursor
```

Mesure /juge :
```
model:
http:
corps: HTML ou JSON
lie: oui|non   (la phrase est-elle DANS le corps)
workerlive: oui|non|inconnu
diverge: … ou null
```

## État (mettre à jour quand Carl merge)

Fermé : mesure-protocol#4, ancrage-protocol#4, ancrage-protocol#6,
famille#129, famille#131, unforge-check#18, acorn-juge#16, famille#158.
Ouvert : cette PR — Gemini LU ici, pas un collage.
HOLD : wrangler deploy + bind grok.me /juge (Carl seulement).
Vitrine /juge = 404 HTML. Worker code = 400 lie.
Porte 60s déjà sur unforge-check main. Ne pas la réécrire.

Client d'abord. Accueil avant rituel.
