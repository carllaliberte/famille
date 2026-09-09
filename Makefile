# FAMILLE — native node. No rustc. No python kernel. No photon.
# make test is the gate. Carl squash. Never auto-merge.

.PHONY: all build test inspect pulse telemetry

all: build test

build:
	node --check .github/swarm/kernel.mjs
	node --check .github/swarm/lease.mjs
	node --check .github/swarm/cognition.mjs
	node --check .github/swarm/claim.mjs
	node --check .github/swarm/cadence.mjs
	node --check .github/swarm/workforce.mjs

test:
	npm test

inspect:
	node --input-type=module -e "import { inspectForge } from './.github/swarm/kernel.mjs'; const r = inspectForge('.'); if (!r.ok) { console.error(r.hits); process.exit(1); } console.log('inspectForge ok');"

pulse:
	node .github/swarm/kernel.mjs

telemetry:
	node --input-type=module -e "import { telemetryFeed } from './.github/swarm/kernel.mjs'; console.log(JSON.stringify(telemetryFeed(), null, 2));"
