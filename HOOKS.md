# Git hooks — Mac once

```bash
cd famille
chmod +x scripts/install-hooks.sh
./scripts/install-hooks.sh
```

Sets `core.hooksPath` to `.githooks`.

| Hook | Role |
|---|---|
| pre-push | branch name `ville/<quartier>-*` |
| pre-commit | no `data/` / `quantum.db` |
| commit-msg | title hint |

Phone cannot install hooks. GitHub workflow `branche.yml` is the server filet.
unforge stays `bloc/*` — separate repo.
