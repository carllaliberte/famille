# Cognitive fabric v1 — moteur local

Prolonge v0. Pas un second roster. `auto_merge=false`. Authority = carl.

## Exécuté (moteur in-process)

`runEngine()` traverse :

observe → understand → discover → compose → delegate → work → transfer → measure → verify → object → correct → synthesize → human_decision

Workers : `kind=deterministic_test`. `executed:true` = le moteur a tourné. `live:false` toujours.

## Non exécuté

- aucun fournisseur IA externe
- aucun workflow GitHub
- MERGE
- champ `next` du cycle (DEFINED only)

## Vérifié

Readback in-process (`verifyReadback`) : ACTION → relire le body de branche → COMPARE. Pas VERIFIED parce que la fonction n’a pas levé.

## Frontière

DECISION = PENDING_HUMAN. `humanDecide` = Carl.
