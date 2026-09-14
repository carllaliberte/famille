# Cognitive Fabric v3 — Adaptive Collaboration

V3 extends the existing V2 collaboration without replacing it.

The measured rule is:

`A ≠ B → OBJECTION → NOUVELLE TÂCHE → CORRECTION → RÉEXÉCUTION → MESURE → SYNTHÈSE → DÉCISION HUMAINE`

## What is executed

- deterministic in-process workers execute the test cycle;
- disagreement is retained as an objection;
- the objection creates a distinct child task;
- correction is a new execution, not an overwrite of the original return;
- correction produces a measurement and readback verification;
- the parent keeps provenance to the child task;
- synthesis records whether the disagreement was resolved or remains unverified;
- final decision remains `PENDING_HUMAN`, authority `carl`.

## What is not claimed

- no external provider is inferred to be connected or LIVE;
- `LIVE` is never minted by V3;
- no AI can merge or modify `main` through this engine;
- `auto_merge=false` remains explicit.

## Invariants

`DEFINED ≠ EXECUTED ≠ VERIFIED ≠ LIVE`

A disagreement therefore becomes work. It does not become an arbitrary winner, a discarded objection, or a false certification.
