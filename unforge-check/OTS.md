# OTS v0 — ancrage OpenTimestamps

Rail **séparé**. Preuve d'antériorité, pas un sceau FAMILLE. Pas Check. Pas HORIZON. Pas une 4e carte juge. Pas KEM.

Check (`check.py`) **vérifie** Ed25519 / `UFHY1`. Il ne signe pas. Il n'ancre pas un SHA dans un calendrier.

HORIZON nomme une *hypothèse de sceau* et un jour de calendrier. Ce rail-ci notarie **qu'un SHA a existé** à un moment, indépendamment de GitHub.

Lu : [famille/AUTOMATION.md](https://github.com/carllaliberte/famille/blob/main/AUTOMATION.md), [famille/KEM.md](https://github.com/carllaliberte/famille/blob/main/KEM.md), [opentimestamps-client](https://github.com/opentimestamps/opentimestamps-client).

## Primitive

```
push sur main (après squash Carl)
  + SHA du commit
  + calendriers OTS publics
  →  .ots-anchor/<sha>.sha.ots   (pending, puis complete)
```

Sans merge de Carl : rien. Jamais sur une PR ouverte. Jamais sur une branche de travail.

Le stamp initial **n'attend pas** (`ots stamp` sans `--wait`). La preuve est d'abord *pending* (calendrier seul). L'inclusion dans un bloc Bitcoin confirmé peut prendre plusieurs heures. Le cron `ots-upgrade` tente de finaliser.

## Pourquoi

GitHub peut réécrire l'affichage d'un historique. Un tiers ne doit pas avoir à croire GitHub pour dire « ce SHA existait à cette date ».

OpenTimestamps soumet le hash du fichier `.sha` (qui contient le SHA du commit) à des calendriers publics gratuits et anonymes. Bitcoin sert de **notaire** : une fois la preuve *complete*, la vérification ne dépend plus de GitHub ni de l'infra de Carl.

Pas un L1 Famille. Pas un mint. Pas un reçu d'argent. Pas une 5e carte.

## Vérifier (tierce partie — sans l'infra de Carl)

Fichiers : `.ots-anchor/latest.sha` (le SHA) et `.ots-anchor/latest.sha.ots` (la preuve). Même paire sous `.ots-anchor/<sha>.sha` + `.ots-anchor/<sha>.sha.ots`.

```bash
pip install opentimestamps-client
ots verify .ots-anchor/latest.sha.ots
```

`ots verify` lit le fichier `.sha` à côté du `.ots`. Rien d'autre à configurer pour un stamp *pending* (les calendriers publics suffisent).

Pour une preuve *complete*, la vérification la plus forte se fait contre un nœud Bitcoin (un nœud élagué suffit) :

```bash
ots --bitcoin-node http://USER:PASS@127.0.0.1:8332/ verify .ots-anchor/latest.sha.ots
```

Sans nœud, le client peut encore afficher l'attestation calendrier / le chemin une fois upgradé ; le nœud Bitcoin reste la source indépendante.

Ce dépôt n'héberge pas de nœud. Un tiers apporte le sien, ou s'en tient aux calendriers le temps que la preuve soit *complete*.

## États

| État | Ce que ça dit | Ce que ça ne dit pas |
|---|---|---|
| *pending* | un calendrier OTS public a reçu le hash | inclusion Bitcoin confirmée |
| *complete* | un bloc Bitcoin atteste l'existence du hash | que le commit est « vrai », signé, ou jugé |

*pending* → *complete* : souvent quelques heures, parfois plus. `ots upgrade` sur le `.ots` récupère le chemin d'inclusion. Le cron quotidien `.github/workflows/ots-upgrade.yml` le tente.

Un merge n'est pas une inclusion. Un fichier `.ots` *pending* n'est pas une preuve Bitcoin.

## Workflows (famille)

| Fichier | Déclencheur | Fait |
|---|---|---|
| `.github/workflows/ots-anchor.yml` | `push` vers `main` seulement | écrit le SHA, `ots stamp`, commit `ots-bot` |
| `.github/workflows/ots-upgrade.yml` | cron quotidien + `workflow_dispatch` | `ots upgrade` sur chaque `.ots` pending, commit si changement |

Identité git : `ots-bot` / `ots-bot@users.noreply.github.com`. Pas le compte de Carl. Message : `ots: anchor <sha>` ou `ots: upgrade`.

Si rien à committer : le job sort 0.

Aucun secret Actions pour le stamp initial. Les calendriers publics sont gratuits et anonymes.

## Verrous

- Jamais sur `pull_request`. Jamais sur une branche de travail.
- Jamais avant le squash de Carl. Le workflow n'existe sur `main` qu'après squash explicite — c'est l'activation.
- `ots-bot` n'est pas un bot FAMILLE. Un bot = un rail. Ici le rail est OpenTimestamps, notaire externe.
- Pas fusionné dans `juge.v0.json` ni `flux.v0.json`. Pas une 5e carte. Pas une clé juge.
- Pas câblé dans `check.py`. Check ne lit pas `.ots`.
- Pas une activation PQC. UFHY1 reste signatures.
- Pas un L1, pas un mint, pas un avis juridique.
- Exception mécanique au « Carl squash / jamais push main » : documentée dans [AUTOMATION.md](https://github.com/carllaliberte/famille/blob/main/AUTOMATION.md). Carl lève cette exception en squashant la PR qui l'introduit.

## Limites (honnêtes)

- Tant que la preuve est *pending*, il reste une **dépendance aux calendriers publics OTS**. Si un calendrier disparaît avant l'`upgrade`, ce stamp-là peut rester incomplet.
- La disponibilité d'un calendrier n'est **pas garantie à vie**. Mitigation : le cron `ots-upgrade` vise à finaliser vite (heures, pas années).
- Une preuve *complete* se vérifie contre Bitcoin. Elle ne dit pas qui a écrit le commit, ni que le juge FAMILLE a permis quoi que ce soit.
- GitHub Actions doit pouvoir pousser sur `main` (identité `ots-bot` via `GITHUB_TOKEN`). Si `main` est protégée, Carl autorise `github-actions[bot]` à pousser. Ce n'est pas un secret dans le dépôt.
- `GITHUB_TOKEN` ne relance pas les workflows sur son propre push — pas de boucle. Garde supplémentaire : `paths-ignore: .ots-anchor/**` et skip des messages `ots:`.

## Vérifié vs présumé

| Affirmation | Statut |
|---|---|
| le workflow stamp n'écoute pas `pull_request` | **vérifié** (YAML) |
| pas de secret Actions pour `ots stamp` | **vérifié** (YAML) |
| `ots stamp` sans `--wait` | **vérifié** (YAML) |
| identité `ots-bot`, message `ots: anchor <sha>` | **vérifié** (YAML) |
| job vert s'il n'y a rien à committer | **vérifié** (YAML) |
| `juge.v0` / `flux.v0` intouchés | **vérifié** |
| calendriers OTS publics restent joignables | **présumé** (tiers, pas ce dépôt) |
| une preuve *complete* est opposable sans GitHub | **présumé** (protocole OTS + Bitcoin, pas un théorème de ce dépôt) |
| délai d'inclusion | **présumé** (heures, variable) |

Rien ici n'est un sceau. Un merge n'est pas une inclusion Bitcoin.
