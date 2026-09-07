# Revue — deux phases

Ne change pas [AUTOMATION.md](AUTOMATION.md). Canal quotidien (swarm, `/flux`, commentaires PR) reste là.

Ceci est **un autre protocole**. Carl le porte à la main. Pas de webhook. Pas de bot inter-IA. Swarm ne circule pas les verdicts REVUE.

Carl seul point de contrôle humain. Carl seul merge. Aucun participant n'obtient l'écriture par défaut. Pas de secrets. Pas de squash par une IA.

Carl ne débat pas. Il lit les verdicts et la PR finale.

---

## Registre nominatif (fixe)

Deux identités Grok, **distinctes et non-interchangeables**. Jamais la même session le même jour.

| Id | Nom | Fait | Ne fait pas |
|---|---|---|---|
| `arbitre` | Grok Arbitre | lit le paquet complet **après** Phase 1+2, tranche, motive | Phase 1, Phase 2, code, PR, merge |
| `build` | Grok Build | Phase 2 (débat), écrit le code, ouvre la PR | arbitrer, merge, secrets |

Grok Arbitre n'apparaît **jamais** au registre Phase 2. N'est jamais invitée à débattre, quel que soit le sujet ou l'urgence.

Si aucune instance dédiée n'est disponible : l'arbitrage **attend**. Ne bascule jamais sur une variante ayant participé au débat ce jour-là, même temporairement.

### Lecteurs Phase 1 (verdict indépendant)

Claude · Gemini · ChatGPT · DeepSeek. Futurs arrivants : même rôle par défaut.

Gemini n'est pas lecteur-seul du chantier. Ici : Phase 1 **et** Phase 2, comme les autres.

### Participants Phase 2 (discussion ouverte)

Les lecteurs Phase 1 **plus** l'environnement Grok xAI **sauf** l'arbitre :

`heavy` · `build` · `expert` · `fast` · `auto` · `grok-bot` · variantes futures.

Carl n'est pas participant.

### Écriture / exécution

Seul `build` écrit du code et ouvre la PR. Seul Carl merge.

---

## a) Verdict Phase 1

Carl diffuse **le même lot d'URLs raw** à tous les lecteurs en même temps. Chaque lecteur rend **sans voir les autres**. Collage interdit. Aucune référence croisée.

```
REVUE phase:1
id: <nom exact du modèle/variante>
from: <claude|gemini|chatgpt|deepseek|…>
ts: <ISO-8601 UTC>
urls:
  - <url raw>
verdict: LU | HOLD | OBJECTION
motif: <une phrase>
phase2_seen: false
```

`phase2_seen: false` est obligatoire. Un verdict qui cite un pair est refusé (ce n'est plus Phase 1).

---

## b) Transmission Phase 1 → Phase 2

Carl collecte les verdicts bruts. Carl transmet **l'ensemble** aux participants Phase 2. Pas swarm. Pas Grok Build comme facteur automatique.

```
REVUE phase:1-paquet
ts: <ISO-8601 UTC>
porteur: carl
lots:
  - <coller chaque bloc phase:1, inchangé>
```

Carl ne commente pas le fond. Il ne fusionne pas les motifs.

---

## c) Discussion Phase 2 (signée)

Chaque participant réagit, contredit, propose. **Nom exact. Daté. Rien d'anonyme.**

```
REVUE phase:2
id: <nom exact>
from: <claude|gemini|chatgpt|deepseek|heavy|build|expert|fast|auto|grok-bot|…>
ts: <ISO-8601 UTC>
repond_a: <id visé ou *>
acte: ACCORD | OBJECTION | PROPOSITION
corps: <texte>
```

Interdit : `from: arbitre`. Interdit : anonyme. Interdit : Carl dans `from`.

`build` peut débattre ici. `arbitre` non.

---

## d) Transmission vers Grok Arbitre

Carl transmet Phase 1 **et** Phase 2 à **Grok Arbitre seulement**. Jamais à Grok Build pour décision.

```
REVUE phase:arbitre-paquet
ts: <ISO-8601 UTC>
porteur: carl
destinataire: arbitre
phase1: <paquet b, inchangé>
phase2: <tous les blocs c, inchangés>
```

Build ne reçoit pas ce paquet pour trancher. Build reçoit **e)** après.

---

## e) Arbitrage

Grok Arbitre lit le paquet, tranche, motive. 1–2 phrases. Dit ce qui a pesé.

```
REVUE phase:arbitrage
from: arbitre
ts: <ISO-8601 UTC>
decision: AVANCER | AJUSTER | BLOQUE
pesee: <1-2 phrases>
phase2_participated: false
instance: dediee
distincte_de_phase2_ce_jour: true
```

`phase2_participated: false` est **structurel** : l'instance n'est pas dans le registre Phase 2 et n'a pas tourné en Phase 2 ce jour-là. Pas une phrase de politesse.

Décisions :

| `decision` | Grok Build |
|---|---|
| `AVANCER` | ouvre la PR telle quelle |
| `AJUSTER` | ouvre la PR avec les ajustements nommés dans `pesee` |
| `BLOQUE` | n'ouvre pas. HOLD + motif |

Puis Carl transmet **e)** à `build`. `build` exécute. Carl merge ou refuse.

---

## Traçabilité

| Étape | Qui écrit | Qui lit |
|---|---|---|
| a | chaque lecteur, seul | Carl |
| b | Carl (copie) | participants Phase 2 |
| c | chaque participant, signé | Carl |
| d | Carl (copie) | `arbitre` seulement |
| e | `arbitre` | Carl, puis `build` |
| PR | `build` | Carl |
| merge | Carl | — |

GitHub peut **héberger** une copie (commentaire de PR) **après** que Carl l'ait portée. Ce n'est pas swarm qui déclenche la circulation.

---

## Interdit

- Changer [AUTOMATION.md](AUTOMATION.md) pour faire porter REVUE par swarm.
- Webhook, bot inter-IA, cron qui diffuse les verdicts.
- `arbitre` en Phase 1 ou Phase 2.
- Même session Grok : Phase 2 le matin, arbitrage le soir.
- Collage apps. Secrets dans git. Merge / squash par une IA.
- Écriture par défaut pour un lecteur.

HOLD + URL si un outil refuse Git. Carl colle le bloc REVUE, pas FILE.md.
