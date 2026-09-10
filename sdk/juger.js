import { peutDire } from './peut-dire.js'

/** JSON preview canal. Not a receipt. Not the HTML vitrine. */
export const HOTE = 'https://acorn-juge.laliberte22.workers.dev'

/** HTML vitrine only. GET /juge here is 404 HTML. Do not POST /attest here. */
export const VITRINE = 'https://acorn-royal-dune-blend.grok.me'

function queryFrom(carte) {
  const p = new URLSearchParams()
  if (!carte || typeof carte !== 'object') return p
  if (carte.quelle != null && carte.quelle !== '') p.set('quelle', String(carte.quelle))
  if (carte.temoin != null && carte.temoin !== '') p.set('temoin', String(carte.temoin))
  if (carte.epsilon != null && carte.epsilon !== '') p.set('epsilon', String(carte.epsilon))
  if (carte.horizon != null && carte.horizon !== '') p.set('horizon', String(carte.horizon))
  if (carte.transcript != null && carte.transcript !== '') p.set('transcript', String(carte.transcript))
  return p
}

/**
 * Typed local path, then GET /juge on the public canal.
 * A 200 JSON is still preview. Never a receipt. Never QUANTUM.
 * HTML or network miss → local preview only. Named, not silent host truth.
 */
export async function juger(carte, opts = {}) {
  const local = peutDire(carte)
  if (local.refus) throw new Error(local.refus.phrase)
  const host = opts.host || HOTE
  const url = `${host}/juge?${queryFrom(carte)}`
  try {
    const r = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
    })
    const type = r.headers.get('content-type') || ''
    if (type.includes('application/json')) {
      const canal = await r.json()
      return {
        ...local,
        canal,
        preview: true,
        receipt: false,
      }
    }
  } catch {
    /* canal miss — local preview still holds */
  }
  return {
    ...local,
    canal: null,
    preview: true,
    receipt: false,
  }
}

export { peutDire }
