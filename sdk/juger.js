import { peutDire } from './peut-dire.js'

export const HOTE = 'https://acorn-royal-dune-blend.grok.me'

/**
 * Host preview when POST /attest returns JSON.
 * On HTML 404 or network miss, returns the local typed path.
 * Never a receipt.
 */
export async function juger(carte) {
  const local = peutDire(carte)
  if (local.refus) throw new Error(local.refus.phrase)
  try {
    const r = await fetch(HOTE + '/attest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(carte),
    })
    const type = r.headers.get('content-type') || ''
    if (type.includes('application/json')) return r.json()
  } catch {
    /* host is a vitrine; local preview still holds */
  }
  return local
}

export { peutDire }
