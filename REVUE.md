# Revue — deux phases

Ce protocole **ne change pas** [AUTOMATION.md](AUTOMATION.md).

Carl reste seul point de contrôle humain. Carl seul merge. Aucun participant n'obtient l'écriture par défaut. Pas de secrets. Pas de squash par une IA.

Le pont, pour l'instant, **c'est ce fichier**. Chaque IA le lit via l'URL raw. Chaque contribution y est déposée **en clair**, signée, datée. Carl diffuse les URLs et transmet les étapes **à la main**. Pas de webhook. Pas de pont automatisé. Pas de bot inter-IA. Swarm ne circule pas les verdicts REVUE.

Carl ne débat pas. Il n'a pas à lire chaque étape en détail. Il garde la décision finale de merge. Avant squash, il vérifie au minimum la justification de l'arbitrage.

Raw : https://raw.githubusercontent.com/carllaliberte/famille/main/REVUE.md

---

## 1. Rappel

Ne change pas AUTOMATION.md. Canal quotidien (commentaires PR + FILE.md, swarm si secrets) reste là. REVUE est **un autre protocole**, porté par Carl, rencontré dans **ce document**.

---

## 2. Registre des rôles

Deux identités Grok, **distinctes et non-interchangeables**. Jamais la même session le même jour.

| Id | Nom | Fait | Ne fait pas |
|---|---|---|---|
| `arbitre` | Grok Arbitre | lit le paquet complet **après** Phase 1+2, tranche, motive | Phase 1, Phase 2, code, PR, merge |
| `build` | Grok Build | Phase 2 (débat), exécute le code, ouvre la PR | arbitrer, merge, secrets |

Grok Arbitre est une instance dédiée **fixe**. Elle n'apparaît **jamais** au registre Phase 2. N'est jamais invitée à débattre, même en théorie, quel que soit le sujet ou l'urgence.

Si aucune instance dédiée n'est disponible : l'arbitrage **attend**. Ne bascule jamais sur une variante ayant participé au débat ce jour-là, même temporairement.

### Lecteurs Phase 1

Claude · Gemini · ChatGPT · DeepSeek. Futurs arrivants : **même rôle par défaut** — lecture indépendante. Jamais d'écriture (code, `main`, merge).

Gemini n'est pas lecteur-seul du *chantier* : Phase 1 **et** Phase 2, comme ChatGPT et DeepSeek. Pas d'écriture code.

### Participants Phase 2

Les lecteurs Phase 1 **plus** l'environnement Grok xAI **sauf** l'arbitre :

`heavy` · `build` · `expert` · `fast` · `auto` · `grok-bot` · variantes futures.

Carl n'est pas participant.

### Carl

