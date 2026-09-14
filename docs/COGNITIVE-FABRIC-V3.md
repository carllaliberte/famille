# Cognitive Fabric v3 — Adaptive Collaboration

Les certitudes ont une date de fin.

V3 extends the existing V2 collaboration without replacing it.

The measured rule is:

`A ≠ B → OBJECTION → NOUVELLE TÂCHE → CORRECTION → RÉEXÉCUTION → MESURE → SYNTHÈSE → DÉCISION HUMAINE`

## What is executed

- deterministic in-process workers execute the test cycle;
- disagreement is retained as an objection;
- the objection creates a distinct child task;
- correction is a new execution, not an overwrite of the original return;
- correction produces a measurement and readback verification;
- a mismatched readback stays `UNVERIFIED` and raises `CORRECTION_READBACK_CONFLICT` (`BLOCKING`);
- the parent keeps provenance to the child task;
- synthesis records whether the disagreement was resolved or remains unverified;
- final decision remains `PENDING_HUMAN`, authority `carl`.

## What MESURE means here

`MESURE` on this rail is an in-process counter (`adaptive_correction`, method `deterministic_test`). It is not `consulter` (mesure-protocol). A JSON measurement field on a juge card is absent. MODE stays classique. The hole is named. It is not filled.

The four juge fields (`quelle`, `temoin`, `epsilon > 0`, `horizon` as a calendar day) are not on this cycle. Missing field → classique. `ε=0` is a lie. Preview ≠ receipt. `UNVERIFIED` is not VERT / AMBRE / ROUGE.

## What is not claimed

- no external provider is inferred to be connected or LIVE;
- `LIVE` is never minted by V3;
- no AI can merge or modify `main` through this engine;
- `auto_merge=false` remains explicit;
- no juge card, no `consulter`, no FILE.md update from this engine.

## Invariants

`DEFINED ≠ EXECUTED ≠ VERIFIED ≠ LIVE`

A disagreement therefore becomes work. It does not become an arbitrary winner, a discarded objection, or a false certification.

Repository branch policy is also preserved: implementation branches use the accepted `ai/<name>` namespace when that namespace is required by repository automation.
