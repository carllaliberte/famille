# Acorn continuous runtime

The Codex worker is a bounded runtime, not a single immortal GitHub job.

Each cycle may run up to 300 minutes on a GitHub-hosted runner. Before the runner exits, the workflow dispatches the next bounded cycle with `GITHUB_TOKEN` through `workflow_dispatch`, which GitHub explicitly allows to create a new workflow run.

Continuity rules:

- Global Breaker remains sovereign and untouched by the worker.
- Carl remains the human authority and merge authority.
- `auto_merge=false` and `live=false` remain invariant.
- `HUMAN_REQUIRED` and `WAIT_HUMAN_MERGE` stop the chain until a human event or merge creates a new legitimate trigger.
- Every cycle preserves worker evidence and memory.
- Recovery policy remains the floor for construction and bug repair.
- A bounded cycle ending is a handoff, not an extinction of the cognitive loop.

Missing capability: search existing modules → reuse → otherwise `BUILD_TOOL` (specify, build, test, keep, reuse). Never stop because a tool is absent if it can be built. `scripts/tool-resolve.mjs` executes that protocol. File presence is DECLARED, not LIVE.

BUILD is a replaceable resource (`scripts/build-presence.mjs`). When `ACORN_BUILD_AVAILABLE=false`, cognition, the Codex worker, self-heal and the autonomous runtime continue. `/grok-build` remains a remaining dependency, not an authority.

Worker failures enter `scripts/self-heal.mjs` from the autonomous runtime: transient → retry; environment → restart; code/test → repair; secret/payment/merge → HOLD_HUMAN. Never auto-merge. LIVE VERIFIED = Carl only.


This is intentionally a continuous chain of bounded executions rather than a fake claim of an infinite single process.
