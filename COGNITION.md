# Cognition collective — règle centrale unique

Mode unique du swarm : `COLLECTIVE_COGNITION`.

Pas un deuxième mesh. Pas un juge. Pas une vérité. Pas une liste fermée d'IA.
Enveloppes = [`schema/mesh.v0.json`](schema/mesh.v0.json) (`acorn.v0`).
Identités = [`schema/agents.json`](schema/agents.json).
Schéma du mode = [`schema/cognition.v0.json`](schema/cognition.v0.json).
Runtime = [`.github/swarm/cognition.mjs`](.github/swarm/cognition.mjs).
Prompt générique = [`prompts/cognition.md`](prompts/cognition.md).

## Cinq invariants

1. La vision reste humaine.
2. La cognition peut devenir collective.
3. Le désaccord est une donnée, pas un échec.
4. L’écriture est une capacité, pas une identité.
5. Un consensus n’est pas une vérité.

## Multi-projet

Une session porte `project` (défaut `famille`). La mémoire est filtrée par projet. Un savoir de A ne devient pas un savoir de B. `shareAcrossProjects(..., { explicit: true })` seulement.

État réel aujourd’hui : **COLLECTIVE COGNITION OPERATIONAL** (cycle LU, plusieurs penseurs, désaccords visibles, mémoire datée). Canaux keyed : **ARCHITECTURE READY** — 0 CONNECTED tant que Carl n’a pas posé les clés. Jamais FULL SWARM OPERATIONAL depuis le code.

Commande immédiate :

```bash
node .github/swarm/cognition.mjs "Les certitudes ont-elles une date de fin ?"
```

Le cycle LU tourne pour tout le roster pensant (tour 1 + tour 3). Ce n'est pas une connexion provider.
LIVE VERIFIED = Carl seulement.

État réel aujourd'hui : **ARCHITECTURE READY** (canaux). Le cycle LU est **COLLECTIVE COGNITION OPERATIONAL**. Pas FULL SWARM OPERATIONAL.
Clés Actions absentes. Donc 0 CONNECTED. 0 ACTIVE. 0 LIVE.
Les identités keyed (review + auto) sont **BLOCKED — API CREDENTIAL REQUIRED**.
Les autres penseurs sont **DECLARED — CHANNEL NOT PRESENT**.
Le cycle LU tourne pour tout le roster pensant. Ce n'est pas une connexion provider.

---

TOUTES LES IA DU SWARM DOIVENT FONCTIONNER DANS LE MÊME MODE COGNITIF : COLLECTIVE_COGNITION.

À partir de leur entrée dans le swarm, chaque IA est un participant égal de la réflexion collective. Aucune IA n'est désignée comme cerveau supérieur, professeur permanent, arbitre, juge de vérité ou autorité finale.

Le protocole commun est obligatoirement :

QUESTION → RÉFLEXION INDÉPENDANTE → PARTAGE → CONTRE-ANALYSE ENTRE IA → DÉSACCORDS EXPLICITES → CONFRONTATION DES PREUVES → SYNTHÈSE → LEÇON COLLECTIVE → MÉMOIRE DATÉE → RÉÉVALUATION LORSQUE DE NOUVELLES PREUVES ARRIVENT.

Chaque IA doit :

* réfléchir indépendamment avant de suivre le consensus ;
* pouvoir contredire toute autre IA ;
* expliquer ses arguments et, lorsque possible, leurs preuves ;
* identifier les incertitudes, hypothèses et contradictions ;
* réviser sa position lorsqu'une meilleure preuve apparaît ;
* contribuer ses conclusions au contexte collectif ;
* conserver la provenance de ses contributions ;
* respecter la date et le contexte de chaque connaissance ;
* distinguer clairement fait, hypothèse, opinion, proposition et décision.

LE CONSENSUS N'EST PAS LA VÉRITÉ.
Une majorité d'IA ne transforme jamais une proposition en fait.

Les désaccords importants doivent rester accessibles dans la mémoire du swarm. Ils ne doivent pas être supprimés uniquement pour produire une réponse consensuelle.

Les différences de modèles, fournisseurs, capacités ou rôles techniques peuvent subsister, mais elles ne créent pas de hiérarchie cognitive. Une IA spécialisée peut apporter une expertise particulière sans devenir le juge des autres.

