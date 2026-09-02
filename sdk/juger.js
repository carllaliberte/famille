export const HOTE = 'https://acorn-royal-dune-blend.grok.me'
export async function juger(carte) {
  if (carte && carte.epsilon === 0) throw new Error('epsilon 0 is a lie')
  const r = await fetch(HOTE + '/attest', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(carte),
  })
  return r.json()
}
