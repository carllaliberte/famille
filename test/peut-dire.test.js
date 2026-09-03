import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { createRequire } from 'node:module'
import { peutDire } from '../sdk/peut-dire.js'

const require = createRequire(import.meta.url)
const TODAY = '2026-09-03'
const osExample = JSON.parse(readFileSync(new URL('../examples/attest-os.json', import.meta.url), 'utf8'))
const interop = require('../map/interop.v0.json')
const schema = require('../schema/juge.v0.json')

function dire(carte) {
  return peutDire(carte, { today: TODAY })
}

describe('peutDire — typed-evidence path', () => {
  it('reads the published os example as classical with manques', () => {
    const r = dire(osExample)
    assert.equal(r.quantique, false)
    assert.equal(r.mode, 'classique')
    assert.equal(r.preview, true)
    assert.deepEqual(r.manques, ['epsilon', 'horizon'])
    assert.equal(r.refus, null)
    assert.match(r.phrase, /Classique/)
  })

  it('refuses epsilon 0 as a lie', () => {
    const r = dire({
      quelle: 'os',
      temoin: 'aucun',
      epsilon: 0,
      horizon: '2027-12-31',
    })
    assert.equal(r.quantique, false)
    assert.equal(r.refus.code, 'lie')
    assert.equal(r.phrase, 'Error margin zero is a lie')
  })

  it('refuses iid and none as epsilon', () => {
    for (const epsilon of ['iid', 'none']) {
      const r = dire({
        quelle: 'qrng',
        temoin: 'stat',
        epsilon,
        horizon: '2027-12-31',
      })
      assert.equal(r.refus.code, 'lie', epsilon)
    }
  })

  it('refuses UFHY1 as a horizon date', () => {
    const r = dire({
      quelle: 'qrng',
      temoin: 'stat',
      epsilon: 1e-6,
      horizon: 'UFHY1',
    })
    assert.equal(r.refus.code, 'horizon')
    assert.match(r.phrase, /calendar/)
  })

  it('refuses a past horizon', () => {
    const r = dire({
      quelle: 'qrng',
      temoin: 'stat',
      epsilon: 1e-6,
      horizon: '2020-01-01',
    })
    assert.equal(r.refus.code, 'horizon')
  })

  it('refuses di without a transcript', () => {
    const r = dire({
      quelle: 'qkd',
      temoin: 'di',
      epsilon: 1e-6,
      horizon: '2027-12-31',
    })
    assert.equal(r.refus.code, 'transcript')
  })

  it('refuses di + simule', () => {
    const r = dire({
      quelle: 'qkd',
      temoin: 'di',
      epsilon: 1e-6,
      horizon: '2027-12-31',
      transcript: 'named-run',
      simule: true,
    })
    assert.equal(r.refus.code, 'simule')
    assert.equal(r.quantique, false)
  })

  it('refuses unknown quelle', () => {
    const r = dire({
      quelle: 'webcam',
      temoin: 'stat',
      epsilon: 1e-6,
      horizon: '2027-12-31',
    })
    assert.equal(r.refus.code, 'cards')
  })

  it('keeps os classical even when the other bounds hold', () => {
    const r = dire({
      quelle: 'os',
      temoin: 'stat',
      epsilon: 1e-6,
      horizon: '2027-12-31',
    })
    assert.equal(r.quantique, false)
    assert.equal(r.mode, 'classique')
    assert.equal(r.refus, null)
    assert.match(r.phrase, /Classique/)
  })

  it('keeps qkd without di classical', () => {
    const r = dire({
      quelle: 'qkd',
      temoin: 'stat',
      epsilon: 1e-6,
      horizon: '2027-12-31',
    })
    assert.equal(r.quantique, false)
    assert.ok(r.manques.includes('temoin'))
  })

  it('allows a qrng preview when the four cards hold', () => {
    const r = dire({
      quelle: 'qrng',
      temoin: 'stat',
      epsilon: 1e-6,
      horizon: '2027-12-31',
    })
    assert.equal(r.quantique, true)
    assert.equal(r.mode, 'quantique')
    assert.deepEqual(r.manques, [])
    assert.equal(r.refus, null)
    assert.equal(r.preview, true)
    assert.match(r.phrase, /not a receipt/)
  })

  it('allows qkd preview only with di + transcript', () => {
    const r = dire({
      quelle: 'qkd',
      temoin: 'di',
      epsilon: '1e-6',
      horizon: '2027-12-31',
      transcript: 'named-run',
    })
    assert.equal(r.quantique, true)
    assert.equal(r.preview, true)
  })

  it('treats a missing card as classical, not a lie', () => {
    const r = dire({ quelle: 'qrng', temoin: 'stat' })
    assert.equal(r.quantique, false)
    assert.equal(r.refus, null)
    assert.ok(r.manques.includes('epsilon'))
    assert.ok(r.manques.includes('horizon'))
  })
})

describe('interop map', () => {
  it('lists the sibling hubs without absorbing them', () => {
    assert.equal(interop.role, 'map')
    assert.equal(interop.host, 'https://acorn-royal-dune-blend.grok.me')
    assert.equal(interop.contract, 'schema/juge.v0.json')
    const ids = interop.nodes.map((n) => n.id)
    for (const id of [
      'famille',
      'unforge-check',
      'unforge-press',
      'unforge-trail',
      'unforge-retract',
      'acorn-juge',
      'garde',
      'quelle',
      'temoin',
      'epsilon',
      'horizon',
      'mode',
      'formal-layer',
    ]) {
      assert.ok(ids.includes(id), id)
    }
    assert.ok(interop.out_of_map.includes('QUANTUM'))
    assert.ok(interop.out_of_map.includes('estoc-proto'))
  })

  it('keeps the juge schema on the four required keys', () => {
    assert.deepEqual(schema.required, ['quelle', 'temoin', 'epsilon', 'horizon'])
    assert.deepEqual(schema.properties.quelle.enum, ['os', 'qrng', 'qkd'])
    assert.deepEqual(schema.properties.temoin.enum, ['aucun', 'stat', 'fabricant', 'di'])
  })
})
