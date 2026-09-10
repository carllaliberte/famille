import { peutDire } from './peut-dire.js'

/** Canal JSON chemin A. Vitrine grok.me n'est pas ce canal. */
export const HOTE = 'https://acorn-juge.laliberte22.workers.dev'

function qs(carte) {
  const p = new URLSearchParams()
  if (carte.quelle != null) p.set('quelle', String(carte.quelle))
  if (carte.temoin != null) p.set('temoin', String(carte.temoin))
  if (carte.epsilon != null) p.set('epsilon', String(carte.epsilon))
  if (carte.horizon != null) p.set('horizon', String(carte.horizon))
  if (carte.transcript != null) p.set('transcript', String(carte.transcript))
  if (carte.appareil != null) p.set('appareil', String(carte.appareil))
  return p.toString()
}

/**
 * Host preview when GET /juge returns JSON.
 * On miss: local peutDire. Never a receipt. Never QUANTUM.
 */
export async function juger(carte, opts = {}) {
  const local = peutDire(carte, { today: opts.today })
  if (local.refus) throw new Error(local.refus.phrase)
  const fetchImpl = opts.fetchImpl || fetch
  try {
    const r = await fetchImpl(HOTE + '/juge?' + qs(carte), { method: 'GET' })
    const type = r.headers.get('content-type') || ''
    if (type.includes('application/json')) {
      const remote = await r.json()
      return {
        ...local,
        remote,
        preview: true,
        receipt: false,
        host: HOTE,
        http: r.status,
      }
    }
  } catch {
    /* host miss — local preview still holds */
  }
  return { ...local, preview: true, receipt: false, host: 'local' }
}

export { peutDire }
