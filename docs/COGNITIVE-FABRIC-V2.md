# Cognitive fabric v2 — collaborative

V2 extends the V1 local engine into a measured collaborative cycle.

## What exists

- one task with multiple branches;
- branch execution and return;
- explicit synapse lifecycle: `PROPOSED → DISPATCHED → RECEIVED → WORKING → RETURNED → MEASURED`;
- provenance on branch lifecycle and context transfer;
- measured context transfer between completed branches;
- comparison of returned results;
- disagreement retained as an objection rather than selecting a winner;
- measured correction by re-execution;
- synthesis and `PENDING_HUMAN` decision boundary;
- `auto_merge=false` and `authority=carl`.

## Truth boundary

V2 execution is real **in-process deterministic execution**. It does not prove that Gemini, ChatGPT, Grok, Claude, or another external provider is connected or LIVE merely because those identities are used as test workers.

Therefore:

`EXECUTED ≠ VERIFIED ≠ LIVE`

Provider connectivity requires a separate measured connection proof.

## Architecture

V2 imports and extends the V1 fabric functions. It does not create a second roster, workforce, judge, or merge authority.

The human boundary remains unchanged: autonomous work may discover, compose, dispatch, execute, transfer, compare, measure, object, correct and synthesize; final decision remains human and merge remains Carl-only.

## Cycle

`OBSERVE → UNDERSTAND → DISCOVER → COMPOSE → DELEGATE → WORK → TRANSFER → RECEIVE → COMPARE → MEASURE → OBJECT → CORRECT → SYNTHESIZE → HUMAN DECISION → NEXT`

The next task is defined, not automatically executed.
