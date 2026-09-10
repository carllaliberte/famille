import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { HOTE, juger, peutDire } from '../sdk/juger.js'

describe('juger — host preview wrapper', () => {
  it('cites only the frozen host', () => {
    assert.equal(HOTE, 'https://acorn-juge.laliberte22.workers.dev')
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

  it('calls GET /juge on the canal, never POST /attest', async () => {
    const calls = []
    const fetchImpl = async (url, init = {}) => {
      calls.push({ url: String(url), method: init.method || 'GET' })
      return new Response(JSON.stringify({ preview: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    const r = await juger(
      { quelle: 'os', temoin: 'aucun', epsilon: 1e-6, horizon: '2027-12-31' },
      { fetchImpl },
    )
    assert.equal(calls.length, 1)
    assert.match(calls[0].url, /^https:\/\/acorn-juge\.laliberte22\.workers\.dev\/juge\?/)
    assert.equal(calls[0].method, 'GET')
    assert.doesNotMatch(calls[0].url, /\/attest/)
    assert.equal(r.preview, true)
    assert.equal(r.receipt, false)
    assert.equal(r.host, HOTE)
    assert.equal(r.http, 200)
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