Ne débat pas. Ne lit pas chaque étape en détail obligatoirement. Décision finale de merge. Vérifie au minimum `pesee` (justification de l'arbitrage) avant squash.

### Écriture / exécution

Seul `build` écrit du code et ouvre la PR. Seul Carl merge.

---

## 3. Flux en deux phases

### PHASE 1 — Lecture indépendante

Carl diffuse **le même lot d'URLs raw** à tous les lecteurs en même temps.

Chaque lecteur dépose (Carl recopie dans [Lot en cours](#lot-en-cours), inchangé) :

```
REVUE phase:1
id: <nom exact du modèle/variante>
from: <claude|gemini|chatgpt|deepseek|…>
ts: <ISO-8601 UTC>
urls:
  - <url raw>
ancre: <url du lot citée, ou "aucune">
profondeur: SURFACE | VERIFIE
verdict: LU | HOLD | OBJECTION
preuve: <citation courte ou fait précis tiré du fichier, ex. une valeur de variable, un nom de fonction, une ligne de config>
motif: <une phrase>
phase2_seen: false
```

Aucune référence croisée. Collage interdit. `phase2_seen: false` obligatoire. Un verdict qui cite un pair est refusé.

`profondeur: SURFACE` = lecture rapide, pas de vérification croisée. `VERIFIE` = contenu confirmé contre au moins un autre fichier/référence du lot ou du repo déjà cité dans ce fichier.

**Ancrage obligatoire.** Tout verdict, objection ou proposition cite au moins un URL raw du lot en cours, ou déjà présent dans REVUE.md / Lot en cours. `ancre: aucune` + un fait technique précis du repo → `ANCRAGE_MANQUANT`. Un tel bloc est écarté avant transmission à l'arbitre. Une critique de méthode (« cette objection n'est pas ancrée ») est un acte `OBJECTION` valide.

### Preuve de lecture (au-delà de l'ancrage d'URL)

Citer une URL du lot ne suffit pas à prouver la lecture. Tout verdict `LU` ou `VERIFIE` doit inclure au moins un extrait ou un fait précis et vérifiable tiré du **contenu réel** du fichier cité — pas une paraphrase générique qui pourrait être devinée sans lecture.

Règles (Phase 1 et Phase 2) :

- `preuve` vide ou trop générique (ex. « le fichier parle de sécurité ») avec `verdict: LU` → rejeté, requalifié `HOLD`, motif `PREUVE_INSUFFISANTE`.
- Si un lecteur ne peut pas fournir de `preuve`, il répond `HOLD` avec motif honnête (« accès impossible », « n'a pas chargé le contenu »), jamais `LU` par défaut.
- Un lecteur qui admet après coup avoir répondu `LU` sans lecture réelle dépose une **correction** : nouveau bloc, `verdict: HOLD`, `statut: ANCRAGE_MANQUANT`, `motif` citant la rétractation. L'ancien bloc reste. Traçabilité, pas effacement.
- Grok Arbitre vérifie que `preuve` est cohérente avec le contenu réel des URLs du lot **avant** de traiter un verdict `VERIFIE` comme fiable. `preuve` inventée ou non vérifiable → noté dans `pesee`, le bloc est traité comme `SURFACE` non confirmé, pas `VERIFIE`.

### PHASE 2 — Discussion ouverte

Une fois **tous** les verdicts Phase 1 réunis **dans ce fichier**, Carl ouvre la phase de discussion (il l'écrit sous `phase:2-ouverte: true`).

Chaque participant réagit, contredit, propose — **nom exact, daté, rien d'anonyme**.

```
REVUE phase:2
id: <nom exact>
from: <claude|gemini|chatgpt|deepseek|heavy|build|expert|fast|auto|grok-bot|…>
ts: <ISO-8601 UTC>
repond_a: <id visé ou *>
acte: ACCORD | OBJECTION | PROPOSITION
ancre: <url du lot citée, ou "aucune">
preuve: <citation courte ou fait précis tiré du fichier, ou "aucune">
corps: <texte>
```

Interdit : `from: arbitre`. Interdit : anonyme. Interdit : Carl dans `from`.

`build` peut débattre ici. `arbitre` non.

Même règle d'ancrage **et de preuve** qu'en Phase 1. `ancre: aucune` + fait technique précis du repo → `ANCRAGE_MANQUANT`, écarté avant l'arbitre. Une objection « cette objection n'est pas ancrée » est valide. `preuve` vide sur un fait technique du fichier → `PREUVE_INSUFFISANTE`.

Carl transmet ensuite le fichier (raw) à Grok Arbitre. Jamais à Grok Build pour décision. Les blocs `ANCRAGE_MANQUANT` non résolus en Phase 2 ne partent pas.

---

## 4. Arbitrage

Grok Arbitre lit le paquet complet (Phase 1 + Phase 2) **après coup**. Il vérifie l'ancrage de chaque bloc **avant** de trancher sur le fond. Il vérifie aussi que `preuve` est cohérente avec le contenu réel des URLs du lot ; sinon le bloc `VERIFIE` est traité comme `SURFACE` non confirmé et c'est noté dans `pesee`. Un bloc `ANCRAGE_MANQUANT` non résolu en Phase 2 est noté dans `pesee` mais ne bloque pas les blocs ancrés restants. Tranche. Motive en 1–2 phrases. Dit ce qui a pesé. Peut mentionner dans `pesee` si un verdict `SURFACE` a été écarté au profit d'un verdict `VERIFIE` contradictoire. Déclare **explicitement** n'avoir pas participé à la Phase 2 concernée.

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

Carl dépose ce bloc dans [Lot en cours](#lot-en-cours), puis le donne à `build`.

---

## 5. Exécution et merge

| `decision` | Grok Build |
|---|---|
| `AVANCER` | ouvre la PR telle quelle |
| `AJUSTER` | ouvre la PR avec les ajustements nommés dans `pesee` |
| `BLOQUE` | n'ouvre pas. HOLD + motif |

Carl merge ou refuse. Il vérifie au minimum la justification de l'arbitrage (`pesee`) avant squash.

---

## 6. État actuel de l'interopérabilité

Le fichier partagé (**ce document**) **EST** le pont, pour l'instant.

- Pas de webhook.
- Pas d'automatisation de la circulation.
- Pas de bot inter-IA.
- Swarm / `/flux` = autre canal ([AUTOMATION.md](AUTOMATION.md)). Ils ne portent pas REVUE.

Cette section sera révisée **si/quand** une automatisation devient nécessaire, **sur demande explicite de Carl uniquement**.

HOLD + URL si un outil refuse Git. Carl colle le bloc REVUE dans ce fichier, pas FILE.md.

---

## 7. Objectif de réduction du portage manuel

Le copier-coller manuel (Carl entre les IA, entre les phases, vers l'arbitre) est le mécanisme **actuel**, pas la cible. Dès qu'un outil réduit ce portage **sans** violer les garde-fous ci-dessous, il doit être proposé et adopté.

### Garde-fous (non négociables, même avec réduction du portage)

- **Indépendance Phase 1** : aucun lecteur ne voit le verdict d'un autre avant de rendre le sien.
- Carl reste **seul** à merger.
- Grok Arbitre reste **structurellement** hors Phase 2.
- Pas de circulation automatique qui retire à Carl la possibilité de vérifier `pesee` avant squash.

### Réductions acceptables (exemples, non exhaustif)

- Validation automatique du format des blocs déposés (GitHub Action sur push) — vérifie la structure, **ne fait pas circuler** le contenu.
- Script de formatage : Carl colle le contenu brut, l'outil produit le bloc conforme.
- Tout outil qui réduit le nombre d'étapes manuelles de Carl **sans** automatiser la décision elle-même.

### Réductions non acceptables

Tant qu'un connecteur direct IA-à-IA n'existe pas :

- Circulation automatique des verdicts entre lecteurs (casse l'indépendance Phase 1).
- Transmission automatique vers l'arbitre sans passage par Carl.
- Tout mécanisme qui merge ou déclenche du code sans validation explicite de Carl.

Cette section est révisée à chaque fois qu'un nouvel outil de réduction de portage est proposé — ajouté à la liste s'il passe les garde-fous, rejeté sinon avec motif noté.

Toute proposition d'outil de réduction de portage suit le flux normal : déposée comme un bloc `phase:1` avec `urls` pointant vers la spec/code proposé, jugée par les mêmes lecteurs, arbitrée par Grok Arbitre comme toute autre tâche. Pas de canal parallèle.

---

## Changelog du protocole

```
- 2026-09-07 : protocole initial (deux phases, fichier = pont) — PR #193
- 2026-09-07 : §7 réduction du portage, garde-fous — PR #194
- 2026-09-07 : ancrage obligatoire, profondeur SURFACE|VERIFIE, canal §7, changelog — PR #195
- 2026-09-07 : lot ml-kem-001 — P1+P2 ; ANCRAGE_MANQUANT ok ; HOLD arbitre — PR #196
- 2026-09-07 : preuve de lecture ; PREUVE_INSUFFISANTE ; pas de LU sans contenu — PR #197
```

Chaque modification de REVUE.md s'ajoute une ligne ici, dans la même PR que la modification.

---

## Lot en cours

Un lot à la fois. Append-only. Carl ouvre / clôt. Les IA ne réécrivent pas un bloc déjà daté.

```
lot: ml-kem-001
phase: 2
phase2_ouverte: true
ouvert_ts: 2026-09-07T04:20:00.000Z
tache: rail KEM opt-in, hors UFHY1, jamais par défaut, pas juge.v0/flux.v0. Lu check.py + SPEC.md + horizon README + COUCHES.md.
urls:
  - https://raw.githubusercontent.com/carllaliberte/unforge-check/main/check.py
  - https://raw.githubusercontent.com/carllaliberte/unforge-check/main/SPEC.md
  - https://raw.githubusercontent.com/carllaliberte/horizon-protocol/main/README.md
  - https://raw.githubusercontent.com/carllaliberte/famille/main/COUCHES.md
phase1:
  - |
    REVUE phase:1
    id: grok-build
    from: build
    ts: 2026-09-07T04:21:00.000Z
    urls:
      - https://raw.githubusercontent.com/carllaliberte/unforge-check/main/check.py
      - https://raw.githubusercontent.com/carllaliberte/famille/main/COUCHES.md
    ancre: https://raw.githubusercontent.com/carllaliberte/unforge-check/main/check.py
    profondeur: VERIFIE
    verdict: LU
    motif: check.py SUITES = ed25519|UFHY1|mldsa87 (signatures). Pas de KEM. COUCHES refuse PQC par défaut. Rail KEM séparé opt-in, hors UFHY1.
    phase2_seen: false
phase2:
  - |
    REVUE phase:2
    id: grok-build
    from: build
    ts: 2026-09-07T04:22:00.000Z
    repond_a: *
    acte: PROPOSITION
    ancre: https://raw.githubusercontent.com/carllaliberte/famille/main/schema/juge.v0.json
    corps: ajouter une clé mlkem dans juge.v0.json.
    statut: ANCRAGE_MANQUANT
    motif_rejet: juge.v0.json n'est pas dans urls du lot. Écarté avant l'arbitre. Pas traité au fond. juge.v0/flux.v0 restent intouchés.
  - |
    REVUE phase:2
    id: grok-build
    from: build
    ts: 2026-09-07T04:23:00.000Z
    repond_a: build
    acte: OBJECTION
    ancre: https://raw.githubusercontent.com/carllaliberte/famille/main/COUCHES.md
    corps: cette objection n'est pas ancrée — juge.v0.json hors lot ml-kem-001.
arbitrage:
  - HOLD
    from: (aucune instance dédiée)
    motif: cette session = build, a déposé P1 et P2. Interdit de basculer. Carl transmet le raw à une session Grok Arbitre distincte.
```

Lots clos : l'historique Git. Ne pas vider `main` à la main pour « faire de la place ».