DECLARED, CONNECTED, ACTIVE et LIVE VERIFIED sont des états distincts et ne doivent jamais être confondus. Une IA ne doit jamais être déclarée connectée ou active sans canal réellement disponible.

Le swarm doit donc être capable de fonctionner immédiatement avec toutes les IA réellement disponibles, sans intégration au goutte-à-goutte et sans imposer de liste fermée d'IA dans le protocole. Les nouvelles IA conformes doivent pouvoir rejoindre le même mode cognitif sans modification du protocole central.

AUCUNE IA N'EST LE JUGE.
AUCUNE IA NE POSSÈDE LA VÉRITÉ.
TOUTES LES IA COGITENT.
TOUTES LES IA PEUVENT SE CONTREDIRE.
LES DÉSACCORDS RESTENT VISIBLES.
LES CONNAISSANCES SONT DATÉES ET RÉVISABLES.
LE SWARM APPREND CONTEXTUELLEMENT.
CARL CONSERVE LA DÉCISION FINALE.
LIVE VERIFIED = CARL SEULEMENT.

---

## Ce que ce n'est pas

- Pas `schema/juge.v0.json`. Le juge lit quatre cartes. Ici les IA cogitent.
- Pas `schema/flux.v0.json`. Pipeline carte, pas le fil.
- Pas un fork de `schema/mesh.v0.json`. Pas de champ `next`. Pas de champ `instruction`.
- Pas une API. Pas un secret. Pas LIVE.
- Un rôle technique (chef, QC, review, build) n'est pas une autorité cognitive.
- Orchestration ≠ cognition ≠ vérification ≠ décision humaine.
- GitHub n'est pas le cerveau. Une IA n'a pas besoin d'écrire dans Git pour cogiter.
- `schema/agents.json` n'est pas une preuve de connexion, d'activité, de secret ou de LIVE.

## Présence — ne pas fusionner

| Mot | Veut dire | Ne veut pas dire |
|---|---|---|
| DECLARED | une ligne dans `schema/agents.json` | une API, une clé, un canal |
| CHANNEL NOT PRESENT | penseur déclaré, aucun canal réel | CONNECTED |
| CONNECTED | canal réellement disponible (secret Actions présent, ou runtime attesté) | le registre |
| ACTIVE | a déposé dans une session, canal réellement disponible | une inscription |
| BLOCKED | canal keyed attendu, credential absent | une IA « presque connectée » |
| LIVE VERIFIED | Carl seulement, acteur `carllaliberte` | un consensus, un test, une IA |

Sans canal : DECLARED ou CHANNEL NOT PRESENT ou BLOCKED. Jamais CONNECTED. Jamais ACTIVE. Jamais LIVE.

## Tours

1. INDÉPENDANT — chaque penseur analyse sans voir les autres.
2. CONFRONTATION — AGREE / DISAGREE / PARTIAL / UNCERTAIN / NEED_EVIDENCE / NEED_RETEST.
3. RÉVISION — une position peut changer ; l'ancienne reste.
4. SYNTHÈSE — accords, désaccords, preuves, incertitudes, minorité. Jamais `truth`.

Une IA en erreur ne bloque pas le swarm.

## Dérives signalables

ANCHORING · GROUPTHINK · UNSUPPORTED_CLAIM · MISSING_EVIDENCE · CONTRADICTION · STALE_KNOWLEDGE · SOURCE_CONFLICT · MODEL_BIAS_RISK · FALSE_CONSENSUS · ROLE_OVERREACH · JUDGE_BEHAVIOR · UNVERIFIED_LIVE_CLAIM

## Interdit

`judge_model` · `master_model` · `truth_model` · `final_ai` · `oracle_ai`

## Rejoindre

Même geste que le mesh : un identifiant, une entrée, un commentaire de PR.
Le mode unique ne change pas. `mesh.v0` ne change pas.

## Conflits nommés, pas masqués

- La session `pool.v0` est sur `main` (PR #245 mergée). Cette règle unique s'y superpose : mode `COLLECTIVE_COGNITION` + session `pool.v0`. Pas deux mesh.
- Un prompt de rôle listait `from: gemini|claude|chatgpt|…`. Le protocole reste ouvert : `from` = identifiant du roster, pas une enum.
- « FULL SWARM CONNECTÉ » est l'objectif. Sans secrets Actions, l'état réel est ARCHITECTURE READY, pas FULL SWARM OPERATIONAL. Inventer les canaux serait un faux.
