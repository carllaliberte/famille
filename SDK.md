# SDK — contrat, pas publié

```js
import { attest } from '@famille/attest'
const r = await attest({ quelle: 'os', temoin: 'aucun', epsilon: 1e-6, horizon: '2027-12-31' })
document.body.insertAdjacentHTML('beforeend', r.svg)
```

`os` → `quantique: false`. Correct.

Mêmes clés que [schema/juge.v0.json](schema/juge.v0.json).
Pas de npm tant que POST /attest preview n'existe pas sur acorn.
Pas un 2e juge.

## 3 lignes

1. Install
2. Attest
3. Badge
