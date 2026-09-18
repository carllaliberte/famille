# ACORN universal infrastructure

Coordinator of **relations** between existing primitives. Not a second
Cortex, runtime, market, connector system, or economic engine.

```
IDENTITY · ORGANIZATION · CAPABILITY · INTELLIGENCE · RESOURCE
DATA · TOOL · CONNECTOR · TASK · PROJECT · GRAPH · EXECUTION
EVENT · MEMORY · EVIDENCE · MEASUREMENT · POLICY · AUTHORITY
DECISION · OFFER · ORDER · ECONOMIC_EVENT · RIGHT · CONTRACT
```

Stripe is an `ECONOMIC_RAIL` implementation. Grok is an intelligence
provider implementation. A machine is a capability provider.
`CAPABILITY ≠ AUTHORITY`. `UNKNOWN` is first-class.

## What this adds

- A capability graph with typed edges (`requires`, `produces`, `uses`,
  `provided_by`, `verified_by`, `measured_by`, `priced_as`, `executed_by`)
  and cycle detection.
- Unknown admission for intelligence, rail, machine, market, protocol,
  organism — without modifying the core.
- Composition over the existing execution graph (not a prompt).
- Event envelope with correlation / causation / previous / next state.
- Trust explanation that refuses invented LIVE.
- Memory classes where a hypothesis never becomes a fact.
- Federation over the existing inter-organism contracts, with tenant
  isolation that can refuse.
- Self-diagnosis that cannot apply protected changes.
- Architectural questions as executable tests.
- An honest truth matrix. Every domain is `verified: false`, `live: false`.

## What this does not add

A 17th decorative fabric. `operateProblem` and `createCommercialProject`
remain the customer coordinators. This module is the relation layer they
can call.

## HTTP

- `GET /api/v1/infrastructure` constitution, primitives, truth matrix,
  architectural answers, implemented-now, not-yet-implemented.
- `POST /api/v1/infrastructure/diagnose` gap + impact + proposed change +
  risk + test plan. `apply: false`.
- `POST /api/v1/infrastructure/admit` unknown provider. Never authorized.

## HUMAN HOLD

Merge, secrets, payments, physical execution, live claims, and any
increase in authority remain Carl.

`RENDER_EXTERNAL_DEPLOYMENT = NOT_MEASURED`  
`EXTERNAL_DEPLOYMENT_EVIDENCE = NOT_OBSERVED`
