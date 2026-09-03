import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { HOTE, juger, peutDire } from '../sdk/juger.js'

describe('juger — host preview wrapper', () => {
  it('cites only the frozen host', () => {
    assert.equal(HOTE, 'https://acorn-royal-dune-blend.grok.me')
  })

  it('throws on epsilon 0 without calling the host', async () => {
    await assert.rejects(
      () => juger({ quelle: 'os', temoin: 'aucun', epsilon: 0, horizon: '2027-12-31' }),
      /epsilon 0 is a lie|Error margin zero is a lie/,
    )
  })

  it('re-exports the local consumer', () => {
    const r = peutDire({ quelle: 'os', temoin: 'aucun', epsilon: null, horizon: '' })
    assert.equal(r.quantique, false)
    assert.equal(r.preview, true)
  })

  it('falls back to local preview when the host is not JSON', async () => {
    const old = globalThis.fetch
    globalThis.fetch = async () =>
      new Response('<p>Not Found</p>', {
        status: 404,
        headers: { 'content-type': 'text/html' },
      })
    try {
      const r = await juger({
        quelle: 'os',
        temoin: 'aucun',
        epsilon: 1e-6,
        horizon: '2027-12-31',
      })
      assert.equal(r.quantique, false)
      assert.equal(r.mode, 'classique')
      assert.equal(r.preview, true)
    } finally {
      globalThis.fetch = old
    }
  })
})
