# ACORN — PR ARCHITECTURE CONTRACT

## Purpose

Acorn is built as an organism, not as a pile of incremental patches.

A pull request is therefore an **architectural branch**: a coherent, durable capability boundary that should be complete enough that a predictable follow-up PR is not required to finish the same capability.

The objective is:

**MINIMUM PR COUNT · MAXIMUM ARCHITECTURAL DENSITY · NO PREDICTABLE FOLLOW-UP DEBT**

This contract applies to every future PR in `carllaliberte/famille`.

## 1. One PR = one durable branch of the tree

A PR may contain multiple files, contracts, tests, workflows and documentation when they belong to one coherent capability.

A PR should normally include, when relevant:

- public/runtime contract;
- implementation;
- integration with existing Acorn fabrics;
- failure and boundary handling;
- tests, including regression and constitution tests;
- observability/evidence;
- workflow/CI validation;
- documentation;
- extension points required by the capability's foreseeable consumers.

Do not create a second PR merely because one of these pieces was omitted from the first.

## 2. Design for the next branches before opening the PR

Before construction:

1. inspect current `main`;
2. inspect related open/stale PRs;
3. recover useful concepts instead of merging stale code blindly;
4. identify dependencies and consumers;
5. define the complete capability boundary;
6. identify what must remain a separate organ, authority boundary, infrastructure concern, or human gate.

The PR is then built from the current main, not from an obsolete parallel branch.

## 3. No micro-PRs

Do not create:

- documentation-only follow-ups when the documentation belongs to the capability;
- test-only follow-ups for tests that should have accompanied the implementation;
- integration-only follow-ups that were foreseeable;
- "fix the previous PR" work caused by incomplete initial design;
- duplicate runtime layers;
- second brains, second meshes, or parallel authority systems;
- temporary `YYYYMMDD` Cortex modules when an existing canonical contract already owns the capability.

A genuine defect discovered after merge remains a legitimate fix. A predictable omission is not.

## 4. The tree principle

Each merged PR must have a clear parent capability and a clear relationship to future branches.

```
ACORN
├── Constitution / Governance
├── Cortex
│   ├── Intelligence adaptation
│   ├── Capability composition
│   ├── Mission conduction
│   ├── State / memory
│   ├── Perception / world state
│   ├── Action / outcome
│   └── Continuous cognition / optimization
├── Organ 2
├── Organ 3
└── ...
```

The exact future organs are not prescribed here. The architecture must remain open to them without rewriting the Cortex trunk.

## 5. Definition of Done for a PR

A capability PR is complete only when the relevant dimensions have been addressed:

| Dimension | Requirement |
|---|---|
| Contract | Stable contract and explicit state model |
| Runtime | Actual implementation, not only a declaration |
| Integration | Uses existing canonical fabrics rather than duplicating them |
| Boundaries | Authority, Breaker, external effects and secrets explicitly governed |
| Evidence | Provenance and dated evidence where claims depend on observation |
| Tests | Happy path, failure path, regression and constitutional boundaries |
| CI | Relevant workflow/check is present when appropriate |
| Documentation | Contract, limits, extension model and truth boundaries documented |
| Extensibility | Foreseeable consumers do not require a second foundational PR |
| Reality | No `DEFINED`, `TESTED`, `MEASURED` or `LIVE` claim is promoted without its corresponding trace |

Not every PR needs every row literally, but every omitted dimension must be intentionally irrelevant.

## 6. Completion beats chronology

PR numbers and historical order do not define the architecture.

When several old PRs describe overlapping capabilities, their useful ideas must be consolidated into the current architectural branch rather than merged sequentially.

An old PR is source material until its code is proven compatible with current `main`.

## 7. Cortex closure rule

The Cortex is not considered complete because a list of Cortex modules exists.

It is complete when its canonical trunk can coherently express the required cognitive cycle without requiring another foreseeable foundational layer:

**PERCEIVE → CONTEXTUALIZE → REMEMBER → DISCOVER → COMPOSE → PLAN → AUTHORIZE → ACT → OBSERVE → MEASURE → VERIFY → LEARN → OPTIMIZE → REUSE → REOBSERVE**

The implementation may delegate to specialized fabrics, but the Cortex must have one coherent orchestration model.

After Cortex closure, work moves to the next organ rather than reopening Cortex for predictable missing foundations.

## 8. Current Cortex audit result — 2026-09-19

Current `main` contains these canonical Cortex foundations:

- Intelligence Adapter / Capability Routing;
- Adaptive Capability Composition;
- Mission Conductor;
- State & Memory Fabric;
- Action & Outcome Fabric;
- Universal Outcome Learning Fabric;
- Effect Governor;
- Real-World Execution Fabric.

The audit also inspected stale Cortex proposals #1038, #1039, #1040, #1041, #1042, #1048 and #1049.

Those proposals contain useful architectural ideas, but their current implementations are not suitable as merge targets: several are minimal placeholder contracts, and the older Cortex operating/signal-loop branches predate the current canonical Cortex chain.

Their concepts should be **reconstructed into the current Cortex architecture where still required**, not merged as parallel layers.

## 9. Human sovereignty remains invariant

No PR in this contract changes:

- `CAPABILITY ≠ AUTHORITY`;
- Carl = human merge authority;
- no automatic merge;
- no automatic consequential authorization;
- no automatic spending, signing, custody or contracting;
- no Breaker bypass;
- no hidden learning;
- no fabricated LIVE/READY/VERIFIED claims.

Optimization may change routing, composition, capability candidates and reusable patterns.

It must not silently change authority.

## 10. Rule for the next organ

The next organ may begin only after the Cortex has been audited against this contract and its remaining foundational capabilities have been consolidated into the minimum coherent PR set.

The goal is not a predetermined PR count.

The goal is a finished branch of the organism.

**MINIMUM PRs. MAXIMUM INFORMATION. MAXIMUM DURABILITY.**
