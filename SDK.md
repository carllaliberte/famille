# SDK — contrat, pas publié

Local path (usable now, 0 réseau) :

```js
import { peutDire } from './sdk/peut-dire.js'
const r = peutDire({ quelle: 'os', temoin: 'aucun', epsilon: 1e-6, horizon: '2027-12-31' })
// r.quantique === false. Correct. Phone entropy is not quantum.
```

```bash
node sdk/cli.js examples/attest-os.json
```

Mêmes clés que [schema/juge.v0.json](schema/juge.v0.json).
Pas un 2e juge. Pas un sceau. `preview: true` toujours.

`juger(carte)` appelle encore `POST /attest` on the cited host.
Verified 2026-09-03: that route returns HTML 404. The function then
returns the local verdict. Badge / npm wait until the host serves JSON.

Host cited : https://acorn-royal-dune-blend.grok.me
